from pydantic import BaseModel
from typing import Optional

class UserAdmin(BaseModel):
    email: str
    is_active: bool
    is_admin: bool

class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
