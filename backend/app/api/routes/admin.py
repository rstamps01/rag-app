"""
Admin API Routes for Bulk Operations and Cleanup
Provides administrative functions for managing the RAG application
"""

import os
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.models import Document, QueryHistory
from app.core.config import settings

# Vector database imports
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import FilterSelector, Filter, FieldCondition, MatchValue
    vector_db_available = True
except ImportError:
    vector_db_available = False

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Qdrant client
qdrant_client = None
if vector_db_available:
    try:
        qdrant_client = QdrantClient(url="http://qdrant-07:6333")
        logger.info("✅ Admin Qdrant client initialized")
    except Exception as e:
        logger.warning(f"⚠️ Failed to initialize admin Qdrant client: {e}")
        qdrant_client = None

@router.get("/health")
async def admin_health():
    """Check admin service health"""
    return {
        "status": "healthy",
        "vector_db_available": vector_db_available,
        "qdrant_connected": qdrant_client is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/cleanup/test-queries")
async def cleanup_test_queries(
    days_old: int = Query(7, description="Delete queries older than X days"),
    pattern: str = Query("test", description="Pattern to match in queries"),
    dry_run: bool = Query(False, description="Preview changes without executing"),
    db: Session = Depends(get_db)
):
    """Clean up test queries from query history"""
    try:
        # Calculate cutoff date
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Find matching queries
        query_filter = and_(
            QueryHistory.query_timestamp < cutoff_date,
            or_(
                QueryHistory.query_text.ilike(f"%{pattern}%"),
                QueryHistory.response_text.ilike(f"%{pattern}%")
            )
        )
        
        matching_queries = db.query(QueryHistory).filter(query_filter).all()
        
        if dry_run:
            return {
                "action": "dry_run",
                "queries_found": len(matching_queries),
                "cutoff_date": cutoff_date.isoformat(),
                "pattern": pattern,
                "sample_queries": [
                    {
                        "id": q.id,
                        "query": q.query_text[:100] + "..." if len(q.query_text) > 100 else q.query_text,
                        "timestamp": q.query_timestamp.isoformat()
                    } for q in matching_queries[:10]
                ]
            }
        
        # Delete matching queries
        deleted_count = db.query(QueryHistory).filter(query_filter).delete()
        db.commit()
        
        logger.info(f"Admin: Deleted {deleted_count} test queries")
        
        return {
            "action": "cleanup_completed",
            "queries_deleted": deleted_count,
            "cutoff_date": cutoff_date.isoformat(),
            "pattern": pattern
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up test queries: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup test queries: {str(e)}")

@router.post("/cleanup/old-queries")
async def cleanup_old_queries(
    days_old: int = Query(30, description="Delete queries older than X days"),
    dry_run: bool = Query(False, description="Preview changes without executing"),
    db: Session = Depends(get_db)
):
    """Clean up old queries from query history"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        if dry_run:
            count = db.query(QueryHistory).filter(QueryHistory.query_timestamp < cutoff_date).count()
            return {
                "action": "dry_run",
                "queries_found": count,
                "cutoff_date": cutoff_date.isoformat()
            }
        
        deleted_count = db.query(QueryHistory).filter(QueryHistory.query_timestamp < cutoff_date).delete()
        db.commit()
        
        logger.info(f"Admin: Deleted {deleted_count} old queries")
        
        return {
            "action": "cleanup_completed",
            "queries_deleted": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up old queries: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup old queries: {str(e)}")

@router.delete("/documents/bulk")
async def bulk_delete_documents(
    document_ids: List[str],
    dry_run: bool = Query(False, description="Preview changes without executing"),
    db: Session = Depends(get_db)
):
    """Bulk delete multiple documents"""
    try:
        if not document_ids:
            raise HTTPException(status_code=400, detail="No document IDs provided")
        
        # Find documents
        documents = db.query(Document).filter(Document.id.in_(document_ids)).all()
        found_ids = [doc.id for doc in documents]
        missing_ids = [doc_id for doc_id in document_ids if doc_id not in found_ids]
        
        if dry_run:
            return {
                "action": "dry_run",
                "documents_found": len(documents),
                "documents_missing": len(missing_ids),
                "found_document_ids": found_ids,
                "missing_document_ids": missing_ids,
                "documents_preview": [
                    {
                        "id": doc.id,
                        "filename": doc.filename,
                        "path": doc.path,
                        "created_at": doc.created_at.isoformat() if doc.created_at else None
                    } for doc in documents
                ]
            }
        
        # Delete from vector database
        vector_deleted = 0
        if qdrant_client is not None:
            for doc_id in found_ids:
                try:
                    qdrant_client.delete(
                        collection_name=settings.QDRANT_COLLECTION_NAME,
                        points_selector=FilterSelector(
                            filter=Filter(
                                must=[
                                    FieldCondition(
                                        key="document_id",
                                        match=MatchValue(value=doc_id)
                                    )
                                ]
                            )
                        )
                    )
                    vector_deleted += 1
                    logger.info(f"Admin: Removed document {doc_id} from vector database")
                except Exception as e:
                    logger.warning(f"Admin: Failed to remove document {doc_id} from vector database: {e}")
        
        # Delete physical files
        files_deleted = 0
        for doc in documents:
            if doc.path and os.path.exists(doc.path):
                try:
                    os.remove(doc.path)
                    files_deleted += 1
                    logger.info(f"Admin: Deleted file: {doc.path}")
                except Exception as e:
                    logger.warning(f"Admin: Failed to delete file {doc.path}: {e}")
        
        # Delete from database
        db_deleted = db.query(Document).filter(Document.id.in_(found_ids)).delete()
        db.commit()
        
        logger.info(f"Admin: Bulk deleted {db_deleted} documents")
        
        return {
            "action": "bulk_delete_completed",
            "documents_requested": len(document_ids),
            "documents_found": len(documents),
            "documents_missing": missing_ids,
            "database_deleted": db_deleted,
            "vector_deleted": vector_deleted,
            "files_deleted": files_deleted
        }
        
    except Exception as e:
        logger.error(f"Error in bulk document deletion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to bulk delete documents: {str(e)}")

@router.get("/orphans/detect")
async def detect_orphans(db: Session = Depends(get_db)):
    """Detect orphaned content in databases"""
    try:
        orphan_report = {
            "timestamp": datetime.utcnow().isoformat(),
            "postgres_orphans": [],
            "qdrant_orphans": [],
            "file_orphans": []
        }
        
        # Check PostgreSQL for documents without files
        documents = db.query(Document).all()
        for doc in documents:
            if doc.path and not os.path.exists(doc.path):
                orphan_report["file_orphans"].append({
                    "type": "missing_file",
                    "document_id": doc.id,
                    "filename": doc.filename,
                    "expected_path": doc.path
                })
        
        # Check for files without database records
        upload_dir = "/app/data/uploads"
        if os.path.exists(upload_dir):
            for filename in os.listdir(upload_dir):
                file_path = os.path.join(upload_dir, filename)
                if os.path.isfile(file_path):
                    # Check if file has corresponding database record
                    doc_exists = db.query(Document).filter(Document.path == file_path).first()
                    if not doc_exists:
                        orphan_report["file_orphans"].append({
                            "type": "orphaned_file",
                            "filename": filename,
                            "path": file_path,
                            "size_bytes": os.path.getsize(file_path)
                        })
        
        # Check Qdrant for orphaned vectors
        if qdrant_client is not None:
            try:
                # Get all document IDs from database
                db_doc_ids = set(doc.id for doc in documents)
                
                # Use pagination to get ALL points, not just first 1000
                next_page_offset = None
                batch_size = 1000
                total_scanned = 0
                
                while True:
                    # Scroll with pagination
                    scroll_params = {
                        "collection_name": "rag",
                        "limit": batch_size,
                        "with_payload": True
                    }
                    
                    if next_page_offset is not None:
                        scroll_params["offset"] = next_page_offset
                    
                    search_results = qdrant_client.scroll(**scroll_params)
                    points, next_page_offset = search_results
                    
                    # Check each point for orphaned status
                    for point in points:
                        total_scanned += 1
                        doc_id = point.payload.get("document_id")
                        if doc_id and doc_id not in db_doc_ids:
                            orphan_report["qdrant_orphans"].append({
                                "type": "orphaned_vector",
                                "document_id": doc_id,
                                "point_id": point.id,
                                "chunk_index": point.payload.get("chunk_index", 0)
                            })
                    
                    # If no more pages, break
                    if next_page_offset is None or len(points) == 0:
                        break
                    
                    logger.debug(f"Admin: Scanned {total_scanned} points, found {len(orphan_report['qdrant_orphans'])} orphans so far")
                
                logger.info(f"Admin: Orphan detection complete - scanned {total_scanned} points, found {len(orphan_report['qdrant_orphans'])} orphaned vectors")
                        
            except Exception as e:
                logger.warning(f"Error checking Qdrant orphans: {e}")
                orphan_report["qdrant_orphans"] = [{"error": str(e)}]
        
        return orphan_report
        
    except Exception as e:
        logger.error(f"Error detecting orphans: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to detect orphans: {str(e)}")

@router.post("/orphans/cleanup")
async def cleanup_orphans(
    cleanup_files: bool = Query(True, description="Clean up orphaned files"),
    cleanup_vectors: bool = Query(True, description="Clean up orphaned vectors"),
    dry_run: bool = Query(False, description="Preview changes without executing"),
    db: Session = Depends(get_db)
):
    """Clean up orphaned content"""
    try:
        cleanup_report = {
            "action": "dry_run" if dry_run else "cleanup_completed",
            "timestamp": datetime.utcnow().isoformat(),
            "files_cleaned": 0,
            "vectors_cleaned": 0,
            "errors": []
        }
        
        if cleanup_files:
            # Clean up orphaned files
            upload_dir = "/app/data/uploads"
            if os.path.exists(upload_dir):
                for filename in os.listdir(upload_dir):
                    file_path = os.path.join(upload_dir, filename)
                    if os.path.isfile(file_path):
                        doc_exists = db.query(Document).filter(Document.path == file_path).first()
                        if not doc_exists:
                            if not dry_run:
                                try:
                                    os.remove(file_path)
                                    cleanup_report["files_cleaned"] += 1
                                    logger.info(f"Admin: Cleaned up orphaned file: {file_path}")
                                except Exception as e:
                                    cleanup_report["errors"].append(f"Failed to delete {file_path}: {e}")
                            else:
                                cleanup_report["files_cleaned"] += 1
        
        if cleanup_vectors and qdrant_client is not None:
            # Clean up orphaned vectors
            try:
                db_doc_ids = set(doc.id for doc in db.query(Document).all())
                
                # Use pagination to get ALL orphaned points, not just first 1000
                orphaned_point_ids = []
                next_page_offset = None
                batch_size = 1000
                total_scanned = 0
                
                while True:
                    # Scroll with pagination
                    scroll_params = {
                        "collection_name": "rag",
                        "limit": batch_size,
                        "with_payload": True
                    }
                    
                    if next_page_offset is not None:
                        scroll_params["offset"] = next_page_offset
                    
                    search_results = qdrant_client.scroll(**scroll_params)
                    points, next_page_offset = search_results
                    
                    # Check each point for orphaned status
                    for point in points:
                        total_scanned += 1
                        doc_id = point.payload.get("document_id")
                        if doc_id and doc_id not in db_doc_ids:
                            orphaned_point_ids.append(point.id)
                    
                    # If no more pages, break
                    if next_page_offset is None or len(points) == 0:
                        break
                    
                    logger.info(f"Admin: Scanned {total_scanned} points, found {len(orphaned_point_ids)} orphans so far")
                
                logger.info(f"Admin: Total orphaned vectors found: {len(orphaned_point_ids)} (scanned {total_scanned} total points)")
                
                if orphaned_point_ids and not dry_run:
                    # Delete orphaned points in batches (Qdrant has limits on batch size)
                    batch_delete_size = 1000
                    total_deleted = 0
                    
                    for i in range(0, len(orphaned_point_ids), batch_delete_size):
                        batch = orphaned_point_ids[i:i + batch_delete_size]
                        try:
                            # Delete points by ID - Qdrant accepts list of point IDs directly
                            # points_selector can be: List[point_ids] or FilterSelector
                            qdrant_client.delete(
                                collection_name=settings.QDRANT_COLLECTION_NAME,
                                points_selector=batch
                            )
                            total_deleted += len(batch)
                            logger.info(f"Admin: Deleted batch of {len(batch)} orphaned vectors ({total_deleted}/{len(orphaned_point_ids)})")
                        except Exception as batch_error:
                            error_msg = f"Failed to delete batch {i//batch_delete_size + 1}: {batch_error}"
                            logger.error(f"Admin: {error_msg}")
                            cleanup_report["errors"].append(error_msg)
                    
                    cleanup_report["vectors_cleaned"] = total_deleted
                    logger.info(f"Admin: Successfully cleaned up {total_deleted} orphaned vectors")
                elif orphaned_point_ids:
                    cleanup_report["vectors_cleaned"] = len(orphaned_point_ids)
                    logger.info(f"Admin: Dry run - would clean up {len(orphaned_point_ids)} orphaned vectors")
                    
            except Exception as e:
                error_msg = f"Failed to cleanup vectors: {e}"
                logger.error(f"Admin: {error_msg}")
                cleanup_report["errors"].append(error_msg)
        
        return cleanup_report
        
    except Exception as e:
        logger.error(f"Error cleaning up orphans: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup orphans: {str(e)}")

@router.get("/stats/overview")
async def admin_stats_overview(db: Session = Depends(get_db)):
    """Get comprehensive admin statistics"""
    try:
        stats = {
            "timestamp": datetime.utcnow().isoformat(),
            "documents": {
                "total": db.query(Document).count(),
                "with_files": db.query(Document).filter(Document.path.isnot(None)).count(),
                "processed": db.query(Document).filter(
                    Document.status.in_(["completed", "processed"])
                ).count(),
                "vector_stored": db.query(Document).filter(
                    Document.status.in_(["completed", "processed"])
                ).count()  # Alias for frontend compatibility
            },
            "queries": {
                "total": db.query(QueryHistory).count(),
                "last_24h": db.query(QueryHistory).filter(
                    QueryHistory.query_timestamp >= datetime.utcnow() - timedelta(days=1)
                ).count(),
                "last_7d": db.query(QueryHistory).filter(
                    QueryHistory.query_timestamp >= datetime.utcnow() - timedelta(days=7)
                ).count()
            },
            "vector_db": {
                "available": vector_db_available,
                "connected": qdrant_client is not None
            }
        }
        
        # Get Qdrant collection info if available
        # Use direct HTTP request to avoid Pydantic validation errors with Qdrant client
        if qdrant_client is not None:
            try:
                import requests
                qdrant_url = getattr(settings, 'QDRANT_URL', 'http://qdrant-07:6333')
                collection_name = getattr(settings, 'QDRANT_COLLECTION_NAME', 'rag')
                
                # Use direct HTTP request instead of client.get_collection() to avoid Pydantic validation issues
                response = requests.get(f"{qdrant_url}/collections/{collection_name}", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    result = data.get('result', {})
                    stats["vector_db"]["points_count"] = result.get('points_count', 0)
                    stats["vector_db"]["status"] = result.get('status', 'unknown')
                    stats["vector_db"]["connected"] = True
                else:
                    stats["vector_db"]["error"] = f"HTTP {response.status_code}: {response.text[:100]}"
                    stats["vector_db"]["connected"] = True
                    stats["vector_db"]["points_count"] = None
                    stats["vector_db"]["status"] = "error"
            except Exception as e:
                logger.warning(f"Error getting Qdrant collection info: {e}")
                stats["vector_db"]["error"] = str(e)[:200]  # Truncate long error messages
                stats["vector_db"]["connected"] = True  # Client is initialized, just collection query failed
                stats["vector_db"]["points_count"] = None
                stats["vector_db"]["status"] = "error"
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get admin stats: {str(e)}")