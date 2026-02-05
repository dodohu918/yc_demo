import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface UrlInputProps {
  onSubmit: (url: string, numSpeakers?: number) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [numSpeakers, setNumSpeakers] = useState<string>('');
  const [error, setError] = useState('');

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setError('');
    const speakers = numSpeakers ? parseInt(numSpeakers, 10) : undefined;
    onSubmit(url, speakers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        type="text"
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={error}
        icon={
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
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
    </form>
  );
};
