from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ProductRead(BaseModel):
    id: UUID
    brand: str
    name: str
    price: float
    health_score: int
    is_toxin_free: bool
    targets: list[str]
    ingredients: list[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    brand: str
    name: str
    price: float
    health_score: int = 0
    is_toxin_free: bool = False
    targets: list[str] = []
    ingredients: list[str] = []
