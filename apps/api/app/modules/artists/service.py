from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.modules.artists.models import ArtistProfile
from app.modules.artists.schemas import ArtistRead
from app.modules.users.models import User, UserRole


def _to_read(user: User, profile: ArtistProfile) -> ArtistRead:
    return ArtistRead(
        id=user.id,
        name=user.display_name,
        handle=profile.handle,
        city=profile.city,
        specialty=profile.specialty,
        rating=profile.rating,
        response_time_hours=profile.response_time_hours,
        finishes=list(profile.finishes or []),
        years_experience=profile.years_experience,
        bio=profile.bio,
    )


async def list_artists(session: AsyncSession) -> list[ArtistRead]:
    rows = (
        await session.execute(
            select(User, ArtistProfile)
            .join(ArtistProfile, ArtistProfile.user_id == User.id)
            .where(User.role == UserRole.artist, User.is_active == True)  # noqa: E712
            .order_by(ArtistProfile.rating.desc(), User.display_name.asc())
        )
    ).all()
    return [_to_read(user, profile) for user, profile in rows]


async def get_artist(session: AsyncSession, artist_id: UUID) -> ArtistRead | None:
    row = (
        await session.execute(
            select(User, ArtistProfile)
            .join(ArtistProfile, ArtistProfile.user_id == User.id)
            .where(User.id == artist_id, User.role == UserRole.artist)
        )
    ).first()
    if row is None:
        return None
    user, profile = row
    return _to_read(user, profile)


async def ensure_artist_profile(
    session: AsyncSession, user: User, handle: str | None = None
) -> ArtistProfile:
    """Create a blank ArtistProfile row for a new artist user if missing."""
    existing = (
        await session.execute(
            select(ArtistProfile).where(ArtistProfile.user_id == user.id)
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    chosen = handle or user.email.split("@")[0].lower()
    # Ensure uniqueness with a numeric suffix if the obvious handle is taken.
    suffix = 0
    while True:
        candidate = chosen if suffix == 0 else f"{chosen}{suffix}"
        clash = (
            await session.execute(
                select(ArtistProfile).where(ArtistProfile.handle == candidate)
            )
        ).scalar_one_or_none()
        if clash is None:
            break
        suffix += 1

    profile = ArtistProfile(user_id=user.id, handle=candidate)
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile
