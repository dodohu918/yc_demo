"""Segments router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Segment, Speaker
from ..schemas import SegmentResponse, SegmentUpdate, SegmentReassign

router = APIRouter()


@router.put("/{project_id}/segments/{segment_id}", response_model=SegmentResponse)
async def update_segment(
    project_id: str,
    segment_id: str,
    update: SegmentUpdate,
    db: Session = Depends(get_db)
):
    """Update segment transcription."""
    segment = db.query(Segment).filter(
        Segment.id == segment_id,
        Segment.project_id == project_id
    ).first()

    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    if update.transcription is not None:
        segment.transcription = update.transcription

    db.commit()
    db.refresh(segment)

    return segment


@router.put("/{project_id}/segments/{segment_id}/reassign", response_model=SegmentResponse)
async def reassign_segment(
    project_id: str,
    segment_id: str,
    reassign: SegmentReassign,
    db: Session = Depends(get_db)
):
    """Move segment to a different speaker."""
    segment = db.query(Segment).filter(
        Segment.id == segment_id,
        Segment.project_id == project_id
    ).first()

    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    new_speaker = db.query(Speaker).filter(
        Speaker.id == reassign.new_speaker_id,
        Speaker.project_id == project_id
    ).first()

    if not new_speaker:
        raise HTTPException(status_code=404, detail="New speaker not found")

    old_speaker_id = segment.speaker_id
    segment.speaker_id = reassign.new_speaker_id

    # Update speaker stats (only count non-deleted segments)
    if old_speaker_id:
        old_speaker = db.query(Speaker).filter(Speaker.id == old_speaker_id).first()
        if old_speaker:
            old_segments = db.query(Segment).filter(
                Segment.speaker_id == old_speaker_id,
                Segment.is_deleted == False
            ).all()
            old_speaker.segment_count = len(old_segments)
            old_speaker.total_duration = sum(s.duration or 0 for s in old_segments)

    new_segments = db.query(Segment).filter(
        Segment.speaker_id == new_speaker.id,
        Segment.is_deleted == False
    ).all()
    new_speaker.segment_count = len(new_segments)
    new_speaker.total_duration = sum(s.duration or 0 for s in new_segments)

    db.commit()
    db.refresh(segment)

    return segment


@router.delete("/{project_id}/segments/{segment_id}")
async def delete_segment(
    project_id: str,
    segment_id: str,
    db: Session = Depends(get_db)
):
    """Soft delete a single segment (move to trash)."""
    segment = db.query(Segment).filter(
        Segment.id == segment_id,
        Segment.project_id == project_id
    ).first()

    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    speaker_id = segment.speaker_id

    # Soft delete - move to trash
    segment.deleted_from_speaker_id = speaker_id
    segment.is_deleted = True
    segment.speaker_id = None

    # Update speaker stats
    if speaker_id:
        speaker = db.query(Speaker).filter(Speaker.id == speaker_id).first()
        if speaker:
            remaining_segments = db.query(Segment).filter(
                Segment.speaker_id == speaker_id,
                Segment.is_deleted == False
            ).all()
            speaker.segment_count = len(remaining_segments)
            speaker.total_duration = sum(s.duration or 0 for s in remaining_segments)

    db.commit()

    return {"message": "Segment moved to trash"}


@router.post("/{project_id}/segments/{segment_id}/restore")
async def restore_segment(
    project_id: str,
    segment_id: str,
    db: Session = Depends(get_db)
):
    """Restore a segment from trash."""
    segment = db.query(Segment).filter(
        Segment.id == segment_id,
        Segment.project_id == project_id,
        Segment.is_deleted == True
    ).first()

    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found in trash")

    # Restore to original speaker
    original_speaker_id = segment.deleted_from_speaker_id
    if original_speaker_id:
        speaker = db.query(Speaker).filter(Speaker.id == original_speaker_id).first()
        if speaker:
            segment.speaker_id = original_speaker_id
            segment.is_deleted = False
            segment.deleted_from_speaker_id = None

            # Update speaker stats
            active_segments = db.query(Segment).filter(
                Segment.speaker_id == original_speaker_id,
                Segment.is_deleted == False
            ).all()
            # Include the restored segment
            speaker.segment_count = len(active_segments) + 1
            speaker.total_duration = sum(s.duration or 0 for s in active_segments) + (segment.duration or 0)

            db.commit()
            return {"message": "Segment restored", "speaker_id": original_speaker_id}

    raise HTTPException(status_code=400, detail="Cannot restore - original speaker no longer exists")
