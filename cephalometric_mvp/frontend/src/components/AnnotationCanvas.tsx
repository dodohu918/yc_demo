import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group } from 'react-konva'
import Konva from 'konva'
import { Sun, Contrast, RotateCcw } from 'lucide-react'
import { useAnnotationStore } from '@/hooks/useAnnotationStore'

// Landmark colors - distinct colors for each landmark
const LANDMARK_COLORS: Record<number, string> = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#f59e0b', // amber
  4: '#eab308', // yellow
  5: '#84cc16', // lime
  6: '#22c55e', // green
  7: '#10b981', // emerald
  8: '#14b8a6', // teal
  9: '#06b6d4', // cyan
  10: '#0ea5e9', // sky
  11: '#3b82f6', // blue
  12: '#6366f1', // indigo
  13: '#8b5cf6', // violet
  14: '#a855f7', // purple
  15: '#d946ef', // fuchsia
  16: '#ec4899', // pink
  17: '#f43f5e', // rose
  18: '#78716c', // stone
  19: '#64748b', // slate
}

interface AnnotationCanvasProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  onCanvasClick: (x: number, y: number) => void
}

export default function AnnotationCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  onCanvasClick,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const imageRef = useRef<Konva.Image>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

  // Brightness and contrast controls (0-200, 100 is default)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  const { annotations, selectedLandmarkId, landmarks, scale, offset, setScale, setOffset } =
    useAnnotationStore()

  // Apply filters when brightness/contrast change
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.cache()
      imageRef.current.filters([Konva.Filters.Brighten, Konva.Filters.Contrast])
      imageRef.current.brightness((brightness - 100) / 100) // -1 to 1 range
      imageRef.current.contrast((contrast - 100) / 50) // Higher contrast sensitivity
      imageRef.current.getLayer()?.batchDraw()
    }
  }, [brightness, contrast, image])

  const resetImageAdjustments = () => {
    setBrightness(100)
    setContrast(100)
  }

  // Load image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => setImage(img)
  }, [imageUrl])

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Calculate initial scale to fit image
  useEffect(() => {
    if (stageSize.width && stageSize.height && imageWidth && imageHeight) {
      const scaleX = stageSize.width / imageWidth
      const scaleY = stageSize.height / imageHeight
      const initialScale = Math.min(scaleX, scaleY) * 0.9 // 90% of available space
      setScale(initialScale)

      // Center the image
      const offsetX = (stageSize.width - imageWidth * initialScale) / 2
      const offsetY = (stageSize.height - imageHeight * initialScale) / 2
      setOffset({ x: offsetX, y: offsetY })
    }
  }, [stageSize, imageWidth, imageHeight, setScale, setOffset])

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()

      const stage = stageRef.current
      if (!stage) return

      const oldScale = scale
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const mousePointTo = {
        x: (pointer.x - offset.x) / oldScale,
        y: (pointer.y - offset.y) / oldScale,
      }

      const scaleBy = 1.1
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      const clampedScale = Math.max(0.1, Math.min(5, newScale))

      setScale(clampedScale)
      setOffset({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      })
    },
    [scale, offset, setScale, setOffset]
  )

  // Handle stage click
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Ignore if clicking on an existing annotation
      if (e.target !== e.target.getStage() && e.target.name() !== 'background') {
        return
      }

      const stage = stageRef.current
      if (!stage || !selectedLandmarkId) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      // Convert to image coordinates
      const x = (pointer.x - offset.x) / scale
      const y = (pointer.y - offset.y) / scale

      // Check if within image bounds
      if (x >= 0 && x <= imageWidth && y >= 0 && y <= imageHeight) {
        onCanvasClick(x, y)
      }
    },
    [scale, offset, selectedLandmarkId, imageWidth, imageHeight, onCanvasClick]
  )

  // Handle dragging
  const handleDragEnd = useCallback(
    (_e: Konva.KonvaEventObject<DragEvent>) => {
      const stage = stageRef.current
      if (!stage) return
      setOffset({ x: stage.x(), y: stage.y() })
    },
    [setOffset]
  )

  const getLandmarkAbbr = (landmarkId: number): string => {
    const landmark = landmarks.find((l) => l.id === landmarkId)
    return landmark?.abbreviation || String(landmarkId)
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={offset.x}
        y={offset.y}
        scaleX={scale}
        scaleY={scale}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {/* Background image */}
          {image && (
            <KonvaImage
              ref={imageRef}
              name="background"
              image={image}
              width={imageWidth}
              height={imageHeight}
            />
          )}

          {/* Annotations */}
          {Array.from(annotations.values()).map((annotation) => {
            const isSelected = annotation.landmark_id === selectedLandmarkId
            const color = LANDMARK_COLORS[annotation.landmark_id] || '#ffffff'
            const radius = isSelected ? 8 : 6

            return (
              <Group key={annotation.id}>
                {/* Outer ring for visibility */}
                <Circle
                  x={annotation.x}
                  y={annotation.y}
                  radius={radius + 2}
                  fill="black"
                  opacity={0.5}
                />
                {/* Main circle */}
                <Circle
                  x={annotation.x}
                  y={annotation.y}
                  radius={radius}
                  fill={color}
                  stroke={isSelected ? '#ffffff' : 'transparent'}
                  strokeWidth={isSelected ? 2 : 0}
                />
                {/* Label */}
                <Text
                  x={annotation.x + 10}
                  y={annotation.y - 6}
                  text={getLandmarkAbbr(annotation.landmark_id)}
                  fontSize={12}
                  fill={color}
                  fontStyle="bold"
                  shadowColor="black"
                  shadowBlur={2}
                  shadowOpacity={0.8}
                />
              </Group>
            )
          })}

          {/* Instructions overlay */}
          {!selectedLandmarkId && (
            <Text
              x={10}
              y={10}
              text="← Select a landmark from the panel to start annotating"
              fontSize={16}
              fill="#fbbf24"
              fontStyle="bold"
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={1}
            />
          )}
          {selectedLandmarkId && !annotations.has(selectedLandmarkId) && (
            <Text
              x={10}
              y={10}
              text={`Click on the image to place: ${getLandmarkAbbr(selectedLandmarkId)}`}
              fontSize={16}
              fill={LANDMARK_COLORS[selectedLandmarkId] || '#ffffff'}
              fontStyle="bold"
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={1}
            />
          )}
          {selectedLandmarkId && annotations.has(selectedLandmarkId) && (
            <Text
              x={10}
              y={10}
              text={`Click to move: ${getLandmarkAbbr(selectedLandmarkId)} (already placed)`}
              fontSize={16}
              fill={LANDMARK_COLORS[selectedLandmarkId] || '#ffffff'}
              fontStyle="bold"
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={1}
            />
          )}
        </Layer>
      </Stage>

      {/* Image adjustment controls */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-slate-600" />
          <input
            type="range"
            min="0"
            max="200"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            title={`Brightness: ${brightness}%`}
          />
          <span className="text-xs text-slate-500 w-8">{brightness}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Contrast className="w-4 h-4 text-slate-600" />
          <input
            type="range"
            min="0"
            max="200"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            title={`Contrast: ${contrast}%`}
          />
          <span className="text-xs text-slate-500 w-8">{contrast}%</span>
        </div>
        <button
          onClick={resetImageAdjustments}
          className="flex items-center justify-center gap-1 text-xs text-slate-600 hover:text-slate-900"
          title="Reset adjustments"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setScale(Math.min(5, scale * 1.2))}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl hover:bg-slate-50"
        >
          +
        </button>
        <button
          onClick={() => setScale(Math.max(0.1, scale / 1.2))}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl hover:bg-slate-50"
        >
          −
        </button>
        <button
          onClick={() => {
            const scaleX = stageSize.width / imageWidth
            const scaleY = stageSize.height / imageHeight
            const fitScale = Math.min(scaleX, scaleY) * 0.9
            setScale(fitScale)
            setOffset({
              x: (stageSize.width - imageWidth * fitScale) / 2,
              y: (stageSize.height - imageHeight * fitScale) / 2,
            })
          }}
          className="px-3 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-sm hover:bg-slate-50"
        >
          Fit
        </button>
      </div>
    </div>
  )
}
