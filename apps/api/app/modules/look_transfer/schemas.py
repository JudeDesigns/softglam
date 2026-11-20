from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class FeatureKey(StrEnum):
    brows = "brows"
    eyeshadow = "eyeshadow"
    liner = "liner"
    blush = "blush"
    contour = "contour"
    lips = "lips"


class FeatureSetting(BaseModel):
    """Which inspiration photo a feature is copied from, and how strongly (0 = off)."""

    source: int = Field(default=0, ge=0, le=2)
    intensity: float = Field(default=1.0, ge=0, le=1)


# A recipe maps each feature to its setting. Missing features are treated as off.
Recipe = dict[FeatureKey, FeatureSetting]


class LookTransferCreate(BaseModel):
    selfie_url: str = Field(min_length=1, max_length=512)
    reference_urls: list[str] = Field(min_length=1, max_length=3)
    features: Recipe

    @model_validator(mode="after")
    def _check(self) -> "LookTransferCreate":
        if not any(f.intensity > 0 for f in self.features.values()):
            raise ValueError("Turn on at least one feature")
        for key, f in self.features.items():
            if f.intensity > 0 and f.source >= len(self.reference_urls):
                raise ValueError(f"{key.value}: no inspiration photo {chr(65 + f.source)}")
        return self


HEX_COLOUR = r"^#[0-9A-Fa-f]{6}$"


class CatalogLookShades(BaseModel):
    lip: str = Field(pattern=HEX_COLOUR)
    cheek: str = Field(pattern=HEX_COLOUR)
    eye: str = Field(pattern=HEX_COLOUR)


class CatalogLook(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    caption: str = Field(min_length=1, max_length=240)
    finish: Literal["matte", "satin", "glow"]
    shades: CatalogLookShades


class CatalogLookApply(BaseModel):
    """Apply one of the app's catalog looks (colour codes + finish) to a selfie."""

    selfie_url: str = Field(min_length=1, max_length=512)
    look: CatalogLook
    tone_tier: int | None = Field(default=None, ge=1, le=6)


class LookTransferValidation(BaseModel):
    passed: bool
    identity_preserved: bool
    makeup_applied: bool
    issues: list[str]


class LookTransferRead(BaseModel):
    generated_url: str
    validation: LookTransferValidation
