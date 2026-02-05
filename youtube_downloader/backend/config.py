"""Configuration settings for the backend."""
import os
from pathlib import Path

# Load .env file
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from project root
load_dotenv(BASE_DIR / ".env")

# Database
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DATABASE_URL = f"sqlite:///{DATA_DIR}/diarization.db"

# Downloads directory
DOWNLOADS_DIR = BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Hugging Face token
HF_TOKEN = os.environ.get("HF_TOKEN")

# CORS origins - can be overridden with CORS_ORIGINS env var (comma-separated)
_cors_env = os.environ.get("CORS_ORIGINS")
if _cors_env:
    CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",")]
else:
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "https://dodohu918.github.io",
    ]
