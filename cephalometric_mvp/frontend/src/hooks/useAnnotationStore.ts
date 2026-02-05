import { create } from 'zustand'
import type { Annotation, Landmark } from '@/utils/api'

interface AnnotationState {
  // Current state
  selectedLandmarkId: number | null
  annotations: Map<number, Annotation>
  landmarks: Landmark[]
  scale: number
  offset: { x: number; y: number }

  // Actions
  setSelectedLandmark: (id: number | null) => void
  setAnnotations: (annotations: Annotation[]) => void
  setLandmarks: (landmarks: Landmark[]) => void
  updateAnnotation: (landmarkId: number, annotation: Annotation) => void
  removeAnnotation: (landmarkId: number) => void
  setScale: (scale: number) => void
  setOffset: (offset: { x: number; y: number }) => void
  reset: () => void
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  selectedLandmarkId: null,
  annotations: new Map(),
  landmarks: [],
  scale: 1,
  offset: { x: 0, y: 0 },

  setSelectedLandmark: (id) => set({ selectedLandmarkId: id }),

  setAnnotations: (annotations) =>
    set({
      annotations: new Map(annotations.map((a) => [a.landmark_id, a])),
    }),

  setLandmarks: (landmarks) => set({ landmarks }),

  updateAnnotation: (landmarkId, annotation) =>
    set((state) => {
      const newAnnotations = new Map(state.annotations)
      newAnnotations.set(landmarkId, annotation)
      return { annotations: newAnnotations }
    }),

  removeAnnotation: (landmarkId) =>
    set((state) => {
      const newAnnotations = new Map(state.annotations)
      newAnnotations.delete(landmarkId)
      return { annotations: newAnnotations }
    }),

  setScale: (scale) => set({ scale }),
  setOffset: (offset) => set({ offset }),

  reset: () =>
    set({
      selectedLandmarkId: null,
      annotations: new Map(),
      scale: 1,
      offset: { x: 0, y: 0 },
    }),
}))
