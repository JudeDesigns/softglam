from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.skin_profiles.constants import compute_health_score
from app.modules.skin_profiles.models import SkinProfile
from app.modules.skin_profiles.schemas import SkinProfileRead, SkinProfileUpsert

router = APIRouter(prefix="/skin-profiles", tags=["skin-profiles"])


@router.get("/me", response_model=SkinProfileRead)
async def get_my_profile(user: CurrentUser, session: DbSession) -> SkinProfileRead:
    profile = (
        await session.execute(select(SkinProfile).where(SkinProfile.user_id == user.id))
    ).scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No skin profile yet")
    return SkinProfileRead.model_validate(profile)


@router.put("/me", response_model=SkinProfileRead)
async def upsert_my_profile(
    payload: SkinProfileUpsert,
    user: CurrentUser,
    session: DbSession,
) -> SkinProfileRead:
    concerns = {c.value: int(v) for c, v in payload.concerns.items()}
    zone_tags = [t.model_dump(mode="json") for t in payload.zone_tags]
    score = compute_health_score(concerns)

    existing = (
        await session.execute(select(SkinProfile).where(SkinProfile.user_id == user.id))
    ).scalar_one_or_none()
    now = datetime.now(UTC)
    if existing is None:
        existing = SkinProfile(
            user_id=user.id,
            tone_tier=payload.tone_tier,
            skin_type=payload.skin_type.value,
            concerns=concerns,
            zone_tags=zone_tags,
            health_score=score,
            captured_at=now,
            updated_at=now,
        )
    else:
        existing.tone_tier = payload.tone_tier
        existing.skin_type = payload.skin_type.value
        existing.concerns = concerns
        existing.zone_tags = zone_tags
        existing.health_score = score
        existing.updated_at = now
    session.add(existing)
    await session.commit()
    await session.refresh(existing)
    return SkinProfileRead.model_validate(existing)
