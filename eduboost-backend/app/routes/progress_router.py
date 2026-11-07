from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/progress", tags=["Progress"])


# 🔐 CREATE PROGRESS
@router.post("/")
def create_progress(
    progress: schemas.ProgressCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.id != progress.student_id:
        raise HTTPException(403, "Not allowed")

    new_progress = models.Progress(
        score=progress.score,
        time=progress.time,
        student_id=progress.student_id
    )

    db.add(new_progress)
    db.commit()
    db.refresh(new_progress)

    return {
        "message": "Progress created successfully",
        "data": new_progress
    }


# 🔐 GET ALL PROGRESS → ADMIN
@router.get("/")
def get_progress(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    progress = db.query(models.Progress)\
        .offset(skip)\
        .limit(limit)\
        .all()

    return {
        "message": "Progress fetched successfully",
        "data": progress
    }


# 🔐 GET MY PROGRESS
@router.get("/me")
def get_my_progress(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    progress = db.query(models.Progress)\
        .filter(models.Progress.student_id == current_user.id)\
        .all()

    return {
        "message": "My progress fetched successfully",
        "data": progress
    }


# 🔐 GET STUDENT PROGRESS
@router.get("/{student_id}/progress")
def get_student_progress(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.id != student_id and current_user.type != "admin":
        raise HTTPException(403, "Access denied")

    student = db.query(models.Student)\
        .filter(models.Student.id == student_id)\
        .first()

    if not student:
        raise HTTPException(404, "Student not found")

    progress = db.query(models.Progress)\
        .filter(models.Progress.student_id == student_id)\
        .all()

    return {
        "message": "Student progress fetched successfully",
        "data": progress
    }


# 🔐 UPDATE PROGRESS
@router.put("/{progress_id}")
def update_progress(
    progress_id: int,
    data: schemas.ProgressUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    progress_db = db.query(models.Progress)\
        .filter(models.Progress.id == progress_id)\
        .first()

    if not progress_db:
        raise HTTPException(404, "Progress not found")

    if progress_db.student_id != current_user.id:
        raise HTTPException(403, "Not allowed")

    progress_db.score = data.score
    progress_db.time = data.time

    db.commit()
    db.refresh(progress_db)

    return {
        "message": "Progress updated successfully",
        "data": progress_db
    }


# 🔐 DELETE PROGRESS → ADMIN
@router.delete("/{progress_id}")
def delete_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    progress = db.query(models.Progress)\
        .filter(models.Progress.id == progress_id)\
        .first()

    if not progress:
        raise HTTPException(404, "Progress not found")

    db.delete(progress)
    db.commit()

    return {
        "message": "Progress deleted successfully"
    }