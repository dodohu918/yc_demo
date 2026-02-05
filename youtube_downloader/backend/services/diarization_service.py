"""Diarization service wrapping youtube_downloader.py functionality."""
import os
import sys
import uuid
import asyncio
from pathlib import Path
from typing import Optional, Callable
from concurrent.futures import ThreadPoolExecutor

# Add parent directory to path to import youtube_downloader
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from youtube_downloader import (
    download_video,
    diarize_audio,
    split_audio_by_speaker,
    save_diarization_result,
    format_timestamp,
    PYANNOTE_AVAILABLE,
)

from ..config import DOWNLOADS_DIR, HF_TOKEN
from ..database import SessionLocal
from ..models import Project, Speaker, Segment

# Thread pool for running blocking operations
executor = ThreadPoolExecutor(max_workers=2)

# Store for active jobs
active_jobs: dict = {}


class DiarizationJob:
    """Represents a diarization job."""

    def __init__(self, job_id: str, project_id: str, youtube_url: str, num_speakers: Optional[int] = None):
        self.job_id = job_id
        self.project_id = project_id
        self.youtube_url = youtube_url
        self.num_speakers = num_speakers
        self.status = "pending"
        self.progress = ""
        self.error_message = None


def update_project_status(project_id: str, status: str, progress: str = "", error_message: str = None):
    """Update project status in database."""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.status = status
            project.progress = progress
            if error_message:
                project.error_message = error_message
            db.commit()
    finally:
        db.close()


def run_diarization_sync(job: DiarizationJob):
    """Run diarization synchronously (called in thread pool)."""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == job.project_id).first()
        if not project:
            job.status = "error"
            job.error_message = "Project not found"
            return

        # Step 1: Download audio
        job.status = "processing"
        job.progress = "Downloading audio..."
        update_project_status(job.project_id, "processing", "Downloading audio...")

        try:
            audio_path = download_video(
                job.youtube_url,
                str(DOWNLOADS_DIR),
                "audio"
            )
        except SystemExit:
            job.status = "error"
            job.error_message = "Failed to download video"
            update_project_status(job.project_id, "error", error_message="Failed to download video")
            return

        if not audio_path or not os.path.exists(audio_path):
            job.status = "error"
            job.error_message = "Audio download failed"
            update_project_status(job.project_id, "error", error_message="Audio download failed")
            return

        project.original_audio_path = audio_path
        db.commit()

        # Step 2: Run diarization
        job.progress = "Running speaker diarization..."
        update_project_status(job.project_id, "processing", "Running speaker diarization...")

        if not PYANNOTE_AVAILABLE:
            job.status = "error"
            job.error_message = "pyannote.audio not available"
            update_project_status(job.project_id, "error", error_message="pyannote.audio not available")
            return

        hf_token = HF_TOKEN
        if not hf_token:
            job.status = "error"
            job.error_message = "HF_TOKEN not configured"
            update_project_status(job.project_id, "error", error_message="HF_TOKEN not configured")
            return

        segments = diarize_audio(audio_path, hf_token, job.num_speakers)

        if not segments:
            job.status = "error"
            job.error_message = "Diarization failed"
            update_project_status(job.project_id, "error", error_message="Diarization failed")
            return

        # Step 3: Split audio
        job.progress = "Splitting audio by speaker..."
        update_project_status(job.project_id, "processing", "Splitting audio by speaker...")

        splits_dir = split_audio_by_speaker(audio_path, segments, str(DOWNLOADS_DIR))

        if not splits_dir:
            job.status = "error"
            job.error_message = "Audio splitting failed"
            update_project_status(job.project_id, "error", error_message="Audio splitting failed")
            return

        project.splits_directory = splits_dir
        db.commit()

        # Step 4: Save diarization JSON
        save_diarization_result(segments, str(DOWNLOADS_DIR), os.path.basename(audio_path))

        # Step 5: Create speakers and segments in database
        job.progress = "Saving to database..."
        update_project_status(job.project_id, "processing", "Saving to database...")

        # Group segments by speaker
        from collections import defaultdict
        speaker_segments = defaultdict(list)
        for seg in segments:
            speaker_segments[seg['speaker']].append(seg)

        speaker_map = {}  # Map original label to speaker ID

        for speaker_label in sorted(speaker_segments.keys()):
            segs = speaker_segments[speaker_label]
            total_duration = sum(s['end'] - s['start'] for s in segs)

            # Create speaker folder path
            speaker_folder_name = speaker_label.lower().replace('speaker_', 'speaker_')
            speaker_folder = os.path.join(splits_dir, speaker_folder_name)

            speaker = Speaker(
                project_id=job.project_id,
                original_label=speaker_label,
                display_name=speaker_label,
                folder_path=speaker_folder,
                segment_count=len(segs),
                total_duration=total_duration,
            )
            db.add(speaker)
            db.flush()
            speaker_map[speaker_label] = speaker.id

        db.commit()

        # Create segments
        for speaker_label, segs in speaker_segments.items():
            speaker_id = speaker_map[speaker_label]
            speaker_folder_name = speaker_label.lower().replace('speaker_', 'speaker_')
            speaker_folder = os.path.join(splits_dir, speaker_folder_name)

            for i, seg in enumerate(segs, 1):
                start = seg['start']
                end = seg['end']
                duration = end - start

                if duration < 0.1:
                    continue

                # Format filename to match split_audio_by_speaker output
                minutes = int(start // 60)
                secs = int(start % 60)
                millis = int((start % 1) * 1000)
                timestamp_str = f"{minutes:02d}-{secs:02d}-{millis:03d}"
                audio_filename = f"{i:03d}_{timestamp_str}.mp3"
                audio_path_full = os.path.join(speaker_folder, audio_filename)

                segment = Segment(
                    project_id=job.project_id,
                    speaker_id=speaker_id,
                    original_speaker_id=speaker_id,
                    audio_filename=audio_filename,
                    audio_path=audio_path_full,
                    start_time=start,
                    end_time=end,
                    duration=duration,
                    start_time_formatted=format_timestamp(start),
                    order_index=i,
                )
                db.add(segment)

        db.commit()

        # Done
        job.status = "completed"
        job.progress = "Completed"
        update_project_status(job.project_id, "completed", "Completed")

    except Exception as e:
        job.status = "error"
        job.error_message = str(e)
        update_project_status(job.project_id, "error", error_message=str(e))
    finally:
        db.close()


async def start_diarization(youtube_url: str, title: str, num_speakers: Optional[int] = None) -> tuple[str, str]:
    """Start a diarization job asynchronously.

    Returns:
        tuple of (job_id, project_id)
    """
    db = SessionLocal()
    try:
        # Create project
        project = Project(
            youtube_url=youtube_url,
            title=title,
            status="pending",
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        project_id = project.id
    finally:
        db.close()

    # Create job
    job_id = str(uuid.uuid4())
    job = DiarizationJob(job_id, project_id, youtube_url, num_speakers)
    active_jobs[job_id] = job

    # Run in thread pool
    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, run_diarization_sync, job)

    return job_id, project_id


def get_job_status(job_id: str) -> Optional[DiarizationJob]:
    """Get status of a diarization job."""
    return active_jobs.get(job_id)


class FileJob:
    """Represents a file-based diarization job."""

    def __init__(self, job_id: str, project_id: str, file_path: str, num_speakers: Optional[int] = None):
        self.job_id = job_id
        self.project_id = project_id
        self.file_path = file_path
        self.num_speakers = num_speakers
        self.status = "pending"
        self.progress = ""
        self.error_message = None


def extract_audio_from_video(video_path: str) -> Optional[str]:
    """Extract audio from video file using ffmpeg."""
    import subprocess

    base_name = os.path.splitext(video_path)[0]
    audio_path = f"{base_name}.mp3"

    cmd = [
        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-i', video_path,
        '-vn',  # No video
        '-acodec', 'libmp3lame',
        '-q:a', '2',  # High quality
        audio_path
    ]

    try:
        subprocess.run(cmd, check=True)
        return audio_path
    except subprocess.CalledProcessError as e:
        print(f"Error extracting audio: {e}")
        return None
    except FileNotFoundError:
        print("Error: ffmpeg not found")
        return None


def run_file_diarization_sync(job: FileJob):
    """Run diarization on a local file synchronously."""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == job.project_id).first()
        if not project:
            job.status = "error"
            job.error_message = "Project not found"
            return

        job.status = "processing"
        audio_path = job.file_path

        # Check if it's a video file that needs audio extraction
        video_extensions = {'.mov', '.mp4', '.avi', '.mkv', '.webm'}
        file_ext = os.path.splitext(job.file_path)[1].lower()

        if file_ext in video_extensions:
            job.progress = "Extracting audio from video..."
            update_project_status(job.project_id, "processing", "Extracting audio from video...")

            audio_path = extract_audio_from_video(job.file_path)
            if not audio_path or not os.path.exists(audio_path):
                job.status = "error"
                job.error_message = "Failed to extract audio from video"
                update_project_status(job.project_id, "error", error_message="Failed to extract audio from video")
                return

        project.original_audio_path = audio_path
        db.commit()

        # Run diarization
        job.progress = "Running speaker diarization..."
        update_project_status(job.project_id, "processing", "Running speaker diarization...")

        if not PYANNOTE_AVAILABLE:
            job.status = "error"
            job.error_message = "pyannote.audio not available"
            update_project_status(job.project_id, "error", error_message="pyannote.audio not available")
            return

        hf_token = HF_TOKEN
        if not hf_token:
            job.status = "error"
            job.error_message = "HF_TOKEN not configured"
            update_project_status(job.project_id, "error", error_message="HF_TOKEN not configured")
            return

        segments = diarize_audio(audio_path, hf_token, job.num_speakers)

        if not segments:
            job.status = "error"
            job.error_message = "Diarization failed"
            update_project_status(job.project_id, "error", error_message="Diarization failed")
            return

        # Split audio
        job.progress = "Splitting audio by speaker..."
        update_project_status(job.project_id, "processing", "Splitting audio by speaker...")

        splits_dir = split_audio_by_speaker(audio_path, segments, str(DOWNLOADS_DIR))

        if not splits_dir:
            job.status = "error"
            job.error_message = "Audio splitting failed"
            update_project_status(job.project_id, "error", error_message="Audio splitting failed")
            return

        project.splits_directory = splits_dir
        db.commit()

        # Save diarization JSON
        save_diarization_result(segments, str(DOWNLOADS_DIR), os.path.basename(audio_path))

        # Create speakers and segments in database
        job.progress = "Saving to database..."
        update_project_status(job.project_id, "processing", "Saving to database...")

        from collections import defaultdict
        speaker_segments = defaultdict(list)
        for seg in segments:
            speaker_segments[seg['speaker']].append(seg)

        speaker_map = {}

        for speaker_label in sorted(speaker_segments.keys()):
            segs = speaker_segments[speaker_label]
            total_duration = sum(s['end'] - s['start'] for s in segs)

            speaker_folder_name = speaker_label.lower().replace('speaker_', 'speaker_')
            speaker_folder = os.path.join(splits_dir, speaker_folder_name)

            speaker = Speaker(
                project_id=job.project_id,
                original_label=speaker_label,
                display_name=speaker_label,
                folder_path=speaker_folder,
                segment_count=len(segs),
                total_duration=total_duration,
            )
            db.add(speaker)
            db.flush()
            speaker_map[speaker_label] = speaker.id

        db.commit()

        for speaker_label, segs in speaker_segments.items():
            speaker_id = speaker_map[speaker_label]
            speaker_folder_name = speaker_label.lower().replace('speaker_', 'speaker_')
            speaker_folder = os.path.join(splits_dir, speaker_folder_name)

            for i, seg in enumerate(segs, 1):
                start = seg['start']
                end = seg['end']
                duration = end - start

                if duration < 0.1:
                    continue

                minutes = int(start // 60)
                secs = int(start % 60)
                millis = int((start % 1) * 1000)
                timestamp_str = f"{minutes:02d}-{secs:02d}-{millis:03d}"
                audio_filename = f"{i:03d}_{timestamp_str}.mp3"
                audio_path_full = os.path.join(speaker_folder, audio_filename)

                segment = Segment(
                    project_id=job.project_id,
                    speaker_id=speaker_id,
                    original_speaker_id=speaker_id,
                    audio_filename=audio_filename,
                    audio_path=audio_path_full,
                    start_time=start,
                    end_time=end,
                    duration=duration,
                    start_time_formatted=format_timestamp(start),
                    order_index=i,
                )
                db.add(segment)

        db.commit()

        job.status = "completed"
        job.progress = "Completed"
        update_project_status(job.project_id, "completed", "Completed")

    except Exception as e:
        job.status = "error"
        job.error_message = str(e)
        update_project_status(job.project_id, "error", error_message=str(e))
    finally:
        db.close()


async def start_diarization_from_file(file_path: str, title: str, num_speakers: Optional[int] = None) -> tuple[str, str]:
    """Start a diarization job from a local file.

    Returns:
        tuple of (job_id, project_id)
    """
    db = SessionLocal()
    try:
        project = Project(
            youtube_url=f"file://{file_path}",
            title=title,
            status="pending",
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        project_id = project.id
    finally:
        db.close()

    job_id = str(uuid.uuid4())
    job = FileJob(job_id, project_id, file_path, num_speakers)
    active_jobs[job_id] = job

    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, run_file_diarization_sync, job)

    return job_id, project_id
