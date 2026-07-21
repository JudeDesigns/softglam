from datetime import UTC, datetime

from sqlalchemy import Column, Text
from sqlmodel import Field, SQLModel


class LookSection(SQLModel, table=True):
    """A category grouping of makeup looks (e.g. Editorial, Bridal)."""

    __tablename__ = "look_sections"

    id: str = Field(max_length=64, primary_key=True)
    title: str = Field(max_length=120)
    subtitle: str = Field(max_length=240)
    sort_order: int = Field(default=0, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Look(SQLModel, table=True):
    """A single makeup look belonging to a section.

    `id` stays a stable string slug (not a UUID) because `look_requests.look_id`
    already references looks by slug from the static catalog era.
    """

    __tablename__ = "looks"

    id: str = Field(max_length=64, primary_key=True)
    section_id: str = Field(max_length=64, foreign_key="look_sections.id", index=True)
    name: str = Field(max_length=120)
    caption: str = Field(max_length=240)
    finish: str = Field(max_length=16)  # matte | satin | glow
    shade_lip: str = Field(max_length=16)
    shade_cheek: str = Field(max_length=16)
    shade_eye: str = Field(max_length=16)
    sort_order: int = Field(default=0, index=True)
    # Generated AI preview — stored as a data: URL (base64) since there is no
    # object storage/CDN wired up yet. Nullable until a preview is generated.
    preview_image_url: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    preview_generated_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
