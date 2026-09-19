import unittest

import numpy as np

from biometrics.similarity import cosine_similarity


class TestCosineSimilarity(unittest.TestCase):
    def test_identical_vectors(self):
        v = np.array([1.0, 0.0, 2.0, -3.0])
        self.assertAlmostEqual(cosine_similarity(v, v), 1.0, places=9)

    def test_orthogonal(self):
        self.assertAlmostEqual(cosine_similarity(np.array([1.0, 0.0]), np.array([0.0, 1.0])), 0.0, places=9)

    def test_opposite(self):
        self.assertAlmostEqual(cosine_similarity(np.array([1.0, 0.0]), np.array([-1.0, 0.0])), -1.0, places=9)

    def test_zero_vector_guarded(self):
        z = np.zeros(128)
        self.assertEqual(cosine_similarity(z, np.ones(128)), 0.0)
        self.assertEqual(cosine_similarity(np.ones(128), z), 0.0)

    def test_result_in_unit_range(self):
        ws = np.random.default_rng(7).normal(size=(50, 64)).astype(np.float64)
        ws /= np.linalg.norm(ws, axis=1, keepdims=True)
        for a in ws[:10]:
            for b in ws[10:20]:
                s = cosine_similarity(a, b)
                self.assertGreaterEqual(s, -1.0)
                self.assertLessEqual(s, 1.0)


if __name__ == "__main__":
    unittest.main()