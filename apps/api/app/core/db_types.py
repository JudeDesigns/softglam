"""Shared SQLAlchemy column types."""

from sqlalchemy import DateTime

# Every timestamp is stored as TIMESTAMPTZ (see migration c3d4e5f6a7b8) and
# written as a timezone-aware UTC datetime. Declaring the column type here makes
# asyncpg send it as timestamptz; without it Postgres rejects aware datetimes
# ("can't subtract offset-naive and offset-aware datetimes"). SQLite, used by
# the tests, accepts either, which is why this only showed up on Postgres.
TZDateTime = DateTime(timezone=True)
