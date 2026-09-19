import json
import os
import threading
import time

from .config import AUDIT_LOG_PATH
from .utils import ensure_dir

_lock = threading.Lock()


def append_audit_event(event: dict) -> None:
    """Persist one sanitized audit event.

    Never contains raw images, embeddings, names or document numbers — only
    the decision outcome and the machine-readable reasons. Used to satisfy the
    audit-trail requirement without logging biometric data.
    """
    safe = {
        "timestamp": time.time(),
        "session_id": event.get("session_id"),
        "decision": event.get("decision"),
        "similarity": event.get("similarity"),
        "threshold": event.get("threshold"),
        "liveness": event.get("liveness"),
        "quality": event.get("quality"),
        "reason": event.get("reason"),
        "error_code": event.get("error_code"),
    }
    try:
        ensure_dir(AUDIT_LOG_PATH)
        with _lock, open(AUDIT_LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(safe, default=str) + "\n")
    except OSError:
        pass  # audit logging must never break the screening flow