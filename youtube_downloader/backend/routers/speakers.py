"""Speakers router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Speaker, Segment
from ..schemas import SpeakerResponse, SpeakerUpdate, SpeakerWithSegments, MergeSpeakersRequest, SegmentResponse, TrashSegmentResponse

router = APIRouter()


@router.get("/{project_id}/speakers", response_model=List[SpeakerWithSegments])
async def list_speakers(project_id: str, db: Session = Depends(get_db)):
    """List all speakers for a project with their segments (excluding deleted)."""
    speakers = db.query(Speaker).filter(Speaker.project_id == project_id).all()

    result = []
    for speaker in speakers:
        segments = db.query(Segment).filter(
            Segment.speaker_id == speaker.id,
            Segment.is_deleted == False
        ).order_by(Segment.order_index).all()

        speaker_data = SpeakerWithSegments(
            id=speaker.id,
            project_id=speaker.project_id,
            original_label=speaker.original_label,
            display_name=speaker.display_name,
            folder_path=speaker.folder_path,
            segment_count=len(segments),
            total_duration=sum(s.duration or 0 for s in segments),
            segments=[SegmentResponse.model_validate(s) for s in segments],
        )
        result.append(speaker_data)

    return result


@router.get("/{project_id}/trash", response_model=List[TrashSegmentResponse])
async def get_trash(project_id: str, db: Session = Depends(get_db)):
    """Get all deleted segments for a project."""
    deleted_segments = db.query(Segment).filter(
        Segment.project_id == project_id,
        Segment.is_deleted == True
    ).order_by(Segment.start_time).all()

    result = []
    for segment in deleted_segments:
        # Get the speaker name it was deleted from
        speaker_name = None
        if segment.deleted_from_speaker_id:
            speaker = db.query(Speaker).filter(Speaker.id == segment.deleted_from_speaker_id).first()
            if speaker:
                speaker_name = speaker.display_name

        trash_item = TrashSegmentResponse(
            id=segment.id,
            project_id=segment.project_id,
            speaker_id=segment.speaker_id,
            original_speaker_id=segment.original_speaker_id,
            audio_filename=segment.audio_filename,
            audio_path=segment.audio_path,
            start_time=segment.start_time,
            end_time=segment.end_time,
            duration=segment.duration,
            start_time_formatted=segment.start_time_formatted,
            transcription=segment.transcription,
            order_index=segment.order_index,
            is_deleted=segment.is_deleted,
            deleted_from_speaker_id=segment.deleted_from_speaker_id,
            deleted_from_speaker_name=speaker_name,
        )
        result.append(trash_item)

    return result


@router.put("/{project_id}/speakers/{speaker_id}", response_model=SpeakerResponse)
async def update_speaker(
    project_id: str,
    speaker_id: str,
    update: SpeakerUpdate,
    db: Session = Depends(get_db)
):
    """Rename a speaker."""
    speaker = db.query(Speaker).filter(
        Speaker.id == speaker_id,
        Speaker.project_id == project_id
    ).first()

    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")

    speaker.display_name = update.display_name
    db.commit()
    db.refresh(speaker)

    return speaker


@router.post("/{project_id}/speakers/merge")
async def merge_speakers(
    project_id: str,
    request: MergeSpeakersRequest,
    db: Session = Depends(get_db)
):
    """Merge source speaker into target speaker."""
    source = db.query(Speaker).filter(
        Speaker.id == request.source_speaker_id,
        Speaker.project_id == project_id
    ).first()

    target = db.query(Speaker).filter(
        Speaker.id == request.target_speaker_id,
        Speaker.project_id == project_id
    ).first()

    if not source or not target:
        raise HTTPException(status_code=404, detail="Speaker not found")

    # Move all non-deleted segments from source to target
    segments = db.query(Segment).filter(
        Segment.speaker_id == source.id,
        Segment.is_deleted == False
    ).all()
    for segment in segments:
        segment.speaker_id = target.id

    # Update target stats (only count non-deleted segments)
    target_segments = db.query(Segment).filter(
        Segment.speaker_id == target.id,
        Segment.is_deleted == False
    ).all()
    target.segment_count = len(target_segments)
    target.total_duration = sum(s.duration or 0 for s in target_segments)

    # Delete source speaker
    db.delete(source)
    db.commit()

    return {"message": "Speakers merged", "target_speaker_id": target.id}


@router.delete("/{project_id}/speakers/{speaker_id}/segments")
async def delete_speaker_segments(
    project_id: str,
    speaker_id: str,
    db: Session = Depends(get_db)
):
    """Soft delete all segments for a speaker (move to trash)."""
    speaker = db.query(Speaker).filter(
        Speaker.id == speaker_id,
        Speaker.project_id == project_id
    ).first()

    if not speaker:
        raise HTTPException(status_code=404, detail="Speaker not found")

    # Soft delete all segments for this speaker
    segments = db.query(Segment).filter(
        Segment.speaker_id == speaker_id,
        Segment.is_deleted == False
    ).all()

    deleted_count = 0
    for segment in segments:
        segment.deleted_from_speaker_id = speaker_id
        segment.is_deleted = True
        segment.speaker_id = None
        deleted_count += 1

    # Update speaker stats
    speaker.segment_count = 0
    speaker.total_duration = 0

    db.commit()

    return {"message": f"Moved {deleted_count} segments to trash"}
