from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class LookRequestStatus(StrEnum):
    pending = "pending"
    viewed = "viewed"
    quoted = "quoted"
    declined = "declined"


class LookRequest(SQLModel, table=True):
    __tablename__ = "look_requests"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    client_id: UUID = Field(index=True, foreign_key="users.id")
    artist_id: UUID = Field(index=True, foreign_key="users.id")

    look_id: str = Field(max_length=64)
    look_name: str = Field(max_length=120)
    look_caption: str = Field(max_length=240)

    client_photo_url: str = Field(max_length=512)
    generated_url: str = Field(max_length=512)

    message: str | None = Field(default=None, max_length=2000)

    status: LookRequestStatus = Field(default=LookRequestStatus.pending, index=True)
    quote: str | None = Field(default=None, max_length=240)

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    viewed_at: datetime | None = Field(default=None)
    responded_at: datetime | None = Field(default=None)
