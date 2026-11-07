from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/quiz-results", tags=["Quiz Results"])


# 🔐 CREATE QUIZ RESULT
@router.post("/")
def create_result(
    result: schemas.QuizResultCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.id != result.student_id:
        raise HTTPException(
            403,
            "You can only create your own result"
        )

    quiz = db.query(models.Quiz)\
        .filter(models.Quiz.id == result.quiz_id)\
        .first()

    if not quiz:
        raise HTTPException(404, "Quiz not found")

    new_result = models.QuizResult(
        score=result.score,
        errors=result.errors,
        student_id=result.student_id,
        quiz_id=result.quiz_id
    )

    db.add(new_result)
    db.commit()
    db.refresh(new_result)

    return {
        "message": "Quiz result created successfully",
        "data": new_result
    }


# 🔐 GET ALL RESULTS → ADMIN
@router.get("/")
def get_results(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    results = db.query(models.QuizResult)\
        .offset(skip)\
        .limit(limit)\
        .all()

    return {
        "message": "Quiz results fetched successfully",
        "data": results
    }


# 🔐 GET MY RESULTS
@router.get("/me")
def get_my_results(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    results = db.query(models.QuizResult)\
        .filter(models.QuizResult.student_id == current_user.id)\
        .all()

    return {
        "message": "My quiz results fetched successfully",
        "data": results
    }


# 🔐 UPDATE QUIZ RESULT
@router.put("/{result_id}")
def update_result(
    result_id: int,
    data: schemas.QuizResultUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result_db = db.query(models.QuizResult)\
        .filter(models.QuizResult.id == result_id)\
        .first()

    if not result_db:
        raise HTTPException(404, "Result not found")

    if result_db.student_id != current_user.id:
        raise HTTPException(403, "Not allowed")

    result_db.score = data.score
    result_db.errors = data.errors

    db.commit()
    db.refresh(result_db)

    return {
        "message": "Quiz result updated successfully",
        "data": result_db
    }


# 🔐 DELETE QUIZ RESULT → ADMIN
@router.delete("/{result_id}")
def delete_result(
    result_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    result = db.query(models.QuizResult)\
        .filter(models.QuizResult.id == result_id)\
        .first()

    if not result:
        raise HTTPException(404, "Result not found")

    db.delete(result)
    db.commit()

    return {
        "message": "Quiz result deleted successfully"
    }