import React, { useState } from 'react';
import type { Speaker } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ExportAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  speakers: Speaker[];
  onExport: (speakerIds?: string[]) => Promise<void>;
}

export const ExportAudioModal: React.FC<ExportAudioModalProps> = ({
  isOpen,
  onClose,
  speakers,
  onExport,
}) => {
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(
    new Set(speakers.map((s) => s.id))
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleToggleSpeaker = (speakerId: string) => {
    const newSelected = new Set(selectedSpeakers);
    if (newSelected.has(speakerId)) {
      newSelected.delete(speakerId);
    } else {
      newSelected.add(speakerId);
    }
    setSelectedSpeakers(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedSpeakers(new Set(speakers.map((s) => s.id)));
  };

  const handleSelectNone = () => {
    setSelectedSpeakers(new Set());
  };

  const handleExport = async () => {
    if (selectedSpeakers.size === 0) return;

    setIsExporting(true);
    try {
      const speakerIds = selectedSpeakers.size === speakers.length
        ? undefined  // All speakers, don't filter
        : Array.from(selectedSpeakers);
      await onExport(speakerIds);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset selection when speakers change
  React.useEffect(() => {
    setSelectedSpeakers(new Set(speakers.map((s) => s.id)));
  }, [speakers]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Audio">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Select which speakers' audio files to include in the export:
        </p>

        {/* Quick select buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50"
          >
            Select All
          </button>
          <button
            onClick={handleSelectNone}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
          >
            Select None
          </button>
        </div>

        {/* Speaker checkboxes */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {speakers.map((speaker) => (
            <label
              key={speaker.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
            >
              <input
                type="checkbox"
                checked={selectedSpeakers.has(speaker.id)}
                onChange={() => handleToggleSpeaker(speaker.id)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900">{speaker.display_name}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({speaker.segments.length} segments)
                </span>
              </div>
            </label>
          ))}
        </div>

        {speakers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No speakers available to export
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedSpeakers.size === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export ({selectedSpeakers.size} speaker{selectedSpeakers.size !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
