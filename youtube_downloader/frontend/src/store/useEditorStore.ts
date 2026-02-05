import { create } from 'zustand';
import type { Project, Speaker, TrashSegment } from '../types';
import * as api from '../api/client';

interface EditorState {
  project: Project | null;
  speakers: Speaker[];
  trash: TrashSegment[];
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  loadProject: (projectId: string) => Promise<void>;
  updateSpeakerName: (speakerId: string, displayName: string) => Promise<void>;
  mergeSpeakers: (sourceSpeakerId: string, targetSpeakerId: string) => Promise<void>;
  updateTranscription: (segmentId: string, transcription: string) => Promise<void>;
  reassignSegment: (segmentId: string, newSpeakerId: string) => Promise<void>;
  deleteSegment: (segmentId: string) => Promise<void>;
  deleteSpeakerSegments: (speakerId: string) => Promise<void>;
  restoreSegment: (segmentId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  exportJson: () => Promise<object>;
  exportTranscript: () => Promise<string>;
  exportAudio: (speakerIds?: string[]) => Promise<Blob>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  speakers: [],
  trash: [],
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [project, speakers, trash] = await Promise.all([
        api.getProject(projectId),
        api.getSpeakers(projectId),
        api.getTrash(projectId),
      ]);
      set({ project, speakers, trash, isLoading: false, hasUnsavedChanges: false });
    } catch (error) {
      set({ error: 'Failed to load project', isLoading: false });
    }
  },

  updateSpeakerName: async (speakerId: string, displayName: string) => {
    const { project } = get();
    if (!project) return;

    try {
      await api.updateSpeaker(project.id, speakerId, displayName);
      set((state) => ({
        speakers: state.speakers.map((s) =>
          s.id === speakerId ? { ...s, display_name: displayName } : s
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update speaker name' });
    }
  },

  mergeSpeakers: async (sourceSpeakerId: string, targetSpeakerId: string) => {
    const { project } = get();
    if (!project) return;

    try {
      await api.mergeSpeakers(project.id, sourceSpeakerId, targetSpeakerId);
      // Reload speakers to get updated data
      const speakers = await api.getSpeakers(project.id);
      set({ speakers });
    } catch (error) {
      set({ error: 'Failed to merge speakers' });
    }
  },

  updateTranscription: async (segmentId: string, transcription: string) => {
    const { project } = get();
    if (!project) return;

    try {
      await api.updateSegment(project.id, segmentId, transcription);
      set((state) => ({
        speakers: state.speakers.map((speaker) => ({
          ...speaker,
          segments: speaker.segments.map((seg) =>
            seg.id === segmentId ? { ...seg, transcription } : seg
          ),
        })),
        hasUnsavedChanges: true,
      }));
    } catch (error) {
      set({ error: 'Failed to update transcription' });
    }
  },

  reassignSegment: async (segmentId: string, newSpeakerId: string) => {
    const { project } = get();
    if (!project) return;

    try {
      await api.reassignSegment(project.id, segmentId, newSpeakerId);
      // Reload speakers to get updated data
      const speakers = await api.getSpeakers(project.id);
      set({ speakers, hasUnsavedChanges: true });
    } catch (error) {
      set({ error: 'Failed to reassign segment' });
    }
  },

  deleteSegment: async (segmentId: string) => {
    const { project } = get();
    if (!project) return;

    try {
      await api.deleteSegment(project.id, segmentId);
      // Reload speakers and trash to get updated data
      const [speakers, trash] = await Promise.all([
        api.getSpeakers(project.id),
        api.getTrash(project.id),
      ]);
      set({ speakers, trash, hasUnsavedChanges: true });
    } catch (error) {
      set({ error: 'Failed to delete segment' });
    }
  },

  deleteSpeakerSegments: async (speakerId: string) => {
    const { project } = get();
    if (!project) return;

    try {
      await api.deleteSpeakerSegments(project.id, speakerId);
      // Reload speakers and trash to get updated data
      const [speakers, trash] = await Promise.all([
        api.getSpeakers(project.id),
        api.getTrash(project.id),
      ]);
      set({ speakers, trash, hasUnsavedChanges: true });
    } catch (error) {
      set({ error: 'Failed to delete segments' });
    }
  },

  restoreSegment: async (segmentId: string) => {
    const { project } = get();
    if (!project) return;

    try {
      await api.restoreSegment(project.id, segmentId);
      // Reload speakers and trash to get updated data
      const [speakers, trash] = await Promise.all([
        api.getSpeakers(project.id),
        api.getTrash(project.id),
      ]);
      set({ speakers, trash, hasUnsavedChanges: true });
    } catch (error) {
      set({ error: 'Failed to restore segment' });
    }
  },

  saveProject: async () => {
    const { project } = get();
    if (!project) return;

    try {
      await api.saveProject(project.id);
      set({ hasUnsavedChanges: false });
    } catch (error) {
      set({ error: 'Failed to save project' });
    }
  },

  exportJson: async () => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');

    return await api.exportJson(project.id);
  },

  exportTranscript: async () => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');

    return await api.exportTranscript(project.id);
  },

  exportAudio: async (speakerIds?: string[]) => {
    const { project } = get();
    if (!project) throw new Error('No project loaded');

    return await api.exportAudio(project.id, speakerIds);
  },
}));
