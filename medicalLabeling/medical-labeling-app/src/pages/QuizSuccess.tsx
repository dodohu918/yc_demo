import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './QuizResult.css'

function QuizSuccess() {
  return (
    <div className="quiz-result-page">
      <Header />

      <main className="quiz-result-content">
        <div className="result-container success">
          <div className="result-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="result-title">Congratulations, You Passed!</h1>

          <p className="result-message">
            Your ability to accurately identify the parotid tumor demonstrates the clinical expertise we're looking for.
            You're one step away from joining the LabelIQ team!
          </p>

          <div className="next-steps">
            <h2>What's Next?</h2>
            <ul>
              <li>Submit your contact information on the next page</li>
              <li>Our recruitment team will review your application</li>
              <li>Expect to hear from us within 3-5 business days</li>
              <li>Once approved, you'll receive onboarding materials</li>
            </ul>
          </div>

          <div className="result-actions">
            <Link to="/apply/id=1/contact" className="primary-btn">
              Continue to Contact Form
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default QuizSuccess
