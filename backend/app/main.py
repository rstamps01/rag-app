"""
Enhanced FastAPI Main Application
================================
"""

import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Sample queries data
sample_queries = [
    {
        "id": 1,
        "query": "What is VAST storage?",
        "response": "VAST Data is a leading storage company that provides high-performance, scalable storage solutions.",
        "timestamp": "2025-01-27T12:00:00Z",
        "response_time": 1.2
    },
    {
        "id": 2, 
        "query": "How does RAG work?",
        "response": "RAG (Retrieval-Augmented Generation) combines information retrieval with text generation.",
        "timestamp": "2025-01-27T12:05:00Z",
        "response_time": 0.8
    }
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting RAG Application...")
    yield
    logger.info("🛑 Shutting down RAG Application...")

# Create FastAPI app
app = FastAPI(
    title="RAG AI Application",
    description="A Retrieval-Augmented Generation application with real-time monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include WebSocket router with error handling
try:
    from app.api.routes.websocket_monitoring import router as websocket_router
    app.include_router(websocket_router, prefix="/api/v1", tags=["websocket"])
    logger.info("✅ WebSocket router included successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import WebSocket router: {e}")
except Exception as e:
    logger.error(f"❌ Error including WebSocket router: {e}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "RAG AI Application API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": "2025-01-27T12:00:00Z"}

@app.get("/api/v1/queries")
async def get_queries():
    """Get sample queries"""
    try:
        return {"queries": sample_queries}
    except Exception as e:
        logger.error(f"❌ Error getting queries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/query")
async def submit_query(query_data: dict):
    """Submit a new query"""
    try:
        query = query_data.get("query", "")
        if not query:
            raise HTTPException(status_code=400, detail="Query is required")
        
        # Mock response
        response = {
            "id": len(sample_queries) + 1,
            "query": query,
            "response": f"This is a response to: {query}",
            "timestamp": "2025-01-27T12:00:00Z",
            "response_time": 1.0
        }
        
        sample_queries.append(response)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/documents")
async def get_documents():
    """Get documents"""
    try:
        return {
            "documents": [
                {"id": 1, "title": "Sample Document", "content": "Sample content"}
            ]
        }
    except Exception as e:
        logger.error(f"❌ Error getting documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"❌ Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
