# File Path: /home/ubuntu/rag_app_v2/rag-app/backend/app/schemas/document.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Shared properties
class DocumentBase(BaseModel):
    filename: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    status: str = "pending"

# Properties to receive via API on creation (usually just the file itself)
# We might not need a specific Create schema if info comes from UploadFile
# But defining it can be useful for consistency or if extra metadata is passed
class DocumentCreate(BaseModel):
    filename: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    status: str = "pending"

# Properties stored in DB
class DocumentInDBBase(DocumentBase):
    id: str # UUID as string
    department: str
    owner_id: int
    upload_date: datetime
    storage_path: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Document(DocumentInDBBase):
    pass

# Properties for listing documents
class DocumentListResponse(BaseModel):
    documents: List[Document]
    total_count: int

