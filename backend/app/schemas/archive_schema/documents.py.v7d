from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    content_type: str

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    """Schema for updating document metadata"""
    filename: Optional[str] = None
    content_type: Optional[str] = None
    status: Optional[str] = None
    path: Optional[str] = None
    error_message: Optional[str] = None

class Document(DocumentBase):
    id: str
    size: int
    upload_date: str
    status: str
    path: str

class DocumentList(BaseModel):
    documents: List[Document]
    total: int = 0
    skip: int = 0
    limit: int = 10
