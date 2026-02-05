"""Pydantic schemas for API validation."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Project schemas
class ProjectCreate(BaseModel):
    youtube_url: str
    num_speakers: Optional[int] = None


class ProjectResponse(BaseModel):
    id: str
    youtube_url: str
    title: str
    original_audio_path: Optional[str]
    splits_directory: Optional[str]
    status: str
    error_message: Optional[str]
    progress: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]


# Speaker schemas
class SpeakerUpdate(BaseModel):
    display_name: str


class SpeakerResponse(BaseModel):
    id: str
    project_id: str
    original_label: str
    display_name: str
    folder_path: Optional[str]
    segment_count: int
    total_duration: float

    class Config:
        from_attributes = True


class SpeakerWithSegments(SpeakerResponse):
    segments: List["SegmentResponse"]


class MergeSpeakersRequest(BaseModel):
    source_speaker_id: str
    target_speaker_id: str


# Segment schemas
class SegmentUpdate(BaseModel):
    transcription: Optional[str] = None


class SegmentReassign(BaseModel):
    new_speaker_id: str


class SegmentResponse(BaseModel):
    id: str
    project_id: str
    speaker_id: Optional[str]
    original_speaker_id: Optional[str]
    audio_filename: str
    audio_path: str
    start_time: Optional[float]
    end_time: Optional[float]
    duration: Optional[float]
    start_time_formatted: Optional[str]
    transcription: Optional[str]
    order_index: Optional[int]
    is_deleted: Optional[bool] = False
    deleted_from_speaker_id: Optional[str] = None

    class Config:
        from_attributes = True


class TrashSegmentResponse(SegmentResponse):
    deleted_from_speaker_name: Optional[str] = None


# Diarization schemas
class DiarizationStartRequest(BaseModel):
    youtube_url: str
    num_speakers: Optional[int] = None


class LocalFileRequest(BaseModel):
    file_path: str
    num_speakers: Optional[int] = None


class DiarizationStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[str] = None
    error_message: Optional[str] = None
    project_id: Optional[str] = None


# Export schemas
class ExportTranscriptResponse(BaseModel):
    transcript: str


class SaveRequest(BaseModel):
    segments: List[dict]


# Update forward refs
SpeakerWithSegments.model_rebuild()
