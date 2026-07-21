"""Idempotent demo seeder.

Run inside the api container:
    docker compose exec api python -m app.scripts.seed_demo

Creates one demo client + two demo artists, each with a populated ArtistProfile,
so the live demo has data to render the artist picker and inbox immediately.
Re-running is safe; existing rows are updated in place.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime

from sqlmodel import select

from app import models  # noqa: F401  — register tables on SQLModel.metadata
from app.core.database import SessionFactory
from app.core.security import hash_password
from app.modules.artists.models import ArtistProfile
from app.modules.products.models import Product
from app.modules.users.models import User, UserRole

DEMO_PASSWORD = "softglow123"


@dataclass
class DemoArtist:
    email: str
    display_name: str
    handle: str
    city: str
    specialty: str
    rating: float
    response_time_hours: int
    finishes: list[str]
    years_experience: int
    bio: str


DEMO_CLIENTS: list[tuple[str, str]] = [
    ("client@softglow.demo", "Amara"),
]

DEMO_ADMIN: tuple[str, str] = ("admin@softglow.demo", "Super Admin")

DEMO_ARTISTS: list[DemoArtist] = [
    DemoArtist(
        email="amara@softglow.demo",
        display_name="Amara Okafor",
        handle="amara",
        city="Lagos",
        specialty="Bridal · soft glam",
        rating=4.9,
        response_time_hours=4,
        finishes=["satin", "glow"],
        years_experience=8,
        bio="Bridal and editorial in Lagos. Skin-first soft glam.",
    ),
    DemoArtist(
        email="zarah@softglow.demo",
        display_name="Zarah Bello",
        handle="zarah",
        city="Abuja",
        specialty="Editorial · graphic liner",
        rating=4.8,
        response_time_hours=12,
        finishes=["matte", "satin"],
        years_experience=6,
        bio="Editorial colour and liner work. Bookings open week-of.",
    ),
]


async def _upsert_user(
    session, email: str, display_name: str, role: UserRole
) -> User:
    existing = (
        await session.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    now = datetime.utcnow()
    if existing is None:
        user = User(
            email=email,
            password_hash=hash_password(DEMO_PASSWORD),
            role=role,
            display_name=display_name,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    existing.display_name = display_name
    existing.role = role
    existing.is_active = True
    existing.updated_at = now
    session.add(existing)
    await session.commit()
    await session.refresh(existing)
    return existing


async def _upsert_artist_profile(session, user: User, spec: DemoArtist) -> None:
    existing = (
        await session.execute(
            select(ArtistProfile).where(ArtistProfile.user_id == user.id)
        )
    ).scalar_one_or_none()
    now = datetime.utcnow()
    if existing is None:
        session.add(
            ArtistProfile(
                user_id=user.id,
                handle=spec.handle,
                city=spec.city,
                specialty=spec.specialty,
                rating=spec.rating,
                response_time_hours=spec.response_time_hours,
                finishes=spec.finishes,
                years_experience=spec.years_experience,
                bio=spec.bio,
            )
        )
    else:
        existing.handle = spec.handle
        existing.city = spec.city
        existing.specialty = spec.specialty
        existing.rating = spec.rating
        existing.response_time_hours = spec.response_time_hours
        existing.finishes = spec.finishes
        existing.years_experience = spec.years_experience
        existing.bio = spec.bio
        existing.updated_at = now
        session.add(existing)
    await session.commit()


DEMO_PRODUCTS = [
    {"brand": "Vellum", "name": "Calm Barrier Cream", "price": 38.00, "health_score": 88, "is_toxin_free": True, "targets": ["redness", "sensitivity", "dryness"]},
    {"brand": "Lumen Labs", "name": "Hydrating Niacinamide Serum 5%", "price": 28.00, "health_score": 91, "is_toxin_free": True, "targets": ["pores", "oiliness"]},
    {"brand": "Bloom", "name": "Overnight Retexture Mask", "price": 42.00, "health_score": 85, "is_toxin_free": False, "targets": ["acne", "pores"]},
    {"brand": "Vellum", "name": "Brightening Eye Salve", "price": 32.00, "health_score": 82, "is_toxin_free": True, "targets": ["darkCircles"]},
    {"brand": "Aura", "name": "Ceramide Replenishing Lotion", "price": 24.00, "health_score": 79, "is_toxin_free": True, "targets": ["dryness"]},
    {"brand": "Lumen Labs", "name": "Mattifying Daily SPF 40", "price": 30.00, "health_score": 86, "is_toxin_free": True, "targets": ["oiliness", "redness"]},
]


async def _upsert_products(session) -> None:
    for p in DEMO_PRODUCTS:
        existing = (
            await session.execute(
                select(Product).where(Product.name == p["name"], Product.brand == p["brand"])
            )
        ).scalar_one_or_none()
        if existing is None:
            session.add(Product(**p))
        else:
            for k, v in p.items():
                setattr(existing, k, v)
            existing.updated_at = datetime.utcnow()
            session.add(existing)
    await session.commit()


async def seed() -> None:
    async with SessionFactory() as session:
        for email, name in DEMO_CLIENTS:
            await _upsert_user(session, email, name, UserRole.client)
        for spec in DEMO_ARTISTS:
            user = await _upsert_user(
                session, spec.email, spec.display_name, UserRole.artist
            )
            await _upsert_artist_profile(session, user, spec)
        await _upsert_user(session, DEMO_ADMIN[0], DEMO_ADMIN[1], UserRole.admin)
        await _upsert_products(session)

    print(f"Seeded {len(DEMO_CLIENTS)} client(s), {len(DEMO_ARTISTS)} artist(s), 1 admin, and {len(DEMO_PRODUCTS)} product(s).")
    print(f"Demo password for every account: {DEMO_PASSWORD}")
    print(f"Admin login: {DEMO_ADMIN[0]} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
