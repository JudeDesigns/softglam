"""look requests: recipe, reference photos, unbounded image URLs

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-11-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('look_requests', sa.Column('reference_urls', sa.JSON(), nullable=True))
    op.add_column('look_requests', sa.Column('recipe', sa.JSON(), nullable=True))
    op.alter_column('look_requests', 'client_photo_url', type_=sa.Text(), existing_nullable=False)
    op.alter_column('look_requests', 'generated_url', type_=sa.Text(), existing_nullable=False)


def downgrade() -> None:
    op.alter_column('look_requests', 'generated_url', type_=sa.String(length=512), existing_nullable=False)
    op.alter_column('look_requests', 'client_photo_url', type_=sa.String(length=512), existing_nullable=False)
    op.drop_column('look_requests', 'recipe')
    op.drop_column('look_requests', 'reference_urls')
