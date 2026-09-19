import numpy as np


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two embedding vectors.

    Embeddings are L2-normalized upstream, but we still guard against zero
    norms and clamp to [-1.0, 1.0] for numerical stability.
    """
    if a is None or b is None or a.ndim != 1 or b.ndim != 1:
        raise ValueError("Both inputs must be 1-D vectors.")
    if a.shape != b.shape:
        raise ValueError("Embedding dimensions differ: %d vs %d" % (a.shape[0], b.shape[0]))
    if a.shape[0] == 0:
        raise ValueError("Empty embedding vector.")
    na = float(np.linalg.norm(a))
    nb = float(np.linalg.norm(b))
    if na < 1e-12 or nb < 1e-12:
        return 0.0
    return float(max(-1.0, min(1.0, float(np.dot(a, b) / (na * nb)))))