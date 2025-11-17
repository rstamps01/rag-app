# Query Processing Blocking Fix

## Problem

Query processing was blocking the event loop, causing metrics dashboard to stop updating during query execution (~30 seconds).

**Symptoms**:
- Metrics become unavailable during query processing
- Query takes ~30 seconds to complete
- GPU utilization: 0-20% (underutilized)
- Event loop blocked, preventing metrics updates

---

## Root Cause

The `ask_query` endpoint in `main.py` was calling:
1. `embedding_model.encode()` - Synchronous, blocking
2. `llm_service.generate_response()` - Synchronous, blocking (~30 seconds)

Both operations ran in the main event loop, blocking all async operations including metrics collection.

---

## Solution

Moved CPU/GPU-intensive query processing to a thread pool executor, similar to document processing fix.

### **Changes Applied**

**File**: `backend/app/main.py`

1. **Added Thread Pool Executor**:
```python
_query_processing_executor = ThreadPoolExecutor(
    max_workers=2,
    thread_name_prefix="query_processor"
)
```

2. **Created Synchronous Wrapper Functions**:
```python
def _generate_embedding_sync(query: str):
    """Synchronous embedding generation for thread pool execution"""
    if embedding_model is None:
        return None
    return embedding_model.encode(query).tolist()

def _generate_llm_response_sync(query: str, context: str):
    """Synchronous LLM response generation for thread pool execution"""
    if llm_service is None:
        return None
    return llm_service.generate_response(
        query=query,
        context=context
    )
```

3. **Updated Query Endpoint to Use Thread Pool**:
```python
# Embedding generation in thread pool
loop = asyncio.get_event_loop()
query_embedding = await loop.run_in_executor(
    _query_processing_executor,
    _generate_embedding_sync,
    request.query
)

# LLM generation in thread pool
llm_response = await loop.run_in_executor(
    _query_processing_executor,
    _generate_llm_response_sync,
    request.query,
    context
)
```

---

## Benefits

### **Before Fix**:
- ❌ Metrics stop updating during query (~30s)
- ❌ Event loop blocked
- ❌ GPU underutilized (0-20%)
- ❌ No concurrent operations possible

### **After Fix**:
- ✅ Metrics continue updating during query processing
- ✅ Event loop remains free for metrics/WebSocket/API
- ✅ GPU can be better utilized (though LLM generation is inherently sequential)
- ✅ Concurrent operations possible

---

## Expected Behavior

### **During Query Processing**:
1. Query received → Embedding generated in thread pool (non-blocking)
2. Vector search → Fast, non-blocking
3. LLM generation → Runs in thread pool (~30s, non-blocking)
4. Metrics → Continue updating every 0.5s
5. WebSocket → Remains active
6. API requests → Respond immediately

---

## Testing

### **Test 1: Metrics During Query**
1. Open metrics dashboard: `http://localhost:3001/metrics`
2. Submit a query
3. **Verify**: Metrics continue updating during ~30s query processing
4. **Check**: No "Waiting for Data" messages

### **Test 2: Event Loop Non-Blocking**
1. Submit a query
2. Make API requests: `curl http://localhost:8000/api/v1/status`
3. **Verify**: API responds immediately
4. **Check**: WebSocket connections active

### **Test 3: Concurrent Queries**
1. Submit multiple queries simultaneously
2. **Verify**: All queries process (thread pool handles concurrency)
3. **Check**: Metrics continue updating

---

## Monitoring

### **Backend Logs**
```bash
docker logs -f backend-07 | grep -E "query_processor|thread pool|non-blocking"
```

### **Metrics During Query**
```bash
watch -n 0.5 'curl -s http://localhost:8000/api/v1/metrics/comprehensive | jq "{cpu: .system_metrics.cpu_usage, gpu: .system_metrics.gpu_metrics.utilization, memory: .system_metrics.memory_usage}"'
```

### **GPU Monitoring**
```bash
watch -n 1 nvidia-smi
```

---

## Status

✅ **Fix Applied**
- Thread pool executor added
- Embedding generation moved to thread pool
- LLM generation moved to thread pool
- Event loop remains free

**Next**: Test and verify metrics continue updating during query processing

---

**Last Updated**: Fix applied and ready for testing

