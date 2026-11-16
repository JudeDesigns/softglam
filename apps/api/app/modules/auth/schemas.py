from enum import StrEnum

from pydantic import BaseModel, EmailStr, Field

from app.modules.users.schemas import UserRead


class SignUpRole(StrEnum):
    """Roles anyone may pick at sign-up. Admins are created with
    `python -m app.scripts.create_admin`, never through the public API."""

    client = "client"
    artist = "artist"


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)
    role: SignUpRole = SignUpRole.client


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPair
