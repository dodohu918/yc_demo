"""Initial database schema

Revision ID: 001
Revises:
Create Date: 2024-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create projects table
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Create batches table
    op.create_table(
        "batches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Create landmarks table
    op.create_table(
        "landmarks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("abbreviation", sa.String(10), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("display_order", sa.Integer, default=0),
    )

    # Create images table
    op.create_table(
        "images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(512), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("width", sa.Integer, nullable=False),
        sa.Column("height", sa.Integer, nullable=False),
        sa.Column("mime_type", sa.String(50), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Create tasks table
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "batch_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("batches.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "image_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("images.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("pending", "in_progress", "completed", "reviewed", name="taskstatus"),
            default="pending",
        ),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Create model_versions table
    op.create_table(
        "model_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("version", sa.String(50), unique=True, nullable=False),
        sa.Column("model_path", sa.String(512), nullable=False),
        sa.Column("architecture", sa.String(100), nullable=False),
        sa.Column("encoder", sa.String(100), nullable=False),
        sa.Column("training_dataset", sa.Text, nullable=True),
        sa.Column("metrics", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, default=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Create annotations table
    op.create_table(
        "annotations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "image_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("images.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "landmark_id",
            sa.Integer,
            sa.ForeignKey("landmarks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("x", sa.Float, nullable=False),
        sa.Column("y", sa.Float, nullable=False),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column(
            "source",
            sa.Enum("manual", "ai_predicted", "ai_corrected", name="annotationsource"),
            default="manual",
        ),
        sa.Column(
            "model_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("model_versions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("is_visible", sa.Boolean, default=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Create annotation_feedback table
    op.create_table(
        "annotation_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "annotation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("annotations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "action",
            sa.Enum("accepted", "adjusted", "rejected", name="feedbackaction"),
            nullable=False,
        ),
        sa.Column("original_x", sa.Float, nullable=False),
        sa.Column("original_y", sa.Float, nullable=False),
        sa.Column("corrected_x", sa.Float, nullable=True),
        sa.Column("corrected_y", sa.Float, nullable=True),
        sa.Column("correction_distance", sa.Float, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Create indexes
    op.create_index("ix_annotations_image_id", "annotations", ["image_id"])
    op.create_index("ix_annotations_landmark_id", "annotations", ["landmark_id"])
    op.create_index("ix_tasks_batch_id", "tasks", ["batch_id"])
    op.create_index("ix_tasks_status", "tasks", ["status"])


def downgrade() -> None:
    op.drop_index("ix_tasks_status")
    op.drop_index("ix_tasks_batch_id")
    op.drop_index("ix_annotations_landmark_id")
    op.drop_index("ix_annotations_image_id")

    op.drop_table("annotation_feedback")
    op.drop_table("annotations")
    op.drop_table("model_versions")
    op.drop_table("tasks")
    op.drop_table("images")
    op.drop_table("landmarks")
    op.drop_table("batches")
    op.drop_table("projects")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS feedbackaction")
    op.execute("DROP TYPE IF EXISTS annotationsource")
    op.execute("DROP TYPE IF EXISTS taskstatus")
