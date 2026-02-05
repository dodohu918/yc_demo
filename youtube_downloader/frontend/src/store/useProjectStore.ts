import { create } from 'zustand';
import type { Project, DiarizationStatus } from '../types';
import * as api from '../api/client';

interface ProjectState {
  projects: Project[];
  currentJob: DiarizationStatus | null;
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  startDiarization: (youtubeUrl: string, numSpeakers?: number) => Promise<void>;
  uploadFile: (file: File, numSpeakers?: number) => Promise<void>;
  diarizeLocalFile: (filePath: string, numSpeakers?: number) => Promise<void>;
  pollJobStatus: (jobId: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  deleteAllProjects: () => Promise<void>;
  clearJob: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentJob: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await api.getProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch projects', isLoading: false });
    }
  },

  startDiarization: async (youtubeUrl: string, numSpeakers?: number) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.startDiarization(youtubeUrl, numSpeakers);
      set({ currentJob: status, isLoading: false });

      // Start polling for status
      get().pollJobStatus(status.job_id);
    } catch (error) {
      set({ error: 'Failed to start diarization', isLoading: false });
    }
  },

  uploadFile: async (file: File, numSpeakers?: number) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.uploadAndDiarize(file, numSpeakers);
      set({ currentJob: status, isLoading: false });

      // Start polling for status
      get().pollJobStatus(status.job_id);
    } catch (error) {
      set({ error: 'Failed to upload file', isLoading: false });
    }
  },

  diarizeLocalFile: async (filePath: string, numSpeakers?: number) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.diarizeLocalFile(filePath, numSpeakers);
      set({ currentJob: status, isLoading: false });

      // Start polling for status
      get().pollJobStatus(status.job_id);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to process local file';
      set({ error: message, isLoading: false });
    }
  },

  pollJobStatus: async (jobId: string) => {
    const poll = async () => {
      try {
        const status = await api.getDiarizationStatus(jobId);
        set({ currentJob: status });

        if (status.status === 'pending' || status.status === 'processing') {
          setTimeout(poll, 2000);
        } else {
          // Refresh projects when done
          get().fetchProjects();
        }
      } catch (error) {
        set({ error: 'Failed to get job status' });
      }
    };

    poll();
  },

  deleteProject: async (id: string) => {
    try {
      await api.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete project' });
    }
  },

  deleteAllProjects: async () => {
    try {
      await api.deleteAllProjects();
      set({ projects: [] });
    } catch (error) {
      set({ error: 'Failed to delete all projects' });
    }
  },

  clearJob: () => {
    set({ currentJob: null });
  },
}));
