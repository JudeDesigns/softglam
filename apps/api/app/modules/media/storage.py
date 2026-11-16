"""Local-disk photo storage, served by the app at MEDIA_URL_PREFIX.

Stored references are *relative* paths like ``/media/<uuid>.jpg`` so they work
no matter which host/LAN IP a client used to reach the API; clients prefix them
with the API origin. Replace this module to move to S3.
"""

import base64
import re
from pathlib import Path
from uuid import uuid4

from app.core.config import get_settings
from app.core.gemini import InlineImage

MEDIA_URL_PREFIX = "/media"

ALLOWED_MIME_TYPES: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
_EXT_TO_MIME = {ext: mime for mime, ext in ALLOWED_MIME_TYPES.items()}
_NAME_RE = re.compile(r"^[0-9a-f]{32}\.(jpg|png|webp)$")


def media_root() -> Path:
    root = Path(get_settings().media_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_bytes(data: bytes, mime_type: str) -> str:
    """Writes `data` to the media store and returns its relative URL."""
    ext = ALLOWED_MIME_TYPES.get(mime_type)
    if ext is None:
        raise ValueError(f"Unsupported image type: {mime_type}")
    name = f"{uuid4().hex}.{ext}"
    (media_root() / name).write_bytes(data)
    return f"{MEDIA_URL_PREFIX}/{name}"


def save_inline(image: InlineImage) -> str:
    return save_bytes(base64.b64decode(image.data_b64), image.mime_type)


def resolve(url: str) -> Path | None:
    """Maps a stored media URL back to its file, or None if it isn't one of ours."""
    prefix = f"{MEDIA_URL_PREFIX}/"
    if not url.startswith(prefix):
        return None
    name = url[len(prefix) :]
    if not _NAME_RE.match(name):
        return None
    path = media_root() / name
    return path if path.is_file() else None


def load_inline(url: str) -> InlineImage | None:
    path = resolve(url)
    if path is None:
        return None
    mime = _EXT_TO_MIME[path.suffix.lstrip(".")]
    return InlineImage(mime, base64.b64encode(path.read_bytes()).decode())
