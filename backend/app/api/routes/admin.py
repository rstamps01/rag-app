from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List
from app.schemas.admin import UserAdmin, UserUpdate

router = APIRouter()

# Simulated user database from auth module
from app.api.routes.auth import users_db

@router.get("/users", response_model=List[UserAdmin])
async def list_users() -> Any:
    """
    List all users (admin only).
    """
    # In a real app, add authentication check for admin user
    return list(users_db.values())

@router.put("/users/{email}", response_model=UserAdmin)
async def update_user(email: str, user_in: UserUpdate) -> Any:
    """
    Update user details (admin only).
    """
    if email not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Update user data (only is_active and is_admin for demo)
    if user_in.is_active is not None:
        users_db[email]["is_active"] = user_in.is_active
    if user_in.is_admin is not None:
        users_db[email]["is_admin"] = user_in.is_admin
        
    return users_db[email]
