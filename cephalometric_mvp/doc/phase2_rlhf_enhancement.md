# Phase 2: RLHF Enhancement for Cephalometric Platform
## Continuous Model Improvement Through Human Feedback

**Version:** 1.0  
**Duration:** Weeks 15-30 (16 weeks)  
**Prerequisites:** Phase 1 Complete  
**Date:** February 2026

---

## Executive Summary

### Project Overview
Phase 2 transforms the annotation platform into a self-improving system using Reinforcement Learning from Human Feedback (RLHF). The U-Net model will continuously learn from user corrections, becoming more accurate over time. This creates a positive feedback loop: better predictions → faster annotation → more feedback → even better predictions.

### Key Objectives
1. **RLHF Training Pipeline** - Fine-tune U-Net on user corrections
2. **Active Learning System** - Prioritize uncertain predictions for review
3. **Model Versioning** - Track and compare model improvements
4. **A/B Testing Framework** - Deploy new models safely
5. **Training Dashboard** - Monitor improvement in real-time

### Expected Improvements
- **Accuracy:** MRE 2.0mm → 1.5mm (25% improvement)
- **User Acceptance:** 70% → 85-90%
- **Annotation Time:** 2 hours/100 images → 1.5 hours/100 images
- **Reduced Corrections:** 30% fewer manual adjustments needed

---

## Table of Contents

1. [Phase 1 → Phase 2 Transition](#1-phase-1--phase-2-transition)
2. [RLHF Strategy](#2-rlhf-strategy)
3. [Database Changes](#3-database-changes)
4. [Backend Enhancements](#4-backend-enhancements)
5. [Training Pipeline](#5-training-pipeline)
6. [Active Learning System](#6-active-learning-system)
7. [Frontend Additions](#7-frontend-additions)
8. [Migration Guide](#8-migration-guide)
9. [Development Roadmap](#9-development-roadmap)
10. [Monitoring & Evaluation](#10-monitoring--evaluation)

---

## 1. Phase 1 → Phase 2 Transition

### 1.1 What Changes?

**95% of Phase 1 code stays the same.** We're adding new capabilities, not replacing existing ones.

### 1.2 Change Summary

| Component | Phase 1 | Phase 2 | Change Type |
|-----------|---------|---------|-------------|
| **Database** | 15 tables | 19 tables | Add 4 tables |
| **Annotations Table** | 10 columns | 13 columns | Add 3 columns |
| **Backend Services** | 15 services | 25 services | Add 10 services |
| **API Endpoints** | 40 endpoints | 60 endpoints | Add 20 endpoints |
| **Frontend Pages** | 6 pages | 9 pages | Add 3 pages |
| **ML Services** | U-Net inference | U-Net + Training | Add training |
| **User Workflow** | Manual + AI | Manual + AI + Learning | Enhanced |

### 1.3 Backward Compatibility

✅ **All Phase 1 features continue working**
- Existing annotations remain valid
- Manual annotation tools unchanged
- Export functionality unchanged
- No breaking API changes

➕ **New features added alongside**
- Training dashboard (new page)
- Active learning queue (new page)
- Model comparison tools (new page)
- Background training jobs (new service)

---

## 2. RLHF Strategy

### 2.1 Our Approach: Fine-Tuning on Corrections

```
┌─────────────────────────────────────────────────────────────┐
│                    RLHF Learning Loop                        │
└─────────────────────────────────────────────────────────────┘

WEEK 1-2 (Phase 1): Baseline Model
├─> Train initial U-Net on Kaggle dataset
├─> Deploy as v1.0
├─> Users annotate 100 X-rays
└─> Collect ~500 corrections

WEEK 3 (Phase 2 Start): First RLHF Iteration
├─> Analyze correction patterns
├─> Create training dataset from feedback
├─> Fine-tune U-Net v1.0 → v1.1
├─> Validate: MRE improves from 2.2mm → 2.0mm
└─> Deploy v1.1

WEEK 4-5: Second Iteration
├─> Users annotate with v1.1 (better predictions!)
├─> Collect ~300 new corrections (fewer needed)
├─> Fine-tune v1.1 → v1.2
├─> Validate: MRE improves from 2.0mm → 1.8mm
└─> Deploy v1.2

WEEK 6+: Continuous Improvement
├─> Active learning prioritizes uncertain cases
├─> Model keeps improving with each iteration
├─> Accuracy converges around 1.5mm MRE
└─> 90%+ predictions accepted without changes
```

### 2.2 Why This Works for Landmark Detection

**Traditional Training:**
- Train on generic dataset (Kaggle 400 images)
- Fixed model forever
- Doesn't adapt to your specific X-rays

**RLHF Training:**
- Starts with generic dataset
- Learns from YOUR corrections on YOUR X-rays
- Adapts to your annotation style
- Handles your specific image characteristics (quality, positioning)

### 2.3 Technical Implementation

**Method:** Supervised fine-tuning on correction data

```python
# Training Process
for correction in user_corrections:
    # Original: U-Net predicted (x=100, y=150)
    # User corrected to: (x=102, y=148)
    
    # Create training sample:
    input_image = correction.image
    target_heatmap = create_gaussian_heatmap(
        center=(102, 148),  # User's correction
        sigma=2.5
    )
    
    # Fine-tune: Model learns to predict (102, 148) instead of (100, 150)
    loss = mse_loss(predicted_heatmap, target_heatmap)
    optimizer.step()

# Result: Model gets better at predicting where YOU would place landmarks
```

**Key Insight:** We're not teaching the model new anatomy. We're teaching it your annotation preferences and how to handle your specific X-ray characteristics.

---

## 3. Database Changes

### 3.1 New Tables (4 tables)

#### **Training Runs Table**
```sql
CREATE TABLE training_runs (
    id SERIAL PRIMARY KEY,
    run_name VARCHAR(200) NOT NULL,
    
    -- Configuration
    config JSONB NOT NULL,  -- All hyperparameters
    base_model_version_id INTEGER NOT NULL REFERENCES model_versions(id),
    
    -- Data
    training_samples INTEGER,
    validation_samples INTEGER,
    feedback_sample_ids JSONB,  -- Which feedback was used
    
    -- Progress
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'running', 'completed', 'failed', 'cancelled')
    ),
    current_epoch INTEGER DEFAULT 0,
    total_epochs INTEGER,
    
    -- Results
    final_loss DOUBLE PRECISION,
    best_validation_mre DOUBLE PRECISION,
    output_model_version_id INTEGER REFERENCES model_versions(id),
    
    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Logs
    log_file_path VARCHAR(512),
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE INDEX idx_training_runs_status ON training_runs(status);
CREATE INDEX idx_training_runs_created_at ON training_runs(created_at DESC);
```

#### **Active Learning Queue Table**
```sql
CREATE TABLE active_learning_queue (
    id SERIAL PRIMARY KEY,
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    landmark_id INTEGER NOT NULL REFERENCES landmarks(id) ON DELETE CASCADE,
    annotation_id INTEGER REFERENCES annotations(id) ON DELETE CASCADE,
    
    -- Priority scoring
    uncertainty_score DOUBLE PRECISION NOT NULL,  -- 0-1, higher = more uncertain
    priority_score DOUBLE PRECISION NOT NULL,     -- Combined score for sorting
    
    -- Uncertainty source
    uncertainty_type VARCHAR(50) CHECK (
        uncertainty_type IN ('low_confidence', 'high_variance', 'edge_case', 'disagreement')
    ),
    uncertainty_reason TEXT,  -- Human-readable explanation
    
    -- Metadata
    model_version_id INTEGER REFERENCES model_versions(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    is_reviewed BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT queue_unique UNIQUE (image_id, landmark_id, model_version_id)
);

CREATE INDEX idx_queue_priority ON active_learning_queue(priority_score DESC, is_reviewed);
CREATE INDEX idx_queue_image ON active_learning_queue(image_id);
CREATE INDEX idx_queue_reviewed ON active_learning_queue(is_reviewed);
```

#### **A/B Tests Table**
```sql
CREATE TABLE ab_tests (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(200) NOT NULL,
    
    -- Models being tested
    model_a_version_id INTEGER NOT NULL REFERENCES model_versions(id),
    model_b_version_id INTEGER NOT NULL REFERENCES model_versions(id),
    
    -- Test configuration
    test_image_ids JSONB,  -- List of image IDs in test set
    traffic_split DOUBLE PRECISION DEFAULT 0.5,  -- 50/50 split
    
    -- Results
    model_a_metrics JSONB,  -- {mre, sdr_2mm, sdr_3mm, acceptance_rate}
    model_b_metrics JSONB,
    winner VARCHAR(10) CHECK (winner IN ('model_a', 'model_b', 'tie', 'undecided')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'running' CHECK (
        status IN ('running', 'completed', 'cancelled')
    ),
    
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    notes TEXT
);
```

#### **Training Checkpoints Table**
```sql
CREATE TABLE training_checkpoints (
    id SERIAL PRIMARY KEY,
    training_run_id INTEGER NOT NULL REFERENCES training_runs(id) ON DELETE CASCADE,
    epoch INTEGER NOT NULL,
    
    -- Checkpoint file
    checkpoint_path VARCHAR(512) NOT NULL,
    
    -- Metrics at this checkpoint
    train_loss DOUBLE PRECISION,
    val_loss DOUBLE PRECISION,
    val_mre DOUBLE PRECISION,
    val_sdr_2mm DOUBLE PRECISION,
    
    is_best BOOLEAN DEFAULT FALSE,  -- Best checkpoint so far
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT checkpoint_unique UNIQUE (training_run_id, epoch)
);

CREATE INDEX idx_checkpoints_run ON training_checkpoints(training_run_id);
CREATE INDEX idx_checkpoints_best ON training_checkpoints(is_best);
```

### 3.2 Modified Tables

**Extend `annotations` table** (already has RLHF-aware columns from Phase 1):
```sql
-- These were added in Phase 1, now we start using them:
-- model_version_id INTEGER
-- uncertainty_score DOUBLE PRECISION

-- Just ensure they exist:
ALTER TABLE annotations 
    ADD COLUMN IF NOT EXISTS model_version_id INTEGER REFERENCES model_versions(id),
    ADD COLUMN IF NOT EXISTS uncertainty_score DOUBLE PRECISION;
```

**Extend `model_versions` table** (populate training info):
```sql
-- These fields exist but are NULL in Phase 1
-- Now we'll populate them:
-- training_run_id, parent_version_id, metrics, etc.
```

---

## 4. Backend Enhancements

### 4.1 New Services

#### **Training Service** (services/training_service.py)

**Purpose:** Orchestrate model training from feedback data

**Key Methods:**
```python
class TrainingService:
    async def start_training_run(
        self,
        base_model_version_id: int,
        config: Dict,
        min_feedback_samples: int = 100
    ) -> TrainingRun
    
    async def prepare_training_data(
        self,
        training_run_id: int
    ) -> Tuple[Dataset, Dataset]
    
    async def train_model(
        self,
        training_run_id: int,
        train_dataset: Dataset,
        val_dataset: Dataset
    ) -> str  # Returns path to trained model
    
    async def evaluate_model(
        self,
        model_path: str,
        test_dataset: Dataset
    ) -> Dict[str, float]  # Returns metrics
    
    async def create_model_version(
        self,
        training_run_id: int,
        model_path: str,
        metrics: Dict
    ) -> ModelVersion
```

**Workflow:**
```
1. Check: Enough feedback? (min 100 samples)
2. Prepare: Convert feedback to training data
3. Train: Fine-tune U-Net on corrections (20-50 epochs)
4. Evaluate: Test on held-out validation set
5. Save: Create new model version
6. Deploy: Optionally set as active model
```

#### **Active Learning Service** (services/active_learning_service.py)

**Purpose:** Select which predictions need human review most

**Key Methods:**
```python
class ActiveLearningService:
    async def score_predictions_uncertainty(
        self,
        predictions: List[LandmarkPrediction]
    ) -> List[UncertaintyScore]
    
    async def populate_review_queue(
        self,
        task_id: int,
        model_version_id: int,
        n_samples: int = 50
    )
    
    async def get_next_review_items(
        self,
        n_items: int = 10
    ) -> List[ReviewQueueItem]
    
    async def mark_reviewed(
        self,
        queue_id: int
    )
```

**Uncertainty Scoring:**
```python
def calculate_uncertainty_score(prediction):
    """
    Uncertainty comes from:
    1. Low confidence (peak value in heatmap)
    2. Multiple peaks (ambiguous)
    3. Flat heatmap (no clear peak)
    """
    
    # Confidence uncertainty
    confidence_uncertainty = 1 - prediction.confidence
    
    # Heatmap analysis
    heatmap = prediction.heatmap
    peak_value = np.max(heatmap)
    second_peak = np.partition(heatmap.flatten(), -2)[-2]
    
    # Peak clarity
    peak_clarity = peak_value - second_peak
    clarity_uncertainty = 1 - peak_clarity
    
    # Combined score
    uncertainty = (
        0.6 * confidence_uncertainty +
        0.4 * clarity_uncertainty
    )
    
    return uncertainty
```

#### **Model Version Service** (services/model_version_service.py)

**Purpose:** Manage model lifecycle

**Key Methods:**
```python
class ModelVersionService:
    async def list_versions(
        self,
        is_active: bool = None
    ) -> List[ModelVersion]
    
    async def deploy_version(
        self,
        version_id: int
    )  # Sets version as active
    
    async def compare_versions(
        self,
        version_a_id: int,
        version_b_id: int
    ) -> Dict[str, Any]
    
    async def rollback_to_version(
        self,
        version_id: int
    )  # Revert to previous version
```

### 4.2 New API Endpoints

#### **Training Endpoints**
```python
# api/v1/training.py

POST   /api/v1/training/start
# Start new training run
# Body: {base_model_version_id, config, min_feedback_samples}
# Returns: TrainingRun

GET    /api/v1/training/runs
# List all training runs
# Query: status, limit
# Returns: List[TrainingRun]

GET    /api/v1/training/runs/{run_id}
# Get training run details
# Returns: TrainingRun with progress

POST   /api/v1/training/runs/{run_id}/stop
# Stop running training job
# Returns: {success: bool}

GET    /api/v1/training/runs/{run_id}/logs
# Get training logs (tail last 100 lines)
# Returns: {logs: string}

GET    /api/v1/training/status
# Get overall training system status
# Returns: {running_jobs, queue_length, gpu_status}
```

#### **Active Learning Endpoints**
```python
# api/v1/active_learning.py

POST   /api/v1/active-learning/populate-queue
# Populate review queue with uncertain predictions
# Body: {task_id, model_version_id, n_samples}
# Returns: {total_candidates, selected, strategy}

GET    /api/v1/active-learning/queue
# Get next items from review queue
# Query: n_items (default 10)
# Returns: List[ReviewQueueItem]

POST   /api/v1/active-learning/queue/{queue_id}/reviewed
# Mark item as reviewed
# Returns: {success: bool}

GET    /api/v1/active-learning/queue/stats
# Get queue statistics
# Returns: {total_items, reviewed, pending, avg_uncertainty}
```

#### **Model Version Endpoints**
```python
# api/v1/model_versions.py

GET    /api/v1/model-versions
# List all model versions
# Query: is_active, limit
# Returns: List[ModelVersion]

GET    /api/v1/model-versions/{version_id}
# Get version details
# Returns: ModelVersion

POST   /api/v1/model-versions/{version_id}/deploy
# Deploy model version (set as active)
# Returns: {success: bool, deployed_at}

GET    /api/v1/model-versions/{v1_id}/compare/{v2_id}
# Compare two model versions
# Returns: {
#   model_a: {mre, sdr_2mm, acceptance_rate},
#   model_b: {mre, sdr_2mm, acceptance_rate},
#   improvement: {mre: -0.3mm, sdr_2mm: +5%}
# }

POST   /api/v1/model-versions/{version_id}/rollback
# Rollback to this version
# Returns: {success: bool}
```

---

## 5. Training Pipeline

### 5.1 Data Preparation

**Input:** User feedback from `annotation_feedback` table

**Output:** PyTorch training dataset

```python
# ml/training/data_loader.py

class CephalometricFeedbackDataset(Dataset):
    """
    Convert user corrections into training data
    """
    
    def __init__(self, feedback_records: List[Feedback]):
        self.samples = []
        
        for feedback in feedback_records:
            if feedback.feedback_type == 'edit':
                # User corrected AI prediction
                sample = {
                    'image_path': feedback.image.filepath,
                    'landmark_id': feedback.landmark_id,
                    'target_x': feedback.corrected_x,
                    'target_y': feedback.corrected_y,
                    'original_x': feedback.original_x,
                    'original_y': feedback.original_y,
                    'correction_distance': feedback.euclidean_distance
                }
                self.samples.append(sample)
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        
        # Load image
        image = Image.open(sample['image_path']).convert('L')
        image = self.preprocess(image)  # Resize, normalize
        
        # Create target heatmap (Gaussian centered at corrected location)
        target_heatmap = create_gaussian_heatmap(
            center=(sample['target_x'], sample['target_y']),
            size=(512, 512),
            sigma=2.5
        )
        
        return {
            'image': image,
            'target_heatmap': target_heatmap,
            'landmark_id': sample['landmark_id']
        }
```

### 5.2 Training Loop

```python
# ml/training/trainer.py

class UNetFinetuner:
    def __init__(self, base_model_path: str, device: str = 'cuda'):
        # Load pretrained model
        self.model = UNet.load_from_checkpoint(base_model_path)
        self.model.to(device)
        self.device = device
        
        # Optimizer (lower learning rate for fine-tuning)
        self.optimizer = torch.optim.Adam(
            self.model.parameters(),
            lr=1e-5  # 10x lower than initial training
        )
        
        # Loss function
        self.criterion = nn.MSELoss()
    
    async def train_epoch(self, train_loader):
        self.model.train()
        total_loss = 0
        
        for batch in train_loader:
            images = batch['image'].to(self.device)
            targets = batch['target_heatmap'].to(self.device)
            landmark_ids = batch['landmark_id']
            
            # Forward pass
            predictions = self.model(images)
            
            # Compute loss only for specific landmarks
            loss = 0
            for i, landmark_id in enumerate(landmark_ids):
                pred_heatmap = predictions[i, landmark_id-1, :, :]
                target_heatmap = targets[i, 0, :, :]
                loss += self.criterion(pred_heatmap, target_heatmap)
            
            loss = loss / len(landmark_ids)
            
            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
        
        return total_loss / len(train_loader)
    
    async def validate(self, val_loader):
        self.model.eval()
        
        all_errors = []
        
        with torch.no_grad():
            for batch in val_loader:
                images = batch['image'].to(self.device)
                ground_truth = batch['coordinates']  # True (x, y)
                
                # Predict
                heatmaps = self.model(images)
                predictions = heatmaps_to_coordinates(heatmaps)
                
                # Calculate errors
                for pred, gt in zip(predictions, ground_truth):
                    error = np.sqrt((pred['x'] - gt['x'])**2 + (pred['y'] - gt['y'])**2)
                    all_errors.append(error)
        
        # Mean Radial Error
        mre = np.mean(all_errors)
        
        # Successful Detection Rate @ 2mm
        sdr_2mm = np.mean([e < 2.0 for e in all_errors])
        
        return {
            'mre': mre,
            'sdr_2mm': sdr_2mm,
            'sdr_3mm': np.mean([e < 3.0 for e in all_errors]),
            'sdr_4mm': np.mean([e < 4.0 for e in all_errors])
        }
```

### 5.3 Training Configuration

**Typical Fine-Tuning Config:**
```json
{
  "base_model_version_id": 1,
  "num_epochs": 30,
  "batch_size": 8,
  "learning_rate": 1e-5,
  "optimizer": "adam",
  "weight_decay": 0.01,
  "scheduler": "cosine",
  "early_stopping_patience": 5,
  "min_feedback_samples": 100,
  "augmentation": {
    "rotation": 5,
    "scaling": 0.05,
    "brightness": 0.1,
    "horizontal_flip": false
  }
}
```

**Training Duration:**
- 100 feedback samples: ~30 minutes on GPU
- 500 feedback samples: ~2 hours on GPU
- 1000 feedback samples: ~4 hours on GPU

---

## 6. Active Learning System

### 6.1 Uncertainty-Based Sampling

**Goal:** Find predictions where model is least confident

**Strategy:**
```python
def select_uncertain_samples(predictions, n_samples=50):
    """
    Select predictions with highest uncertainty
    """
    uncertain_predictions = []
    
    for pred in predictions:
        # Calculate uncertainty score
        uncertainty = calculate_uncertainty_score(pred)
        
        uncertain_predictions.append({
            'image_id': pred.image_id,
            'landmark_id': pred.landmark_id,
            'uncertainty': uncertainty,
            'confidence': pred.confidence,
            'reason': classify_uncertainty(pred)
        })
    
    # Sort by uncertainty (highest first)
    uncertain_predictions.sort(key=lambda x: x['uncertainty'], reverse=True)
    
    # Return top N
    return uncertain_predictions[:n_samples]

def classify_uncertainty(prediction):
    """Explain why this prediction is uncertain"""
    if prediction.confidence < 0.3:
        return "low_confidence"
    elif has_multiple_peaks(prediction.heatmap):
        return "high_variance"
    elif is_edge_case(prediction):
        return "edge_case"
    else:
        return "disagreement"
```

### 6.2 Review Queue Workflow

```
┌─────────────────────────────────────────────────────────────┐
│              Active Learning Workflow                        │
└─────────────────────────────────────────────────────────────┘

STEP 1: Model makes predictions
├─> U-Net predicts 19 landmarks for 100 images
├─> Calculate uncertainty for each prediction
└─> Score all 1,900 predictions (100 × 19)

STEP 2: Select uncertain samples
├─> Sort by uncertainty score
├─> Select top 50 most uncertain predictions
└─> Add to active_learning_queue table

STEP 3: Prioritize review
├─> User opens "Review Queue" page
├─> System shows most uncertain predictions first
├─> Color-coded by uncertainty:
│   └─> Red: Very uncertain (>0.7)
│   └─> Yellow: Moderately uncertain (0.4-0.7)
│   └─> Green: Slightly uncertain (<0.4)

STEP 4: User reviews
├─> User sees X-ray with AI prediction highlighted
├─> User accepts, rejects, or corrects
├─> Feedback stored in annotation_feedback table
└─> Queue item marked as reviewed

STEP 5: Next iteration
├─> After 50 reviews, retrain model
├─> Model learns from corrections
├─> Uncertainty on these cases decreases
└─> System finds new uncertain cases
```

### 6.3 Benefits of Active Learning

**Without Active Learning:**
- Review all 1,900 predictions randomly
- Many reviews on easy cases (wasted time)
- Slow improvement

**With Active Learning:**
- Review only 50 most uncertain predictions
- Focus effort where model needs help
- Fast improvement on problem areas

**Example:**
- Landmark "Gonion" has 40% acceptance rate (problematic)
- Active learning surfaces all Gonion predictions for review
- After corrections, next model much better at Gonion
- Gonion acceptance rate improves to 85%

---

## 7. Frontend Additions

### 7.1 New Pages

#### **Training Dashboard** (pages/TrainingPage.tsx)

**Features:**
- Start new training run
- View current training progress
- See training history
- Compare model versions
- Deploy new models

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Training Dashboard                               [Start Training]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Current Training Run: train_v2_20260215            │    │
│  │ Status: Running | Epoch: 12/30 | Progress: ████░░  │    │
│  │ Current Loss: 0.0234 | Best mAP: 0.89              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Loss History:                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │     │                                                │    │
│  │ 0.05│ •                                              │    │
│  │     │   •                                            │    │
│  │ 0.03│     •   •                                      │    │
│  │     │       •   •   •   •                            │    │
│  │ 0.01│           •   •   •   •   •   •                │    │
│  │     └────────────────────────────────────────       │    │
│  │       0    5   10  15  20  25  30 (epochs)          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Model Versions:                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ v1.0 | Baseline     | MRE: 2.2mm | Deployed: ✓     │    │
│  │ v1.1 | Fine-tuned   | MRE: 2.0mm | Testing          │    │
│  │ v1.2 | Active Learn | MRE: 1.8mm | Coming soon     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### **Review Queue Page** (pages/ReviewQueuePage.tsx)

**Features:**
- Prioritized list of uncertain predictions
- Inline correction interface
- Quick accept/reject buttons
- Progress tracking

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Review Queue                   Progress: 23/50 (46%)       │
├──────────────┬──────────────────────────────────────────────┤
│  Queue       │                                              │
│  ┌────────┐  │  ┌────────────────────────────────────────┐ │
│  │🔴 Item 1│  │  │  X-ray Image                           │ │
│  │ Gonion │  │  │                                         │ │
│  │ 0.87   │  │  │            •← AI Prediction            │ │
│  └────────┘  │  │         (confidence: 0.32)             │ │
│              │  │                                         │ │
│  ┌────────┐  │  │                                         │ │
│  │🟡 Item 2│  │  └────────────────────────────────────────┘ │
│  │ A-point│  │                                              │
│  │ 0.65   │  │  Reason: Low confidence (0.32)              │
│  └────────┘  │                                              │
│              │  [✓ Accept] [✗ Reject] [✏️ Correct]         │
│  ┌────────┐  │                                              │
│  │🟢 Item 3│  │                                              │
│  │ Nasion │  │                                              │
│  │ 0.44   │  │                                              │
│  └────────┘  │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

#### **Model Comparison Page** (pages/ModelComparisonPage.tsx)

**Features:**
- Side-by-side comparison of two models
- Visual diff of predictions
- Metrics comparison table
- Deployment controls

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Compare Models: v1.0 vs v1.1                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Metrics:                                                    │
│  ┌──────────────────────┬──────────────────────┐           │
│  │ Metric               │ v1.0    │ v1.1       │ Δ         │
│  ├──────────────────────┼─────────┼────────────┼──────────┤
│  │ MRE                  │ 2.2mm   │ 2.0mm      │ -0.2mm ✓ │
│  │ SDR@2mm              │ 68%     │ 75%        │ +7%    ✓ │
│  │ Acceptance Rate      │ 70%     │ 78%        │ +8%    ✓ │
│  │ Avg Review Time      │ 72s     │ 65s        │ -7s    ✓ │
│  └──────────────────────┴─────────┴────────────┴──────────┘
│                                                              │
│  Visual Comparison (Sample Image):                          │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ v1.0 Predictions │  │ v1.1 Predictions │               │
│  │                  │  │                  │               │
│  │   • • •          │  │   • • •          │               │
│  │  •   •  •        │  │  •   •  •        │               │
│  │   •  •  •        │  │   •  •  •        │               │
│  │    •   •         │  │    •   •         │               │
│  │                  │  │                  │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  [Deploy v1.1]  [Run A/B Test]                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Enhanced Components

**Feedback Panel** - Now shows:
- AI model version used
- Confidence score
- Uncertainty indicator
- Contribution to training data

**Annotation Canvas** - New features:
- Uncertainty visualization (red glow around uncertain predictions)
- Model version indicator
- Quick review mode for active learning queue

---

## 8. Migration Guide

### 8.1 Database Migration

**Step 1: Backup Phase 1 Database**
```bash
pg_dump -U postgres cephalometric_db > phase1_backup.sql
```

**Step 2: Run Alembic Migration**
```bash
cd backend
alembic revision --autogenerate -m "Add RLHF tables"
alembic upgrade head
```

**Step 3: Verify New Tables**
```sql
-- Should show 19 tables (was 15)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 8.2 Code Migration

**Changes needed in existing code:**

**1. Model Manager** (5% of ML code)
```python
# Before (Phase 1):
class ModelManager:
    _model = None
    
    @classmethod
    def get_model(cls):
        if cls._model is None:
            cls._model = load_unet_model()
        return cls._model

# After (Phase 2):
class ModelManager:
    _models = {}
    _active_version_id = 1
    
    @classmethod
    def get_model(cls, version_id=None):
        version_id = version_id or cls._active_version_id
        
        if version_id not in cls._models:
            model_path = get_model_path(version_id)
            cls._models[version_id] = load_unet_model(model_path)
        
        return cls._models[version_id]
    
    @classmethod
    def set_active_version(cls, version_id):
        cls._active_version_id = version_id
```

**2. Annotation Service** (minimal changes)
```python
# Just add version_id parameter (optional, backward compatible)
async def create_annotation(
    self,
    data: AnnotationCreate,
    model_version_id: int = None  # ← Add this
):
    annotation = Annotation(**data.dict())
    annotation.model_version_id = model_version_id  # ← Add this
    await self.db.add(annotation)
```

**3. ML Prediction Endpoint** (add version tracking)
```python
# Before:
@router.post("/predict")
async def predict_landmarks(image: UploadFile):
    model = ModelManager.get_model()
    predictions = await model.predict(image)
    return predictions

# After:
@router.post("/predict")
async def predict_landmarks(
    image: UploadFile,
    model_version_id: int = None
):
    model = ModelManager.get_model(model_version_id)
    predictions = await model.predict(image)
    
    # Add version info to predictions
    for pred in predictions:
        pred['model_version_id'] = model_version_id or ModelManager._active_version_id
    
    return predictions
```

### 8.3 Migration Checklist

**Week 15 (Migration Week):**
- [ ] Backup Phase 1 database
- [ ] Run database migrations (add 4 tables, extend 2 tables)
- [ ] Update ModelManager class
- [ ] Add version_id parameters to services (optional)
- [ ] Deploy without enabling RLHF features yet
- [ ] Verify Phase 1 features still work
- [ ] Test backward compatibility

**Week 16 (Enable Phase 2):**
- [ ] Deploy new frontend pages (training, review queue, comparison)
- [ ] Enable training endpoints
- [ ] Run first training iteration
- [ ] Test active learning queue
- [ ] Monitor for issues

---

## 9. Development Roadmap

### Weeks 15-16: Database & Core Infrastructure

**Goals:**
- Migrate database schema
- Update model management
- Deploy foundation for RLHF

**Deliverables:**
- ✅ 4 new database tables
- ✅ Extended annotations table with version tracking
- ✅ ModelManager supports multiple versions
- ✅ Backward compatibility verified

**Tasks:**
- Write Alembic migrations
- Update ModelManager class
- Add version tracking to predictions
- Test Phase 1 features still work
- Deploy to staging environment

---

### Weeks 17-18: Training Pipeline

**Goals:**
- Build training infrastructure
- Implement data preparation
- Test training loop

**Deliverables:**
- ✅ Training service with orchestration
- ✅ Data loader for feedback dataset
- ✅ U-Net fine-tuning trainer
- ✅ Training API endpoints
- ✅ Checkpoint management

**Tasks:**
- Implement `TrainingService`
- Create `CephalometricFeedbackDataset`
- Build `UNetFinetuner` class
- Add training endpoints to API
- Test training on Phase 1 feedback data
- Verify model improvements

**First Training Run:**
- Input: 500 feedback samples from Phase 1
- Epochs: 30
- Duration: ~2 hours on GPU
- Expected: MRE improves from 2.2mm → 2.0mm

---

### Weeks 19-20: Active Learning System

**Goals:**
- Implement uncertainty scoring
- Build review queue
- Test sample selection

**Deliverables:**
- ✅ Uncertainty calculation algorithms
- ✅ Active learning service
- ✅ Review queue database operations
- ✅ API endpoints for queue management

**Tasks:**
- Implement uncertainty scoring
- Create `ActiveLearningService`
- Add queue population logic
- Build review queue API
- Test on predictions from fine-tuned model

---

### Weeks 21-22: Frontend - Training Dashboard

**Goals:**
- Build training UI
- Real-time progress tracking
- Model version management

**Deliverables:**
- ✅ Training dashboard page
- ✅ Training progress visualization
- ✅ Training history table
- ✅ Start training dialog
- ✅ Real-time updates (polling or WebSocket)

**Components:**
- `TrainingPage.tsx`
- `TrainingProgress.tsx`
- `StartTrainingDialog.tsx`
- `TrainingMetricsChart.tsx`
- `TrainingHistoryTable.tsx`

---

### Weeks 23-24: Frontend - Review Queue & Model Comparison

**Goals:**
- Build review queue UI
- Model comparison tools
- Deployment controls

**Deliverables:**
- ✅ Review queue page with prioritized list
- ✅ Inline correction interface
- ✅ Model comparison page
- ✅ Deployment controls
- ✅ A/B testing UI

**Components:**
- `ReviewQueuePage.tsx`
- `ReviewQueueList.tsx`
- `ModelComparisonPage.tsx`
- `ModelMetricsTable.tsx`
- `DeploymentControls.tsx`

---

### Weeks 25-26: A/B Testing & Deployment

**Goals:**
- Implement A/B testing framework
- Safe model deployment
- Rollback capabilities

**Deliverables:**
- ✅ A/B test service
- ✅ Traffic splitting logic
- ✅ Deployment pipeline
- ✅ Rollback functionality
- ✅ Model performance monitoring

**Deployment Strategies:**
- **Blue-Green:** Deploy new model, keep old one for rollback
- **Canary:** Gradually roll out to 10% → 50% → 100% traffic
- **A/B Test:** Run both models on same data, compare results

---

### Weeks 27-28: Integration & Testing

**Goals:**
- End-to-end testing
- Performance optimization
- Bug fixes

**Deliverables:**
- ✅ Complete RLHF loop tested (annotation → feedback → training → deployment)
- ✅ Active learning verified (uncertain samples selected correctly)
- ✅ Model versioning works (deploy, rollback, compare)
- ✅ All Phase 1 features still work
- ✅ Performance optimizations

**Test Scenarios:**
1. Train model on 100 feedback samples
2. Deploy new model version
3. Compare old vs new model
4. Populate review queue with uncertain predictions
5. Review and correct uncertain cases
6. Train again with new corrections
7. Verify continuous improvement

---

### Weeks 29-30: Documentation & Launch

**Goals:**
- Comprehensive documentation
- User training materials
- Production deployment

**Deliverables:**
- ✅ User guide (how to use RLHF features)
- ✅ Developer documentation
- ✅ API documentation updated
- ✅ Training best practices guide
- ✅ Troubleshooting guide
- ✅ Production deployment

**Documentation Topics:**
- How to start training runs
- How to use review queue effectively
- How to compare and deploy models
- How to monitor model performance
- How to rollback if needed

---

## 10. Monitoring & Evaluation

### 10.1 Key Metrics to Track

**Model Performance:**
- Mean Radial Error (MRE) per landmark
- Successful Detection Rate (SDR) @ 2mm, 3mm, 4mm
- Per-landmark accuracy (which landmarks improve most)
- Model confidence calibration

**User Experience:**
- Annotation time per image
- Acceptance rate (% of AI suggestions accepted)
- Correction distance (how far users move predictions)
- Review time in active learning queue

**Training System:**
- Training duration per iteration
- Number of feedback samples used
- Model improvement per iteration
- GPU utilization

**Business Impact:**
- Total time saved vs manual annotation
- Number of X-rays annotated per hour
- Model improvement trend over time

### 10.2 Success Criteria

**Phase 2 is successful if:**
- ✅ MRE improves by 20%+ (2.2mm → 1.8mm or better)
- ✅ User acceptance rate increases to 85%+
- ✅ Annotation time decreases by 25%+
- ✅ Active learning effectively identifies problematic cases
- ✅ Training completes in <4 hours per iteration
- ✅ System can deploy new models without downtime

### 10.3 Monitoring Dashboard

**Real-time Metrics:**
```
┌─────────────────────────────────────────────────────────────┐
│  System Health Dashboard                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Model Performance Trend:                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ MRE  │                                              │    │
│  │ 2.5mm│ •                                            │    │
│  │ 2.0mm│   •                                          │    │
│  │ 1.5mm│     •   •   •                                │    │
│  │ 1.0mm│               •   •   •                      │    │
│  │      └────────────────────────────────────────     │    │
│  │        v1.0 v1.1 v1.2 v1.3 v1.4 v1.5 v1.6          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Current Status:                                             │
│  • Active Model: v1.6                                        │
│  • MRE: 1.5mm (↓33% from baseline)                          │
│  • Acceptance Rate: 89%                                      │
│  • Training Runs: 6 completed                                │
│  • Feedback Collected: 2,347 samples                         │
│                                                              │
│  Training Queue:                                             │
│  • Next Training: Ready (320 new feedback samples)           │
│  • Estimated Improvement: +3% accuracy                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

### Phase 2 Delivers:

✅ **Self-Improving System** - Model gets better with every use  
✅ **Active Learning** - Focus review effort where it matters most  
✅ **Model Versioning** - Track improvements, rollback if needed  
✅ **25-35% Accuracy Improvement** - From ~2.2mm MRE to ~1.5mm MRE  
✅ **Faster Annotation** - 50% time reduction through better predictions  
✅ **Production-Ready** - Safe deployment with A/B testing and rollback  

### Migration Impact:

**95% of Phase 1 code unchanged**
- All existing features continue working
- No breaking API changes
- Backward compatible database schema

**5% modified, 30% new**
- Model management refactored (supports multiple versions)
- New services added (training, active learning)
- New UI pages added (training dashboard, review queue)

### Expected Timeline:

**Weeks 15-30 (16 weeks total)**
- Weeks 15-16: Migration & infrastructure
- Weeks 17-20: Training & active learning backend
- Weeks 21-24: Training & review queue UI
- Weeks 25-26: A/B testing & deployment
- Weeks 27-30: Testing, docs, launch

### Investment vs Return:

**Investment:**
- 16 weeks additional development
- GPU costs (~$200-500/month)
- ~5-10% code changes

**Return:**
- Model improves 25-35% in accuracy
- Annotation time reduces 25-50%
- System keeps improving forever
- Competitive advantage (self-improving AI)

---

## Next Steps After Phase 2

**Phase 3 Ideas (Future):**
- Multi-user collaboration
- Real-time annotations
- Integration with PACS systems
- Automated measurement calculations (SNA, SNB, ANB angles)
- Report generation
- Cloud deployment
- Mobile app
- Advanced segmentation (not just landmarks)

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Ready for Implementation

**Prerequisites:**
- Phase 1 complete
- 100+ annotated X-rays
- 500+ feedback samples collected
- PostgreSQL database operational

---

*This document is designed to be printed as a PDF and used as a high-level reference during Phase 2 development.*
