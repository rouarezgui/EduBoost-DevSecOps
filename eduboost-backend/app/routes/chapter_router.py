from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/chapters", tags=["Chapters"])


# 🔐 CREATE CHAPTER → ADMIN
@router.post("/")
def create_chapter(
    chapter: schemas.ChapterCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    new_chapter = models.Chapter(
        title=chapter.title,
        content=chapter.content,
        course_id=chapter.course_id
    )

    db.add(new_chapter)
    db.commit()
    db.refresh(new_chapter)

    return {
        "message": "Chapter created successfully",
        "data": new_chapter
    }


# 🔐 GET ALL CHAPTERS
@router.get("/")
def get_chapters(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    chapters = db.query(models.Chapter)\
        .offset(skip)\
        .limit(limit)\
        .all()

    return {
        "message": "Chapters fetched successfully",
        "data": chapters
    }


# 🔐 GET QUIZZES OF CHAPTER
@router.get("/{chapter_id}/quiz")
def get_chapter_quiz(
    chapter_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    chapter = db.query(models.Chapter)\
        .filter(models.Chapter.id == chapter_id)\
        .first()

    if not chapter:
        raise HTTPException(404, "Chapter not found")

    quizzes = db.query(models.Quiz)\
        .filter(models.Quiz.chapter_id == chapter_id)\
        .all()

    return {
        "message": "Quizzes fetched successfully",
        "data": quizzes
    }


# 🔐 GET VIDEOS OF CHAPTER
@router.get("/{chapter_id}/videos")
def get_chapter_videos(
    chapter_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    chapter = db.query(models.Chapter)\
        .filter(models.Chapter.id == chapter_id)\
        .first()

    if not chapter:
        raise HTTPException(404, "Chapter not found")

    videos = db.query(models.Video)\
        .filter(models.Video.chapter_id == chapter_id)\
        .order_by(models.Video.order)\
        .all()

    return {
        "message": "Videos fetched successfully",
        "data": videos
    }


# 🔐 UPDATE CHAPTER → ADMIN
@router.put("/{chapter_id}")
def update_chapter(
    chapter_id: int,
    chapter: schemas.ChapterUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    chapter_db = db.query(models.Chapter)\
        .filter(models.Chapter.id == chapter_id)\
        .first()

    if not chapter_db:
        raise HTTPException(404, "Chapter not found")

    chapter_db.title = chapter.title
    chapter_db.content = chapter.content
    chapter_db.course_id = chapter.course_id

    db.commit()
    db.refresh(chapter_db)

    return {
        "message": "Chapter updated successfully",
        "data": chapter_db
    }


# 🔐 DELETE CHAPTER → ADMIN
@router.delete("/{chapter_id}")
def delete_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    chapter = db.query(models.Chapter)\
        .filter(models.Chapter.id == chapter_id)\
        .first()

    if not chapter:
        raise HTTPException(404, "Chapter not found")

    db.delete(chapter)
    db.commit()

    return {
        "message": "Chapter deleted successfully"
    }