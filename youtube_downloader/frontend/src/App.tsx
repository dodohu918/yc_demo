import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { EditorPage } from './pages/EditorPage';

const apps = [
  {
    name: 'Medical Labeling',
    url: import.meta.env.VITE_MEDICAL_LABELING_URL || 'http://localhost:5173',
    isActive: false,
  },
  {
    name: 'Speaker Diarization',
    url: import.meta.env.VITE_SPEAKER_DIARIZATION_URL || '/',
    isActive: true,
  },
  {
    name: 'Cephalometric Tool',
    url: import.meta.env.VITE_CEPHALOMETRIC_URL || 'http://localhost:5175',
    isActive: false,
  },
];

function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-slate-800">
          YC Demo
        </a>
        <nav className="flex gap-2">
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.url}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                app.isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {app.name}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <div className="pt-14">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/editor/:projectId" element={<EditorPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
