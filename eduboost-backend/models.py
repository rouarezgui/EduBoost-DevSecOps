from pydantic import BaseModel
from typing import Optional

class AskRequest(BaseModel):
    question: str
    student_id: Optional[str] = None
    course: Optional[str] = None

class AskResponse(BaseModel):
    answer: str
    sources: list[str] = []
    course: Optional[str] = None

class IngestRequest(BaseModel):
    course: str

class LevelRequest(BaseModel):
    student_id: str
    course: str
    quiz_answers: list[str]

class RecommendRequest(BaseModel):
    question: str
    course: str
    score: float
    progress: float
    weak_chapters: list[str]

class SummaryRequest(BaseModel):
    course: str
    chapter: Optional[str] = None

class QuizRequest(BaseModel):
    course: str
    chapter: Optional[str] = None