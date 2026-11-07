from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

# DB
from app.database import engine, SessionLocal, Base

# Models
import app.models.models as models
import app.models.approval
import app.models.chat
import app.models.learning

# Security
from app.core.security import hash_password

from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.routes import (
    student_router,
    admin_router,
    course_router,
    chapter_router,
    quiz_router,
    progress_router,
    result_router,
    risk_router,
    auth_router,
    video_router,
    approval_router,
    rag_router,
    learning_router,
    password_router,
    assistant_router
)

app = FastAPI()


# 🔥 CREATE INITIAL ADMIN
def create_initial_admin():
    db: Session = SessionLocal()

    admin = db.query(models.User).filter(models.User.type == "admin").first()

    if not admin:
        new_user = models.User(
            username="admin",
            email="admin@gmail.com",
            password=hash_password("admin123"),
            type="admin"
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        new_admin = models.Admin(id=new_user.id)
        db.add(new_admin)
        db.commit()

        print("✅ Admin created automatically")

    else:
        print("ℹ️ Admin already exists")

    db.close()


# 🚀 STARTUP EVENT (PRO)
@app.on_event("startup")
def startup():
    print("📦 Creating tables...")
    Base.metadata.create_all(bind=engine)

    print("👤 Checking admin...")
    create_initial_admin()

    print("DB PATH:", os.path.abspath("eduboost.db"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    "null"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔗 ROUTES
app.include_router(student_router.router)
app.include_router(admin_router.router)
app.include_router(course_router.router)
app.include_router(chapter_router.router)
app.include_router(quiz_router.router)
app.include_router(progress_router.router)
app.include_router(result_router.router)
app.include_router(risk_router.router)
app.include_router(auth_router.router)
app.include_router(video_router.router)
app.include_router(approval_router.router)
app.include_router(rag_router.router)
app.include_router(learning_router.router)
app.include_router(password_router.router)
app.include_router(assistant_router.router)

assistant_frontend = Path(__file__).resolve().parents[1] / "frontend"
if assistant_frontend.exists():
    app.mount("/assistant", StaticFiles(directory=str(assistant_frontend), html=True), name="assistant")


# 🏠 ROOT
@app.get("/")
def home():
    return {"message": "EduBoost API running 🚀"}
