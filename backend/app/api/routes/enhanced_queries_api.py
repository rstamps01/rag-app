"""
Enhanced Queries API Routes
Provides query processing with LLM and vector database integration
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import time
import logging
from datetime import datetime

from app.db.session import get_db
from app.models.models import QueryHistory, User
from app.services.enhanced_llm_service import enhanced_llm_service
from app.services.enhanced_vector_db import enhanced_vector_db_service
from app.core.config import settings
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class QueryRequest(BaseModel):
    query: str
    department: Optional[str] = "General"
    use_llm: bool = True
    use_vector_search: bool = True
    max_context_chunks: int = 3
    temperature: float = 0.7

class QueryResponse(BaseModel):
    response: str
    model: str
    timestamp: float
    query_id: Optional[str] = None
    processing_time: Optional[float] = None
    sources: Optional[List[Dict[str, Any]]] = None
    used_llm: bool = False
    used_vector_search: bool = False
    context_chunks: int = 0
    tokens_per_second: Optional[float] = None

class QueryHistoryItem(BaseModel):
    id: int
    query: str
    response: str
    department: str
    timestamp: float
    model: str
    processing_time: Optional[float] = None
    used_llm: bool = False
    used_vector_search: bool = False

@router.post("/ask")
async def ask_query(
    request: QueryRequest,
    db: Session = Depends(get_db)
):
    """Process a query with LLM and vector search integration"""
    start_time = time.time()
    logger.info(f"Query received: '{request.query[:100]}...' (dept: {request.department})")
    
    response_text = ""
    sources = []
    used_llm = False
    used_vector_search = False
    context_chunks = 0
    tokens_per_second = None
    
    try:
        # Step 1: Vector search for relevant context (if enabled)
        context = ""
        if request.use_vector_search and enhanced_vector_db_service.is_available():
            try:
                logger.info("🔍 Performing vector search...")
                
                # Search for relevant documents
                search_results = enhanced_vector_db_service.search(
                    query=request.query,
                    limit=request.max_context_chunks,
                    department=request.department if request.department != "General" else None,
                    score_threshold=0.6
                )
                
                if search_results:
                    # Build context from search results
                    context_parts = []
                    for result in search_results:
                        context_parts.append(f"[{result['filename']}]: {result['content']}")
                        sources.append({
                            "document_id": result["document_id"],
                            "filename": result["filename"],
                            "content_snippet": result["content"][:200] + "..." if len(result["content"]) > 200 else result["content"],
                            "relevance_score": result["score"],
                            "chunk_index": result["chunk_index"]
                        })
                    
                    context = "\n\n".join(context_parts)
                    context_chunks = len(search_results)
                    used_vector_search = True
                    
                    logger.info(f"✅ Vector search completed: {len(search_results)} relevant chunks found")
                else:
                    logger.info("ℹ️  No relevant documents found in vector search")
                    
            except Exception as e:
                logger.error(f"❌ Vector search failed: {e}")
        
        # Step 2: Generate response with LLM (if enabled)
        if request.use_llm and enhanced_llm_service.is_available():
            try:
                logger.info("🤖 Generating LLM response...")
                
                # Generate response with context
                llm_result = enhanced_llm_service.generate_response(
                    query=request.query,
                    context=context,
                    max_length=512,
                    temperature=request.temperature
                )
                
                if llm_result and llm_result.get("response"):
                    response_text = llm_result["response"]
                    tokens_per_second = llm_result.get("tokens_per_second")
                    used_llm = True
                    logger.info(f"✅ LLM response generated ({llm_result.get('tokens_per_second', 0):.1f} tokens/s)")
                else:
                    raise Exception("LLM returned empty response")
                    
            except Exception as e:
                logger.error(f"❌ LLM generation failed: {e}")
                # Fallback to contextual response
                if context:
                    response_text = f"Based on the available documents, here's what I found regarding '{request.query}':\n\n{context[:500]}..."
                else:
                    response_text = f"I understand you're asking about: '{request.query}'. While I'm currently unable to access the full LLM capabilities, this appears to be a question about {request.department.lower() if request.department != 'General' else 'general'} topics."
        
        # Step 3: Fallback response if no LLM
        if not response_text:
            if context:
                response_text = f"Based on the available documents regarding '{request.query}':\n\n{context[:800]}..."
                if len(context) > 800:
                    response_text += "\n\n[Additional context available in source documents]"
            elif "vast" in request.query.lower():
                response_text = f"Regarding your question about '{request.query}': VAST Data provides enterprise-grade storage solutions with high performance and scalability. The system is configured to provide detailed responses about VAST storage technologies, architecture, and implementation strategies."
            else:
                response_text = f"Thank you for your question: '{request.query}'. The RAG system is operational and ready to provide comprehensive responses. The backend services are properly configured for {request.department} department queries."
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Store query in database
        query_id = f"query-{int(time.time())}"
        try:
            query_record = QueryHistory(
                query_text=request.query,
                response_text=response_text,
                llm_model_used=settings.LLM_MODEL_NAME if hasattr(settings, 'LLM_MODEL_NAME') else "mistralai/Mistral-7B-Instruct-v0.2",
                processing_time_ms=int(processing_time * 1000),
                department_filter=request.department,
                gpu_accelerated=used_llm,
                context_chunks_used=context_chunks,
                vector_search_used=used_vector_search
            )
            db.add(query_record)
            db.commit()
            db.refresh(query_record)
            query_id = f"query-{query_record.id}"
            logger.info(f"✅ Query stored in database with ID: {query_record.id}")
        except Exception as e:
            logger.error(f"❌ Failed to store query in database: {e}")
        
        return QueryResponse(
            response=response_text,
            model=settings.LLM_MODEL_NAME if hasattr(settings, 'LLM_MODEL_NAME') else "mistralai/Mistral-7B-Instruct-v0.2",
            timestamp=time.time(),
            query_id=query_id,
            processing_time=processing_time,
            sources=sources,
            used_llm=used_llm,
            used_vector_search=used_vector_search,
            context_chunks=context_chunks,
            tokens_per_second=tokens_per_second
        )
        
    except Exception as e:
        logger.error(f"❌ Query processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Query processing failed: {str(e)}"
        )

@router.get("/history")
async def get_query_history(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get query history with filtering and pagination"""
    try:
        logger.info(f"Query history requested: limit={limit}, skip={skip}, department={department}")
        
        # Build query
        query = db.query(QueryHistory)
        
        # Apply department filter
        if department:
            query = query.filter(QueryHistory.department_filter == department)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        queries = query.order_by(QueryHistory.query_timestamp.desc()).offset(skip).limit(limit).all()
        
        # Format response
        query_list = []
        for query_record in queries:
            query_list.append({
                "id": query_record.id,
                "query": query_record.query_text,
                "response": query_record.response_text,
                "department": query_record.department_filter or "General",
                "timestamp": query_record.query_timestamp.timestamp() if query_record.query_timestamp else time.time(),
                "model": query_record.llm_model_used or "mistralai/Mistral-7B-Instruct-v0.2",
                "processing_time": query_record.processing_time_ms / 1000.0 if query_record.processing_time_ms else None,
                "used_llm": query_record.gpu_accelerated or False,
                "used_vector_search": query_record.vector_search_used or False,
                "context_chunks": query_record.context_chunks_used or 0
            })
        
        return {
            "queries": query_list,
            "total": total,
            "limit": limit,
            "skip": skip,
            "department_filter": department,
            "source": "database"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get query history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve query history: {str(e)}")

@router.get("/history/{query_id}")
async def get_query_details(
    query_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific query"""
    try:
        # Extract numeric ID from query_id
        if query_id.startswith("query-"):
            numeric_id = int(query_id.replace("query-", ""))
        else:
            numeric_id = int(query_id)
        
        query_record = db.query(QueryHistory).filter(QueryHistory.id == numeric_id).first()
        if not query_record:
            raise HTTPException(status_code=404, detail="Query not found")
        
        return {
            "id": query_record.id,
            "query": query_record.query_text,
            "response": query_record.response_text,
            "department": query_record.department_filter,
            "timestamp": query_record.query_timestamp.isoformat() if query_record.query_timestamp else None,
            "model": query_record.llm_model_used,
            "processing_time_ms": query_record.processing_time_ms,
            "gpu_accelerated": query_record.gpu_accelerated,
            "vector_search_used": query_record.vector_search_used,
            "context_chunks_used": query_record.context_chunks_used,
            "user_id": query_record.user_id
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid query ID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get query details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve query details: {str(e)}")

@router.delete("/history/{query_id}")
async def delete_query(
    query_id: str,
    db: Session = Depends(get_db)
):
    """Delete a query from history"""
    try:
        # Extract numeric ID from query_id
        if query_id.startswith("query-"):
            numeric_id = int(query_id.replace("query-", ""))
        else:
            numeric_id = int(query_id)
        
        query_record = db.query(QueryHistory).filter(QueryHistory.id == numeric_id).first()
        if not query_record:
            raise HTTPException(status_code=404, detail="Query not found")
        
        db.delete(query_record)
        db.commit()
        
        logger.info(f"Query {query_id} deleted successfully")
        
        return {
            "success": True,
            "message": "Query deleted successfully",
            "query_id": query_id
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid query ID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete query: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete query: {str(e)}")

@router.get("/stats/overview")
async def get_query_stats(db: Session = Depends(get_db)):
    """Get query statistics and analytics"""
    try:
        total_queries = db.query(QueryHistory).count()
        llm_queries = db.query(QueryHistory).filter(QueryHistory.gpu_accelerated == True).count()
        vector_queries = db.query(QueryHistory).filter(QueryHistory.vector_search_used == True).count()
        
        # Get department breakdown
        department_stats = db.query(
            QueryHistory.department_filter,
            db.func.count(QueryHistory.id).label('count')
        ).group_by(QueryHistory.department_filter).all()
        
        # Get average processing time
        avg_processing_time = db.query(
            db.func.avg(QueryHistory.processing_time_ms)
        ).scalar() or 0
        
        # Get recent activity (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = datetime.now() - timedelta(days=1)
        recent_queries = db.query(QueryHistory).filter(
            QueryHistory.query_timestamp >= yesterday
        ).count()
        
        return {
            "total_queries": total_queries,
            "llm_queries": llm_queries,
            "vector_search_queries": vector_queries,
            "recent_queries_24h": recent_queries,
            "average_processing_time_ms": round(avg_processing_time, 2),
            "department_breakdown": [
                {"department": dept or "General", "count": count} 
                for dept, count in department_stats
            ],
            "service_status": {
                "llm_available": enhanced_llm_service.is_available(),
                "vector_db_available": enhanced_vector_db_service.is_available()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get query stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve statistics: {str(e)}")

@router.post("/search")
async def search_queries(
    search_term: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Search through query history"""
    try:
        # Search in both query text and response text
        queries = db.query(QueryHistory).filter(
            db.or_(
                QueryHistory.query_text.ilike(f"%{search_term}%"),
                QueryHistory.response_text.ilike(f"%{search_term}%")
            )
        ).order_by(QueryHistory.query_timestamp.desc()).limit(limit).all()
        
        results = []
        for query_record in queries:
            results.append({
                "id": query_record.id,
                "query": query_record.query_text,
                "response": query_record.response_text[:200] + "..." if len(query_record.response_text) > 200 else query_record.response_text,
                "department": query_record.department_filter,
                "timestamp": query_record.query_timestamp.timestamp() if query_record.query_timestamp else time.time(),
                "relevance": "query" if search_term.lower() in query_record.query_text.lower() else "response"
            })
        
        return {
            "search_term": search_term,
            "results": results,
            "total_found": len(results),
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Query search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

