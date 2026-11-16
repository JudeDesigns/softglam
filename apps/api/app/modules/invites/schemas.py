from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.invites.models import InviteChannel, InviteStatus


class InviteCreate(BaseModel):
    client_name: str = Field(min_length=1, max_length=120)
    # Email or phone number; not needed for a share-link invite.
    contact: str = Field(default="", max_length=255)
    channel: InviteChannel
    message: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _contact_needed_unless_link(self) -> "InviteCreate":
        self.contact = self.contact.strip()
        if self.channel != InviteChannel.link and not self.contact:
            raise ValueError("Add an email or phone number, or share a link instead")
        return self


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
