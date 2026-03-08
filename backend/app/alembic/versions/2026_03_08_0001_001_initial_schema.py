"""Initial schema — users, documents, query_history

Revision ID: 001
Revises: (none)
Create Date: 2026-03-08
"""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("department", sa.String(), nullable=True, index=True),
    )

    op.create_table(
        "documents",
        sa.Column("id", sa.String(), primary_key=True, index=True),
        sa.Column("filename", sa.String(), index=True),
        sa.Column("content_type", sa.String(), nullable=True),
        sa.Column("size", sa.Integer(), nullable=True),
        sa.Column("upload_date", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("status", sa.String(), server_default="uploaded"),
        sa.Column("path", sa.String(), nullable=True),
        sa.Column("department", sa.String(), nullable=True, index=True),
        sa.Column("error_message", sa.Text(), nullable=True),
    )

    op.create_table(
        "query_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column("response_text", sa.Text(), nullable=True),
        sa.Column("llm_model_used", sa.String(), nullable=True),
        sa.Column("sources_retrieved", sa.JSON(), nullable=True),
        sa.Column("processing_time_ms", sa.Integer(), nullable=True),
        sa.Column("query_timestamp", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("department_filter", sa.String(), nullable=True, index=True),
        sa.Column("gpu_accelerated", sa.Boolean(), server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_table("query_history")
    op.drop_table("documents")
    op.drop_table("users")
