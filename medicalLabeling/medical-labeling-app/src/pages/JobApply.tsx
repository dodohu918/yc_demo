import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './JobApply.css'

function JobApply() {
  return (
    <div className="job-apply-page">
      <Header />

      <main className="job-apply-content">
        <h1 className="job-apply-title">Medical Image Labeling Specialist - Apply</h1>

        <div className="video-container">
          <iframe
            src="https://www.youtube.com/embed/Zo7Emhb4Kn8"
            title="Salivary Gland Tumor Labeling Instructions"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        <div className="instructions-section">
          <h2 className="instructions-title">Labeling Instructions</h2>
          <ol className="instructions-list">
            <li>
              <strong>Review the medical image carefully</strong> - Take time to examine each salivary gland image before making any annotations. Zoom in to see fine details.
            </li>
            <li>
              <strong>Identify the tumor boundaries</strong> - Look for areas of abnormal tissue growth. The tumor typically appears as a distinct mass with different texture or density.
            </li>
            <li>
              <strong>Use the polygon tool for precise labeling</strong> - Trace the outer boundary of the tumor carefully. Include all visible tumor tissue while excluding healthy surrounding tissue.
            </li>
            <li>
              <strong>Classify the tumor type</strong> - After marking the boundary, select the appropriate tumor classification from the dropdown menu based on the visual characteristics.
            </li>
            <li>
              <strong>Add confidence level</strong> - Rate your confidence in the annotation on a scale of 1-5. This helps our QA team prioritize reviews.
            </li>
            <li>
              <strong>Submit and proceed</strong> - Once satisfied with your annotation, click submit and move to the next image. You can flag images that are unclear for expert review.
            </li>
          </ol>
        </div>

        <div className="test-section">
          <Link to="/quiz/id=1" className="test-btn">
            Take a simple test
            <span className="arrow">→</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default JobApply
