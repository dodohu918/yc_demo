import React from 'react';
import type { TrashSegment } from '../../types';
import { AudioPlayer } from '../common/AudioPlayer';
import { getAudioUrl } from '../../api/client';

interface TrashCardProps {
  trash: TrashSegment[];
  projectId: string;
  onRestoreSegment: (segmentId: string) => void;
}

export const TrashCard: React.FC<TrashCardProps> = ({
  trash,
  projectId,
  onRestoreSegment,
}) => {
  if (trash.length === 0) {
    return null;
  }

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Trash
          </h3>
          <span className="text-sm text-white/80">{trash.length} items</span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {trash.map((segment) => (
          <div key={segment.id} className="p-4 bg-white hover:bg-gray-50/50 transition-all">
            <div className="space-y-3">
              {/* Time badge, speaker info, and audio */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 bg-gray-100 text-gray-600">
                  {segment.start_time_formatted || '00:00:00'}
                </span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  from: {segment.deleted_from_speaker_name || 'Unknown'}
                </span>
                <AudioPlayer
                  src={getAudioUrl(projectId, segment.deleted_from_speaker_id || '', segment.audio_filename)}
                  className="flex-1"
                />
              </div>

              {/* Transcription if any */}
              {segment.transcription && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                  {segment.transcription}
                </p>
              )}

              {/* Restore button */}
              <div className="flex justify-end">
                <button
                  onClick={() => onRestoreSegment(segment.id)}
                  className="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                  title="Restore to original speaker"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Restore
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
