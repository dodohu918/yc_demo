import { Link } from 'react-router-dom'
import './Header.css'

const apps = [
  {
    name: 'Medical Labeling',
    url: import.meta.env.VITE_MEDICAL_LABELING_URL || '/',
    isActive: true,
  },
  {
    name: 'Speaker Diarization',
    url: import.meta.env.VITE_SPEAKER_DIARIZATION_URL || 'http://localhost:5174',
    isActive: false,
  },
  {
    name: 'Cephalometric Tool',
    url: import.meta.env.VITE_CEPHALOMETRIC_URL || 'http://localhost:5175',
    isActive: false,
  },
]

function Header() {
  return (
    <header className="header">
      <div className="logo-container">
        <Link to="/">
          <img src="/logo.png" alt="LabelIQ" className="logo" />
        </Link>
      </div>
      <nav className="nav">
        {apps.map((app) => (
          <a
            key={app.name}
            href={app.url}
            className={`nav-link ${app.isActive ? 'active' : ''}`}
          >
            {app.name}
          </a>
        ))}
      </nav>
    </header>
  )
}

export default Header
