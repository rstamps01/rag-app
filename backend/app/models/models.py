from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    department = Column(String, index=True, nullable=True) # Added department to User

    queries = relationship("QueryHistory", back_populates="user")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True) # Assuming UUID as string
    filename = Column(String, index=True)
    content_type = Column(String, nullable=True)
    size = Column(Integer, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="uploaded") # e.g., uploaded, processing, completed, failed
    path = Column(String, nullable=True) # Path to the original file if stored temporarily or permanently
    department = Column(String, index=True, nullable=True) # Added department field
    error_message = Column(Text, nullable=True) # To store any processing errors
    # Add relationship to user if needed
    # owner_id = Column(Integer, ForeignKey("users.id"))
    # owner = relationship("User") # Define back_populates in User model if bi-directional

class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Link to user, can be nullable if queries can be anonymous
    query_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=True)
    llm_model_used = Column(String, nullable=True)
    sources_retrieved = Column(JSON, nullable=True) # Store list of source document IDs or snippets
    processing_time_ms = Column(Integer, nullable=True)
    query_timestamp = Column(DateTime, default=datetime.utcnow)
    department_filter = Column(String, index=True, nullable=True)
    gpu_accelerated = Column(Boolean, default=False)

    user = relationship("User", back_populates="queries")

# Ensure Base.metadata.create_all(bind=engine) is called somewhere during app startup
# (often in main.py or a startup event) to create these tables.

