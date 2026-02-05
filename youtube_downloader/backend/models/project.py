"""Project model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship

from ..database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    youtube_url = Column(Text, nullable=False)
    title = Column(String(500), nullable=False)
    original_audio_path = Column(Text)
    splits_directory = Column(Text)
    status = Column(String(50), default="pending")  # pending, processing, completed, error
    error_message = Column(Text)
    progress = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    speakers = relationship("Speaker", back_populates="project", cascade="all, delete-orphan")
    segments = relationship("Segment", back_populates="project", cascade="all, delete-orphan")
