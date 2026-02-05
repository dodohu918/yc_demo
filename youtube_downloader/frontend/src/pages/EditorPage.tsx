import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/useEditorStore';
import { SpeakerCard } from '../components/editor/SpeakerCard';
import { MergeSpeakersModal } from '../components/editor/MergeSpeakersModal';
import { ExportAudioModal } from '../components/editor/ExportAudioModal';
import { TrashCard } from '../components/editor/TrashCard';
import { Button } from '../components/common/Button';
import type { Speaker } from '../types';

export const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    project,
    speakers,
    trash,
    isLoading,
    error,
    hasUnsavedChanges,
    loadProject,
    updateSpeakerName,
    mergeSpeakers,
    updateTranscription,
    reassignSegment,
    deleteSegment,
    deleteSpeakerSegments,
    restoreSegment,
    saveProject,
    exportJson,
    exportTranscript,
    exportAudio,
  } = useEditorStore();

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedSpeakerForMerge, setSelectedSpeakerForMerge] = useState<Speaker | null>(null);
  const [exportAudioModalOpen, setExportAudioModalOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleMergeClick = (speakerId: string) => {
    const speaker = speakers.find((s) => s.id === speakerId);
    if (speaker) {
      setSelectedSpeakerForMerge(speaker);
      setMergeModalOpen(true);
    }
  };

  const handleMerge = (sourceSpeakerId: string, targetSpeakerId: string) => {
    mergeSpeakers(sourceSpeakerId, targetSpeakerId);
    setMergeModalOpen(false);
    setSelectedSpeakerForMerge(null);
  };

  const handleExportJson = async () => {
    try {
      const data = await exportJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportTranscript = async () => {
    try {
      const text = await exportTranscript();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title || 'transcript'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportAudio = async (speakerIds?: string[]) => {
    try {
      const blob = await exportAudio(speakerIds);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title || 'audio'}_audio.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
              <circle opacity="0.25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
              <path opacity="0.75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {project?.title || 'Untitled Project'}
                </h1>
                {hasUnsavedChanges && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleExportTranscript}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Text
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExportJson}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export JSON
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setExportAudioModalOpen(true)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Export Audio
              </Button>
              <Button size="sm" onClick={saveProject}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <SpeakerCard
              key={speaker.id}
              speaker={speaker}
              speakers={speakers}
              projectId={projectId || ''}
              onRenameSpeaker={updateSpeakerName}
              onUpdateTranscription={updateTranscription}
              onReassignSegment={reassignSegment}
              onDeleteSegment={deleteSegment}
              onDeleteSpeakerSegments={deleteSpeakerSegments}
              onMergeClick={handleMergeClick}
            />
          ))}
        </div>

        {speakers.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">No speakers found</p>
            <p className="text-gray-400 text-sm mt-1">The diarization may still be processing</p>
          </div>
        )}

        {/* Trash Section */}
        {trash.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Trash
            </h2>
            <TrashCard
              trash={trash}
              projectId={projectId || ''}
              onRestoreSegment={restoreSegment}
            />
          </div>
        )}
      </main>

      {/* Merge Modal */}
      <MergeSpeakersModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        sourceSpeaker={selectedSpeakerForMerge}
        speakers={speakers}
        onMerge={handleMerge}
      />

      {/* Export Audio Modal */}
      <ExportAudioModal
        isOpen={exportAudioModalOpen}
        onClose={() => setExportAudioModalOpen(false)}
        speakers={speakers}
        onExport={handleExportAudio}
      />
    </div>
  );
};
