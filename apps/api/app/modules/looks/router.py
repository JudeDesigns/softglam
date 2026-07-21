from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.looks.generation import generate_look_preview
from app.modules.looks.models import Look, LookSection
from app.modules.looks.schemas import (
    LookCreate,
    LookPreviewGenerate,
    LookRead,
    LookSectionCreate,
    LookSectionRead,
    LookSectionUpdate,
    LookShades,
    LookUpdate,
)
from app.modules.users.models import UserRole

router = APIRouter(prefix="/looks", tags=["looks"])


def _require_admin(user: CurrentUser) -> None:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")


def _to_look_read(look: Look) -> LookRead:
    return LookRead(
        id=look.id,
        name=look.name,
        caption=look.caption,
        finish=look.finish,
        shades=LookShades(lip=look.shade_lip, cheek=look.shade_cheek, eye=look.shade_eye),
        preview_image_url=look.preview_image_url,
    )


async def _get_section_or_404(session: DbSession, section_id: str) -> LookSection:
    section = (
        await session.execute(select(LookSection).where(LookSection.id == section_id))
    ).scalar_one_or_none()
    if section is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return section


async def _get_look_or_404(session: DbSession, look_id: str) -> Look:
    look = (await session.execute(select(Look).where(Look.id == look_id))).scalar_one_or_none()
    if look is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Look not found")
    return look


# ---------------------------------------------------------------------------
# Public reads — unchanged contract for the mobile app
# ---------------------------------------------------------------------------


@router.get("/sections", response_model=list[LookSectionRead])
async def list_sections(session: DbSession) -> list[LookSectionRead]:
    sections = (
        await session.execute(select(LookSection).order_by(LookSection.sort_order))
    ).scalars().all()
    looks = (await session.execute(select(Look).order_by(Look.sort_order))).scalars().all()
    by_section: dict[str, list[Look]] = {}
    for look in looks:
        by_section.setdefault(look.section_id, []).append(look)

    return [
        LookSectionRead(
            id=section.id,
            title=section.title,
            subtitle=section.subtitle,
            looks=[_to_look_read(l) for l in by_section.get(section.id, [])],
        )
        for section in sections
    ]


@router.get("/{look_id}", response_model=LookRead)
async def get_look(look_id: str, session: DbSession) -> LookRead:
    look = await _get_look_or_404(session, look_id)
    return _to_look_read(look)


# ---------------------------------------------------------------------------
# Admin — section CRUD
# ---------------------------------------------------------------------------


@router.post("/sections", response_model=LookSectionRead, status_code=status.HTTP_201_CREATED)
async def create_section(
    payload: LookSectionCreate, user: CurrentUser, session: DbSession
) -> LookSectionRead:
    _require_admin(user)
    existing = (
        await session.execute(select(LookSection).where(LookSection.id == payload.id))
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Section id already exists")
    section = LookSection(**payload.model_dump())
    session.add(section)
    await session.commit()
    await session.refresh(section)
    return LookSectionRead(id=section.id, title=section.title, subtitle=section.subtitle, looks=[])


@router.patch("/sections/{section_id}", response_model=LookSectionRead)
async def update_section(
    section_id: str, payload: LookSectionUpdate, user: CurrentUser, session: DbSession
) -> LookSectionRead:
    _require_admin(user)
    section = await _get_section_or_404(session, section_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(section, field, value)
    session.add(section)
    await session.commit()
    await session.refresh(section)
    looks = (
        await session.execute(
            select(Look).where(Look.section_id == section.id).order_by(Look.sort_order)
        )
    ).scalars().all()
    return LookSectionRead(
        id=section.id, title=section.title, subtitle=section.subtitle,
        looks=[_to_look_read(l) for l in looks],
    )


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(section_id: str, user: CurrentUser, session: DbSession) -> None:
    _require_admin(user)
    section = await _get_section_or_404(session, section_id)
    looks = (
        await session.execute(select(Look).where(Look.section_id == section_id))
    ).scalars().all()
    if looks:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a section that still has looks",
        )
    await session.delete(section)
    await session.commit()


# ---------------------------------------------------------------------------
# Admin — look CRUD
# ---------------------------------------------------------------------------


@router.post("", response_model=LookRead, status_code=status.HTTP_201_CREATED)
async def create_look(payload: LookCreate, user: CurrentUser, session: DbSession) -> LookRead:
    _require_admin(user)
    await _get_section_or_404(session, payload.section_id)
    existing = (await session.execute(select(Look).where(Look.id == payload.id))).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Look id already exists")

    look = Look(
        id=payload.id,
        section_id=payload.section_id,
        name=payload.name,
        caption=payload.caption,
        finish=payload.finish,
        shade_lip=payload.shades.lip,
        shade_cheek=payload.shades.cheek,
        shade_eye=payload.shades.eye,
        sort_order=payload.sort_order,
    )
    session.add(look)
    await session.commit()
    await session.refresh(look)
    return _to_look_read(look)


@router.patch("/{look_id}", response_model=LookRead)
async def update_look(
    look_id: str, payload: LookUpdate, user: CurrentUser, session: DbSession
) -> LookRead:
    _require_admin(user)
    look = await _get_look_or_404(session, look_id)

    data = payload.model_dump(exclude_unset=True)
    shades = data.pop("shades", None)
    if shades:
        look.shade_lip = shades["lip"]
        look.shade_cheek = shades["cheek"]
        look.shade_eye = shades["eye"]
    if "section_id" in data:
        await _get_section_or_404(session, data["section_id"])
    for field, value in data.items():
        setattr(look, field, value)

    session.add(look)
    await session.commit()
    await session.refresh(look)
    return _to_look_read(look)


@router.delete("/{look_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_look(look_id: str, user: CurrentUser, session: DbSession) -> None:
    _require_admin(user)
    look = await _get_look_or_404(session, look_id)
    await session.delete(look)
    await session.commit()


# ---------------------------------------------------------------------------
# Admin — AI preview generation
# ---------------------------------------------------------------------------


@router.post("/{look_id}/generate-preview", response_model=LookRead)
async def generate_preview(
    look_id: str, payload: LookPreviewGenerate, user: CurrentUser, session: DbSession
) -> LookRead:
    _require_admin(user)
    look = await _get_look_or_404(session, look_id)

    try:
        preview_url = await generate_look_preview(look, payload.photo_data_url)
    except Exception as exc:  # noqa: BLE001 — surface as a clean 502 to the admin UI
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Preview generation failed: {exc}"
        ) from exc

    look.preview_image_url = preview_url
    look.preview_generated_at = datetime.now(UTC)
    session.add(look)
    await session.commit()
    await session.refresh(look)
    return _to_look_read(look)
