import unittest

import cv2
import numpy as np

from biometrics.quality import FaceQuality


def face_rect(w, h, margin=0.1):
    """Fabricated face dict covering a large symmetric region -> poses OK."""
    x, y = int(w * margin), int(h * margin)
    fw, fh = int(w * (1 - 2 * margin)), int(h * (1 - 2 * margin))
    cx, cy = w // 2, int(h * 0.45)
    io = int(fw * 0.18)
    kps = np.array(
        [
            [cx - io, cy],
            [cx + io, cy],
            [cx, int(cy + fh * 0.12)],
            [cx - io, cy + int(fh * 0.30)],
            [cx + io, cy + int(fh * 0.30)],
        ],
        dtype=np.float64,
    )
    return {"bbox": {"x": x, "y": y, "width": fw, "height": fh}, "kps": kps}


class TestQuality(unittest.TestCase):
    def setUp(self):
        self.q = FaceQuality()

    def test_blank_image_fails_blur_and_contrast(self):
        img = (np.full((240, 320, 3), 128, dtype=np.uint8))
        r = self.q.assess(img, face_rect(320, 240), role="live")
        self.assertFalse(r["pass"])
        self.assertIn("BLURRY", r["reasons"])
        self.assertIn("LOW_CONTRAST", r["reasons"])

    def test_dark_image_reported_too_dark(self):
        img = np.full((240, 320, 3), 4, dtype=np.uint8)
        r = self.q.assess(img, face_rect(320, 240), role="live")
        self.assertEqual(r["lighting"], "TOO_DARK")
        self.assertFalse(r["pass"])

    def test_random_noise_passes_blur_but_may_fail_elsewhere(self):
        rng = np.random.default_rng(3)
        img = rng.integers(0, 256, (240, 320, 3), dtype=np.uint8)
        r = self.q.assess(img, face_rect(320, 240), role="live")
        self.assertTrue(r["blur"])  # high Laplacian variance

    def test_tiny_face_rejected_for_size(self):
        img = (np.full((240, 320, 3), 90, dtype=np.uint8))
        img[:, :] = np.random.default_rng(1).integers(80, 200, img.shape, dtype=np.uint8)  # noisy, not blurry
        small = {"bbox": {"x": 148, "y": 108, "width": 8, "height": 8}, "kps": np.array([[150, 110], [154, 110], [152, 112], [150, 114], [154, 114]], dtype=np.float64)}
        r = self.q.assess(img, small, role="live")
        self.assertIn("FACE_TOO_SMALL", r["reasons"])
        self.assertEqual(r["face_size"], "TOO_SMALL")

    def test_document_ratio_stricter_than_live(self):
        rng = np.random.default_rng(5)
        img = rng.integers(0, 256, (240, 320, 3), dtype=np.uint8)
        face = face_rect(320, 240, margin=0.42)  # ~16% of the short edge: fine for live, marginal for doc
        r_live = self.q.assess(img, face, role="live")
        # The face spans (0.16 of min side); doc minimum is larger than live minimum
        self.assertLessEqual(self.q.BASE_MIN_FACE_RATIO["document"], self.q.BASE_MIN_FACE_RATIO["live"])


if __name__ == "__main__":
    unittest.main()