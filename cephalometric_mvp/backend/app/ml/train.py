"""
U-Net Training Script for Cephalometric Landmark Detection.

Usage:
    cd backend
    python -m app.ml.train
    python -m app.ml.train --evaluate
    python -m app.ml.train --epochs 100 --batch-size 8

This will:
1. Load images and annotations from the archive folder
2. Split data into train/val/test (70/15/15)
3. Apply data augmentation during training
4. Train a U-Net model with ResNet34 encoder
5. Log metrics to training_logs/ directory
6. Save the trained model to models/unet_landmarks.pth
"""
import csv
import json
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image, ImageEnhance
from tqdm import tqdm

# Add parent to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.config import get_settings, PROJECT_ROOT
from app.ml.device import get_device, get_device_info

settings = get_settings()

# Training constants (defaults, can be overridden via CLI)
INPUT_SIZE = (512, 512)
NUM_LANDMARKS = 19
HEATMAP_SIGMA = 5.0  # Gaussian sigma for heatmap generation
BATCH_SIZE = 4
NUM_EPOCHS = 50
LEARNING_RATE = 1e-4
TRAIN_SPLIT = 0.70
VAL_SPLIT = 0.15
TEST_SPLIT = 0.15
RANDOM_SEED = 42

# Augmentation parameters
AUGMENTATION_CONFIG = {
    "rotation_range": 10,        # degrees
    "scale_range": (0.9, 1.1),   # min/max scale factor
    "brightness_range": (0.85, 1.15),  # min/max brightness factor
    "contrast_range": (0.85, 1.15),    # min/max contrast factor
    "horizontal_flip_prob": 0.5,
}


class CephalometricDataset(Dataset):
    """Dataset for cephalometric images with landmark annotations."""

    def __init__(
        self,
        image_dir: Path,
        annotations: Dict[str, List[Tuple[float, float]]],
        input_size: Tuple[int, int] = INPUT_SIZE,
        sigma: float = HEATMAP_SIGMA,
        augment: bool = False,
        augment_config: Optional[Dict] = None,
    ):
        """
        Args:
            image_dir: Directory containing images
            annotations: Dict mapping filename to list of (x, y) coordinates
            input_size: Target size for images (width, height)
            sigma: Gaussian sigma for heatmap generation
            augment: Whether to apply data augmentation
            augment_config: Augmentation configuration dict
        """
        self.image_dir = image_dir
        self.annotations = annotations
        self.image_files = list(annotations.keys())
        self.input_size = input_size
        self.sigma = sigma
        self.augment = augment
        self.augment_config = augment_config or AUGMENTATION_CONFIG

    def __len__(self) -> int:
        return len(self.image_files)

    def _generate_heatmap(
        self,
        x: float,
        y: float,
        width: int,
        height: int,
    ) -> np.ndarray:
        """Generate a Gaussian heatmap centered at (x, y)."""
        xx, yy = np.meshgrid(np.arange(width), np.arange(height))
        heatmap = np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * self.sigma ** 2))
        return heatmap.astype(np.float32)

    def _apply_augmentation(
        self,
        img: Image.Image,
        landmarks: List[Tuple[float, float]],
        orig_w: int,
        orig_h: int,
    ) -> Tuple[Image.Image, List[Tuple[float, float]]]:
        """Apply random augmentations to image and adjust landmark coordinates."""
        cfg = self.augment_config
        new_landmarks = list(landmarks)

        # Random rotation
        if cfg.get("rotation_range", 0) > 0:
            angle = random.uniform(-cfg["rotation_range"], cfg["rotation_range"])
            img = img.rotate(angle, resample=Image.Resampling.BILINEAR, expand=False)
            # Rotate landmarks around image center
            cx, cy = orig_w / 2, orig_h / 2
            rad = np.radians(-angle)  # negative because PIL rotates counter-clockwise
            cos_a, sin_a = np.cos(rad), np.sin(rad)
            rotated = []
            for x, y in new_landmarks:
                rx = cos_a * (x - cx) - sin_a * (y - cy) + cx
                ry = sin_a * (x - cx) + cos_a * (y - cy) + cy
                rotated.append((rx, ry))
            new_landmarks = rotated

        # Random scaling
        scale_range = cfg.get("scale_range", (1.0, 1.0))
        if scale_range != (1.0, 1.0):
            scale = random.uniform(*scale_range)
            new_w, new_h = int(orig_w * scale), int(orig_h * scale)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            # Crop or pad to original size
            if scale > 1.0:
                # Crop from center
                left = (new_w - orig_w) // 2
                top = (new_h - orig_h) // 2
                img = img.crop((left, top, left + orig_w, top + orig_h))
                new_landmarks = [(x * scale - left, y * scale - top) for x, y in new_landmarks]
            else:
                # Pad to center
                padded = Image.new("L", (orig_w, orig_h), 0)
                left = (orig_w - new_w) // 2
                top = (orig_h - new_h) // 2
                padded.paste(img, (left, top))
                img = padded
                new_landmarks = [(x * scale + left, y * scale + top) for x, y in new_landmarks]

        # Random brightness
        brightness_range = cfg.get("brightness_range", (1.0, 1.0))
        if brightness_range != (1.0, 1.0):
            factor = random.uniform(*brightness_range)
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(factor)

        # Random contrast
        contrast_range = cfg.get("contrast_range", (1.0, 1.0))
        if contrast_range != (1.0, 1.0):
            factor = random.uniform(*contrast_range)
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(factor)

        # Horizontal flip
        if random.random() < cfg.get("horizontal_flip_prob", 0):
            img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            new_landmarks = [(orig_w - x, y) for x, y in new_landmarks]

        # Clamp landmarks to image bounds
        new_landmarks = [
            (max(0, min(orig_w - 1, x)), max(0, min(orig_h - 1, y)))
            for x, y in new_landmarks
        ]

        return img, new_landmarks

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        filename = self.image_files[idx]
        image_path = self.image_dir / filename

        # Load and preprocess image
        img = Image.open(image_path)
        orig_w, orig_h = img.size

        # Convert to grayscale
        if img.mode != "L":
            img = img.convert("L")

        # Get landmarks
        landmarks = list(self.annotations[filename])

        # Apply augmentation if enabled
        if self.augment:
            img, landmarks = self._apply_augmentation(img, landmarks, orig_w, orig_h)

        # Resize
        img = img.resize(self.input_size, Image.Resampling.LANCZOS)
        img_array = np.array(img, dtype=np.float32) / 255.0

        # Generate heatmaps for all landmarks
        heatmaps = []
        for x, y in landmarks:
            # Scale coordinates to new size
            x_scaled = x * self.input_size[0] / orig_w
            y_scaled = y * self.input_size[1] / orig_h
            heatmap = self._generate_heatmap(
                x_scaled, y_scaled,
                self.input_size[0], self.input_size[1]
            )
            heatmaps.append(heatmap)

        # Convert to tensors
        img_tensor = torch.from_numpy(img_array).unsqueeze(0)  # [1, H, W]
        heatmaps_tensor = torch.from_numpy(np.stack(heatmaps))  # [19, H, W]

        return img_tensor, heatmaps_tensor


def load_annotations(csv_path: Path, image_dir: Path) -> Dict[str, List[Tuple[float, float]]]:
    """Load annotations from CSV file."""
    annotations = {}

    with open(csv_path, "r") as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header

        for row in reader:
            image_name = row[0]
            # Check if image exists
            if not (image_dir / image_name).exists():
                print(f"Warning: Image not found: {image_name}")
                continue

            # Parse coordinates (1_x, 1_y, 2_x, 2_y, ..., 19_x, 19_y)
            landmarks = []
            for i in range(NUM_LANDMARKS):
                x = float(row[1 + i * 2])
                y = float(row[2 + i * 2])
                landmarks.append((x, y))

            annotations[image_name] = landmarks

    return annotations


def split_annotations(
    annotations: Dict[str, List[Tuple[float, float]]],
    train_ratio: float = TRAIN_SPLIT,
    val_ratio: float = VAL_SPLIT,
    seed: int = RANDOM_SEED,
) -> Tuple[Dict, Dict, Dict]:
    """Split annotations into train/val/test sets."""
    random.seed(seed)
    np.random.seed(seed)

    keys = list(annotations.keys())
    random.shuffle(keys)

    n_total = len(keys)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    train_keys = keys[:n_train]
    val_keys = keys[n_train:n_train + n_val]
    test_keys = keys[n_train + n_val:]

    train_ann = {k: annotations[k] for k in train_keys}
    val_ann = {k: annotations[k] for k in val_keys}
    test_ann = {k: annotations[k] for k in test_keys}

    return train_ann, val_ann, test_ann


class TrainingLogger:
    """Logger for training metrics."""

    def __init__(self, log_dir: Path):
        self.log_dir = log_dir
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.log_dir / f"training_{self.run_id}.json"
        self.metrics = {
            "config": {},
            "epochs": [],
            "best_epoch": None,
            "best_val_loss": None,
            "final_metrics": {},
        }

    def log_config(self, config: Dict):
        """Log training configuration."""
        self.metrics["config"] = config
        self._save()

    def log_epoch(
        self,
        epoch: int,
        train_loss: float,
        val_loss: Optional[float] = None,
        learning_rate: float = None,
        landmark_errors: Optional[Dict[int, float]] = None,
    ):
        """Log metrics for an epoch."""
        epoch_data = {
            "epoch": epoch,
            "train_loss": train_loss,
            "val_loss": val_loss,
            "learning_rate": learning_rate,
            "landmark_errors": landmark_errors,
            "timestamp": datetime.now().isoformat(),
        }
        self.metrics["epochs"].append(epoch_data)

        # Track best
        if val_loss is not None:
            if self.metrics["best_val_loss"] is None or val_loss < self.metrics["best_val_loss"]:
                self.metrics["best_val_loss"] = val_loss
                self.metrics["best_epoch"] = epoch

        self._save()

    def log_final_metrics(self, metrics: Dict):
        """Log final evaluation metrics."""
        self.metrics["final_metrics"] = metrics
        self._save()

    def _save(self):
        """Save metrics to JSON file."""
        with open(self.log_file, "w") as f:
            json.dump(self.metrics, f, indent=2)

    def print_summary(self):
        """Print training summary."""
        print("\n" + "=" * 60)
        print("TRAINING SUMMARY")
        print("=" * 60)
        print(f"Log file: {self.log_file}")
        print(f"Best epoch: {self.metrics['best_epoch']}")
        print(f"Best val loss: {self.metrics['best_val_loss']:.6f}")
        if self.metrics["final_metrics"]:
            print("\nFinal Evaluation Metrics:")
            for key, value in self.metrics["final_metrics"].items():
                print(f"  {key}: {value}")


def train_model(
    epochs: int = NUM_EPOCHS,
    batch_size: int = BATCH_SIZE,
    learning_rate: float = LEARNING_RATE,
    augment: bool = True,
    use_combined_data: bool = True,
):
    """
    Main training function.

    Args:
        epochs: Number of training epochs
        batch_size: Batch size for training
        learning_rate: Initial learning rate
        augment: Whether to apply data augmentation
        use_combined_data: If True, combine all CSV files and do 70/15/15 split.
                          If False, use train_senior.csv for train and test1_senior.csv for validation.
    """
    print("=" * 60)
    print("Cephalometric Landmark Detection - U-Net Training")
    print("=" * 60)

    # Device setup
    device = get_device()
    device_info = get_device_info()
    print(f"\nDevice: {device}")
    for key, value in device_info.items():
        print(f"  {key}: {value}")

    # Paths
    archive_dir = PROJECT_ROOT / "archive"
    image_dir = archive_dir / "cepha400" / "cepha400"
    train_csv = archive_dir / "train_senior.csv"
    test1_csv = archive_dir / "test1_senior.csv"
    test2_csv = archive_dir / "test2_senior.csv"
    model_save_path = settings.model_path / "unet_landmarks.pth"
    log_dir = PROJECT_ROOT / "training_logs"

    print(f"\nData paths:")
    print(f"  Images: {image_dir}")
    print(f"  Model output: {model_save_path}")
    print(f"  Log directory: {log_dir}")

    # Check paths exist
    if not image_dir.exists():
        raise FileNotFoundError(f"Image directory not found: {image_dir}")
    if not train_csv.exists():
        raise FileNotFoundError(f"Train CSV not found: {train_csv}")

    # Initialize logger
    logger = TrainingLogger(log_dir)

    # Load annotations
    print("\nLoading annotations...")
    if use_combined_data:
        # Combine all available CSV files and do 70/15/15 split
        all_annotations = {}
        for csv_file in [train_csv, test1_csv, test2_csv]:
            if csv_file.exists():
                ann = load_annotations(csv_file, image_dir)
                all_annotations.update(ann)
                print(f"  Loaded {len(ann)} images from {csv_file.name}")

        print(f"  Total images: {len(all_annotations)}")

        # Split into train/val/test
        train_annotations, val_annotations, test_annotations = split_annotations(all_annotations)
        print(f"\n  Train/Val/Test split ({TRAIN_SPLIT:.0%}/{VAL_SPLIT:.0%}/{TEST_SPLIT:.0%}):")
        print(f"    Training: {len(train_annotations)}")
        print(f"    Validation: {len(val_annotations)}")
        print(f"    Test: {len(test_annotations)}")
    else:
        # Use original file-based split
        train_annotations = load_annotations(train_csv, image_dir)
        print(f"  Training images: {len(train_annotations)}")

        if test1_csv.exists():
            val_annotations = load_annotations(test1_csv, image_dir)
            print(f"  Validation images: {len(val_annotations)}")
        else:
            val_annotations = {}

        test_annotations = {}

    # Log configuration
    config = {
        "epochs": epochs,
        "batch_size": batch_size,
        "learning_rate": learning_rate,
        "input_size": INPUT_SIZE,
        "num_landmarks": NUM_LANDMARKS,
        "heatmap_sigma": HEATMAP_SIGMA,
        "augmentation_enabled": augment,
        "augmentation_config": AUGMENTATION_CONFIG if augment else None,
        "train_images": len(train_annotations),
        "val_images": len(val_annotations),
        "test_images": len(test_annotations),
        "device": str(device),
        "use_combined_data": use_combined_data,
    }
    logger.log_config(config)

    # Create datasets (with augmentation for training only)
    train_dataset = CephalometricDataset(
        image_dir, train_annotations, augment=augment
    )
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,  # MPS doesn't work well with multiprocessing
        pin_memory=False,
    )

    if val_annotations:
        val_dataset = CephalometricDataset(image_dir, val_annotations, augment=False)
        val_loader = DataLoader(
            val_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=0,
        )
    else:
        val_loader = None

    # Create model
    print("\nCreating U-Net model...")
    try:
        import segmentation_models_pytorch as smp
    except ImportError:
        print("Installing segmentation-models-pytorch...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "segmentation-models-pytorch"])
        import segmentation_models_pytorch as smp

    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights="imagenet",
        in_channels=1,
        classes=NUM_LANDMARKS,
    )
    model = model.to(device)
    print(f"  Encoder: ResNet34 (ImageNet pretrained)")
    print(f"  Input channels: 1 (grayscale)")
    print(f"  Output channels: {NUM_LANDMARKS} (landmark heatmaps)")
    print(f"  Augmentation: {'Enabled' if augment else 'Disabled'}")

    # Loss and optimizer
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5
    )

    # Training loop
    print(f"\nTraining for {epochs} epochs...")
    print(f"  Batch size: {batch_size}")
    print(f"  Learning rate: {learning_rate}")
    print("-" * 60)

    best_loss = float("inf")

    for epoch in range(epochs):
        # Training
        model.train()
        train_loss = 0.0

        progress = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}")
        for images, heatmaps in progress:
            images = images.to(device)
            heatmaps = heatmaps.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, heatmaps)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            progress.set_postfix({"loss": f"{loss.item():.6f}"})

        train_loss /= len(train_loader)
        current_lr = optimizer.param_groups[0]["lr"]

        # Validation
        if val_loader:
            model.eval()
            val_loss = 0.0
            with torch.no_grad():
                for images, heatmaps in val_loader:
                    images = images.to(device)
                    heatmaps = heatmaps.to(device)
                    outputs = model(images)
                    loss = criterion(outputs, heatmaps)
                    val_loss += loss.item()
            val_loss /= len(val_loader)

            print(f"Epoch {epoch+1}: Train Loss = {train_loss:.6f}, Val Loss = {val_loss:.6f}, LR = {current_lr:.2e}")
            scheduler.step(val_loss)

            # Log metrics
            logger.log_epoch(epoch + 1, train_loss, val_loss, current_lr)

            # Save best model
            if val_loss < best_loss:
                best_loss = val_loss
                settings.model_path.mkdir(parents=True, exist_ok=True)
                torch.save(model.state_dict(), model_save_path)
                print(f"  -> Saved best model (val_loss: {val_loss:.6f})")
        else:
            print(f"Epoch {epoch+1}: Train Loss = {train_loss:.6f}, LR = {current_lr:.2e}")
            scheduler.step(train_loss)

            # Log metrics
            logger.log_epoch(epoch + 1, train_loss, learning_rate=current_lr)

            # Save best model based on train loss
            if train_loss < best_loss:
                best_loss = train_loss
                settings.model_path.mkdir(parents=True, exist_ok=True)
                torch.save(model.state_dict(), model_save_path)
                print(f"  -> Saved best model (train_loss: {train_loss:.6f})")

    print("-" * 60)
    print(f"Training complete!")
    print(f"Best model saved to: {model_save_path}")
    print(f"Best loss: {best_loss:.6f}")
    logger.print_summary()

    return model_save_path, logger


def evaluate_model(
    model_path: Path = None,
    logger: TrainingLogger = None,
    use_test_split: bool = True,
) -> Dict:
    """
    Evaluate trained model and compute metrics.

    Args:
        model_path: Path to model checkpoint
        logger: Optional logger to record metrics
        use_test_split: If True, use test2_senior.csv; if False, use test1_senior.csv

    Returns:
        Dictionary of evaluation metrics
    """
    if model_path is None:
        model_path = settings.model_path / "unet_landmarks.pth"

    if not model_path.exists():
        print(f"Model not found: {model_path}")
        return {}

    device = get_device()

    # Load model
    import segmentation_models_pytorch as smp
    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights=None,
        in_channels=1,
        classes=NUM_LANDMARKS,
    )
    model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
    model = model.to(device)
    model.eval()

    # Load test data
    archive_dir = PROJECT_ROOT / "archive"
    image_dir = archive_dir / "cepha400" / "cepha400"

    # Use test2 for final evaluation if available, otherwise test1
    test_csv = archive_dir / ("test2_senior.csv" if use_test_split else "test1_senior.csv")
    if not test_csv.exists():
        test_csv = archive_dir / "test1_senior.csv"

    test_annotations = load_annotations(test_csv, image_dir)
    test_dataset = CephalometricDataset(image_dir, test_annotations, augment=False)

    print(f"\nEvaluating on {len(test_dataset)} test images from {test_csv.name}...")

    # Compute per-landmark and overall errors
    landmark_errors = {i: [] for i in range(NUM_LANDMARKS)}
    total_errors = []

    # Landmark names for reporting
    landmark_names = [
        "S (Sella)", "N (Nasion)", "Or (Orbitale)", "Po (Porion)",
        "A (Subspinale)", "B (Supramentale)", "Pog (Pogonion)", "Gn (Gnathion)",
        "Me (Menton)", "Go (Gonion)", "ANS", "PNS",
        "U1 (Upper Incisor)", "U1R (Upper Incisor Root)",
        "L1 (Lower Incisor)", "L1R (Lower Incisor Root)",
        "U6 (Upper Molar)", "L6 (Lower Molar)", "Ar (Articulare)"
    ]

    with torch.no_grad():
        for idx in tqdm(range(len(test_dataset)), desc="Evaluating"):
            img_tensor, gt_heatmaps = test_dataset[idx]
            img_tensor = img_tensor.unsqueeze(0).to(device)

            # Predict
            pred_heatmaps = model(img_tensor)
            pred_heatmaps = torch.sigmoid(pred_heatmaps)

            # Extract coordinates from heatmaps
            for i in range(NUM_LANDMARKS):
                # Ground truth
                gt_hm = gt_heatmaps[i].numpy()
                gt_y, gt_x = np.unravel_index(gt_hm.argmax(), gt_hm.shape)

                # Prediction
                pred_hm = pred_heatmaps[0, i].cpu().numpy()
                pred_y, pred_x = np.unravel_index(pred_hm.argmax(), pred_hm.shape)

                # Euclidean distance
                error = np.sqrt((pred_x - gt_x) ** 2 + (pred_y - gt_y) ** 2)
                landmark_errors[i].append(error)
                total_errors.append(error)

    # Compute metrics
    mre = np.mean(total_errors)
    std = np.std(total_errors)

    # Per-landmark MRE
    per_landmark_mre = {i: np.mean(errors) for i, errors in landmark_errors.items()}

    # SDR at different thresholds
    sdr = {}
    for threshold in [2, 4, 10, 20]:
        sdr[f"sdr_{threshold}px"] = np.mean(np.array(total_errors) < threshold) * 100

    # Print results
    print(f"\n{'=' * 60}")
    print(f"EVALUATION RESULTS (on {INPUT_SIZE[0]}x{INPUT_SIZE[1]} images)")
    print(f"{'=' * 60}")
    print(f"\nOverall Metrics:")
    print(f"  Mean Radial Error (MRE): {mre:.2f} +/- {std:.2f} pixels")
    for threshold, value in sdr.items():
        print(f"  SDR @ {threshold.split('_')[1]}: {value:.1f}%")

    print(f"\nPer-Landmark MRE (pixels):")
    print("-" * 45)
    for i in range(NUM_LANDMARKS):
        name = landmark_names[i] if i < len(landmark_names) else f"Landmark {i+1}"
        mre_i = per_landmark_mre[i]
        bar = "*" * int(mre_i)
        print(f"  {i+1:2d}. {name:25s}: {mre_i:5.2f} {bar}")

    # Find best/worst landmarks
    sorted_landmarks = sorted(per_landmark_mre.items(), key=lambda x: x[1])
    print(f"\nBest landmarks:")
    for i, (idx, err) in enumerate(sorted_landmarks[:3]):
        name = landmark_names[idx] if idx < len(landmark_names) else f"Landmark {idx+1}"
        print(f"  {i+1}. {name}: {err:.2f}px")

    print(f"\nWorst landmarks:")
    for i, (idx, err) in enumerate(sorted_landmarks[-3:]):
        name = landmark_names[idx] if idx < len(landmark_names) else f"Landmark {idx+1}"
        print(f"  {i+1}. {name}: {err:.2f}px")

    # Compile metrics dictionary
    metrics = {
        "mre": float(mre),
        "std": float(std),
        **{k: float(v) for k, v in sdr.items()},
        "per_landmark_mre": {str(k): float(v) for k, v in per_landmark_mre.items()},
        "test_images": len(test_dataset),
        "test_file": test_csv.name,
    }

    # Log to logger if provided
    if logger:
        logger.log_final_metrics(metrics)

    return metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train U-Net for landmark detection")
    parser.add_argument("--evaluate", action="store_true", help="Only evaluate existing model")
    parser.add_argument("--epochs", type=int, default=NUM_EPOCHS, help=f"Number of epochs (default: {NUM_EPOCHS})")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help=f"Batch size (default: {BATCH_SIZE})")
    parser.add_argument("--lr", type=float, default=LEARNING_RATE, help=f"Learning rate (default: {LEARNING_RATE})")
    parser.add_argument("--no-augment", action="store_true", help="Disable data augmentation")
    parser.add_argument("--no-combine", action="store_true", help="Don't combine CSV files, use original split")
    args = parser.parse_args()

    if args.evaluate:
        evaluate_model()
    else:
        model_path, logger = train_model(
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr,
            augment=not args.no_augment,
            use_combined_data=not args.no_combine,
        )
        print("\nRunning evaluation on test set...")
        evaluate_model(model_path, logger=logger, use_test_split=True)
