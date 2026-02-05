export interface Project {
  id: string;
  youtube_url: string;
  title: string;
  original_audio_path: string | null;
  splits_directory: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message: string | null;
  progress: string | null;
  created_at: string;
  updated_at: string;
}

export interface Segment {
  id: string;
  project_id: string;
  speaker_id: string | null;
  original_speaker_id: string | null;
  audio_filename: string;
  audio_path: string;
  start_time: number | null;
  end_time: number | null;
  duration: number | null;
  start_time_formatted: string | null;
  transcription: string | null;
  order_index: number | null;
  is_deleted?: boolean;
  deleted_from_speaker_id?: string | null;
}

export interface TrashSegment extends Segment {
  deleted_from_speaker_name: string | null;
}

export interface Speaker {
  id: string;
  project_id: string;
  original_label: string;
  display_name: string;
  folder_path: string | null;
  segment_count: number;
  total_duration: number;
  segments: Segment[];
}

export interface DiarizationStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: string | null;
  error_message: string | null;
  project_id: string | null;
}
