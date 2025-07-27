"""
Minimal RAG Application Main - Reboot Cycle Fix Test
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test config import
try:
    from app.core.config import settings
    logger.info("✅ Config imported successfully")
    config_ok = True
except Exception as e:
    logger.error(f"❌ Config import failed: {e}")
    config_ok = False

# Create FastAPI app
app = FastAPI(
    title="RAG Application - Reboot Fix Test",
    version="0.1.0",
    description="Testing Pydantic v2 config fix"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "RAG Application - Reboot Cycle Fixed",
        "status": "running",
        "config_loaded": config_ok,
        "test_mode": True
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "config_status": "ok" if config_ok else "error",
        "test_mode": True
    }

@app.get("/config-test")
async def config_test():
    """Test config access"""
    if not config_ok:
        return {"error": "Config not loaded"}
    
    try:
        return {
            "api_v1_str": settings.API_V1_STR,
            "project_name": settings.PROJECT_NAME,
            "database_url": settings.DATABASE_URL[:50] + "...",  # Truncated for security
            "model_name": settings.MODEL_NAME,
            "config_test": "passed"
        }
    except Exception as e:
        return {"error": f"Config access failed: {e}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
