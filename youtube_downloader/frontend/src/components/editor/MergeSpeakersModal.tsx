import React, { useState } from 'react';
import type { Speaker } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface MergeSpeakersModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceSpeaker: Speaker | null;
  speakers: Speaker[];
  onMerge: (sourceSpeakerId: string, targetSpeakerId: string) => void;
}

export const MergeSpeakersModal: React.FC<MergeSpeakersModalProps> = ({
  isOpen,
  onClose,
  sourceSpeaker,
  speakers,
  onMerge,
}) => {
  const [targetId, setTargetId] = useState<string>('');

  if (!sourceSpeaker) return null;

  const otherSpeakers = speakers.filter((s) => s.id !== sourceSpeaker.id);

  const handleMerge = () => {
    if (targetId) {
      onMerge(sourceSpeaker.id, targetId);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Merge Speakers">
      <div className="space-y-6">
        {/* Info */}
        <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <p className="text-gray-700">
              Merge <strong className="text-indigo-700">{sourceSpeaker.display_name}</strong> into another speaker.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              All {sourceSpeaker.segments.length} segments will be moved to the target speaker.
            </p>
          </div>
        </div>

        {/* Target selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Target Speaker
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="">Select a speaker...</option>
            {otherSpeakers.map((speaker) => (
              <option key={speaker.id} value={speaker.id}>
                {speaker.display_name} ({speaker.segments.length} segments)
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={!targetId}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Merge Speakers
          </Button>
        </div>
      </div>
    </Modal>
  );
};
