from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import app.models.models as models
from app.models.approval import StudentApproval
from app.core.deps import get_current_user, get_current_admin
from app.core.emailer import send_email
from app.database import get_db


router = APIRouter(prefix="/approvals", tags=["Approvals"])


class ApprovalUpdate(BaseModel):
    status: str
    comment: str = ""


def ensure_approval(db: Session, student_id: int) -> StudentApproval:
    approval = db.query(StudentApproval).filter(StudentApproval.student_id == student_id).first()
    if approval:
        return approval

    approval = StudentApproval(student_id=student_id, status="pending", comment="")
    db.add(approval)
    db.commit()
    db.refresh(approval)
    return approval


def approval_payload(student: models.Student, user: models.User, approval: StudentApproval):
    return {
        "id": student.id,
        "student_id": student.id,
        "username": user.username,
        "email": user.email,
        "progress": student.progress,
        "risk": student.risk,
        "approvalStatus": approval.status,
        "approvalComment": approval.comment or "",
        "reviewed_by": approval.reviewed_by,
        "reviewed_at": approval.reviewed_at,
    }


def send_status_email(to_email: str, username: str, status: str):
    subject = "Your EduBoost account has been approved" if status == "approved" else "Your EduBoost account request was rejected"
    signin_link = "http://127.0.0.1:4200/login"
    body = (
        f"Hello {username},\n\n"
        "Your EduBoost account has been approved by the admin. You can now sign in and access your student dashboard.\n"
        f"Sign in here: {signin_link}\n\n"
        "EduBoost"
        if status == "approved"
        else f"Hello {username},\n\nYour EduBoost account request was rejected by the admin.\n\nEduBoost"
    )
    return send_email(to_email, subject, body)


@router.get("/students")
def list_student_approvals(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    rows = db.query(models.Student, models.User)\
        .join(models.User, models.User.id == models.Student.id)\
        .all()

    data = []
    for student, user in rows:
        approval = ensure_approval(db, student.id)
        data.append(approval_payload(student, user, approval))

    return {"message": "Student approvals fetched successfully", "data": data}


@router.get("/me")
def get_my_approval(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.type != "student":
        return {"message": "Admins are approved", "data": {"approvalStatus": "approved"}}

    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    approval = ensure_approval(db, student.id)
    return {
        "message": "Approval fetched successfully",
        "data": {
            "student_id": student.id,
            "approvalStatus": approval.status,
            "approvalComment": approval.comment or "",
        },
    }


@router.put("/students/{student_id}")
def update_student_approval(
    student_id: int,
    data: ApprovalUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    status = data.status.lower().strip()
    if status not in {"pending", "approved", "rejected"}:
        raise HTTPException(status_code=400, detail="Status must be pending, approved or rejected")

    row = db.query(models.Student, models.User)\
        .join(models.User, models.User.id == models.Student.id)\
        .filter(models.Student.id == student_id)\
        .first()
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")

    student, user = row
    approval = ensure_approval(db, student.id)
    approval.status = status
    approval.comment = data.comment
    approval.reviewed_by = admin.id
    approval.reviewed_at = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(approval)

    email = send_status_email(user.email, user.username, status) if status in {"approved", "rejected"} else {"sent": False}

    return {
        "message": "Student approval updated successfully",
        "data": {
            **approval_payload(student, user, approval),
            "email": email,
        },
    }
