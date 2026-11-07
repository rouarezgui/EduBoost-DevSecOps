from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    email = Column(String)
    password = Column(String)

    type = Column(String)


class Student(Base):

    __tablename__ = "students"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    progress = Column(Float)
    risk = Column(Float)
    progresses = relationship("Progress", back_populates="student")
    risk_assessment = relationship("RiskAssessment", back_populates="student")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    timestamp = Column(String)

    student_id = Column(Integer, ForeignKey("students.id"))
    
class Admin(Base):

    __tablename__ = "admins"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)

class Course(Base):

    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    difficulty = Column(String)
    price = Column(Float)
    
    chapters = relationship("Chapter", back_populates="course")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    
class Chapter(Base):

    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)

    course_id = Column(Integer, ForeignKey("courses.id"))

    course = relationship("Course", back_populates="chapters")
    quizzes = relationship("Quiz", back_populates="chapter")
    videos = relationship("Video", back_populates="chapter")

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    url = Column(String)
    duration = Column(Integer)
    order = Column(Integer)

    chapter_id = Column(Integer, ForeignKey("chapters.id"))

    chapter = relationship("Chapter", back_populates="videos")

class Progress(Base):

    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    score = Column(Float)
    time = Column(Integer)

    student_id = Column(Integer, ForeignKey("students.id"))

    student = relationship("Student", back_populates="progresses")


class Quiz(Base):

    __tablename__ = "quiz"

    id = Column(Integer, primary_key=True, index=True)
    questions = Column(String)
    level = Column(String)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))

    chapter = relationship("Chapter", back_populates="quizzes")
    results = relationship("QuizResult", back_populates="quiz")


class QuizResult(Base):

    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)

    score = Column(Float)
    errors = Column(Integer)

    student_id = Column(Integer, ForeignKey("students.id"))
    quiz_id = Column(Integer, ForeignKey("quiz.id"))

    student = relationship("Student")
    quiz = relationship("Quiz", back_populates="results")

class RiskAssessment(Base):

    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    riskLevel = Column(String)
    comment = Column(String)
    student_id = Column(Integer, ForeignKey("students.id"))

    student = relationship("Student", back_populates="risk_assessment")
