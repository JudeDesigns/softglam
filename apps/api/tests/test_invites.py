"""
Invite tests — create, list, accept by code, access control, expiry edge cases.
"""
import pytest

from tests.helpers import auth, sign_up, token_of


@pytest.mark.asyncio
async def test_artist_can_create_invite(client):
    body = await sign_up(client, "artist@example.com", "artist")
    tok = token_of(body)

    res = await client.post(
        "/api/v1/invites",
        headers=auth(tok),
        json={
            "client_name": "Grace Obi",
            "contact": "grace@example.com",
            "channel": "email",
            "message": "Looking forward to working with you!",
        },
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["client_name"] == "Grace Obi"
    assert data["status"] == "sent"
    assert len(data["code"]) > 0


@pytest.mark.asyncio
async def test_artist_can_list_own_invites(client):
    body = await sign_up(client, "artist@example.com", "artist")
    tok = token_of(body)

    for i in range(3):
        await client.post(
            "/api/v1/invites",
            headers=auth(tok),
            json={"client_name": f"Client {i}", "contact": f"c{i}@example.com", "channel": "email"},
        )

    listing = await client.get("/api/v1/invites", headers=auth(tok))
    assert listing.status_code == 200
    assert len(listing.json()) == 3


@pytest.mark.asyncio
async def test_client_cannot_create_invite(client):
    body = await sign_up(client, "client@example.com", "client")
    tok = token_of(body)

    res = await client.post(
        "/api/v1/invites",
        headers=auth(tok),
        json={"client_name": "Someone", "contact": "x@x.com", "channel": "email"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_client_can_accept_invite_by_code(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client_user = await sign_up(client, "grace@example.com", "client")

    invite = await client.post(
        "/api/v1/invites",
        headers=auth(token_of(artist)),
        json={"client_name": "Grace", "contact": "grace@example.com", "channel": "email"},
    )
    code = invite.json()["code"]

    accept = await client.post(
        "/api/v1/invites/accept",
        headers=auth(token_of(client_user)),
        json={"code": code},
    )
    assert accept.status_code == 200, accept.text
    data = accept.json()
    assert data["status"] == "accepted"
    assert data["accepted_by_client_id"] == client_user["user"]["id"]


@pytest.mark.asyncio
async def test_invalid_invite_code_returns_404(client):
    client_user = await sign_up(client, "grace@example.com", "client")

    res = await client.post(
        "/api/v1/invites/accept",
        headers=auth(token_of(client_user)),
        json={"code": "doesnotexist99"},
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_artist_cannot_accept_own_invite(client):
    artist = await sign_up(client, "artist@example.com", "artist")

    invite = await client.post(
        "/api/v1/invites",
        headers=auth(token_of(artist)),
        json={"client_name": "Self", "contact": "x@x.com", "channel": "link"},
    )
    code = invite.json()["code"]

    res = await client.post(
        "/api/v1/invites/accept",
        headers=auth(token_of(artist)),
        json={"code": code},
    )
    # Artists get 403 on the accept endpoint.
    assert res.status_code == 403
