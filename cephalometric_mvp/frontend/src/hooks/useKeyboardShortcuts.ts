import { useEffect, useCallback } from 'react'
import { useAnnotationStore } from './useAnnotationStore'

interface KeyboardShortcutsConfig {
  onPredict?: () => void
  onNextImage?: () => void
  onPreviousImage?: () => void
  onSave?: () => void
  onAcceptAll?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onPredict,
  onNextImage,
  onPreviousImage,
  onSave,
  onAcceptAll,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const { setSelectedLandmark, landmarks } = useAnnotationStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const key = e.key
      const isCtrl = e.ctrlKey || e.metaKey
      const isAlt = e.altKey

      // Number keys for landmark selection
      if (!isCtrl && !isAlt && key >= '1' && key <= '9') {
        e.preventDefault()
        const landmarkId = parseInt(key)
        if (landmarks.some((l) => l.id === landmarkId)) {
          setSelectedLandmark(landmarkId)
        }
        return
      }

      // 0 for landmark 10, or with Ctrl for 19
      if (!isCtrl && !isAlt && key === '0') {
        e.preventDefault()
        if (landmarks.some((l) => l.id === 10)) {
          setSelectedLandmark(10)
        }
        return
      }

      // Alt + 1-9 for landmarks 11-19
      if (isAlt && key >= '1' && key <= '9') {
        e.preventDefault()
        const landmarkId = parseInt(key) + 10
        if (landmarks.some((l) => l.id === landmarkId)) {
          setSelectedLandmark(landmarkId)
        }
        return
      }

      // Ctrl + A: AI Predict
      if (isCtrl && key.toLowerCase() === 'a' && onPredict) {
        e.preventDefault()
        onPredict()
        return
      }

      // Ctrl + Arrow Right: Next image
      if (isCtrl && key === 'ArrowRight' && onNextImage) {
        e.preventDefault()
        onNextImage()
        return
      }

      // Ctrl + Arrow Left: Previous image
      if (isCtrl && key === 'ArrowLeft' && onPreviousImage) {
        e.preventDefault()
        onPreviousImage()
        return
      }

      // Ctrl + S: Save (optional, since we auto-save)
      if (isCtrl && key.toLowerCase() === 's' && onSave) {
        e.preventDefault()
        onSave()
        return
      }

      // Enter: Accept all AI predictions
      if (key === 'Enter' && onAcceptAll) {
        e.preventDefault()
        onAcceptAll()
        return
      }

      // Escape: Deselect landmark
      if (key === 'Escape') {
        e.preventDefault()
        setSelectedLandmark(null)
        return
      }

      // Plus/Minus for zoom could be added here
    },
    [enabled, landmarks, setSelectedLandmark, onPredict, onNextImage, onPreviousImage, onSave, onAcceptAll]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Keyboard shortcuts help text
export const KEYBOARD_SHORTCUTS = [
  { key: '1-9', description: 'Select landmark 1-9' },
  { key: '0', description: 'Select landmark 10' },
  { key: 'Alt + 1-9', description: 'Select landmark 11-19' },
  { key: 'Ctrl + A', description: 'Run AI prediction' },
  { key: 'Ctrl + \u2192', description: 'Next image' },
  { key: 'Ctrl + \u2190', description: 'Previous image' },
  { key: 'Enter', description: 'Accept all AI predictions' },
  { key: 'Escape', description: 'Deselect landmark' },
]
