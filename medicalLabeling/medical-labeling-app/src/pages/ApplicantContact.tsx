import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './ApplicantContact.css'

function ApplicantContact() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    linkedIn: '',
    preferredContact: 'email',
    availability: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Applicant info submitted:', formData)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="applicant-contact-page">
        <Header />
        <main className="applicant-contact-content">
          <div className="submission-success">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1>Thank You!</h1>
            <p>Your information has been submitted successfully. Our team will review your application and contact you within <strong>3-5 business days</strong>.</p>
            <p className="check-email">Please check your email inbox (and spam folder) for updates on your application status.</p>
            <button className="home-btn" onClick={() => navigate('/')}>
              Return to Home
              <span className="arrow">→</span>
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="applicant-contact-page">
      <Header />

      <main className="applicant-contact-content">
        <div className="contact-container">
          <div className="contact-header">
            <div className="congrats-badge">
              <span className="badge-icon">🎉</span>
              <span>You passed the assessment!</span>
            </div>
            <h1 className="contact-title">Congratulations!</h1>
            <p className="contact-subtitle">
              You've demonstrated excellent skills in medical image analysis.
              Please provide your contact information below so our recruitment team can reach out to you.
              Expect to hear from us within <strong>3-5 business days</strong>.
            </p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Personal Information</h2>

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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
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
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(123) 456-7890"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Address</h2>

              <div className="form-group">
                <label htmlFor="address">Street Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Additional Information</h2>

              <div className="form-group">
                <label htmlFor="linkedIn">LinkedIn Profile (Optional)</label>
                <input
                  type="url"
                  id="linkedIn"
                  name="linkedIn"
                  value={formData.linkedIn}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="preferredContact">Preferred Contact Method *</label>
                  <select
                    id="preferredContact"
                    name="preferredContact"
                    value={formData.preferredContact}
                    onChange={handleChange}
                    required
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="availability">When can you start?</label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                  >
                    <option value="">Select an option</option>
                    <option value="immediately">Immediately</option>
                    <option value="1week">Within 1 week</option>
                    <option value="2weeks">Within 2 weeks</option>
                    <option value="1month">Within 1 month</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Submit My Information
              <span className="arrow">→</span>
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ApplicantContact
