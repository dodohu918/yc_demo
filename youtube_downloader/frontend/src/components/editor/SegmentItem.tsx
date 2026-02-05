import React, { useState } from 'react';
import type { Segment, Speaker } from '../../types';
import { AudioPlayer } from '../common/AudioPlayer';
import { getAudioUrl } from '../../api/client';

interface ColorClass {
  bg: string;
  light: string;
  border: string;
  text: string;
}

interface SegmentItemProps {
  segment: Segment;
  projectId: string;
  speakerId: string;
  speakers: Speaker[];
  onUpdateTranscription: (segmentId: string, transcription: string) => void;
  onReassignSegment: (segmentId: string, newSpeakerId: string) => void;
  onDeleteSegment: (segmentId: string) => void;
  colorClass?: ColorClass;
}

export const SegmentItem: React.FC<SegmentItemProps> = ({
  segment,
  projectId,
  speakerId,
  speakers,
  onUpdateTranscription,
  onReassignSegment,
  onDeleteSegment,
  colorClass,
}) => {
  const [transcription, setTranscription] = useState(segment.transcription || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTranscription = async () => {
    if (transcription !== segment.transcription) {
      setIsSaving(true);
      await onUpdateTranscription(segment.id, transcription);
      setIsSaving(false);
    }
  };

  const handleSpeakerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpeakerId = e.target.value;
    if (newSpeakerId && newSpeakerId !== speakerId) {
      onReassignSegment(segment.id, newSpeakerId);
    }
  };

  const audioUrl = getAudioUrl(projectId, speakerId, segment.audio_filename);
  const otherSpeakers = speakers.filter(s => s.id !== speakerId);

  return (
    <div className="p-4 bg-white hover:bg-gray-50/50 transition-all">
      <div className="space-y-3">
        {/* Time badge and audio */}
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${colorClass?.light || 'bg-gray-100'} ${colorClass?.text || 'text-gray-600'}`}>
            {segment.start_time_formatted || '00:00:00'}
          </span>
          <AudioPlayer src={audioUrl} className="flex-1" />
        </div>

        {/* Transcription input */}
        <div className="relative">
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            onBlur={handleSaveTranscription}
            placeholder="Enter transcription..."
            className="w-full text-sm bg-gray-50 border-2 border-gray-100 rounded-xl p-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white resize-none transition-all placeholder:text-gray-400"
            rows={2}
          />
          {isSaving && (
            <span className="absolute bottom-2 right-2 text-xs text-indigo-500 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          {/* Move to speaker dropdown */}
          {otherSpeakers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Move to:</span>
              <select
                value=""
                onChange={handleSpeakerChange}
                className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer"
              >
                <option value="">Select speaker...</option>
                {otherSpeakers.map((speaker) => (
                  <option key={speaker.id} value={speaker.id}>
                    {speaker.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {otherSpeakers.length === 0 && <div />}

          {/* Delete button */}
          <button
            onClick={() => {
              if (confirm('Delete this segment?')) {
                onDeleteSegment(segment.id);
              }
            }}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            title="Delete segment"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
