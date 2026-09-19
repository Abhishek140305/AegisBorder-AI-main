import os


def _env_float(key: str, default: float) -> float:
    try:
        return float(os.environ.get(key, str(default)))
    except ValueError:
        return default


def _env_int(key: str, default: int) -> int:
    try:
        return int(os.environ.get(key, str(default)))
    except ValueError:
        return default


# --- Face detection ----------------------------------------------------------
BIOMETRIC_DET_CONFIDENCE = _env_float("BIOMETRIC_DET_CONFIDENCE", 0.5)

# --- Decision bands (cosine similarity on normalized SFace embeddings) -------
# These defaults are STARTING values, not scientifically validated. Calibrate
# them on a held-out genuine/impostor dataset with the evaluation CLI before
# deployment (python -m evaluation.evaluate_biometric).
BIOMETRIC_HIGH_THRESHOLD = _env_float("BIOMETRIC_HIGH_THRESHOLD", 0.45)
BIOMETRIC_LOW_THRESHOLD = _env_float("BIOMETRIC_LOW_THRESHOLD", 0.30)

# --- Image quality gates -----------------------------------------------------
BIOMETRIC_MIN_BLUR = _env_float("BIOMETRIC_MIN_BLUR", 40.0)          # Laplacian variance
BIOMETRIC_BRIGHTNESS_MIN = _env_float("BIOMETRIC_BRIGHTNESS_MIN", 60.0)
BIOMETRIC_BRIGHTNESS_MAX = _env_float("BIOMETRIC_BRIGHTNESS_MAX", 235.0)
BIOMETRIC_CONTRAST_MIN = _env_float("BIOMETRIC_CONTRAST_MIN", 25.0)    # std of face-crop gray
BIOMETRIC_LIVE_MIN_FACE_RATIO = _env_float("BIOMETRIC_LIVE_MIN_FACE_RATIO", 0.12)
BIOMETRIC_DOC_MIN_FACE_RATIO = _env_float("BIOMETRIC_DOC_MIN_FACE_RATIO", 0.04)
BIOMETRIC_MAX_YAW_PROXY = _env_float("BIOMETRIC_MAX_YAW_PROXY", 0.30) # image-space pose limit

# --- Active liveness ---------------------------------------------------------
BIOMETRIC_LIVENESS_YAW_DELTA = _env_float("BIOMETRIC_LIVENESS_YAW_DELTA", 0.20)
BIOMETRIC_LIVENESS_CLOSER_FACTOR = _env_float("BIOMETRIC_LIVENESS_CLOSER_FACTOR", 1.18)
BIOMETRIC_LIVENESS_MIN_FRAMES = _env_int("BIOMETRIC_LIVENESS_MIN_FRAMES", 6)
BIOMETRIC_LIVENESS_TIMEOUT_S = _env_int("BIOMETRIC_LIVENESS_TIMEOUT_S", 60)
BIOMETRIC_LIVENESS_MAX_SKIPPED = _env_int("BIOMETRIC_LIVENESS_MAX_SKIPPED", 14)

# --- Sessions / API ----------------------------------------------------------
BIOMETRIC_SESSION_TTL_S = _env_int("BIOMETRIC_SESSION_TTL_S", 180)
BIOMETRIC_MAX_SESSIONS = _env_int("BIOMETRIC_MAX_SESSIONS", 50)
BIOMETRIC_MAX_IMAGE_BYTES = _env_int("BIOMETRIC_MAX_IMAGE_BYTES", 8 * 1024 * 1024)

# --- Audit -------------------------------------------------------------------
AUDIT_LOG_PATH = os.environ.get(
    "BIOMETRIC_AUDIT_LOG_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "biometric_audit.jsonl"),
)