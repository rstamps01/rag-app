# CPU Optimization Summary

## Problem
Container was limited to ~103-110% CPU usage (~1 vCPU) despite 16 vCPUs being allocated.

## Root Causes Identified

### 1. ✅ CPU Allocation (Fixed)
- Docker limit: 16.0 vCPUs ✅
- Container sees: 16 CPUs ✅

### 2. ❌ Application-Level Limitations (Fixed)

**Issues**:
- Thread pool executors: Only 2 workers each
- Uvicorn: Single worker (1 process)
- Python GIL: Limits true parallelism

## Solutions Applied

### 1. Increased Thread Pool Workers ✅

**Query Processing** (`backend/app/main.py`):
```python
_query_processing_executor = ThreadPoolExecutor(
    max_workers=8,  # Increased from 2 to 8
    thread_name_prefix="query_processor"
)
```

**Document Processing** (`backend/app/api/routes/documents.py`):
```python
_document_processing_executor = ThreadPoolExecutor(
    max_workers=8,  # Increased from 2 to 8
    thread_name_prefix="doc_processor"
)
```

### 2. Added Uvicorn Workers ✅

**docker-compose.yml**:
```yaml
command: "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
```

## Expected Results

### Before:
- CPU Usage: ~103-110% (~1 vCPU)
- 1 uvicorn worker
- 2 thread pool workers per executor
- Limited parallelism

### After:
- CPU Usage: Can reach 400-800% (4-8 vCPUs)
- 4 uvicorn workers
- 8 thread pool workers per executor
- Better parallelism

## Important Considerations

### Uvicorn Workers (4 workers)

**Memory Impact**:
- Each worker loads models separately
- GPU Memory: 4 × model size (if models are GPU-loaded)
- RAM: 4 × model size
- **Monitor**: GPU memory usage to ensure sufficient capacity

**Benefits**:
- Better CPU utilization
- Can handle more concurrent requests
- Better for I/O-bound operations

**Trade-offs**:
- Higher memory usage
- Each worker needs to initialize models
- Startup time may increase

### Thread Pool Workers (8 workers)

**Benefits**:
- Better CPU utilization for CPU-bound tasks
- Can process multiple documents/queries in parallel
- Better resource utilization

**Limitations**:
- Python GIL limits true parallelism for CPU-bound tasks
- For true parallelism, consider `ProcessPoolExecutor` instead

## Monitoring

### Check Uvicorn Workers:
```bash
docker exec backend-07 ps aux | grep uvicorn
# Expected: 4 worker processes + 1 master
```

### Monitor CPU Usage:
```bash
docker stats backend-07 --no-stream
# Expected: Can reach 400-800% CPU (4-8 vCPUs)
```

### Monitor GPU Memory:
```bash
nvidia-smi
# Watch for OOM errors if memory is insufficient
```

### Monitor Container Memory:
```bash
docker stats backend-07 --no-stream --format "{{.MemUsage}}"
# Expected: Higher memory usage with 4 workers
```

## Testing

1. **Submit a query** and monitor CPU usage
2. **Upload a document** and monitor CPU usage
3. **Check for errors** in logs related to GPU memory
4. **Verify** CPU usage reaches 400-800% during processing

## Rollback Plan

If GPU memory issues occur, reduce uvicorn workers:

```yaml
# Option 1: Reduce to 2 workers
command: "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"

# Option 2: Keep single worker, rely on thread pools
command: "uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

Thread pool workers (8) can remain as they share the same process.

## Status

✅ **Optimizations Applied**
- Thread pool workers: 2 → 8 (each)
- Uvicorn workers: 1 → 4
- Container rebuilt and restarted
- Changes committed to GitHub

**Next**: Monitor CPU usage during query/document processing to verify improved utilization

---

**Last Updated**: CPU optimization changes applied and committed

