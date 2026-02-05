import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { DiarizationStatus } from '../../types';
import { Button } from '../common/Button';

interface ProcessingStatusProps {
  job: DiarizationStatus;
  onDismiss: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  job,
  onDismiss,
}) => {
  const navigate = useNavigate();

  const handleViewProject = () => {
    if (job.project_id) {
      navigate(`/editor/${job.project_id}`);
    }
  };

  const isProcessing = job.status === 'processing' || job.status === 'pending';
  const isCompleted = job.status === 'completed';
  const isError = job.status === 'error';

  return (
    <div className={`rounded-2xl p-6 border-2 transition-all ${
      isCompleted
        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
        : isError
        ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
        : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCompleted
              ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
              : isError
              ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
          }`}>
            {isProcessing ? (
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : isCompleted ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div>
            <p className={`font-semibold text-lg ${
              isCompleted ? 'text-emerald-800' : isError ? 'text-red-800' : 'text-indigo-800'
            }`}>
              {isCompleted
                ? 'Diarization Complete!'
                : isError
                ? 'Processing Failed'
                : 'Processing Audio...'}
            </p>
            <p className={`text-sm ${
              isCompleted ? 'text-emerald-600' : isError ? 'text-red-600' : 'text-indigo-600'
            }`}>
              {job.error_message || job.progress || 'Starting diarization...'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isCompleted && job.project_id && (
            <Button onClick={handleViewProject} size="md">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Open Editor
            </Button>
          )}
          <Button onClick={onDismiss} variant="ghost" size="md">
            Dismiss
          </Button>
        </div>
      </div>

      {/* Progress bar for processing */}
      {isProcessing && (
        <div className="mt-4">
          <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  );
};
