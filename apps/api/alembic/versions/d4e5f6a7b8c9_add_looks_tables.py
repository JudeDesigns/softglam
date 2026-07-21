"""add look_sections and looks tables, seed static catalog

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-07-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Seed data mirrors the retired static catalog in
# app/modules/looks/catalog.py / apps/mobile/src/try-on/looks.ts so ids stay
# stable for existing look_requests.look_id references.
SECTIONS = [
    ("editorial", "Editorial", "Magazine-cover finishes", 0),
    ("bridal", "Bridal", "Romantic, luminous, all-day", 1),
    ("everyday", "Everyday", "Polished, low-effort, your skin only better", 2),
    ("bold", "Bold", "Statement looks for night", 3),
]

LOOKS = [
    ("bronze-couture", "editorial", "Bronze Couture", "Warm contour, glazed lip", "glow", "#A85B3A", "#B96A4E", "#7C4B2A", 0),
    ("liquid-gold", "editorial", "Liquid Gold", "Gilded lid, nude lip", "glow", "#C9876A", "#D89570", "#C99A3A", 1),
    ("smoke-mirrors", "editorial", "Smoke & Mirrors", "Charcoal smoke, neutral mouth", "matte", "#9C6450", "#A77762", "#3D3530", 2),
    ("velvet-plum", "editorial", "Velvet Plum", "Deep plum lip, satin lid", "satin", "#6F2840", "#A35C68", "#5A3A4A", 3),
    ("rose-veil", "bridal", "Rose Veil", "Soft rose halo", "satin", "#C77074", "#E0A0A4", "#B58C8E", 0),
    ("champagne-glow", "bridal", "Champagne Glow", "Pearl shimmer, peach lip", "glow", "#D89478", "#EBB89C", "#D9B984", 1),
    ("soft-sculpt", "bridal", "Soft Sculpt", "Subtle contour, nude rose", "satin", "#B97A6E", "#C68B80", "#A88474", 2),
    ("pearl-lustre", "bridal", "Pearl Lustre", "Iridescent lid, mauve lip", "glow", "#B0717C", "#D29DA6", "#C7B9C2", 3),
    ("bare-plus", "everyday", "Bare+", "Tinted balm, fresh cheek", "satin", "#C58177", "#D9988E", "#B59586", 0),
    ("coffee-shop", "everyday", "Coffee Shop", "Cocoa lip, soft warmth", "matte", "#8E5340", "#A37665", "#6F4C3A", 1),
    ("office-polish", "everyday", "Office Polish", "Mauve lip, defined brow", "satin", "#A06A6E", "#BD8689", "#80645E", 2),
    ("crimson-statement", "bold", "Crimson Statement", "Red lip, clean lid", "matte", "#9C2A2A", "#B05A52", "#5C4036", 0),
    ("midnight-wing", "bold", "Midnight Wing", "Liner wing, mauve lip", "matte", "#7F4F58", "#9E6D70", "#161616", 1),
    ("berry-bomb", "bold", "Berry Bomb", "Berry stain, bronzed lid", "satin", "#6B2638", "#A65265", "#7A4534", 2),
]


def upgrade() -> None:
    op.create_table(
        'look_sections',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('subtitle', sa.String(length=240), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_look_sections_sort_order'), 'look_sections', ['sort_order'], unique=False)

    op.create_table(
        'looks',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('section_id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('caption', sa.String(length=240), nullable=False),
        sa.Column('finish', sa.String(length=16), nullable=False),
        sa.Column('shade_lip', sa.String(length=16), nullable=False),
        sa.Column('shade_cheek', sa.String(length=16), nullable=False),
        sa.Column('shade_eye', sa.String(length=16), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('preview_image_url', sa.Text(), nullable=True),
        sa.Column('preview_generated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['section_id'], ['look_sections.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_looks_section_id'), 'looks', ['section_id'], unique=False)
    op.create_index(op.f('ix_looks_sort_order'), 'looks', ['sort_order'], unique=False)

    # Seed with the retired static catalog so mobile/admin keep working with no downtime.
    from datetime import UTC, datetime

    now = datetime.now(UTC).replace(tzinfo=None)
    sections_table = sa.table(
        'look_sections',
        sa.column('id', sa.String), sa.column('title', sa.String), sa.column('subtitle', sa.String),
        sa.column('sort_order', sa.Integer), sa.column('created_at', sa.DateTime), sa.column('updated_at', sa.DateTime),
    )
    looks_table = sa.table(
        'looks',
        sa.column('id', sa.String), sa.column('section_id', sa.String), sa.column('name', sa.String),
        sa.column('caption', sa.String), sa.column('finish', sa.String),
        sa.column('shade_lip', sa.String), sa.column('shade_cheek', sa.String), sa.column('shade_eye', sa.String),
        sa.column('sort_order', sa.Integer), sa.column('created_at', sa.DateTime), sa.column('updated_at', sa.DateTime),
    )
    op.bulk_insert(
        sections_table,
        [
            {"id": id_, "title": title, "subtitle": subtitle, "sort_order": order, "created_at": now, "updated_at": now}
            for id_, title, subtitle, order in SECTIONS
        ],
    )
    op.bulk_insert(
        looks_table,
        [
            {
                "id": id_, "section_id": section_id, "name": name, "caption": caption, "finish": finish,
                "shade_lip": lip, "shade_cheek": cheek, "shade_eye": eye, "sort_order": order,
                "created_at": now, "updated_at": now,
            }
            for id_, section_id, name, caption, finish, lip, cheek, eye, order in LOOKS
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_looks_sort_order'), table_name='looks')
    op.drop_index(op.f('ix_looks_section_id'), table_name='looks')
    op.drop_table('looks')
    op.drop_index(op.f('ix_look_sections_sort_order'), table_name='look_sections')
    op.drop_table('look_sections')
