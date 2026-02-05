# Session 1: Project Setup & Core Implementation

**Date:** February 3-4, 2026
**Status:** Phase 1 MVP - Core infrastructure complete, ready for model training

---

## Overview

This session established the foundation for the Cephalometric Landmark Detection MVP - an AI-assisted annotation platform for cephalometric X-rays with 19 standard landmarks.

---

## What Was Accomplished

### 1. Database Setup (PostgreSQL)

- Created `cephalometric_db` database using pgAdmin
- Configured environment variables in `.env` file
- Set up connection via Homebrew PostgreSQL (`brew services start postgresql@14`)

**Database Schema (8 tables):**
| Table | Purpose |
|-------|---------|
| `projects` | Project containers for organizing annotation work |
| `batches` | Groups of images within projects |
| `tasks` | Individual annotation tasks |
| `landmarks` | 19 standard cephalometric landmarks (auto-seeded) |
| `images` | Uploaded X-ray images |
| `annotations` | Landmark coordinates on images |
| `annotation_feedback` | User corrections for RLHF data collection |
| `model_versions` | ML model version tracking |

### 2. Backend (FastAPI + SQLAlchemy)

**Directory:** `backend/`

**Key Files:**
- `app/main.py` - FastAPI application with CORS and static file serving
- `app/core/config.py` - Environment configuration with Pydantic Settings
- `app/db/models.py` - SQLAlchemy ORM models
- `app/db/seed.py` - 19 landmark definitions
- `app/api/endpoints/` - REST API endpoints

**API Endpoints:**
```
GET/POST   /api/projects
GET/POST   /api/images
GET        /api/landmarks
GET/POST   /api/annotations
POST       /api/predictions
GET        /api/predictions/status
```

**Device-Agnostic ML Support:**
- Auto-detects CUDA (NVIDIA GPU), MPS (Apple Silicon M4), or CPU
- Configured in `app/ml/device.py`

### 3. Frontend (React + Vite + Tailwind)

**Directory:** `frontend/`

**Key Components:**
- `AnnotationCanvas.tsx` - Konva.js canvas with zoom/pan, click-to-place landmarks
- `LandmarkPanel.tsx` - Sidebar showing 19 landmarks with completion status
- `AnnotationPage.tsx` - Main annotation interface
- `ImagesPage.tsx` - Image upload with drag-and-drop
- `Dashboard.tsx` - Overview with stats

**State Management:**
- Zustand for annotation state (`useAnnotationStore.ts`)
- React Query for API data fetching

### 4. ML Training Script (Prepared)

**File:** `backend/app/ml/train.py`

Ready to train U-Net model on the dataset:
- 150 training images (`archive/train_senior.csv`)
- 150 test images (`archive/test1_senior.csv`)
- ResNet34 encoder with ImageNet pretrained weights
- Heatmap-based landmark regression
- Auto-saves best model to `models/unet_landmarks.pth`

---

## Bugs Fixed During Session

| Issue | Cause | Fix |
|-------|-------|-----|
| Image 404 errors | Relative path resolution from wrong directory | Used absolute paths via `PROJECT_ROOT` in config |
| Enum serialization error | SQLAlchemy sending `MANUAL` instead of `manual` | Added `values_callable` to Enum declarations |
| MissingGreenlet error | Lazy-loaded relationships in async context | Eagerly load with `selectinload()` before returning |

---

## Project Structure

```
cephalometric_mvp/
├── .env                    # Environment variables (DATABASE_PASSWORD, etc.)
├── .env.example            # Template for environment variables
├── .gitignore
├── archive/                # Dataset (400 images + CSV annotations)
│   ├── cepha400/cepha400/  # JPEG images
│   ├── train_senior.csv    # 150 training samples
│   ├── test1_senior.csv    # 150 test samples
│   └── test2_senior.csv    # 100 additional test samples
├── backend/
│   ├── alembic/            # Database migrations
│   ├── app/
│   │   ├── api/endpoints/  # REST API routes
│   │   ├── core/           # Configuration
│   │   ├── db/             # Models, session, seed data
│   │   ├── ml/             # Predictor, device detection, training
│   │   └── schemas/        # Pydantic schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Zustand store
│   │   └── utils/          # API client, utilities
│   └── package.json
├── models/                 # Trained model weights (empty until training)
├── uploads/                # User-uploaded images
└── doc/
    └── phase1_cephalometric_mvp.md
```

---

## How to Run

### Start PostgreSQL
```bash
brew services start postgresql@14
```

### Start Backend
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
```
Backend runs at: http://localhost:8000

### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

---

## 19 Cephalometric Landmarks

| ID | Abbr | Name | Description |
|----|------|------|-------------|
| 1 | S | Sella | Center of pituitary fossa |
| 2 | N | Nasion | Anterior point of frontonasal suture |
| 3 | Or | Orbitale | Inferior point on infraorbital margin |
| 4 | Po | Porion | Superior point of external auditory meatus |
| 5 | A | A Point | Deepest point on anterior maxilla |
| 6 | B | B Point | Deepest point on anterior mandibular symphysis |
| 7 | Pog | Pogonion | Most anterior point on chin |
| 8 | Gn | Gnathion | Anterior-inferior point on chin |
| 9 | Me | Menton | Inferior point on mandibular symphysis |
| 10 | Go | Gonion | Posterior-inferior point on mandibular angle |
| 11 | ANS | Anterior Nasal Spine | Tip of anterior nasal spine |
| 12 | PNS | Posterior Nasal Spine | Posterior point of hard palate |
| 13 | U1 | Upper Incisor Tip | Incisal edge of upper central incisor |
| 14 | U1R | Upper Incisor Root | Root apex of upper central incisor |
| 15 | L1 | Lower Incisor Tip | Incisal edge of lower central incisor |
| 16 | L1R | Lower Incisor Root | Root apex of lower central incisor |
| 17 | U6 | Upper Molar | Mesiobuccal cusp of upper first molar |
| 18 | L6 | Lower Molar | Mesiobuccal cusp of lower first molar |
| 19 | Ar | Articulare | Intersection of ramus and cranial base |

---

## Next Session: Train U-Net Model

The U-Net training script is ready. In the next session, run:

```bash
cd backend
source venv/bin/activate
python -m app.ml.train
```

**Expected:**
- Training time: ~20-40 minutes on Apple M4
- Output: `models/unet_landmarks.pth`
- Metrics: Mean Radial Error (MRE) and Success Detection Rate (SDR)

Once trained, the "AI Predict" button in the annotation interface will work, allowing:
1. Automatic landmark prediction on new images
2. Manual correction of AI predictions
3. Feedback collection for future RLHF improvements

---

## Configuration Reference

**.env file:**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cephalometric_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here

SECRET_KEY=dev-secret-key-change-in-production
DEBUG=true
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50
MODEL_DIR=./models
```
