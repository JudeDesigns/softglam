"""
Appointment tests — create, update, status transitions, COGS, access control.
"""
from datetime import datetime, timedelta, UTC

import pytest

from tests.helpers import auth, sign_up, token_of, user_id_of


def _scheduled_at(offset_hours: int = 24) -> str:
    return (datetime.now(UTC) + timedelta(hours=offset_hours)).isoformat()


def _appt_payload(client_id: str, **overrides) -> dict:
    return {
        "client_id": client_id,
        "scheduled_at": _scheduled_at(),
        "duration_minutes": 60,
        "service_name": "Bridal makeup",
        "location": "Victoria Island Studio",
        **overrides,
    }


@pytest.mark.asyncio
async def test_artist_can_create_appointment(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client_user = await sign_up(client, "grace@example.com", "client")

    res = await client.post(
        "/api/v1/appointments",
        headers=auth(token_of(artist)),
        json=_appt_payload(user_id_of(client_user), quoted_price=45000.0),
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["status"] == "booked"
    assert data["service_name"] == "Bridal makeup"
    assert data["quoted_price"] == 45000.0


@pytest.mark.asyncio
async def test_client_cannot_create_appointment(client):
    client_user = await sign_up(client, "grace@example.com", "client")

    res = await client.post(
        "/api/v1/appointments",
        headers=auth(token_of(client_user)),
        json=_appt_payload(user_id_of(client_user)),
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_artist_can_list_their_appointments(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client1 = await sign_up(client, "grace@example.com", "client")
    client2 = await sign_up(client, "nadia@example.com", "client")

    for c in [client1, client2]:
        await client.post(
            "/api/v1/appointments",
            headers=auth(token_of(artist)),
            json=_appt_payload(user_id_of(c)),
        )

    listing = await client.get("/api/v1/appointments", headers=auth(token_of(artist)))
    assert listing.status_code == 200
    assert len(listing.json()) == 2


@pytest.mark.asyncio
async def test_client_only_sees_own_appointments(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    grace = await sign_up(client, "grace@example.com", "client")
    nadia = await sign_up(client, "nadia@example.com", "client")

    # Book for both clients.
    for c in [grace, nadia]:
        await client.post(
            "/api/v1/appointments",
            headers=auth(token_of(artist)),
            json=_appt_payload(user_id_of(c)),
        )

    grace_appts = await client.get("/api/v1/appointments", headers=auth(token_of(grace)))
    assert grace_appts.status_code == 200
    assert len(grace_appts.json()) == 1
    assert grace_appts.json()[0]["client_id"] == user_id_of(grace)


@pytest.mark.asyncio
async def test_status_lifecycle_booked_confirmed_completed(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client_user = await sign_up(client, "grace@example.com", "client")
    tok = token_of(artist)

    created = await client.post(
        "/api/v1/appointments",
        headers=auth(tok),
        json=_appt_payload(user_id_of(client_user)),
    )
    appt_id = created.json()["id"]
    assert created.json()["status"] == "booked"

    confirmed = await client.post(
        f"/api/v1/appointments/{appt_id}/confirm", headers=auth(tok)
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "confirmed"

    completed = await client.post(
        f"/api/v1/appointments/{appt_id}/complete", headers=auth(tok)
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    assert completed.json()["completed_at"] is not None


@pytest.mark.asyncio
async def test_client_can_cancel_appointment(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client_user = await sign_up(client, "grace@example.com", "client")

    created = await client.post(
        "/api/v1/appointments",
        headers=auth(token_of(artist)),
        json=_appt_payload(user_id_of(client_user)),
    )
    appt_id = created.json()["id"]

    cancelled = await client.post(
        f"/api/v1/appointments/{appt_id}/cancel",
        headers=auth(token_of(client_user)),
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["cancelled_at"] is not None


@pytest.mark.asyncio
async def test_artist_can_update_appointment_details(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client_user = await sign_up(client, "grace@example.com", "client")
    tok = token_of(artist)

    created = await client.post(
        "/api/v1/appointments",
        headers=auth(tok),
        json=_appt_payload(user_id_of(client_user)),
    )
    appt_id = created.json()["id"]

    updated = await client.patch(
        f"/api/v1/appointments/{appt_id}",
        headers=auth(tok),
        json={"location": "Lekki Phase 1 Studio", "duration_minutes": 90},
    )
    assert updated.status_code == 200
    assert updated.json()["location"] == "Lekki Phase 1 Studio"
    assert updated.json()["duration_minutes"] == 90


@pytest.mark.asyncio
async def test_artist_cannot_access_another_artists_appointment(client):
    artist1 = await sign_up(client, "artist1@example.com", "artist")
    artist2 = await sign_up(client, "artist2@example.com", "artist")
    client_user = await sign_up(client, "grace@example.com", "client")

    created = await client.post(
        "/api/v1/appointments",
        headers=auth(token_of(artist1)),
        json=_appt_payload(user_id_of(client_user)),
    )
    appt_id = created.json()["id"]

    # Artist 2 tries to read artist 1's appointment.
    res = await client.get(
        f"/api/v1/appointments/{appt_id}", headers=auth(token_of(artist2))
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_cogs_tracking_and_summary(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client_user = await sign_up(client, "grace@example.com", "client")
    tok = token_of(artist)

    created = await client.post(
        "/api/v1/appointments",
        headers=auth(tok),
        json=_appt_payload(user_id_of(client_user), quoted_price=50000.0),
    )
    appt_id = created.json()["id"]

    # Mark as completed with a final price.
    await client.post(f"/api/v1/appointments/{appt_id}/confirm", headers=auth(tok))
    await client.post(f"/api/v1/appointments/{appt_id}/complete", headers=auth(tok))
    await client.patch(
        f"/api/v1/appointments/{appt_id}",
        headers=auth(tok),
        json={"final_price": 50000.0},
    )

    # Add two product usages (COGS).
    p1 = await client.post(
        f"/api/v1/appointments/{appt_id}/products",
        headers=auth(tok),
        json={"product_name": "Foundation", "brand": "MAC", "quantity": 1, "unit_cost": 8500},
    )
    assert p1.status_code == 201
    assert p1.json()["cogs"] == 8500.0

    p2 = await client.post(
        f"/api/v1/appointments/{appt_id}/products",
        headers=auth(tok),
        json={"product_name": "Lipstick", "brand": "NARS", "quantity": 2, "unit_cost": 3200},
    )
    assert p2.json()["cogs"] == 6400.0

    # COGS summary.
    summary = await client.get(
        f"/api/v1/appointments/{appt_id}/cogs-summary", headers=auth(tok)
    )
    assert summary.status_code == 200
    body = summary.json()
    assert body["total_cogs"] == 14900.0
    assert body["final_price"] == 50000.0
    # Gross margin = (50000 - 14900) / 50000 * 100 = 70.2
    assert body["gross_margin_pct"] == pytest.approx(70.2, abs=0.1)
    assert len(body["products"]) == 2


@pytest.mark.asyncio
async def test_remove_product_from_appointment(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client_user = await sign_up(client, "grace@example.com", "client")
    tok = token_of(artist)

    created = await client.post(
        "/api/v1/appointments",
        headers=auth(tok),
        json=_appt_payload(user_id_of(client_user)),
    )
    appt_id = created.json()["id"]

    p = await client.post(
        f"/api/v1/appointments/{appt_id}/products",
        headers=auth(tok),
        json={"product_name": "Blush", "brand": "Charlotte", "unit_cost": 4000},
    )
    product_id = p.json()["id"]

    delete = await client.delete(
        f"/api/v1/appointments/{appt_id}/products/{product_id}", headers=auth(tok)
    )
    assert delete.status_code == 204

    summary = await client.get(
        f"/api/v1/appointments/{appt_id}/cogs-summary", headers=auth(tok)
    )
    assert summary.json()["total_cogs"] == 0.0
    assert len(summary.json()["products"]) == 0
