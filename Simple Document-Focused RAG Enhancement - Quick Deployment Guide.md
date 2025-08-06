# Simple Document-Focused RAG Enhancement - Quick Deployment Guide

## Overview

This guide provides step-by-step instructions for implementing a streamlined enhancement to your RAG application that focuses on two key improvements: **document-only responses** and **increased file size limits**. This near-term solution maintains all existing functionality while ensuring that the system exclusively uses uploaded document content for responses and supports files up to 1GB in size.

## Key Enhancements

### Document-Only Response Mode
- **Eliminates training data fallbacks**: System will only respond based on uploaded documents
- **Clear "no documents found" messages**: When no relevant documents exist, users get explicit guidance
- **Enhanced prompting**: LLM is specifically instructed to use only provided document context
- **Source attribution**: Responses clearly indicate which documents were used

### Increased File Size Limits
- **1GB file limit**: Increased from 100MB to 1GB (10x improvement)
- **Maintains performance**: Streaming processing prevents memory issues
- **Background processing**: Large files are processed without blocking uploads
- **Progress tracking**: Status monitoring for large file processing

## Quick Deployment Steps

### Step 1: Backup Current System

Before deploying the enhanced version, create a backup of your current system:

```bash
cd /home/vastdata/rag-app-07/

# Backup current main.py
cp backend/app/main.py backend/app/main.py.backup.$(date +%Y%m%d_%H%M%S)

# Backup docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

# Verify backups
ls -la *.backup.*
ls -la backend/app/main.py.backup.*
```

### Step 2: Deploy Enhanced Main Application

Replace the current main.py with the document-focused version:

```bash
# Copy the enhanced main.py
cp main_document_focused_simple.py backend/app/main.py

# Verify the deployment
head -5 backend/app/main.py | grep "Document-Focused"
```

### Step 3: Restart Backend Service

Restart the backend to apply the changes:

```bash
# Restart backend service
docker-compose restart backend-07

# Wait for service to start
sleep 15

# Verify service is running
docker-compose ps backend-07
```

### Step 4: Verify Deployment

Test the enhanced functionality:

```bash
# Check health status (should show document_only mode)
curl "http://localhost:8000/health" | jq '.mode'

# Should return: "document_only"

# Check increased file size limit
curl "http://localhost:8000/health" | jq '.max_file_size_gb'

# Should return: 1
```

## Testing the Enhanced System

### Test 1: Document-Only Response Behavior

Test that the system only uses uploaded documents:

```bash
# Query without any uploaded documents
curl -X POST "http://localhost:8000/api/v1/queries/ask" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is artificial intelligence?", "use_llm": true}' | jq '.response'

# Expected response: Should indicate no relevant documents are available
```

### Test 2: Large File Upload

Test the increased file size limit:

```bash
# Create a test file larger than 100MB (but smaller than 1GB)
dd if=/dev/zero of=large_test_file.txt bs=1M count=200  # 200MB file

# Upload the large file
curl -X POST -F "file=@large_test_file.txt" -F "department=Testing" \
  "http://localhost:8000/api/v1/documents/" | jq '.'

# Should succeed with status "uploaded"
```

### Test 3: Document-Based Query Response

Test that responses use uploaded document content:

```bash
# Upload a test document
echo "VAST Data provides enterprise AI storage solutions with high performance and scalability for modern data workloads." > test_content.txt

curl -X POST -F "file=@test_content.txt" -F "department=IT" \
  "http://localhost:8000/api/v1/documents/"

# Wait for processing
sleep 30

# Query about the uploaded content
curl -X POST "http://localhost:8000/api/v1/queries/ask" \
  -H "Content-Type: application/json" \
  -d '{"query": "What does VAST Data provide?", "use_llm": true}' | jq '.response'

# Should return response based on uploaded document content
```

## Configuration Options

### Adjusting File Size Limits

To modify the file size limit, edit the configuration in main.py:

```python
# In main_document_focused_simple.py, line ~45
INCREASED_FILE_LIMIT_GB = 1  # Change this value (1-10 GB recommended)
```

### Enabling Hybrid Mode (Optional)

To allow fallback to training data when no documents are found:

```python
# In main_document_focused_simple.py, line ~44
DOCUMENT_ONLY_MODE = False  # Set to False for hybrid mode
```

### Adjusting Response Token Limits

To increase response length for more detailed answers:

```python
# In QueryRequest model, line ~200
max_tokens: int = Field(1024, description="Maximum tokens for response")  # Increase from 512
```

## Monitoring and Troubleshooting

### Health Check Monitoring

Monitor system health with the enhanced health endpoint:

```bash
# Comprehensive health check
curl "http://localhost:8000/health" | jq '.'

# Expected output includes:
# - status: "healthy" or "degraded"
# - mode: "document_only"
# - max_file_size_gb: 1
# - components status for each service
```

### Log Monitoring

Monitor application logs for processing status:

```bash
# View recent backend logs
docker-compose logs --tail=50 backend-07

# Monitor logs in real-time
docker-compose logs -f backend-07
```

### Common Issues and Solutions

#### Issue: Large File Upload Fails

**Symptoms**: Files larger than 100MB fail to upload
**Solution**: Verify the enhanced main.py is deployed correctly

```bash
# Check if enhanced version is deployed
grep "INCREASED_FILE_LIMIT_GB" backend/app/main.py

# Should return the configuration line
```

#### Issue: System Still Uses Training Data

**Symptoms**: Responses include information not from uploaded documents
**Solution**: Verify document-only mode is enabled

```bash
# Check document-only mode status
curl "http://localhost:8000/health" | jq '.mode'

# Should return "document_only"
```

#### Issue: Vector Processing Not Working

**Symptoms**: Documents upload but vector search returns no results
**Solution**: Check vector processing dependencies

```bash
# Check if vector processing is available
curl "http://localhost:8000/health" | jq '.components.vector_processing'

# Should return "ok" if available
```

## Performance Optimization

### Memory Management for Large Files

The enhanced system includes optimizations for large file processing:

- **Streaming uploads**: Files are processed in chunks to prevent memory overflow
- **Background processing**: Vector generation happens asynchronously
- **Graceful degradation**: System continues to function even if vector processing fails

### Database Performance

For optimal performance with increased file volumes:

```bash
# Monitor database performance
docker-compose exec postgres-07 psql -U rag -d rag -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC;"
```

### Vector Database Optimization

Monitor Qdrant performance for large document collections:

```bash
# Check Qdrant collection status
curl "http://localhost:6333/collections/rag" | jq '.result'

# Monitor point count growth
curl "http://localhost:6333/collections/rag" | jq '.result.points_count'
```

## Rollback Procedures

If you need to revert to the previous version:

```bash
# Stop the backend service
docker-compose stop backend-07

# Restore the backup
cp backend/app/main.py.backup.* backend/app/main.py

# Restart the service
docker-compose start backend-07

# Verify rollback
curl "http://localhost:8000/health" | jq '.mode'
# Should not show "document_only" if rollback successful
```

## Next Steps and Future Enhancements

### Immediate Benefits

After deployment, you will have:

1. **Guaranteed document-only responses**: No more training data leakage
2. **Support for larger files**: Handle enterprise-scale documents up to 1GB
3. **Clear user guidance**: Explicit messages when no relevant documents exist
4. **Maintained performance**: All existing functionality preserved

### Future Enhancement Options

Consider these additional improvements for future releases:

1. **Response length controls**: Configurable token limits per query
2. **Document type classification**: Automatic categorization of uploaded files
3. **Advanced search filters**: Department-specific or date-range filtering
4. **Batch processing**: Upload and process multiple files simultaneously
5. **Quality scoring**: Confidence metrics for document relevance

### Integration Opportunities

The enhanced system provides a solid foundation for:

1. **Compliance monitoring**: Ensure responses only use approved content
2. **Knowledge base management**: Centralized document-based information system
3. **Quality assurance**: Consistent responses based on curated content
4. **Audit trails**: Complete tracking of document usage in responses

## Conclusion

This simple enhancement provides immediate value by ensuring your RAG application exclusively uses uploaded document content while supporting significantly larger files. The deployment process is straightforward and maintains backward compatibility with your existing system.

The document-only mode eliminates concerns about training data leakage while the increased file size limits enable handling of enterprise-scale documents. These improvements position your system for more sophisticated document management and quality assurance workflows in the future.

For questions or issues during deployment, monitor the application logs and use the health check endpoint to verify system status. The enhanced system maintains all existing API compatibility while providing these valuable new capabilities.

