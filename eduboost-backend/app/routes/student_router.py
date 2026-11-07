from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.security import hash_password
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/students", tags=["Students"])


# 🔐 GET ALL STUDENTS → ADMIN
@router.get("/")
def get_students(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    students = db.query(models.Student, models.User)\
        .join(models.User, models.User.id == models.Student.id)\
        .offset(skip)\
        .limit(limit)\
        .all()

    data = [
        {
            "id": student.id,
            "username": user.username,
            "email": user.email,
            "progress": student.progress,
            "risk": student.risk
        }
        for student, user in students
    ]

    return {
        "message": "Students fetched successfully",
        "data": data
    }


# 🔐 GET CURRENT USER
@router.get("/me")
def get_me(
    current_user=Depends(get_current_user)
):

    return {
        "message": "Current user fetched successfully",
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "type": current_user.type
        }
    }


# 🔐 UPDATE STUDENT → SELF ONLY
@router.put("/{student_id}")
def update_student(
    student_id: int,
    student: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.id != student_id:
        raise HTTPException(403, "Access denied")

    user = db.query(models.User)\
        .filter(models.User.id == student_id)\
        .first()

    student_db = db.query(models.Student)\
        .filter(models.Student.id == student_id)\
        .first()

    if not user or not student_db:
        raise HTTPException(404, "Student not found")

    # update user only
    user.username = student.username
    user.email = student.email
    user.password = hash_password(student.password)

    db.commit()
    db.refresh(user)

    return {
        "message": "Student updated successfully",
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }


# 🔐 DELETE STUDENT → ADMIN
@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    student = db.query(models.Student)\
        .filter(models.Student.id == student_id)\
        .first()

    user = db.query(models.User)\
        .filter(models.User.id == student_id)\
        .first()

    if not student or not user:
        raise HTTPException(404, "Student not found")

    db.delete(student)
    db.delete(user)

    db.commit()

    return {
        "message": "Student deleted successfully"
    }


# 🔐 ENROLL COURSE
@router.post("/enroll/{course_id}")
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.type != "student":
        raise HTTPException(403, "Only students allowed")

    # verify course exists
    course = db.query(models.Course)\
        .filter(models.Course.id == course_id)\
        .first()

    if not course:
        raise HTTPException(404, "Course not found")

    # verify enrollment
    existing = db.query(models.Enrollment)\
        .filter(
            models.Enrollment.student_id == current_user.id,
            models.Enrollment.course_id == course_id
        )\
        .first()

    if existing:
        raise HTTPException(400, "Already enrolled")

    enrollment = models.Enrollment(
        student_id=current_user.id,
        course_id=course_id
    )

    db.add(enrollment)
    db.commit()

    return {
        "message": "Enrolled successfully"
    }


# 🔐 GET ACTIVITIES
@router.get("/me/activities")
def get_my_activities(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    activities = db.query(models.Activity)\
        .filter(models.Activity.student_id == current_user.id)\
        .order_by(models.Activity.id.desc())\
        .limit(10)\
        .all()

    data = [
        {
            "id": a.id,
            "action": a.action,
            "timestamp": a.timestamp
        }
        for a in activities
    ]

    return {
        "message": "Activities fetched successfully",
        "data": data
    }


# 🔐 DASHBOARD
@router.get("/me/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.type != "student":
        raise HTTPException(403, "Only students")

    quizzes_taken = db.query(models.QuizResult)\
        .filter(models.QuizResult.student_id == current_user.id)\
        .count()

    results = db.query(models.QuizResult)\
        .filter(models.QuizResult.student_id == current_user.id)\
        .all()

    avg_score = (
        sum(r.score for r in results) / len(results)
        if results else 0
    )

    progress = db.query(models.Progress)\
        .filter(models.Progress.student_id == current_user.id)\
        .all()

    total_progress = (
        sum(p.score for p in progress)
        if progress else 0
    )

    courses = db.query(models.Enrollment)\
        .filter(models.Enrollment.student_id == current_user.id)\
        .count()

    return {
        "message": "Dashboard fetched successfully",
        "data": {
            "quizzes_taken": quizzes_taken,
            "average_score": avg_score,
            "total_progress": total_progress,
            "courses_enrolled": courses
        }
    }


# 🔐 FULL HISTORY
@router.get("/me/full-history")
def get_full_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.type != "student":
        raise HTTPException(403, "Only students")

    # quiz history
    results = db.query(models.QuizResult)\
        .filter(models.QuizResult.student_id == current_user.id)\
        .all()

    quiz_history = [
        {
            "quiz_id": r.quiz_id,
            "score": r.score,
            "errors": r.errors
        }
        for r in results
    ]

    # activities
    activities = db.query(models.Activity)\
        .filter(models.Activity.student_id == current_user.id)\
        .all()

    activity_list = [
        {
            "action": a.action,
            "timestamp": a.timestamp
        }
        for a in activities
    ]

    # progress
    progress = db.query(models.Progress)\
        .filter(models.Progress.student_id == current_user.id)\
        .all()

    progress_list = [
        {
            "score": p.score,
            "time": p.time
        }
        for p in progress
    ]

    return {
    "message": "History fetched successfully",
    "data": {
        "quiz_history": quiz_history,
        "activities": activity_list,
        "progress": progress_list
    }
}
