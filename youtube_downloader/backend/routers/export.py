"""Export router."""
import io
import json
import zipfile
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Project, Speaker, Segment

router = APIRouter()


@router.get("/{project_id}/json")
async def export_json(project_id: str, db: Session = Depends(get_db)):
    """Export project as JSON."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    speakers = db.query(Speaker).filter(Speaker.project_id == project_id).all()

    export_data = {
        "project": {
            "id": project.id,
            "title": project.title,
            "youtube_url": project.youtube_url,
            "created_at": project.created_at.isoformat() if project.created_at else None,
        },
        "speakers": [],
    }

    for speaker in speakers:
        segments = db.query(Segment).filter(
            Segment.speaker_id == speaker.id
        ).order_by(Segment.start_time).all()

        speaker_data = {
            "id": speaker.id,
            "original_label": speaker.original_label,
            "display_name": speaker.display_name,
            "segment_count": len(segments),
            "total_duration": sum(s.duration or 0 for s in segments),
            "segments": [
                {
                    "id": seg.id,
                    "audio_filename": seg.audio_filename,
                    "start_time": seg.start_time,
                    "end_time": seg.end_time,
                    "duration": seg.duration,
                    "start_time_formatted": seg.start_time_formatted,
                    "transcription": seg.transcription,
                }
                for seg in segments
            ],
        }
        export_data["speakers"].append(speaker_data)

    return JSONResponse(content=export_data)


@router.get("/{project_id}/transcript")
async def export_transcript(project_id: str, db: Session = Depends(get_db)):
    """Export project as text transcript."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    segments = db.query(Segment).filter(
        Segment.project_id == project_id
    ).order_by(Segment.start_time).all()

    lines = [f"# {project.title}", f"# Source: {project.youtube_url}", ""]

    for segment in segments:
        speaker = db.query(Speaker).filter(Speaker.id == segment.speaker_id).first()
        speaker_name = speaker.display_name if speaker else "Unknown"
        timestamp = segment.start_time_formatted or ""
        transcription = segment.transcription or "[No transcription]"

        lines.append(f"[{timestamp}] {speaker_name}: {transcription}")

    return PlainTextResponse(content="\n".join(lines))


@router.post("/{project_id}/save")
async def save_project(project_id: str, db: Session = Depends(get_db)):
    """Save project state (currently a no-op as changes are saved immediately)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project saved"}


@router.get("/{project_id}/audio")
async def export_audio(
    project_id: str,
    speaker_ids: Optional[str] = Query(None, description="Comma-separated speaker IDs to include"),
    db: Session = Depends(get_db)
):
    """Export audio files as a zip archive."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Parse speaker IDs if provided
    selected_speaker_ids = None
    if speaker_ids:
        selected_speaker_ids = [s.strip() for s in speaker_ids.split(",") if s.strip()]

    # Get speakers
    speakers_query = db.query(Speaker).filter(Speaker.project_id == project_id)
    if selected_speaker_ids:
        speakers_query = speakers_query.filter(Speaker.id.in_(selected_speaker_ids))
    speakers = speakers_query.all()

    if not speakers:
        raise HTTPException(status_code=404, detail="No speakers found")

    # Create zip in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for speaker in speakers:
            # Get non-deleted segments for this speaker
            segments = db.query(Segment).filter(
                Segment.speaker_id == speaker.id,
                Segment.is_deleted == False
            ).order_by(Segment.order_index).all()

            # Create folder name from speaker display name
            folder_name = speaker.display_name.replace("/", "-").replace("\\", "-")

            for segment in segments:
                # Read the audio file
                audio_path = segment.audio_path
                if os.path.exists(audio_path):
                    # Add to zip with speaker folder structure
                    arc_name = f"{folder_name}/{segment.audio_filename}"
                    zip_file.write(audio_path, arc_name)

    zip_buffer.seek(0)

    # Generate filename
    safe_title = project.title.replace("/", "-").replace("\\", "-").replace(" ", "_")[:50]
    filename = f"{safe_title}_audio.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
