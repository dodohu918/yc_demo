import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import JobApply from './pages/JobApply'
import GetStarted from './pages/GetStarted'
import Quiz from './pages/Quiz'
import QuizSuccess from './pages/QuizSuccess'
import QuizFailed from './pages/QuizFailed'
import ApplicantContact from './pages/ApplicantContact'
import './App.css'

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply/id=1" element={<JobApply />} />
        <Route path="/apply/id=1/contact" element={<ApplicantContact />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/quiz/id=1" element={<Quiz />} />
        <Route path="/quiz/id=1/success" element={<QuizSuccess />} />
        <Route path="/quiz/id=1/failed" element={<QuizFailed />} />
      </Routes>
    </Router>
  )
}

export default App
