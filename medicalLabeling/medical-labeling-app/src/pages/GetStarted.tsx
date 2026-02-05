import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './GetStarted.css'

function GetStarted() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    projectDescription: '',
    dataVolume: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Handle form submission here
  }

  return (
    <div className="get-started-page">
      <Header />

      <main className="get-started-content">
        <div className="get-started-container">
          {/* Left Side - Description */}
          <div className="description-section">
            <h1 className="description-title">
              Need Expert Medical Data Labeling?
            </h1>
            <p className="description-subtitle">
              Let our team of certified medical professionals handle your data annotation needs.
            </p>

            <div className="benefits-list">
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <div>
                  <h3>Certified Medical Experts</h3>
                  <p>Our labeling specialists include radiologists, pathologists, and clinical professionals with years of hands-on experience.</p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <div>
                  <h3>HIPAA Compliant Workflow</h3>
                  <p>Your data is handled with the highest security standards. We maintain full compliance with healthcare data regulations.</p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <div>
                  <h3>Scalable Solutions</h3>
                  <p>From small research projects to enterprise-level datasets, we scale our team to meet your deadlines without compromising quality.</p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <div>
                  <h3>Multi-Modal Expertise</h3>
                  <p>CT scans, MRIs, X-rays, pathology slides, clinical documents — we have specialists for every medical data type.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="form-section">
            <div className="form-card">
              <h2 className="form-title">Get Started Today</h2>
              <p className="form-subtitle">Tell us about your project and we'll get back to you within 24 hours.</p>

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Work Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company / Organization</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="jobTitle">Job Title</label>
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dataVolume">Estimated Data Volume</label>
                  <select
                    id="dataVolume"
                    name="dataVolume"
                    value={formData.dataVolume}
                    onChange={handleChange}
                  >
                    <option value="">Select an option</option>
                    <option value="small">Less than 1,000 images</option>
                    <option value="medium">1,000 - 10,000 images</option>
                    <option value="large">10,000 - 100,000 images</option>
                    <option value="enterprise">100,000+ images</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="projectDescription">Project Description *</label>
                  <textarea
                    id="projectDescription"
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your labeling needs, data types, and any specific requirements..."
                    required
                  />
                </div>

                <button type="submit" className="submit-btn">
                  Request a Quote
                  <span className="arrow">→</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default GetStarted
