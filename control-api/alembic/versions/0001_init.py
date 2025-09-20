"""initial tables

Revision ID: 0001
Revises:
Create Date: 2024-02-20
"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'policy_profiles',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String, nullable=False, unique=True),
        sa.Column('dlp_profile', sa.String, nullable=False),
        sa.Column('egress_allowlist', sa.JSON, nullable=False, default=list),
        sa.Column('rate_limit', sa.Integer, nullable=False, default=60),
    )
    op.create_table(
        'tools',
        sa.Column('tool_id', sa.String, primary_key=True),
        sa.Column('name', sa.String, nullable=False),
        sa.Column('owner', sa.String, nullable=False),
        sa.Column('endpoint', sa.String, nullable=False),
        sa.Column('version', sa.String, nullable=False),
        sa.Column('scopes', sa.JSON, nullable=False),
        sa.Column('data_class', sa.String, nullable=False),
        sa.Column('status', sa.String, nullable=False),
        sa.Column('signature_status', sa.String),
        sa.Column('sbom_url', sa.String),
        sa.Column('schema_ref', sa.String, nullable=False),
        sa.Column('egress_allow', sa.JSON, nullable=False, default=list),
        sa.Column('policy_profile', sa.String, sa.ForeignKey('policy_profiles.name')),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        'grants',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('group', sa.String, nullable=False),
        sa.Column('tool_id', sa.String, sa.ForeignKey('tools.tool_id'), nullable=False),
        sa.Column('scopes', sa.JSON, nullable=False),
        sa.Column('env', sa.String, nullable=False),
        sa.Column('expires_at', sa.DateTime),
        sa.UniqueConstraint('group', 'tool_id', 'env', name='uq_grant_identity'),
    )


def downgrade():
    op.drop_table('grants')
    op.drop_table('tools')
    op.drop_table('policy_profiles')
