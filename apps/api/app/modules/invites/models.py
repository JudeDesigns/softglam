from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class InviteChannel(StrEnum):
    email = "email"
    sms = "sms"
    link = "link"


class InviteStatus(StrEnum):
    sent = "sent"
    accepted = "accepted"
    expired = "expired"


class Invite(SQLModel, table=True):
    __tablename__ = "invites"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    artist_id: UUID = Field(index=True, foreign_key="users.id")
    accepted_by_client_id: UUID | None = Field(default=None, foreign_key="users.id")

    client_name: str = Field(max_length=120)
    contact: str = Field(max_length=255)
    channel: InviteChannel
    message: str | None = Field(default=None, max_length=2000)

    # Short opaque token the client redeems to accept.
    code: str = Field(index=True, unique=True, max_length=32)

    status: InviteStatus = Field(default=InviteStatus.sent, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    accepted_at: datetime | None = Field(default=None)
