import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

import app.models.models as models
from app.database import get_db


router = APIRouter(tags=["Assistant Interface"])
ROOT_DIR = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT_DIR / "docs"
SUPPORTED_EXTENSIONS = (".pdf", ".docx", ".pptx", ".txt")


class AskRequest(BaseModel):
    question: str
    course: str


def fallback_answer(db: Session, question: str, course_key: str):
    term = course_key.lower()
    courses = db.query(models.Course).all()
    course_matches = [course for course in courses if term in (course.title or "").lower()]
    selected = course_matches or courses[:4]

    if not selected:
        return {
            "answer": "No courses are stored in the EduBoost database yet.",
            "sources": [],
        }

    lines = []
    sources = []
    for course in selected[:4]:
        chapters = db.query(models.Chapter).filter(models.Chapter.course_id == course.id).all()
        lines.append(
            f"{course.title} is a {course.difficulty or 'Beginner'} course with {len(chapters)} chapters."
        )
        for chapter in chapters[:2]:
            lines.append(f"Chapter: {chapter.title}. {chapter.content or ''}")
            sources.append(chapter.title)

    return {
        "answer": " ".join(lines) + " Ask about a chapter, quiz, or score for a more specific recommendation.",
        "sources": sources[:5],
    }


@router.post("/ask")
def ask(request: AskRequest, db: Session = Depends(get_db)):
    try:
        from rag_engine import ask_question

        result = ask_question(question=request.question, course=request.course)
        return {
            "answer": result.get("answer", ""),
            "sources": result.get("sources", []),
            "course": request.course,
        }
    except Exception:
        result = fallback_answer(db, request.question, request.course)
        return {**result, "course": request.course}


@router.post("/upload/{course}")
async def upload(course: str, file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(SUPPORTED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Invalid file type")

    course_dir = DOCS_DIR / course
    course_dir.mkdir(parents=True, exist_ok=True)
    target = course_dir / os.path.basename(file.filename)
    target.write_bytes(await file.read())

    details = {"message": "File saved. Indexing engine was not required."}
    try:
        from ingest import ingest_single_file

        details = ingest_single_file(course, file.filename)
    except Exception as exc:
        details = {"message": "File saved. Indexing can run later.", "detail": str(exc)}

    return {
        "message": f"File {file.filename} added to course {course}",
        "course": course,
        "details": details,
    }


@router.get("/chapters/{course}")
def get_indexed_files(course: str):
    course_dir = DOCS_DIR / course
    if not course_dir.exists():
        return {"course": course, "chapters": []}

    files = [
        file.name
        for file in course_dir.iterdir()
        if file.is_file() and file.name.lower().endswith(SUPPORTED_EXTENSIONS)
    ]
    return {"course": course, "chapters": files}
