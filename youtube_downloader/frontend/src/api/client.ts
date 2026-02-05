import axios from 'axios';
import type { Project, Speaker, Segment, DiarizationStatus, TrashSegment } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Projects
export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data.projects;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const deleteAllProjects = async (): Promise<void> => {
  await api.delete('/projects');
};

// Diarization
export const startDiarization = async (
  youtubeUrl: string,
  numSpeakers?: number
): Promise<DiarizationStatus> => {
  const response = await api.post('/diarization/start', {
    youtube_url: youtubeUrl,
    num_speakers: numSpeakers,
  });
  return response.data;
};

export const getDiarizationStatus = async (jobId: string): Promise<DiarizationStatus> => {
  const response = await api.get(`/diarization/${jobId}/status`);
  return response.data;
};

export const uploadAndDiarize = async (
  file: File,
  numSpeakers?: number
): Promise<DiarizationStatus> => {
  const formData = new FormData();
  formData.append('file', file);
  if (numSpeakers !== undefined) {
    formData.append('num_speakers', numSpeakers.toString());
  }

  const response = await api.post('/diarization/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const diarizeLocalFile = async (
  filePath: string,
  numSpeakers?: number
): Promise<DiarizationStatus> => {
  const response = await api.post('/diarization/local', {
    file_path: filePath,
    num_speakers: numSpeakers,
  });
  return response.data;
};

// Speakers
export const getSpeakers = async (projectId: string): Promise<Speaker[]> => {
  const response = await api.get(`/projects/${projectId}/speakers`);
  return response.data;
};

export const updateSpeaker = async (
  projectId: string,
  speakerId: string,
  displayName: string
): Promise<Speaker> => {
  const response = await api.put(`/projects/${projectId}/speakers/${speakerId}`, {
    display_name: displayName,
  });
  return response.data;
};

export const mergeSpeakers = async (
  projectId: string,
  sourceSpeakerId: string,
  targetSpeakerId: string
): Promise<void> => {
  await api.post(`/projects/${projectId}/speakers/merge`, {
    source_speaker_id: sourceSpeakerId,
    target_speaker_id: targetSpeakerId,
  });
};

// Segments
export const updateSegment = async (
  projectId: string,
  segmentId: string,
  transcription: string
): Promise<Segment> => {
  const response = await api.put(`/projects/${projectId}/segments/${segmentId}`, {
    transcription,
  });
  return response.data;
};

export const reassignSegment = async (
  projectId: string,
  segmentId: string,
  newSpeakerId: string
): Promise<Segment> => {
  const response = await api.put(`/projects/${projectId}/segments/${segmentId}/reassign`, {
    new_speaker_id: newSpeakerId,
  });
  return response.data;
};

export const deleteSegment = async (
  projectId: string,
  segmentId: string
): Promise<void> => {
  await api.delete(`/projects/${projectId}/segments/${segmentId}`);
};

export const deleteSpeakerSegments = async (
  projectId: string,
  speakerId: string
): Promise<void> => {
  await api.delete(`/projects/${projectId}/speakers/${speakerId}/segments`);
};

// Audio
export const getAudioUrl = (projectId: string, speakerId: string, filename: string): string => {
  return `${API_BASE}/audio/${projectId}/${speakerId}/${filename}`;
};

// Export
export const exportJson = async (projectId: string): Promise<object> => {
  const response = await api.get(`/export/${projectId}/json`);
  return response.data;
};

export const exportTranscript = async (projectId: string): Promise<string> => {
  const response = await api.get(`/export/${projectId}/transcript`);
  return response.data;
};

export const saveProject = async (projectId: string): Promise<void> => {
  await api.post(`/export/${projectId}/save`);
};

// Trash
export const getTrash = async (projectId: string): Promise<TrashSegment[]> => {
  const response = await api.get(`/projects/${projectId}/trash`);
  return response.data;
};

export const restoreSegment = async (
  projectId: string,
  segmentId: string
): Promise<{ message: string; speaker_id: string }> => {
  const response = await api.post(`/projects/${projectId}/segments/${segmentId}/restore`);
  return response.data;
};

// Export Audio
export const exportAudio = async (
  projectId: string,
  speakerIds?: string[]
): Promise<Blob> => {
  const params = speakerIds?.length ? { speaker_ids: speakerIds.join(',') } : {};
  const response = await api.get(`/export/${projectId}/audio`, {
    params,
    responseType: 'blob',
  });
  return response.data;
};
