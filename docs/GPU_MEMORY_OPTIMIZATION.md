# GPU Memory Optimization

## Problem

GPU memory was at 31.2GB of 31.5GB (99% utilization), causing system issues.

**Root Cause**: With 4 uvicorn workers, each worker loads its own copy of:
- LLM model (Mistral-7B): ~14GB per worker
- Embedding model: ~200MB per worker
- **Total**: 4 × ~14.2GB = ~56.8GB (exceeding 32GB GPU memory)

## Solution Applied

### 1. ✅ Reduced Uvicorn Workers

**docker-compose.yml**:
- **Before**: `--workers 4`
- **After**: `--workers 2`
- **Impact**: Reduces model copies from 4 to 2

### 2. ✅ Set Memory Fraction to 75% Total

**Per-Worker Memory Fraction**:
- **Before**: 70% per worker (4 × 70% = 280% total, competing)
- **After**: 37.5% per worker (2 × 37.5% = 75% total)

**Files Updated**:
1. `backend/app/services/gpu_accelerator.py`: 0.70 → 0.375
2. `backend/app/core/gpu_config.py`: 0.70 → 0.375

### 3. ✅ Added max_memory Limits in Model Loading

**backend/app/services/enhanced_llm_service.py**:
- Added `max_memory` parameter to model loading
- Limits each worker to 37.5% of GPU memory (~12GB per worker)
- Prevents memory overflow

```python
if torch.cuda.is_available():
    total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9  # GB
    max_memory_per_worker = int(total_memory * 0.375 * 1e9)  # 37.5% per worker
    model_kwargs["max_memory"] = {0: max_memory_per_worker}
```

## Expected Results

### Before:
- **Workers**: 4
- **GPU Memory**: 31.2GB / 31.5GB (99%)
- **Per Worker**: ~7.8GB (unlimited)
- **Status**: ❌ System issues

### After:
- **Workers**: 2
- **GPU Memory**: ~24GB / 31.5GB (75%)
- **Per Worker**: ~12GB (37.5% limit)
- **Status**: ✅ Within safe limits

## Memory Allocation Breakdown

### With 2 Workers (75% Total):

| Component | Per Worker | Total (2 workers) |
|-----------|-----------|-------------------|
| LLM Model | ~12GB | ~24GB |
| Embedding Model | ~200MB | ~400MB |
| Overhead | ~500MB | ~1GB |
| **Total** | **~12.7GB** | **~25.4GB (75%)** |

### Reserved (25%):
- System overhead: ~2GB
- Buffer for operations: ~5GB
- **Total Reserved**: ~7GB

## Verification

### Check GPU Memory:
```bash
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits
# Expected: ~24GB used (75% of 31.5GB)
```

### Check Uvicorn Workers:
```bash
docker exec backend-07 ps aux | grep uvicorn
# Expected: 2 worker processes + 1 master = 3 total
```

### Monitor Memory During Processing:
```bash
watch -n 1 'nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits'
```

## Status

✅ **Optimizations Applied**
- Uvicorn workers: 4 → 2
- Memory fraction: 70% → 37.5% per worker (75% total)
- max_memory limits: Added to model loading
- Container rebuilt and restarted

**Next**: Monitor GPU memory usage to ensure it stays within 75% limit

---

**Last Updated**: GPU memory optimization applied

