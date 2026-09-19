import unittest

from biometrics.config import BIOMETRIC_HIGH_THRESHOLD, BIOMETRIC_LOW_THRESHOLD
from biometrics.decision import decide


def ok(**over):
    base = dict(
        similarity=0.9,
        doc_face_ok=True,
        doc_face_found=True,
        live_face_found=True,
        live_face_count=1,
        live_quality_ok=True,
        liveness_passed=True,
        active_required=False,
    )
    base.update(over)
    return decide(**base)


class TestDecisionBands(unittest.TestCase):
    def test_verified_above_high(self):
        self.assertEqual(ok(similarity=BIOMETRIC_HIGH_THRESHOLD + 0.001)["decision"], "VERIFIED")
        self.assertTrue(ok(similarity=BIOMETRIC_HIGH_THRESHOLD + 0.001)["verified"])

    def test_review_between_bands(self):
        self.assertEqual(ok(similarity=(BIOMETRIC_HIGH_THRESHOLD + BIOMETRIC_LOW_THRESHOLD) / 2.0)["decision"], "REVIEW")

    def test_mismatch_below_low(self):
        self.assertEqual(ok(similarity=BIOMETRIC_LOW_THRESHOLD - 0.001)["decision"], "MISMATCH")

    def test_all_gates_first(self):
        # A very high similarity must NOT bypass a failed gate.
        self.assertEqual(ok(similarity=0.99, doc_face_found=False)["error_code"], "DOCUMENT_FACE_NOT_FOUND")
        self.assertEqual(ok(similarity=0.99, doc_face_ok=False)["error_code"], "DOCUMENT_FACE_QUALITY_LOW")
        self.assertEqual(ok(similarity=0.99, live_face_found=False)["error_code"], "NO_FACE")
        self.assertEqual(ok(similarity=0.99, live_face_count=2)["error_code"], "MULTIPLE_FACES")
        self.assertEqual(ok(similarity=0.99, live_quality_ok=False)["error_code"], "LOW_IMAGE_QUALITY")

    def test_active_liveness_required(self):
        r = ok(similarity=0.99, active_required=True, liveness_passed=False)
        self.assertEqual(r["error_code"], "LIVENESS_FAILED")
        self.assertFalse(r["verified"])

    def test_active_liveness_ignored_when_not_required(self):
        self.assertEqual(ok(similarity=0.99, active_required=False, liveness_passed=False)["decision"], "VERIFIED")

    def test_rejected_never_verified(self):
        for case in [
            dict(doc_face_found=False),
            dict(live_face_count=3),
            dict(active_required=True, liveness_passed=False),
        ]:
            r = ok(**case)
            self.assertEqual(r["decision"], "REJECTED")
            self.assertFalse(r["verified"])


if __name__ == "__main__":
    unittest.main()