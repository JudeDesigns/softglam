from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.artists.models import ArtistProfile
from app.modules.artists.schemas import ArtistProfileUpdate, ArtistRead
from app.modules.artists.service import ensure_artist_profile, get_artist, list_artists
from app.modules.users.models import UserRole

router = APIRouter(prefix="/artists", tags=["artists"])


@router.get("", response_model=list[ArtistRead])
async def list_all(session: DbSession) -> list[ArtistRead]:
    return await list_artists(session)


@router.get("/me", response_model=ArtistRead)
async def get_my_artist_profile(user: CurrentUser, session: DbSession) -> ArtistRead:
    if user.role != UserRole.artist:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artists only")
    await ensure_artist_profile(session, user)
    result = await get_artist(session, user.id)
    assert result is not None
    return result


@router.patch("/me", response_model=ArtistRead)
async def update_my_artist_profile(
    payload: ArtistProfileUpdate, user: CurrentUser, session: DbSession
) -> ArtistRead:
    if user.role != UserRole.artist:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artists only")
    profile = await ensure_artist_profile(session, user)

    if payload.handle is not None and payload.handle != profile.handle:
        clash = (
            await session.execute(
                select(ArtistProfile).where(ArtistProfile.handle == payload.handle)
            )
        ).scalar_one_or_none()
        if clash is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Handle is taken"
            )
        profile.handle = payload.handle

    if payload.city is not None:
        profile.city = payload.city
    if payload.specialty is not None:
        profile.specialty = payload.specialty
    if payload.finishes is not None:
        profile.finishes = [f.value for f in payload.finishes]
    if payload.years_experience is not None:
        profile.years_experience = payload.years_experience
    if payload.bio is not None:
        profile.bio = payload.bio
    profile.updated_at = datetime.now(UTC)

    session.add(profile)
    await session.commit()
    await session.refresh(profile)

    result = await get_artist(session, user.id)
    assert result is not None
    return result


@router.get("/{artist_id}", response_model=ArtistRead)
async def get_one(artist_id: UUID, session: DbSession) -> ArtistRead:
    artist = await get_artist(session, artist_id)
    if artist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")
    return artist
