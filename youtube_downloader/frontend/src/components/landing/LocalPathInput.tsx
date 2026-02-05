import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface LocalPathInputProps {
  onSubmit: (filePath: string, numSpeakers?: number) => void;
  isLoading: boolean;
  error?: string | null;
}

export const LocalPathInput: React.FC<LocalPathInputProps> = ({
  onSubmit,
  isLoading,
  error: externalError,
}) => {
  const [filePath, setFilePath] = useState('');
  const [numSpeakers, setNumSpeakers] = useState<string>('');
  const [error, setError] = useState('');

  const allowedExtensions = ['.wav', '.mp3', '.mov', '.mp4', '.m4a', '.ogg', '.flac'];

  const validatePath = (path: string): boolean => {
    if (!path.trim()) {
      setError('Please enter a file path');
      return false;
    }

    const ext = '.' + path.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePath(filePath)) {
      return;
    }

    const speakers = numSpeakers ? parseInt(numSpeakers, 10) : undefined;
    onSubmit(filePath, speakers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        type="text"
        placeholder="/path/to/your/audio/file.wav"
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
        error={error || externalError || undefined}
        icon={
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-48">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Speakers
          </label>
          <input
            type="number"
            min="1"
            max="20"
            placeholder="Auto-detect"
            value={numSpeakers}
            onChange={(e) => setNumSpeakers(e.target.value)}
            className="w-full px-4 py-4 text-lg bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-300 placeholder:text-gray-400"
          />
        </div>

        <div className="flex-1 flex items-end">
          <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Processing
          </Button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Enter the full path to an audio or video file on the server
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supported formats: WAV, MP3, MOV, MP4, M4A, OGG, FLAC
        </p>
      </div>
    </form>
  );
};
