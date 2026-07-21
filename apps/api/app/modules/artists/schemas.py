from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.looks.schemas import LookFinish


class ArtistRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    handle: str
    city: str
    specialty: str
    rating: float
    response_time_hours: int
    finishes: list[LookFinish] = Field(default_factory=list)
    years_experience: int
    bio: str | None = None


class ArtistProfileUpdate(BaseModel):
    handle: str | None = Field(default=None, min_length=2, max_length=64)
    city: str | None = Field(default=None, max_length=120)
    specialty: str | None = Field(default=None, max_length=160)
    finishes: list[LookFinish] | None = None
    years_experience: int | None = Field(default=None, ge=0)
    bio: str | None = Field(default=None, max_length=600)
