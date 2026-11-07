from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/courses", tags=["Courses"])


# 🔐 CREATE COURSE → ADMIN
@router.post("/")
def create_course(
    course: schemas.CourseCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    new_course = models.Course(
        title=course.title,
        difficulty=course.difficulty,
        price=course.price
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return {
        "message": "Course created successfully",
        "data": new_course
    }


# 🔍 SEARCH COURSES
@router.get("/search")
def search_courses(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):

    courses = db.query(models.Course)\
        .filter(
            models.Course.title.ilike(f"%{query}%") |
            models.Course.difficulty.ilike(f"%{query}%")
        )\
        .all()

    return {
        "message": "Search completed",
        "data": courses
    }


# 🔐 GET MY COURSES
@router.get("/me/courses")
def get_my_courses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.type != "student":
        raise HTTPException(403, "Only students")

    courses = db.query(models.Course)\
        .join(
            models.Enrollment,
            models.Course.id == models.Enrollment.course_id
        )\
        .filter(
            models.Enrollment.student_id == current_user.id
        )\
        .all()

    return {
        "message": "Student courses fetched",
        "data": courses
    }


# 🔐 GET ALL COURSES
@router.get("/")
def get_courses(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    courses = db.query(models.Course)\
        .offset(skip)\
        .limit(limit)\
        .all()

    return {
        "message": "Courses fetched successfully",
        "data": courses
    }


# 🔐 GET COURSE CHAPTERS
@router.get("/{course_id}/chapters")
def get_course_chapters(
    course_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    course = db.query(models.Course)\
        .filter(models.Course.id == course_id)\
        .first()

    if not course:
        raise HTTPException(404, "Course not found")

    chapters = db.query(models.Chapter)\
        .filter(models.Chapter.course_id == course_id)\
        .all()

    return {
        "message": "Chapters fetched successfully",
        "data": chapters
    }


# 🔐 UPDATE COURSE → ADMIN
@router.put("/{course_id}")
def update_course(
    course_id: int,
    course: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    course_db = db.query(models.Course)\
        .filter(models.Course.id == course_id)\
        .first()

    if not course_db:
        raise HTTPException(404, "Course not found")

    course_db.title = course.title
    course_db.difficulty = course.difficulty
    course_db.price = course.price

    db.commit()
    db.refresh(course_db)

    return {
        "message": "Course updated successfully",
        "data": course_db
    }


# 🔐 DELETE COURSE → ADMIN
@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    course = db.query(models.Course)\
        .filter(models.Course.id == course_id)\
        .first()

    if not course:
        raise HTTPException(404, "Course not found")

    db.delete(course)
    db.commit()

    return {
        "message": "Course deleted successfully"
    }