from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import create_token, hash_password, verify_password
from app.modules.artists.service import ensure_artist_profile
from app.modules.auth.schemas import SignUpRequest, TokenPair
from app.modules.users.models import User, UserRole


async def find_user_by_email(session: AsyncSession, email: str) -> User | None:
    normalized = email.strip().lower()
    return (
        await session.execute(select(User).where(User.email == normalized))
    ).scalar_one_or_none()


async def register_user(session: AsyncSession, payload: SignUpRequest) -> User:
    user = User(
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        display_name=payload.display_name.strip(),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    if user.role == UserRole.artist:
        await ensure_artist_profile(session, user)
    return user


async def authenticate(session: AsyncSession, email: str, password: str) -> User | None:
    user = await find_user_by_email(session, email)
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def issue_tokens(user: User) -> TokenPair:
    extras = {"role": user.role.value}
    return TokenPair(
        access_token=create_token(str(user.id), "access", extras),
        refresh_token=create_token(str(user.id), "refresh", extras),
    )
