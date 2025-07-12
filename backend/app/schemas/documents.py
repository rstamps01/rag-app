# File Path: backend/app/schemas/documents.py
# COMPREHENSIVE VERSION: Fixes validation issues while preserving all original features

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DocumentBase(BaseModel):
    """Base schema for document operations"""
    filename: str
    content_type: str

class DocumentCreate(DocumentBase):
    """Schema for creating a new document"""
    size: Optional[int] = None        # FIXED: Made optional to handle None values
    department: Optional[str] = "General"

class DocumentUpdate(BaseModel):
    """Schema for updating document metadata"""
    filename: Optional[str] = None
    content_type: Optional[str] = None
    status: Optional[str] = None
    path: Optional[str] = None
    error_message: Optional[str] = None
    department: Optional[str] = None

class Document(DocumentBase):
    """Schema for document response - FIXED validation issues"""
    id: str                           # FIXED: Changed from int to str (UUID)
    size: Optional[int] = None        # FIXED: Made optional (can be None)
    upload_date: str                  # FIXED: Changed from datetime to str for API response
    status: str
    path: Optional[str] = None        # FIXED: Made optional (can be None)
    department: Optional[str] = "General"
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True  # For Pydantic v2 compatibility

class DocumentList(BaseModel):
    """Schema for document list response"""
    documents: List[Document]
    total: int = 0
    skip: int = 0
    limit: int = 10
