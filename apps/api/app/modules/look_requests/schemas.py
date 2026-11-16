from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.look_requests.models import LookRequestStatus
from app.modules.look_transfer.schemas import Recipe


class LookRequestCreate(BaseModel):
    artist_id: UUID
    look_id: str = Field(min_length=1, max_length=64)
    look_name: str = Field(min_length=1, max_length=120)
    look_caption: str = Field(min_length=1, max_length=240)
    client_photo_url: str = Field(min_length=1, max_length=2048)
    generated_url: str = Field(min_length=1, max_length=2048)
    message: str | None = Field(default=None, max_length=2000)
    reference_urls: list[str] | None = Field(default=None, max_length=3)
    recipe: Recipe | None = None


class LookRequestQuote(BaseModel):
    quote: str = Field(min_length=1, max_length=240)
    # Optional for backwards compatibility, but the client can only accept
    # (and book) a quote that has a proposed time.
    quoted_price: float | None = Field(default=None, ge=0, le=100_000_000)
    proposed_at: datetime | None = None


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
    reference_urls: list[str] | None = None
    recipe: Recipe | None = None
    message: str | None
    status: LookRequestStatus
    quote: str | None
    quoted_price: float | None = None
    proposed_at: datetime | None = None
    appointment_id: UUID | None = None
    # Display names, so neither side has to look the other up.
    client_name: str = ""
    artist_name: str = ""
    created_at: datetime
    viewed_at: datetime | None
    responded_at: datetime | None
