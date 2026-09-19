import numpy as np

from .config import BIOMETRIC_MAX_YAW_PROXY


def identify_landmarks(kps: np.ndarray) -> dict:
    """Assign the 5 YuNet landmarks to semantic roles.

    YuNet predicts (right-eye, left-eye, nose, right-mouth, left-mouth) but
    exact ordering varies across OpenCV versions. We instead derive roles from
    geometry: the two highest points are the eyes, the two lowest are the mouth
    corners, the leftover point is the nose. Only fails under extreme head
    roll, which the quality gate rejects anyway.

    ponytail: geometric role assignment is a heuristic; a 68-landmark model
    would be more robust but adds a model + dependency for marginal gain here.
    """
    pts = np.asarray(kps, dtype=np.float64)
    order_by_y = np.argsort(pts[:, 1])
    eyes_idx = order_by_y[:2]
    low3 = list(order_by_y[2:])  # nose + the two mouth corners
    nose_idx = int(low3[int(np.argmin(pts[low3, 1]))])  # nose is the highest of the low three
    mouth_idx = [i for i in low3 if i != nose_idx]
    eyes = pts[eyes_idx]
    if eyes[0, 0] < eyes[1, 0]:
        left_eye, right_eye = eyes[0], eyes[1]
    else:
        left_eye, right_eye = eyes[1], eyes[0]
    mouth = pts[mouth_idx]
    if mouth[0, 1] > mouth[1, 1]:
        left_mouth, right_mouth = mouth[0], mouth[1]
    else:
        left_mouth, right_mouth = mouth[1], mouth[0]
    nose = pts[nose_idx]
    return {
        "left_eye": left_eye,
        "right_eye": right_eye,
        "nose": nose,
        "left_mouth": left_mouth,
        "right_mouth": right_mouth,
    }


def estimate_pose(kps: np.ndarray) -> dict:
    """Image-space head-pose proxy from 5 landmarks.

    yaw_proxy: how far the nose tip sits off the eye-center line, normalized
    by the interocular distance. Positive = nose shifted right in the image
    (~head turned to the subject's left), negative = nose shifted left. Used
    both as a live quality gate and as the active-liveness motion signal.
    This is an approximate measurement, not an absolute Euler angle.
    """
    lm = identify_landmarks(kps)
    interocular = float(np.linalg.norm(lm["right_eye"] - lm["left_eye"]))
    if interocular < 1e-6:
        return {"yaw_proxy": 0.0, "pitch_proxy": 0.0, "roll_deg": 0.0, "interocular": 0.0, "reliable": False}
    eye_mid = (lm["left_eye"] + lm["right_eye"]) / 2.0
    half = 0.5 * interocular
    return {
        "yaw_proxy": float((lm["nose"][0] - eye_mid[0]) / half),
        "pitch_proxy": float((lm["nose"][1] - eye_mid[1]) / half),
        "roll_deg": float(np.degrees(np.arctan2(lm["right_eye"][1] - lm["left_eye"][1], lm["right_eye"][0] - lm["left_eye"][0]))),
        "interocular": interocular,
        "reliable": True,
    }


def pose_acceptable(pose: dict, limit: float = BIOMETRIC_MAX_YAW_PROXY) -> bool:
    """A face is 'acceptable' when the yaw proxy is within the configured limit."""
    return bool(pose.get("reliable")) and abs(pose.get("yaw_proxy", 0.0)) <= limit