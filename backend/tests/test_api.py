import base64
import sys
import os
import unittest

import cv2
import numpy as np
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from biometrics.engine import initialize_engine  # noqa: E402


def b64_noise():
    img = np.random.default_rng(2).integers(0, 256, (240, 320, 3), dtype=np.uint8)
    ok, buf = cv2.imencode(".jpg", img)
    if not ok:
        raise SystemExit("imencode failed")
    return base64.b64encode(buf.tobytes()).decode("ascii")


class TestApiRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        initialize_engine()
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        import main as m
        cls.m = m

    def test_status_reports_engine_ready(self):
        s = self.m.biometric_status()
        self.assertTrue(s["engine_ready"])
        self.assertGreater(s["threshold"], 0)

    def test_session_rejects_document_without_face(self):
        r = self.m.biometric_session(self.m.BiometricSessionRequest(document_image_b64=b64_noise()))
        self.assertFalse(r["success"])
        self.assertEqual(r["error_code"], "DOCUMENT_FACE_NOT_FOUND")

    def test_session_rejects_bad_base64(self):
        with self.assertRaises(HTTPException) as ctx:
            self.m.biometric_session(self.m.BiometricSessionRequest(document_image_b64="not-base64!!"))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_liveness_unknown_session_404(self):
        with self.assertRaises(HTTPException) as ctx:
            self.m.biometric_liveness(self.m.BiometricFrameRequest(session_id="does-not-exist", frame_b64=b64_noise()))
        self.assertEqual(ctx.exception.status_code, 404)

    def test_verify_no_session_needs_live_image(self):
        with self.assertRaises(HTTPException) as ctx:
            self.m.biometric_verify(self.m.BiometricVerifyRequest(document_image_b64=b64_noise(), live_image_b64=None))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_verify_no_session_no_face(self):
        r = self.m.biometric_verify(self.m.BiometricVerifyRequest(document_image_b64=b64_noise(), live_image_b64=b64_noise()))
        self.assertFalse(r["verified"])
        self.assertIn("error_code", r)


if __name__ == "__main__":
    unittest.main()