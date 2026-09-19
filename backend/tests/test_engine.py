import unittest

import numpy as np

from biometrics.engine import initialize_engine, get_engine


def noise(h, w):
    return np.random.default_rng(0).integers(0, 256, (h, w, 3), dtype=np.uint8)


class TestEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        initialize_engine()
        cls.engine = get_engine()
        if not cls.engine.ready:
            raise unittest.SkipTest("models unavailable: %s" % cls.engine.init_error)

    def test_embedding_is_consistent_and_normalized(self):
        rgb = noise(160, 160)
        from biometrics.pose import identify_landmarks
        cx, cy = 80, 64
        io = 14
        kps = np.array([[cx - io, cy], [cx + io, cy], [cx, cy + 8], [cx - io, cy + 20], [cx + io, cy + 20]], dtype=np.float64)
        face = {"bbox": {"x": 40, "y": 30, "width": 80, "height": 90}, "kps": kps}
        e = self.engine.embedding(rgb, face)
        self.assertIsNotNone(e)
        self.assertAlmostEqual(float(np.linalg.norm(e)), 1.0, places=6)
        e2 = self.engine.embedding(rgb, face)
        from biometrics.similarity import cosine_similarity
        self.assertGreater(cosine_similarity(e, e2), 0.999)

    def test_no_face_on_noise_returns_errors(self):
        r = self.engine.compare(noise(320, 240), noise(320, 240))
        self.assertFalse(r["verified"])
        self.assertEqual(r["error_code"], "DOCUMENT_FACE_NOT_FOUND")
        self.assertTrue(r["biometric_available"])

    def test_inspect_live_frame_no_face(self):
        r = self.engine.inspect_live_frame(noise(320, 240))
        self.assertFalse(r["face_detected"])
        self.assertEqual(r["face_count"], 0)


if __name__ == "__main__":
    unittest.main()