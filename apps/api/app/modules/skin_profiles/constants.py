from enum import StrEnum


class SkinConcern(StrEnum):
    acne = "acne"
    dryness = "dryness"
    oiliness = "oiliness"
    redness = "redness"
    sensitivity = "sensitivity"
    dark_circles = "darkCircles"
    pores = "pores"


class SkinType(StrEnum):
    oily = "oily"
    dry = "dry"
    combination = "combination"
    normal = "normal"
    sensitive = "sensitive"


# Mirrors packages/types CONCERN_WEIGHTS. Keep in sync until generated.
CONCERN_WEIGHTS: dict[SkinConcern, float] = {
    SkinConcern.dryness: 1.4,
    SkinConcern.acne: 1.2,
    SkinConcern.redness: 1.1,
    SkinConcern.pores: 1.0,
    SkinConcern.oiliness: 0.9,
    SkinConcern.dark_circles: 0.8,
    SkinConcern.sensitivity: 0.5,
}

MAX_SEVERITY = 4


def compute_health_score(concerns: dict[SkinConcern | str, int]) -> int:
    """0..100 aggregate Skin Health Score. Mirrors the TS implementation."""
    weighted_deficit = 0.0
    total_weight = 0.0
    for concern, weight in CONCERN_WEIGHTS.items():
        severity = int(concerns.get(concern, concerns.get(concern.value, 0)))
        weighted_deficit += weight * (severity / MAX_SEVERITY) * 100
        total_weight += weight
    raw = 100 - (weighted_deficit / total_weight)
    return max(0, min(100, round(raw)))
