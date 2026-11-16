from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, DateTime, Text
from sqlmodel import Field, SQLModel


class LookRequestStatus(StrEnum):
    pending = "pending"
    viewed = "viewed"
    quoted = "quoted"
    declined = "declined"
    accepted = "accepted"  # client accepted the quote; an appointment was booked


class LookRequest(SQLModel, table=True):
    __tablename__ = "look_requests"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    client_id: UUID = Field(index=True, foreign_key="users.id")
    artist_id: UUID = Field(index=True, foreign_key="users.id")

    look_id: str = Field(max_length=64)
    look_name: str = Field(max_length=120)
    look_caption: str = Field(max_length=240)

    client_photo_url: str = Field(sa_column=Column(Text, nullable=False))
    generated_url: str = Field(sa_column=Column(Text, nullable=False))

    # "Copy a look" requests: the inspiration photos and the per-feature recipe
    # ({feature: {source, intensity}}). Both null for catalog-look requests.
    reference_urls: list[str] | None = Field(default=None, sa_column=Column(JSON, nullable=True))
    recipe: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON, nullable=True))

    message: str | None = Field(default=None, max_length=2000)

    status: LookRequestStatus = Field(default=LookRequestStatus.pending, index=True)
    quote: str | None = Field(default=None, max_length=240)
    # Structured part of the artist's quote, needed to book when the client accepts.
    quoted_price: float | None = Field(default=None)
    proposed_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    appointment_id: UUID | None = Field(default=None, foreign_key="appointments.id")

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    viewed_at: datetime | None = Field(default=None)
    responded_at: datetime | None = Field(default=None)
