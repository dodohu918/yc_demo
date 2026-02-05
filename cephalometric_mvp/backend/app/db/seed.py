"""
Seed data for the 19 standard cephalometric landmarks and demo images.
"""
import os
import shutil
import uuid
from pathlib import Path

from PIL import Image as PILImage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Landmark, Image
from app.core.config import get_settings

# 19 Standard Cephalometric Landmarks (matching CSV column order)
LANDMARKS = [
    {
        "id": 1,
        "abbreviation": "S",
        "name": "Sella",
        "description": "Center of the pituitary fossa (sella turcica)",
        "display_order": 1,
    },
    {
        "id": 2,
        "abbreviation": "N",
        "name": "Nasion",
        "description": "Most anterior point of the frontonasal suture",
        "display_order": 2,
    },
    {
        "id": 3,
        "abbreviation": "Or",
        "name": "Orbitale",
        "description": "Most inferior point on the infraorbital margin",
        "display_order": 3,
    },
    {
        "id": 4,
        "abbreviation": "Po",
        "name": "Porion",
        "description": "Most superior point of the external auditory meatus",
        "display_order": 4,
    },
    {
        "id": 5,
        "abbreviation": "A",
        "name": "A Point (Subspinale)",
        "description": "Deepest point on the anterior contour of the maxilla",
        "display_order": 5,
    },
    {
        "id": 6,
        "abbreviation": "B",
        "name": "B Point (Supramentale)",
        "description": "Deepest point on the anterior contour of the mandibular symphysis",
        "display_order": 6,
    },
    {
        "id": 7,
        "abbreviation": "Pog",
        "name": "Pogonion",
        "description": "Most anterior point on the chin",
        "display_order": 7,
    },
    {
        "id": 8,
        "abbreviation": "Gn",
        "name": "Gnathion",
        "description": "Most anterior-inferior point on the chin",
        "display_order": 8,
    },
    {
        "id": 9,
        "abbreviation": "Me",
        "name": "Menton",
        "description": "Most inferior point on the mandibular symphysis",
        "display_order": 9,
    },
    {
        "id": 10,
        "abbreviation": "Go",
        "name": "Gonion",
        "description": "Most posterior-inferior point on the mandibular angle",
        "display_order": 10,
    },
    {
        "id": 11,
        "abbreviation": "ANS",
        "name": "Anterior Nasal Spine",
        "description": "Tip of the anterior nasal spine",
        "display_order": 11,
    },
    {
        "id": 12,
        "abbreviation": "PNS",
        "name": "Posterior Nasal Spine",
        "description": "Most posterior point of the hard palate",
        "display_order": 12,
    },
    {
        "id": 13,
        "abbreviation": "U1",
        "name": "Upper Incisor Tip",
        "description": "Incisal edge of the most prominent upper central incisor",
        "display_order": 13,
    },
    {
        "id": 14,
        "abbreviation": "U1R",
        "name": "Upper Incisor Root",
        "description": "Root apex of the upper central incisor",
        "display_order": 14,
    },
    {
        "id": 15,
        "abbreviation": "L1",
        "name": "Lower Incisor Tip",
        "description": "Incisal edge of the most prominent lower central incisor",
        "display_order": 15,
    },
    {
        "id": 16,
        "abbreviation": "L1R",
        "name": "Lower Incisor Root",
        "description": "Root apex of the lower central incisor",
        "display_order": 16,
    },
    {
        "id": 17,
        "abbreviation": "U6",
        "name": "Upper Molar",
        "description": "Mesiobuccal cusp tip of the upper first molar",
        "display_order": 17,
    },
    {
        "id": 18,
        "abbreviation": "L6",
        "name": "Lower Molar",
        "description": "Mesiobuccal cusp tip of the lower first molar",
        "display_order": 18,
    },
    {
        "id": 19,
        "abbreviation": "Ar",
        "name": "Articulare",
        "description": "Intersection of posterior border of ramus and inferior border of cranial base",
        "display_order": 19,
    },
]


async def seed_landmarks(session: AsyncSession) -> None:
    """Insert the 19 standard landmarks if they don't exist."""
    # Check if landmarks already exist
    result = await session.execute(select(Landmark).limit(1))
    if result.scalar_one_or_none() is not None:
        print("Landmarks already seeded, skipping...")
        return

    for landmark_data in LANDMARKS:
        landmark = Landmark(**landmark_data)
        session.add(landmark)

    await session.commit()
    print(f"Seeded {len(LANDMARKS)} cephalometric landmarks.")


def get_landmark_by_index(index: int) -> dict:
    """Get landmark data by 1-based index (matching CSV columns)."""
    if 1 <= index <= len(LANDMARKS):
        return LANDMARKS[index - 1]
    raise ValueError(f"Invalid landmark index: {index}. Must be 1-19.")


# Demo images to seed
DEMO_IMAGES = [
    {"filename": "demo_xray_1.jpg", "original_name": "Cephalometric X-ray Sample 1"},
    {"filename": "demo_xray_2.jpg", "original_name": "Cephalometric X-ray Sample 2"},
]


async def seed_demo_images(session: AsyncSession) -> None:
    """Seed demo images if they don't exist."""
    settings = get_settings()

    # Check if demo images already exist
    result = await session.execute(select(Image).limit(1))
    if result.scalar_one_or_none() is not None:
        print("Images already exist, skipping demo image seeding...")
        return

    # Find demo images directory (relative to this file)
    demo_images_dir = Path(__file__).parent.parent.parent / "demo_images"
    if not demo_images_dir.exists():
        print(f"Demo images directory not found: {demo_images_dir}")
        return

    # Ensure upload directory exists
    settings.upload_path.mkdir(parents=True, exist_ok=True)

    for demo_img in DEMO_IMAGES:
        src_path = demo_images_dir / demo_img["filename"]
        if not src_path.exists():
            print(f"Demo image not found: {src_path}")
            continue

        # Generate unique filename
        image_id = uuid.uuid4()
        dest_filename = f"{image_id}.jpg"
        dest_path = settings.upload_path / dest_filename

        # Copy image to uploads directory
        shutil.copy(src_path, dest_path)

        # Get image dimensions
        with PILImage.open(dest_path) as img:
            width, height = img.size

        # Create database entry
        image = Image(
            id=image_id,
            filename=dest_filename,
            original_filename=demo_img["original_name"],
            file_path=str(dest_path),
            file_size=dest_path.stat().st_size,
            width=width,
            height=height,
            mime_type="image/jpeg",
        )
        session.add(image)
        print(f"Seeded demo image: {demo_img['original_name']}")

    await session.commit()
    print(f"Seeded {len(DEMO_IMAGES)} demo images.")
