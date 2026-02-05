import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wand2, Keyboard } from 'lucide-react'
import { useAnnotationStore } from '@/hooks/useAnnotationStore'
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import AnnotationCanvas from '@/components/AnnotationCanvas'
import LandmarkPanel from '@/components/LandmarkPanel'
import type { Landmark, Annotation } from '@/utils/api'

// 19 standard cephalometric landmarks (hardcoded for static demo)
const DEMO_LANDMARKS: Landmark[] = [
  { id: 1, abbreviation: 'S', name: 'Sella', description: 'Center of the pituitary fossa (sella turcica)', display_order: 1 },
  { id: 2, abbreviation: 'N', name: 'Nasion', description: 'Most anterior point of the frontonasal suture', display_order: 2 },
  { id: 3, abbreviation: 'Or', name: 'Orbitale', description: 'Most inferior point on the infraorbital margin', display_order: 3 },
  { id: 4, abbreviation: 'Po', name: 'Porion', description: 'Most superior point of the external auditory meatus', display_order: 4 },
  { id: 5, abbreviation: 'A', name: 'A Point (Subspinale)', description: 'Deepest point on the anterior contour of the maxilla', display_order: 5 },
  { id: 6, abbreviation: 'B', name: 'B Point (Supramentale)', description: 'Deepest point on the anterior contour of the mandibular symphysis', display_order: 6 },
  { id: 7, abbreviation: 'Pog', name: 'Pogonion', description: 'Most anterior point on the chin', display_order: 7 },
  { id: 8, abbreviation: 'Gn', name: 'Gnathion', description: 'Most anterior-inferior point on the chin', display_order: 8 },
  { id: 9, abbreviation: 'Me', name: 'Menton', description: 'Most inferior point on the mandibular symphysis', display_order: 9 },
  { id: 10, abbreviation: 'Go', name: 'Gonion', description: 'Most posterior-inferior point on the mandibular angle', display_order: 10 },
  { id: 11, abbreviation: 'ANS', name: 'Anterior Nasal Spine', description: 'Tip of the anterior nasal spine', display_order: 11 },
  { id: 12, abbreviation: 'PNS', name: 'Posterior Nasal Spine', description: 'Most posterior point of the hard palate', display_order: 12 },
  { id: 13, abbreviation: 'U1', name: 'Upper Incisor Tip', description: 'Incisal edge of the most prominent upper central incisor', display_order: 13 },
  { id: 14, abbreviation: 'U1R', name: 'Upper Incisor Root', description: 'Root apex of the upper central incisor', display_order: 14 },
  { id: 15, abbreviation: 'L1', name: 'Lower Incisor Tip', description: 'Incisal edge of the most prominent lower central incisor', display_order: 15 },
  { id: 16, abbreviation: 'L1R', name: 'Lower Incisor Root', description: 'Root apex of the lower central incisor', display_order: 16 },
  { id: 17, abbreviation: 'U6', name: 'Upper Molar', description: 'Mesiobuccal cusp tip of the upper first molar', display_order: 17 },
  { id: 18, abbreviation: 'L6', name: 'Lower Molar', description: 'Mesiobuccal cusp tip of the lower first molar', display_order: 18 },
  { id: 19, abbreviation: 'Ar', name: 'Articulare', description: 'Intersection of posterior border of ramus and inferior border of cranial base', display_order: 19 },
]

// Ground truth landmark coordinates for the demo image (from test1_senior.csv, image 289.jpg)
// Format: landmark_id → { x, y }
const GROUND_TRUTH: Record<number, { x: number; y: number }> = {
  1:  { x: 797,  y: 1034 },  // S  - Sella
  2:  { x: 1399, y: 908  },  // N  - Nasion
  3:  { x: 1298, y: 1174 },  // Or - Orbitale
  4:  { x: 588,  y: 1245 },  // Po - Porion
  5:  { x: 1483, y: 1508 },  // A  - A Point
  6:  { x: 1428, y: 1778 },  // B  - B Point
  7:  { x: 1405, y: 1950 },  // Pog - Pogonion
  8:  { x: 1331, y: 2032 },  // Gn - Gnathion
  9:  { x: 1393, y: 2006 },  // Me - Menton
  10: { x: 764,  y: 1783 },  // Go - Gonion
  11: { x: 1488, y: 1629 },  // ANS
  12: { x: 1531, y: 1662 },  // PNS
  13: { x: 1638, y: 1553 },  // U1
  14: { x: 1605, y: 1771 },  // U1R
  15: { x: 1579, y: 1437 },  // L1
  16: { x: 1499, y: 1973 },  // L1R
  17: { x: 1009, y: 1425 },  // U6
  18: { x: 1452, y: 1397 },  // L6
  19: { x: 686,  y: 1336 },  // Ar - Articulare
}

// Demo image served from public/ folder
const DEMO_IMAGE_URL = `${import.meta.env.BASE_URL}demo_xray_1.jpg`
const DEMO_IMAGE_WIDTH = 1935
const DEMO_IMAGE_HEIGHT = 2400

let nextAnnotationId = 1

export default function DemoAnnotationPage() {
  const navigate = useNavigate()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [demoModeToast, setDemoModeToast] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)

  const {
    setAnnotations,
    setLandmarks,
    annotations,
    selectedLandmarkId,
    updateAnnotation,
    reset,
  } = useAnnotationStore()

  // Initialize store with hardcoded landmarks
  useEffect(() => {
    setLandmarks(DEMO_LANDMARKS)
    return () => reset()
  }, [setLandmarks, reset])

  // Load saved annotations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('demo_annotations')
      if (saved) {
        const parsed: Annotation[] = JSON.parse(saved)
        setAnnotations(parsed)
        nextAnnotationId = parsed.length + 1
      }
    } catch {
      // ignore
    }
  }, [setAnnotations])

  // Save annotations to localStorage whenever they change
  useEffect(() => {
    if (annotations.size > 0) {
      localStorage.setItem(
        'demo_annotations',
        JSON.stringify(Array.from(annotations.values()))
      )
    }
  }, [annotations])

  // AI prediction — place ground truth landmarks with simulated delay
  const handlePredict = useCallback(async () => {
    if (isPredicting) return
    setIsPredicting(true)

    // Simulate model inference delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const now = new Date().toISOString()
    for (const [idStr, coords] of Object.entries(GROUND_TRUTH)) {
      const landmarkId = Number(idStr)
      // Skip landmarks the user has already manually placed
      if (annotations.has(landmarkId)) continue

      const annotation: Annotation = {
        id: `ai-${nextAnnotationId++}`,
        image_id: 'demo',
        landmark_id: landmarkId,
        x: coords.x,
        y: coords.y,
        confidence: 0.85 + Math.random() * 0.12, // simulated confidence 0.85-0.97
        source: 'ai_predicted',
        is_visible: true,
        created_at: now,
        updated_at: now,
      }
      updateAnnotation(landmarkId, annotation)
    }

    setIsPredicting(false)
    setDemoModeToast(true)
    setTimeout(() => setDemoModeToast(false), 4000)
  }, [isPredicting, annotations, updateAnnotation])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPredict: handlePredict,
    enabled: true,
  })

  // Handle canvas click — create or update annotation locally
  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (!selectedLandmarkId) return

      const existing = annotations.get(selectedLandmarkId)
      if (existing) {
        // Update existing annotation position
        updateAnnotation(selectedLandmarkId, { ...existing, x, y, updated_at: new Date().toISOString() })
      } else {
        // Create new annotation
        const annotation: Annotation = {
          id: `demo-${nextAnnotationId++}`,
          image_id: 'demo',
          landmark_id: selectedLandmarkId,
          x,
          y,
          confidence: null,
          source: 'manual',
          is_visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        updateAnnotation(selectedLandmarkId, annotation)
      }
    },
    [selectedLandmarkId, annotations, updateAnnotation]
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-semibold">Cephalometric X-ray Sample</h1>
            <p className="text-sm text-slate-500">
              {DEMO_IMAGE_WIDTH} x {DEMO_IMAGE_HEIGHT} • {annotations.size} / 19 landmarks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              <h4 className="font-medium text-amber-800">AI Predictions Placed</h4>
              <p className="text-sm text-amber-700 mt-1">
                Landmarks have been placed using the AI model. Click on any landmark to adjust its position.
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
            imageUrl={DEMO_IMAGE_URL}
            imageWidth={DEMO_IMAGE_WIDTH}
            imageHeight={DEMO_IMAGE_HEIGHT}
            onCanvasClick={handleCanvasClick}
          />
        </div>

        {/* Landmark panel — no imageId so QuickFeedback is hidden */}
        <LandmarkPanel />
      </div>
    </div>
  )
}
