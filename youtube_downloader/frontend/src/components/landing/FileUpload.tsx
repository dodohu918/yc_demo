import React, { useState, useCallback } from 'react';
import { Button } from '../common/Button';

interface FileUploadProps {
  onUpload: (file: File, numSpeakers?: number) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numSpeakers, setNumSpeakers] = useState<string>('');
  const [error, setError] = useState('');

  const allowedExtensions = ['.wav', '.mp3', '.mov', '.mp4', '.m4a', '.ogg', '.flac'];

  const validateFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
      return false;
    }
    setError('');
    return true;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      const speakers = numSpeakers ? parseInt(numSpeakers, 10) : undefined;
      onUpload(selectedFile, speakers);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-lg shadow-indigo-500/20'
            : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50'
        }`}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          accept={allowedExtensions.join(',')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
            dragActive
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110'
              : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600'
          }`}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-700">
              <span className="text-indigo-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500 mt-1">
              WAV, MP3, MOV, MP4, M4A, OGG, FLAC
            </p>
          </div>
        </div>
      </div>

      {/* Selected file */}
      {selectedFile && (
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-2">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Options and submit */}
      {selectedFile && (
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
            <Button onClick={handleSubmit} isLoading={isLoading} size="lg" className="w-full">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Processing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
