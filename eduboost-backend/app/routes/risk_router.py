from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/risk", tags=["Risk Assessment"])


# 🔐 CREATE RISK → ADMIN
@router.post("/")
def create_risk(
    risk: schemas.RiskAssessmentCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    student = db.query(models.Student)\
        .filter(models.Student.id == risk.student_id)\
        .first()

    if not student:
        raise HTTPException(404, "Student not found")

    new_risk = models.RiskAssessment(
        riskLevel=risk.riskLevel,
        comment=risk.comment,
        student_id=risk.student_id
    )

    db.add(new_risk)
    db.commit()
    db.refresh(new_risk)

    return {
        "message": "Risk assessment created successfully",
        "data": new_risk
    }


# 🔐 GET ALL RISKS → ADMIN
@router.get("/")
def get_risk(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    risks = db.query(models.RiskAssessment)\
        .offset(skip)\
        .limit(limit)\
        .all()

    return {
        "message": "Risk assessments fetched successfully",
        "data": risks
    }


# 🔐 GET STUDENT RISK
@router.get("/student/{student_id}")
def get_student_risk(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.id != student_id and current_user.type != "admin":
        raise HTTPException(403, "Access denied")

    risks = db.query(models.RiskAssessment)\
        .filter(models.RiskAssessment.student_id == student_id)\
        .all()

    return {
        "message": "Student risks fetched successfully",
        "data": risks
    }


# 🔐 UPDATE RISK → ADMIN
@router.put("/{risk_id}")
def update_risk(
    risk_id: int,
    risk: schemas.RiskAssessmentUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    risk_db = db.query(models.RiskAssessment)\
        .filter(models.RiskAssessment.id == risk_id)\
        .first()

    if not risk_db:
        raise HTTPException(404, "Risk assessment not found")

    risk_db.riskLevel = risk.riskLevel
    risk_db.comment = risk.comment
    risk_db.student_id = risk.student_id

    db.commit()
    db.refresh(risk_db)

    return {
        "message": "Risk updated successfully",
        "data": risk_db
    }


# 🔐 DELETE RISK → ADMIN
@router.delete("/{risk_id}")
def delete_risk(
    risk_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    risk = db.query(models.RiskAssessment)\
        .filter(models.RiskAssessment.id == risk_id)\
        .first()

    if not risk:
        raise HTTPException(404, "Risk not found")

    db.delete(risk)
    db.commit()

    return {
        "message": "Risk deleted successfully"
    }