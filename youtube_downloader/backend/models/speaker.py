"""Speaker model."""
import uuid
from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Speaker(Base):
    __tablename__ = "speakers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    original_label = Column(String(50), nullable=False)  # SPEAKER_00
    display_name = Column(String(200), nullable=False)  # User can rename
    folder_path = Column(Text)
    segment_count = Column(Integer, default=0)
    total_duration = Column(Float, default=0.0)

    project = relationship("Project", back_populates="speakers")
    segments = relationship("Segment", back_populates="speaker", cascade="all, delete-orphan")
