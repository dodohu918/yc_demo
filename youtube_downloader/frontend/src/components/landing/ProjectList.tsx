import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types';
import { Button } from '../common/Button';

interface ProjectListProps {
  projects: Project[];
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onDelete,
  onDeleteAll,
}) => {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">No projects yet</p>
        <p className="text-gray-400 text-sm mt-1">Enter a YouTube URL or upload a file to get started</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      error: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'processing':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        );
      case 'error':
        return (
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Your Projects</h2>
            <p className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm('Delete all projects? This cannot be undone.')) {
              onDeleteAll();
            }
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Fresh Start
        </Button>
      </div>

      {/* Project List */}
      <div className="divide-y divide-gray-100">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-5 hover:bg-gray-50/80 transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3
                    className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={() => navigate(`/editor/${project.id}`)}
                  >
                    {project.title}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${getStatusBadge(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate mb-2">
                  {project.youtube_url}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(project.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => navigate(`/editor/${project.id}`)}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {project.status === 'completed' ? 'Open' : 'View'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this project?')) {
                      onDelete(project.id);
                    }
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>

            {project.error_message && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {project.error_message}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
