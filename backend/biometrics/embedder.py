import os

import cv2
import numpy as np

from .utils import ModelInitError

_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
SFACE_PATH = os.path.join(_MODEL_DIR, "face_recognition_sface_2021dec.onnx")
EMBEDDING_DIM = 128

# Standard ArcFace/SFace alignment template (112x112, 5-point warping).
ARC_FACE_REF = np.float32(
    [
        [38.2946, 51.6963],
        [73.5318, 51.5014],
        [56.0252, 71.7366],
        [41.5493, 92.3655],
        [70.7299, 92.2041],
    ]
)


class SFaceEmbedder:
    """SFace (OpenCV Zoo, Apache-2.0) face embedding model.

    Pipeline: crop+align on the 5 YuNet landmarks, resize to 112x112, run the
    raw ONNX graph via cv2.dnn, L2-normalize the 128-d output. Embeddings are
    compared with cosine similarity. This is the legally-clean stand-in for the
    InsightFace ArcFace weights (which are non-commercial-research-only).
    """

    def __init__(self, model_path: str = SFACE_PATH):
        if not os.path.exists(model_path):
            raise ModelInitError("SFace recognition model not found: %s" % model_path)
        try:
            self._aligner = cv2.FaceRecognizerSF_create(model_path, "", cv2.FaceRecognizerSF_FR_COSINE)
            self._net = cv2.dnn.readNetFromONNX(model_path)
        except Exception as exc:
            # cv2 5.x FaceRecognizerSF can fail on some builds; raw dnn suffices
            # for embedding + our own cosine (which the broken wrapper lacks).
            try:
                self._net = cv2.dnn.readNetFromONNX(model_path)
                self._aligner = None
            except Exception as exc2:
                raise ModelInitError("Failed to initialize SFace: %s" % exc2) from exc
        self.model_path = model_path

    @staticmethod
    def align_landmarks_112(src_kps: np.ndarray, rgb: np.ndarray) -> np.ndarray:
        """Affine-warp the detected 5 landmarks to the canonical 112x112 face template.

        The embedder expects an aligned crop; this is the alignment step that
        normalizes scale, rotation and translation of the face before embedding.
        """
        if src_kps is None or len(src_kps) != 5:
            raise ValueError("Exactly 5 landmarks are required for alignment.")
        # YuNet landmark order is documented as right-eye, left-eye, nose,
        # right-mouth, left-mouth. Normalize to the (left-eye, right-eye, nose,
        # left-mouth, right-mouth) template order used by ArcFace/SFace.
        ordered = np.float32([src_kps[1], src_kps[0], src_kps[2], src_kps[4], src_kps[3]])
        M, _ = cv2.estimateAffinePartial2D(ordered, ARC_FACE_REF, method=cv2.LMEDS)
        if M is None:
            M, _ = cv2.estimateAffinePartial2D(ordered, ARC_FACE_REF)
        return cv2.warpAffine(rgb, M, (112, 112), borderValue=(0, 0, 0))

    def embed(self, rgb: np.ndarray, face: dict) -> np.ndarray:
        """Return a normalized 128-d embedding for a detected face."""
        raw = face.get("row")
        if self._aligner is not None and raw is not None:
            aligned = self._aligner.alignCrop(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), raw)
        else:
            aligned = self.align_landmarks_112(face["kps"], rgb)
        blob = cv2.dnn.blobFromImage(
            aligned, scalefactor=1.0 / 128.0, size=(112, 112), mean=(127.5, 127.5, 127.5), swapRB=True
        )
        self._net.setInput(blob)
        emb = self._net.forward()
        v = np.asarray(emb).reshape(-1).astype(np.float64)
        norm = float(np.linalg.norm(v))
        return v / norm if norm > 1e-12 else None