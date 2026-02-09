import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Image, Database, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'

const apps = [
  {
    name: 'Medical Labeling Job Search',
    url: import.meta.env.VITE_MEDICAL_LABELING_URL || 'http://localhost:5173',
    isActive: false,
  },
  {
    name: 'Cephalometric Tool',
    url: import.meta.env.VITE_CEPHALOMETRIC_URL || '/',
    isActive: true,
  },
  {
    name: 'Op Note Label Tool',
    url: import.meta.env.VITE_OP_NOTE_URL || 'http://localhost:5176',
    isActive: false,
  },
  {
    name: 'Speaker Diarization',
    url: import.meta.env.VITE_SPEAKER_DIARIZATION_URL || 'http://localhost:5174',
    isActive: false,
  },
]

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/images', label: 'Images', icon: Image },
  { path: '/datasets', label: 'Datasets', icon: Database },
]

export default function Layout() {
  const location = useLocation()

  return (
    <>
      {/* Top Header with App Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-3xl font-bold text-slate-800">
            DeepMine-YC Demo
          </a>
          <nav className="flex gap-2">
            {apps.map((app) => (
              <a
                key={app.name}
                href={app.url}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  app.isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {app.name}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="min-h-screen flex pt-14">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 text-white flex flex-col fixed left-0 top-14 bottom-0">
          <div className="p-4 border-b border-slate-700">
            <h1 className="text-xl font-bold">Cephalometric MVP</h1>
            <p className="text-sm text-slate-400">Landmark Annotation</p>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      location.pathname === path
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    <Icon size={20} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white w-full rounded-lg hover:bg-slate-700 transition-colors">
              <Settings size={20} />
              Settings
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto ml-64">
          <Outlet />
        </main>
      </div>
    </>
  )
}
