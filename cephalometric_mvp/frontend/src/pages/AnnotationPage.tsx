import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Wand2, Keyboard } from 'lucide-react'
import {
  getImage,
  getImages,
  getLandmarks,
  getImageAnnotations,
  createAnnotation,
  updateAnnotation,
  predictLandmarks,
  createFeedback,
  UPLOADS_BASE_URL,
} from '@/utils/api'
import { useAnnotationStore } from '@/hooks/useAnnotationStore'
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import AnnotationCanvas from '@/components/AnnotationCanvas'
import LandmarkPanel from '@/components/LandmarkPanel'

export default function AnnotationPage() {
  const { imageId } = useParams<{ imageId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isPredicting, setIsPredicting] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [demoModeToast, setDemoModeToast] = useState(false)

  const {
    setAnnotations,
    setLandmarks,
    annotations,
    selectedLandmarkId,
    reset,
  } = useAnnotationStore()

  // Fetch all images for navigation
  const { data: allImages } = useQuery({
    queryKey: ['images'],
    queryFn: () => getImages(0, 500).then((r) => r.data),
  })

  // Find current image index for navigation
  const currentIndex = allImages?.findIndex((img) => img.id === imageId) ?? -1
  const canGoNext = currentIndex >= 0 && currentIndex < (allImages?.length ?? 0) - 1
  const canGoPrevious = currentIndex > 0

  const navigateToImage = useCallback(
    (direction: 'next' | 'previous') => {
      if (!allImages) return
      const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
      if (newIndex >= 0 && newIndex < allImages.length) {
        navigate(`/annotate/${allImages[newIndex].id}`)
      }
    },
    [allImages, currentIndex, navigate]
  )

  // Fetch image
  const { data: image, isLoading: imageLoading } = useQuery({
    queryKey: ['image', imageId],
    queryFn: () => getImage(imageId!).then((r) => r.data),
    enabled: !!imageId,
  })

  // Fetch landmarks
  const { data: landmarks } = useQuery({
    queryKey: ['landmarks'],
    queryFn: () => getLandmarks().then((r) => r.data),
  })

  // Fetch existing annotations
  const { data: existingAnnotations } = useQuery({
    queryKey: ['annotations', imageId],
    queryFn: () => getImageAnnotations(imageId!).then((r) => r.data),
    enabled: !!imageId,
  })

  // Initialize store
  useEffect(() => {
    if (landmarks) {
      setLandmarks(landmarks)
    }
  }, [landmarks, setLandmarks])

  useEffect(() => {
    if (existingAnnotations) {
      setAnnotations(existingAnnotations)
    }
  }, [existingAnnotations, setAnnotations])

  // Cleanup on unmount
  useEffect(() => {
    return () => reset()
  }, [reset])

  // Create/update annotation mutation
  const annotationMutation = useMutation({
    mutationFn: async ({
      landmarkId,
      x,
      y,
    }: {
      landmarkId: number
      x: number
      y: number
    }) => {
      const result = await createAnnotation({
        image_id: imageId!,
        landmark_id: landmarkId,
        x,
        y,
        source: 'manual',
      })
      return result.data
    },
    onSuccess: (data) => {
      useAnnotationStore.getState().updateAnnotation(data.landmark_id, data)
      queryClient.invalidateQueries({ queryKey: ['annotations', imageId] })
    },
  })

  // Update existing annotation
  const updateMutation = useMutation({
    mutationFn: async ({
      annotationId,
      x,
      y,
    }: {
      annotationId: string
      x: number
      y: number
    }) => {
      const result = await updateAnnotation(annotationId, { x, y })
      return result.data
    },
    onSuccess: (data) => {
      useAnnotationStore.getState().updateAnnotation(data.landmark_id, data)
    },
  })

  // AI prediction
  const handlePredict = useCallback(async () => {
    if (!imageId || isPredicting) return
    setIsPredicting(true)
    try {
      const result = await predictLandmarks(imageId)
      // Create annotations from predictions
      for (const pred of result.data.predictions) {
        await createAnnotation({
          image_id: imageId,
          landmark_id: pred.landmark_id,
          x: pred.x,
          y: pred.y,
          source: 'ai_predicted',
        })
      }
      queryClient.invalidateQueries({ queryKey: ['annotations', imageId] })
    } catch (error: unknown) {
      console.error('Prediction failed:', error)
      // Show demo mode toast instead of alert
      setDemoModeToast(true)
      setTimeout(() => setDemoModeToast(false), 4000)
    } finally {
      setIsPredicting(false)
    }
  }, [imageId, isPredicting, queryClient])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPredict: handlePredict,
    onNextImage: canGoNext ? () => navigateToImage('next') : undefined,
    onPreviousImage: canGoPrevious ? () => navigateToImage('previous') : undefined,
    enabled: true,
  })

  // Handle canvas click
  const handleCanvasClick = (x: number, y: number) => {
    if (!selectedLandmarkId) return

    const existingAnnotation = annotations.get(selectedLandmarkId)
    if (existingAnnotation) {
      // Update existing
      updateMutation.mutate({
        annotationId: existingAnnotation.id,
        x,
        y,
      })

      // Record feedback if it was AI-predicted
      if (existingAnnotation.source === 'ai_predicted') {
        createFeedback(existingAnnotation.id, {
          action: 'adjusted',
          corrected_x: x,
          corrected_y: y,
        })
      }
    } else {
      // Create new
      annotationMutation.mutate({
        landmarkId: selectedLandmarkId,
        x,
        y,
      })
    }
  }

  if (imageLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">Loading image...</p>
      </div>
    )
  }

  if (!image) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-red-500">Image not found</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/images')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to images"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-semibold">{image.original_filename}</h1>
            <p className="text-sm text-slate-500">
              {image.width} x {image.height} •{' '}
              {annotations.size} / 19 landmarks
              {allImages && currentIndex >= 0 && (
                <span className="ml-2">
                  • Image {currentIndex + 1} of {allImages.length}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => navigateToImage('previous')}
              disabled={!canGoPrevious}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous image (Ctrl+\u2190)"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => navigateToImage('next')}
              disabled={!canGoNext}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next image (Ctrl+\u2192)"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Keyboard shortcuts help */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard size={18} />
          </button>

          <button
            onClick={handlePredict}
            disabled={isPredicting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            title="Run AI prediction (Ctrl+A)"
          >
            <Wand2 size={18} />
            {isPredicting ? 'Predicting...' : 'AI Predict'}
          </button>
        </div>
      </header>

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div className="absolute top-16 right-4 z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Keyboard Shortcuts</h3>
            <button
              onClick={() => setShowShortcuts(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
          <div className="space-y-2">
            {KEYBOARD_SHORTCUTS.map(({ key, description }) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-slate-600">{description}</span>
                <kbd className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo mode toast */}
      {demoModeToast && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-amber-500">
              <Wand2 size={20} />
            </div>
            <div>
              <h4 className="font-medium text-amber-800">Demo Mode</h4>
              <p className="text-sm text-amber-700 mt-1">
                AI predictions are not available in demo mode. You can still manually annotate landmarks by clicking on the image.
              </p>
            </div>
            <button
              onClick={() => setDemoModeToast(false)}
              className="flex-shrink-0 text-amber-400 hover:text-amber-600"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 bg-slate-900 overflow-hidden">
          <AnnotationCanvas
            imageUrl={`${UPLOADS_BASE_URL}/${image.filename}`}
            imageWidth={image.width}
            imageHeight={image.height}
            onCanvasClick={handleCanvasClick}
          />
        </div>

        {/* Landmark panel */}
        <LandmarkPanel imageId={imageId} />
      </div>
    </div>
  )
}
