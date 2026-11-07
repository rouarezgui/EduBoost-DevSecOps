from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import app.models.models as models
from app.models.learning import LearningEvent
from app.core.deps import get_current_user
from app.database import get_db


router = APIRouter(prefix="/learning", tags=["Learning Progress"])


class LearningEventCreate(BaseModel):
    action: str
    course_id: int | None = None
    chapter_id: int | None = None
    quiz_id: int | None = None
    score: float = 0
    progress: float = 0
    time: int = 0


def risk_level(progress: float, avg_score: float) -> str:
    if progress < 35 or (avg_score and avg_score < 50):
        return "high"
    if progress < 70 or (avg_score and avg_score < 70):
        return "medium"
    return "low"


def recommendation(progress: float, avg_score: float) -> str:
    if progress < 35:
        return "Start with the next chapter and complete one quiz to build momentum."
    if avg_score and avg_score < 60:
        return "Review weak quiz answers, then retry the chapter quiz."
    if progress < 100:
        return "Keep going with the remaining chapters and videos."
    return "Great work. Move to a harder course or revise with practice quizzes."


def course_progress(events: list[LearningEvent], course: models.Course) -> dict:
    course_events = [event for event in events if event.course_id == course.id]
    chapter_ids = {event.chapter_id for event in course_events if event.action == "chapter_view" and event.chapter_id}
    video_ids = {event.chapter_id for event in course_events if event.action == "video_play" and event.chapter_id}
    quiz_scores = [event.score for event in course_events if event.action == "quiz_submit"]
    course_views = [event for event in course_events if event.action == "course_view"]

    chapters_total = max(len(course.chapters or []), 1)
    chapter_part = min(50, (len(chapter_ids) / chapters_total) * 50)
    video_part = min(15, (len(video_ids) / chapters_total) * 15)
    quiz_part = min(35, (sum(quiz_scores) / len(quiz_scores)) * 0.35) if quiz_scores else 0
    view_part = 5 if course_views and not chapter_ids and not quiz_scores else 0
    progress = min(100, round(chapter_part + video_part + quiz_part + view_part))
    avg_score = round(sum(quiz_scores) / len(quiz_scores)) if quiz_scores else 0

    return {
        "id": course.id,
        "title": course.title,
        "difficulty": course.difficulty,
        "price": course.price,
        "progress": progress,
        "avgScore": avg_score,
        "chaptersRead": len(chapter_ids),
        "chaptersTotal": len(course.chapters or []),
        "quizzesTaken": len(quiz_scores),
        "risk": risk_level(progress, avg_score),
        "rec": recommendation(progress, avg_score),
        "lastActivity": course_events[-1].timestamp if course_events else None,
    }


@router.post("/events")
def create_learning_event(
    payload: LearningEventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.type != "student":
        raise HTTPException(status_code=403, detail="Only students can create learning events")

    event = LearningEvent(
        student_id=current_user.id,
        action=payload.action,
        course_id=payload.course_id,
        chapter_id=payload.chapter_id,
        quiz_id=payload.quiz_id,
        score=payload.score,
        progress=payload.progress,
        time=payload.time,
        timestamp=datetime.utcnow().isoformat(),
    )
    db.add(event)

    db.add(models.Progress(
        score=payload.score or payload.progress,
        time=payload.time,
        student_id=current_user.id,
    ))

    db.commit()
    db.refresh(event)
    return {"message": "Learning event saved successfully", "data": event}


@router.get("/me/summary")
def get_my_learning_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.type != "student":
        raise HTTPException(status_code=403, detail="Only students can access learning summaries")

    events = db.query(LearningEvent)\
        .filter(LearningEvent.student_id == current_user.id)\
        .order_by(LearningEvent.id.asc())\
        .all()

    enrollments = db.query(models.Enrollment).filter(models.Enrollment.student_id == current_user.id).all()
    enrolled_ids = [enrollment.course_id for enrollment in enrollments]
    touched_ids = sorted({event.course_id for event in events if event.course_id})
    course_ids = enrolled_ids or touched_ids

    query = db.query(models.Course)
    courses = query.filter(models.Course.id.in_(course_ids)).all() if course_ids else query.all()
    per_course = [course_progress(events, course) for course in courses]

    quiz_results = db.query(models.QuizResult).filter(models.QuizResult.student_id == current_user.id).all()
    quiz_scores = [result.score or 0 for result in quiz_results]
    avg_score = round(sum(quiz_scores) / len(quiz_scores)) if quiz_scores else 0
    quizzes_passed = len([score for score in quiz_scores if score >= 50])
    avg_progress = round(sum(item["progress"] for item in per_course) / len(per_course)) if per_course else 0
    completed = len([item for item in per_course if item["progress"] >= 100])

    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if student:
        student.progress = float(avg_progress)
        student.risk = {"low": 0.0, "medium": 50.0, "high": 100.0}[risk_level(avg_progress, avg_score)]
        db.commit()

    recent = []
    for event in reversed(events[-8:]):
        course = next((item for item in per_course if item["id"] == event.course_id), None)
        recent.append({
            "action": event.action,
            "course_id": event.course_id,
            "course_title": course["title"] if course else "Course",
            "score": event.score,
            "progress": event.progress,
            "time": event.timestamp,
        })

    return {
        "message": "Learning summary fetched successfully",
        "data": {
            "avgProgress": avg_progress,
            "completedCount": completed,
            "quizzesPassed": quizzes_passed,
            "avgScore": avg_score,
            "totalCourses": len(per_course),
            "progressRecords": len(events),
            "courses": per_course,
            "recentActivity": recent,
        },
    }
