import { useAnnotationStore } from '@/hooks/useAnnotationStore'
import { cn } from '@/utils/cn'
import { Check, Sparkles, X } from 'lucide-react'
import QuickFeedback, { AcceptAllButton } from './QuickFeedback'

// Same colors as in AnnotationCanvas
const LANDMARK_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#f59e0b',
  4: '#eab308',
  5: '#84cc16',
  6: '#22c55e',
  7: '#10b981',
  8: '#14b8a6',
  9: '#06b6d4',
  10: '#0ea5e9',
  11: '#3b82f6',
  12: '#6366f1',
  13: '#8b5cf6',
  14: '#a855f7',
  15: '#d946ef',
  16: '#ec4899',
  17: '#f43f5e',
  18: '#78716c',
  19: '#64748b',
}

interface LandmarkPanelProps {
  imageId?: string
}

export default function LandmarkPanel({ imageId }: LandmarkPanelProps) {
  const { landmarks, annotations, selectedLandmarkId, setSelectedLandmark, removeAnnotation } =
    useAnnotationStore()

  const annotatedCount = annotations.size
  const totalCount = landmarks.length
  const aiPredictionCount = Array.from(annotations.values()).filter(
    (ann) => ann.source === 'ai_predicted'
  ).length

  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold">Landmarks</h2>
        <p className="text-sm text-slate-500">
          {annotatedCount} of {totalCount} annotated
        </p>
        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all"
            style={{ width: `${(annotatedCount / totalCount) * 100}%` }}
          />
        </div>
        {aiPredictionCount > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
            <Sparkles className="w-3 h-3" />
            {aiPredictionCount} AI prediction{aiPredictionCount > 1 ? 's' : ''} to review
          </div>
        )}
      </div>

      {/* Accept All Button */}
      {imageId && aiPredictionCount > 0 && (
        <div className="p-2 border-b border-slate-200">
          <AcceptAllButton imageId={imageId} annotations={annotations} />
        </div>
      )}

      {/* Landmark list */}
      <div className="flex-1 overflow-auto p-2">
        {landmarks.map((landmark) => {
          const annotation = annotations.get(landmark.id)
          const isSelected = landmark.id === selectedLandmarkId
          const isAnnotated = !!annotation
          const isAiPredicted = annotation?.source === 'ai_predicted'
          const color = LANDMARK_COLORS[landmark.id] || '#64748b'

          return (
            <div
              key={landmark.id}
              className={cn(
                'rounded-lg mb-1 transition-colors',
                isSelected
                  ? 'bg-primary-50 ring-2 ring-primary-500'
                  : 'hover:bg-slate-50',
                isAiPredicted && 'bg-purple-50'
              )}
            >
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedLandmark(isSelected ? null : landmark.id)}
                  className="flex-1 text-left px-3 py-2 flex items-center gap-3"
                >
                  {/* Status icon */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isAnnotated ? color : 'transparent',
                      border: `2px solid ${color}`,
                    }}
                  >
                    {isAnnotated && <Check size={14} className="text-white" />}
                  </div>

                  {/* Landmark info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color }}>
                        {landmark.abbreviation}
                      </span>
                      <span className="text-sm text-slate-700 truncate">
                        {landmark.name}
                      </span>
                    </div>
                    {annotation && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400">
                          ({Math.round(annotation.x)}, {Math.round(annotation.y)})
                          {annotation.source === 'ai_predicted' && (
                            <span className="ml-1 text-purple-500 font-medium">AI</span>
                          )}
                          {annotation.source === 'ai_corrected' && (
                            <span className="ml-1 text-green-500">Reviewed</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </button>

                {/* Delete annotation button */}
                {isAnnotated && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeAnnotation(landmark.id)
                    }}
                    className="p-1.5 mr-2 rounded hover:bg-red-100 text-slate-300 hover:text-red-500 transition-colors"
                    title={`Remove ${landmark.abbreviation} annotation`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Quick feedback actions for AI predictions */}
              {annotation && imageId && (
                <div className="px-3 pb-2 -mt-1">
                  <QuickFeedback annotation={annotation} imageId={imageId} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500">
          <strong>Click</strong> a landmark to select, then <strong>click</strong> on the image to place it.
          <br />
          <strong>Scroll</strong> to zoom, <strong>drag</strong> to pan.
        </p>
      </div>
    </aside>
  )
}
