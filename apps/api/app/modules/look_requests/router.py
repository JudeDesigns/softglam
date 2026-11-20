from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.appointments.models import Appointment
from app.modules.artists.service import get_artist
from app.modules.look_requests.models import LookRequest, LookRequestStatus
from app.modules.look_requests.schemas import (
    LookRequestCreate,
    LookRequestQuote,
    LookRequestRead,
)
from app.modules.users.models import User, UserRole

router = APIRouter(prefix="/look-requests", tags=["look-requests"])

# Which statuses each artist/client action may move a request out of.
_CAN_QUOTE = {LookRequestStatus.pending, LookRequestStatus.viewed, LookRequestStatus.quoted}
_CAN_DECLINE = {LookRequestStatus.pending, LookRequestStatus.viewed, LookRequestStatus.quoted}


async def _load(session: DbSession, request_id: UUID) -> LookRequest:
    obj = (
        await session.execute(select(LookRequest).where(LookRequest.id == request_id))
    ).scalar_one_or_none()
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return obj


async def _to_read(session: DbSession, rows: Sequence[LookRequest]) -> list[LookRequestRead]:
    """Serialises requests with the client's and artist's display names (one query)."""
    ids = {r.client_id for r in rows} | {r.artist_id for r in rows}
    names: dict[UUID, str] = {}
    if ids:
        users = (await session.execute(select(User.id, User.display_name).where(User.id.in_(ids)))).all()
        names = {uid: name for uid, name in users}
    out: list[LookRequestRead] = []
    for r in rows:
        read = LookRequestRead.model_validate(r)
        read.client_name = names.get(r.client_id, "")
        read.artist_name = names.get(r.artist_id, "")
        out.append(read)
    return out


def _conflict(obj: LookRequest, action: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Can't {action} a request that is {obj.status.value}",
    )


@router.get("", response_model=list[LookRequestRead])
async def list_my_requests(user: CurrentUser, session: DbSession) -> list[LookRequestRead]:
    """Clients see requests they sent, artists those addressed to them, admins all."""
    q = select(LookRequest).order_by(LookRequest.created_at.desc())
    if user.role == UserRole.client:
        q = q.where(LookRequest.client_id == user.id)
    elif user.role == UserRole.artist:
        q = q.where(LookRequest.artist_id == user.id)
    rows = (await session.execute(q)).scalars().all()
    return await _to_read(session, rows)


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
        reference_urls=payload.reference_urls,
        recipe=(
            {k.value: v.model_dump() for k, v in payload.recipe.items()}
            if payload.recipe
            else None
        ),
        message=payload.message,
    )
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return (await _to_read(session, [obj]))[0]


def _assert_party(user, obj: LookRequest) -> None:
    is_client = user.role == UserRole.client and obj.client_id == user.id
    is_artist = user.role == UserRole.artist and obj.artist_id == user.id
    is_admin = user.role == UserRole.admin
    if not (is_client or is_artist or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.get("/{request_id}", response_model=LookRequestRead)
async def get_request(
    request_id: UUID, user: CurrentUser, session: DbSession
) -> LookRequestRead:
    obj = await _load(session, request_id)
    _assert_party(user, obj)
    return (await _to_read(session, [obj]))[0]


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
    return (await _to_read(session, [obj]))[0]


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
    if obj.status not in _CAN_QUOTE:
        raise _conflict(obj, "quote")
    if payload.proposed_at is not None and payload.proposed_at <= datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Proposed time must be in the future",
        )
    obj.status = LookRequestStatus.quoted
    obj.quote = payload.quote
    obj.quoted_price = payload.quoted_price
    obj.proposed_at = payload.proposed_at
    obj.responded_at = datetime.now(UTC)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return (await _to_read(session, [obj]))[0]


@router.post("/{request_id}/decline", response_model=LookRequestRead)
async def decline_request(
    request_id: UUID, user: CurrentUser, session: DbSession
) -> LookRequestRead:
    if user.role != UserRole.artist:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artists only")
    obj = await _load(session, request_id)
    _assert_party(user, obj)
    if obj.status not in _CAN_DECLINE:
        raise _conflict(obj, "decline")
    obj.status = LookRequestStatus.declined
    obj.responded_at = datetime.now(UTC)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return (await _to_read(session, [obj]))[0]


@router.post("/{request_id}/accept", response_model=LookRequestRead)
async def accept_quote(
    request_id: UUID, user: CurrentUser, session: DbSession
) -> LookRequestRead:
    """Client accepts the artist's quote, which books an appointment at the proposed time."""
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clients only")
    obj = await _load(session, request_id)
    _assert_party(user, obj)
    if obj.status != LookRequestStatus.quoted:
        raise _conflict(obj, "accept")
    if obj.proposed_at is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This quote has no proposed time yet. Ask your artist to update it.",
        )

    now = datetime.now(UTC)
    appointment = Appointment(
        artist_id=obj.artist_id,
        client_id=obj.client_id,
        look_request_id=obj.id,
        scheduled_at=obj.proposed_at,
        service_name=obj.look_name,
        notes=obj.message,
        quoted_price=obj.quoted_price,
    )
    session.add(appointment)
    await session.flush()

    obj.status = LookRequestStatus.accepted
    obj.appointment_id = appointment.id
    obj.responded_at = obj.responded_at or now
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return (await _to_read(session, [obj]))[0]
