import random
import time

from .config import (
    BIOMETRIC_LIVENESS_CLOSER_FACTOR,
    BIOMETRIC_LIVENESS_MAX_SKIPPED,
    BIOMETRIC_LIVENESS_MIN_FRAMES,
    BIOMETRIC_LIVENESS_TIMEOUT_S,
    BIOMETRIC_LIVENESS_YAW_DELTA,
)

# Randomizable challenge set. "Blink twice" is intentionally excluded: the
# YuNet 5-landmark detector provides no eyelid points, so an eye-aspect-ratio
# blink detector would not be a real measurement with this model.
CHALLENGES = ["TURN_LEFT", "TURN_RIGHT", "MOVE_CLOSER"]

HINTS = {
    "TURN_LEFT": "Turn your head LEFT until it faces the left side, then return to center.",
    "TURN_RIGHT": "Turn your head RIGHT until it faces the right side, then return to center.",
    "MOVE_CLOSER": "Move your face closer to the camera until prompted to stop.",
}


class LivenessTracker:
    """Stateful active-liveness accumulator for one biometric session.

    Each accepted camera frame is scored against the randomized challenge:
      TURN_LEFT / TURN_RIGHT -> measured by the landmark yaw proxy moving past
        a signed threshold away from the baseline pose of the first accepted frame.
      MOVE_CLOSER -> measured by the interocular distance growing past a factor
        of the baseline (the face approaches the lens).

    Frames failing the quality gate are still counted as "seen" but never
    contribute to the motion series, and too many bad frames fail the check.
    """

    def __init__(self, challenge: str):
        self.challenge = challenge
        self.hint = HINTS[challenge]
        self.started_at = time.time()
        self.accepted = 0
        self.seen = 0
        self.bad = 0
        self.baseline = None
        self.best_value = None  # most extreme directional value observed
        self.complete = False
        self.passed = False

    def feed(self, yaw_proxy: float, interocular: float, quality_ok: bool) -> dict:
        now = time.time()
        timed_out = now - self.started_at > BIOMETRIC_LIVENESS_TIMEOUT_S
        self.seen += 1
        if not quality_ok:
            self.bad += 1
            too_many_bad = self.bad >= BIOMETRIC_LIVENESS_MAX_SKIPPED
            return self.status(rejected=True, reason="quality" if not timed_out else "timeout", timed_out=timed_out, too_many_bad=too_many_bad)

        self.accepted += 1
        if self.baseline is None:
            self.baseline = yaw_proxy if self.challenge in ("TURN_LEFT", "TURN_RIGHT") else interocular

        if self.challenge in ("TURN_LEFT", "TURN_RIGHT"):
            target = 1.0 if self.challenge == "TURN_LEFT" else -1.0
            value = yaw_proxy - self.baseline
            # Challenge asks for motion in one direction; opposite motion does
            # not advance progress.
            if (value * target) > (self.best_value * target if self.best_value is not None else 0.0):
                self.best_value = value
            self.complete = (
                self.best_value is not None
                and self.best_value * target >= BIOMETRIC_LIVENESS_YAW_DELTA
                and self.accepted >= BIOMETRIC_LIVENESS_MIN_FRAMES
            )
        else:  # MOVE_CLOSER
            if self.baseline > 1e-6:
                ratio = interocular / self.baseline
                self.best_value = ratio if self.best_value is None else max(self.best_value, ratio)
                self.complete = (
                    self.best_value >= BIOMETRIC_LIVENESS_CLOSER_FACTOR
                    and self.accepted >= BIOMETRIC_LIVENESS_MIN_FRAMES
                )
        if self.complete:
            self.passed = True
            return self.status(passed=True, complete=True)
        return self.status(rejected=False)

    def status(self, rejected=False, passed=None, complete=None, reason=None, timed_out=False, too_many_bad=False):
        failed = bool(timed_out or too_many_bad or (rejected and reason == "timeout"))
        complete = self.complete if complete is None else complete
        passed = self.passed if passed is None else passed
        return {
            "challenge": self.challenge,
            "hint": self.hint,
            "frames_seen": self.seen,
            "frames_accepted": self.accepted,
            "frames_rejected": self.bad,
            "progress": 0.0 if self.baseline is None else min(1.0, self.accepted / float(BIOMETRIC_LIVENESS_MIN_FRAMES)),
            "complete": bool(complete),
            "passed": bool(passed and not failed),
            "failed": bool(failed),
            "reason": reason or ("timeout" if timed_out else "too_many_bad" if too_many_bad else None),
            "message": "Liveness challenge complete" if complete else "Keep moving until prompted to stop",
        }


def pick_challenge() -> str:
    return random.choice(CHALLENGES)