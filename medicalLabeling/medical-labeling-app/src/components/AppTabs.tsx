import './AppTabs.css';

const apps = [
  {
    name: 'Medical Labeling',
    url: import.meta.env.VITE_MEDICAL_LABELING_URL || '/',
    isInternal: true,
  },
  {
    name: 'Speaker Diarization',
    url: import.meta.env.VITE_SPEAKER_DIARIZATION_URL || 'http://localhost:5174',
    isInternal: false,
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

export function AppTabs({ activeApp = 'Medical Labeling' }: AppTabsProps) {
  return (
    <nav className="app-tabs">
      <div className="app-tabs-container">
        {apps.map((app) => (
          <a
            key={app.name}
            href={app.url}
            className={`app-tab ${activeApp === app.name ? 'active' : ''}`}
          >
            {app.name}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default AppTabs;
