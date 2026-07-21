from typing import Literal

from pydantic import BaseModel, ConfigDict

LookFinish = Literal["matte", "satin", "glow"]


class LookShades(BaseModel):
    lip: str
    cheek: str
    eye: str


# ---------------------------------------------------------------------------
# Read models — response shape kept identical to the mobile catalog contract
# (apps/mobile/src/try-on/looks.ts). `preview_image_url` is additive only.
# ---------------------------------------------------------------------------


class LookRead(BaseModel):
    id: str
    name: str
    caption: str
    finish: LookFinish
    shades: LookShades
    preview_image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class LookSectionRead(BaseModel):
    id: str
    title: str
    subtitle: str
    looks: list[LookRead]

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Write models — admin-only create/update
# ---------------------------------------------------------------------------


class LookSectionCreate(BaseModel):
    id: str
    title: str
    subtitle: str
    sort_order: int = 0


class LookSectionUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    sort_order: int | None = None


class LookCreate(BaseModel):
    id: str
    section_id: str
    name: str
    caption: str
    finish: LookFinish
    shades: LookShades
    sort_order: int = 0


class LookUpdate(BaseModel):
    name: str | None = None
    caption: str | None = None
    finish: LookFinish | None = None
    shades: LookShades | None = None
    section_id: str | None = None
    sort_order: int | None = None


class LookPreviewGenerate(BaseModel):
    """Optional reference photo to generate the preview on; a stock face is used if omitted."""

    photo_data_url: str | None = None
