"""Audio streaming router."""
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import or_

from ..database import SessionLocal
from ..models import Speaker, Segment

router = APIRouter()


@router.get("/{project_id}/{speaker_id}/{filename}")
async def stream_audio(project_id: str, speaker_id: str, filename: str):
    """Stream an audio file."""
    db = SessionLocal()
    try:
        # Check both active segments (speaker_id) and trashed segments (deleted_from_speaker_id)
        segment = db.query(Segment).filter(
            Segment.project_id == project_id,
            Segment.audio_filename == filename,
            or_(
                Segment.speaker_id == speaker_id,
                Segment.deleted_from_speaker_id == speaker_id
            )
        ).first()

        if not segment:
            raise HTTPException(status_code=404, detail="Audio file not found")

        audio_path = segment.audio_path

        if not os.path.exists(audio_path):
            raise HTTPException(status_code=404, detail="Audio file not found on disk")

        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            filename=filename,
        )
    finally:
        db.close()
