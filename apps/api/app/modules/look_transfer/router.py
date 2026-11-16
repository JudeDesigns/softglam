from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser
from app.core.gemini import GeminiError
from app.modules.look_transfer import service
from app.modules.look_transfer.schemas import (
    CatalogLookApply,
    LookTransferCreate,
    LookTransferRead,
)
from app.modules.media.storage import load_inline, save_inline
from app.modules.users.models import UserRole

router = APIRouter(prefix="/look-transfer", tags=["look-transfer"])


@router.post("", response_model=LookTransferRead)
async def create_transfer(payload: LookTransferCreate, user: CurrentUser) -> LookTransferRead:
    """Copies makeup from the inspiration photos onto the selfie, per the recipe.

    All image URLs must be photos previously uploaded via POST /media, so the
    server never fetches arbitrary URLs.
    """
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clients only")

    selfie = load_inline(payload.selfie_url)
    references = [load_inline(u) for u in payload.reference_urls]
    if selfie is None or any(r is None for r in references):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Upload photos with POST /media first",
        )

    try:
        image, validation = await service.transfer(
            selfie, [r for r in references if r is not None], payload.features
        )
    except GeminiError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Look generation failed: {exc}"
        ) from exc

    return LookTransferRead(generated_url=save_inline(image), validation=validation)


@router.post("/catalog", response_model=LookTransferRead)
async def apply_catalog_look(payload: CatalogLookApply, user: CurrentUser) -> LookTransferRead:
    """Applies one of the app's catalog looks to an uploaded selfie.

    Runs Gemini on the server so the API key never ships inside the mobile app.
    """
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clients only")
    selfie = load_inline(payload.selfie_url)
    if selfie is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Upload photos with POST /media first",
        )
    try:
        image, validation = await service.apply_catalog_look(
            selfie, payload.look, payload.tone_tier
        )
    except GeminiError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Look generation failed: {exc}"
        ) from exc
    return LookTransferRead(generated_url=save_inline(image), validation=validation)
