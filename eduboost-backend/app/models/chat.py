from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    sender = Column(String, nullable=False)
    message = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
