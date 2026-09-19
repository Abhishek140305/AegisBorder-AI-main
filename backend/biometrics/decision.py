from .config import BIOMETRIC_HIGH_THRESHOLD, BIOMETRIC_LOW_THRESHOLD

# Decision bands. VERIFIED / REVIEW / MISMATCH are deliberately three-valued:
# a borderline similarity must not be auto-accused of fraud.

HIGH = BIOMETRIC_HIGH_THRESHOLD
LOW = BIOMETRIC_LOW_THRESHOLD


def decide(
    similarity: float,
    *,
    doc_face_ok: bool,
    doc_face_found: bool,
    live_face_found: bool,
    live_face_count: int,
    live_quality_ok: bool,
    liveness_passed: bool,
    active_required: bool,
) -> dict:
    """Gated 1:1 decision.

    Gates run first (quality, liveness, face count). Only when every gate
    passes is the cosine similarity mapped onto the calibrated decision band.
    Returns machine-readable error codes for the frontend.
    """
    if not doc_face_found:
        return _error("DOCUMENT_FACE_NOT_FOUND", "No face could be located in the document portrait.")
    if not doc_face_ok:
        return _error("DOCUMENT_FACE_QUALITY_LOW", "The document portrait is too low quality for a reliable comparison.")
    if not live_face_found:
        return _error("NO_FACE", "No face detected. Please position your face inside the camera frame.")
    if live_face_count > 1:
        return _error("MULTIPLE_FACES", "Multiple faces detected. Only one person should be visible.")
    if not live_quality_ok:
        return _error("LOW_IMAGE_QUALITY", "Live capture is too low quality. Please hold the camera steady and re-frame.")
    if active_required:
        if not liveness_passed:
            return _error("LIVENESS_FAILED", "Active liveness challenge was not completed. A photograph or replay cannot verify liveness.")

    if similarity >= HIGH:
        return {
            "decision": "VERIFIED",
            "verified": True,
            "reason": "FACE_MATCH",
            "message": "Biometric verification successful.",
        }
    if similarity >= LOW:
        return {
            "decision": "REVIEW",
            "verified": False,
            "reason": "BORDERLINE_SIMILARITY",
            "message": "Similarity is borderline. Refer to a human officer for manual review.",
        }
    return {
        "decision": "MISMATCH",
        "verified": False,
        "reason": "FACE_MISMATCH",
        "message": "The live face does not match the document portrait. Refer to manual review.",
    }


def _error(error_code: str, message: str) -> dict:
    return {"decision": "REJECTED", "verified": False, "error_code": error_code, "reason": error_code, "message": message}