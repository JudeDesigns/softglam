"""add appointments and appointment_products tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-01 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'appointments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('artist_id', sa.Uuid(), nullable=False),
        sa.Column('client_id', sa.Uuid(), nullable=False),
        sa.Column('look_request_id', sa.Uuid(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('location', sa.String(length=512), nullable=True),
        sa.Column('service_name', sa.String(length=240), nullable=False),
        sa.Column('notes', sa.String(length=2000), nullable=True),
        sa.Column('quoted_price', sa.Float(), nullable=True),
        sa.Column('final_price', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='booked'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['artist_id'], ['users.id']),
        sa.ForeignKeyConstraint(['client_id'], ['users.id']),
        sa.ForeignKeyConstraint(['look_request_id'], ['look_requests.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_appointments_artist_id', 'appointments', ['artist_id'])
    op.create_index('ix_appointments_client_id', 'appointments', ['client_id'])
    op.create_index('ix_appointments_scheduled_at', 'appointments', ['scheduled_at'])
    op.create_index('ix_appointments_status', 'appointments', ['status'])

    op.create_table(
        'appointment_products',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('appointment_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=True),
        sa.Column('product_name', sa.String(length=240), nullable=False),
        sa.Column('brand', sa.String(length=120), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit_cost', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_appointment_products_appointment_id', 'appointment_products', ['appointment_id'])


def downgrade() -> None:
    op.drop_index('ix_appointment_products_appointment_id', table_name='appointment_products')
    op.drop_table('appointment_products')
    op.drop_index('ix_appointments_status', table_name='appointments')
    op.drop_index('ix_appointments_scheduled_at', table_name='appointments')
    op.drop_index('ix_appointments_client_id', table_name='appointments')
    op.drop_index('ix_appointments_artist_id', table_name='appointments')
    op.drop_table('appointments')
