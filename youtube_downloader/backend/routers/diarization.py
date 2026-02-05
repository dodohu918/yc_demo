"""Diarization router."""
import os
import re
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import yt_dlp

from ..schemas import DiarizationStartRequest, DiarizationStatusResponse, LocalFileRequest
from ..services.diarization_service import start_diarization, start_diarization_from_file, get_job_status
from ..config import DOWNLOADS_DIR, BASE_DIR

router = APIRouter()


def get_video_title(url: str) -> str:
    """Extract video title from YouTube URL."""
    try:
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            return info.get('title', 'Unknown Video')
    except Exception:
        return "Unknown Video"


def is_valid_youtube_url(url: str) -> bool:
    """Validate YouTube URL format."""
    youtube_patterns = [
        r'(https?://)?(www\.)?youtube\.com/watch\?v=[\w-]+',
        r'(https?://)?(www\.)?youtu\.be/[\w-]+',
        r'(https?://)?(www\.)?youtube\.com/shorts/[\w-]+',
    ]
    return any(re.match(pattern, url) for pattern in youtube_patterns)


@router.post("/start", response_model=DiarizationStatusResponse)
async def start_diarization_job(request: DiarizationStartRequest):
    """Start a new diarization job."""
    if not is_valid_youtube_url(request.youtube_url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    # Get video title
    title = get_video_title(request.youtube_url)

    # Start diarization
    job_id, project_id = await start_diarization(
        request.youtube_url,
        title,
        request.num_speakers
    )

    return DiarizationStatusResponse(
        job_id=job_id,
        status="pending",
        progress="Starting...",
        project_id=project_id,
    )


@router.post("/upload", response_model=DiarizationStatusResponse)
async def upload_and_diarize(
    file: UploadFile = File(...),
    num_speakers: Optional[int] = Form(None)
):
    """Upload a file and start diarization."""
    # Validate file type
    allowed_extensions = {'.wav', '.mp3', '.mov', '.mp4', '.m4a', '.ogg', '.flac'}
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )

    # Save uploaded file
    file_path = DOWNLOADS_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Get title from filename (without extension)
    title = os.path.splitext(file.filename)[0]

    # Start diarization
    job_id, project_id = await start_diarization_from_file(
        str(file_path),
        title,
        num_speakers
    )

    return DiarizationStatusResponse(
        job_id=job_id,
        status="pending",
        progress="Starting...",
        project_id=project_id,
    )


@router.post("/local", response_model=DiarizationStatusResponse)
async def diarize_local_file(request: LocalFileRequest):
    """Start diarization on a local file path."""
    try:
        file_path = request.file_path

        # If path is relative, resolve it relative to the project base directory
        if not os.path.isabs(file_path):
            file_path = str(BASE_DIR / file_path)

        # Validate file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=400, detail=f"File not found: {file_path}")

        # Validate file type
        allowed_extensions = {'.wav', '.mp3', '.mov', '.mp4', '.m4a', '.ogg', '.flac'}
        file_ext = os.path.splitext(file_path)[1].lower()

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )

        # Get title from filename (without extension)
        title = os.path.splitext(os.path.basename(file_path))[0]

        # Start diarization
        job_id, project_id = await start_diarization_from_file(
            file_path,
            title,
            request.num_speakers
        )

        return DiarizationStatusResponse(
            job_id=job_id,
            status="pending",
            progress="Starting...",
            project_id=project_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}/status", response_model=DiarizationStatusResponse)
async def get_diarization_status(job_id: str):
    """Get status of a diarization job."""
    job = get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return DiarizationStatusResponse(
        job_id=job_id,
        status=job.status,
        progress=job.progress,
        error_message=job.error_message,
        project_id=job.project_id,
    )
