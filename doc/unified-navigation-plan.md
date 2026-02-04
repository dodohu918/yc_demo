# Unified Navigation Plan: Tab-Based Links

## Overview

Add a navigation tab bar to the medicalLabeling landing page that links to all three applications. Deploy frontends to GitHub Pages and backends to Railway.

## Architecture

### Local Development
```
medicalLabeling (port 5173)     ← Main landing page with tabs
    ├── Tab: Medical Labeling   → stays on current page
    ├── Tab: Speaker Diarization → links to localhost:5174
    └── Tab: Cephalometric Tool  → links to localhost:5175

youtube_downloader (port 5174)  ← Frontend + Backend (port 8000)
cephalometric_mvp (port 5175)   ← Frontend + Backend (port 8001)
```

### Production Deployment
```
GitHub Pages
    ├── yourusername.github.io/medical-labeling/
    ├── yourusername.github.io/speaker-diarization/
    └── yourusername.github.io/cephalometric/

Railway
    ├── speaker-diarization-api.railway.app  ← youtube_downloader backend
    └── cephalometric-api.railway.app        ← cephalometric_mvp backend
```

---

## Part 1: Simplification for Demo

### 1.1 Remove ML Model from cephalometric_mvp

**Goal:** Keep the UI intact (including AI Predict button) but remove the ML backend dependency.

**Backend changes:**

**File:** `cephalometric_mvp/backend/app/main.py`
- Remove ML model loading on startup
- Remove the `ml/` module import

**File:** `cephalometric_mvp/backend/app/api/endpoints/predictions.py`
- Replace actual prediction logic with a mock response
- Return a message like "AI predictions not available in demo mode"

```python
# Mock prediction endpoint
@router.post("/predict/{image_id}")
async def predict_landmarks(image_id: int):
    return {
        "status": "demo_mode",
        "message": "AI predictions not available in demo mode",
        "predictions": []
    }
```

**Frontend changes:**

**File:** `cephalometric_mvp/frontend/src/pages/AnnotationPage.tsx`
- Keep the AI Predict button as-is
- When clicked, show a toast/alert: "AI predictions not available in demo mode"
- No other UI changes needed

### 1.2 Switch to SQLite

**Goal:** Remove PostgreSQL dependency, use file-based SQLite instead.

**youtube_downloader backend:**

**File:** `youtube_downloader/backend/database.py` (or equivalent)
```python
# Change from:
# DATABASE_URL = "postgresql://user:pass@localhost/dbname"

# To:
import os
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./demo.db")
```

**cephalometric_mvp backend:**

**File:** `cephalometric_mvp/backend/app/core/config.py` (or equivalent)
```python
# Change from:
# DATABASE_URL = "postgresql://user:pass@localhost/dbname"

# To:
import os
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./demo.db")
```

**Note:** SQLite works fine for demo purposes. Data will persist locally but resets on Railway redeploy (acceptable for demo).

---

## Part 2: Tab Navigation Implementation

### 2.1 Create Tab Navigation Component

**File:** `medicalLabeling/medical-labeling-app/src/components/AppTabs.tsx`

```tsx
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
      {apps.map((app) => (
        <a
          key={app.name}
          href={app.url}
          className={`app-tab ${activeApp === app.name ? 'active' : ''}`}
        >
          {app.name}
        </a>
      ))}
    </nav>
  );
}
```

**File:** `medicalLabeling/medical-labeling-app/src/components/AppTabs.css`

```css
.app-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.app-tab {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.app-tab:hover {
  background: #e0e0e0;
  color: #333;
}

.app-tab.active {
  background: #007bff;
  color: white;
}
```

### 2.2 Integrate Tabs into Header

**File:** `medicalLabeling/medical-labeling-app/src/components/Header.tsx`

Add `<AppTabs />` component to the header.

### 2.3 Add Matching Tab Bars to Other Apps

Create similar `AppTabs` components in:
- `youtube_downloader/frontend/src/components/AppTabs.tsx`
- `cephalometric_mvp/frontend/src/components/AppTabs.tsx`

Each should highlight its own app as active.

---

## Part 3: Deployment Configuration

### 3.1 GitHub Pages Setup

**Option A: Single Repo with Subdirectories**

Create a build script that outputs all frontends to a `docs/` or `gh-pages` branch:

```
docs/
├── index.html              ← Redirect to /medical-labeling/
├── medical-labeling/       ← medicalLabeling build output
├── speaker-diarization/    ← youtube_downloader frontend build
└── cephalometric/          ← cephalometric_mvp frontend build
```

**Vite base path configuration:**

Each app needs its base path set for GitHub Pages:

```typescript
// medicalLabeling/medical-labeling-app/vite.config.ts
export default defineConfig({
  base: '/medical-labeling/',
  // ...
})

// youtube_downloader/frontend/vite.config.ts
export default defineConfig({
  base: '/speaker-diarization/',
  // ...
})

// cephalometric_mvp/frontend/vite.config.ts
export default defineConfig({
  base: '/cephalometric/',
  // ...
})
```

**Option B: Separate Repos**

Deploy each frontend from its own repo to GitHub Pages.

### 3.2 Railway Setup

**Create two services on Railway:**

1. **speaker-diarization-api**
   - Source: `youtube_downloader/backend`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment variables:
     - `DATABASE_URL=sqlite:///./demo.db`
     - `CORS_ORIGINS=https://yourusername.github.io`

2. **cephalometric-api**
   - Source: `cephalometric_mvp/backend`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment variables:
     - `DATABASE_URL=sqlite:///./demo.db`
     - `CORS_ORIGINS=https://yourusername.github.io`

### 3.3 Environment Variables for Frontends

Create `.env.production` files for each frontend:

**youtube_downloader/frontend/.env.production**
```
VITE_API_URL=https://speaker-diarization-api.railway.app
VITE_MEDICAL_LABELING_URL=https://yourusername.github.io/medical-labeling/
VITE_SPEAKER_DIARIZATION_URL=https://yourusername.github.io/speaker-diarization/
VITE_CEPHALOMETRIC_URL=https://yourusername.github.io/cephalometric/
```

**cephalometric_mvp/frontend/.env.production**
```
VITE_API_URL=https://cephalometric-api.railway.app
VITE_MEDICAL_LABELING_URL=https://yourusername.github.io/medical-labeling/
VITE_SPEAKER_DIARIZATION_URL=https://yourusername.github.io/speaker-diarization/
VITE_CEPHALOMETRIC_URL=https://yourusername.github.io/cephalometric/
```

### 3.4 CORS Configuration

Update both backends to accept requests from GitHub Pages:

**youtube_downloader/backend/main.py**
```python
import os

origins = os.getenv("CORS_ORIGINS", "http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**cephalometric_mvp/backend/app/main.py**
```python
import os

origins = os.getenv("CORS_ORIGINS", "http://localhost:5175").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Part 4: Build & Deploy Scripts

### 4.1 Local Development Script

**File:** `yc_demo/start-dev.sh`

```bash
#!/bin/bash

# Start all applications for local development

echo "Starting Medical Labeling (port 5173)..."
(cd medicalLabeling/medical-labeling-app && npm run dev) &

echo "Starting Speaker Diarization backend (port 8000)..."
(cd youtube_downloader/backend && uvicorn main:app --reload --port 8000) &

echo "Starting Speaker Diarization frontend (port 5174)..."
(cd youtube_downloader/frontend && npm run dev) &

echo "Starting Cephalometric backend (port 8001)..."
(cd cephalometric_mvp/backend && uvicorn app.main:app --reload --port 8001) &

echo "Starting Cephalometric frontend (port 5175)..."
(cd cephalometric_mvp/frontend && npm run dev) &

echo ""
echo "All services starting..."
echo "  - Medical Labeling:    http://localhost:5173"
echo "  - Speaker Diarization: http://localhost:5174"
echo "  - Cephalometric Tool:  http://localhost:5175"
echo ""
echo "Press Ctrl+C to stop all services"

wait
```

### 4.2 Production Build Script

**File:** `yc_demo/build-for-gh-pages.sh`

```bash
#!/bin/bash

# Build all frontends for GitHub Pages deployment

set -e

echo "Building Medical Labeling..."
(cd medicalLabeling/medical-labeling-app && npm run build)

echo "Building Speaker Diarization frontend..."
(cd youtube_downloader/frontend && npm run build)

echo "Building Cephalometric frontend..."
(cd cephalometric_mvp/frontend && npm run build)

# Create docs directory structure
rm -rf docs
mkdir -p docs/medical-labeling
mkdir -p docs/speaker-diarization
mkdir -p docs/cephalometric

# Copy build outputs
cp -r medicalLabeling/medical-labeling-app/dist/* docs/medical-labeling/
cp -r youtube_downloader/frontend/dist/* docs/speaker-diarization/
cp -r cephalometric_mvp/frontend/dist/* docs/cephalometric/

# Create root redirect
cat > docs/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=./medical-labeling/" />
</head>
<body>
  <p>Redirecting to <a href="./medical-labeling/">Medical Labeling</a>...</p>
</body>
</html>
EOF

echo ""
echo "Build complete! Output in docs/ directory"
echo "Push to GitHub and enable Pages from docs/ folder"
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| **Simplification** | | |
| `cephalometric_mvp/backend/app/main.py` | Modify | Remove ML model loading |
| `cephalometric_mvp/backend/app/api/endpoints/predictions.py` | Modify | Return mock response |
| `cephalometric_mvp/frontend/src/pages/AnnotationPage.tsx` | Modify | Show "demo mode" toast on AI Predict |
| `youtube_downloader/backend/database.py` | Modify | Use SQLite |
| `cephalometric_mvp/backend/app/core/config.py` | Modify | Use SQLite |
| **Tab Navigation** | | |
| `medicalLabeling/.../components/AppTabs.tsx` | Create | Tab navigation component |
| `medicalLabeling/.../components/AppTabs.css` | Create | Tab styles |
| `medicalLabeling/.../components/Header.tsx` | Modify | Add AppTabs |
| `youtube_downloader/frontend/src/components/AppTabs.tsx` | Create | Tab navigation |
| `cephalometric_mvp/frontend/src/components/AppTabs.tsx` | Create | Tab navigation |
| **Deployment Config** | | |
| `medicalLabeling/.../vite.config.ts` | Modify | Set base path |
| `youtube_downloader/frontend/vite.config.ts` | Modify | Set base path |
| `cephalometric_mvp/frontend/vite.config.ts` | Modify | Set base path |
| `youtube_downloader/frontend/.env.production` | Create | Production API URLs |
| `cephalometric_mvp/frontend/.env.production` | Create | Production API URLs |
| `youtube_downloader/backend/main.py` | Modify | CORS from env var |
| `cephalometric_mvp/backend/app/main.py` | Modify | CORS from env var |
| **Scripts** | | |
| `yc_demo/start-dev.sh` | Create | Local dev startup |
| `yc_demo/build-for-gh-pages.sh` | Create | Production build |

---

## Testing Checklist

### Local Development
- [ ] All three frontends start without port conflicts
- [ ] Both backends start and respond to API calls
- [ ] Tab navigation appears on all three apps
- [ ] Clicking tabs navigates between apps
- [ ] AI Predict button shows "demo mode" message
- [ ] Data persists in SQLite databases

### Production (GitHub Pages + Railway)
- [ ] All frontends accessible on GitHub Pages
- [ ] Both Railway services running
- [ ] Frontends can communicate with Railway backends (CORS working)
- [ ] Tab navigation works with production URLs
- [ ] No console errors related to API calls

---

## Cost Estimate

| Service | Estimated Cost |
|---------|---------------|
| GitHub Pages | Free |
| Railway (2 services, light usage) | Free tier or ~$5/month |
| **Total** | **$0-5/month** |
