"""Segment model."""
import uuid
from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from ..database import Base


class Segment(Base):
    __tablename__ = "segments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    speaker_id = Column(String, ForeignKey("speakers.id", ondelete="SET NULL"))
    original_speaker_id = Column(String)  # Track original for undo
    audio_filename = Column(String(500), nullable=False)
    audio_path = Column(Text, nullable=False)
    start_time = Column(Float)
    end_time = Column(Float)
    duration = Column(Float)
    start_time_formatted = Column(String(20))
    transcription = Column(Text)  # User-entered text
    order_index = Column(Integer)
    is_deleted = Column(Boolean, default=False)  # Soft delete flag
    deleted_from_speaker_id = Column(String)  # Track which speaker it was deleted from

    project = relationship("Project", back_populates="segments")
    speaker = relationship("Speaker", back_populates="segments")
