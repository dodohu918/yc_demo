"""
Database models for the Cephalometric MVP.
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


# Enums
class TaskStatus(str, PyEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"


class AnnotationSource(str, PyEnum):
    MANUAL = "manual"
    AI_PREDICTED = "ai_predicted"
    AI_CORRECTED = "ai_corrected"


class FeedbackAction(str, PyEnum):
    ACCEPTED = "accepted"
    ADJUSTED = "adjusted"
    REJECTED = "rejected"


# Models
class Project(Base):
    """Project containing batches of annotation tasks."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    batches: Mapped[List["Batch"]] = relationship(
        "Batch", back_populates="project", cascade="all, delete-orphan"
    )


class Batch(Base):
    """Batch of images within a project."""

    __tablename__ = "batches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="batches")
    tasks: Mapped[List["Task"]] = relationship(
        "Task", back_populates="batch", cascade="all, delete-orphan"
    )


class Task(Base):
    """Annotation task for a single image."""

    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False
    )
    image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("images.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, values_callable=lambda x: [e.value for e in x]),
        default=TaskStatus.PENDING
    )
    assigned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch", back_populates="tasks")
    image: Mapped["Image"] = relationship("Image", back_populates="tasks")


class Landmark(Base):
    """Standard cephalometric landmark definitions."""

    __tablename__ = "landmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    abbreviation: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    annotations: Mapped[List["Annotation"]] = relationship(
        "Annotation", back_populates="landmark"
    )


class Image(Base):
    """Uploaded cephalometric X-ray images."""

    __tablename__ = "images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    tasks: Mapped[List["Task"]] = relationship(
        "Task", back_populates="image", cascade="all, delete-orphan"
    )
    annotations: Mapped[List["Annotation"]] = relationship(
        "Annotation", back_populates="image", cascade="all, delete-orphan"
    )


class Annotation(Base):
    """Landmark annotations on images."""

    __tablename__ = "annotations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("images.id", ondelete="CASCADE"), nullable=False
    )
    landmark_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("landmarks.id", ondelete="CASCADE"), nullable=False
    )
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    source: Mapped[AnnotationSource] = mapped_column(
        Enum(AnnotationSource, values_callable=lambda x: [e.value for e in x]),
        default=AnnotationSource.MANUAL
    )
    model_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("model_versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    image: Mapped["Image"] = relationship("Image", back_populates="annotations")
    landmark: Mapped["Landmark"] = relationship("Landmark", back_populates="annotations")
    model_version: Mapped[Optional["ModelVersion"]] = relationship(
        "ModelVersion", back_populates="annotations"
    )
    feedback: Mapped[List["AnnotationFeedback"]] = relationship(
        "AnnotationFeedback", back_populates="annotation", cascade="all, delete-orphan"
    )


class AnnotationFeedback(Base):
    """User feedback on AI predictions for RLHF."""

    __tablename__ = "annotation_feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    annotation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("annotations.id", ondelete="CASCADE"),
        nullable=False,
    )
    action: Mapped[FeedbackAction] = mapped_column(
        Enum(FeedbackAction, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    original_x: Mapped[float] = mapped_column(Float, nullable=False)
    original_y: Mapped[float] = mapped_column(Float, nullable=False)
    corrected_x: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    corrected_y: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    correction_distance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    annotation: Mapped["Annotation"] = relationship(
        "Annotation", back_populates="feedback"
    )


class ModelVersion(Base):
    """ML model versions for tracking predictions."""

    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    version: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    model_path: Mapped[str] = mapped_column(String(512), nullable=False)
    architecture: Mapped[str] = mapped_column(String(100), nullable=False)
    encoder: Mapped[str] = mapped_column(String(100), nullable=False)
    training_dataset: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metrics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    annotations: Mapped[List["Annotation"]] = relationship(
        "Annotation", back_populates="model_version"
    )
