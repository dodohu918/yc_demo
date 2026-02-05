"""
Cephalometric MVP - FastAPI Application
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.db.session import engine, Base, async_session_maker
from app.db.seed import seed_landmarks, seed_demo_images
from app.api.endpoints import images, landmarks, annotations, projects, predictions, datasets

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    # Startup
    print("Starting up Cephalometric MVP...")
    print(f"Upload directory: {settings.upload_path}")
    print(f"Model directory: {settings.model_path}")
    print(f"Database URL: {settings.async_database_url}")

    # Create upload directory if it doesn't exist
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    settings.model_path.mkdir(parents=True, exist_ok=True)

    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")

    # Seed landmarks and demo images on startup
    async with async_session_maker() as session:
        await seed_landmarks(session)
        await seed_demo_images(session)

    yield

    # Shutdown
    print("Shutting down...")
    await engine.dispose()


app = FastAPI(
    title="Cephalometric MVP API",
    description="AI-assisted cephalometric landmark detection and annotation platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
settings.upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_path)), name="uploads")

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(images.router, prefix="/api/images", tags=["Images"])
app.include_router(landmarks.router, prefix="/api/landmarks", tags=["Landmarks"])
app.include_router(annotations.router, prefix="/api/annotations", tags=["Annotations"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Cephalometric MVP API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
