from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.deps import CurrentUser, DbSession
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(user: CurrentUser, session: DbSession) -> list[UserRead]:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    rows = (
        await session.execute(select(User).order_by(User.created_at.desc()))
    ).scalars().all()
    return [UserRead.model_validate(r) for r in rows]


@router.get("/me", response_model=UserRead)
async def get_me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.patch("/me", response_model=UserRead)
async def update_me(payload: UserUpdate, user: CurrentUser, session: DbSession) -> UserRead:
    if payload.display_name is not None:
        user.display_name = payload.display_name
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return UserRead.model_validate(user)
