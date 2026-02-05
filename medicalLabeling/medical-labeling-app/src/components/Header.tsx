import { Link } from 'react-router-dom'

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
  {
    name: 'Op Note',
    url: import.meta.env.VITE_OP_NOTE_URL || 'http://localhost:5176',
    isActive: false,
  },
]

const headerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '80rem',
  margin: '0 auto',
  padding: '0.75rem 1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const logoStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 'bold',
  color: '#1e293b',
  textDecoration: 'none',
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
}

const linkBaseStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'all 0.2s',
}

function Header() {
  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <Link to="/" style={logoStyle}>
          YC Demo
        </Link>
        <nav style={navStyle}>
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.url}
              style={{
                ...linkBaseStyle,
                backgroundColor: app.isActive ? '#4f46e5' : 'transparent',
                color: app.isActive ? 'white' : '#475569',
              }}
            >
              {app.name}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Header
