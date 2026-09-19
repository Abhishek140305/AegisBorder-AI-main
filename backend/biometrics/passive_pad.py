import cv2
import numpy as np


def passive_pad_score(rgb: np.ndarray) -> dict:
    """Passive presentation-attack signal on a single face crop.

    Detects screen-replay signatures: the FFT magnitude spectrum of a printed
    photo or a replayed screen shows strong periodic energy (moiré) that a
    live webcam face does not. Also folds in a sharpness loss term. This is a
    weak signal by itself; the system's liveness decision combines it with the
    ACTIVE motion challenge (head turn / approach). It is explicitly NOT
    claimed to be certified anti-spoofing.
    """
    if len(rgb.shape) == 3:
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    else:
        gray = rgb.copy()

    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-5)

    h, w = gray.shape
    cy, cx = h // 2, w // 2
    r_inner = max(2, min(h, w) // 6)
    r_outer = max(4, min(h, w) // 3)

    yy, xx = np.ogrid[:h, :w]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    ring = (dist >= r_inner) & (dist <= r_outer)
    ring_vals = magnitude_spectrum[ring]
    peaks = int(np.sum(ring_vals > (np.mean(magnitude_spectrum) + 2.5 * np.std(magnitude_spectrum)))) if len(ring_vals) else 0
    moire = peaks > 25

    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    blurry = laplacian_var < 40.0

    score = 95.0
    if moire:
        score -= 45.0
    if blurry:
        score -= 15.0
    score = float(max(0.0, min(100.0, score)))

    return {
        "liveness_score": score,
        "is_live": score >= 60.0,
        "moire_artifact_detected": bool(moire),
        "sharpness_index": round(laplacian_var, 2),
    }