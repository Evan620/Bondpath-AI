"""Add signature_tokens table

Revision ID: add_signature_tokens
Revises: 
Create Date: 2026-01-01

"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'signature_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_signature_tokens_case_id'), 'signature_tokens', ['case_id'], unique=False)
    op.create_index(op.f('ix_signature_tokens_token'), 'signature_tokens', ['token'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_signature_tokens_token'), table_name='signature_tokens')
    op.drop_index(op.f('ix_signature_tokens_case_id'), table_name='signature_tokens')
    op.drop_table('signature_tokens')
