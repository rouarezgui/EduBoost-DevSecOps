from sqlalchemy import Column, Integer, String
from app.database import Base


class StudentApproval(Base):
    __tablename__ = "student_approvals"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, unique=True, index=True, nullable=False)
    status = Column(String, default="pending")
    comment = Column(String, default="")
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(String, nullable=True)
