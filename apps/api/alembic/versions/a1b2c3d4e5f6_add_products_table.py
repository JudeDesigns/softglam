"""add products table

Revision ID: a1b2c3d4e5f6
Revises: d0244a1d771a
Create Date: 2026-07-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'd0244a1d771a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'products',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('brand', sa.String(length=120), nullable=False),
        sa.Column('name', sa.String(length=240), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('health_score', sa.Integer(), nullable=False),
        sa.Column('is_toxin_free', sa.Boolean(), nullable=False),
        sa.Column('targets', sa.JSON(), nullable=True),
        sa.Column('ingredients', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_products_brand'), 'products', ['brand'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_products_brand'), table_name='products')
    op.drop_table('products')
