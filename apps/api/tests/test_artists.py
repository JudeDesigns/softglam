"""
Artist profile tests — list, get self, update, handle uniqueness, access control.
"""
import pytest

from tests.helpers import auth, sign_up, token_of, user_id_of


@pytest.mark.asyncio
async def test_list_artists_is_public(client):
    """GET /artists should work without a token (no auth required on that route)."""
    res = await client.get("/api/v1/artists")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_artist_profile_auto_created_on_first_get(client):
    body = await sign_up(client, "amara@example.com", "artist")
    tok = token_of(body)

    res = await client.get("/api/v1/artists/me", headers=auth(tok))
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "amara"   # display_name derived from email prefix
    assert "id" in data


@pytest.mark.asyncio
async def test_artist_can_update_profile(client):
    body = await sign_up(client, "amara@example.com", "artist")
    tok = token_of(body)

    res = await client.patch(
        "/api/v1/artists/me",
        headers=auth(tok),
        json={"city": "Lagos", "specialty": "Bridal & Editorial", "years_experience": 6},
    )
    assert res.status_code == 200
    assert res.json()["city"] == "Lagos"
    assert res.json()["specialty"] == "Bridal & Editorial"
    assert res.json()["years_experience"] == 6


@pytest.mark.asyncio
async def test_duplicate_handle_is_rejected(client):
    artist1 = await sign_up(client, "artist1@example.com", "artist")
    artist2 = await sign_up(client, "artist2@example.com", "artist")

    # Artist 1 claims handle "lumenglow".
    await client.patch(
        "/api/v1/artists/me",
        headers=auth(token_of(artist1)),
        json={"handle": "lumenglow"},
    )

    # Artist 2 tries to claim the same handle.
    conflict = await client.patch(
        "/api/v1/artists/me",
        headers=auth(token_of(artist2)),
        json={"handle": "lumenglow"},
    )
    assert conflict.status_code == 409


@pytest.mark.asyncio
async def test_client_cannot_access_artist_me(client):
    body = await sign_up(client, "client@example.com", "client")
    tok = token_of(body)

    res = await client.get("/api/v1/artists/me", headers=auth(tok))
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_get_artist_by_id(client):
    artist_body = await sign_up(client, "amara@example.com", "artist")
    artist_id = user_id_of(artist_body)

    # First GET /me to ensure the profile exists.
    await client.get("/api/v1/artists/me", headers=auth(token_of(artist_body)))

    res = await client.get(f"/api/v1/artists/{artist_id}")
    assert res.status_code == 200
    assert res.json()["id"] == artist_id


@pytest.mark.asyncio
async def test_unknown_artist_id_returns_404(client):
    from uuid import uuid4
    res = await client.get(f"/api/v1/artists/{uuid4()}")
    assert res.status_code == 404
