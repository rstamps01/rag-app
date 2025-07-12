# File Path: backend/app/schemas/documents.py
# CORRECTED: Added missing fields and fixed field types

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    content_type: str

class DocumentCreate(DocumentBase):
    size: Optional[int] = None  # ADDED: Missing size field
    department: Optional[str] = "General"  # ADDED: Missing department field

class DocumentUpdate(BaseModel):
    """Schema for updating document metadata"""
    filename: Optional[str] = None
    content_type: Optional[str] = None
    status: Optional[str] = None
    path: Optional[str] = None
    error_message: Optional[str] = None
    department: Optional[str] = None  # ✅ Already present

class Document(DocumentBase):
    id: int  # FIXED: Should be int to match model
    size: int
    upload_date: datetime  # FIXED: Should be datetime to match model
    status: str
    path: str
    department: Optional[str] = "General"  # ADDED: Missing department field
    error_message: Optional[str] = None  # ADDED: Missing error_message field
    
    class Config:
        from_attributes = True  # For Pydantic v2 compatibility

class DocumentList(BaseModel):
    documents: List[Document]
    total: int = 0
    skip: int = 0
    limit: int = 10