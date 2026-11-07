from pydantic import BaseModel
from pydantic import EmailStr
from pydantic import Field
from typing import Any, Dict, Optional


class UserBase(BaseModel):
    username: str
    email: str
    password: str


class UserCreate(UserBase):
    pass


class StudentCreate(UserBase):
    pass
    
class StudentResponse(BaseModel):
    id: int
    username: str
    email: str
    progress: float
    risk: float
    approvalStatus: Optional[str] = None
    emailStatus: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
        
class StudentUpdate(BaseModel):
    username: str
    email: str
    password: str
    
class ActivityResponse(BaseModel):
    id: int
    action: str
    timestamp: str

    class Config:
        from_attributes = True

class AdminCreate(UserBase):
    pass

class AdminResponse(BaseModel):
    id: int

    class Config:
        from_attributes = True
class AdminUpdate(BaseModel):
    username: str
    email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class CourseCreate(BaseModel):
    title: str
    difficulty: str
    price: float

class CourseResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    price: float

    class Config:
        from_attributes = True
class CourseUpdate(BaseModel):
    title: str
    difficulty: str
    price: float

class EnrollmentCreate(BaseModel):
    course_id: int

class ChapterCreate(BaseModel):
    title: str
    content: str
    course_id: int

class ChapterResponse(BaseModel):
    id: int
    title: str
    content: str
    course_id: int

    class Config:
        from_attributes = True
class ChapterUpdate(BaseModel):
    title: str
    content: str
    course_id: int

class VideoCreate(BaseModel):
    title: str
    url: str
    duration: int
    order: int
    chapter_id: int

class VideoResponse(BaseModel):
    id: int
    title: str
    url: str
    duration: int
    order: int
    chapter_id: int

    class Config:
        from_attributes = True

class QuizCreate(BaseModel):
    questions: str
    level: str
    chapter_id: int
class QuizResponse(BaseModel):
    id: int
    questions: str
    level: str
    chapter_id: int

    class Config:
        from_attributes = True
class QuizUpdate(BaseModel):
    questions: str
    level: str
    chapter_id: int
class ProgressCreate(BaseModel):
    score: float
    time: int
    student_id: int
class ProgressResponse(BaseModel):
    id: int
    score: float
    time: int
    student_id: int

    class Config:
        from_attributes = True
class ProgressUpdate(BaseModel):
    score: float
    time: int
    student_id: int

class QuizResultCreate(BaseModel):
    score: float
    errors: int
    student_id: int
    quiz_id: int

class QuizResultResponse(BaseModel):
    id: int
    score: float
    errors: int
    student_id: int
    quiz_id: int

    class Config:
        from_attributes = True
class QuizResultUpdate(BaseModel):
    score: float
    errors: int
    student_id: int
    quiz_id: int       
class RiskAssessmentCreate(BaseModel):
    riskLevel: str
    comment: str
    student_id: int
class RiskAssessmentResponse(BaseModel):
    id: int
    riskLevel: str
    comment: str
    student_id: int

    class Config:
        from_attributes = True
class RiskAssessmentUpdate(BaseModel):
    riskLevel: str
    comment: str
    student_id: int

class MessageResponse(BaseModel):
    message: str
