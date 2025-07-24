from fastapi import FastAPI, Depends, HTTPException, APIRouter, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import logging
import sys
import datetime

# Configure basic logging to output to stdout
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout
)

logger = logging.getLogger(__name__)

# --- Database Table Creation --- 
try:
    from app.db.base import Base, engine
    from app.models import models as db_models
    DATABASE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Database modules not available: {e}")
    DATABASE_AVAILABLE = False
    engine = None

def create_db_and_tables():
    """
    Create database tables if they don't exist.
    Uses SQLAlchemy's create_all method which is safe to call multiple times.
    """
    if not DATABASE_AVAILABLE:
        logger.warning("Database not available - skipping table creation")
        return
        
    logger.info("Creating database tables (if they don't exist)...")
    try:
        db_models.Base.metadata.create_all(bind=engine)
        logger.info("Database tables checked/created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}", exc_info=True)
        # Log the error but don't raise to allow app to start even with table issues

# Create FastAPI app
app = FastAPI(
    title="RAG AI Application API with Visual Monitoring", 
    version="1.1.0",
    description="Retrieval-Augmented Generation API with n8n.io-inspired visual pipeline monitoring",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
async def on_startup():
    """
    Startup event handler that runs when the application starts.
    Initializes database tables, monitoring system, and performs other startup tasks.
    """
    logger.info("Application startup: Initializing database...")
    create_db_and_tables()
    
    # Create necessary directories
    os.makedirs("/app/data/uploads", exist_ok=True)
    os.makedirs("/app/data/logs", exist_ok=True)
    os.makedirs("/app/models_cache", exist_ok=True)
    
    # Initialize monitoring components (optional - graceful degradation)
    try:
        # Try to initialize WebSocket manager if available
        try:
            from app.core.websocket_manager import websocket_manager
            if hasattr(websocket_manager, 'initialize'):
                await websocket_manager.initialize()
            logger.info("✅ WebSocket manager initialized successfully")
        except ImportError:
            logger.info("ℹ️  WebSocket manager not available - monitoring will work without real-time updates")
        except Exception as e:
            logger.warning(f"⚠️  WebSocket manager initialization failed: {e}")
        
        # Try to initialize enhanced pipeline monitoring if available
        try:
            from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor
            if hasattr(enhanced_pipeline_monitor, 'initialize'):
                await enhanced_pipeline_monitor.initialize()
            logger.info("✅ Enhanced pipeline monitoring initialized successfully")
        except ImportError:
            logger.info("ℹ️  Enhanced pipeline monitoring not available - using basic monitoring")
        except Exception as e:
            logger.warning(f"⚠️  Enhanced pipeline monitoring initialization failed: {e}")
        
        # Try to initialize enhanced query wrapper if available
        try:
            from app.services.enhanced_query_wrapper import enhanced_query_wrapper
            if hasattr(enhanced_query_wrapper, 'initialize'):
                await enhanced_query_wrapper.initialize()
            logger.info("✅ Enhanced query wrapper initialized successfully")
        except ImportError:
            logger.info("ℹ️  Enhanced query wrapper not available - using standard query processing")
        except Exception as e:
            logger.warning(f"⚠️  Enhanced query wrapper initialization failed: {e}")
            
    except Exception as e:
        logger.warning(f"⚠️  Monitoring system initialization failed: {e}")
        logger.info("ℹ️  Application will continue with basic functionality")
    
    logger.info("🚀 Application startup completed successfully")

@app.on_event("shutdown")
async def on_shutdown():
    """
    Shutdown event handler that runs when the application stops.
    Performs cleanup tasks for monitoring system and other components.
    """
    logger.info("Application shutdown: Stopping monitoring systems...")
    
    # Graceful shutdown of monitoring components
    try:
        # Stop enhanced pipeline monitoring if available
        try:
            from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor
            if hasattr(enhanced_pipeline_monitor, 'stop_monitoring'):
                await enhanced_pipeline_monitor.stop_monitoring()
            logger.info("✅ Enhanced pipeline monitoring stopped")
        except ImportError:
            pass
        except Exception as e:
            logger.error(f"❌ Error stopping pipeline monitoring: {e}")
        
        # Cleanup WebSocket manager if available
        try:
            from app.core.websocket_manager import websocket_manager
            if hasattr(websocket_manager, 'cleanup'):
                await websocket_manager.cleanup()
            logger.info("✅ WebSocket manager cleaned up")
        except ImportError:
            pass
        except Exception as e:
            logger.error(f"❌ Error cleaning up WebSocket manager: {e}")
            
    except Exception as e:
        logger.error(f"❌ Error during monitoring shutdown: {e}")
    
    logger.info("🛑 Application shutdown completed.")

# Configure CORS with monitoring-specific headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Pipeline-ID", "X-Processing-Time", "X-GPU-Utilization"]  # Monitoring headers
)

# Get API prefix (fallback to default if settings not available)
try:
    from app.core.config import settings
    API_V1_STR = settings.API_V1_STR
except ImportError:
    API_V1_STR = "/api/v1"
    logger.warning("Settings not available, using default API prefix: /api/v1")

# Include routers with graceful error handling
routers_to_include = [
    ("auth", "authentication"),
    ("documents", "documents"), 
    ("queries", "queries"),
    ("admin", "admin"),
    ("system", "system"),
    ("monitoring", "monitoring")
]

for router_name, tag in routers_to_include:
    try:
        module = __import__(f"app.api.routes.{router_name}", fromlist=[router_name])
        router = getattr(module, 'router')
        app.include_router(router, prefix=f"{API_V1_STR}/{router_name}", tags=[tag])
        logger.info(f"✅ {router_name.capitalize()} router included")
    except ImportError as e:
        logger.warning(f"⚠️  {router_name.capitalize()} router not available: {e}")
    except Exception as e:
        logger.error(f"❌ Error including {router_name} router: {e}")

# Include WebSocket monitoring router if available
try:
    from app.api.routes import monitoring_websocket
    app.include_router(
        monitoring_websocket.router, 
        prefix=f"{API_V1_STR}/monitoring", 
        tags=["websocket-monitoring"]
    )
    logger.info("✅ WebSocket monitoring routes included")
except ImportError:
    logger.info("ℹ️  WebSocket monitoring routes not available")
except Exception as e:
    logger.warning(f"⚠️  Failed to include WebSocket monitoring routes: {e}")

@app.get("/")
async def root():
    """
    Root endpoint that returns basic API information including monitoring status.
    """
    # Get monitoring status
    monitoring_status = "basic"
    monitoring_features = {
        "rtx5090_optimized": True,
        "real_time_monitoring": False,
        "visual_pipeline": False,
        "gpu_acceleration": True,
        "websocket_enabled": False
    }
    
    try:
        # Check if enhanced monitoring is available
        from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor
        if hasattr(enhanced_pipeline_monitor, 'get_health_status'):
            health = enhanced_pipeline_monitor.get_health_status()
            monitoring_status = health.get("status", "unknown")
            monitoring_features.update({
                "real_time_monitoring": True,
                "visual_pipeline": True,
                "websocket_enabled": True
            })
    except ImportError:
        pass
    except Exception as e:
        monitoring_status = "error"
    
    return {
        "message": "Welcome to RAG AI Application API with Visual Monitoring",
        "version": "1.1.0",
        "documentation": "/docs",
        "redoc": "/redoc",
        "monitoring": {
            "status": monitoring_status,
            "websocket_endpoint": f"{API_V1_STR}/monitoring/ws",
            "dashboard_url": "/monitoring"
        },
        "features": monitoring_features
    }

@app.get("/health")
async def health_check():
    """
    Enhanced health check endpoint that includes monitoring system status.
    Returns comprehensive status for monitoring and load balancers.
    """
    health_data = {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "database": "connected" if (DATABASE_AVAILABLE and engine) else "disconnected",
        "components": {}
    }
    
    # Check enhanced pipeline monitoring if available
    try:
        from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor
        if hasattr(enhanced_pipeline_monitor, 'get_health_status'):
            monitoring_health = enhanced_pipeline_monitor.get_health_status()
            health_data["components"]["pipeline_monitoring"] = {
                "status": "healthy",
                "details": monitoring_health
            }
        else:
            health_data["components"]["pipeline_monitoring"] = {
                "status": "basic",
                "message": "Enhanced monitoring available but not fully initialized"
            }
    except ImportError:
        health_data["components"]["pipeline_monitoring"] = {
            "status": "not_available",
            "message": "Enhanced monitoring not installed"
        }
    except Exception as e:
        health_data["components"]["pipeline_monitoring"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check WebSocket manager if available
    try:
        from app.core.websocket_manager import websocket_manager
        if hasattr(websocket_manager, 'get_health_status'):
            websocket_health = websocket_manager.get_health_status()
            health_data["components"]["websocket_manager"] = {
                "status": "healthy",
                "active_connections": websocket_health.get("active_connections", 0),
                "total_messages": websocket_health.get("total_messages", 0)
            }
        else:
            health_data["components"]["websocket_manager"] = {
                "status": "basic",
                "message": "WebSocket manager available but not fully initialized"
            }
    except ImportError:
        health_data["components"]["websocket_manager"] = {
            "status": "not_available",
            "message": "WebSocket manager not installed"
        }
    except Exception as e:
        health_data["components"]["websocket_manager"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check enhanced query wrapper if available
    try:
        from app.services.enhanced_query_wrapper import enhanced_query_wrapper
        if hasattr(enhanced_query_wrapper, 'get_health_status'):
            wrapper_health = enhanced_query_wrapper.get_health_status()
            health_data["components"]["query_wrapper"] = {
                "status": "healthy" if wrapper_health.get("initialized") else "initializing",
                "details": wrapper_health
            }
        else:
            health_data["components"]["query_wrapper"] = {
                "status": "basic",
                "message": "Enhanced query wrapper available but not fully initialized"
            }
    except ImportError:
        health_data["components"]["query_wrapper"] = {
            "status": "not_available",
            "message": "Enhanced query wrapper not installed"
        }
    except Exception as e:
        health_data["components"]["query_wrapper"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Determine overall status
    component_statuses = [comp.get("status") for comp in health_data["components"].values()]
    if "error" in component_statuses:
        health_data["status"] = "degraded"
    elif "initializing" in component_statuses:
        health_data["status"] = "starting"
    
    return health_data

@app.get("/monitoring/status")
async def monitoring_status():
    """
    Dedicated endpoint for monitoring system status.
    Provides detailed information about the visual monitoring system.
    """
    try:
        # Check if monitoring components are available
        monitoring_available = False
        pipeline_status = {"status": "not_available"}
        websocket_status = {"status": "not_available"}
        wrapper_status = {"status": "not_available"}
        
        try:
            from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor
            if hasattr(enhanced_pipeline_monitor, 'get_health_status'):
                pipeline_status = enhanced_pipeline_monitor.get_health_status()
                monitoring_available = True
        except ImportError:
            pass
        
        try:
            from app.core.websocket_manager import websocket_manager
            if hasattr(websocket_manager, 'get_health_status'):
                websocket_status = websocket_manager.get_health_status()
        except ImportError:
            pass
        
        try:
            from app.services.enhanced_query_wrapper import enhanced_query_wrapper
            if hasattr(enhanced_query_wrapper, 'get_health_status'):
                wrapper_status = enhanced_query_wrapper.get_health_status()
        except ImportError:
            pass
        
        return {
            "monitoring_system": {
                "status": "operational" if monitoring_available else "basic",
                "version": "1.1.0",
                "features": [
                    "Real-time pipeline visualization" if monitoring_available else "Basic monitoring",
                    "WebSocket-powered updates" if websocket_status.get("status") != "not_available" else "HTTP polling",
                    "Interactive node debugging" if monitoring_available else "Log-based debugging",
                    "GPU performance monitoring",
                    "Dark/light theme support" if monitoring_available else "Standard interface"
                ]
            },
            "pipeline_monitor": pipeline_status,
            "websocket_manager": websocket_status,
            "query_wrapper": wrapper_status,
            "endpoints": {
                "websocket": f"{API_V1_STR}/monitoring/ws" if websocket_status.get("status") != "not_available" else "not_available",
                "metrics": f"{API_V1_STR}/monitoring/metrics",
                "pipeline": f"{API_V1_STR}/monitoring/pipeline",
                "health": f"{API_V1_STR}/monitoring/health"
            }
        }
    except Exception as e:
        logger.error(f"Error getting monitoring status: {e}")
        return {
            "monitoring_system": {
                "status": "error",
                "error": str(e)
            }
        }

# Add middleware for monitoring headers
@app.middleware("http")
async def add_monitoring_headers(request, call_next):
    """
    Middleware to add monitoring-related headers to responses.
    """
    response = await call_next(request)
    
    # Add monitoring system identifier
    response.headers["X-Monitoring-System"] = "RAG-Visual-Monitor-v1.1.0"
    response.headers["X-GPU-Optimized"] = "RTX-5090"
    
    # Add CORS headers for WebSocket connections
    if request.url.path.startswith("/api/v1/monitoring"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

if __name__ == "__main__":
    import uvicorn
    
    # Enhanced startup message
    print("🚀 Starting RAG AI Application with Visual Monitoring System")
    print("📊 Features: Real-time pipeline visualization, GPU monitoring, WebSocket updates")
    print("🎨 Interface: n8n.io-inspired visual design with dark/light themes")
    print("⚡ Optimized for: NVIDIA RTX 5090 GPU acceleration")
    print("ℹ️  Note: Monitoring features will auto-enable if components are available")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
