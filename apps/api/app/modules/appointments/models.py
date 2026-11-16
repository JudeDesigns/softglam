from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import String
from sqlmodel import Field, SQLModel

from app.core.db_types import TZDateTime


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
    scheduled_at: datetime = Field(sa_type=TZDateTime, index=True)
    duration_minutes: int = Field(default=60, ge=15, le=480)

    # Location
    location: str | None = Field(default=None, max_length=512)

    # Service details
    service_name: str = Field(max_length=240)
    notes: str | None = Field(default=None, max_length=2000)

    # Pricing
    quoted_price: float | None = Field(default=None, ge=0)
    final_price: float | None = Field(default=None, ge=0)

    # Stored as VARCHAR(32), not a Postgres enum (see migration b2c3d4e5f6a7);
    # without sa_type the insert asks for a non-existent "appointmentstatus" type.
    status: AppointmentStatus = Field(
        default=AppointmentStatus.booked, sa_type=String(32), index=True
    )

    created_at: datetime = Field(sa_type=TZDateTime, default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(sa_type=TZDateTime, default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = Field(sa_type=TZDateTime, default=None)
    cancelled_at: datetime | None = Field(sa_type=TZDateTime, default=None)


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

    created_at: datetime = Field(sa_type=TZDateTime, default_factory=lambda: datetime.now(UTC))
