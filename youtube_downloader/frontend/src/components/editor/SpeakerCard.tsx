import React, { useState } from 'react';
import type { Speaker } from '../../types';
import { SegmentItem } from './SegmentItem';

interface SpeakerCardProps {
  speaker: Speaker;
  speakers: Speaker[];
  projectId: string;
  onRenameSpeaker: (speakerId: string, newName: string) => void;
  onUpdateTranscription: (segmentId: string, transcription: string) => void;
  onReassignSegment: (segmentId: string, newSpeakerId: string) => void;
  onDeleteSegment: (segmentId: string) => void;
  onDeleteSpeakerSegments: (speakerId: string) => void;
  onMergeClick: (speakerId: string) => void;
}

// Color palette for speaker cards
const speakerColors = [
  { bg: 'from-indigo-500 to-purple-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  { bg: 'from-cyan-500 to-blue-600', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
];

export const SpeakerCard: React.FC<SpeakerCardProps> = ({
  speaker,
  speakers,
  projectId,
  onRenameSpeaker,
  onUpdateTranscription,
  onReassignSegment,
  onDeleteSegment,
  onDeleteSpeakerSegments,
  onMergeClick,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(speaker.display_name);

  // Get consistent color based on speaker id
  const colorIndex = Math.abs(speaker.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % speakerColors.length;
  const colors = speakerColors[colorIndex];

  const handleSaveName = () => {
    if (editName.trim() && editName !== speaker.display_name) {
      onRenameSpeaker(speaker.id, editName.trim());
    }
    setIsEditing(false);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.bg} px-5 py-4`}>
        <div className="flex items-center justify-between">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              onBlur={handleSaveName}
              autoFocus
              className="flex-1 px-3 py-1.5 text-gray-900 font-semibold bg-white/90 backdrop-blur rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          ) : (
            <h3
              className="font-bold text-white text-lg cursor-pointer hover:text-white/80 transition-colors flex items-center gap-2"
              onClick={() => setIsEditing(true)}
              title="Click to rename"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {speaker.display_name}
            </h3>
          )}

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onMergeClick(speaker.id)}
              className="px-2 py-1.5 text-sm font-medium text-white/90 hover:text-white bg-white/20 hover:bg-white/30 rounded-lg transition-all flex-shrink-0"
              title="Merge into another speaker"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (speaker.segments.length > 0 && confirm(`Delete all ${speaker.segments.length} segments for ${speaker.display_name}?`)) {
                  onDeleteSpeakerSegments(speaker.id);
                }
              }}
              className="px-2 py-1.5 text-sm font-medium text-white/90 hover:text-white bg-white/20 hover:bg-red-500/80 rounded-lg transition-all flex-shrink-0"
              title="Delete all segments"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {speaker.segments.length} segments
          </span>
          <span className="flex items-center gap-1">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(speaker.total_duration)}
          </span>
        </div>
      </div>

      {/* Segments */}
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {speaker.segments.map((segment) => (
          <SegmentItem
            key={segment.id}
            segment={segment}
            projectId={projectId}
            speakerId={speaker.id}
            speakers={speakers}
            onUpdateTranscription={onUpdateTranscription}
            onReassignSegment={onReassignSegment}
            onDeleteSegment={onDeleteSegment}
            colorClass={colors}
          />
        ))}

        {speaker.segments.length === 0 && (
          <div className={`p-8 text-center ${colors.light} border-2 border-dashed ${colors.border} m-4 rounded-xl`}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={`mx-auto mb-2 ${colors.text} opacity-50`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p className={`${colors.text} text-sm font-medium`}>No segments</p>
          </div>
        )}
      </div>
    </div>
  );
};
