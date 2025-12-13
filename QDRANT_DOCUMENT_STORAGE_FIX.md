# Qdrant Document Storage Fix

## Issue Summary
Recently uploaded documents are not appearing in the Qdrant `rag` collection despite being marked as "processed" in PostgreSQL.

## Root Cause Analysis

### Findings
1. **Embedding Model Unavailable**: The `integrated_document_processor` has `embedding_model=None` during initialization
2. **Lazy Initialization Not Triggered**: The `process_document_sync` method checks `if self.qdrant_client and self.embedding_model:` but skips vector storage if either is `None`
3. **Documents Marked as "Processed"**: Even when vector storage fails, documents are marked as "processed" because text extraction succeeds
4. **No Error Logging**: The failure to store vectors is not clearly logged

### Technical Details
- `safe_sentence_transformer` returns `None` due to Pydantic validation errors
- The `initialize()` method is async but may not be called during startup
- Documents are processed but vectors are not stored because `embedding_model` is `None`

## Solution Implemented

### 1. Added Lazy Initialization in `process_document_sync`
- Check if `embedding_model` is `None` before vector storage
- Attempt lazy initialization using `safe_sentence_transformer`
- Check if `qdrant_client` is `None` and initialize if needed
- Improved error logging to identify why vector storage fails

### 2. Updated Optimizer Config
- Lowered `deleted_threshold` from `0.2` to `0.1` (10% deleted triggers vacuum)
- Lowered `vacuum_min_vector_number` from `1000` to `100` (allows cleanup with fewer vectors)
- Applied in `integrated_vector_db_service.py` for new collections

### 3. Added Post-Deletion Optimization
- Trigger Qdrant optimization after bulk document deletion
- Update optimizer config to allow cleanup with 0 points
- Run optimization in background to avoid blocking API response

## Code Changes

### `backend/app/services/integrated_document_processor.py`
```python
# Added lazy initialization before vector storage
if not self.embedding_model:
    logger.info("🔄 Embedding model not initialized, attempting lazy initialization...")
    try:
        from app.utils.pydantic_suppress import safe_sentence_transformer
        model_name = getattr(settings, 'EMBEDDING_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
        self.embedding_model = safe_sentence_transformer(model_name)
        if self.embedding_model:
            logger.info(f"✅ Embedding model initialized lazily: {model_name}")
        else:
            logger.warning("⚠️ Embedding model lazy initialization returned None")
    except Exception as e:
        logger.error(f"❌ Embedding model lazy initialization failed: {e}")
        self.embedding_model = None

# Ensure Qdrant client is initialized
if not self.qdrant_client:
    logger.info("🔄 Qdrant client not initialized, attempting lazy initialization...")
    try:
        from qdrant_client import QdrantClient
        self.qdrant_client = QdrantClient(url=self.qdrant_url)
        logger.info(f"✅ Qdrant client initialized lazily: {self.qdrant_url}")
    except Exception as e:
        logger.error(f"❌ Qdrant client lazy initialization failed: {e}")
        self.qdrant_client = None
```

### `backend/app/services/integrated_vector_db_service.py`
```python
# Updated optimizer config
optimizer_config = OptimizersConfigDiff(
    indexing_threshold=20000,
    memmap_threshold=50000,
    deleted_threshold=0.1,    # Lowered from 0.2
    vacuum_min_vector_number=100  # Lowered from 1000
)
```

### `backend/app/api/routes/admin.py`
```python
# Trigger optimization after bulk deletion
if vector_deleted > 0 and qdrant_client is not None:
    try:
        import requests
        qdrant_url = getattr(settings, 'QDRANT_URL', 'http://qdrant-07:6333')
        # Update optimizer config
        requests.patch(
            f"{qdrant_url}/collections/rag",
            json={"optimizer_config": {"deleted_threshold": 0.0, "vacuum_min_vector_number": 0}},
            timeout=5
        )
        # Trigger optimization
        requests.post(
            f"{qdrant_url}/collections/rag/optimize",
            json={"wait": False},
            timeout=5
        )
        logger.info("Admin: Triggered Qdrant optimization after bulk deletion")
    except Exception as opt_error:
        logger.warning(f"Admin: Failed to trigger Qdrant optimization: {opt_error}")
```

## Testing

### Verify Embedding Model Initialization
```bash
docker logs backend-07 2>&1 | grep -E "(Embedding model|lazy initialization)"
```

### Verify Document Storage
```bash
# Check Qdrant collection
curl -s http://localhost:6333/collections/rag | jq '.result.points_count'

# Check recent documents
curl -s http://localhost:8000/api/v1/documents?limit=5 | jq '.documents[] | {id, filename, status}'
```

### Test Document Upload
1. Upload a test document via API
2. Check logs for "Stored X vectors in Qdrant"
3. Verify points appear in Qdrant collection
4. Verify document status is "processed"

## Next Steps

1. ✅ Implement lazy initialization for embedding model
2. ✅ Update optimizer config thresholds
3. ✅ Add post-deletion optimization trigger
4. ⏳ Test document upload and verify vectors are stored
5. ⏳ Monitor logs for lazy initialization success/failure
6. ⏳ Verify embedding model loads successfully despite Pydantic warnings

## Expected Behavior

After these changes:
- Documents uploaded should trigger lazy initialization of embedding model
- Vectors should be stored in Qdrant even if initial startup failed
- Bulk deletions should trigger automatic optimization
- Collection should maintain clean state with proper cleanup thresholds



