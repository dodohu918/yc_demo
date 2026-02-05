import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, RotateCcw, Trash2 } from 'lucide-react'
import { useAnnotationStore } from '@/hooks/useAnnotationStore'
import { createFeedback, deleteAnnotation, Annotation } from '@/utils/api'
import { cn } from '@/utils/cn'

interface QuickFeedbackProps {
  annotation: Annotation
  imageId: string
  onDelete?: () => void
}

export default function QuickFeedback({ annotation, imageId, onDelete }: QuickFeedbackProps) {
  const queryClient = useQueryClient()
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null)
  const { updateAnnotation, removeAnnotation } = useAnnotationStore()

  const feedbackMutation = useMutation({
    mutationFn: async (action: 'accepted' | 'rejected') => {
      await createFeedback(annotation.id, { action })
      return action
    },
    onSuccess: (action) => {
      setFeedbackGiven(action)
      if (action === 'accepted') {
        // Update source to ai_corrected to indicate it was reviewed
        updateAnnotation(annotation.landmark_id, {
          ...annotation,
          source: 'ai_corrected',
        })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Record rejection feedback first
      await createFeedback(annotation.id, { action: 'rejected' })
      await deleteAnnotation(annotation.id)
    },
    onSuccess: () => {
      removeAnnotation(annotation.landmark_id)
      queryClient.invalidateQueries({ queryKey: ['annotations', imageId] })
      onDelete?.()
    },
  })

  // Only show feedback buttons for AI predictions that haven't been reviewed
  if (annotation.source !== 'ai_predicted') {
    return null
  }

  if (feedbackGiven === 'accepted') {
    return (
      <div className="flex items-center gap-1 text-green-600 text-xs">
        <Check className="w-3 h-3" />
        Accepted
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        onClick={(e) => {
          e.stopPropagation()
          feedbackMutation.mutate('accepted')
        }}
        disabled={feedbackMutation.isPending}
        className={cn(
          'p-1 rounded hover:bg-green-100 text-green-600 transition-colors',
          feedbackMutation.isPending && 'opacity-50'
        )}
        title="Accept AI prediction"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          deleteMutation.mutate()
        }}
        disabled={deleteMutation.isPending}
        className={cn(
          'p-1 rounded hover:bg-red-100 text-red-600 transition-colors',
          deleteMutation.isPending && 'opacity-50'
        )}
        title="Reject and delete AI prediction"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

interface AcceptAllButtonProps {
  imageId: string
  annotations: Map<number, Annotation>
}

export function AcceptAllButton({ imageId, annotations }: AcceptAllButtonProps) {
  const queryClient = useQueryClient()
  const { updateAnnotation } = useAnnotationStore()
  const [isProcessing, setIsProcessing] = useState(false)

  const aiPredictions = Array.from(annotations.values()).filter(
    (ann) => ann.source === 'ai_predicted'
  )

  if (aiPredictions.length === 0) {
    return null
  }

  const handleAcceptAll = async () => {
    setIsProcessing(true)
    try {
      for (const ann of aiPredictions) {
        await createFeedback(ann.id, { action: 'accepted' })
        updateAnnotation(ann.landmark_id, {
          ...ann,
          source: 'ai_corrected',
        })
      }
      queryClient.invalidateQueries({ queryKey: ['annotations', imageId] })
    } catch (error) {
      console.error('Failed to accept all:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={handleAcceptAll}
      disabled={isProcessing}
      className={cn(
        'w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg',
        'hover:bg-green-700 disabled:opacity-50 transition-colors',
        'flex items-center justify-center gap-2'
      )}
    >
      {isProcessing ? (
        <>
          <RotateCcw className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Check className="w-4 h-4" />
          Accept All AI ({aiPredictions.length})
        </>
      )}
    </button>
  )
}
