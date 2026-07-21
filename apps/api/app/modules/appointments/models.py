from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class AppointmentStatus(StrEnum):
    booked = "booked"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class Appointment(SQLModel, table=True):
    """
    A booking between an artist and a client.

    Created from a look_request (when the artist quotes and the client accepts)
    or manually by the artist. Tracks the scheduled time, duration, location,
    and per-item COGS (cost of goods sold) via appointment_products.
    """

    __tablename__ = "appointments"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    artist_id: UUID = Field(index=True, foreign_key="users.id")
    client_id: UUID = Field(index=True, foreign_key="users.id")

    # Optionally linked to the look_request that initiated the booking.
    look_request_id: UUID | None = Field(default=None, foreign_key="look_requests.id")

    # Scheduling
    scheduled_at: datetime = Field(index=True)
    duration_minutes: int = Field(default=60, ge=15, le=480)

    # Location
    location: str | None = Field(default=None, max_length=512)

    # Service details
    service_name: str = Field(max_length=240)
    notes: str | None = Field(default=None, max_length=2000)

    # Pricing
    quoted_price: float | None = Field(default=None, ge=0)
    final_price: float | None = Field(default=None, ge=0)

    status: AppointmentStatus = Field(default=AppointmentStatus.booked, index=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = Field(default=None)
    cancelled_at: datetime | None = Field(default=None)


class AppointmentProduct(SQLModel, table=True):
    """
    A product used during an appointment — feeds COGS reporting.
    Each row is one SKU used; quantity tracks units consumed.
    """

    __tablename__ = "appointment_products"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    appointment_id: UUID = Field(index=True, foreign_key="appointments.id")
    product_id: UUID | None = Field(default=None, foreign_key="products.id")

    # Allow free-text name for products not yet in the catalog.
    product_name: str = Field(max_length=240)
    brand: str = Field(max_length=120)
    quantity: float = Field(default=1.0, ge=0)
    unit_cost: float = Field(ge=0)

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
