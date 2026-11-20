"""look requests: structured quote (price + proposed time) and accept-to-book

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-11-16 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New status. ADD VALUE can't run inside a transaction block on older
    # Postgres, so run it in an autocommit block.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE lookrequeststatus ADD VALUE IF NOT EXISTS 'accepted'")

    op.add_column('look_requests', sa.Column('quoted_price', sa.Float(), nullable=True))
    op.add_column('look_requests', sa.Column('proposed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('look_requests', sa.Column('appointment_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_look_requests_appointment_id', 'look_requests', 'appointments',
        ['appointment_id'], ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_look_requests_appointment_id', 'look_requests', type_='foreignkey')
    op.drop_column('look_requests', 'appointment_id')
    op.drop_column('look_requests', 'proposed_at')
    op.drop_column('look_requests', 'quoted_price')
    # Postgres can't drop an enum value; 'accepted' stays in lookrequeststatus.
