from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.models.models as models
import app.schemas.schemas as schemas

from app.database import get_db
from app.core.security import hash_password
from app.core.deps import get_current_admin

router = APIRouter(prefix="/admins", tags=["Admins"])


# 🔐 CREATE ADMIN
@router.post("/")
def create_admin(
    admin: schemas.AdminCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    existing_user = db.query(models.User)\
        .filter(models.User.username == admin.username)\
        .first()

    if existing_user:
        raise HTTPException(400, "Username already exists")

    new_user = models.User(
        username=admin.username,
        email=admin.email,
        password=hash_password(admin.password),
        type="admin"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_admin = models.Admin(id=new_user.id)

    db.add(new_admin)
    db.commit()

    return {
        "message": "Admin created successfully",
        "data": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "type": new_user.type
        }
    }


# 🔐 GET ADMINS
@router.get("/")
def get_admins(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    admins = db.query(models.Admin, models.User)\
        .join(models.User, models.User.id == models.Admin.id)\
        .all()

    data = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "type": user.type
        }
        for admin, user in admins
    ]

    return {
        "message": "Admins fetched successfully",
        "data": data
    }


# 🔐 UPDATE ADMIN
@router.put("/{admin_id}")
def update_admin(
    admin_id: int,
    data: schemas.AdminUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    user = db.query(models.User)\
        .filter(models.User.id == admin_id)\
        .first()

    admin_db = db.query(models.Admin)\
        .filter(models.Admin.id == admin_id)\
        .first()

    if not admin_db or not user:
        raise HTTPException(404, "Admin not found")

    user.username = data.username
    user.email = data.email
    user.password = hash_password(data.password)

    db.commit()
    db.refresh(user)

    return {
        "message": "Admin updated successfully",
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "type": user.type
        }
    }


# 🔐 DELETE ADMIN
@router.delete("/{admin_id}")
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    admin = db.query(models.Admin)\
        .filter(models.Admin.id == admin_id)\
        .first()

    user = db.query(models.User)\
        .filter(models.User.id == admin_id)\
        .first()

    if not admin or not user:
        raise HTTPException(404, "Admin not found")

    db.delete(admin)
    db.delete(user)

    db.commit()

    return {
        "message": "Admin deleted successfully"
    }