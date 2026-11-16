from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_JWT_SECRET = "change-me-in-prod-please-this-is-only-for-dev"
MIN_PROD_SECRET_LENGTH = 32


class Settings(BaseSettings):
    """Runtime configuration loaded from environment / .env file.

    Anything secret must live in env vars; defaults below are safe for local
    development inside the docker-compose stack only.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["dev", "test", "prod"] = "dev"
    debug: bool = False

    # --- API ---
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])

    # --- Database ---
    # Async SQLAlchemy URL. asyncpg in prod, aiosqlite for tests.
    database_url: str = "postgresql+asyncpg://softglow:softglow@db:5432/softglow"
    db_echo: bool = False

    # --- Security ---
    jwt_secret: str = DEV_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h
    refresh_token_expire_days: int = 30

    # --- AI ---
    gemini_api_key: str = ""

    # --- Media ---
    # Uploaded photos and AI results are written here and served at /media.
    # Inside docker-compose this is a named volume; swap for S3 later.
    media_dir: str = "media"
    media_max_bytes: int = 8 * 1024 * 1024

    @model_validator(mode="after")
    def _refuse_unsafe_production_config(self) -> "Settings":
        """In prod, fail at startup rather than run with dev-only defaults."""
        if self.environment != "prod":
            return self
        problems: list[str] = []
        if self.jwt_secret == DEV_JWT_SECRET or len(self.jwt_secret) < MIN_PROD_SECRET_LENGTH:
            problems.append(
                f"JWT_SECRET must be a unique random value of at least {MIN_PROD_SECRET_LENGTH} "
                'characters (python -c "import secrets; print(secrets.token_urlsafe(48))")'
            )
        if not self.cors_origins or "*" in self.cors_origins:
            problems.append(
                'CORS_ORIGINS must list the exact allowed origins, e.g. ["https://admin.example.com"]'
            )
        if self.debug:
            problems.append("DEBUG must be false")
        if problems:
            raise ValueError("Unsafe production config:\n- " + "\n- ".join(problems))
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
