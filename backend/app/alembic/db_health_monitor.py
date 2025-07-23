from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db.session import SessionLocal
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health/database")
async def check_database_health() -> Dict[str, Any]:
    """
    Check database connectivity and basic functionality.
    
    Returns:
        Dictionary containing database health information
    """
    try:
        db = SessionLocal()
        try:
            # Test basic connectivity
            result = db.execute(text("SELECT 1")).scalar()
            
            # Test table access
            user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
            doc_count = db.execute(text("SELECT COUNT(*) FROM documents")).scalar()
            query_count = db.execute(text("SELECT COUNT(*) FROM query_history")).scalar()
            
            # Test write capability (rollback to avoid side effects)
            db.execute(text("BEGIN"))
            db.execute(text("CREATE TEMP TABLE test_write (id INTEGER)"))
            db.execute(text("ROLLBACK"))
            
            return {
                "status": "healthy",
                "connectivity": "ok",
                "tables_accessible": True,
                "write_capability": True,
                "statistics": {
                    "users": user_count,
                    "documents": doc_count,
                    "query_history": query_count
                }
            }
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "connectivity": "failed",
            "tables_accessible": False,
            "write_capability": False
        }

@router.get("/health/database/detailed")
async def detailed_database_health() -> Dict[str, Any]:
    """
    Detailed database health check including connection pool status.
    
    Returns:
        Detailed database health information
    """
    try:
        from app.db.session import engine
        
        pool = engine.pool
        
        return {
            "status": "healthy",
            "connection_pool": {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "invalid": pool.invalid()
            },
            "engine_info": {
                "url": str(engine.url).replace(engine.url.password, "***"),
                "dialect": str(engine.dialect.name),
                "driver": str(engine.dialect.driver)
            }
        }
        
    except Exception as e:
        logger.error(f"Detailed database health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database health check failed: {str(e)}")