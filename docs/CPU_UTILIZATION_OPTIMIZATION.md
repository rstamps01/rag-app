# CPU Utilization Optimization

## Problem

Even with 16 vCPUs allocated, the container was only using ~103-110% CPU (~1 vCPU) during processing.

## Root Cause Analysis

### **1. CPU Allocation** ✅
- Docker limit: 16.0 vCPUs (correctly set)
- Container sees: 16 CPUs (verified)
- **Status**: Allocation is correct

### **2. Application-Level Limitations** ❌

**Issues Found**:
1. **Uvicorn**: Running with 1 worker (single process)
2. **Thread Pool Executors**: Only 2 workers each
3. **Python GIL**: Limits true parallelism for CPU-bound tasks

**Current Configuration**:
```python
# Query processing
_query_processing_executor = ThreadPoolExecutor(max_workers=2)  # ❌ Too few

# Document processing  
_document_processing_executor = ThreadPoolExecutor(max_workers=2)  # ❌ Too few

# Uvicorn
uvicorn app.main:app --workers 1  # ❌ Single worker
```

## Solution Applied

### **1. Increased Thread Pool Workers**

**Query Processing**:
```python
_query_processing_executor = ThreadPoolExecutor(
    max_workers=8,  # ✅ Increased from 2 to 8
    thread_name_prefix="query_processor"
)
```

**Document Processing**:
```python
_document_processing_executor = ThreadPoolExecutor(
    max_workers=8,  # ✅ Increased from 2 to 8
    thread_name_prefix="doc_processor"
)
```

### **2. Added Uvicorn Workers**

**Before**:
```yaml
command: "uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

**After**:
```yaml
command: "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
```

**Note**: Multiple workers require careful handling of:
- Shared model instances (LLM, embeddings)
- Database connections
- GPU memory allocation

## Expected Results

### **Before**:
- CPU Usage: ~103-110% (~1 vCPU)
- Single uvicorn worker
- 2 thread pool workers per executor
- Limited parallelism

### **After**:
- CPU Usage: Can reach 400-800% (4-8 vCPUs)
- 4 uvicorn workers
- 8 thread pool workers per executor
- Better parallelism

## Considerations

### **Uvicorn Workers (4 workers)**

**Pros**:
- Better CPU utilization
- Can handle more concurrent requests
- Better for I/O-bound operations

**Cons**:
- Each worker loads models separately (memory usage × 4)
- GPU memory may be shared (need to verify)
- Database connections × 4

### **Thread Pool Workers (8 workers)**

**Pros**:
- Better CPU utilization for CPU-bound tasks
- Can process multiple documents/queries in parallel
- Better resource utilization

**Cons**:
- Python GIL limits true parallelism
- For CPU-bound tasks, consider multiprocessing instead

## Alternative: Multiprocessing for CPU-Bound Tasks

For true parallelism (bypassing Python GIL), consider using `ProcessPoolExecutor`:

```python
from concurrent.futures import ProcessPoolExecutor

_query_processing_executor = ProcessPoolExecutor(
    max_workers=8,
    mp_context=multiprocessing.get_context('spawn')
)
```

**Note**: Requires careful handling of:
- Model serialization
- GPU access
- Shared memory

## Monitoring

### **Check Uvicorn Workers**:
```bash
docker exec backend-07 ps aux | grep uvicorn
# Expected: 4 worker processes + 1 master
```

### **Monitor CPU Usage**:
```bash
docker stats backend-07 --no-stream
# Expected: Can reach 400-800% CPU (4-8 vCPUs)
```

### **Check Thread Pool Activity**:
```bash
docker logs backend-07 | grep -E "query_processor|doc_processor|thread pool"
```

## Status

✅ **Optimizations Applied**
- Thread pool workers: 2 → 8 (each)
- Uvicorn workers: 1 → 4
- Container rebuilt and restarted

**Next**: Monitor CPU usage during query/document processing to verify improved utilization

---

**Last Updated**: CPU utilization optimizations applied

