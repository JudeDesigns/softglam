"""Create an admin account, or promote an existing user to admin.

Admins can't sign up through the API. Run inside the api container:
    docker compose exec api python -m app.scripts.create_admin you@example.com "Your Name"

You'll be prompted for a password (not echoed). For an existing account the
password is left unchanged unless you enter a new one.
"""

from __future__ import annotations

import argparse
import asyncio
import getpass
from datetime import UTC, datetime

from sqlmodel import select

from app import models  # noqa: F401 — register tables on SQLModel.metadata
from app.core.database import SessionFactory
from app.core.security import hash_password
from app.modules.users.models import User, UserRole

MIN_PASSWORD_LENGTH = 12


def _ask_password(required: bool) -> str | None:
    prompt = "Password" if required else "New password (leave blank to keep current)"
    while True:
        password = getpass.getpass(f"{prompt}: ")
        if not password and not required:
            return None
        if len(password) < MIN_PASSWORD_LENGTH:
            print(f"Use at least {MIN_PASSWORD_LENGTH} characters.")
            continue
        if getpass.getpass("Repeat password: ") != password:
            print("Passwords don't match.")
            continue
        return password


async def create_admin(email: str, display_name: str) -> None:
    email = email.strip().lower()
    async with SessionFactory() as session:
        user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
        password = _ask_password(required=user is None)
        if user is None:
            assert password is not None
            user = User(
                email=email,
                password_hash=hash_password(password),
                role=UserRole.admin,
                display_name=display_name,
            )
            action = "Created"
        else:
            user.role = UserRole.admin
            user.is_active = True
            user.updated_at = datetime.now(UTC)
            if password:
                user.password_hash = hash_password(password)
            action = "Promoted"
        session.add(user)
        await session.commit()
    print(f"{action} admin: {email}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("email")
    parser.add_argument("display_name", nargs="?", default="Admin")
    args = parser.parse_args()
    asyncio.run(create_admin(args.email, args.display_name))


if __name__ == "__main__":
    main()
