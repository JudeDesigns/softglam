from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import get_settings
from app.core.database import get_session
from app.core.security import decode_token
from app.modules.users.models import User, UserRole

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/sign-in")

DbSession = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: DbSession,
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
    except ValueError:
        raise credentials_error from None
    if payload.get("type") != "access":
        raise credentials_error
    subject = payload.get("sub")
    if not subject:
        raise credentials_error
    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise credentials_error from exc

    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_error
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole) -> Callable[[User], User]:
    """Dependency factory that ensures the current user has one of the given roles."""

    async def _checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden for this role",
            )
        return user

    return _checker
