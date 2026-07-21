"""
Shared test helpers — sign-up, auth headers, and reusable payload factories.
"""
from httpx import AsyncClient


async def sign_up(
    client: AsyncClient,
    email: str,
    role: str = "client",
    display_name: str | None = None,
    password: str = "verysecret1",
) -> dict:
    """Create an account and return the full auth response body."""
    res = await client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": email,
            "password": password,
            "display_name": display_name or email.split("@")[0],
            "role": role,
        },
    )
    assert res.status_code == 201, res.text
    return res.json()


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def token_of(signup_body: dict) -> str:
    return signup_body["tokens"]["access_token"]


def user_id_of(signup_body: dict) -> str:
    return signup_body["user"]["id"]


LOOK_REQUEST_PAYLOAD = {
    "look_id": "bronze-couture",
    "look_name": "Bronze Couture",
    "look_caption": "Warm contour, glazed lip",
    "client_photo_url": "https://example.com/me.jpg",
    "generated_url": "https://example.com/look.jpg",
}

SKIN_PROFILE_PAYLOAD = {
    "tone_tier": 3,          # int 1-6, not a string
    "skin_type": "combination",
    "concerns": {"acne": 3, "pores": 2, "oiliness": 1},
    "zone_tags": [],
}
