from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.look_requests.models import LookRequestStatus


class LookRequestCreate(BaseModel):
    artist_id: UUID
    look_id: str = Field(min_length=1, max_length=64)
    look_name: str = Field(min_length=1, max_length=120)
    look_caption: str = Field(min_length=1, max_length=240)
    client_photo_url: str = Field(min_length=1, max_length=512)
    generated_url: str = Field(min_length=1, max_length=512)
    message: str | None = Field(default=None, max_length=2000)


class LookRequestQuote(BaseModel):
    quote: str = Field(min_length=1, max_length=240)


class LookRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    artist_id: UUID
    look_id: str
    look_name: str
    look_caption: str
    client_photo_url: str
    generated_url: str
    message: str | None
    status: LookRequestStatus
    quote: str | None
    created_at: datetime
    viewed_at: datetime | None
    responded_at: datetime | None
