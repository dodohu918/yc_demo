const apps = [
  {
    name: 'Medical Labeling',
    url: import.meta.env.VITE_MEDICAL_LABELING_URL || 'http://localhost:5173',
    isInternal: false,
  },
  {
    name: 'Speaker Diarization',
    url: import.meta.env.VITE_SPEAKER_DIARIZATION_URL || '/',
    isInternal: true,
  },
  {
    name: 'Cephalometric Tool',
    url: import.meta.env.VITE_CEPHALOMETRIC_URL || 'http://localhost:5175',
    isInternal: false,
  },
];

interface AppTabsProps {
  activeApp?: string;
}

export function AppTabs({ activeApp = 'Speaker Diarization' }: AppTabsProps) {
  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 py-2">
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.url}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeApp === app.name
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {app.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default AppTabs;
