# File Path: /home/ubuntu/rag_app_extracted/rag-app/backend/app/crud/crud_query_history.py
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.models import QueryHistory
from app.schemas.query import QueryHistoryCreate # Assuming a Pydantic schema for creation
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

def create_query_history_entry(db: Session, query_history_data: QueryHistoryCreate, user_id: Optional[int] = None) -> QueryHistory:
    """Creates a new query history entry."""
    db_query_history_data = query_history_data.model_dump()
    
    # Standardize department_filter to lowercase if it exists
    if "department_filter" in db_query_history_data and db_query_history_data["department_filter"]:
        db_query_history_data["department_filter"] = db_query_history_data["department_filter"].lower()
    
    db_entry = QueryHistory(**db_query_history_data, user_id=user_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    logger.info(f"Created query history entry ID: {db_entry.id} for user_id: {user_id}")
    return db_entry

def get_query_history_entry(db: Session, entry_id: int) -> QueryHistory | None:
    """Retrieves a specific query history entry by its ID."""
    return db.query(QueryHistory).filter(QueryHistory.id == entry_id).first()

def get_query_history_for_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> List[QueryHistory]:
    """Retrieves query history for a specific user with pagination."""
    return (
        db.query(QueryHistory)
        .filter(QueryHistory.user_id == user_id)
        .order_by(desc(QueryHistory.query_timestamp))
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_all_query_history(
    db: Session, skip: int = 0, limit: int = 100
) -> List[QueryHistory]:
    """Retrieves all query history entries with pagination (e.g., for admin purposes)."""
    return (
        db.query(QueryHistory)
        .order_by(desc(QueryHistory.query_timestamp))
        .offset(skip)
        .limit(limit)
        .all()
    )

# Add other query history related CRUD operations as needed (e.g., delete, update if applicable)

