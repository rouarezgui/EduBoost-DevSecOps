from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/videos", tags=["Videos"])


# 🔐 CREATE VIDEO → ADMIN
@router.post("/")
def create_video(
    video: schemas.VideoCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    # verify chapter exists
    chapter = db.query(models.Chapter)\
        .filter(models.Chapter.id == video.chapter_id)\
        .first()

    if not chapter:
        raise HTTPException(404, "Chapter not found")

    new_video = models.Video(
        title=video.title,
        url=video.url,
        duration=video.duration,
        order=video.order,
        chapter_id=video.chapter_id
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    return {
        "message": "Video created successfully",
        "data": new_video
    }


# 🔐 GET ALL VIDEOS
@router.get("/")
def get_videos(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    videos = db.query(models.Video)\
        .offset(skip)\
        .limit(limit)\
        .all()

    return {
        "message": "Videos fetched successfully",
        "data": videos
    }


# 🔐 GET VIDEO BY ID
@router.get("/{video_id}")
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    video = db.query(models.Video)\
        .filter(models.Video.id == video_id)\
        .first()

    if not video:
        raise HTTPException(404, "Video not found")

    return {
        "message": "Video fetched successfully",
        "data": video
    }


# 🔐 UPDATE VIDEO → ADMIN
@router.put("/{video_id}")
def update_video(
    video_id: int,
    data: schemas.VideoCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    video = db.query(models.Video)\
        .filter(models.Video.id == video_id)\
        .first()

    if not video:
        raise HTTPException(404, "Video not found")

    chapter = db.query(models.Chapter)\
        .filter(models.Chapter.id == data.chapter_id)\
        .first()

    if not chapter:
        raise HTTPException(404, "Chapter not found")

    video.title = data.title
    video.url = data.url
    video.duration = data.duration
    video.order = data.order
    video.chapter_id = data.chapter_id

    db.commit()
    db.refresh(video)

    return {
        "message": "Video updated successfully",
        "data": video
    }


# 🔐 DELETE VIDEO → ADMIN
@router.delete("/{video_id}")
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    video = db.query(models.Video)\
        .filter(models.Video.id == video_id)\
        .first()

    if not video:
        raise HTTPException(404, "Video not found")

    db.delete(video)
    db.commit()

    return {
        "message": "Video deleted successfully"
    }