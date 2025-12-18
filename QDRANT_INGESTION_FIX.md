# Qdrant Document Ingestion Fix

## Problem
Documents uploaded to PostgreSQL were not being ingested into the Qdrant RAG collection. The Qdrant collection showed 0 points despite documents being marked as "processed" in PostgreSQL.

## Root Cause
The `process_document_for_vectors` background task was receiving a database session that gets closed when the HTTP request completes. FastAPI `BackgroundTasks` run after the response is sent, so the database session was already closed/invalid when the background task tried to use it.

**Issues Identified:**
1. Database session passed to background task becomes invalid after request completes
2. Background task couldn't update document status or access database
3. No error logging when background task fails silently
4. Background task might not be executing at all due to session issues

## Solution Applied

### 1. Fixed Database Session Management
Modified `process_document_for_vectors` to create its own database session instead of relying on the passed session:

```python
# Before: Used passed db session (invalid after request)
async def process_document_for_vectors(..., db: Session = None):
    if db is not None:
        document = db.query(Document).filter(...)

# After: Creates own session
async def process_document_for_vectors(..., db: Session = None):
    db_session = SessionLocal()  # Create fresh session
    try:
        document = db_session.query(Document).filter(...)
    finally:
        db_session.close()  # Always close
```

### 2. Enhanced Error Logging
Added comprehensive logging to track:
- When background task starts
- Database session creation
- Document status updates
- Vector storage operations
- Errors with full stack traces

### 3. Updated Background Task Call
Changed to not pass database session (let task create its own):

```python
background_tasks.add_task(
    process_document_for_vectors,
    file_id, file_path, file.filename, department, None  # Pass None instead of db
)
```

## Files Modified
- `backend/app/main.py`:
  - `process_document_for_vectors()` function (lines 385-580)
  - `upload_document()` function (line 1284)

## Testing

### 1. Restart Backend
```bash
docker-compose restart backend-07
```

### 2. Upload a Test Document
```bash
curl -X POST "http://localhost:8000/api/v1/documents" \
  -F "file=@test.pdf" \
  -F "department=General"
```

### 3. Monitor Logs
```bash
docker logs -f backend-07 | grep -E "(vector processing|Starting vector|Successfully stored|Qdrant)"
```

### 4. Verify in Qdrant
Check Qdrant dashboard: http://localhost:6333/dashboard#/collections/rag

Or via API:
```bash
curl http://localhost:6333/collections/rag | jq '.result.points_count'
```

### 5. Check Document Status
```bash
curl http://localhost:8000/api/v1/documents | jq '.documents[] | {id, filename, status, error_message}'
```

## Expected Behavior

After fix:
1. ✅ Document uploads successfully
2. ✅ Background task starts (see log: "🚀 Starting vector processing")
3. ✅ Database session created (see log: "✅ Created database session")
4. ✅ Document status updated to "processing"
5. ✅ Text extracted and chunked
6. ✅ Embeddings generated
7. ✅ Vectors stored in Qdrant (see log: "Successfully stored X vectors")
8. ✅ Document status updated to "processed"
9. ✅ Qdrant collection shows points_count > 0

## Verification Commands

```bash
# Check Qdrant points count
curl -s http://localhost:6333/collections/rag | jq '.result.points_count'

# Check recent processing logs
docker logs backend-07 --tail 100 | grep -E "(vector|Qdrant|chunk|embedding)"

# Check document processing status
curl -s http://localhost:8000/api/v1/documents | jq '.documents[] | select(.status=="processed") | {filename, status, error_message}'
```

## Troubleshooting

### If vectors still not appearing:

1. **Check if background task is running:**
   ```bash
   docker logs backend-07 | grep "Starting vector processing"
   ```

2. **Check for errors:**
   ```bash
   docker logs backend-07 | grep -i error | tail -20
   ```

3. **Verify Qdrant connection:**
   ```bash
   docker exec backend-07 curl -s http://qdrant-07:6333/health
   ```

4. **Check embedding model:**
   ```bash
   docker logs backend-07 | grep -i "embedding model"
   ```

5. **Manually trigger processing** (if needed):
   - Find a document ID from `/api/v1/documents`
   - Check if file exists: `docker exec backend-07 ls -la /app/data/uploads/`
   - Process manually via API endpoint (if available)

## Status
✅ **FIXED** - Background task now creates its own database session and properly processes documents into Qdrant.


