from app.core.config import get_settings
from tests.helpers import auth, sign_up, token_of

JPEG = b"\xff\xd8\xff\xe0fake-jpeg-bytes"


async def test_upload_and_fetch_photo(client):
    token = token_of(await sign_up(client, "c@example.com"))
    res = await client.post(
        "/api/v1/media",
        files={"file": ("me.jpg", JPEG, "image/jpeg")},
        headers=auth(token),
    )
    assert res.status_code == 201, res.text
    url = res.json()["url"]
    assert url.startswith("/media/") and url.endswith(".jpg")

    fetched = await client.get(url)
    assert fetched.status_code == 200
    assert fetched.content == JPEG


async def test_upload_requires_auth(client):
    res = await client.post("/api/v1/media", files={"file": ("me.jpg", JPEG, "image/jpeg")})
    assert res.status_code == 401


async def test_upload_rejects_non_images(client):
    token = token_of(await sign_up(client, "c@example.com"))
    res = await client.post(
        "/api/v1/media",
        files={"file": ("x.gif", b"GIF89a", "image/gif")},
        headers=auth(token),
    )
    assert res.status_code == 415


async def test_upload_rejects_oversize(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "media_max_bytes", 10)
    token = token_of(await sign_up(client, "c@example.com"))
    res = await client.post(
        "/api/v1/media",
        files={"file": ("me.jpg", JPEG, "image/jpeg")},
        headers=auth(token),
    )
    assert res.status_code == 413


async def test_fetch_rejects_unknown_and_traversal(client):
    assert (await client.get("/media/" + "0" * 32 + ".jpg")).status_code == 404
    assert (await client.get("/media/..%2F..%2Fetc%2Fpasswd")).status_code == 404


async def test_upload_data_url(client):
    import base64

    token = token_of(await sign_up(client, "c@example.com"))
    data_url = "data:image/png;base64," + base64.b64encode(b"\x89PNG-ish").decode()
    res = await client.post(
        "/api/v1/media/data-url", json={"data_url": data_url}, headers=auth(token)
    )
    assert res.status_code == 201, res.text
    url = res.json()["url"]
    assert url.endswith(".png")
    assert (await client.get(url)).content == b"\x89PNG-ish"

    bad = await client.post(
        "/api/v1/media/data-url",
        json={"data_url": "data:image/png;base64,@@@notbase64"},
        headers=auth(token),
    )
    assert bad.status_code == 400
