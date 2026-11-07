from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

import app.models.models as models
from app.core.jwt_handler import create_access_token
from app.core.emailer import send_email
from app.database import get_db


router = APIRouter(prefix="/password", tags=["Password Recovery"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


def send_reset_email(to_email: str, username: str, reset_link: str):
    subject = "EduBoost password reset"
    body = (
        f"Hello {username},\n\n"
        "You requested a password reset for your EduBoost account.\n"
        f"Reset link: {reset_link}\n\n"
        "If you did not request this, you can ignore this email."
    )
    return send_email(to_email, subject, body)


@router.post("/forgot")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user:
        return {"message": "If this email exists, a reset email has been sent.", "data": {"sent": False}}

    token = create_access_token({"sub": str(user.id), "purpose": "password_reset"})
    reset_link = f"http://127.0.0.1:4200/forgot-password?token={token}"
    mail_result = send_reset_email(user.email, user.username, reset_link)

    return {
        "message": "Password reset request processed",
        "data": {
            "sent": mail_result.get("sent", False),
            "resetLink": reset_link,
            "email": user.email,
            "subject": mail_result.get("subject"),
            "body": mail_result.get("body"),
        },
    }
