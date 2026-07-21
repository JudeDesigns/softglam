from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.artists.service import get_artist
from app.modules.look_requests.models import LookRequest, LookRequestStatus
from app.modules.look_requests.schemas import (
    LookRequestCreate,
    LookRequestQuote,
    LookRequestRead,
)
from app.modules.users.models import UserRole

router = APIRouter(prefix="/look-requests", tags=["look-requests"])


async def _load(session: DbSession, request_id: UUID) -> LookRequest:
    obj = (
        await session.execute(select(LookRequest).where(LookRequest.id == request_id))
    ).scalar_one_or_none()
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return obj


@router.get("", response_model=list[LookRequestRead])
async def list_my_requests(user: CurrentUser, session: DbSession) -> list[LookRequestRead]:
    """Clients see requests they sent. Artists see requests addressed to them."""
    column = LookRequest.client_id if user.role == UserRole.client else LookRequest.artist_id
    rows = (
        await session.execute(
            select(LookRequest)
            .where(column == user.id)
            .order_by(LookRequest.created_at.desc())
        )
    ).scalars().all()
    return [LookRequestRead.model_validate(r) for r in rows]


@router.post("", response_model=LookRequestRead, status_code=status.HTTP_201_CREATED)
async def create_request(
    payload: LookRequestCreate,
    user: CurrentUser,
    session: DbSession,
) -> LookRequestRead:
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clients only")
    if await get_artist(session, payload.artist_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found"
        )

    obj = LookRequest(
        client_id=user.id,
        artist_id=payload.artist_id,
        look_id=payload.look_id,
        look_name=payload.look_name,
        look_caption=payload.look_caption,
        client_photo_url=payload.client_photo_url,
        generated_url=payload.generated_url,
        message=payload.message,
    )
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return LookRequestRead.model_validate(obj)


def _assert_party(user, obj: LookRequest) -> None:
    is_client = user.role == UserRole.client and obj.client_id == user.id
    is_artist = user.role == UserRole.artist and obj.artist_id == user.id
    if not (is_client or is_artist):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.get("/{request_id}", response_model=LookRequestRead)
async def get_request(
    request_id: UUID, user: CurrentUser, session: DbSession
) -> LookRequestRead:
    obj = await _load(session, request_id)
    _assert_party(user, obj)
    return LookRequestRead.model_validate(obj)


@router.post("/{request_id}/mark-viewed", response_model=LookRequestRead)
async def mark_viewed(
    request_id: UUID, user: CurrentUser, session: DbSession
) -> LookRequestRead:
    if user.role != UserRole.artist:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artists only")
    obj = await _load(session, request_id)
    _assert_party(user, obj)
    if obj.status == LookRequestStatus.pending:
        obj.status = LookRequestStatus.viewed
        obj.viewed_at = datetime.now(UTC)
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
    return LookRequestRead.model_validate(obj)


@router.post("/{request_id}/quote", response_model=LookRequestRead)
async def quote_request(
    request_id: UUID,
    payload: LookRequestQuote,
    user: CurrentUser,
    session: DbSession,
) -> LookRequestRead:
    if user.role != UserRole.artist:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artists only")
    obj = await _load(session, request_id)
    _assert_party(user, obj)
    obj.status = LookRequestStatus.quoted
    obj.quote = payload.quote
    obj.responded_at = datetime.now(UTC)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return LookRequestRead.model_validate(obj)


@router.post("/{request_id}/decline", response_model=LookRequestRead)
async def decline_request(
    request_id: UUID, user: CurrentUser, session: DbSession
) -> LookRequestRead:
    if user.role != UserRole.artist:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artists only")
    obj = await _load(session, request_id)
    _assert_party(user, obj)
    obj.status = LookRequestStatus.declined
    obj.responded_at = datetime.now(UTC)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return LookRequestRead.model_validate(obj)
