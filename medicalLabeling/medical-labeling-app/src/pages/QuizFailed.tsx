import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './QuizResult.css'

function QuizFailed() {
  return (
    <div className="quiz-result-page">
      <Header />

      <main className="quiz-result-content">
        <div className="result-container failed">
          <div className="result-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 className="result-title">Not Quite Right</h1>

          <p className="result-message">
            Unfortunately, the tumor regions you identified didn't match our expected results.
            Don't worry — medical image interpretation takes practice, and we have other opportunities that might be a better fit!
          </p>

          <div className="next-steps">
            <h2>Consider These Options:</h2>
            <ul>
              <li>Review the training video again for better understanding</li>
              <li>Explore other labeling roles that match your expertise</li>
              <li>Check out our introductory courses on medical imaging</li>
              <li>Retake the test after additional preparation</li>
            </ul>
          </div>

          <div className="result-actions">
            <Link to="/quiz/id=1" className="secondary-btn">
              Try Again
            </Link>
            <Link to="/" className="primary-btn">
              Explore Other Opportunities
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default QuizFailed
