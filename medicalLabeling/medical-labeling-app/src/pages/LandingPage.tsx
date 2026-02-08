import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './LandingPage.css'

function LandingPage() {
  return (
    <div className="landing-page">
      <Header />

      {/* Hero Section */}
      <main className="hero">
        <video
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={`${import.meta.env.BASE_URL}hero-background.mp4`} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Clinical Reality Infrastructure
            <br />
            for Healthcare AI
          </h1>
          <p className="hero-subtitle">
            Building the data foundation that powers next-generation medical AI
          </p>
          <div className="hero-tags">
            <span className="tag">Medical Data Innovation</span>
            <span className="tag-separator">|</span>
            <span className="tag">Clinical Labeling & Curation</span>
            <span className="tag-separator">|</span>
            <span className="tag">HIPAA Compliance & Governance</span>
            <span className="tag-separator">|</span>
            <span className="tag">Healthcare AI Partnerships</span>
          </div>
          <Link to="/get-started" className="cta-btn">
            Explore more
            <span className="arrow">→</span>
          </Link>
        </div>
      </main>

      {/* Data Selection Section */}
      <section className="data-selection">
        <div className="data-selection-container">
          <div className="dropdown-group">
            <label className="dropdown-label">Select hospitals of interest</label>
            <select className="dropdown-select">
              <option value="">Choose a hospital...</option>
              <option value="ucsf">UCSF</option>
              <option value="stanford">Stanford</option>
              <option value="johns-hopkins">Johns Hopkins</option>
              <option value="mayo-clinic">Mayo Clinic</option>
            </select>
          </div>
          <div className="dropdown-group">
            <label className="dropdown-label">Select your Data of interest</label>
            <select className="dropdown-select">
              <option value="">Choose data type...</option>
              <option value="ultrasounds">Ultrasounds</option>
              <option value="ekgs">EKGs</option>
              <option value="ct">CT</option>
              <option value="mri">MRI</option>
            </select>
          </div>
          <div className="dropdown-group">
            <label className="dropdown-label">Select criteria for Medical Expertise</label>
            <select className="dropdown-select">
              <option value="">Choose criteria...</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="pathology">Pathology</option>
              <option value="medication-record">Medication Record</option>
              <option value="longevity">Longevity</option>
            </select>
          </div>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="partners">
        <div className="partners-track">
          <div className="partners-logos">
            <img src="https://via.placeholder.com/150x50/6366f1/ffffff?text=HealthTech" alt="Partner 1" />
            <img src="https://via.placeholder.com/150x50/8b5cf6/ffffff?text=MediCare" alt="Partner 2" />
            <img src="https://via.placeholder.com/150x50/ec4899/ffffff?text=BioLab" alt="Partner 3" />
            <img src="https://via.placeholder.com/150x50/f59e0b/ffffff?text=ClinicalAI" alt="Partner 4" />
            <img src="https://via.placeholder.com/150x50/10b981/ffffff?text=MedData" alt="Partner 5" />
            <img src="https://via.placeholder.com/150x50/3b82f6/ffffff?text=HealthAI" alt="Partner 6" />
            <img src="https://via.placeholder.com/150x50/ef4444/ffffff?text=DiagnosticX" alt="Partner 7" />
            <img src="https://via.placeholder.com/150x50/6366f1/ffffff?text=HealthTech" alt="Partner 1" />
            <img src="https://via.placeholder.com/150x50/8b5cf6/ffffff?text=MediCare" alt="Partner 2" />
            <img src="https://via.placeholder.com/150x50/ec4899/ffffff?text=BioLab" alt="Partner 3" />
            <img src="https://via.placeholder.com/150x50/f59e0b/ffffff?text=ClinicalAI" alt="Partner 4" />
            <img src="https://via.placeholder.com/150x50/10b981/ffffff?text=MedData" alt="Partner 5" />
            <img src="https://via.placeholder.com/150x50/3b82f6/ffffff?text=HealthAI" alt="Partner 6" />
            <img src="https://via.placeholder.com/150x50/ef4444/ffffff?text=DiagnosticX" alt="Partner 7" />
          </div>
          <div className="partners-logos" aria-hidden="true">
            <img src="https://via.placeholder.com/150x50/6366f1/ffffff?text=HealthTech" alt="Partner 1" />
            <img src="https://via.placeholder.com/150x50/8b5cf6/ffffff?text=MediCare" alt="Partner 2" />
            <img src="https://via.placeholder.com/150x50/ec4899/ffffff?text=BioLab" alt="Partner 3" />
            <img src="https://via.placeholder.com/150x50/f59e0b/ffffff?text=ClinicalAI" alt="Partner 4" />
            <img src="https://via.placeholder.com/150x50/10b981/ffffff?text=MedData" alt="Partner 5" />
            <img src="https://via.placeholder.com/150x50/3b82f6/ffffff?text=HealthAI" alt="Partner 6" />
            <img src="https://via.placeholder.com/150x50/ef4444/ffffff?text=DiagnosticX" alt="Partner 7" />
            <img src="https://via.placeholder.com/150x50/6366f1/ffffff?text=HealthTech" alt="Partner 1" />
            <img src="https://via.placeholder.com/150x50/8b5cf6/ffffff?text=MediCare" alt="Partner 2" />
            <img src="https://via.placeholder.com/150x50/ec4899/ffffff?text=BioLab" alt="Partner 3" />
            <img src="https://via.placeholder.com/150x50/f59e0b/ffffff?text=ClinicalAI" alt="Partner 4" />
            <img src="https://via.placeholder.com/150x50/10b981/ffffff?text=MedData" alt="Partner 5" />
            <img src="https://via.placeholder.com/150x50/3b82f6/ffffff?text=HealthAI" alt="Partner 6" />
            <img src="https://via.placeholder.com/150x50/ef4444/ffffff?text=DiagnosticX" alt="Partner 7" />
          </div>
        </div>
      </section>

      {/* Job Opportunities Section */}
      <section className="opportunities">
        <div className="opportunities-container">
          <h2 className="opportunities-title">Explore opportunities</h2>

          <div className="opportunities-controls">
            <div className="search-container">
              <button className="filter-menu-btn">☰</button>
              <input type="text" placeholder="Type to search" className="search-input" />
            </div>
            <div className="filter-buttons">
              <button className="filter-btn active">🔥 Trending</button>
              <button className="filter-btn">🕐 Newest</button>
              <button className="filter-btn">💰 Most pay</button>
              <button className="filter-btn refer-btn">👥 Refer & earn</button>
            </div>
          </div>

          <div className="jobs-grid">
            {/* Job Card 1 - Links to apply page */}
            <div className="job-card">
              <div className="card-header">
                <h3 className="job-title">Medical Image Labeling Specialist</h3>
                <Link to="/apply/id=1" className="apply-btn">Apply →</Link>
              </div>
              <p className="job-rate">$45 - $65 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">M</span>
                    <span className="avatar">R</span>
                    <span className="avatar">S</span>
                  </div>
                  <span className="hired-count">156 hired this month</span>
                </div>
                <span className="earnings">💰 $800</span>
              </div>
            </div>

            {/* Job Card 2 - Featured */}
            <div className="job-card featured">
              <div className="card-header">
                <h3 className="job-title">Radiology Annotation Expert</h3>
                <button className="apply-btn">Apply →</button>
              </div>
              <p className="job-rate">$60 - $85 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">D</span>
                    <span className="avatar">A</span>
                    <span className="avatar">K</span>
                  </div>
                  <span className="hired-count">203 hired this month</span>
                </div>
                <span className="earnings">💰 $1200</span>
              </div>
            </div>

            {/* Job Card 3 */}
            <div className="job-card">
              <div className="card-header">
                <h3 className="job-title">Pathology Data Labeling Expert</h3>
                <button className="apply-btn">Apply →</button>
              </div>
              <p className="job-rate">$50 - $75 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">P</span>
                    <span className="avatar">N</span>
                    <span className="avatar">L</span>
                  </div>
                  <span className="hired-count">189 hired this month</span>
                </div>
                <span className="earnings">💰 $950</span>
              </div>
            </div>

            {/* Job Card 4 */}
            <div className="job-card">
              <div className="card-header">
                <h3 className="job-title">Clinical Document Annotator</h3>
                <button className="apply-btn">Apply →</button>
              </div>
              <p className="job-rate">$35 - $55 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">C</span>
                    <span className="avatar">T</span>
                    <span className="avatar">J</span>
                  </div>
                  <span className="hired-count">142 hired this month</span>
                </div>
                <span className="earnings">💰 $650</span>
              </div>
            </div>

            {/* Job Card 5 */}
            <div className="job-card">
              <div className="card-header">
                <h3 className="job-title">DICOM Image Labeler</h3>
                <button className="apply-btn">Apply →</button>
              </div>
              <p className="job-rate">$40 - $60 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">E</span>
                    <span className="avatar">B</span>
                    <span className="avatar">V</span>
                  </div>
                  <span className="hired-count">178 hired this month</span>
                </div>
                <span className="earnings">💰 $720</span>
              </div>
            </div>

            {/* Job Card 6 */}
            <div className="job-card">
              <div className="card-header">
                <h3 className="job-title">Medical Imaging QA Specialist</h3>
                <button className="apply-btn">Apply →</button>
              </div>
              <p className="job-rate">$55 - $80 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">Q</span>
                    <span className="avatar">F</span>
                    <span className="avatar">M</span>
                  </div>
                  <span className="hired-count">167 hired this month</span>
                </div>
                <span className="earnings">💰 $1100</span>
              </div>
            </div>

            {/* Job Card 7 */}
            <div className="job-card">
              <div className="card-header">
                <h3 className="job-title">Healthcare Data Annotation Specialist</h3>
                <button className="apply-btn">Apply →</button>
              </div>
              <p className="job-rate">$38 - $58 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">H</span>
                    <span className="avatar">O</span>
                    <span className="avatar">W</span>
                  </div>
                  <span className="hired-count">134 hired this month</span>
                </div>
                <span className="earnings">💰 $580</span>
              </div>
            </div>

            {/* Job Card 8 */}
            <div className="job-card">
              <div className="card-header">
                <h3 className="job-title">CT/MRI Labeling Expert</h3>
                <button className="apply-btn">Apply →</button>
              </div>
              <p className="job-rate">$65 - $90 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">X</span>
                    <span className="avatar">Y</span>
                    <span className="avatar">Z</span>
                  </div>
                  <span className="hired-count">198 hired this month</span>
                </div>
                <span className="earnings">💰 $1350</span>
              </div>
            </div>

            {/* Job Card 9 */}
            <div className="job-card">
              <div className="card-header">
                <h3 className="job-title">Medical Terminology Specialist</h3>
                <button className="apply-btn">Apply →</button>
              </div>
              <p className="job-rate">$42 - $62 / hour</p>
              <div className="job-footer">
                <div className="job-stats">
                  <div className="avatars">
                    <span className="avatar">G</span>
                    <span className="avatar">I</span>
                    <span className="avatar">U</span>
                  </div>
                  <span className="hired-count">151 hired this month</span>
                </div>
                <span className="earnings">💰 $780</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
