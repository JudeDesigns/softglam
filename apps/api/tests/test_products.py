"""
Product catalog tests — list, filter, get by ID, admin-only creation.
"""
import pytest

from tests.helpers import auth, sign_up, token_of

PRODUCT = {
    "brand": "Vellum",
    "name": "Calm Barrier Cream",
    "price": 38.0,
    "health_score": 88,
    "is_toxin_free": True,
    "targets": ["redness", "dryness"],
}


async def _seed_product(client, admin_tok: str, overrides: dict | None = None) -> dict:
    payload = {**PRODUCT, **(overrides or {})}
    res = await client.post("/api/v1/products", headers=auth(admin_tok), json=payload)
    assert res.status_code == 201, res.text
    return res.json()


@pytest.mark.asyncio
async def test_admin_can_create_product(client):
    admin = await sign_up(client, "admin@softglow.com", "admin")
    tok = token_of(admin)

    res = await client.post("/api/v1/products", headers=auth(tok), json=PRODUCT)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Calm Barrier Cream"
    assert data["health_score"] == 88
    assert data["is_toxin_free"] is True


@pytest.mark.asyncio
async def test_non_admin_cannot_create_product(client):
    artist = await sign_up(client, "artist@example.com", "artist")
    client_user = await sign_up(client, "client@example.com", "client")

    for tok in [token_of(artist), token_of(client_user)]:
        res = await client.post("/api/v1/products", headers=auth(tok), json=PRODUCT)
        assert res.status_code == 403


@pytest.mark.asyncio
async def test_authenticated_user_can_list_products(client):
    admin = await sign_up(client, "admin@softglow.com", "admin")
    client_user = await sign_up(client, "client@example.com", "client")

    await _seed_product(client, token_of(admin))
    await _seed_product(client, token_of(admin), {"name": "Serum A", "brand": "Lumen Labs"})

    res = await client.get("/api/v1/products", headers=auth(token_of(client_user)))
    assert res.status_code == 200
    assert len(res.json()) == 2


@pytest.mark.asyncio
async def test_unauthenticated_list_is_rejected(client):
    res = await client.get("/api/v1/products")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_filter_by_brand(client):
    admin = await sign_up(client, "admin@softglow.com", "admin")
    tok = token_of(admin)

    await _seed_product(client, tok, {"brand": "Vellum", "name": "P1"})
    await _seed_product(client, tok, {"brand": "Bloom", "name": "P2"})

    res = await client.get("/api/v1/products?brand=Vellum", headers=auth(tok))
    assert res.status_code == 200
    results = res.json()
    assert all(p["brand"] == "Vellum" for p in results)
    assert len(results) == 1


@pytest.mark.asyncio
async def test_filter_by_concern(client):
    admin = await sign_up(client, "admin@softglow.com", "admin")
    tok = token_of(admin)

    await _seed_product(client, tok, {"name": "Acne Cream", "targets": ["acne", "pores"]})
    await _seed_product(client, tok, {"name": "Glow Serum", "targets": ["dryness"]})

    res = await client.get("/api/v1/products?concern=acne", headers=auth(tok))
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 1
    assert results[0]["name"] == "Acne Cream"


@pytest.mark.asyncio
async def test_get_product_by_id(client):
    admin = await sign_up(client, "admin@softglow.com", "admin")
    tok = token_of(admin)

    created = await _seed_product(client, tok)
    product_id = created["id"]

    res = await client.get(f"/api/v1/products/{product_id}", headers=auth(tok))
    assert res.status_code == 200
    assert res.json()["id"] == product_id


@pytest.mark.asyncio
async def test_unknown_product_id_returns_404(client):
    from uuid import uuid4
    client_user = await sign_up(client, "client@example.com", "client")
    res = await client.get(f"/api/v1/products/{uuid4()}", headers=auth(token_of(client_user)))
    assert res.status_code == 404
