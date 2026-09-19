import secrets
import threading
import time

import numpy as np

from .config import BIOMETRIC_MAX_SESSIONS, BIOMETRIC_SESSION_TTL_S
from .liveness import LivenessTracker, pick_challenge


class BiometricSession:
    """One active verification session. Holds the decrypted-in-memory document
    image (never persisted to disk), the live liveness tracker, and the best
    quality live frame selected during the challenge.
    """

    __slots__ = ("id", "challenge", "doc_np", "doc_state", "tracker", "created_at", "best_live", "best_live_quality", "final_live")

    def __init__(self, doc_np: np.ndarray, doc_state: dict):
        self.id = secrets.token_urlsafe(16)
        self.challenge = pick_challenge()
        self.doc_np = doc_np
        self.doc_state = doc_state
        self.tracker = LivenessTracker(self.challenge)
        self.created_at = time.time()
        self.best_live = None
        self.best_live_quality = None
        self.final_live = None

    def expires_at(self):
        return self.created_at + BIOMETRIC_SESSION_TTL_S


class SessionManager:
    """Bounded, thread-safe in-memory store. Sessions expire on TTL and are
    purged lazily (on access) plus every create. Raw images live only in RAM.
    """

    def __init__(self):
        self._sessions = {}
        self._lock = threading.Lock()

    def _purge(self):
        now = time.time()
        stale = [sid for sid, s in self._sessions.items() if s.expires_at() < now]
        for sid in stale:
            del self._sessions[sid]
        while len(self._sessions) >= BIOMETRIC_MAX_SESSIONS:
            oldest = min(self._sessions, key=lambda k: self._sessions[k].created_at)
            del self._sessions[oldest]

    def create(self, doc_np: np.ndarray, doc_state: dict) -> BiometricSession:
        with self._lock:
            self._purge()
            s = BiometricSession(doc_np, doc_state)
            self._sessions[s.id] = s
            return s

    def get(self, session_id: str):
        with self._lock:
            self._purge()
            s = self._sessions.get(session_id)
            if s is None or s.expires_at() < time.time():
                if s is not None:
                    self._sessions.pop(session_id, None)
                return None
            return s

    def end(self, session_id: str):
        with self._lock:
            self._sessions.pop(session_id, None)


session_manager = SessionManager()