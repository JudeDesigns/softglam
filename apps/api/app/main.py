from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models as _models  # noqa: F401  — registers SQLModel tables
from app.core.config import get_settings
from app.modules.appointments.router import router as appointments_router
from app.modules.artists.router import router as artists_router
from app.modules.auth.router import router as auth_router
from app.modules.health.router import router as health_router
from app.modules.invites.router import router as invites_router
from app.modules.look_requests.router import router as look_requests_router
from app.modules.look_transfer.router import router as look_transfer_router
from app.modules.looks.router import router as looks_router
from app.modules.media.router import public_router as media_public_router
from app.modules.media.router import router as media_router
from app.modules.products.router import router as products_router
from app.modules.skin_profiles.router import router as skin_profiles_router
from app.modules.users.router import router as users_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Engine connections are created lazily; nothing to warm up yet. Keep the
    # hook so background workers (push, ai jobs) can be wired here later.
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Softglow API",
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        # Auth uses Bearer tokens, never cookies, so cross-site requests never
        # need credentials. Keeping this False means even a misconfigured "*"
        # origin can't be used to make credentialed requests.
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health is unversioned so smoke checks don't depend on the API contract.
    app.include_router(health_router)
    app.include_router(media_public_router)

    prefix = settings.api_v1_prefix
    app.include_router(auth_router, prefix=prefix)
    app.include_router(users_router, prefix=prefix)
    app.include_router(skin_profiles_router, prefix=prefix)
    app.include_router(artists_router, prefix=prefix)
    app.include_router(looks_router, prefix=prefix)
    app.include_router(look_requests_router, prefix=prefix)
    app.include_router(appointments_router, prefix=prefix)
    app.include_router(products_router, prefix=prefix)
    app.include_router(invites_router, prefix=prefix)
    app.include_router(media_router, prefix=prefix)
    app.include_router(look_transfer_router, prefix=prefix)

    return app


app = create_app()
