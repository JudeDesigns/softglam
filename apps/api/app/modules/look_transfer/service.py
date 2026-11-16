"""Makeup transfer: copy features from 1-3 inspiration photos onto a selfie.

Each feature (brows, eyeshadow, …) names the inspiration photo it comes from
and a strength from 0-1. Gemini receives the selfie plus the inspiration photos
with explicit labels, then a second vision call checks that the person was not
altered and the requested features were applied. One retry with a reinforced
prompt is made when the check fails.
"""

from collections.abc import Callable

from app.core.gemini import InlineImage, Part, generate_image, judge_json
from app.modules.look_transfer.schemas import (
    CatalogLook,
    FeatureKey,
    LookTransferValidation,
    Recipe,
)

MAX_ATTEMPTS = 2

FEATURE_DESCRIPTION: dict[FeatureKey, str] = {
    FeatureKey.brows: "eyebrows — shape, thickness, arch and colour",
    FeatureKey.eyeshadow: "eyeshadow — colours, placement on the lid and crease, and blending",
    FeatureKey.liner: "eyeliner and lashes — line thickness, wing shape and lash density",
    FeatureKey.blush: "blush — colour and where it sits on the cheeks",
    FeatureKey.contour: "contour and highlight — placement on cheekbones, jaw and nose",
    FeatureKey.lips: "lips — colour, finish (matte, satin or gloss) and lip liner",
}

# Order features are listed in the prompt and the recipe UI.
FEATURE_ORDER: list[FeatureKey] = list(FEATURE_DESCRIPTION)


def look_label(index: int) -> str:
    return f"LOOK_{chr(65 + index)}"


def strength_phrase(intensity: float) -> str:
    pct = round(intensity * 100)
    if pct >= 90:
        return f"at full strength ({pct}%) — match the inspiration closely"
    if pct >= 60:
        return f"at about {pct}% strength — slightly softer and sheerer than the inspiration"
    if pct >= 30:
        return f"at about {pct}% strength — noticeably softer, a sheer wash of the same colour"
    return f"at about {pct}% strength — just a hint of it"


def build_transfer_prompt(recipe: Recipe, reference_count: int, reinforce: bool = False) -> str:
    refs = ", ".join(look_label(i) for i in range(reference_count))
    lines = [
        "You are a professional makeup artist doing a photorealistic makeup transfer.",
        f"You are given SELFIE (the client) and inspiration photos: {refs}.",
        "Recreate the makeup listed below on the person in SELFIE. Copy each feature from the "
        "inspiration photo named for it, adapting placement to SELFIE's own face shape, eye "
        "shape and bone structure so it looks natural on them.",
        "",
        "Apply:",
    ]
    off: list[str] = []
    for key in FEATURE_ORDER:
        setting = recipe.get(key)
        if setting is None or setting.intensity <= 0:
            off.append(key.value)
            continue
        lines.append(
            f"- {FEATURE_DESCRIPTION[key]}: copy from {look_label(setting.source)} "
            f"{strength_phrase(setting.intensity)}."
        )
    if off:
        lines += [
            "",
            f"Leave these exactly as they are in SELFIE (do not add makeup): {', '.join(off)}.",
        ]
    lines += [
        "",
        "Keep the same person: identical identity, face shape, skin tone and texture, hairstyle, "
        "expression, pose, camera angle, lighting and background. Do not copy anything except "
        "the listed makeup from the inspiration photos — not their face, hair, skin tone, "
        "jewellery or clothing.",
        "Output one photorealistic, high-resolution image of SELFIE with the makeup applied.",
    ]
    if reinforce:
        lines.append(
            "IMPORTANT: the previous attempt changed the person or did not visibly apply the "
            "requested makeup. Preserve every facial feature of SELFIE exactly and make sure each "
            "listed feature is clearly applied at the requested strength."
        )
    return "\n".join(lines)


def build_validation_prompt(recipe: Recipe) -> str:
    active = [
        f"{key.value} ({round(s.intensity * 100)}%)"
        for key in FEATURE_ORDER
        if (s := recipe.get(key)) is not None and s.intensity > 0
    ]
    return (
        "You are a strict QA checker for an AI makeup transfer app. Compare ORIGINAL (the "
        "client's selfie) with RESULT (the AI edit).\n"
        "1. identity_preserved: is RESULT clearly the same person as ORIGINAL — same face shape, "
        "features, skin tone, hair, pose and background, with no warping? Makeup changes are fine.\n"
        f"2. makeup_applied: does RESULT visibly show these makeup features: {', '.join(active)}? "
        "Lower percentages should look softer, but still be present.\n"
        'Respond with ONLY JSON: {"identity_preserved": boolean, "makeup_applied": boolean, '
        '"issues": string[]} with short, specific issues (empty if none).'
    )


async def validate(
    original: InlineImage, result: InlineImage, instructions: str
) -> LookTransferValidation:
    try:
        parsed = await judge_json([instructions, "ORIGINAL:", original, "RESULT:", result])
    except Exception:
        return LookTransferValidation(
            passed=False,
            identity_preserved=False,
            makeup_applied=False,
            issues=["Couldn't double-check this preview"],
        )
    identity = parsed.get("identity_preserved") is True
    applied = parsed.get("makeup_applied") is True
    issues = [str(i) for i in parsed.get("issues") or [] if i][:5]
    return LookTransferValidation(
        passed=identity and applied,
        identity_preserved=identity,
        makeup_applied=applied,
        issues=issues,
    )


async def _generate_checked(
    build_parts: Callable[[bool], list[Part]],
    original: InlineImage,
    check_instructions: str,
) -> tuple[InlineImage, LookTransferValidation]:
    """Generate, check, and retry once with a reinforced prompt if the check fails."""
    result: InlineImage | None = None
    validation: LookTransferValidation | None = None
    for attempt in range(MAX_ATTEMPTS):
        result = await generate_image(build_parts(attempt > 0))
        validation = await validate(original, result, check_instructions)
        if validation.passed:
            break
    assert result is not None and validation is not None
    return result, validation


async def transfer(
    selfie: InlineImage, references: list[InlineImage], recipe: Recipe
) -> tuple[InlineImage, LookTransferValidation]:
    """Copies the recipe's features from `references` onto `selfie`."""

    def parts(reinforce: bool) -> list[Part]:
        out: list[Part] = [
            build_transfer_prompt(recipe, len(references), reinforce=reinforce),
            "SELFIE:",
            selfie,
        ]
        for i, ref in enumerate(references):
            out += [f"{look_label(i)}:", ref]
        return out

    return await _generate_checked(parts, selfie, build_validation_prompt(recipe))


# ---------------------------------------------------------------------------
# Catalog looks: the app's own looks, described by colour codes + finish.
# ---------------------------------------------------------------------------

FINISH_DESCRIPTION = {
    "matte": "a soft matte finish with no shine",
    "satin": "a smooth satin finish with a subtle natural sheen",
    "glow": "a luminous, dewy glow finish with soft highlight",
}

# Fitzpatrick-tier guidance so the same shade is adapted to how pigment reads
# on that depth of skin instead of being pasted on flatly.
TONE_DESCRIPTION = {
    1: "very fair skin with cool-to-neutral undertones — apply shades with light, buildable pigmentation and avoid harsh contrast so colours stay soft rather than overpowering.",
    2: "light skin with warm-to-neutral undertones — apply shades with sheer-to-medium pigmentation, blended so the colour looks natural and not chalky.",
    3: "medium skin with warm/golden undertones — apply shades at full intended pigmentation with a warm undertone adjustment so they read true-to-shade, not washed out.",
    4: "olive-to-tan skin with warm undertones — apply shades with rich, true pigmentation and slightly boosted saturation so the colour is visible and doesn't appear muted against the skin's natural depth.",
    5: "deep brown skin with warm-to-neutral undertones — apply shades with full, richly saturated pigmentation calibrated to show up vividly and accurately against deep skin, avoiding any grey or ashy cast.",
    6: "very deep, rich skin with neutral-to-warm undertones — apply shades with maximum, true-to-pigment saturation and vibrancy so colour is clearly visible and complementary against deep skin, explicitly avoiding chalkiness, ashiness, or dulling of the tone.",
}


def build_catalog_prompt(look: CatalogLook, tone_tier: int | None, reinforce: bool = False) -> str:
    parts = [
        f'Apply the "{look.name}" professional makeup look to this person\'s face: {look.caption}.',
        f"Lips: precisely recolour the lips to hex colour {look.shades.lip}, applied evenly within the natural lip shape.",
        f"Cheeks: apply blush in hex colour {look.shades.cheek}, softly blended along the cheekbones.",
        f"Eyes: apply eyeshadow/liner in hex colour {look.shades.eye}, blended along the eyelid and crease.",
        f"Overall makeup finish: {FINISH_DESCRIPTION[look.finish]}.",
    ]
    if tone_tier is not None:
        parts.append(f"This person has {TONE_DESCRIPTION[tone_tier]}")
    parts += [
        "Keep this exact same person: identical face shape, identity, skin tone, hairstyle, pose, "
        "camera angle, lighting, and background — completely unchanged.",
        "Only modify the makeup on the lips, cheeks, and eyes. Do not alter facial structure, add "
        "accessories, or change clothing.",
        "The result must be photorealistic, high resolution, professional beauty photography "
        "quality, with natural-looking, expertly blended makeup application.",
    ]
    if reinforce:
        parts.append(
            "IMPORTANT: The previous attempt either altered the person's identity/face or failed to "
            "visibly apply the requested makeup colours. Preserve every facial feature exactly and "
            "make sure the lip, cheek, and eye colours are clearly and accurately applied."
        )
    return " ".join(parts)


def build_catalog_validation_prompt(look: CatalogLook) -> str:
    return (
        "You are a strict QA checker for an AI makeup try-on app. Compare ORIGINAL (the photo) "
        "with RESULT (the AI edit).\n"
        "1. identity_preserved: is RESULT clearly the same person as ORIGINAL — same face shape, "
        "features, skin tone, hair, pose and background, with no warping? Makeup changes are fine.\n"
        f"2. makeup_applied: does RESULT show visible makeup matching this look: lips roughly "
        f"{look.shades.lip}, blush roughly {look.shades.cheek}, eye makeup roughly "
        f"{look.shades.eye}, with a {look.finish} finish? Colours need only be in the right family.\n"
        'Respond with ONLY JSON: {"identity_preserved": boolean, "makeup_applied": boolean, '
        '"issues": string[]} with short, specific issues (empty if none).'
    )


async def apply_catalog_look(
    selfie: InlineImage, look: CatalogLook, tone_tier: int | None
) -> tuple[InlineImage, LookTransferValidation]:
    return await _generate_checked(
        lambda reinforce: [build_catalog_prompt(look, tone_tier, reinforce), selfie],
        selfie,
        build_catalog_validation_prompt(look),
    )
