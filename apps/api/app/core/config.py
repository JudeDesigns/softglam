from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    jwt_secret: str = "change-me-in-prod-please-this-is-only-for-dev"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h
    refresh_token_expire_days: int = 30

    # --- AI ---
    gemini_api_key: str = ""


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
