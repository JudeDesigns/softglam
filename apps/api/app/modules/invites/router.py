import secrets
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.invites.models import Invite, InviteStatus
from app.modules.invites.schemas import InviteAccept, InviteCreate, InviteRead
from app.modules.users.models import UserRole

router = APIRouter(prefix="/invites", tags=["invites"])


def _make_code() -> str:
    return secrets.token_urlsafe(12).replace("_", "").replace("-", "")[:16]


@router.get("", response_model=list[InviteRead])
async def list_my_invites(user: CurrentUser, session: DbSession) -> list[InviteRead]:
    if user.role == UserRole.admin:
        # Admins see all invites
        rows = (
            await session.execute(
                select(Invite).order_by(Invite.created_at.desc())
            )
        ).scalars().all()
    elif user.role == UserRole.artist:
        rows = (
            await session.execute(
                select(Invite)
                .where(Invite.artist_id == user.id)
                .order_by(Invite.created_at.desc())
            )
        ).scalars().all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artists or admins only")
    return [InviteRead.model_validate(r) for r in rows]


@router.post("", response_model=InviteRead, status_code=status.HTTP_201_CREATED)
async def create_invite(
    payload: InviteCreate, user: CurrentUser, session: DbSession
) -> InviteRead:
    if user.role != UserRole.artist:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artists only")
    invite = Invite(
        artist_id=user.id,
        client_name=payload.client_name,
        contact=payload.contact,
        channel=payload.channel,
        message=payload.message,
        code=_make_code(),
    )
    session.add(invite)
    await session.commit()
    await session.refresh(invite)
    return InviteRead.model_validate(invite)


@router.post("/accept", response_model=InviteRead)
async def accept_invite(
    payload: InviteAccept, user: CurrentUser, session: DbSession
) -> InviteRead:
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clients only")
    invite = (
        await session.execute(select(Invite).where(Invite.code == payload.code))
    ).scalar_one_or_none()
    if invite is None or invite.status != InviteStatus.sent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not redeemable"
        )
    invite.status = InviteStatus.accepted
    invite.accepted_at = datetime.now(UTC)
    invite.accepted_by_client_id = user.id
    session.add(invite)
    await session.commit()
    await session.refresh(invite)
    return InviteRead.model_validate(invite)
