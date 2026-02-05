"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import init_db
from .routers import projects, diarization, speakers, segments, export, audio

app = FastAPI(
    title="YouTube Diarization API",
    description="API for YouTube video diarization with speaker identification",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(diarization.router, prefix="/api/diarization", tags=["diarization"])
app.include_router(speakers.router, prefix="/api/projects", tags=["speakers"])
app.include_router(segments.router, prefix="/api/projects", tags=["segments"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])


@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    init_db()


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
