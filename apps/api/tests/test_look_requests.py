from uuid import uuid4

import pytest


async def _sign_up(client, email: str, role: str = "client"):
    response = await client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": email,
            "password": "verysecret1",
            "display_name": email.split("@")[0],
            "role": role,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _payload(artist_id: str, **overrides) -> dict:
    body = {
        "artist_id": artist_id,
        "look_id": "bronze-couture",
        "look_name": "Bronze Couture",
        "look_caption": "Warm contour, glazed lip",
        "client_photo_url": "https://example.com/me.jpg",
        "generated_url": "https://example.com/look.jpg",
    }
    body.update(overrides)
    return body


@pytest.mark.asyncio
async def test_client_can_create_and_list_look_requests(client):
    artist = await _sign_up(client, "artist1@example.com", "artist")
    body = await _sign_up(client, "client1@example.com", "client")
    token = body["tokens"]["access_token"]

    create = await client.post(
        "/api/v1/look-requests",
        headers=_auth(token),
        json=_payload(artist["user"]["id"], message="For Friday evening, please."),
    )
    assert create.status_code == 201, create.text
    assert create.json()["status"] == "pending"

    listing = await client.get("/api/v1/look-requests", headers=_auth(token))
    assert listing.status_code == 200
    assert len(listing.json()) == 1


@pytest.mark.asyncio
async def test_artist_can_quote_a_request(client):
    client_body = await _sign_up(client, "client1@example.com", "client")
    artist_body = await _sign_up(client, "artist1@example.com", "artist")
    client_token = client_body["tokens"]["access_token"]
    artist_token = artist_body["tokens"]["access_token"]

    created = await client.post(
        "/api/v1/look-requests",
        headers=_auth(client_token),
        json=_payload(artist_body["user"]["id"]),
    )
    request_id = created.json()["id"]

    quoted = await client.post(
        f"/api/v1/look-requests/{request_id}/quote",
        headers=_auth(artist_token),
        json={"quote": "₦45,000 — Saturday 2pm"},
    )
    assert quoted.status_code == 200
    assert quoted.json()["status"] == "quoted"
    assert quoted.json()["quote"].startswith("₦")


@pytest.mark.asyncio
async def test_unknown_artist_id_is_rejected(client):
    body = await _sign_up(client, "client1@example.com", "client")
    token = body["tokens"]["access_token"]
    response = await client.post(
        "/api/v1/look-requests",
        headers=_auth(token),
        json=_payload(str(uuid4())),
    )
    assert response.status_code == 404
