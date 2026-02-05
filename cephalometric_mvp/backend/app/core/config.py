"""
Application configuration loaded from environment variables.
"""
import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# Project root directory (parent of backend/)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=("settings_",),  # Allow model_ prefix for our fields
    )

    # Database - Default to SQLite for demo, can override with DATABASE_URL env var
    database_url: str | None = None  # Optional override (e.g., for PostgreSQL)

    # Application
    secret_key: str = "dev-secret-key-change-in-production"
    debug: bool = True
    allowed_origins: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5175,http://localhost:3000"
    )

    # File Storage (relative paths will be resolved to absolute)
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 50

    # ML Model (disabled in demo mode)
    model_dir: str = "./models"
    force_device: str | None = None
    demo_mode: bool = True  # Set to False to enable ML model

    @property
    def upload_path(self) -> Path:
        """Get absolute upload directory path."""
        p = Path(self.upload_dir)
        if not p.is_absolute():
            p = PROJECT_ROOT / p
        return p

    @property
    def model_path(self) -> Path:
        """Get absolute model directory path."""
        p = Path(self.model_dir)
        if not p.is_absolute():
            p = PROJECT_ROOT / p
        return p

    @property
    def data_path(self) -> Path:
        """Get absolute data directory path for SQLite."""
        p = PROJECT_ROOT / "data"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def async_database_url(self) -> str:
        """Construct async database URL for SQLAlchemy."""
        if self.database_url:
            # Convert to async if override provided
            url = self.database_url
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+asyncpg://", 1)
            if url.startswith("sqlite://"):
                return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
            return url
        # Default to SQLite for demo
        return f"sqlite+aiosqlite:///{self.data_path}/cephalometric.db"

    @property
    def sync_database_url(self) -> str:
        """Construct sync database URL for Alembic migrations."""
        if self.database_url:
            url = self.database_url
            if "+asyncpg" in url:
                return url.replace("+asyncpg", "", 1)
            if "+aiosqlite" in url:
                return url.replace("+aiosqlite", "", 1)
            return url
        # Default to SQLite for demo
        return f"sqlite:///{self.data_path}/cephalometric.db"

    @property
    def cors_origins(self) -> List[str]:
        """Parse allowed origins into list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
