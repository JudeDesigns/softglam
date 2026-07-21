"""
End-to-end integration test — simulates the full SoftGlow journey:

  1. Client signs up → runs onboarding (skin profile)
  2. Artist signs up → profile auto-created
  3. Artist invites the client
  4. Client accepts the invite
  5. Client picks a look, uploads a photo, sends a look request
  6. Artist marks the request viewed, quotes it
  7. Artist books an appointment linked to the look request
  8. Artist adds product COGS, completes the appointment
  9. COGS summary is accurate
 10. Token refresh keeps the session alive
 11. Unauthenticated access is blocked throughout
"""
from datetime import UTC, datetime, timedelta

import pytest

from tests.helpers import auth, sign_up, token_of, user_id_of, SKIN_PROFILE_PAYLOAD, LOOK_REQUEST_PAYLOAD


# ---------------------------------------------------------------------------
# Full user journey
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_full_client_to_artist_journey(client):
    # ── 1. Accounts ──────────────────────────────────────────────────────────
    client_body = await sign_up(client, "grace@example.com", "client", "Grace Obi")
    artist_body = await sign_up(client, "amara@example.com", "artist", "Amara Okafor")
    client_tok = token_of(client_body)
    artist_tok = token_of(artist_body)
    artist_id = user_id_of(artist_body)
    client_id = user_id_of(client_body)

    # ── 2. Onboarding: client saves skin profile ──────────────────────────────
    profile = await client.put(
        "/api/v1/skin-profiles/me",
        headers=auth(client_tok),
        json=SKIN_PROFILE_PAYLOAD,
    )
    assert profile.status_code == 200
    assert profile.json()["tone_tier"] == 3
    health_score = profile.json()["health_score"]
    assert 0 <= health_score <= 100

    # ── 3. Artist profile auto-populated ─────────────────────────────────────
    artist_profile = await client.get("/api/v1/artists/me", headers=auth(artist_tok))
    assert artist_profile.status_code == 200
    artist_profile_id = artist_profile.json()["id"]

    # Artist appears in the public list.
    artist_list = await client.get("/api/v1/artists")
    assert any(a["id"] == artist_profile_id for a in artist_list.json())

    # ── 4. Artist sends client an invite ─────────────────────────────────────
    invite_res = await client.post(
        "/api/v1/invites",
        headers=auth(artist_tok),
        json={"client_name": "Grace Obi", "contact": "grace@example.com", "channel": "email"},
    )
    assert invite_res.status_code == 201
    invite_code = invite_res.json()["code"]

    # ── 5. Client accepts the invite ──────────────────────────────────────────
    accept_res = await client.post(
        "/api/v1/invites/accept",
        headers=auth(client_tok),
        json={"code": invite_code},
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"
    assert accept_res.json()["accepted_by_client_id"] == client_id

    # ── 6. Client creates a look request ─────────────────────────────────────
    lr_payload = {
        **LOOK_REQUEST_PAYLOAD,
        "artist_id": artist_id,
        "message": "For my wedding — 10 March",
    }
    lr_res = await client.post(
        "/api/v1/look-requests", headers=auth(client_tok), json=lr_payload
    )
    assert lr_res.status_code == 201
    request_id = lr_res.json()["id"]
    assert lr_res.json()["status"] == "pending"

    # ── 7. Artist marks it viewed ─────────────────────────────────────────────
    viewed = await client.post(
        f"/api/v1/look-requests/{request_id}/mark-viewed",
        headers=auth(artist_tok),
    )
    assert viewed.status_code == 200
    assert viewed.json()["status"] == "viewed"

    # ── 8. Artist quotes ──────────────────────────────────────────────────────
    quoted = await client.post(
        f"/api/v1/look-requests/{request_id}/quote",
        headers=auth(artist_tok),
        json={"quote": "₦65,000 · Full bridal glam · 3-hr session"},
    )
    assert quoted.status_code == 200
    assert quoted.json()["status"] == "quoted"
    assert "₦65,000" in quoted.json()["quote"]

    # ── 9. Artist books an appointment ───────────────────────────────────────
    scheduled = (datetime.now(UTC) + timedelta(days=14)).isoformat()
    appt_res = await client.post(
        "/api/v1/appointments",
        headers=auth(artist_tok),
        json={
            "client_id": client_id,
            "look_request_id": request_id,
            "scheduled_at": scheduled,
            "duration_minutes": 180,
            "service_name": "Full bridal glam",
            "location": "Lekki Studio",
            "quoted_price": 65000.0,
        },
    )
    assert appt_res.status_code == 201
    appt_id = appt_res.json()["id"]
    assert appt_res.json()["look_request_id"] == request_id

    # ── 10. Appointment confirmed then completed ──────────────────────────────
    await client.post(f"/api/v1/appointments/{appt_id}/confirm", headers=auth(artist_tok))
    completed = await client.post(
        f"/api/v1/appointments/{appt_id}/complete", headers=auth(artist_tok)
    )
    assert completed.json()["status"] == "completed"

    # Set final price.
    await client.patch(
        f"/api/v1/appointments/{appt_id}",
        headers=auth(artist_tok),
        json={"final_price": 65000.0},
    )

    # ── 11. Artist logs COGS ──────────────────────────────────────────────────
    products_used = [
        {"product_name": "Foundation", "brand": "Fenty", "quantity": 1, "unit_cost": 12000},
        {"product_name": "Setting Powder", "brand": "Laura Mercier", "quantity": 1, "unit_cost": 7500},
        {"product_name": "Lashes", "brand": "Ardell", "quantity": 2, "unit_cost": 1800},
    ]
    for p in products_used:
        r = await client.post(
            f"/api/v1/appointments/{appt_id}/products", headers=auth(artist_tok), json=p
        )
        assert r.status_code == 201

    # ── 12. COGS summary ──────────────────────────────────────────────────────
    summary = await client.get(
        f"/api/v1/appointments/{appt_id}/cogs-summary", headers=auth(artist_tok)
    )
    assert summary.status_code == 200
    body = summary.json()
    # 12000 + 7500 + (2 × 1800) = 23100
    assert body["total_cogs"] == pytest.approx(23100.0)
    assert body["final_price"] == 65000.0
    expected_margin = (65000 - 23100) / 65000 * 100
    assert body["gross_margin_pct"] == pytest.approx(expected_margin, abs=0.1)

    # ── 13. Client can see the appointment ────────────────────────────────────
    client_appts = await client.get("/api/v1/appointments", headers=auth(client_tok))
    assert client_appts.status_code == 200
    assert any(a["id"] == appt_id for a in client_appts.json())

    # ── 14. Client can see their look request ────────────────────────────────
    client_requests = await client.get("/api/v1/look-requests", headers=auth(client_tok))
    assert any(r["id"] == request_id for r in client_requests.json())
    matching = next(r for r in client_requests.json() if r["id"] == request_id)
    assert matching["status"] == "quoted"

    # ── 15. Unauthenticated access is blocked everywhere ─────────────────────
    for url in [
        "/api/v1/skin-profiles/me",
        "/api/v1/look-requests",
        "/api/v1/appointments",
        "/api/v1/invites",
        "/api/v1/products",
    ]:
        res = await client.get(url)
        assert res.status_code == 401, f"Expected 401 for {url}, got {res.status_code}"


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_token_refresh_returns_new_access_token(client):
    body = await sign_up(client, "ada@example.com", "client")
    refresh_token = body["tokens"]["refresh_token"]

    res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    # Response must contain a valid access_token string.
    assert isinstance(data.get("access_token"), str)
    assert len(data["access_token"]) > 20


@pytest.mark.asyncio
async def test_tampered_refresh_token_is_rejected(client):
    body = await sign_up(client, "ada@example.com", "client")
    bad_token = body["tokens"]["refresh_token"] + "tampered"

    res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": bad_token},
    )
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Cross-user isolation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_look_requests_are_isolated_by_user(client):
    """Client A's requests must not appear in client B's list."""
    artist = await sign_up(client, "artist@example.com", "artist")
    client_a = await sign_up(client, "a@example.com", "client")
    client_b = await sign_up(client, "b@example.com", "client")

    payload = {**LOOK_REQUEST_PAYLOAD, "artist_id": user_id_of(artist)}

    await client.post("/api/v1/look-requests", headers=auth(token_of(client_a)), json=payload)
    await client.post("/api/v1/look-requests", headers=auth(token_of(client_a)), json=payload)

    b_list = await client.get("/api/v1/look-requests", headers=auth(token_of(client_b)))
    assert b_list.status_code == 200
    assert len(b_list.json()) == 0


@pytest.mark.asyncio
async def test_skin_profiles_are_isolated_by_user(client):
    a = await sign_up(client, "a@example.com", "client")
    b = await sign_up(client, "b@example.com", "client")

    await client.put(
        "/api/v1/skin-profiles/me",
        headers=auth(token_of(a)),
        json={**SKIN_PROFILE_PAYLOAD, "skin_type": "oily"},
    )

    # User B has no profile yet.
    b_res = await client.get("/api/v1/skin-profiles/me", headers=auth(token_of(b)))
    assert b_res.status_code == 404


# ---------------------------------------------------------------------------
# Decline flow
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_artist_can_decline_look_request(client):
    client_user = await sign_up(client, "grace@example.com", "client")
    artist = await sign_up(client, "amara@example.com", "artist")

    lr = await client.post(
        "/api/v1/look-requests",
        headers=auth(token_of(client_user)),
        json={**LOOK_REQUEST_PAYLOAD, "artist_id": user_id_of(artist)},
    )
    request_id = lr.json()["id"]

    declined = await client.post(
        f"/api/v1/look-requests/{request_id}/decline",
        headers=auth(token_of(artist)),
    )
    assert declined.status_code == 200
    assert declined.json()["status"] == "declined"
