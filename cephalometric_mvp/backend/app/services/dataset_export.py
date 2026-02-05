"""
Dataset export service for exporting annotations in various formats.
Supports CSV, JSON, and COCO formats with train/val/test splitting.
"""
import csv
import io
import json
import random
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Annotation, Image, Landmark


class DatasetExporter:
    """Service for exporting annotated datasets."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_landmarks(self) -> Dict[int, Dict]:
        """Get all landmarks as a dictionary."""
        result = await self.session.execute(select(Landmark).order_by(Landmark.id))
        landmarks = result.scalars().all()
        return {
            lm.id: {
                "id": lm.id,
                "abbreviation": lm.abbreviation,
                "name": lm.name,
                "description": lm.description,
            }
            for lm in landmarks
        }

    async def get_annotated_images(
        self,
        image_ids: Optional[List[UUID]] = None,
        min_annotations: int = 19,
    ) -> List[Dict]:
        """
        Get images with their annotations.

        Args:
            image_ids: Optional list of specific image IDs to include
            min_annotations: Minimum number of annotations required (default 19 = all landmarks)

        Returns:
            List of image data with annotations
        """
        query = select(Image).options(
            selectinload(Image.annotations).selectinload(Annotation.landmark)
        )

        if image_ids:
            query = query.where(Image.id.in_(image_ids))

        result = await self.session.execute(query)
        images = result.scalars().all()

        # Filter images with sufficient annotations
        annotated_images = []
        for img in images:
            if len(img.annotations) >= min_annotations:
                annotations_dict = {}
                for ann in img.annotations:
                    annotations_dict[ann.landmark_id] = {
                        "x": ann.x,
                        "y": ann.y,
                        "confidence": ann.confidence,
                        "source": ann.source.value if ann.source else "manual",
                    }

                annotated_images.append({
                    "id": str(img.id),
                    "filename": img.filename,
                    "original_filename": img.original_filename,
                    "file_path": img.file_path,
                    "width": img.width,
                    "height": img.height,
                    "annotations": annotations_dict,
                })

        return annotated_images

    def split_dataset(
        self,
        images: List[Dict],
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        seed: int = 42,
    ) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Split images into train/val/test sets.

        Args:
            images: List of image data
            train_ratio: Proportion for training (default 0.70)
            val_ratio: Proportion for validation (default 0.15)
            test_ratio: Proportion for testing (default 0.15)
            seed: Random seed for reproducibility

        Returns:
            Tuple of (train_images, val_images, test_images)
        """
        random.seed(seed)
        shuffled = images.copy()
        random.shuffle(shuffled)

        n_total = len(shuffled)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)

        train_set = shuffled[:n_train]
        val_set = shuffled[n_train:n_train + n_val]
        test_set = shuffled[n_train + n_val:]

        return train_set, val_set, test_set

    def export_csv(
        self,
        images: List[Dict],
        landmarks: Dict[int, Dict],
    ) -> str:
        """
        Export annotations in CSV format.

        Format: filename,1_x,1_y,2_x,2_y,...,19_x,19_y

        Returns:
            CSV string
        """
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        header = ["filename"]
        for i in range(1, 20):
            lm = landmarks.get(i, {})
            abbr = lm.get("abbreviation", f"L{i}")
            header.extend([f"{abbr}_x", f"{abbr}_y"])
        writer.writerow(header)

        # Data rows
        for img in images:
            row = [img["original_filename"]]
            for i in range(1, 20):
                ann = img["annotations"].get(i, {})
                row.extend([
                    ann.get("x", ""),
                    ann.get("y", ""),
                ])
            writer.writerow(row)

        return output.getvalue()

    def export_json(
        self,
        images: List[Dict],
        landmarks: Dict[int, Dict],
    ) -> str:
        """
        Export annotations in JSON format.

        Returns:
            JSON string
        """
        export_data = {
            "version": "1.0",
            "exported_at": datetime.utcnow().isoformat(),
            "num_images": len(images),
            "num_landmarks": len(landmarks),
            "landmarks": landmarks,
            "images": [],
        }

        for img in images:
            image_data = {
                "id": img["id"],
                "filename": img["original_filename"],
                "width": img["width"],
                "height": img["height"],
                "annotations": [],
            }

            for lm_id, ann in img["annotations"].items():
                lm_info = landmarks.get(lm_id, {})
                image_data["annotations"].append({
                    "landmark_id": lm_id,
                    "abbreviation": lm_info.get("abbreviation", f"L{lm_id}"),
                    "name": lm_info.get("name", f"Landmark {lm_id}"),
                    "x": ann["x"],
                    "y": ann["y"],
                    "confidence": ann.get("confidence"),
                    "source": ann.get("source", "manual"),
                })

            export_data["images"].append(image_data)

        return json.dumps(export_data, indent=2)

    def export_coco(
        self,
        images: List[Dict],
        landmarks: Dict[int, Dict],
    ) -> str:
        """
        Export annotations in COCO keypoint format.

        Returns:
            JSON string in COCO format
        """
        # Build category with keypoints
        keypoint_names = [
            landmarks.get(i, {}).get("abbreviation", f"L{i}")
            for i in range(1, 20)
        ]

        coco_data = {
            "info": {
                "description": "Cephalometric Landmark Dataset",
                "version": "1.0",
                "year": datetime.utcnow().year,
                "date_created": datetime.utcnow().isoformat(),
            },
            "licenses": [],
            "categories": [
                {
                    "id": 1,
                    "name": "cephalogram",
                    "supercategory": "medical",
                    "keypoints": keypoint_names,
                    "skeleton": [],  # Could add connections between landmarks
                }
            ],
            "images": [],
            "annotations": [],
        }

        annotation_id = 1
        for idx, img in enumerate(images):
            # Image entry
            coco_data["images"].append({
                "id": idx + 1,
                "file_name": img["original_filename"],
                "width": img["width"],
                "height": img["height"],
            })

            # Keypoints: [x1, y1, v1, x2, y2, v2, ...]
            # v = 0: not labeled, 1: labeled but not visible, 2: labeled and visible
            keypoints = []
            num_keypoints = 0

            for i in range(1, 20):
                ann = img["annotations"].get(i)
                if ann:
                    keypoints.extend([ann["x"], ann["y"], 2])
                    num_keypoints += 1
                else:
                    keypoints.extend([0, 0, 0])

            # Annotation entry
            coco_data["annotations"].append({
                "id": annotation_id,
                "image_id": idx + 1,
                "category_id": 1,
                "keypoints": keypoints,
                "num_keypoints": num_keypoints,
                "iscrowd": 0,
            })
            annotation_id += 1

        return json.dumps(coco_data, indent=2)

    async def export_dataset(
        self,
        format: str = "csv",
        image_ids: Optional[List[UUID]] = None,
        split: bool = True,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        min_annotations: int = 19,
        seed: int = 42,
    ) -> Dict:
        """
        Export dataset with optional train/val/test split.

        Args:
            format: Export format ('csv', 'json', 'coco')
            image_ids: Optional specific image IDs to export
            split: Whether to split into train/val/test
            train_ratio: Proportion for training
            val_ratio: Proportion for validation
            test_ratio: Proportion for testing
            min_annotations: Minimum annotations required per image
            seed: Random seed for splitting

        Returns:
            Dictionary with export data and metadata
        """
        landmarks = await self.get_landmarks()
        images = await self.get_annotated_images(image_ids, min_annotations)

        if not images:
            return {
                "success": False,
                "error": "No fully annotated images found",
                "num_images": 0,
            }

        # Choose export function
        export_fn = {
            "csv": self.export_csv,
            "json": self.export_json,
            "coco": self.export_coco,
        }.get(format, self.export_csv)

        result = {
            "success": True,
            "format": format,
            "num_images": len(images),
            "num_landmarks": len(landmarks),
            "exported_at": datetime.utcnow().isoformat(),
        }

        if split and len(images) >= 3:
            train_set, val_set, test_set = self.split_dataset(
                images, train_ratio, val_ratio, test_ratio, seed
            )

            result["split"] = {
                "train": len(train_set),
                "val": len(val_set),
                "test": len(test_set),
            }

            result["files"] = {
                "train": export_fn(train_set, landmarks),
                "val": export_fn(val_set, landmarks),
                "test": export_fn(test_set, landmarks),
            }
        else:
            result["split"] = None
            result["files"] = {
                "all": export_fn(images, landmarks),
            }

        return result

    async def export_as_zip(
        self,
        format: str = "csv",
        image_ids: Optional[List[UUID]] = None,
        include_images: bool = False,
        **kwargs,
    ) -> bytes:
        """
        Export dataset as a ZIP file.

        Args:
            format: Export format ('csv', 'json', 'coco')
            image_ids: Optional specific image IDs
            include_images: Whether to include image files in ZIP
            **kwargs: Additional arguments for export_dataset

        Returns:
            ZIP file bytes
        """
        export_result = await self.export_dataset(format, image_ids, **kwargs)

        if not export_result.get("success"):
            raise ValueError(export_result.get("error", "Export failed"))

        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            # Add metadata
            metadata = {
                k: v for k, v in export_result.items()
                if k not in ["files"]
            }
            zf.writestr("metadata.json", json.dumps(metadata, indent=2))

            # Add data files
            ext = "json" if format in ["json", "coco"] else "csv"
            for name, content in export_result["files"].items():
                filename = f"annotations_{name}.{ext}"
                zf.writestr(filename, content)

            # Optionally include images
            if include_images:
                images = await self.get_annotated_images(image_ids)
                for img in images:
                    img_path = Path(img["file_path"])
                    if img_path.exists():
                        zf.write(img_path, f"images/{img['original_filename']}")

        zip_buffer.seek(0)
        return zip_buffer.getvalue()
