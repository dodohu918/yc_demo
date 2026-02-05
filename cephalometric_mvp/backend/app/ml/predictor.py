"""
Landmark prediction using U-Net model.
"""
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from app.core.config import get_settings
from app.ml.device import get_device

settings = get_settings()

# Image preprocessing constants
INPUT_SIZE = (512, 512)  # Model input size
NUM_LANDMARKS = 19


class LandmarkPredictor:
    """
    Predicts cephalometric landmarks using a trained U-Net model.

    The model outputs 19 heatmaps (one per landmark), and we extract
    the peak location from each heatmap as the predicted coordinate.
    """

    def __init__(self, model_path: Optional[Path] = None):
        """
        Initialize the predictor.

        Args:
            model_path: Path to the trained model weights. If None, uses default.
        """
        self.device = get_device()
        self.model = None
        self.model_version = "none"
        self._is_loaded = False

        # Try to load model
        if model_path is None:
            model_path = settings.model_path / "unet_landmarks.pth"

        if model_path.exists():
            self._load_model(model_path)

    def _load_model(self, model_path: Path) -> None:
        """Load the trained model weights."""
        try:
            import segmentation_models_pytorch as smp

            # Create model architecture
            self.model = smp.Unet(
                encoder_name="resnet34",
                encoder_weights=None,  # We'll load our own weights
                in_channels=1,  # Grayscale X-ray
                classes=NUM_LANDMARKS,  # 19 landmark heatmaps
            )

            # Load weights
            state_dict = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.model.to(self.device)
            self.model.eval()

            self._is_loaded = True
            self.model_version = model_path.name
            print(f"Model loaded from {model_path} on {self.device}")

        except Exception as e:
            print(f"Failed to load model: {e}")
            self._is_loaded = False

    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded and ready."""
        return self._is_loaded

    def preprocess(self, image_path: str) -> Tuple[torch.Tensor, Tuple[int, int]]:
        """
        Preprocess image for model input.

        Args:
            image_path: Path to the image file.

        Returns:
            Tuple of (preprocessed tensor, original size)
        """
        # Load image
        img = Image.open(image_path)
        original_size = img.size  # (width, height)

        # Convert to grayscale if needed
        if img.mode != "L":
            img = img.convert("L")

        # Resize to model input size
        img = img.resize(INPUT_SIZE, Image.Resampling.LANCZOS)

        # Convert to tensor and normalize
        img_array = np.array(img, dtype=np.float32) / 255.0
        tensor = torch.from_numpy(img_array).unsqueeze(0).unsqueeze(0)  # [1, 1, H, W]

        return tensor.to(self.device), original_size

    def heatmap_to_coordinates(
        self,
        heatmaps: torch.Tensor,
        original_size: Tuple[int, int],
    ) -> Dict[int, Tuple[float, float, float]]:
        """
        Extract coordinates from heatmaps.

        Args:
            heatmaps: Model output [1, 19, H, W]
            original_size: Original image size (width, height)

        Returns:
            Dict mapping landmark_id to (x, y, confidence)
        """
        # Apply sigmoid to get probabilities
        heatmaps = torch.sigmoid(heatmaps)

        # Get dimensions
        _, num_landmarks, h, w = heatmaps.shape
        orig_w, orig_h = original_size

        results = {}
        for i in range(num_landmarks):
            heatmap = heatmaps[0, i]  # [H, W]

            # Find peak location
            max_val = heatmap.max().item()
            max_idx = heatmap.argmax().item()
            y_pred = max_idx // w
            x_pred = max_idx % w

            # Scale to original image size
            x_orig = (x_pred / w) * orig_w
            y_orig = (y_pred / h) * orig_h

            # Landmark IDs are 1-indexed
            results[i + 1] = (x_orig, y_orig, max_val)

        return results

    def predict(self, image_path: str) -> Dict[int, Tuple[float, float, float]]:
        """
        Predict landmarks for an image.

        Args:
            image_path: Path to the image file.

        Returns:
            Dict mapping landmark_id (1-19) to (x, y, confidence)
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")

        # Preprocess
        tensor, original_size = self.preprocess(image_path)

        # Run inference
        with torch.no_grad():
            heatmaps = self.model(tensor)

        # Convert heatmaps to coordinates
        predictions = self.heatmap_to_coordinates(heatmaps, original_size)

        return predictions

    def predict_batch(
        self, image_paths: list
    ) -> Dict[str, Dict[int, Tuple[float, float, float]]]:
        """
        Predict landmarks for multiple images.

        Args:
            image_paths: List of image file paths.

        Returns:
            Dict mapping image_path to predictions
        """
        results = {}
        for path in image_paths:
            results[path] = self.predict(path)
        return results
