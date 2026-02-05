"""
Landmarks API endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Landmark, get_db
from app.schemas.schemas import LandmarkResponse

router = APIRouter()


@router.get("", response_model=List[LandmarkResponse])
async def get_landmarks(db: AsyncSession = Depends(get_db)):
    """Get all 19 standard cephalometric landmarks."""
    result = await db.execute(
        select(Landmark).order_by(Landmark.display_order)
    )
    landmarks = result.scalars().all()
    return landmarks


@router.get("/{landmark_id}", response_model=LandmarkResponse)
async def get_landmark(landmark_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific landmark by ID."""
    result = await db.execute(
        select(Landmark).where(Landmark.id == landmark_id)
    )
    landmark = result.scalar_one_or_none()
    if not landmark:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Landmark not found")
    return landmark
