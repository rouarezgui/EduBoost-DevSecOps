from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
import app.models.models as models
from app.core.jwt_handler import create_access_token
from fastapi.security import OAuth2PasswordRequestForm
import app.schemas.schemas as schemas
from datetime import datetime
from app.core.security import verify_password, hash_password
from app.core.deps import get_current_user
from app.core.emailer import send_email
from app.models.approval import StudentApproval

router = APIRouter(prefix="/auth", tags=["Auth"])


def send_welcome_pending_email(to_email: str, username: str):
    subject = "Welcome to EduBoost - account pending approval"
    body = (
        f"Hello {username},\n"
        "Welcome to EduBoost. Please wait for the admin to accept your account before signing in.\n\n"
        f"Bonjour {username},\n"
        "Bienvenue sur EduBoost. Veuillez attendre que l'administrateur accepte votre compte avant de vous connecter.\n\n"
        f"مرحبا {username}،\n"
        "مرحبا بك في EduBoost. يرجى انتظار قبول حسابك من طرف المشرف قبل تسجيل الدخول.\n\n"
        "EduBoost"
    )
    return send_email(to_email, subject, body)


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    identifier = form_data.username.strip()
    candidates = db.query(models.User).filter(
        (models.User.username == identifier) |
        (models.User.email == identifier)
    ).all()

    if not candidates:
        raise HTTPException(status_code=404, detail="User not found")

    valid_users = [user for user in candidates if verify_password(form_data.password, user.password)]

    if not valid_users:
        raise HTTPException(status_code=401, detail="Invalid password")

    user = valid_users[0]
    if len(valid_users) > 1:
        approved_user = None
        for item in valid_users:
            if item.type == "admin":
                approved_user = item
                break
            approval = db.query(StudentApproval).filter(StudentApproval.student_id == item.id).first()
            if item.type == "student" and approval and approval.status == "approved":
                approved_user = item
                break
        user = approved_user or valid_users[0]

    token = create_access_token({"sub": str(user.id)})

    return {
    "access_token": token,
    "token_type": "bearer",
    "user": {
        "id": user.id,
        "username": user.username,
        "type": user.type
    }
}

@router.get("/me")
def get_current_logged_user(
    current_user = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "type": current_user.type
    }

@router.put("/me/password")
def update_password(
    data: schemas.PasswordUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # vérifier ancien mot de passe
    if not verify_password(data.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Wrong password")

    # update password
    current_user.password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}

# 🔥 REGISTER (STUDENT)
@router.post("/register", response_model=schemas.StudentResponse)
def register(user: schemas.StudentCreate, db: Session = Depends(get_db)):

    # nettoyer username
    username_clean = user.username.strip().lower()

    # vérifier si username/email existe
    existing_user = db.query(models.User)\
                      .filter((models.User.username == username_clean) | (models.User.email == user.email))\
                      .first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # créer user
    new_user = models.User(
        username=username_clean,
        email=user.email,
        password=hash_password(user.password),
        type="student"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # créer student
    new_student = models.Student(
        id=new_user.id,
        progress=0.0,
        risk=0.0
    )

    db.add(new_student)
    db.commit()

    approval = StudentApproval(student_id=new_student.id, status="pending", comment="")
    db.add(approval)
    db.commit()

    # créer activité
    new_activity = models.Activity(
        action="Account created",
        timestamp=str(datetime.now()),
        student_id=new_student.id
    )

    db.add(new_activity)
    db.commit()

    email = send_welcome_pending_email(new_user.email, new_user.username)

    return {
        "id": new_student.id,
        "username": new_user.username,
        "email": new_user.email,
        "progress": new_student.progress,
        "risk": new_student.risk,
        "approvalStatus": approval.status,
        "emailStatus": email
    }
