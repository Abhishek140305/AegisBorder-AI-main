import cv2
import numpy as np

from .config import (
    BIOMETRIC_BRIGHTNESS_MAX,
    BIOMETRIC_BRIGHTNESS_MIN,
    BIOMETRIC_CONTRAST_MIN,
    BIOMETRIC_DOC_MIN_FACE_RATIO,
    BIOMETRIC_LIVE_MIN_FACE_RATIO,
    BIOMETRIC_MIN_BLUR,
)
from .pose import estimate_pose, pose_acceptable


class FaceQuality:
    """Configurable image-quality gate for a single detected face.

    Metrics: Laplacian blur, brightness, contrast, relative face size and
    landmark-based pose. Occlusion is not reliably measurable from 5
    landmarks, so it is not asserted here (documented limitation).
    """

    BASE_MIN_FACE_RATIO = {
        "live": BIOMETRIC_LIVE_MIN_FACE_RATIO,
        "document": BIOMETRIC_DOC_MIN_FACE_RATIO,
    }

    def assess(self, rgb: np.ndarray, face: dict, role: str = "live") -> dict:
        h, w = rgb.shape[:2]
        box = face["bbox"]
        x1 = max(0, int(box["x"]))
        y1 = max(0, int(box["y"]))
        x2 = min(w, int(box["x"] + box["width"]))
        y2 = min(h, int(box["y"] + box["height"]))
        face_w = max(1, x2 - x1)
        face_h = max(1, y2 - y1)

        crop = rgb[y1:y2, x1:x2]
        gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)

        blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))
        face_ratio = min(face_w, face_h) / float(min(h, w))
        pose = estimate_pose(face["kps"])

        min_ratio = self.BASE_MIN_FACE_RATIO.get(role, BIOMETRIC_LIVE_MIN_FACE_RATIO)
        reasons = []
        if blur < BIOMETRIC_MIN_BLUR:
            reasons.append("BLURRY")
        if brightness < BIOMETRIC_BRIGHTNESS_MIN:
            reasons.append("TOO_DARK")
        elif brightness > BIOMETRIC_BRIGHTNESS_MAX:
            reasons.append("TOO_BRIGHT")
        if contrast < BIOMETRIC_CONTRAST_MIN:
            reasons.append("LOW_CONTRAST")
        if face_ratio < min_ratio:
            reasons.append("FACE_TOO_SMALL")
        if not pose_acceptable(pose):
            reasons.append("BAD_POSE")

        status = "GOOD" if not reasons else "POOR"
        return {
            "status": status,
            "blur": blur >= BIOMETRIC_MIN_BLUR,
            "lighting": "GOOD"
            if BIOMETRIC_BRIGHTNESS_MIN <= brightness <= BIOMETRIC_BRIGHTNESS_MAX
            else ("TOO_DARK" if brightness < BIOMETRIC_BRIGHTNESS_MIN else "TOO_BRIGHT"),
            "contrast": contrast >= BIOMETRIC_CONTRAST_MIN,
            "face_ratio": round(face_ratio, 4),
            "face_size": "ACCEPTABLE" if face_ratio >= min_ratio else "TOO_SMALL",
            "pose": "ACCEPTABLE" if pose_acceptable(pose) else "BAD",
            "yaw_proxy": round(pose.get("yaw_proxy", 0.0), 3),
            "interocular": round(pose.get("interocular", 0.0), 1),
            "raw": {"blur": round(blur, 1), "brightness": round(brightness, 1), "contrast": round(contrast, 1)},
            "reasons": reasons,
            "pass": not reasons,
        }