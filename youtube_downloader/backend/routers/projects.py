"""Projects router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Project, Speaker, Segment
from ..schemas import ProjectResponse, ProjectListResponse

router = APIRouter()


@router.get("", response_model=ProjectListResponse)
async def list_projects(db: Session = Depends(get_db)):
    """List all projects."""
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return ProjectListResponse(projects=projects)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get a single project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@router.delete("")
async def delete_all_projects(db: Session = Depends(get_db)):
    """Fresh Start - delete all projects."""
    db.query(Segment).delete()
    db.query(Speaker).delete()
    db.query(Project).delete()
    db.commit()
    return {"message": "All projects deleted"}
