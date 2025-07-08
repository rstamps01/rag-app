from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from typing import Generator, Optional

from app.core.config import settings
from app.core.security import verify_password
from app.schemas.auth import TokenPayload, User

# Import simulated user database
from app.api.routes.auth import users_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Validate token and return current user
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=["HS256"]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user = users_db.get(token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    return user

def get_current_active_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if current user is admin
    """
    if not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    
    return current_user
