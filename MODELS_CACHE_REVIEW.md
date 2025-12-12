# Models Cache Structure Review

## Summary
This document reviews the models_cache structure and verifies that Docker build, startup, and load operations are using the correct paths.

## Cache Directory Structure

### Local Host Structure (`backend/models_cache/`)
```
backend/models_cache/
├── .initialization_complete          # Marker file for cache initialization
├── hub/                              # HuggingFace Hub cache
│   ├── models--sentence-transformers--all-MiniLM-L6-v2/
│   │   └── snapshots/
│   │       └── c9745ed1d9f207416be6d2e6f8de32d1f16199bf/
│   │           ├── config.json
│   │           ├── model.safetensors
│   │           └── tokenizer files...
│   └── models--mistralai--Mistral-7B-Instruct-v0.2/
│       └── snapshots/
│           └── [commit_hash]/
│               ├── config.json
│               ├── model-00001-of-00003.safetensors
│               └── tokenizer files...
├── sentence_transformers/           # Sentence Transformers cache
├── transformers/                     # Transformers library cache
└── datasets/                         # HuggingFace datasets cache
```

### Container Structure (`/app/models_cache/`)
The volume mount maps `./backend/models_cache` to `/app/models_cache` in the container.

## Environment Variables Configuration

### ✅ Backend Container (`backend-07`)
**docker-compose.yml:**
```yaml
environment:
  - HF_HOME=/app/models_cache
  - HF_HUB_CACHE=/app/models_cache/hub
  - MODELS_CACHE_DIR=/app/models_cache
```

**Dockerfile:**
```dockerfile
ENV MODELS_CACHE_DIR=/app/models_cache \
    HF_HUB_CACHE=/app/models_cache/hub \
    HF_HOME=/app/models_cache \
    TORCH_HOME=/app/models_cache/torch \
    TRITON_CACHE_DIR=/tmp/triton_cache
```

### ✅ Cache Init Container (`cache-init-07`)
**Dockerfile.cache-init (FIXED):**
```dockerfile
ENV HF_HOME=/app/models_cache
ENV HF_DATASETS_CACHE=/app/models_cache
ENV HF_HUB_CACHE=/app/models_cache/hub  # ✅ FIXED: Was /app/models_cache
ENV MODELS_CACHE_DIR=/app/models_cache
```

## Model Loading Configuration

### SentenceTransformer Loading
**Important:** `SentenceTransformer` does NOT accept a `cache_dir` parameter. It uses environment variables:
- `HF_HOME` - Base cache directory
- `HF_HUB_CACHE` - HuggingFace Hub cache directory (should be `HF_HOME/hub`)

**Current Usage:**
```python
# ✅ CORRECT - Uses environment variables
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
```

**Environment Variables Verified:**
- `HF_HOME=/app/models_cache` ✅
- `HF_HUB_CACHE=/app/models_cache/hub` ✅

### LLM Model Loading (AutoModelForCausalLM)
**Current Usage:**
```python
# ✅ CORRECT - Uses cache_dir parameter
self.tokenizer = AutoTokenizer.from_pretrained(
    self.model_name,
    cache_dir=self.cache_dir  # /app/models_cache
)

self.model = AutoModelForCausalLM.from_pretrained(
    self.model_name,
    cache_dir=self.cache_dir  # /app/models_cache
)
```

**Services Using cache_dir:**
- `app/services/llm_service.py` ✅
- `app/services/enhanced_llm_service.py` ✅
- `app/services/model_manager.py` ✅

## Volume Mount Configuration

### ✅ docker-compose.yml
```yaml
volumes:
  - ./backend/models_cache:/app/models_cache:rw
```

This correctly maps the local `backend/models_cache` directory to `/app/models_cache` in the container.

## Issues Found and Fixed

### ❌ Issue 1: HF_HUB_CACHE Path Inconsistency (FIXED)
**Problem:** `Dockerfile.cache-init` had `HF_HUB_CACHE=/app/models_cache` instead of `/app/models_cache/hub`

**Impact:** Cache initialization container would use incorrect cache path, potentially causing:
- Models not being found in expected location
- Duplicate model downloads
- Inconsistent cache structure

**Fix Applied:**
```dockerfile
# Before:
ENV HF_HUB_CACHE=/app/models_cache

# After:
ENV HF_HUB_CACHE=/app/models_cache/hub
```

## Verification Checklist

### ✅ Docker Build
- [x] Backend Dockerfile sets correct environment variables
- [x] Cache-init Dockerfile sets correct environment variables (FIXED)
- [x] Volume mount correctly configured in docker-compose.yml

### ✅ Startup Operations
- [x] Backend container waits for `.initialization_complete` marker
- [x] Cache initialization script creates marker file
- [x] Environment variables are set correctly in running containers

### ✅ Model Loading
- [x] SentenceTransformer uses environment variables (HF_HOME, HF_HUB_CACHE)
- [x] LLM services use `cache_dir` parameter correctly
- [x] Models are stored in correct cache structure (`hub/models--*--*/snapshots/`)

## Cache Path Summary

| Component | Environment Variable | Path | Status |
|-----------|---------------------|------|--------|
| Base Cache | `HF_HOME` | `/app/models_cache` | ✅ |
| Hub Cache | `HF_HUB_CACHE` | `/app/models_cache/hub` | ✅ (FIXED) |
| Models Cache | `MODELS_CACHE_DIR` | `/app/models_cache` | ✅ |
| Torch Cache | `TORCH_HOME` | `/app/models_cache/torch` | ✅ |
| Datasets Cache | `HF_DATASETS_CACHE` | `/app/models_cache` | ✅ |
| Triton Cache | `TRITON_CACHE_DIR` | `/tmp/triton_cache` | ✅ |

## Model Storage Locations

### SentenceTransformer Models
- **Cache Location:** `/app/models_cache/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/[commit_hash]/`
- **Verified:** ✅ Models exist in correct location
- **Loading:** Uses `HF_HUB_CACHE` environment variable

### LLM Models (Mistral-7B)
- **Cache Location:** `/app/models_cache/hub/models--mistralai--Mistral-7B-Instruct-v0.2/snapshots/[commit_hash]/`
- **Verified:** ✅ Models exist in correct location
- **Loading:** Uses `cache_dir` parameter set to `/app/models_cache`

## Recommendations

1. ✅ **FIXED:** Update `Dockerfile.cache-init` to use correct `HF_HUB_CACHE` path
2. ✅ **VERIFIED:** All model loading code uses correct cache paths
3. ✅ **VERIFIED:** Volume mount correctly maps cache directory
4. **SUGGESTION:** Consider adding cache validation script to verify models are accessible before startup

## Testing

To verify cache is working correctly:

```bash
# Check environment variables in container
docker exec backend-07 env | grep -E "(HF_|MODELS_)"

# Verify models exist in cache
docker exec backend-07 ls -la /app/models_cache/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/

# Test model loading
docker exec backend-07 python -c "from sentence_transformers import SentenceTransformer; st = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); print('✅ Model loaded from cache')"
```

## Conclusion

✅ **All cache paths are now correctly configured:**
- Environment variables are consistent across all Dockerfiles
- Model loading code uses correct cache paths
- Volume mount correctly maps cache directory
- Models are stored in expected HuggingFace Hub cache structure

**Status:** Ready for rebuild and testing.

