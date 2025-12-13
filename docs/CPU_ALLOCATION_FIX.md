# CPU Allocation Fix for Backend-07 Container

## Problem Identified

The backend-07 container was showing ~105.66% CPU usage (approximately 1 vCPU) despite having 16 CPUs available on the host system.

**Observed Behavior**:
- Container CPU: 105.66% / 1600% (16 CPUs)
- Host CPU: 10.09%
- **Issue**: Container appears limited to ~1 vCPU

## Root Cause Analysis

### **Docker Compose Configuration**
- ❌ **No CPU limits specified** in `docker-compose.yml`
- ❌ **No CPU reservations specified**
- ✅ Memory limits: 24GB
- ✅ GPU allocation: 1 GPU

### **Docker Inspect Results**
```json
{
  "NanoCpus": 0,        // No CPU limit (0 = unlimited)
  "CpuCount": 0,        // No CPU count limit
  "CpuQuota": 0,        // No CPU quota
  "CpuPeriod": 0        // No CPU period
}
```

### **Possible Causes**
1. **Docker Desktop Default Limits**: Docker Desktop may apply default resource limits
2. **Application Threading**: Single-threaded operations limiting CPU usage
3. **Python GIL**: Global Interpreter Lock limiting multi-core usage
4. **Implicit Resource Constraints**: System-level or Docker Desktop settings

## Solution Applied

### **Added CPU Limits to docker-compose.yml**

```yaml
deploy:
  resources:
    limits:
      memory: 24G
      cpus: '16.0'      # ✅ Allocate all 16 vCPUs for maximum performance
    reservations:
      memory: 8G
      cpus: '4.0'       # ✅ Reserve 4 vCPUs to ensure minimum performance
      devices:
      - driver: nvidia
        count: 1
        capabilities:
        - gpu
```

## Expected Results

### **Before Fix**:
- CPU Usage: ~105.66% (~1 vCPU)
- Limited to single core performance
- Slow query/document processing

### **After Fix**:
- CPU Limit: 16.0 vCPUs (all available)
- CPU Reservation: 4.0 vCPUs (guaranteed minimum)
- Can utilize multiple cores for parallel processing
- Faster query/document processing

## Verification

### **Check CPU Allocation**:
```bash
docker inspect backend-07 --format='{{json .HostConfig.Resources}}' | jq '{NanoCpus, CpuCount}'
```

**Expected**:
- `NanoCpus`: 16000000000 (16 CPUs × 1,000,000,000 nanoseconds)
- `CpuCount`: 16

### **Monitor CPU Usage**:
```bash
docker stats backend-07 --no-stream
```

**Expected**: Can now use up to 1600% CPU (16 CPUs × 100%)

## Additional Considerations

### **Thread Pool Executors**
The application uses thread pool executors for:
- Document processing: 2 workers
- Query processing: 2 workers

**Recommendation**: Consider increasing workers if CPU allocation allows:
```python
_document_processing_executor = ThreadPoolExecutor(
    max_workers=4,  # Increase from 2 to 4
    thread_name_prefix="doc_processor"
)

_query_processing_executor = ThreadPoolExecutor(
    max_workers=4,  # Increase from 2 to 4
    thread_name_prefix="query_processor"
)
```

### **Uvicorn Workers**
Currently using single worker. Consider multiple workers for better CPU utilization:
```yaml
command: "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
```

**Note**: Multiple workers require careful handling of shared resources (models, connections).

## Status

✅ **CPU Limits Added**
- Limit: 16.0 vCPUs
- Reservation: 4.0 vCPUs
- Container recreated with new limits

**Next**: Monitor CPU usage during query/document processing to verify improved utilization

---

**Last Updated**: CPU allocation fix applied

