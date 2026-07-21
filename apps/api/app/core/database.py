from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    future=True,
    pool_pre_ping=True,
)

SessionFactory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency that yields a request-scoped async session."""
    async with SessionFactory() as session:
        yield session


async def create_all() -> None:
    """Create all tables. Used only in tests; real schema is managed by Alembic."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def drop_all() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
