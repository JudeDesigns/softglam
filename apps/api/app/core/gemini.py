"""Thin async client for the Gemini REST API.

Shared by the admin look-preview generator and the client makeup-transfer
pipeline so both talk to Gemini the same way.
"""

import json
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import get_settings

GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image"
GEMINI_VISION_MODEL = "gemini-2.5-flash"
_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiError(RuntimeError):
    """Raised when Gemini is unreachable, misconfigured or returns no usable output."""


@dataclass(frozen=True)
class InlineImage:
    mime_type: str
    data_b64: str


# A prompt part is either text or an image.
Part = str | InlineImage


def _to_api_parts(parts: list[Part]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for p in parts:
        if isinstance(p, InlineImage):
            out.append({"inlineData": {"mimeType": p.mime_type, "data": p.data_b64}})
        else:
            out.append({"text": p})
    return out


async def _post(model: str, body: dict[str, Any], timeout: float) -> dict[str, Any]:
    api_key = get_settings().gemini_api_key
    if not api_key:
        raise GeminiError("GEMINI_API_KEY is not configured")
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.post(
                f"{_BASE_URL}/{model}:generateContent", params={"key": api_key}, json=body
            )
            res.raise_for_status()
            return res.json()
    except httpx.HTTPError as exc:
        raise GeminiError(f"Gemini request failed: {exc}") from exc


def _first_parts(payload: dict[str, Any]) -> list[dict[str, Any]]:
    candidates = payload.get("candidates") or [{}]
    return (candidates[0].get("content") or {}).get("parts") or []


async def generate_image(parts: list[Part], timeout: float = 90) -> InlineImage:
    """Runs the image model on `parts` and returns the first image it produces."""
    payload = await _post(
        GEMINI_IMAGE_MODEL, {"contents": [{"parts": _to_api_parts(parts)}]}, timeout
    )
    for part in _first_parts(payload):
        inline = part.get("inlineData")
        if inline and inline.get("data"):
            return InlineImage(inline.get("mimeType", "image/png"), inline["data"])
    raise GeminiError("Gemini returned no image")


async def judge_json(parts: list[Part], timeout: float = 60) -> dict[str, Any]:
    """Runs the vision model on `parts`, asking for a JSON response, and parses it."""
    payload = await _post(
        GEMINI_VISION_MODEL,
        {
            "contents": [{"parts": _to_api_parts(parts)}],
            "generationConfig": {"responseMimeType": "application/json"},
        },
        timeout,
    )
    text = next((p["text"] for p in _first_parts(payload) if p.get("text")), "{}")
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiError("Gemini returned malformed JSON") from exc
    if not isinstance(parsed, dict):
        raise GeminiError("Gemini returned unexpected JSON")
    return parsed
