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


@pytest.mark.asyncio
async def test_copied_look_request_keeps_recipe_and_reference_photos(client):
    artist = await _sign_up(client, "artist2@example.com", "artist")
    body = await _sign_up(client, "client2@example.com", "client")
    token = body["tokens"]["access_token"]
    recipe = {
        "brows": {"source": 0, "intensity": 1.0},
        "lips": {"source": 1, "intensity": 0.6},
    }

    create = await client.post(
        "/api/v1/look-requests",
        headers=_auth(token),
        json=_payload(
            artist["user"]["id"],
            look_id="custom",
            look_name="Your copied look",
            # Long URLs (e.g. signed storage links) must fit.
            generated_url="/media/" + "a" * 900 + ".png",
            reference_urls=["/media/a.jpg", "/media/b.jpg"],
            recipe=recipe,
        ),
    )
    assert create.status_code == 201, create.text

    artist_token = artist["tokens"]["access_token"]
    got = await client.get(
        f"/api/v1/look-requests/{create.json()['id']}", headers=_auth(artist_token)
    )
    assert got.status_code == 200
    data = got.json()
    assert data["reference_urls"] == ["/media/a.jpg", "/media/b.jpg"]
    assert data["recipe"] == recipe


@pytest.mark.asyncio
async def test_catalog_request_has_no_recipe(client):
    artist = await _sign_up(client, "artist3@example.com", "artist")
    body = await _sign_up(client, "client3@example.com", "client")
    res = await client.post(
        "/api/v1/look-requests",
        headers=_auth(body["tokens"]["access_token"]),
        json=_payload(artist["user"]["id"]),
    )
    assert res.status_code == 201
    assert res.json()["recipe"] is None
    assert res.json()["reference_urls"] is None


async def _quoted_request(client, *, proposed_at=True):
    from datetime import UTC, datetime, timedelta

    artist = await _sign_up(client, "artist-q@example.com", "artist")
    body = await _sign_up(client, "client-q@example.com", "client")
    client_tok = body["tokens"]["access_token"]
    artist_tok = artist["tokens"]["access_token"]
    created = await client.post(
        "/api/v1/look-requests", headers=_auth(client_tok), json=_payload(artist["user"]["id"])
    )
    req_id = created.json()["id"]
    quote = {"quote": "Full glam, travel included", "quoted_price": 45000}
    if proposed_at:
        quote["proposed_at"] = (datetime.now(UTC) + timedelta(days=3)).isoformat()
    res = await client.post(
        f"/api/v1/look-requests/{req_id}/quote", headers=_auth(artist_tok), json=quote
    )
    assert res.status_code == 200, res.text
    return req_id, client_tok, artist_tok


@pytest.mark.asyncio
async def test_requests_carry_both_display_names(client):
    req_id, client_tok, artist_tok = await _quoted_request(client)
    got = await client.get(f"/api/v1/look-requests/{req_id}", headers=_auth(artist_tok))
    assert got.json()["client_name"] == "client-q"
    assert got.json()["artist_name"] == "artist-q"


@pytest.mark.asyncio
async def test_client_accepting_quote_books_an_appointment(client):
    req_id, client_tok, artist_tok = await _quoted_request(client)
    accepted = await client.post(f"/api/v1/look-requests/{req_id}/accept", headers=_auth(client_tok))
    assert accepted.status_code == 200, accepted.text
    body = accepted.json()
    assert body["status"] == "accepted"
    appt_id = body["appointment_id"]
    assert appt_id

    appt = await client.get(f"/api/v1/appointments/{appt_id}", headers=_auth(artist_tok))
    assert appt.status_code == 200
    assert appt.json()["quoted_price"] == 45000
    assert appt.json()["look_request_id"] == req_id
    assert appt.json()["status"] == "booked"

    # Can't accept twice, and the artist can no longer decline or re-quote.
    again = await client.post(f"/api/v1/look-requests/{req_id}/accept", headers=_auth(client_tok))
    assert again.status_code == 409
    declined = await client.post(f"/api/v1/look-requests/{req_id}/decline", headers=_auth(artist_tok))
    assert declined.status_code == 409


@pytest.mark.asyncio
async def test_quote_without_time_cannot_be_accepted(client):
    req_id, client_tok, _ = await _quoted_request(client, proposed_at=False)
    res = await client.post(f"/api/v1/look-requests/{req_id}/accept", headers=_auth(client_tok))
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_declined_request_cannot_be_quoted(client):
    req_id, _, artist_tok = await _quoted_request(client)
    await client.post(f"/api/v1/look-requests/{req_id}/decline", headers=_auth(artist_tok))
    res = await client.post(
        f"/api/v1/look-requests/{req_id}/quote", headers=_auth(artist_tok), json={"quote": "x"}
    )
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_quote_time_must_be_future(client):
    artist = await _sign_up(client, "artist-p@example.com", "artist")
    body = await _sign_up(client, "client-p@example.com", "client")
    created = await client.post(
        "/api/v1/look-requests",
        headers=_auth(body["tokens"]["access_token"]),
        json=_payload(artist["user"]["id"]),
    )
    res = await client.post(
        f"/api/v1/look-requests/{created.json()['id']}/quote",
        headers=_auth(artist["tokens"]["access_token"]),
        json={"quote": "x", "proposed_at": "2020-01-01T10:00:00Z"},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_admin_sees_all_requests(client):
    from tests.helpers import sign_up as helper_sign_up

    await _quoted_request(client)
    admin = await helper_sign_up(client, "boss@example.com", "admin")
    res = await client.get("/api/v1/look-requests", headers=_auth(admin["tokens"]["access_token"]))
    assert res.status_code == 200
    assert len(res.json()) == 1
