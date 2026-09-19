import os
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple, Optional

## Face detectors, newest-first. cv2 5.0 dropped CascadeClassifier, so YuNet
## is the primary detector; Haar cascade still serves cv2 4.x installs. Both
## degrade to skin-chrominance geometry. All failures are silent by design.
_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
_YUNET_PATH = os.path.join(_MODEL_DIR, "face_detection_yunet_2023mar.onnx")
_SFACE_PATH = os.path.join(_MODEL_DIR, "face_recognition_sface_2021dec.onnx")

# Safely initialize cascade classifier if available in current cv2 build
face_cascade = None
try:
    cv2_data = getattr(cv2, 'data', None)
    cascade_cls = getattr(cv2, 'CascadeClassifier', None)
    if cv2_data and cascade_cls and hasattr(cv2_data, 'haarcascades'):
        face_cascade = cascade_cls(cv2_data.haarcascades + 'haarcascade_frontalface_default.xml')
except Exception:
    face_cascade = None

yunet = None
try:
    if hasattr(cv2, 'FaceDetectorYN_create') and os.path.exists(_YUNET_PATH):
        yunet = cv2.FaceDetectorYN_create(_YUNET_PATH, "", (320, 320), 0.5, 0.3, 5000)
except Exception:
    yunet = None

sface = None
sface_align = None
try:
    # cv2 5.0's FaceRecognizerSF wrapper is broken (match() returns distance 1.0
    # for identical vectors; feature() drops state). Use alignCrop (deterministic)
    # for alignment and run the embedding through raw cv2.dnn instead.
    if hasattr(cv2, 'FaceRecognizerSF_create') and os.path.exists(_SFACE_PATH):
        sface_align = cv2.FaceRecognizerSF_create(_SFACE_PATH, "", cv2.FaceRecognizerSF_FR_COSINE)
        sface = cv2.dnn.readNetFromONNX(_SFACE_PATH)
except Exception:
    sface = None
    sface_align = None

def detect_face_by_skin_and_geometry(image_np: np.ndarray) -> Optional[Dict[str, Any]]:
    """Geometry & skin chrominance based face detector fallback"""
    h, w = image_np.shape[:2]
    # Check passport portrait zone (left 45% or center)
    sample_roi = image_np[int(h*0.1):int(h*0.8), 0:int(w*0.5)]
    rh, rw = sample_roi.shape[:2]
    
    # Convert to YCrCb
    if len(sample_roi.shape) == 3:
        ycrcb = cv2.cvtColor(sample_roi, cv2.COLOR_RGB2YCrCb)
        # Skin color range in YCrCb: Cr in [133, 173], Cb in [77, 127]
        lower = np.array([0, 133, 77], dtype=np.uint8)
        upper = np.array([255, 173, 127], dtype=np.uint8)
        mask = cv2.inRange(ycrcb, lower, upper)
        
        # Morphological closing
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            # Find largest skin contour
            c = max(contours, key=cv2.contourArea)
            if cv2.contourArea(c) > (rh * rw * 0.05):
                bx, by, bw, bh = cv2.boundingRect(c)
                actual_x = bx
                actual_y = int(h*0.1) + by
                crop = image_np[actual_y:actual_y+bh, actual_x:actual_x+bw]
                return {
                    "bbox": {"x": int(actual_x), "y": int(actual_y), "width": int(bw), "height": int(bh)},
                    "crop_rgb": crop
                }
    
    # Honest: if no reliable face region found, report no face.
    # Never return a hardcoded passport-portrait bbox for arbitrary imagery.
    return None

def detect_face(image_np: np.ndarray) -> Optional[Dict[str, Any]]:
    """Detect primary face in image and return crop and bounding box"""
    if yunet is not None and len(image_np.shape) == 3:
        try:
            bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            yunet.setInputSize((bgr.shape[1], bgr.shape[0]))
            _, faces = yunet.detect(bgr)
            if faces is not None and len(faces) > 0:
                f = faces[0]
                x, y, w, h = (int(v) for v in f[:4])
                pad = int(0.12 * w)
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(image_np.shape[1], x + w + pad)
                y2 = min(image_np.shape[0], y + h + pad)
                crop = image_np[y1:y2, x1:x2]
                return {
                    "bbox": {"x": x, "y": y, "width": w, "height": h},
                    "crop_rgb": crop,
                    "yunet_row": faces[0]
                }
        except Exception:
            pass

    if len(image_np.shape) == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    else:
        gray = image_np.copy()
        
    if face_cascade and not face_cascade.empty():
        try:
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=4, minSize=(50, 50))
            if len(faces) > 0:
                faces_sorted = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
                x, y, w, h = faces_sorted[0]
                pad = int(0.12 * w)
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(image_np.shape[1], x + w + pad)
                y2 = min(image_np.shape[0], y + h + pad)
                crop = image_np[y1:y2, x1:x2]
                return {
                    "bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                    "crop_rgb": crop
                }
        except Exception:
            pass
            
    return detect_face_by_skin_and_geometry(image_np)

FEATURE_DIM = 1280  # 8*8*16 hist bins + 16*16 sobel magnitudes

def compute_face_feature_vector(face_crop: np.ndarray) -> np.ndarray:
    """Compute normalized multiscale spatial histogram & gradient feature descriptor"""
    if face_crop is None or face_crop.size == 0:
        return np.zeros(FEATURE_DIM, dtype=np.float32)
        
    resized = cv2.resize(face_crop, (128, 128))
    if len(resized.shape) == 3:
        gray = cv2.cvtColor(resized, cv2.COLOR_RGB2GRAY)
    else:
        gray = resized
        
    eq_gray = cv2.equalizeHist(gray)
    
    blocks_h, blocks_w = 8, 8
    bh, bw = 128 // blocks_h, 128 // blocks_w
    features = []
    
    for r in range(blocks_h):
        for c in range(blocks_w):
            cell = eq_gray[r*bh:(r+1)*bh, c*bw:(c+1)*bw]
            hist = cv2.calcHist([cell], [0], None, [16], [0, 256])
            features.extend(hist.flatten())
            
    sobel_x = cv2.Sobel(eq_gray, cv2.CV_32F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(eq_gray, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(sobel_x**2 + sobel_y**2)
    mag_norm = cv2.resize(mag, (16, 16)).flatten()
    features.extend(mag_norm)
    
    vec = np.array(features, dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec

from biometrics.passive_pad import passive_pad_score

def check_liveness_and_anti_spoofing(image_np: np.ndarray) -> Dict[str, Any]:
    """Presentation Attack Detection (PAD) — shared passive scorer."""
    return passive_pad_score(image_np)

def _sface_embedding(image_np: np.ndarray, face: Dict[str, Any]) -> Optional[np.ndarray]:
    """Extract SFace 128-d embedding from a YuNet-detected face. Needs the raw
    source image (for alignCrop) plus the full detection row.

    cv2 5.0's FaceRecognizerSF wrapper is broken, so alignment comes from the
    wrapper (deterministic) but the embedding is a raw cv2.dnn forward, and
    similarity is computed as a plain cosine. ponytail: raw-dnn SFace embeddings
    are L2 only via the model's own ops; if discrimination drifts on real faces,
    switch to onnxruntime (deterministic, faster)."""
    if sface is None or sface_align is None or "yunet_row" not in face:
        return None
    try:
        bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        aligned = sface_align.alignCrop(bgr, face["yunet_row"])
        blob = cv2.dnn.blobFromImage(aligned, scalefactor=1.0 / 128.0,
                                     size=(112, 112), mean=(127.5, 127.5, 127.5), swapRB=True)
        sface.setInput(blob)
        emb = sface.forward()
        v = np.asarray(emb).reshape(-1).astype(np.float64)
        norm = np.linalg.norm(v)
        return v / norm if norm > 1e-12 else None
    except Exception:
        return None

def verify_faces(doc_image_np: np.ndarray, live_image_np: np.ndarray) -> Dict[str, Any]:
    """Module 4: Face Verification & Liveness Matching

    Primary: SFace neural embedder for real identity comparison.
    Fallback: multiscale histogram descriptor when SFace/YuNet unavailable.
    """
    doc_face = detect_face(doc_image_np)
    live_face = detect_face(live_image_np)

    if not doc_face or not live_face:
        return {
            "match_score": 0.0,
            "is_matched": False,
            "confidence": "UNAVAILABLE",
            "doc_face_detected": bool(doc_face),
            "live_face_detected": bool(live_face),
            "liveness": {"liveness_score": 0.0, "is_live": False, "moire_artifact_detected": False, "sharpness_index": 0.0, "note": "Face detection failed — liveness check skipped"},
        }

    emb1 = _sface_embedding(doc_image_np, doc_face)
    emb2 = _sface_embedding(live_image_np, live_face)
    if emb1 is not None and emb2 is not None:
        try:
            cosine_sim = float(np.dot(emb1, emb2))
            similarity = max(0.0, min(100.0, cosine_sim * 100.0))
            match_score = float(round(similarity, 1))
            is_matched = match_score >= 65.0
            liveness_result = check_liveness_and_anti_spoofing(live_face["crop_rgb"])
            return {
                "match_score": match_score,
                "is_matched": is_matched,
                "doc_face_bbox": doc_face["bbox"],
                "live_face_bbox": live_face["bbox"],
                "doc_face_detected": True,
                "live_face_detected": True,
                "liveness": liveness_result,
                "embedder": "sface",
                "confidence": "HIGH" if match_score > 80 else ("MODERATE" if is_matched else "MISMATCH")
            }
        except Exception:
            pass

    vec1 = compute_face_feature_vector(doc_face["crop_rgb"])
    vec2 = compute_face_feature_vector(live_face["crop_rgb"])

    dot_prod = float(np.dot(vec1, vec2))
    similarity = max(0.0, min(100.0, (dot_prod * 0.5 + 0.5) * 100.0))
    match_score = float(round(similarity, 1))
    is_matched = match_score >= 65.0

    liveness_result = check_liveness_and_anti_spoofing(live_face["crop_rgb"])

    return {
        "match_score": match_score,
        "is_matched": is_matched,
        "doc_face_bbox": doc_face["bbox"],
        "live_face_bbox": live_face["bbox"],
        "doc_face_detected": True,
        "live_face_detected": True,
        "liveness": liveness_result,
        "embedder": "histogram",
        "confidence": "HIGH" if match_score > 80 else ("MODERATE" if is_matched else "MISMATCH")
    }
