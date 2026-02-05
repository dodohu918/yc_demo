import { create } from 'zustand'

export interface Highlight {
  id: string
  startOffset: number
  endOffset: number
  text: string
  source: 'manual' | 'ai_predicted'
}

interface AnnotationState {
  highlights: Highlight[]
  addHighlight: (highlight: Highlight) => void
  removeHighlight: (id: string) => void
  setHighlights: (highlights: Highlight[]) => void
  clearHighlights: () => void
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  highlights: [],

  addHighlight: (highlight) =>
    set((state) => ({
      highlights: [...state.highlights, highlight],
    })),

  removeHighlight: (id) =>
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    })),

  setHighlights: (highlights) => set({ highlights }),

  clearHighlights: () => set({ highlights: [] }),
}))
