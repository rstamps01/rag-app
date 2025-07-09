# File Path: /home/ubuntu/rag_app_v2/rag-app/backend/app/schemas/user.py
from pydantic import BaseModel, Field
from typing import Optional

# Shared properties
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    department: str = Field(..., min_length=1, max_length=50)

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

# Properties to receive via API on update (optional)
class UserUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=8)
    department: Optional[str] = Field(None, min_length=1, max_length=50)
    is_active: Optional[bool] = None

# Properties stored in DB
class UserInDBBase(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True # Replaces from_attributes = True in Pydantic v2

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str

# Properties to return to client (never include password hash)
class User(UserInDBBase):
    pass

