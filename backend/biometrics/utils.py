import base64
import io
import os

import numpy as np
from PIL import Image

from .config import BIOMETRIC_MAX_IMAGE_BYTES

VALID_MAGIC = (
    b"\xff\xd8\xff",        # JPEG
    b"\x89PNG\r\n\x1a\n",   # PNG
    b"BM",                  # BMP
)


class ModelInitError(RuntimeError):
    """Raised when a required biometric model cannot be loaded."""


class InvalidImageError(ValueError):
    """Raised when uploaded bytes are not a decodable, allowed image."""


SEEN_MAGIC = set()


def _strip_data_url(b64: str) -> str:
    if "," in b64[:128]:
        return b64.split(",", 1)[1]
    return b64


def decode_b64_image(b64: str) -> np.ndarray:
    """Decode a base64 data-URL (or raw base64) into an RGB numpy array.

    Validates size, magic bytes and decodability at the trust boundary.
    Images are processed in memory; nothing is written to disk.
    """
    if not b64 or not b64.strip():
        raise InvalidImageError("No image data provided.")
    try:
        raw = base64.b64decode(_strip_data_url(b64), validate=False)
    except Exception as exc:  # b64decode is lenient; validate=False kept for speed
        raise InvalidImageError("Invalid base64 payload.") from exc
    if not raw:
        raise InvalidImageError("Empty image payload.")
    if len(raw) > BIOMETRIC_MAX_IMAGE_BYTES:
        raise InvalidImageError("Image exceeds the %d KB size limit." % (BIOMETRIC_MAX_IMAGE_BYTES // 1024))

    head = raw[:16].ljust(16, b"\x00")
    if not any(head.startswith(m) for m in VALID_MAGIC):
        raise InvalidImageError("Unsupported image format. Only JPEG/PNG/BMP are accepted.")

    try:
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
        pil.verify()
    except Exception as exc:
        raise InvalidImageError("Image could not be decoded.") from exc
    try:
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
        return np.asarray(pil)
    except Exception as exc:
        raise InvalidImageError("Image could not be decoded.") from exc


def encode_jpeg_b64(rgb: np.ndarray, quality: int = 90) -> str:
    """Encode an RGB array into a JPEG base64 data URL (for test fixtures)."""
    from PIL import Image as _Image

    buf = io.BytesIO()
    _Image.fromarray(rgb).save(buf, format="JPEG", quality=quality)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def ensure_dir(path: str) -> None:
    parent = os.path.dirname(os.path.abspath(path))
    os.makedirs(parent, exist_ok=True)