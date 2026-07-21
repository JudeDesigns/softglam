"""Server-side AI preview generation for makeup looks, using Gemini 2.5 Flash Image.

Mirrors the client-side pipeline in apps/mobile/src/look-share/generation.ts but
runs on the backend so the admin dashboard can generate/refresh a preview image
for each catalog look without going through the mobile app.
"""

import base64

import httpx

from app.core.config import get_settings
from app.modules.looks.models import Look

GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image"

FINISH_DESCRIPTOR = {
    "matte": "a soft matte finish with no shine",
    "satin": "a smooth satin finish with a subtle natural sheen",
    "glow": "a luminous, dewy glow finish with soft highlight",
}

# Neutral, front-facing stock model face used when the admin doesn't supply a
# reference photo. Keeps preview generation self-contained (no dependency on a
# real user's uploaded photo).
_STOCK_FACE_URL = (
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2"
    "?w=512&h=640&fit=crop&crop=faces"
)


def build_preview_prompt(look: Look) -> str:
    return (
        f'Apply the "{look.name}" professional makeup look to this person\'s face: {look.caption}. '
        f"Lips: precisely recolour the lips to hex colour {look.shade_lip}, applied evenly within the natural lip shape. "
        f"Cheeks: apply blush in hex colour {look.shade_cheek}, softly blended along the cheekbones. "
        f"Eyes: apply eyeshadow/liner in hex colour {look.shade_eye}, blended along the eyelid and crease. "
        f"Overall makeup finish: {FINISH_DESCRIPTOR.get(look.finish, look.finish)}. "
        "Keep the same person: identical face shape, identity, skin tone, hairstyle, pose, camera angle, "
        "lighting, and background — unchanged. Only modify the makeup on the lips, cheeks, and eyes. "
        "The result must be photorealistic, high resolution, professional beauty photography quality, "
        "with natural-looking, expertly blended makeup application."
    )


async def _load_reference_image(photo_data_url: str | None) -> tuple[str, str]:
    """Returns (mime_type, base64_data) for either a supplied data: URL or the stock face."""
    if photo_data_url and photo_data_url.startswith("data:"):
        header, _, data = photo_data_url.partition(",")
        mime = header.removeprefix("data:").split(";")[0] or "image/jpeg"
        return mime, data

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(_STOCK_FACE_URL)
        res.raise_for_status()
        return "image/jpeg", base64.b64encode(res.content).decode()


async def generate_look_preview(look: Look, photo_data_url: str | None = None) -> str:
    """Calls Gemini to render `look` on a face, returning a `data:` image URL."""
    settings = get_settings()
    api_key = settings.gemini_api_key
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    mime_type, image_data = await _load_reference_image(photo_data_url)
    prompt = build_preview_prompt(look)

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent",
            params={"key": api_key},
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {"inlineData": {"mimeType": mime_type, "data": image_data}},
                        ]
                    }
                ]
            },
        )
    res.raise_for_status()
    payload = res.json()
    parts = (
        payload.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [])
    )
    for part in parts:
        inline = part.get("inlineData")
        if inline and inline.get("data"):
            return f"data:{inline.get('mimeType', 'image/jpeg')};base64,{inline['data']}"

    raise RuntimeError("Gemini returned no image")
