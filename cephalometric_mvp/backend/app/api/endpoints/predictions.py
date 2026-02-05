"""
Predictions API endpoints - ML model inference.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db import Image, get_db
from app.schemas.schemas import PredictionRequest, PredictionResponse

router = APIRouter()

settings = get_settings()


@router.post("", response_model=None)
async def predict_landmarks(
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run AI prediction on an image to detect all 19 landmarks.
    In demo mode, returns a message indicating predictions are not available.
    """
    # Check if in demo mode
    if settings.demo_mode:
        raise HTTPException(
            status_code=503,
            detail="AI predictions are not available in demo mode.",
        )

    # Verify image exists
    result = await db.execute(
        select(Image).where(Image.id == request.image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # In non-demo mode, would load ML model and run prediction
    # For now, always return demo mode message
    raise HTTPException(
        status_code=503,
        detail="ML model not configured. Running in demo mode.",
    )


@router.get("/status")
async def get_prediction_status():
    """Check if the ML model is loaded and ready."""
    if settings.demo_mode:
        return {
            "model_loaded": False,
            "model_version": None,
            "device": "N/A",
            "demo_mode": True,
            "message": "AI predictions are not available in demo mode.",
        }

    return {
        "model_loaded": False,
        "model_version": None,
        "device": "N/A",
        "demo_mode": False,
    }
