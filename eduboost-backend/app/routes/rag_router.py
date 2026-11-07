from datetime import datetime
from difflib import SequenceMatcher

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import app.models.models as models
from app.models.chat import ChatMessage
from app.core.deps import get_current_user
from app.database import get_db


router = APIRouter(prefix="/rag", tags=["RAG Assistant"])


class ChatRequest(BaseModel):
    message: str


def save_message(db: Session, student_id: int, sender: str, message: str):
    row = ChatMessage(
        student_id=student_id,
        sender=sender,
        message=message,
        timestamp=datetime.utcnow().isoformat(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def row_payload(row: ChatMessage):
    return {
        "id": row.id,
        "from": "bot" if row.sender == "assistant" else row.sender,
        "text": row.message,
        "time": row.timestamp,
    }


def score_text(query: str, text: str) -> float:
    q = query.lower().strip()
    t = text.lower().strip()
    if not q or not t:
        return 0
    words = [w for w in q.split() if len(w) > 2]
    overlap = sum(1 for w in words if w in t)
    return overlap + SequenceMatcher(None, q, t[:300]).ratio()


def build_context(db: Session, student_id: int, question: str):
    snippets = []

    courses = db.query(models.Course).all()
    for course in courses:
        snippets.append({
            "type": "course",
            "title": course.title,
            "text": f"Course: {course.title}. Difficulty: {course.difficulty}. Price: {course.price} TND."
        })

    chapters = db.query(models.Chapter).all()
    for chapter in chapters:
        snippets.append({
            "type": "chapter",
            "title": chapter.title,
            "text": f"Chapter: {chapter.title}. Content: {chapter.content or ''}. Course id: {chapter.course_id}."
        })

    videos = db.query(models.Video).all()
    for video in videos:
        snippets.append({
            "type": "video",
            "title": video.title,
            "text": f"Video: {video.title}. URL: {video.url}. Duration: {video.duration} minutes. Order: {video.order}. Chapter id: {video.chapter_id}."
        })

    quizzes = db.query(models.Quiz).all()
    for quiz in quizzes:
        snippets.append({
            "type": "quiz",
            "title": f"Quiz #{quiz.id}",
            "text": f"Quiz #{quiz.id}. Level: {quiz.level}. Chapter id: {quiz.chapter_id}. Questions: {quiz.questions}."
        })

    progress = db.query(models.Progress).filter(models.Progress.student_id == student_id).all()
    for item in progress:
        snippets.append({
            "type": "progress",
            "title": f"Progress #{item.id}",
            "text": f"Student progress record: score {item.score}, time {item.time} minutes."
        })

    results = db.query(models.QuizResult).filter(models.QuizResult.student_id == student_id).all()
    for result in results:
        snippets.append({
            "type": "quiz_result",
            "title": f"Quiz result #{result.id}",
            "text": f"Quiz result: quiz id {result.quiz_id}, score {result.score}, errors {result.errors}."
        })

    risk = db.query(models.RiskAssessment).filter(models.RiskAssessment.student_id == student_id).all()
    for item in risk:
        snippets.append({
            "type": "risk",
            "title": f"Risk {item.riskLevel}",
            "text": f"Risk assessment: level {item.riskLevel}. Comment: {item.comment}."
        })

    ranked = sorted(snippets, key=lambda s: score_text(question, s["text"]), reverse=True)
    return ranked[:6]


def make_answer(question: str, context: list[dict]) -> str:
    q = question.lower()
    if not context:
        return "I could not find matching information in the database yet. Try asking about courses, chapters, quizzes, videos, progress, or risk."

    if "progress" in q or "score" in q or "risk" in q:
        facts = [item["text"] for item in context if item["type"] in {"progress", "quiz_result", "risk"}]
        if facts:
            return "Based on your database records: " + " ".join(facts[:3])

    if "course" in q or "catalog" in q or "available" in q:
        courses = [item["text"] for item in context if item["type"] == "course"]
        if courses:
            return "Here are the most relevant courses from the database: " + " ".join(courses[:4])

    if "quiz" in q:
        quizzes = [item["text"] for item in context if item["type"] in {"quiz", "quiz_result"}]
        if quizzes:
            return "Here is what I found about quizzes in the database: " + " ".join(quizzes[:3])

    if "video" in q:
        videos = [item["text"] for item in context if item["type"] == "video"]
        if videos:
            return "Here are relevant videos from the database: " + " ".join(videos[:3])

    return "I found this in the EduBoost database: " + " ".join(item["text"] for item in context[:4])


@router.get("/history")
def get_chat_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.type != "student":
        raise HTTPException(status_code=403, detail="Only students can use the AI assistant")

    rows = db.query(ChatMessage)\
        .filter(ChatMessage.student_id == current_user.id)\
        .order_by(ChatMessage.id.asc())\
        .limit(100)\
        .all()

    return {"message": "Chat history fetched successfully", "data": [row_payload(row) for row in rows]}


@router.post("/chat")
def chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.type != "student":
        raise HTTPException(status_code=403, detail="Only students can use the AI assistant")

    question = data.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message is required")

    user_row = save_message(db, current_user.id, "user", question)
    context = build_context(db, current_user.id, question)
    answer = make_answer(question, context)
    assistant_row = save_message(db, current_user.id, "assistant", answer)

    return {
        "message": "Assistant answered successfully",
        "data": {
            "answer": answer,
            "userMessage": row_payload(user_row),
            "assistantMessage": row_payload(assistant_row),
            "sources": context,
        },
    }


@router.delete("/history")
def clear_chat_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.type != "student":
        raise HTTPException(status_code=403, detail="Only students can use the AI assistant")

    db.query(ChatMessage).filter(ChatMessage.student_id == current_user.id).delete()
    db.commit()
    return {"message": "Chat history cleared successfully"}
