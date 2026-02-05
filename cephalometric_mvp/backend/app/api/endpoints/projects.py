"""
Projects API endpoints.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Project, get_db
from app.schemas.schemas import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter()


@router.get("", response_model=List[ProjectResponse])
async def get_projects(db: AsyncSession = Depends(get_db)):
    """Get all projects."""
    result = await db.execute(
        select(Project).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return projects


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    project: ProjectCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new project."""
    db_project = Project(
        name=project.name,
        description=project.description,
    )
    db.add(db_project)
    await db.flush()
    await db.refresh(db_project)
    return db_project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_update: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.flush()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)
