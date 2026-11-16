"""
Shared test helpers — sign-up, auth headers, and reusable payload factories.
"""
from uuid import UUID

from httpx import AsyncClient
from sqlmodel import select

# Set by the `client` fixture so helpers can reach the per-test database.
SESSION_FACTORY = None


async def sign_up(
    client: AsyncClient,
    email: str,
    role: str = "client",
    display_name: str | None = None,
    password: str = "verysecret1",
) -> dict:
    """Create an account and return the full auth response body.

    Admins can't sign up through the API, so role="admin" signs up a client and
    promotes it directly in the database (tokens stay valid: the role is read
    from the DB on every request).
    """
    res = await client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": email,
            "password": password,
            "display_name": display_name or email.split("@")[0],
            "role": "client" if role == "admin" else role,
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()
    if role == "admin":
        await _promote_to_admin(UUID(body["user"]["id"]))
        body["user"]["role"] = "admin"
    return body


async def _promote_to_admin(user_id: UUID) -> None:
    from app.modules.users.models import User, UserRole

    assert SESSION_FACTORY is not None, "client fixture not active"
    async with SESSION_FACTORY() as session:
        user = (await session.execute(select(User).where(User.id == user_id))).scalar_one()
        user.role = UserRole.admin
        session.add(user)
        await session.commit()


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
