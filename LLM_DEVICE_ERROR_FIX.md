# LLM Device Error Fix

## Problem

Query processing was failing with the following error:

```
Tensor on device cuda:0 is not on the expected device meta!
```

## Root Cause

When using `device_map="auto"` with `max_memory` constraints, the accelerate library offloads some model parameters to disk (using the "meta" device) to fit within memory limits. However, during inference, the pipeline expects all tensors to be on CUDA, causing a device mismatch error.

**Issue**:
- `device_map="auto"` + `max_memory` → Some parameters offloaded to meta device
- Pipeline inference → Expects all tensors on CUDA
- **Result**: Device mismatch error

## Solution Applied

### 1. Changed `device_map` from "auto" to "cuda"

**Before**:
```python
model_kwargs = {
    "device_map": "auto",
    "max_memory": {0: max_memory_per_worker}  # Causes offloading
}
```

**After**:
```python
model_kwargs = {
    "device_map": "cuda"  # Force all parameters to GPU, no offloading
}
```

### 2. Removed `max_memory` Constraint

- With 2 workers, each gets ~12GB GPU memory
- Mistral-7B requires ~14GB in float16
- If memory is insufficient, the model will fail to load cleanly rather than partially offload
- This prevents the meta device issue

### 3. Added Explicit Device to Pipeline

**Before**:
```python
self.pipeline = pipeline(
    "text-generation",
    model=self.model,
    tokenizer=self.tokenizer,
    #device=0 if self.device == "cuda" else -1,  # Commented out
    ...
)
```

**After**:
```python
pipeline_device = 0 if self.device == "cuda" else -1
self.pipeline = pipeline(
    "text-generation",
    model=self.model,
    tokenizer=self.tokenizer,
    device=pipeline_device,  # Explicitly set device
    ...
)
```

## Benefits

1. **No Meta Device Issues**: All parameters stay on CUDA
2. **Cleaner Error Handling**: If memory is insufficient, model fails to load immediately
3. **Better Performance**: No disk I/O for offloaded parameters
4. **Simpler Configuration**: No need to calculate max_memory per worker

## Trade-offs

- **Memory Usage**: Model must fit entirely in GPU memory (no offloading)
- **Worker Limit**: With 2 workers, each needs ~14GB for Mistral-7B
- **Total GPU Memory**: Requires ~28GB total (2 × 14GB) for both workers

## Verification

### Test Query:
```bash
curl -X POST http://localhost:8000/api/v1/queries/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is RAG?", "use_llm": true}'
```

**Expected**: Query processes successfully without device errors

### Check Logs:
```bash
docker logs backend-07 | grep -i "device\|meta\|cuda"
```

**Expected**: No "meta device" errors

## Status

✅ **Fix Applied**
- Changed `device_map` from "auto" to "cuda"
- Removed `max_memory` constraint
- Added explicit device to pipeline
- Container rebuilt and restarted

**Next**: Test query processing to verify the fix

---

**Last Updated**: LLM device error fix applied

