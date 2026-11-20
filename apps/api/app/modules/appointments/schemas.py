from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Appointment schemas
# ---------------------------------------------------------------------------

class AppointmentProductRead(BaseModel):
    id: UUID
    appointment_id: UUID
    product_id: UUID | None
    product_name: str
    brand: str
    quantity: float
    unit_cost: float
    cogs: float  # quantity * unit_cost, computed in serialiser
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentRead(BaseModel):
    id: UUID
    artist_id: UUID
    client_id: UUID
    look_request_id: UUID | None
    scheduled_at: datetime
    duration_minutes: int
    location: str | None
    service_name: str
    notes: str | None
    quoted_price: float | None
    final_price: float | None
    status: str
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    cancelled_at: datetime | None
    client_name: str = ""
    artist_name: str = ""
    products: list[AppointmentProductRead] = []

    model_config = {"from_attributes": True}


MAX_PRICE = 100_000_000


class AppointmentCreate(BaseModel):
    client_id: UUID
    look_request_id: UUID | None = None
    scheduled_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=480)
    location: str | None = Field(default=None, max_length=512)
    service_name: str = Field(min_length=1, max_length=240)
    notes: str | None = Field(default=None, max_length=2000)
    quoted_price: float | None = Field(default=None, ge=0, le=MAX_PRICE)


class AppointmentUpdate(BaseModel):
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=15, le=480)
    location: str | None = Field(default=None, max_length=512)
    service_name: str | None = Field(default=None, min_length=1, max_length=240)
    notes: str | None = Field(default=None, max_length=2000)
    quoted_price: float | None = Field(default=None, ge=0, le=MAX_PRICE)
    final_price: float | None = Field(default=None, ge=0, le=MAX_PRICE)


# ---------------------------------------------------------------------------
# Appointment product schemas (COGS)
# ---------------------------------------------------------------------------

class AppointmentProductCreate(BaseModel):
    product_id: UUID | None = None
    product_name: str = Field(min_length=1, max_length=240)
    brand: str = Field(default="", max_length=120)
    quantity: float = Field(default=1.0, gt=0, le=10_000)
    unit_cost: float = Field(ge=0, le=MAX_PRICE)
