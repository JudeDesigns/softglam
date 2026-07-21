"""add admin to userrole enum and convert timestamps to timestamptz

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-01 00:02:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'admin' value to the userrole enum (safe to run even if already exists)
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'admin'")

    # Convert all TIMESTAMP WITHOUT TIME ZONE columns to TIMESTAMPTZ
    # so that Python's timezone-aware datetime.now(UTC) works correctly.
    tables_and_cols = [
        ("users", ["created_at", "updated_at"]),
        ("artist_profiles", ["created_at", "updated_at"]),
        ("invites", ["created_at", "accepted_at"]),
        ("look_requests", ["created_at", "viewed_at", "responded_at"]),
        ("skin_profiles", ["captured_at", "updated_at"]),
        ("appointments", ["created_at", "updated_at", "scheduled_at", "completed_at", "cancelled_at"]),
        ("appointment_products", ["created_at"]),
        ("products", ["created_at", "updated_at"]),
    ]
    for table, cols in tables_and_cols:
        for col in cols:
            op.execute(
                f"ALTER TABLE {table} ALTER COLUMN {col} TYPE TIMESTAMPTZ "
                f"USING {col} AT TIME ZONE 'UTC'"
            )


def downgrade() -> None:
    # Convert TIMESTAMPTZ back to TIMESTAMP WITHOUT TIME ZONE
    tables_and_cols = [
        ("users", ["created_at", "updated_at"]),
        ("artist_profiles", ["created_at", "updated_at"]),
        ("invites", ["created_at", "accepted_at"]),
        ("look_requests", ["created_at", "viewed_at", "responded_at"]),
        ("skin_profiles", ["captured_at", "updated_at"]),
        ("appointments", ["created_at", "updated_at", "scheduled_at", "completed_at", "cancelled_at"]),
        ("appointment_products", ["created_at"]),
        ("products", ["created_at", "updated_at"]),
    ]
    for table, cols in tables_and_cols:
        for col in cols:
            op.execute(
                f"ALTER TABLE {table} ALTER COLUMN {col} TYPE TIMESTAMP "
                f"USING {col} AT TIME ZONE 'UTC'"
            )
    # Note: cannot remove enum values in Postgres without recreating the type
