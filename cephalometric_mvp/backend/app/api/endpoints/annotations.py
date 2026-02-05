"""
Annotations API endpoints - manage landmark annotations.
"""
import math
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import Annotation, AnnotationFeedback, Image, Landmark, get_db
from app.db.models import AnnotationSource, FeedbackAction
from app.schemas.schemas import (
    AnnotationBulkCreate,
    AnnotationBulkResponse,
    AnnotationCreate,
    AnnotationResponse,
    AnnotationUpdate,
    FeedbackCreate,
    FeedbackResponse,
)

router = APIRouter()


@router.get("", response_model=List[AnnotationResponse])
async def list_annotations(
    image_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List annotations, optionally filtered by image_id."""
    query = select(Annotation).options(selectinload(Annotation.landmark))
    if image_id:
        query = query.where(Annotation.image_id == image_id)
    query = query.order_by(Annotation.landmark_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=AnnotationResponse, status_code=201)
async def create_annotation(
    annotation: AnnotationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a single annotation."""
    # Verify image exists
    result = await db.execute(
        select(Image).where(Image.id == annotation.image_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Image not found")

    # Verify landmark exists
    result = await db.execute(
        select(Landmark).where(Landmark.id == annotation.landmark_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Landmark not found")

    # Check if annotation already exists for this image+landmark
    result = await db.execute(
        select(Annotation).where(
            Annotation.image_id == annotation.image_id,
            Annotation.landmark_id == annotation.landmark_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        # Update existing annotation
        existing.x = annotation.x
        existing.y = annotation.y
        existing.source = annotation.source
        existing.confidence = annotation.confidence
        await db.flush()
        # Reload with landmark relationship
        result = await db.execute(
            select(Annotation)
            .where(Annotation.id == existing.id)
            .options(selectinload(Annotation.landmark))
        )
        return result.scalar_one()

    # Create new annotation
    db_annotation = Annotation(
        image_id=annotation.image_id,
        landmark_id=annotation.landmark_id,
        x=annotation.x,
        y=annotation.y,
        source=annotation.source,
        confidence=annotation.confidence,
    )
    db.add(db_annotation)
    await db.flush()
    # Reload with landmark relationship
    result = await db.execute(
        select(Annotation)
        .where(Annotation.id == db_annotation.id)
        .options(selectinload(Annotation.landmark))
    )
    return result.scalar_one()


@router.post("/bulk", response_model=AnnotationBulkResponse, status_code=201)
async def create_bulk_annotations(
    bulk: AnnotationBulkCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create or update multiple annotations for an image at once."""
    # Verify image exists
    result = await db.execute(
        select(Image).where(Image.id == bulk.image_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Image not found")

    annotation_ids = []
    for anno in bulk.annotations:
        # Check if annotation exists
        result = await db.execute(
            select(Annotation).where(
                Annotation.image_id == bulk.image_id,
                Annotation.landmark_id == anno.landmark_id,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.x = anno.x
            existing.y = anno.y
            existing.source = bulk.source
            await db.flush()
            annotation_ids.append(existing.id)
        else:
            db_annotation = Annotation(
                image_id=bulk.image_id,
                landmark_id=anno.landmark_id,
                x=anno.x,
                y=anno.y,
                source=bulk.source,
            )
            db.add(db_annotation)
            await db.flush()
            annotation_ids.append(db_annotation.id)

    # Reload all annotations with landmark relationships
    result = await db.execute(
        select(Annotation)
        .where(Annotation.id.in_(annotation_ids))
        .options(selectinload(Annotation.landmark))
        .order_by(Annotation.landmark_id)
    )
    created_annotations = result.scalars().all()

    return AnnotationBulkResponse(
        created=len(created_annotations),
        annotations=[
            AnnotationResponse.model_validate(a) for a in created_annotations
        ],
    )


@router.get("/{annotation_id}", response_model=AnnotationResponse)
async def get_annotation(
    annotation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific annotation."""
    result = await db.execute(
        select(Annotation)
        .where(Annotation.id == annotation_id)
        .options(selectinload(Annotation.landmark))
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return annotation


@router.patch("/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    annotation_id: UUID,
    update: AnnotationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an annotation (typically after user correction)."""
    result = await db.execute(
        select(Annotation).where(Annotation.id == annotation_id)
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(annotation, field, value)

    # If position changed and was AI-predicted, mark as corrected
    if ("x" in update_data or "y" in update_data) and annotation.source == AnnotationSource.AI_PREDICTED:
        annotation.source = AnnotationSource.AI_CORRECTED

    await db.flush()
    # Reload with landmark relationship
    result = await db.execute(
        select(Annotation)
        .where(Annotation.id == annotation_id)
        .options(selectinload(Annotation.landmark))
    )
    return result.scalar_one()


@router.delete("/{annotation_id}", status_code=204)
async def delete_annotation(
    annotation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an annotation."""
    result = await db.execute(
        select(Annotation).where(Annotation.id == annotation_id)
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    await db.delete(annotation)


# ============== Feedback Endpoints ==============


@router.post("/{annotation_id}/feedback", response_model=FeedbackResponse, status_code=201)
async def create_feedback(
    annotation_id: UUID,
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Record user feedback on an AI prediction.
    This is used for RLHF data collection.
    """
    result = await db.execute(
        select(Annotation).where(Annotation.id == annotation_id)
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    # Calculate correction distance if adjusted
    correction_distance = None
    if feedback.action == FeedbackAction.ADJUSTED and feedback.corrected_x is not None and feedback.corrected_y is not None:
        correction_distance = math.sqrt(
            (feedback.corrected_x - annotation.x) ** 2
            + (feedback.corrected_y - annotation.y) ** 2
        )

    db_feedback = AnnotationFeedback(
        annotation_id=annotation_id,
        action=feedback.action,
        original_x=annotation.x,
        original_y=annotation.y,
        corrected_x=feedback.corrected_x,
        corrected_y=feedback.corrected_y,
        correction_distance=correction_distance,
    )
    db.add(db_feedback)

    # If adjusted, update the annotation position
    if feedback.action == FeedbackAction.ADJUSTED and feedback.corrected_x is not None and feedback.corrected_y is not None:
        annotation.x = feedback.corrected_x
        annotation.y = feedback.corrected_y
        annotation.source = AnnotationSource.AI_CORRECTED

    await db.flush()
    await db.refresh(db_feedback)
    return db_feedback


@router.get("/{annotation_id}/feedback", response_model=List[FeedbackResponse])
async def get_annotation_feedback(
    annotation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all feedback for an annotation."""
    result = await db.execute(
        select(AnnotationFeedback)
        .where(AnnotationFeedback.annotation_id == annotation_id)
        .order_by(AnnotationFeedback.created_at.desc())
    )
    feedback = result.scalars().all()
    return feedback
