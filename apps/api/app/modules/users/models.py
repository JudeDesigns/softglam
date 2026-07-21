from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class UserRole(StrEnum):
    client = "client"
    artist = "artist"
    admin = "admin"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=255)
    password_hash: str = Field(max_length=255)
    role: UserRole = Field(default=UserRole.client, index=True)
    display_name: str = Field(max_length=120)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
