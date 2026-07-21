"""
Skin profile tests — upsert, re-read, health score, and access control.
"""
import pytest

from tests.helpers import SKIN_PROFILE_PAYLOAD, auth, sign_up, token_of


@pytest.mark.asyncio
async def test_upsert_and_read_skin_profile(client):
    body = await sign_up(client, "sara@example.com", "client")
    tok = token_of(body)

    put = await client.put(
        "/api/v1/skin-profiles/me",
        headers=auth(tok),
        json=SKIN_PROFILE_PAYLOAD,
    )
    assert put.status_code == 200, put.text
    data = put.json()
    assert data["tone_tier"] == 3
    assert data["skin_type"] == "combination"
    assert data["health_score"] >= 0
    assert data["concerns"]["acne"] == 3

    get = await client.get("/api/v1/skin-profiles/me", headers=auth(tok))
    assert get.status_code == 200
    assert get.json()["skin_type"] == "combination"


@pytest.mark.asyncio
async def test_skin_profile_updates_correctly(client):
    body = await sign_up(client, "sara@example.com", "client")
    tok = token_of(body)

    await client.put("/api/v1/skin-profiles/me", headers=auth(tok), json=SKIN_PROFILE_PAYLOAD)

    updated = {**SKIN_PROFILE_PAYLOAD, "skin_type": "dry", "concerns": {"dryness": 4}}
    put2 = await client.put("/api/v1/skin-profiles/me", headers=auth(tok), json=updated)
    assert put2.status_code == 200
    assert put2.json()["skin_type"] == "dry"
    assert put2.json()["concerns"]["dryness"] == 4
    assert "acne" not in put2.json()["concerns"]


@pytest.mark.asyncio
async def test_health_score_is_computed_correctly(client):
    body = await sign_up(client, "sara@example.com", "client")
    tok = token_of(body)

    # No concerns → perfect score.
    clean = {**SKIN_PROFILE_PAYLOAD, "concerns": {}}
    put = await client.put("/api/v1/skin-profiles/me", headers=auth(tok), json=clean)
    assert put.json()["health_score"] == 100

    # Max severity on many concerns → low score.
    bad = {**SKIN_PROFILE_PAYLOAD, "concerns": {
        "acne": 5, "pores": 5, "redness": 5, "oiliness": 5, "dryness": 5,
    }}
    put2 = await client.put("/api/v1/skin-profiles/me", headers=auth(tok), json=bad)
    assert put2.json()["health_score"] < 50


@pytest.mark.asyncio
async def test_unauthenticated_request_is_rejected(client):
    res = await client.get("/api/v1/skin-profiles/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_missing_profile_returns_404(client):
    body = await sign_up(client, "new@example.com", "client")
    tok = token_of(body)
    res = await client.get("/api/v1/skin-profiles/me", headers=auth(tok))
    assert res.status_code == 404
