import pytest


@pytest.mark.asyncio
async def test_sign_up_returns_tokens(client):
    response = await client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "ada@example.com",
            "password": "verysecret1",
            "display_name": "Ada",
            "role": "client",
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["role"] == "client"
    assert body["tokens"]["access_token"]
    assert body["tokens"]["refresh_token"]


@pytest.mark.asyncio
async def test_sign_in_with_valid_credentials(client):
    await client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "ada@example.com",
            "password": "verysecret1",
            "display_name": "Ada",
        },
    )
    response = await client.post(
        "/api/v1/auth/sign-in",
        json={"email": "ada@example.com", "password": "verysecret1"},
    )
    assert response.status_code == 200
    assert response.json()["tokens"]["access_token"]


@pytest.mark.asyncio
async def test_sign_in_rejects_bad_password(client):
    await client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "ada@example.com",
            "password": "verysecret1",
            "display_name": "Ada",
        },
    )
    response = await client.post(
        "/api/v1/auth/sign-in",
        json={"email": "ada@example.com", "password": "wrongwrong"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_duplicate_email_is_rejected(client):
    payload = {
        "email": "ada@example.com",
        "password": "verysecret1",
        "display_name": "Ada",
    }
    first = await client.post("/api/v1/auth/sign-up", json=payload)
    assert first.status_code == 201
    second = await client.post("/api/v1/auth/sign-up", json=payload)
    assert second.status_code == 409
