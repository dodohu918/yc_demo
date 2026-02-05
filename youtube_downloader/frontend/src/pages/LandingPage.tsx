import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { UrlInput } from '../components/landing/UrlInput';
import { FileUpload } from '../components/landing/FileUpload';
import { LocalPathInput } from '../components/landing/LocalPathInput';
import { ProcessingStatus } from '../components/landing/ProcessingStatus';
import { ProjectList } from '../components/landing/ProjectList';

type TabType = 'url' | 'upload' | 'local';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('url');

  const {
    projects,
    currentJob,
    isLoading,
    error,
    fetchProjects,
    startDiarization,
    uploadFile,
    diarizeLocalFile,
    deleteProject,
    deleteAllProjects,
    clearJob,
  } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleUrlSubmit = (url: string, numSpeakers?: number) => {
    startDiarization(url, numSpeakers);
  };

  const handleFileUpload = (file: File, numSpeakers?: number) => {
    uploadFile(file, numSpeakers);
  };

  const handleLocalPath = (filePath: string, numSpeakers?: number) => {
    diarizeLocalFile(filePath, numSpeakers);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'url', label: 'YouTube URL' },
    { id: 'upload', label: 'Upload File' },
    { id: 'local', label: 'Local Path' },
  ];

  const getTabIcon = (tabId: TabType) => {
    switch (tabId) {
      case 'url':
        return (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'upload':
        return (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'local':
        return (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="pt-12 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            AI-Powered Speaker Detection
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Speaker Diarization Tool
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Automatically identify and separate different speakers in your audio and video files using advanced AI
          </p>
        </div>
      </header>

      {/* Main Card */}
      <main className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl shadow-2xl overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex-shrink-0">{getTabIcon(tab.id)}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Input Section */}
            <div className="p-8">
              {activeTab === 'url' && (
                <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
              )}
              {activeTab === 'upload' && (
                <FileUpload onUpload={handleFileUpload} isLoading={isLoading} />
              )}
              {activeTab === 'local' && (
                <LocalPathInput
                  onSubmit={handleLocalPath}
                  isLoading={isLoading}
                  error={error}
                />
              )}

              {/* Processing Status */}
              {currentJob && (
                <div className="mt-6">
                  <ProcessingStatus job={currentJob} onDismiss={clearJob} />
                </div>
              )}
            </div>
          </div>

          {/* Projects Section */}
          <div className="mt-8">
            <ProjectList
              projects={projects}
              onDelete={deleteProject}
              onDeleteAll={deleteAllProjects}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
