from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class ArtistProfile(SQLModel, table=True):
    """One-to-one extension of `users` for accounts with role=artist.

    Created lazily on first access (sign-up auto-creates a row when role=artist)
    so the row can be patched independently as the artist completes their bio.
    """

    __tablename__ = "artist_profiles"

    user_id: UUID = Field(primary_key=True, foreign_key="users.id")
    handle: str = Field(unique=True, index=True, max_length=64)
    city: str = Field(default="", max_length=120)
    specialty: str = Field(default="", max_length=160)
    rating: float = Field(default=5.0, ge=0.0, le=5.0)
    response_time_hours: int = Field(default=24, ge=1)
    finishes: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    years_experience: int = Field(default=0, ge=0)
    bio: str | None = Field(default=None, max_length=600)

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
