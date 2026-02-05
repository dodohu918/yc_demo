"""
Dataset export API endpoints.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.dataset_export import DatasetExporter

router = APIRouter()


class ExportRequest(BaseModel):
    """Request body for dataset export."""
    image_ids: Optional[List[UUID]] = Field(
        None, description="Specific image IDs to export (optional)"
    )
    format: str = Field(
        "csv",
        pattern="^(csv|json|coco)$",
        description="Export format: csv, json, or coco"
    )
    split: bool = Field(
        True, description="Whether to split into train/val/test"
    )
    train_ratio: float = Field(
        0.70, ge=0, le=1, description="Training set ratio"
    )
    val_ratio: float = Field(
        0.15, ge=0, le=1, description="Validation set ratio"
    )
    test_ratio: float = Field(
        0.15, ge=0, le=1, description="Test set ratio"
    )
    min_annotations: int = Field(
        19, ge=1, le=19, description="Minimum annotations required per image"
    )
    seed: int = Field(
        42, description="Random seed for reproducible splits"
    )
    include_images: bool = Field(
        False, description="Include image files in ZIP export"
    )


class ExportMetadata(BaseModel):
    """Metadata about the export."""
    success: bool
    format: str
    num_images: int
    num_landmarks: int
    exported_at: str
    split: Optional[dict] = None


class ExportPreviewResponse(BaseModel):
    """Response for export preview (without files)."""
    metadata: ExportMetadata
    sample_data: Optional[str] = None


@router.post("/export", response_class=Response)
async def export_dataset(
    request: ExportRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Export annotated dataset as a ZIP file.

    Returns a ZIP file containing:
    - metadata.json: Export metadata
    - annotations_train.{csv|json}: Training set annotations
    - annotations_val.{csv|json}: Validation set annotations
    - annotations_test.{csv|json}: Test set annotations
    - images/: (optional) Image files if include_images=True
    """
    exporter = DatasetExporter(db)

    try:
        zip_bytes = await exporter.export_as_zip(
            format=request.format,
            image_ids=request.image_ids,
            split=request.split,
            train_ratio=request.train_ratio,
            val_ratio=request.val_ratio,
            test_ratio=request.test_ratio,
            min_annotations=request.min_annotations,
            seed=request.seed,
            include_images=request.include_images,
        )

        filename = f"cephalometric_dataset_{request.format}.zip"
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.post("/export/preview", response_model=ExportPreviewResponse)
async def preview_export(
    request: ExportRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Preview export metadata without generating full export.

    Useful for checking how many images are available and how they'll be split.
    """
    exporter = DatasetExporter(db)

    result = await exporter.export_dataset(
        format=request.format,
        image_ids=request.image_ids,
        split=request.split,
        train_ratio=request.train_ratio,
        val_ratio=request.val_ratio,
        test_ratio=request.test_ratio,
        min_annotations=request.min_annotations,
        seed=request.seed,
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Export failed"))

    # Get sample of first file
    sample_data = None
    if result.get("files"):
        first_file = list(result["files"].values())[0]
        # Truncate for preview
        lines = first_file.split("\n")[:10]
        sample_data = "\n".join(lines) + ("\n..." if len(first_file.split("\n")) > 10 else "")

    return ExportPreviewResponse(
        metadata=ExportMetadata(
            success=result["success"],
            format=result["format"],
            num_images=result["num_images"],
            num_landmarks=result["num_landmarks"],
            exported_at=result["exported_at"],
            split=result.get("split"),
        ),
        sample_data=sample_data,
    )


@router.get("/stats")
async def get_dataset_stats(
    db: AsyncSession = Depends(get_db),
):
    """
    Get statistics about annotated images in the database.

    Returns counts of images by annotation completeness.
    """
    exporter = DatasetExporter(db)

    # Get all images (no minimum)
    all_images = await exporter.get_annotated_images(min_annotations=0)

    # Count by completeness
    fully_annotated = sum(1 for img in all_images if len(img["annotations"]) >= 19)
    partially_annotated = sum(1 for img in all_images if 0 < len(img["annotations"]) < 19)
    not_annotated = sum(1 for img in all_images if len(img["annotations"]) == 0)

    # Distribution of annotation counts
    annotation_counts = {}
    for img in all_images:
        count = len(img["annotations"])
        annotation_counts[count] = annotation_counts.get(count, 0) + 1

    return {
        "total_images": len(all_images),
        "fully_annotated": fully_annotated,
        "partially_annotated": partially_annotated,
        "not_annotated": not_annotated,
        "ready_for_export": fully_annotated,
        "annotation_distribution": dict(sorted(annotation_counts.items())),
    }
