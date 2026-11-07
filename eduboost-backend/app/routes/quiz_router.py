from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/quiz", tags=["Quiz"])


# 🔐 CREATE QUIZ → ADMIN
@router.post("/")
def create_quiz(
    quiz: schemas.QuizCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    chapter = db.query(models.Chapter)\
        .filter(models.Chapter.id == quiz.chapter_id)\
        .first()

    if not chapter:
        raise HTTPException(404, "Chapter not found")

    new_quiz = models.Quiz(
        questions=quiz.questions,
        level=quiz.level,
        chapter_id=quiz.chapter_id
    )

    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    return {
        "message": "Quiz created successfully",
        "data": new_quiz
    }


# 🔐 GET ALL QUIZZES
@router.get("/")
def get_quiz(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    quizzes = db.query(models.Quiz)\
        .offset(skip)\
        .limit(limit)\
        .all()

    return {
        "message": "Quizzes fetched successfully",
        "data": quizzes
    }


# 🔐 GET QUIZ RESULTS
@router.get("/{quiz_id}/results")
def get_quiz_results(
    quiz_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    quiz = db.query(models.Quiz)\
        .filter(models.Quiz.id == quiz_id)\
        .first()

    if not quiz:
        raise HTTPException(404, "Quiz not found")

    results = db.query(models.QuizResult)\
        .filter(models.QuizResult.quiz_id == quiz_id)\
        .offset(skip)\
        .limit(limit)\
        .all()

    # 🔒 Student sees only own results
    if current_user.type != "admin":
        results = [
            r for r in results
            if r.student_id == current_user.id
        ]

    return {
        "message": "Quiz results fetched successfully",
        "data": results
    }


# 🔐 UPDATE QUIZ → ADMIN
@router.put("/{quiz_id}")
def update_quiz(
    quiz_id: int,
    data: schemas.QuizUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    quiz_db = db.query(models.Quiz)\
        .filter(models.Quiz.id == quiz_id)\
        .first()

    if not quiz_db:
        raise HTTPException(404, "Quiz not found")

    quiz_db.questions = data.questions
    quiz_db.level = data.level
    quiz_db.chapter_id = data.chapter_id

    db.commit()
    db.refresh(quiz_db)

    return {
        "message": "Quiz updated successfully",
        "data": quiz_db
    }


# 🔐 DELETE QUIZ → ADMIN
@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    quiz = db.query(models.Quiz)\
        .filter(models.Quiz.id == quiz_id)\
        .first()

    if not quiz:
        raise HTTPException(404, "Quiz not found")

    db.delete(quiz)
    db.commit()

    return {
        "message": "Quiz deleted successfully"
    }