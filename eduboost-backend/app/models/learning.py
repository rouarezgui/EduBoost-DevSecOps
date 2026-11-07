from sqlalchemy import Column, Float, ForeignKey, Integer, String

from app.database import Base


class LearningEvent(Base):
    __tablename__ = "learning_events"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    action = Column(String, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True)
    quiz_id = Column(Integer, ForeignKey("quiz.id"), nullable=True)
    score = Column(Float, default=0)
    progress = Column(Float, default=0)
    time = Column(Integer, default=0)
    timestamp = Column(String, nullable=False)
