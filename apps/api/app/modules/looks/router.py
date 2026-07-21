from fastapi import APIRouter, HTTPException, status

from app.modules.looks.catalog import LOOK_SECTIONS, find_look
from app.modules.looks.schemas import LookRead, LookSectionRead

router = APIRouter(prefix="/looks", tags=["looks"])


@router.get("/sections", response_model=list[LookSectionRead])
async def list_sections() -> list[LookSectionRead]:
    return LOOK_SECTIONS


@router.get("/{look_id}", response_model=LookRead)
async def get_look(look_id: str) -> LookRead:
    look = find_look(look_id)
    if look is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Look not found")
    return look
