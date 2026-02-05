import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './Quiz.css'

interface Marker {
  id: number
  x: number
  y: number
}

// Define the correct tumor region (approximate percentages of image dimensions)
// The tumor is the dark oval mass on the left side of the ultrasound
const TUMOR_REGION = {
  xMin: 5,
  xMax: 45,
  yMin: 15,
  yMax: 75
}

const REQUIRED_CORRECT_MARKERS = 2
const MAX_MARKERS = 5

function Quiz() {
  const [markers, setMarkers] = useState<Marker[]>([])
  const [nextId, setNextId] = useState(1)
  const navigate = useNavigate()

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (markers.length >= MAX_MARKERS) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setMarkers([...markers, { id: nextId, x, y }])
    setNextId(nextId + 1)
  }

  const removeMarker = (id: number) => {
    setMarkers(markers.filter(m => m.id !== id))
  }

  const isMarkerInTumorRegion = (marker: Marker): boolean => {
    return (
      marker.x >= TUMOR_REGION.xMin &&
      marker.x <= TUMOR_REGION.xMax &&
      marker.y >= TUMOR_REGION.yMin &&
      marker.y <= TUMOR_REGION.yMax
    )
  }

  const handleSubmit = () => {
    if (markers.length === 0) return

    const correctMarkers = markers.filter(isMarkerInTumorRegion)
    const incorrectMarkers = markers.filter(m => !isMarkerInTumorRegion(m))

    // Pass if at least 2 markers are correct AND majority are correct
    const passed = correctMarkers.length >= REQUIRED_CORRECT_MARKERS &&
                   correctMarkers.length > incorrectMarkers.length

    if (passed) {
      navigate('/quiz/id=1/success')
    } else {
      navigate('/quiz/id=1/failed')
    }
  }

  const clearMarkers = () => {
    setMarkers([])
  }

  return (
    <div className="quiz-page">
      <Header />

      <main className="quiz-content">
        <div className="quiz-container">
          <h1 className="quiz-title">Question</h1>
          <p className="quiz-instruction">
            Click on the image to place markers identifying the <strong>parotid tumor</strong>.
            You can place up to {MAX_MARKERS} markers. Click on a marker to remove it.
          </p>

          <div className="image-container" onClick={handleImageClick}>
            <img src="/parotid tumor.png" alt="Parotid Ultrasound" />
            {markers.map(marker => (
              <div
                key={marker.id}
                className="marker"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  removeMarker(marker.id)
                }}
              >
                <span className="marker-dot"></span>
                <span className="marker-label">{marker.id}</span>
              </div>
            ))}
          </div>

          <div className="marker-count">
            Markers placed: {markers.length} / {MAX_MARKERS}
          </div>

          <div className="quiz-actions">
            <button
              className="clear-btn"
              onClick={clearMarkers}
              disabled={markers.length === 0}
            >
              Clear All
            </button>
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={markers.length === 0}
            >
              Submit
              <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Quiz
