import base64
import binascii

from fastapi import APIRouter, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.deps import CurrentUser
from app.modules.media.storage import ALLOWED_MIME_TYPES, MEDIA_URL_PREFIX, resolve, save_bytes

router = APIRouter(prefix="/media", tags=["media"])

# Served outside the versioned prefix so stored URLs are stable: /media/<name>.
# Unauthenticated so <Image> tags can load them; names are random 128-bit ids.
public_router = APIRouter(tags=["media"])


class MediaUploadRead(BaseModel):
    url: str


class MediaDataUrlUpload(BaseModel):
    data_url: str = Field(min_length=16)


@router.post("", response_model=MediaUploadRead, status_code=status.HTTP_201_CREATED)
async def upload_photo(file: UploadFile, _user: CurrentUser) -> MediaUploadRead:
    """Stores one photo (selfie, inspiration shot) and returns its relative URL."""
    mime = _normalise_mime(file.content_type or "")
    # Read one byte past the limit so _store can reject oversize uploads.
    data = await file.read(get_settings().media_max_bytes + 1)
    return MediaUploadRead(url=_store(data, mime))


@router.post("/data-url", response_model=MediaUploadRead, status_code=status.HTTP_201_CREATED)
async def upload_data_url(payload: MediaDataUrlUpload, _user: CurrentUser) -> MediaUploadRead:
    """Same as POST /media, for images the app already holds as `data:` URIs."""
    header, sep, encoded = payload.data_url.partition(",")
    if not sep or not header.startswith("data:") or not header.endswith(";base64"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Expected a base64 data: URL"
        )
    mime = _normalise_mime(header.removeprefix("data:").removesuffix(";base64"))
    try:
        data = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64"
        ) from None
    return MediaUploadRead(url=_store(data, mime))


def _normalise_mime(mime: str) -> str:
    mime = mime.lower()
    mime = "image/jpeg" if mime == "image/jpg" else mime
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a JPEG, PNG or WebP image",
        )
    return mime


def _store(data: bytes, mime: str) -> str:
    if len(data) > get_settings().media_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Image is too large"
        )
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty upload")
    return save_bytes(data, mime)


@public_router.get(f"{MEDIA_URL_PREFIX}/{{name}}", include_in_schema=False)
async def get_photo(name: str) -> FileResponse:
    path = resolve(f"{MEDIA_URL_PREFIX}/{name}")
    if path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=31536000, immutable"})
