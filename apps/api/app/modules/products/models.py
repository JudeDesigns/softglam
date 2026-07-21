from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Product(SQLModel, table=True):
    """Catalog product. Seeded by admin; browsable by all authenticated users."""

    __tablename__ = "products"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    brand: str = Field(max_length=120, index=True)
    name: str = Field(max_length=240)
    price: float = Field(ge=0.0)
    health_score: int = Field(default=0, ge=0, le=100)
    is_toxin_free: bool = Field(default=False)
    # JSON arrays: list[str] skin concern keys the product targets
    targets: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    # JSON array of ingredient strings
    ingredients: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
