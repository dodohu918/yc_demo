"""
Device detection for PyTorch - supports CUDA, MPS (Apple Silicon), and CPU.
"""
import torch

from app.core.config import get_settings

settings = get_settings()


def get_device() -> torch.device:
    """
    Get the best available device for PyTorch inference.

    Priority:
    1. Forced device from settings (if set)
    2. CUDA (NVIDIA GPU) - for AWS/Linux servers
    3. MPS (Apple Silicon M1/M2/M3/M4) - for Mac development
    4. CPU (fallback)
    """
    # Check if device is forced in settings
    if settings.force_device:
        device_name = settings.force_device.lower()
        if device_name == "cuda" and torch.cuda.is_available():
            return torch.device("cuda")
        elif device_name == "mps" and torch.backends.mps.is_available():
            return torch.device("mps")
        else:
            return torch.device("cpu")

    # Auto-detect best available device
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif torch.backends.mps.is_available():
        return torch.device("mps")
    else:
        return torch.device("cpu")


def get_device_info() -> dict:
    """Get information about available compute devices."""
    info = {
        "selected_device": str(get_device()),
        "cuda_available": torch.cuda.is_available(),
        "mps_available": torch.backends.mps.is_available(),
        "cpu_available": True,
    }

    if torch.cuda.is_available():
        info["cuda_device_name"] = torch.cuda.get_device_name(0)
        info["cuda_device_count"] = torch.cuda.device_count()

    return info
