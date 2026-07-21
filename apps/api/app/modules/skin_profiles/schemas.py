from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.skin_profiles.constants import SkinConcern, SkinType


class FaceZoneTag(BaseModel):
    id: str
    x: float = Field(ge=0.0, le=1.0)
    y: float = Field(ge=0.0, le=1.0)
    concerns: list[SkinConcern] = Field(default_factory=list)


class SkinProfileUpsert(BaseModel):
    tone_tier: int = Field(ge=1, le=6)
    skin_type: SkinType
    concerns: dict[SkinConcern, int] = Field(default_factory=dict)
    zone_tags: list[FaceZoneTag] = Field(default_factory=list)


class SkinProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    tone_tier: int
    skin_type: SkinType
    concerns: dict[str, int]
    zone_tags: list[FaceZoneTag]
    health_score: int
    captured_at: datetime
    updated_at: datetime
