from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
    products: list[AppointmentProductRead] = []

    model_config = {"from_attributes": True}


class AppointmentCreate(BaseModel):
    client_id: UUID
    look_request_id: UUID | None = None
    scheduled_at: datetime
    duration_minutes: int = 60
    location: str | None = None
    service_name: str
    notes: str | None = None
    quoted_price: float | None = None


class AppointmentUpdate(BaseModel):
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    location: str | None = None
    service_name: str | None = None
    notes: str | None = None
    quoted_price: float | None = None
    final_price: float | None = None


# ---------------------------------------------------------------------------
# Appointment product schemas (COGS)
# ---------------------------------------------------------------------------

class AppointmentProductCreate(BaseModel):
    product_id: UUID | None = None
    product_name: str
    brand: str
    quantity: float = 1.0
    unit_cost: float
