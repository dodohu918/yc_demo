# Phase 1: Cephalometric Landmark Detection MVP
## AI-Assisted Annotation Platform with RLHF-Ready Architecture

**Version:** 1.0  
**Duration:** 14 Weeks  
**Status:** Development Ready  
**Date:** February 2026

---

## Executive Summary

### Project Overview
Build an AI-assisted annotation platform for cephalometric landmark detection on lateral skull X-rays. The system combines manual annotation tools with U-Net-based automatic landmark prediction, allowing users to efficiently annotate radiographs while collecting feedback data that will enable RLHF model improvement in Phase 2.

### Key Objectives
1. **Manual Annotation Tool** - Efficient interface for placing 19 cephalometric landmarks
2. **AI-Assisted Workflow** - U-Net suggests landmark locations, user refines
3. **Feedback Collection** - Track user corrections for future model improvement
4. **Dataset Export** - Generate training datasets in standard formats
5. **RLHF-Ready Architecture** - Build with Phase 2 expansion in mind

### Success Metrics
- ✅ Annotate 100 X-rays in <2 hours (vs 4+ hours manual)
- ✅ AI suggestions reduce annotation time by 50%
- ✅ System achieves ±2mm landmark accuracy
- ✅ Collect 1000+ feedback samples for Phase 2
- ✅ Export-ready datasets in multiple formats

---

## Table of Contents

1. [Clinical Context](#1-clinical-context)
2. [Dataset Specification](#2-dataset-specification)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Design](#5-database-design)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [ML Pipeline - U-Net](#8-ml-pipeline---u-net)
9. [User Workflows](#9-user-workflows)
10. [Development Roadmap](#10-development-roadmap)
11. [Phase 2 Preparation](#11-phase-2-preparation)

---

## 1. Clinical Context

### 1.1 What are Cephalometric Landmarks?

Cephalometric analysis is a diagnostic tool used in orthodontics and maxillofacial surgery. A lateral cephalogram (side view X-ray of the skull) is analyzed by identifying 19 standard anatomical landmarks.

**The 19 Standard Landmarks:**

| # | Landmark | Abbreviation | Definition |
|---|----------|--------------|------------|
| 1 | Sella | S | Center of sella turcica |
| 2 | Nasion | N | Most anterior point of frontonasal suture |
| 3 | Orbitale | Or | Lowest point on infraorbital margin |
| 4 | Porion | Po | Uppermost point of external auditory meatus |
| 5 | Posterior Nasal Spine | PNS | Tip of posterior spine of palatine bone |
| 6 | Anterior Nasal Spine | ANS | Tip of anterior nasal spine |
| 7 | A-point | A | Deepest midline point on maxillary alveolar process |
| 8 | B-point | B | Deepest midline point on mandibular alveolar process |
| 9 | Pogonion | Pog | Most anterior point of bony chin |
| 10 | Gnathion | Gn | Most anteroinferior point of bony chin |
| 11 | Menton | Me | Lowest point of mandibular symphysis |
| 12 | Gonion | Go | Most posteroinferior point of mandibular angle |
| 13 | Upper Incisor Tip | U1 | Incisal edge of most anterior maxillary central incisor |
| 14 | Upper Incisor Root | U1R | Root apex of maxillary central incisor |
| 15 | Lower Incisor Tip | L1 | Incisal edge of most anterior mandibular central incisor |
| 16 | Lower Incisor Root | L1R | Root apex of mandibular central incisor |
| 17 | Upper Lip | UL | Most anterior point of upper lip |
| 18 | Lower Lip | LL | Most anterior point of lower lip |
| 19 | Soft Tissue Pogonion | Pog' | Most anterior point of chin soft tissue |

### 1.2 Clinical Measurements Derived from Landmarks

These landmarks enable calculation of critical angles:
- **SNA angle** - Maxillary position relative to cranial base
- **SNB angle** - Mandibular position relative to cranial base  
- **ANB angle** - Skeletal relationship (Class I, II, or III)
- **FMA angle** - Mandibular plane angle
- And 20+ other measurements

### 1.3 Why AI Assistance Matters

**Current Manual Process:**
- 15-20 minutes per X-ray
- Requires expert anatomical knowledge
- Prone to inter-observer variability (±2-3mm)
- Tedious and fatiguing

**AI-Assisted Benefits:**
- 5-7 minutes per X-ray (50-65% time reduction)
- Consistent initial suggestions
- User focuses on verification and refinement
- Reduces cognitive load

---

## 2. Dataset Specification

### 2.1 Kaggle Cephalometric Dataset

**Source:** https://www.kaggle.com/datasets/jiahongqian/cephalometric-landmarks

**Dataset Contents:**
- **Images:** 400+ lateral cephalograms
- **Format:** Grayscale, DICOM or PNG
- **Resolution:** Typically 1935×2400 pixels (varies)
- **Annotations:** 19 (x, y) coordinates per image
- **Ground Truth:** Expert-annotated landmarks

**Dataset Structure:**
```
cephalometric-dataset/
├── images/
│   ├── 001.png
│   ├── 002.png
│   └── ...
└── annotations/
    ├── 001.txt  (or .json)
    └── ...
```

**Annotation Format (Expected):**
```
# Format 1: Plain text (x, y pairs)
123.5 456.2  # Sella
234.1 321.5  # Nasion
...

# Or Format 2: JSON
{
  "image_id": "001",
  "landmarks": [
    {"id": 1, "name": "Sella", "x": 123.5, "y": 456.2},
    {"id": 2, "name": "Nasion", "x": 234.1, "y": 321.5},
    ...
  ]
}
```

### 2.2 Data Split Strategy

**Training/Validation/Test Split:**
- **Training:** 70% (~280 images)
- **Validation:** 15% (~60 images)
- **Test:** 15% (~60 images)

**Rationale:**
- Training set large enough for U-Net to learn patterns
- Validation set for hyperparameter tuning
- Test set held out completely for final evaluation

### 2.3 Data Preprocessing

**Image Preprocessing Pipeline:**
1. **Resize** - Normalize to 512×512 (preserves aspect ratio with padding)
2. **Normalize** - Scale pixel values to [0, 1]
3. **Contrast Enhancement** - CLAHE (Contrast Limited Adaptive Histogram Equalization)
4. **Augmentation** (training only):
   - Random rotation (±10°)
   - Random scaling (0.9-1.1×)
   - Random brightness (±15%)
   - Horizontal flip (50% chance)

**Landmark Preprocessing:**
- Scale coordinates to match resized image
- Convert to heatmaps (Gaussian distribution, σ=2-3 pixels)

---

## 3. Technology Stack

### 3.1 Full Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Desktop Application                     │
│                     (Electron 28+)                       │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐                 ┌────────▼────────┐
│   Frontend     │                 │    Backend      │
│   React 18     │◄────HTTP────────┤    FastAPI      │
│   Vite 5       │                 │    Python 3.10  │
│   Tailwind 3   │                 │    PostgreSQL   │
└────────────────┘                 └─────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
            ┌───────▼────────┐    ┌────────▼────────┐   ┌────────▼────────┐
            │   PostgreSQL   │    │  File Storage   │   │   ML Engine     │
            │   Database     │    │   Local FS      │   │   U-Net Model   │
            │   15+ Tables   │    │   Images/Models │   │   PyTorch       │
            └────────────────┘    └─────────────────┘   └─────────────────┘
```

### 3.2 Technology Choices & Rationale

#### **Frontend**
```javascript
{
  "core": {
    "framework": "React 18.2+",
    "build": "Vite 5.0+",
    "language": "TypeScript 5.0+"
  },
  "styling": {
    "css": "Tailwind CSS 3.4+",
    "components": "shadcn/ui",
    "icons": "Lucide React"
  },
  "canvas": {
    "library": "Konva.js 9.0+",  // Better for point/circle overlays
    "alternative": "Custom Canvas API"
  },
  "state": {
    "global": "Zustand 4.4+",
    "server": "TanStack Query 5.0+",
    "forms": "React Hook Form 7.0+"
  }
}
```

**Why Konva.js instead of Fabric.js?**
- Optimized for point/circle rendering (landmarks)
- Better performance for medical imaging
- Simpler API for coordinate-based annotations

#### **Backend**
```python
{
  "core": {
    "framework": "FastAPI 0.109+",
    "language": "Python 3.10+",
    "async": "asyncio + uvloop"
  },
  "database": {
    "db": "PostgreSQL 15+",        # Changed from SQLite
    "orm": "SQLAlchemy 2.0+",
    "driver": "asyncpg 0.29+",     # PostgreSQL async driver
    "migrations": "Alembic 1.13+"
  },
  "ml": {
    "framework": "PyTorch 2.1+",
    "vision": "torchvision 0.16+",
    "medical": "MONAI 1.3+",       # Medical imaging toolkit
    "acceleration": "CUDA 12.1+ (optional)"
  },
  "imaging": {
    "processing": "Pillow 10.1+",
    "medical": "pydicom 2.4+",     # DICOM support
    "cv": "opencv-python 4.8+",
    "numpy": "numpy 1.26+"
  }
}
```

**Why PostgreSQL over SQLite?**
- Better concurrent access (multi-user support)
- Advanced indexing for large datasets
- JSON support for complex data structures
- Production-ready (easy scaling to Phase 2)
- Better backup and recovery
- RLHF Phase 2 will benefit from PostgeSQL features

#### **ML Stack**
```python
{
  "unet": {
    "architecture": "U-Net with ResNet34 encoder",
    "library": "segmentation_models_pytorch",
    "pretrained": "ImageNet weights"
  },
  "medical_toolkit": {
    "monai": "MONAI (Medical Open Network for AI)",
    "features": [
      "Medical image transforms",
      "Heatmap generation",
      "Evaluation metrics"
    ]
  }
}
```

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Actions                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Annotation  │  │   Feedback   │  │   Dataset    │          │
│  │    Canvas    │  │    Panel     │  │   Builder    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                         HTTP/REST API
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Annotation  │  │   Feedback   │  │   Training   │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                   │                 │
│         └─────────────────┼───────────────────┘                 │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│  PostgreSQL   │  │  File Storage  │  │   U-Net Model  │
│   Database    │  │    Images/     │  │   Inference    │
│               │  │    Models      │  │   Service      │
└───────────────┘  └────────────────┘  └────────────────┘
```

### 4.2 Data Flow - AI-Assisted Annotation

```
┌─────────────────────────────────────────────────────────────┐
│              AI-Assisted Annotation Workflow                 │
└─────────────────────────────────────────────────────────────┘

1. USER UPLOADS X-RAY
   └─> POST /api/v1/images/upload
       └─> Store in PostgreSQL + file system
       └─> Create image record with metadata

2. USER REQUESTS AI SUGGESTIONS
   └─> POST /api/v1/ml/predict-landmarks
       └─> Load image (512x512)
       └─> U-Net inference → 19 heatmaps
       └─> Find peaks → (x, y) coordinates
       └─> Return predictions with confidence scores

3. FRONTEND DISPLAYS PREDICTIONS
   └─> Show circles at predicted landmark locations
   └─> Color-coded by confidence (green=high, yellow=medium, red=low)
   └─> User can see all 19 landmarks overlaid

4. USER REVIEWS & CORRECTS
   └─> Accept: Click ✓ (no change needed)
   └─> Reject: Click ✗ (remove prediction)
   └─> Edit: Drag landmark to correct position
   └─> Add: Click to place missing landmark

5. SAVE ANNOTATIONS + FEEDBACK
   └─> POST /api/v1/annotations (corrected landmarks)
   └─> POST /api/v1/feedback (what was changed)
       └─> Store: original prediction, user correction, distance
       └─> This data enables RLHF in Phase 2

6. EXPORT DATASET
   └─> POST /api/v1/datasets/export
       └─> Generate training files (images + coordinates)
       └─> Support formats: YOLO, COCO, CSV
```

---

## 5. Database Design

### 5.1 PostgreSQL Schema Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  projects   │1      ∞ │   batches   │1      ∞ │    tasks    │
│─────────────│◄────────│─────────────│◄────────│─────────────│
│ id (PK)     │         │ id (PK)     │         │ id (PK)     │
│ name        │         │ project_id  │         │ batch_id    │
│ description │         │ name        │         │ name        │
│ created_at  │         │ created_at  │         │ status      │
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │1
                                                        │
                                                        │∞
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  landmarks  │       ∞ │   images    │1      ∞ │ annotations │
│─────────────│◄────────│─────────────│◄────────│─────────────│
│ id (PK)     │         │ id (PK)     │         │ id (PK)     │
│ project_id  │         │ task_id     │         │ image_id    │
│ name        │         │ filepath    │         │ landmark_id │
│ abbreviation│         │ width       │         │ x_coord     │
│ description │         │ height      │         │ y_coord     │
│ order_index │         │ status      │         │ confidence  │
└─────────────┘         └─────────────┘         │ is_auto     │
                                                │ is_verified │
                                                │ model_ver_id│ ← RLHF-aware
                                                └─────────────┘
                                                        │1
                                                        │
                                                        │∞
                                                ┌─────────────┐
                                                │  feedback   │
                                                │─────────────│
                                                │ id (PK)     │
                                                │ annotation  │
                                                │ feedback_type│
                                                │ original_x  │
                                                │ original_y  │
                                                │ corrected_x │
                                                │ corrected_y │
                                                │ distance    │ ← RLHF-aware
                                                │ created_at  │
                                                └─────────────┘
```

### 5.2 Core Tables (PostgreSQL DDL)

#### **Projects Table**
```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}',
    
    -- Indexes
    CONSTRAINT projects_name_unique UNIQUE (name)
);

CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

#### **Batches Table**
```sql
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_count INTEGER DEFAULT 0,
    
    CONSTRAINT batches_unique_name UNIQUE (project_id, name)
);

CREATE INDEX idx_batches_project ON batches(project_id);
```

#### **Tasks Table**
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'completed', 'reviewed')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_batch ON tasks(batch_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

#### **Landmarks Table** (NEW - Cephalometric-specific)
```sql
CREATE TABLE landmarks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,  -- Display order (1-19)
    color VARCHAR(7) DEFAULT '#FF5733',  -- Hex color for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT landmarks_unique UNIQUE (project_id, name),
    CONSTRAINT landmarks_abbr_unique UNIQUE (project_id, abbreviation)
);

CREATE INDEX idx_landmarks_project ON landmarks(project_id);
CREATE INDEX idx_landmarks_order ON landmarks(project_id, order_index);
```

#### **Images Table**
```sql
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(512) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    format VARCHAR(20) NOT NULL,
    size_bytes BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (
        status IN ('uploaded', 'annotating', 'annotated', 'reviewed', 'approved')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT images_filepath_unique UNIQUE (filepath)
);

CREATE INDEX idx_images_task ON images(task_id);
CREATE INDEX idx_images_status ON images(status);
CREATE INDEX idx_images_created_at ON images(created_at DESC);
```

#### **Annotations Table** (Point-based)
```sql
CREATE TABLE annotations (
    id SERIAL PRIMARY KEY,
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    landmark_id INTEGER NOT NULL REFERENCES landmarks(id) ON DELETE CASCADE,
    
    -- Coordinates
    x_coord DOUBLE PRECISION NOT NULL,
    y_coord DOUBLE PRECISION NOT NULL,
    
    -- Metadata
    confidence DOUBLE PRECISION DEFAULT 1.0,
    is_auto BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- RLHF-aware fields (Phase 2 ready)
    model_version_id INTEGER DEFAULT NULL,  -- Which model predicted this
    uncertainty_score DOUBLE PRECISION DEFAULT NULL,  -- For active learning
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Each image should have exactly one annotation per landmark
    CONSTRAINT annotations_unique UNIQUE (image_id, landmark_id)
);

CREATE INDEX idx_annotations_image ON annotations(image_id);
CREATE INDEX idx_annotations_landmark ON annotations(landmark_id);
CREATE INDEX idx_annotations_auto ON annotations(is_auto);
CREATE INDEX idx_annotations_model_version ON annotations(model_version_id);  -- RLHF
```

#### **Feedback Table** (RLHF-aware)
```sql
CREATE TABLE annotation_feedback (
    id SERIAL PRIMARY KEY,
    annotation_id INTEGER NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    landmark_id INTEGER NOT NULL REFERENCES landmarks(id) ON DELETE CASCADE,
    user_id VARCHAR(100) DEFAULT 'default_user',
    
    -- Feedback type
    feedback_type VARCHAR(50) NOT NULL CHECK (
        feedback_type IN ('accept', 'reject', 'edit', 'add_missing')
    ),
    
    -- Original AI prediction (if exists)
    original_x DOUBLE PRECISION,
    original_y DOUBLE PRECISION,
    original_confidence DOUBLE PRECISION,
    
    -- User's correction
    corrected_x DOUBLE PRECISION,
    corrected_y DOUBLE PRECISION,
    
    -- Quality metrics
    euclidean_distance DOUBLE PRECISION,  -- Distance between original and corrected
    review_time_seconds DOUBLE PRECISION,
    
    -- Model tracking (RLHF-aware)
    model_version_id INTEGER DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_feedback_annotation ON annotation_feedback(annotation_id);
CREATE INDEX idx_feedback_image ON annotation_feedback(image_id);
CREATE INDEX idx_feedback_type ON annotation_feedback(feedback_type);
CREATE INDEX idx_feedback_model_version ON annotation_feedback(model_version_id);  -- RLHF
CREATE INDEX idx_feedback_created_at ON annotation_feedback(created_at DESC);
```

#### **Model Versions Table** (RLHF-aware - Phase 2 ready)
```sql
CREATE TABLE model_versions (
    id SERIAL PRIMARY KEY,
    version_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Model info
    architecture VARCHAR(50) DEFAULT 'unet_resnet34',
    model_path VARCHAR(512) NOT NULL,
    
    -- Training info (Phase 2)
    parent_version_id INTEGER REFERENCES model_versions(id),
    training_run_id INTEGER DEFAULT NULL,
    
    -- Performance metrics
    metrics JSONB DEFAULT '{}',  -- {mre, sdr_2mm, sdr_3mm, etc.}
    validation_set_id INTEGER DEFAULT NULL,
    
    -- Deployment
    is_active BOOLEAN DEFAULT FALSE,
    is_baseline BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP,
    deprecated_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    description TEXT
);

CREATE INDEX idx_model_versions_active ON model_versions(is_active);
CREATE INDEX idx_model_versions_created_at ON model_versions(created_at DESC);
```

### 5.3 Database Initialization Script

```python
# scripts/init_database.py
"""Initialize PostgreSQL database with 19 standard cephalometric landmarks"""

import asyncpg
import asyncio

STANDARD_LANDMARKS = [
    (1, "Sella", "S", "Center of sella turcica", "#FF6B6B"),
    (2, "Nasion", "N", "Most anterior point of frontonasal suture", "#4ECDC4"),
    (3, "Orbitale", "Or", "Lowest point on infraorbital margin", "#45B7D1"),
    (4, "Porion", "Po", "Uppermost point of external auditory meatus", "#96CEB4"),
    (5, "Posterior Nasal Spine", "PNS", "Tip of posterior spine of palatine bone", "#FFEAA7"),
    (6, "Anterior Nasal Spine", "ANS", "Tip of anterior nasal spine", "#DFE6E9"),
    (7, "A-point", "A", "Deepest midline point on maxillary alveolar process", "#74B9FF"),
    (8, "B-point", "B", "Deepest midline point on mandibular alveolar process", "#A29BFE"),
    (9, "Pogonion", "Pog", "Most anterior point of bony chin", "#FD79A8"),
    (10, "Gnathion", "Gn", "Most anteroinferior point of bony chin", "#FDCB6E"),
    (11, "Menton", "Me", "Lowest point of mandibular symphysis", "#6C5CE7"),
    (12, "Gonion", "Go", "Most posteroinferior point of mandibular angle", "#00B894"),
    (13, "Upper Incisor Tip", "U1", "Incisal edge of most anterior maxillary central incisor", "#00CEC9"),
    (14, "Upper Incisor Root", "U1R", "Root apex of maxillary central incisor", "#0984E3"),
    (15, "Lower Incisor Tip", "L1", "Incisal edge of most anterior mandibular central incisor", "#E17055"),
    (16, "Lower Incisor Root", "L1R", "Root apex of mandibular central incisor", "#D63031"),
    (17, "Upper Lip", "UL", "Most anterior point of upper lip", "#E84393"),
    (18, "Lower Lip", "LL", "Most anterior point of lower lip", "#F39C12"),
    (19, "Soft Tissue Pogonion", "Pog'", "Most anterior point of chin soft tissue", "#8E44AD"),
]

async def initialize_database():
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='your_password',
        database='cephalometric_db'
    )
    
    # Create default project
    project_id = await conn.fetchval("""
        INSERT INTO projects (name, description)
        VALUES ('Default Project', 'Standard cephalometric analysis')
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
    """)
    
    # Insert 19 standard landmarks
    for order, name, abbr, desc, color in STANDARD_LANDMARKS:
        await conn.execute("""
            INSERT INTO landmarks (project_id, name, abbreviation, description, order_index, color)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (project_id, name) DO NOTHING
        """, project_id, name, abbr, desc, order, color)
    
    print(f"✓ Initialized database with {len(STANDARD_LANDMARKS)} landmarks")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(initialize_database())
```

---

## 6. Backend Architecture

### 6.1 Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app
│   ├── config.py                  # PostgreSQL config
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                # Database session
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── projects.py
│   │       ├── batches.py
│   │       ├── tasks.py
│   │       ├── images.py
│   │       ├── landmarks.py        # NEW
│   │       ├── annotations.py
│   │       ├── feedback.py         # NEW - RLHF-aware
│   │       ├── ml.py              # U-Net predictions
│   │       └── datasets.py
│   │
│   ├── models/                    # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── project.py
│   │   ├── batch.py
│   │   ├── task.py
│   │   ├── image.py
│   │   ├── landmark.py            # NEW
│   │   ├── annotation.py
│   │   ├── feedback.py            # NEW
│   │   └── model_version.py       # RLHF-aware
│   │
│   ├── schemas/                   # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── project.py
│   │   ├── batch.py
│   │   ├── task.py
│   │   ├── image.py
│   │   ├── landmark.py            # NEW
│   │   ├── annotation.py
│   │   └── feedback.py            # NEW
│   │
│   ├── services/                  # Business logic
│   │   ├── __init__.py
│   │   ├── project_service.py
│   │   ├── image_service.py
│   │   ├── annotation_service.py  # Point-based
│   │   ├── feedback_service.py    # NEW - RLHF data
│   │   └── dataset_service.py
│   │
│   ├── ml/                        # ML services
│   │   ├── __init__.py
│   │   ├── unet_service.py        # NEW - U-Net inference
│   │   ├── model_manager.py       # Model loading/caching
│   │   ├── preprocessing.py       # Image preprocessing
│   │   └── postprocessing.py      # Heatmap to coordinates
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── database.py            # PostgreSQL connection
│   │   ├── exceptions.py
│   │   └── logging.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── file_utils.py
│       ├── image_utils.py
│       └── metrics.py             # MRE, SDR calculations
│
├── scripts/
│   ├── init_database.py
│   ├── download_dataset.py        # Kaggle dataset download
│   ├── preprocess_dataset.py     # Convert to training format
│   └── train_unet.py             # Initial U-Net training
│
├── tests/
├── alembic/                       # PostgreSQL migrations
├── requirements.txt
└── setup.py
```

### 6.2 Configuration (config.py)

```python
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Cephalometric Annotation Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # PostgreSQL Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "your_secure_password"
    POSTGRES_DB: str = "cephalometric_db"
    
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    # File Storage
    UPLOAD_DIR: Path = Path("./data/uploads")
    MODELS_DIR: Path = Path("./data/models")
    EXPORTS_DIR: Path = Path("./data/exports")
    
    # ML Settings
    DEVICE: str = "cuda"  # or "cpu"
    UNET_MODEL_PATH: str = "./data/models/unet_resnet34_v1.pth"
    IMAGE_SIZE: int = 512  # Resize all X-rays to 512x512
    
    # Landmark Detection
    NUM_LANDMARKS: int = 19
    HEATMAP_SIGMA: float = 2.5  # Gaussian sigma for heatmaps
    CONFIDENCE_THRESHOLD: float = 0.3
    
    # Performance
    MAX_WORKERS: int = 4
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 6.3 Database Connection (core/database.py)

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create async engine (PostgreSQL)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,  # Verify connections before using
)

# Session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db() -> AsyncSession:
    """Dependency for getting database session"""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

---

## 7. Frontend Architecture

### 7.1 Directory Structure

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   │
│   │   ├── annotation/            # Cephalometric-specific
│   │   │   ├── CephCanvas.tsx     # Main annotation canvas
│   │   │   ├── LandmarkPanel.tsx  # List of 19 landmarks
│   │   │   ├── LandmarkMarker.tsx # Circle marker for point
│   │   │   ├── ImageControls.tsx  # Zoom, pan, brightness
│   │   │   └── ImageNavigator.tsx
│   │   │
│   │   ├── feedback/              # NEW - RLHF-aware
│   │   │   ├── QuickFeedback.tsx  # Accept/Reject/Edit
│   │   │   ├── CorrectionTool.tsx # Drag to correct
│   │   │   └── FeedbackStats.tsx  # Show accuracy metrics
│   │   │
│   │   └── dataset/
│   │       ├── DatasetBuilder.tsx
│   │       └── ExportDialog.tsx
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── AnnotationEditor.tsx   # Main annotation page
│   │   └── DatasetManager.tsx
│   │
│   ├── features/
│   │   ├── annotations/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── feedback/              # NEW
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   │
│   │   └── ml/
│   │       ├── api.ts             # U-Net predictions
│   │       ├── hooks.ts
│   │       └── types.ts
│   │
│   ├── stores/
│   │   ├── projectStore.ts
│   │   ├── annotationStore.ts
│   │   └── feedbackStore.ts       # NEW
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   └── types/
│       ├── api.ts
│       ├── landmark.ts            # NEW
│       ├── annotation.ts
│       └── feedback.ts            # NEW
│
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 7.2 Key Component: Cephalometric Canvas

**Purpose:** Display X-ray with 19 landmark points, support AI suggestions and manual corrections.

**Features:**
- Display grayscale X-ray image
- Overlay 19 colored circles (landmarks)
- Click to place/move landmarks
- Show AI predictions with confidence colors
- Drag landmarks to correct position
- Zoom and pan controls
- Brightness/contrast adjustment

**Technology:** Konva.js for canvas manipulation

---

## 8. ML Pipeline - U-Net

### 8.1 U-Net Architecture

**Model:** U-Net with ResNet34 encoder (pretrained on ImageNet)

```
Input: Grayscale X-ray (512×512×1)
       ↓
┌──────────────────────────────────────────┐
│          Encoder (ResNet34)              │
│  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │ Conv1  │→ │ Conv2  │→ │ Conv3  │→    │
│  │ 64 ch  │  │ 128 ch │  │ 256 ch │     │
│  └────────┘  └────────┘  └────────┘     │
│       ↓           ↓           ↓          │
│  Skip connections (concatenate)          │
└──────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│          Decoder (Upsampling)            │
│  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │ UpConv │→ │ UpConv │→ │ UpConv │→    │
│  │ 256 ch │  │ 128 ch │  │ 64 ch  │     │
│  └────────┘  └────────┘  └────────┘     │
└──────────────────────────────────────────┘
       ↓
Output: 19 Heatmaps (512×512×19)
        One heatmap per landmark
        Peak = landmark location
```

### 8.2 Heatmap-to-Coordinate Conversion

**Process:**
1. U-Net outputs 19 heatmaps (one per landmark)
2. Each heatmap has values 0-1 (probability)
3. Find peak (argmax) in each heatmap
4. Peak location = (x, y) coordinate
5. Confidence = peak value

**Example:**
```python
def heatmap_to_coordinates(heatmaps: np.ndarray) -> List[Dict]:
    """
    Convert heatmaps to landmark coordinates
    
    Args:
        heatmaps: [19, 512, 512] numpy array
    
    Returns:
        List of 19 landmarks with coordinates and confidence
    """
    landmarks = []
    
    for i, heatmap in enumerate(heatmaps):
        # Find peak
        peak_idx = np.argmax(heatmap)
        y, x = np.unravel_index(peak_idx, heatmap.shape)
        confidence = float(heatmap[y, x])
        
        landmarks.append({
            "landmark_id": i + 1,
            "x": float(x),
            "y": float(y),
            "confidence": confidence
        })
    
    return landmarks
```

### 8.3 Training Metrics (Phase 1)

**Primary Metric: Mean Radial Error (MRE)**
```
MRE = (1/N) × Σ √[(x_pred - x_true)² + (y_pred - y_true)²]

Good performance: MRE < 2.0mm
Excellent performance: MRE < 1.5mm
```

**Secondary Metrics:**
- **SDR (Successful Detection Rate)**
  - SDR@2mm: % of landmarks within 2mm of ground truth
  - SDR@3mm: % of landmarks within 3mm of ground truth
  - SDR@4mm: % of landmarks within 4mm of ground truth

**Target Performance (Phase 1 MVP):**
- MRE: 2.0-2.5mm (research grade)
- SDR@2mm: >70%
- SDR@3mm: >85%
- SDR@4mm: >95%

---

## 9. User Workflows

### 9.1 Complete Annotation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   User Journey: Annotate 100 X-rays          │
└─────────────────────────────────────────────────────────────┘

STEP 1: PROJECT SETUP (5 minutes)
├─> Create new project: "Orthodontic Study 2026"
├─> Create batch: "Batch 1 - Class II Patients"
├─> Create task: "Initial Annotation"
└─> Upload 100 X-ray images

STEP 2: AI-ASSISTED ANNOTATION (90-120 minutes for 100 images)
For each image:
├─> 1. Open image in annotation editor
│   └─> Image loads in canvas (512×512)
│
├─> 2. Click "Get AI Suggestions"
│   └─> U-Net predicts 19 landmarks
│   └─> Predictions appear as colored circles
│   └─> Green = high confidence (>0.7)
│   └─> Yellow = medium confidence (0.4-0.7)
│   └─> Red = low confidence (<0.4)
│
├─> 3. Review predictions (left panel shows list)
│   └─> ✓ Sella: 0.92 confidence (Accept)
│   └─> ✓ Nasion: 0.88 confidence (Accept)
│   └─> ⚠️ A-point: 0.65 confidence (Needs review)
│   └─> ❌ Gonion: 0.31 confidence (Reject, place manually)
│
├─> 4. Correct as needed
│   └─> Click landmark in list → highlights on canvas
│   └─> Drag circle to correct position
│   └─> OR click "X" to remove and place manually
│   └─> OR click "✓" to accept AI suggestion
│
├─> 5. Save annotations
│   └─> POST /api/v1/annotations (19 landmarks)
│   └─> POST /api/v1/feedback (corrections tracked)
│
└─> 6. Next image
    └─> Keyboard shortcut: Ctrl+→

STEP 3: REVIEW & EXPORT (10 minutes)
├─> Review annotated images
├─> Mark images as "approved"
├─> Create dataset: "Training Set v1"
├─> Select train/val/test split (70/15/15)
└─> Export dataset (CSV format with coordinates)

RESULT:
- 100 X-rays annotated in 2 hours (vs 4+ hours manual)
- 1,900 landmark annotations (100 images × 19 landmarks)
- ~500-800 corrections logged (feedback for Phase 2)
- Export-ready dataset for external use
```

### 9.2 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl + →** | Next image |
| **Ctrl + ←** | Previous image |
| **Ctrl + S** | Save annotations |
| **Ctrl + Z** | Undo last action |
| **Ctrl + A** | Request AI suggestions |
| **Space** | Pan mode (drag canvas) |
| **+** | Zoom in |
| **-** | Zoom out |
| **0** | Reset zoom |
| **1-9** | Quick select landmark 1-9 |
| **Ctrl + 1-9** | Quick select landmark 10-19 |
| **Enter** | Accept all AI suggestions |
| **Delete** | Remove selected landmark |

---

## 10. Development Roadmap

### Week 1-2: Project Setup & Database
**Goals:**
- Set up development environment
- Initialize PostgreSQL database
- Create database schema with Alembic
- Initialize 19 standard landmarks

**Deliverables:**
- ✅ PostgreSQL database running locally
- ✅ 15 tables created (projects, batches, tasks, images, landmarks, annotations, feedback, etc.)
- ✅ Database seeded with 19 standard landmarks
- ✅ Alembic migrations set up

**Tasks:**
- Install PostgreSQL 15+
- Create database: `cephalometric_db`
- Write SQLAlchemy models
- Create Alembic migration scripts
- Run `scripts/init_database.py`
- Test database CRUD operations

---

### Week 3-4: Backend Core
**Goals:**
- Build FastAPI application structure
- Implement core API endpoints
- Image upload and storage

**Deliverables:**
- ✅ FastAPI app running on port 8000
- ✅ Project/Batch/Task CRUD endpoints
- ✅ Image upload endpoint (multipart/form-data)
- ✅ Landmark management endpoints
- ✅ Basic unit tests

**API Endpoints to Implement:**
```
POST   /api/v1/projects
GET    /api/v1/projects
POST   /api/v1/batches
POST   /api/v1/tasks
POST   /api/v1/images/upload
GET    /api/v1/landmarks
POST   /api/v1/annotations
GET    /api/v1/annotations/{image_id}
```

---

### Week 5-6: Frontend Foundation
**Goals:**
- React app with Vite setup
- Project management UI
- Image upload interface

**Deliverables:**
- ✅ React app running on port 3000
- ✅ Tailwind CSS configured with shadcn/ui
- ✅ Main layout with sidebar navigation
- ✅ Project list and create project dialog
- ✅ Batch and task management pages
- ✅ Image upload component with drag-and-drop

**Pages:**
- Dashboard (project overview)
- Project detail (batches and tasks)
- Task detail (image list)

---

### Week 7-8: Annotation Canvas
**Goals:**
- Build cephalometric annotation canvas
- Display X-rays with landmark overlays
- Manual landmark placement

**Deliverables:**
- ✅ Konva.js canvas component
- ✅ Load and display X-ray images
- ✅ Click to place landmarks (19 points)
- ✅ Drag to reposition landmarks
- ✅ Zoom and pan controls
- ✅ Brightness/contrast adjustment
- ✅ Landmark list panel (19 landmarks with status)
- ✅ Save annotations to database

**Features:**
- Color-coded landmarks (19 different colors)
- Landmark labels (S, N, Or, Po, etc.)
- Click landmark in list → highlight on canvas
- Visual feedback (hover, selected states)

---

### Week 9-10: U-Net Model
**Goals:**
- Train initial U-Net model
- Implement inference service
- Integrate AI predictions into UI

**Deliverables:**
- ✅ U-Net model trained on Kaggle dataset
- ✅ Model checkpoint saved (~100MB file)
- ✅ FastAPI endpoint: `POST /api/v1/ml/predict`
- ✅ Preprocessing pipeline (resize, normalize)
- ✅ Postprocessing (heatmaps → coordinates)
- ✅ Frontend "Get AI Suggestions" button
- ✅ Display AI predictions on canvas

**Training:**
- Use Kaggle dataset (280 train, 60 val, 60 test)
- Train for 100 epochs (~4-6 hours on GPU)
- Target MRE: 2.0-2.5mm
- Save best model checkpoint

**Inference Workflow:**
```python
1. Receive image from frontend
2. Preprocess (resize to 512×512, normalize)
3. U-Net inference → 19 heatmaps
4. Find peaks in each heatmap → (x, y) coordinates
5. Return predictions with confidence scores
6. Frontend displays predictions as circles
```

---

### Week 11-12: Feedback System (RLHF-Ready)
**Goals:**
- Implement feedback collection
- Track user corrections
- Build feedback analytics

**Deliverables:**
- ✅ Feedback API endpoints
- ✅ Frontend feedback UI (Accept/Reject/Edit)
- ✅ Correction tracking (original vs corrected coordinates)
- ✅ Euclidean distance calculation
- ✅ Feedback statistics dashboard
- ✅ Database stores all corrections

**Feedback Workflow:**
```
1. AI predicts landmark at (100, 150)
2. User drags to (102, 148)
3. System records:
   - Original: (100, 150)
   - Corrected: (102, 148)
   - Distance: 2.83 pixels
   - Feedback type: "edit"
4. Stores in annotation_feedback table
5. Ready for RLHF training in Phase 2
```

**Analytics:**
- Acceptance rate per landmark
- Average correction distance
- Most problematic landmarks
- Model confidence vs user acceptance

---

### Week 13: Dataset Export
**Goals:**
- Build dataset export functionality
- Support multiple formats
- Train/val/test splitting

**Deliverables:**
- ✅ Export formats: CSV, JSON, COCO
- ✅ Train/val/test split (70/15/15)
- ✅ Generate coordinate files
- ✅ Copy images to export directory
- ✅ Create metadata file
- ✅ ZIP export for download

**Export Formats:**

**CSV Format:**
```csv
image_id,filename,landmark_name,x,y
001,ceph_001.png,Sella,123.5,456.2
001,ceph_001.png,Nasion,234.1,321.5
...
```

**JSON Format:**
```json
{
  "images": [
    {
      "id": "001",
      "filename": "ceph_001.png",
      "width": 512,
      "height": 512,
      "landmarks": [
        {"name": "Sella", "x": 123.5, "y": 456.2},
        {"name": "Nasion", "x": 234.1, "y": 321.5}
      ]
    }
  ]
}
```

---

### Week 14: Testing & Polish
**Goals:**
- End-to-end testing
- Bug fixes
- UI/UX improvements
- Documentation

**Deliverables:**
- ✅ All major bugs fixed
- ✅ Performance optimizations
- ✅ User documentation
- ✅ API documentation (Swagger UI)
- ✅ Deployment guide
- ✅ Demo video

**Testing Checklist:**
- [ ] Upload 100+ images
- [ ] AI predictions work for all images
- [ ] Manual annotation is smooth
- [ ] Feedback is tracked correctly
- [ ] Dataset export generates valid files
- [ ] Keyboard shortcuts work
- [ ] Zoom/pan works smoothly
- [ ] App works on Mac, Windows, Linux

---

## 11. Phase 2 Preparation

### 11.1 RLHF-Aware Design Decisions

Even in Phase 1, we're building with Phase 2 (RLHF) in mind:

**Database:**
- ✅ `annotations.model_version_id` - Track which model made prediction
- ✅ `annotations.uncertainty_score` - For active learning
- ✅ `annotation_feedback` table - Stores all corrections
- ✅ `model_versions` table - Version tracking ready

**Backend Services:**
- ✅ `FeedbackService` - Collects all user corrections
- ✅ Model version tracking in predictions
- ✅ Structured feedback data (original vs corrected)

**Frontend:**
- ✅ Feedback UI built-in from start
- ✅ Correction tracking automatic
- ✅ User doesn't need to think about it

### 11.2 Data Collection Goals (Phase 1)

By end of Phase 1, we want:
- 📊 **100+ annotated X-rays** - Minimum for Phase 2 training
- 📊 **500-1000 feedback samples** - User corrections logged
- 📊 **Baseline model performance** - MRE ~2.0-2.5mm
- 📊 **Identified pain points** - Which landmarks are hardest?

### 11.3 Transition to Phase 2

**What stays the same (90%):**
- All UI components
- All database tables (just add data)
- All API endpoints
- Core annotation workflow
- Manual annotation tools

**What changes (10%):**
- Add RLHF training pipeline
- Add active learning queue
- Add model comparison tools
- Add training dashboard

**Migration effort:** ~2-3 weeks

---

## Appendices

### A. Technology Requirements

**Development Machine:**
- OS: macOS, Windows 10+, or Linux
- RAM: 16GB minimum (32GB recommended)
- Storage: 50GB SSD
- GPU: NVIDIA GPU with 8GB+ VRAM (optional but recommended)
- CUDA: 12.1+ if using GPU

**Software:**
- Python 3.10+
- Node.js 18+
- PostgreSQL 15+
- Git

### B. Estimated Costs (Development)

| Item | Cost | Notes |
|------|------|-------|
| Development time | $0 | Your time |
| PostgreSQL | $0 | Free, self-hosted |
| Kaggle dataset | $0 | Free, public dataset |
| GPU (optional) | $0-500/mo | AWS/GCP or local |
| **Total** | **$0-500/mo** | Mostly free |

### C. Key Performance Indicators

**Phase 1 Success Metrics:**
- [ ] System can annotate 100 images in <2 hours
- [ ] AI suggestions save 50%+ annotation time
- [ ] Model achieves MRE < 2.5mm
- [ ] User acceptance rate > 70%
- [ ] Zero data loss (robust database)
- [ ] 500+ feedback samples collected
- [ ] Export formats work correctly

### D. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Dataset quality issues | Low | Medium | Kaggle dataset is pre-validated |
| U-Net training fails | Low | High | Use pretrained encoder, extensive literature |
| PostgreSQL complexity | Low | Medium | Well-documented, strong community |
| UI performance issues | Medium | Medium | Virtualization, image optimization |
| Annotation fatigue | Medium | Low | AI assistance reduces burden |

---

## Summary

**Phase 1 delivers:**
✅ **Production-ready annotation platform** for cephalometric X-rays  
✅ **AI-assisted workflow** reducing annotation time by 50%  
✅ **RLHF-ready architecture** for seamless Phase 2 upgrade  
✅ **Research-grade accuracy** (MRE ~2-2.5mm)  
✅ **Export-ready datasets** in multiple formats  
✅ **Feedback collection** for continuous improvement  

**Total development time:** 14 weeks  
**Team size:** 1 developer (you!)  
**Budget:** Minimal (~$0-500/mo for GPU if needed)

**Ready for Phase 2:** After Phase 1, you'll have real data, real feedback, and a working system. Phase 2 will add RLHF training to make the model continuously improve from user corrections.

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Ready for Implementation

**Next Steps:**
1. Review this document
2. Set up PostgreSQL database
3. Download Kaggle dataset
4. Begin Week 1 tasks
5. Build with Claude Code!

---

*This document is designed to be printed as a PDF and used as a high-level reference throughout Phase 1 development.*
