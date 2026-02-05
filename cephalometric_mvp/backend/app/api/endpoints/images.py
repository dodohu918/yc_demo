"""
Images API endpoints - upload and manage cephalometric X-ray images.
"""
from pathlib import Path
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image as PILImage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db import Image, Annotation, get_db
from app.schemas.schemas import ImageResponse, ImageUploadResponse, AnnotationResponse

router = APIRouter()
settings = get_settings()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/bmp",
    "image/tiff",
}


def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type: {file.content_type}",
        )


@router.post("", response_model=ImageUploadResponse, status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a cephalometric X-ray image."""
    validate_image(file)

    # Generate unique filename
    ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = settings.upload_path / unique_filename

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Check file size
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_upload_size_mb}MB",
        )

    # Save file
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)

    # Get image dimensions
    try:
        with PILImage.open(file_path) as img:
            width, height = img.size
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

    # Create database record
    db_image = Image(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=file_size,
        width=width,
        height=height,
        mime_type=file.content_type or "image/jpeg",
    )
    db.add(db_image)
    await db.flush()
    await db.refresh(db_image)

    return ImageUploadResponse(
        image=ImageResponse.model_validate(db_image),
        message="Image uploaded successfully",
    )


@router.get("", response_model=List[ImageResponse])
async def get_images(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Get all uploaded images."""
    result = await db.execute(
        select(Image)
        .order_by(Image.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
    )
    images = result.scalars().all()
    return images


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(image_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific image."""
    result = await db.execute(
        select(Image).where(Image.id == image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@router.get("/{image_id}/annotations", response_model=List[AnnotationResponse])
async def get_image_annotations(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all annotations for an image."""
    # Verify image exists
    result = await db.execute(
        select(Image).where(Image.id == image_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Image not found")

    # Get annotations with landmark info
    result = await db.execute(
        select(Annotation)
        .where(Annotation.image_id == image_id)
        .options(selectinload(Annotation.landmark))
        .order_by(Annotation.landmark_id)
    )
    annotations = result.scalars().all()
    return annotations


@router.delete("/{image_id}", status_code=204)
async def delete_image(image_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete an image and its file."""
    result = await db.execute(
        select(Image).where(Image.id == image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete file if exists
    file_path = Path(image.file_path)
    file_path.unlink(missing_ok=True)

    await db.delete(image)
