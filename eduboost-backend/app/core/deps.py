from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.jwt_handler import SECRET_KEY, ALGORITHM
from app.database import get_db

import app.models.models as models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    # ✅ FIX
    user = db.query(models.User)\
        .filter(models.User.id == int(user_id))\
        .first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


def get_current_admin(
    current_user=Depends(get_current_user)
):

    if current_user.type != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return current_user