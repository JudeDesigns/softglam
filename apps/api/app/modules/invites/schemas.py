from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.invites.models import InviteChannel, InviteStatus


class InviteCreate(BaseModel):
    client_name: str = Field(min_length=1, max_length=120)
    contact: str = Field(min_length=1, max_length=255)
    channel: InviteChannel
    message: str | None = Field(default=None, max_length=2000)


class InviteAccept(BaseModel):
    code: str = Field(min_length=1, max_length=32)


class InviteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    artist_id: UUID
    accepted_by_client_id: UUID | None
    client_name: str
    contact: str
    channel: InviteChannel
    message: str | None
    code: str
    status: InviteStatus
    created_at: datetime
    accepted_at: datetime | None
