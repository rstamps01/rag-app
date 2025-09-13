# Monitoring Integration Fix - Implementation Plan

## 🎯 **SOLUTION OVERVIEW**

Based on the label mismatch analysis, I recommend **fixing the backend WebSocket data structure** to match frontend expectations. This approach is cleaner and more maintainable than updating the frontend transformation logic.

## 🔧 **IMPLEMENTATION PLAN**

### **Phase 1: Fix Backend WebSocket Data Structure**

#### **1.1 Update WebSocket Monitoring Route**
File: `backend/app/api/routes/websocket_monitoring.py`

**Current Issues:**
- Wrong field names (cpu_usage vs cpu_percent)
- Wrong data structures (GPU object vs array)
- Missing required fields
- Inconsistent naming conventions

**Required Changes:**

```python
def collect_metrics(self) -> Dict[str, Any]:
    """Collect system and GPU metrics with corrected field names"""
    system_metrics = self._get_system_metrics()
    gpu_metrics = self._get_gpu_metrics()
    pipeline_metrics = self._get_pipeline_metrics()  # Renamed from query_metrics
    connection_status = self._get_connection_status()
    
    return {
        "system_health": system_metrics,
        "gpu_performance": gpu_metrics,
        "pipeline_status": pipeline_metrics,  # Changed from query_performance
        "connection_status": connection_status,
    }

@staticmethod
def _get_system_metrics() -> Dict[str, Any]:
    """Retrieve CPU and memory metrics with correct field names"""
    cpu_percent: float = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    memory_percent: float = mem.percent
    memory_available_gb = round(mem.available / (1024**3), 2)
    
    return {
        "cpu_percent": round(cpu_percent, 2),           # Fixed: cpu_usage → cpu_percent
        "memory_percent": round(memory_percent, 2),     # Fixed: memory_usage → memory_percent
        "memory_available": f"{memory_available_gb}GB"  # Added: missing field
    }

@staticmethod
def _get_gpu_metrics() -> Dict[str, Any]:
    """Retrieve GPU metrics in array format with correct field names"""
    # ... existing GPU detection logic ...
    
    # Return as array format (frontend expects array)
    return [{
        "utilization": gpu_utilization,      # Fixed: gpu_utilization → utilization
        "memory_used": memory_used,          # Fixed: gpu_memory_used → memory_used
        "memory_total": memory_total,        # Fixed: gpu_memory_total → memory_total
        "temperature": temperature           # Already correct
    }]

@staticmethod
def _get_pipeline_metrics() -> Dict[str, Any]:
    """Pipeline metrics with correct field names"""
    return {
        "queries_per_minute": 0,
        "avg_response_time": 0.0,            # Fixed: average_response_time_ms → avg_response_time
        "active_queries": 0,
    }

@staticmethod
def _get_connection_status() -> Dict[str, str]:
    """Connection status with correct field names"""
    return {
        "backend_status": "connected",       # Fixed: backend → backend_status
        "database_status": "connected",      # Fixed: database → database_status
        "vector_db_status": "connected",     # Fixed: vector_db → vector_db_status
        "websocket_connections": len(manager.clients)  # Added: missing field
    }
```

#### **1.2 Integrate Real Pipeline Monitoring**
Connect WebSocket to actual pipeline monitor data:

```python
def collect_metrics(self) -> Dict[str, Any]:
    """Collect real metrics from pipeline monitor"""
    # Get real pipeline data
    pipeline_data = enhanced_pipeline_monitor.get_pipeline_flow_state()
    
    system_metrics = self._get_system_metrics()
    gpu_metrics = self._get_gpu_metrics()
    
    # Use real pipeline metrics instead of placeholders
    pipeline_metrics = {
        "queries_per_minute": pipeline_data['system_metrics'].get('queries_per_minute', 0),
        "avg_response_time": pipeline_data['system_metrics'].get('avg_response_time', 0),
        "active_queries": pipeline_data['system_metrics'].get('active_connections', 0),
    }
    
    connection_status = self._get_connection_status()
    
    return {
        "system_health": system_metrics,
        "gpu_performance": gpu_metrics,
        "pipeline_status": pipeline_metrics,
        "connection_status": connection_status,
    }
```

### **Phase 2: Add Real Metrics Integration**

#### **2.1 PostgreSQL Integration**
Add real query metrics from QueryHistory table:

```python
@staticmethod
def _get_pipeline_metrics() -> Dict[str, Any]:
    """Get real pipeline metrics from PostgreSQL"""
    try:
        from app.db.session import get_db
        from sqlalchemy import func, text
        from app.models.models import QueryHistory
        
        db = next(get_db())
        
        # Get queries per minute (last hour)
        recent_queries = db.query(QueryHistory).filter(
            QueryHistory.query_timestamp >= datetime.now() - timedelta(hours=1)
        ).count()
        
        # Get average response time (last hour)
        avg_time = db.query(func.avg(QueryHistory.processing_time_ms)).filter(
            QueryHistory.query_timestamp >= datetime.now() - timedelta(hours=1),
            QueryHistory.processing_time_ms.isnot(None)
        ).scalar() or 0
        
        # Get active queries (last 5 minutes)
        active_queries = db.query(QueryHistory).filter(
            QueryHistory.query_timestamp >= datetime.now() - timedelta(minutes=5)
        ).count()
        
        db.close()
        
        return {
            "queries_per_minute": recent_queries,
            "avg_response_time": float(avg_time),
            "active_queries": active_queries,
        }
        
    except Exception as e:
        logger.error(f"Failed to get real pipeline metrics: {e}")
        return {
            "queries_per_minute": 0,
            "avg_response_time": 0.0,
            "active_queries": 0,
        }
```

#### **2.2 Qdrant Integration**
Add vector database health monitoring:

```python
@staticmethod
def _get_qdrant_status() -> str:
    """Check Qdrant connection and health"""
    try:
        from app.services.integrated_vector_db_service import integrated_vector_db_service
        
        if integrated_vector_db_service.is_connected:
            # Test with a simple operation
            collections = integrated_vector_db_service.client.get_collections()
            return "connected"
        else:
            return "disconnected"
            
    except Exception as e:
        logger.error(f"Qdrant health check failed: {e}")
        return "error"

@staticmethod
def _get_connection_status() -> Dict[str, str]:
    """Connection status with real health checks"""
    return {
        "backend_status": "connected",
        "database_status": _get_database_status(),
        "vector_db_status": _get_qdrant_status(),
        "websocket_connections": len(manager.clients)
    }
```

### **Phase 3: Frontend Cleanup**

#### **3.1 Simplify WebSocket Hook**
Remove complex transformation logic from `useWebSocket.jsx`:

```javascript
// Simplified transformation (backend now sends correct format)
const transformWebSocketData = useCallback((rawData) => {
  try {
    let data = rawData;
    
    // Extract data if wrapped
    if (rawData.data && typeof rawData.data === 'object') {
      data = rawData.data;
    }
    
    // Backend now sends correct format, minimal transformation needed
    return {
      system_health: data.system_health || {},
      gpu_performance: Array.isArray(data.gpu_performance) 
        ? data.gpu_performance 
        : [],
      pipeline_status: data.pipeline_status || {},
      connection_status: data.connection_status || {}
    };
    
  } catch (error) {
    logger.error(f"Data transformation failed: {error}");
    return null;
  }
}, []);
```

## 📋 **IMPLEMENTATION STEPS**

### **Step 1: Create Fixed WebSocket Route**
1. Create new file: `backend/app/api/routes/websocket_monitoring_fixed.py`
2. Implement corrected data structure
3. Add real metrics integration
4. Test with frontend

### **Step 2: Update Main.py**
```python
# Replace the WebSocket import
try:
    from app.api.routes.websocket_monitoring_fixed import router as websocket_router
    app.include_router(websocket_router, prefix="/api/v1", tags=["websocket"])
    websocket_available = True
    logger.info("✅ Fixed WebSocket router imported and registered successfully")
except Exception as e:
    logger.error(f"⚠️  Fixed WebSocket router import failed: {e}")
    websocket_available = False
```

### **Step 3: Test Integration**
1. Start backend with fixed WebSocket
2. Connect frontend to WebSocket
3. Verify all metrics display correctly
4. Test real-time updates

### **Step 4: Cleanup**
1. Remove old WebSocket route
2. Simplify frontend transformation logic
3. Update documentation

## 🎯 **EXPECTED RESULTS**

### **After Fix:**
- ✅ CPU/Memory metrics display correctly
- ✅ GPU metrics show real data in array format
- ✅ Query performance updates in real-time
- ✅ Connection status reflects actual system state
- ✅ All monitoring data updates live

### **Performance Improvements:**
- Real metrics instead of placeholders
- Integrated PostgreSQL and Qdrant health
- Simplified frontend data handling
- Better error handling and logging

## 🚨 **CRITICAL FILES TO MODIFY**

1. **`backend/app/api/routes/websocket_monitoring.py`** - Fix data structure
2. **`backend/app/main.py`** - Update WebSocket import
3. **`frontend/rag-ui-new/src/hooks/useWebSocket.jsx`** - Simplify transformation
4. **Add integration** with `enhanced_pipeline_monitor.py`

## 📊 **TESTING CHECKLIST**

- [ ] Backend starts without errors
- [ ] WebSocket connects successfully
- [ ] CPU/Memory metrics display
- [ ] GPU metrics show in array format
- [ ] Query performance updates
- [ ] Connection status reflects real state
- [ ] Real-time updates work
- [ ] Error handling works
- [ ] Frontend transformation simplified

This fix will resolve all the label mismatches and provide real, integrated monitoring data across all components.
