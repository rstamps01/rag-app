# File Path: /backend/app/crud/crud_query_history.py
# Fixed version - added missing create_query_history function

from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.models import QueryHistory
from app.schemas.query import QueryHistoryCreate
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

def create_query_history(db: Session, query_history_data: QueryHistoryCreate, user_id: Optional[int] = None) -> QueryHistory:
    """
    Creates a new query history entry.
    
    This is the function that query_processor.py is trying to import.
    """
    try:
        db_query_history_data = query_history_data.model_dump()
        
        # Standardize department_filter to lowercase if it exists
        if "department_filter" in db_query_history_data and db_query_history_data["department_filter"]:
            db_query_history_data["department_filter"] = db_query_history_data["department_filter"].lower()
        
        # Add user_id if provided
        if user_id:
            db_query_history_data["user_id"] = user_id
        
        db_entry = QueryHistory(**db_query_history_data)
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        
        logger.info(f"Created query history entry ID: {db_entry.id} for user_id: {user_id}")
        return db_entry
        
    except Exception as e:
        logger.error(f"Error creating query history: {str(e)}")
        db.rollback()
        raise

def create_query_history_entry(db: Session, query_history_data: QueryHistoryCreate, user_id: Optional[int] = None) -> QueryHistory:
    """
    Creates a new query history entry.
    
    This is the original function name - keeping for backward compatibility.
    """
    return create_query_history(db, query_history_data, user_id)

def get_query_history_entry(db: Session, entry_id: int) -> QueryHistory | None:
    """Retrieves a specific query history entry by its ID."""
    try:
        return db.query(QueryHistory).filter(QueryHistory.id == entry_id).first()
    except Exception as e:
        logger.error(f"Error retrieving query history entry {entry_id}: {str(e)}")
        return None

def get_query_history_for_user(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> List[QueryHistory]:
    """Retrieves query history for a specific user with pagination."""
    try:
        return (
            db.query(QueryHistory)
            .filter(QueryHistory.user_id == user_id)
            .order_by(desc(QueryHistory.query_timestamp))
            .offset(skip)
            .limit(limit)
            .all()
        )
    except Exception as e:
        logger.error(f"Error retrieving query history for user {user_id}: {str(e)}")
        return []

def get_all_query_history(
    db: Session, skip: int = 0, limit: int = 100
) -> List[QueryHistory]:
    """Retrieves all query history entries with pagination (e.g., for admin purposes)."""
    try:
        return (
            db.query(QueryHistory)
            .order_by(desc(QueryHistory.query_timestamp))
            .offset(skip)
            .limit(limit)
            .all()
        )
    except Exception as e:
        logger.error(f"Error retrieving all query history: {str(e)}")
        return []

def get_query_history_count(db: Session, user_id: Optional[int] = None) -> int:
    """Get count of query history entries, optionally filtered by user."""
    try:
        query = db.query(QueryHistory)
        if user_id:
            query = query.filter(QueryHistory.user_id == user_id)
        return query.count()
    except Exception as e:
        logger.error(f"Error counting query history: {str(e)}")
        return 0

def delete_query_history_entry(db: Session, entry_id: int) -> bool:
    """Delete a specific query history entry."""
    try:
        entry = db.query(QueryHistory).filter(QueryHistory.id == entry_id).first()
        if entry:
            db.delete(entry)
            db.commit()
            logger.info(f"Deleted query history entry ID: {entry_id}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting query history entry {entry_id}: {str(e)}")
        db.rollback()
        return False

def get_recent_queries(db: Session, limit: int = 10) -> List[QueryHistory]:
    """Get the most recent query history entries."""
    try:
        return (
            db.query(QueryHistory)
            .order_by(desc(QueryHistory.query_timestamp))
            .limit(limit)
            .all()
        )
    except Exception as e:
        logger.error(f"Error retrieving recent queries: {str(e)}")
        return []
