import os

import cv2
import numpy as np

from .config import BIOMETRIC_DET_CONFIDENCE
from .utils import ModelInitError

_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
YUNET_PATH = os.path.join(_MODEL_DIR, "face_detection_yunet_2023mar.onnx")

_MIN_IMG = 48


class YuNetDetector:
    """SCRFD-equivalent CNN face detector.

    YuNet (OpenCV Zoo, Apache-2.0) is used because the InsightFace SCRFD
    pretrained weights are non-commercial-research-only. Like SCRFD it is a
    single-shot CNN detector returning a bounding box, 5 landmarks and a
    confidence score (plus face alignment information).
    """

    def __init__(self, model_path: str = YUNET_PATH, confidence: float = None):
        if not os.path.exists(model_path):
            raise ModelInitError("YuNet face detection model not found: %s" % model_path)
        if not hasattr(cv2, "FaceDetectorYN_create"):
            raise ModelInitError("This OpenCV build (%s) has no FaceDetectorYN support." % (getattr(cv2, "__version__", "?")))
        confidence = confidence if confidence is not None else BIOMETRIC_DET_CONFIDENCE
        try:
            self._det = cv2.FaceDetectorYN_create(model_path, "", (320, 320), confidence, 0.3, 5000)
        except Exception as exc:
            raise ModelInitError("Failed to initialize YuNet: %s" % exc) from exc
        self.model_path = model_path

    def detect(self, rgb: np.ndarray) -> list:
        """Detect all faces. Returns a list of dicts with bbox, raw YuNet row,
        landmarks (5, 2) and confidence score.
        """
        if rgb is None or rgb.ndim != 3 or min(rgb.shape[:2]) < _MIN_IMG:
            return []
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        self._det.setInputSize((bgr.shape[1], bgr.shape[0]))
        _, faces = self._det.detect(bgr)
        if faces is None:
            return []
        out = []
        for row in faces:
            row = np.asarray(row, dtype=np.float64)
            x, y, w, h = (float(row[0]), float(row[1]), float(row[2]), float(row[3]))
            kps = row[4:14].reshape(5, 2)
            score = float(row[14])
            out.append({"bbox": {"x": x, "y": y, "width": w, "height": h}, "row": row, "kps": kps, "score": score})
        return out