from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class SkinProfile(SQLModel, table=True):
    __tablename__ = "skin_profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(index=True, unique=True, foreign_key="users.id")

    tone_tier: int = Field(ge=1, le=6)
    skin_type: str = Field(max_length=24)
    # JSON blob: { "acne": 2, "dryness": 3, ... }
    concerns: dict[str, int] = Field(default_factory=dict, sa_column=Column(JSON))
    # JSON blob: [{ "id": "...", "x": 0.5, "y": 0.4, "concerns": ["acne"] }]
    zone_tags: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))

    health_score: int = Field(ge=0, le=100)
    captured_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
