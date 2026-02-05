"""
Pydantic schemas for API request/response validation.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.db.models import AnnotationSource, FeedbackAction, TaskStatus


# ============== Landmark Schemas ==============
class LandmarkBase(BaseModel):
    abbreviation: str
    name: str
    description: Optional[str] = None


class LandmarkResponse(LandmarkBase):
    id: int
    display_order: int

    class Config:
        from_attributes = True


# ============== Project Schemas ==============
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Image Schemas ==============
class ImageResponse(BaseModel):
    id: UUID
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    width: int
    height: int
    mime_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ImageUploadResponse(BaseModel):
    image: ImageResponse
    message: str


# ============== Annotation Schemas ==============
class AnnotationBase(BaseModel):
    landmark_id: int = Field(..., ge=1, le=19)
    x: float = Field(..., ge=0)
    y: float = Field(..., ge=0)


class AnnotationCreate(AnnotationBase):
    image_id: UUID
    source: AnnotationSource = AnnotationSource.MANUAL
    confidence: Optional[float] = Field(None, ge=0, le=1)


class AnnotationUpdate(BaseModel):
    x: Optional[float] = Field(None, ge=0)
    y: Optional[float] = Field(None, ge=0)
    is_visible: Optional[bool] = None


class AnnotationResponse(BaseModel):
    id: UUID
    image_id: UUID
    landmark_id: int
    x: float
    y: float
    confidence: Optional[float]
    source: AnnotationSource
    is_visible: bool
    created_at: datetime
    updated_at: datetime
    landmark: Optional[LandmarkResponse] = None

    class Config:
        from_attributes = True


class AnnotationBulkCreate(BaseModel):
    """Bulk create annotations for an image."""
    image_id: UUID
    annotations: List[AnnotationBase]
    source: AnnotationSource = AnnotationSource.MANUAL


class AnnotationBulkResponse(BaseModel):
    created: int
    annotations: List[AnnotationResponse]


# ============== Feedback Schemas ==============
class FeedbackCreate(BaseModel):
    action: FeedbackAction
    corrected_x: Optional[float] = Field(None, ge=0)
    corrected_y: Optional[float] = Field(None, ge=0)


class FeedbackResponse(BaseModel):
    id: UUID
    annotation_id: UUID
    action: FeedbackAction
    original_x: float
    original_y: float
    corrected_x: Optional[float]
    corrected_y: Optional[float]
    correction_distance: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Prediction Schemas ==============
class PredictionRequest(BaseModel):
    image_id: UUID


class PredictionPoint(BaseModel):
    landmark_id: int
    abbreviation: str
    name: str
    x: float
    y: float
    confidence: float


class PredictionResponse(BaseModel):
    image_id: UUID
    predictions: List[PredictionPoint]
    model_version: str


# ============== Export Schemas ==============
class ExportRequest(BaseModel):
    project_id: Optional[UUID] = None
    image_ids: Optional[List[UUID]] = None
    format: str = Field("csv", pattern="^(csv|json|coco)$")


# ============== Batch Schemas ==============
class BatchCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: UUID


class BatchResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Task Schemas ==============
class TaskResponse(BaseModel):
    id: UUID
    batch_id: UUID
    image_id: UUID
    status: TaskStatus
    assigned_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    image: Optional[ImageResponse] = None

    class Config:
        from_attributes = True
