import time

import numpy as np

from .audit import append_audit_event
from .config import BIOMETRIC_HIGH_THRESHOLD, BIOMETRIC_LOW_THRESHOLD
from .decision import decide
from .detector import YuNetDetector
from .embedder import SFaceEmbedder
from .passive_pad import passive_pad_score
from .quality import FaceQuality
from .similarity import cosine_similarity
from .utils import ModelInitError

# 128-d SFace embedding, L2-normalized -> cosine in [-1, 1].
# (InsightFace ArcFace would emit a 512-d embedding; SFace is used instead
# because ArcFace's pretrained weights are non-commercial-research-only.)


class BiometricEngine:
    """Load-once, reuse-many 1:1 verification engine.

    initialize() is called at application startup (FastAPI lifespan); if the
    models cannot be loaded the API reports BIOMETRIC_ENGINE_UNAVAILABLE and
    never fabricates a pass.
    """

    def __init__(self):
        self.detector = None
        self.embedder = None
        self.quality = FaceQuality()
        self.ready = False
        self.init_error = None

    def initialize(self) -> None:
        if self.ready:
            return
        try:
            self.detector = YuNetDetector()
            self.embedder = SFaceEmbedder()
            self.ready = True
            self.init_error = None
        except ModelInitError as exc:
            self.ready = False
            self.init_error = str(exc)
            raise

    # --- primitives ----------------------------------------------------------
    def detect(self, rgb: np.ndarray) -> list:
        if not self.ready:
            return []
        return self.detector.detect(rgb)

    def embedding(self, rgb: np.ndarray, face: dict) -> np.ndarray:
        if not self.ready:
            return None
        return self.embedder.embed(rgb, face)

    def document_face_state(self, rgb: np.ndarray) -> dict:
        """Locate and qualify the face inside a full document scan/photo."""
        if not self.ready:
            return {"found": False, "error": "MODEL_INITIALIZATION_FAILED"}
        faces = self.detector.detect(rgb)
        if not faces:
            return {"found": False, "count": 0}
        # Largest face is the portrait (documents may catch bystanders/watermarks).
        face = max(faces, key=lambda f: f["bbox"]["width"] * f["bbox"]["height"])
        q = self.quality.assess(rgb, face, role="document")
        return {
            "found": True,
            "count": len(faces),
            "face": face,
            "quality": q,
            "bbox": face["bbox"],
        }

    def inspect_live_frame(self, rgb: np.ndarray) -> dict:
        """Analyze one raw camera frame: detection, quality, pose, passive PAD."""
        if not self.ready:
            return {"face_detected": False, "face_count": 0, "error": "MODEL_INITIALIZATION_FAILED"}
        faces = self.detector.detect(rgb)
        base = {
            "face_detected": len(faces) > 0,
            "face_count": len(faces),
            "quality": None,
            "passive": None,
        }
        if not faces:
            return base
        face = faces[0]
        bbox = face["bbox"]
        x0, y0 = int(max(0, bbox["x"])), int(max(0, bbox["y"]))
        x1, y1 = int(min(rgb.shape[1], bbox["x"] + bbox["width"])), int(min(rgb.shape[0], bbox["y"] + bbox["height"]))
        face_crop = rgb[y0:y1, x0:x1]
        base["quality"] = self.quality.assess(rgb, face, role="live")
        base["passive"] = passive_pad_score(face_crop)
        return base

    def compare(self, doc_rgb: np.ndarray, live_rgb: np.ndarray) -> dict:
        """One-shot compare of two images, used by the /api/biometric/verify
        convenience path and by the screening pipeline.

        Liveness here is PASSIVE-only (no randomized challenge). The session
        flow performs the full ACTIVE liveness; callers must supply
        active_liveness=True to require a completed challenge.
        """
        started = time.time()
        if not self.ready:
            return self._unavailable()

        doc_state = self.document_face_state(doc_rgb)
        live_inspection = self.inspect_live_frame(live_rgb)

        doc_ok = bool(doc_state.get("found") and doc_state.get("quality", {}).get("pass", False))
        live_ok = bool(live_inspection["face_detected"] and live_inspection["face_count"] == 1 and live_inspection["quality"] and live_inspection["quality"]["pass"])

        passive = dict(live_inspection["passive"] or {"liveness_score": 0.0, "is_live": False})
        live_face = None
        if live_inspection["face_detected"] and live_inspection["face_count"] == 1:
            live_face = self.detector.detect(live_rgb)[0]

        similarity = None
        if doc_state.get("found") and live_face is not None:
            emb_doc = self.embedding(doc_rgb, doc_state["face"])
            emb_live = self.embedding(live_rgb, live_face)
            if emb_doc is not None and emb_live is not None:
                similarity = cosine_similarity(emb_doc, emb_live)

        decision = decide(
            similarity if similarity is not None else 0.0,
            doc_face_ok=doc_ok,
            doc_face_found=doc_state.get("found", False),
            live_face_found=live_inspection["face_detected"],
            live_face_count=live_inspection["face_count"],
            live_quality_ok=live_ok,
            liveness_passed=bool(passive.get("is_live")),
            active_required=False,
        )
        liveness = {"status": "PASS" if passive.get("is_live") else "FAIL", "is_live": bool(passive.get("is_live")), "score": passive.get("liveness_score", 0.0), "active": False, "passive": passive}
        liveness.update(passive)  # surface PAD details compatibly with the legacy UI
        return self._assemble(
            decision=decision,
            similarity=similarity,
            doc_state=doc_state,
            live_inspection=live_inspection,
            liveness=liveness,
            elapsed_ms=round((time.time() - started) * 1000, 1),
        )

    # --- session flow ----------------------------------------------------------
    def session_verify(self, session, live_rgb: np.ndarray) -> dict:
        """Complete verification after an ACTIVE liveness challenge passed."""
        started = time.time()
        if not self.ready:
            return self._unavailable()
        doc_state = session.doc_state
        inspection = self.inspect_live_frame(live_rgb)
        live_ok = bool(inspection["face_detected"] and inspection["face_count"] == 1 and inspection["quality"] and inspection["quality"]["pass"])
        tracker = session.tracker

        similarity = None
        if doc_state.get("found") and inspection["face_detected"] and inspection["face_count"] == 1:
            live_face = self.detector.detect(live_rgb)[0]
            emb_doc = self.embedding(session.doc_np, doc_state["face"])
            emb_live = self.embedding(live_rgb, live_face)
            if emb_doc is not None and emb_live is not None:
                similarity = cosine_similarity(emb_doc, emb_live)

        passive = dict(inspection["passive"] or {"liveness_score": 0.0, "is_live": False})
        active_passed = bool(tracker.passed and tracker.complete)
        liveness = {
            "status": "PASS" if (active_passed and passive.get("is_live")) else "FAIL",
            "is_live": bool(active_passed and passive.get("is_live")),
            "score": round((passive.get("liveness_score", 0.0) + (100.0 if active_passed else 0.0)) / 2.0, 1),
            "active": True,
            "challenge": tracker.challenge,
            "hint": tracker.hint,
            "frames_seen": tracker.seen,
            "frames_accepted": tracker.accepted,
            "passive": passive,
        }
        liveness.update(passive)  # flat PAD fields for the legacy screening UI

        decision = decide(
            similarity if similarity is not None else 0.0,
            doc_face_ok=bool(doc_state.get("quality", {}).get("pass", False)),
            doc_face_found=doc_state.get("found", False),
            live_face_found=inspection["face_detected"],
            live_face_count=inspection["face_count"],
            live_quality_ok=live_ok,
            liveness_passed=active_passed,
            active_required=True,
        )
        return self._assemble(
            decision=decision,
            similarity=similarity,
            doc_state=doc_state,
            live_inspection=inspection,
            liveness=liveness,
            elapsed_ms=round((time.time() - started) * 1000, 1),
        )

    # --- assembly ---------------------------------------------------------------
    def _assemble(self, decision, similarity, doc_state, live_inspection, liveness, elapsed_ms):
        doc_q = doc_state.get("quality") or {}
        live_q = live_inspection.get("quality") or {}
        sim = similarity if similarity is not None else 0.0
        result = {
            "success": True,
            "verified": decision.get("verified", False),
            "decision": decision.get("decision"),
            "reason": decision.get("reason"),
            "similarity_score": round(sim, 4),
            "threshold": round(BIOMETRIC_HIGH_THRESHOLD, 4),
            "decision_band": {"low": round(BIOMETRIC_LOW_THRESHOLD, 4), "high": round(BIOMETRIC_HIGH_THRESHOLD, 4)},
            "face_detected": live_inspection.get("face_detected", False),
            "face_count": live_inspection.get("face_count", 0),
            "document_face": {"detected": bool(doc_state.get("found")), "bbox": doc_state.get("bbox")},
            "liveness": liveness,
            "quality": {
                "status": live_q.get("status", "POOR"),
                "score": _quality_score(live_q),
                "blur": bool(live_q.get("blur")),
                "lighting": live_q.get("lighting", "UNKNOWN"),
                "pose": live_q.get("pose", "BAD"),
                "face_size": live_q.get("face_size", "TOO_SMALL"),
                "reasons": live_q.get("reasons", []),
            },
            "error_code": decision.get("error_code"),
            "message": decision.get("message", ""),
            "elapsed_ms": elapsed_ms,
            # --- compatibility with the existing screening UI / risk engine ---
            "biometric_available": True,
            "match_score": round(sim * 100.0, 1),
            "is_matched": decision.get("verified", False),
            "confidence": "HIGH" if decision.get("decision") == "VERIFIED" else ("MODERATE" if decision.get("decision") == "REVIEW" else "MISMATCH"),
            "doc_face_detected": bool(doc_state.get("found")),
            "live_face_detected": live_inspection.get("face_detected", False),
        }
        append_audit_event(
            {
                "session_id": None,
                "decision": result["decision"],
                "similarity": result["similarity_score"],
                "threshold": result["threshold"],
                "liveness": liveness.get("status"),
                "quality": result["quality"]["status"],
                "reason": result.get("reason"),
                "error_code": result.get("error_code"),
            }
        )
        return result

    def _unavailable(self):
        return {
            "success": False,
            "verified": False,
            "decision": "REJECTED",
            "error_code": "BIOMETRIC_ENGINE_UNAVAILABLE",
            "message": "The biometric engine could not be initialized. Verification is unavailable.",
            "biometric_available": False,
        }


def _quality_score(q: dict) -> float:
    if not q:
        return 0.0
    total = 5  # blur, lighting, contrast, face_size, pose
    ok = sum(
        [
            bool(q.get("blur")),
            q.get("lighting") == "GOOD",
            bool(q.get("contrast")),
            q.get("face_size") == "ACCEPTABLE",
            q.get("pose") == "ACCEPTABLE",
        ]
    )
    return round(ok / total, 2)


_engine = BiometricEngine()


def get_engine() -> BiometricEngine:
    return _engine


def initialize_engine() -> None:
    """Idempotent model initialization for app startup (see main lifespan)."""
    if not _engine.ready:
        _engine.initialize()