from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core.deps import DbSession
from app.core.security import decode_token
from app.modules.auth.schemas import (
    AuthResponse,
    RefreshRequest,
    SignInRequest,
    SignUpRequest,
    TokenPair,
)
from app.modules.auth.service import (
    authenticate,
    find_user_by_email,
    issue_tokens,
    register_user,
)
from app.modules.users.models import User
from app.modules.users.schemas import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sign-up", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def sign_up(payload: SignUpRequest, session: DbSession) -> AuthResponse:
    if await find_user_by_email(session, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists",
        )
    user = await register_user(session, payload)
    return AuthResponse(user=UserRead.model_validate(user), tokens=issue_tokens(user))


@router.post("/sign-in", response_model=AuthResponse)
async def sign_in(payload: SignInRequest, session: DbSession) -> AuthResponse:
    user = await authenticate(session, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return AuthResponse(user=UserRead.model_validate(user), tokens=issue_tokens(user))


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, session: DbSession) -> TokenPair:
    try:
        claims = decode_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        ) from exc
    if claims.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong token type"
        )
    subject = claims.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed refresh token"
        )
    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed subject"
        ) from exc
    user = (
        await session.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User unavailable")
    return issue_tokens(user)
