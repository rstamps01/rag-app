# Check if backend is running
curl http://localhost:8000/

# Check Qdrant connection
curl http://localhost:6333/collections

# Check configuration
docker-compose exec backend-07 python -c "from app.core.config import settings; print(settings.QDRANT_URL)"

# Upload a document
curl -X POST http://localhost:8000/api/v1/documents/ \
  -F "./backend/test.txt"

# Wait for processing, then query
curl -X POST http://localhost:8000/api/v1/queries/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is in the uploaded document?", "department": "General"}'




Comprehensive RAG Application Fixes

Executive Summary

Based on the error logs and comprehensive code analysis, the RAG application has several critical issues preventing rich query functionality. This document provides detailed fixes for all identified problems.

Critical Issues Identified

1. QDRANT_URL Configuration Missing (CRITICAL)

Error: AttributeError: 'Settings' object has no attribute 'QDRANT_URL'
Impact: Complete query functionality failure
Status: Blocking all RAG operations

2. DocumentProcessor Constructor Mismatch (CRITICAL)

Error: DocumentProcessor.__init__() got an unexpected keyword argument 'use_gpu'
Impact: RAG service initialization failure
Status: Blocking query processing

3. Deprecated PyTorch API Usage (WARNING)

Error: torch.cuda.amp.GradScaler(args...) is deprecated
Impact: Future compatibility issues
Status: Non-blocking but needs attention

Detailed Fixes

Fix 1: Add Missing QDRANT_URL Configuration

File: backend/app/core/config.py

Problem: The VectorDBService expects settings.QDRANT_URL but it's not defined in the Settings class.

Solution: Add the missing QDRANT_URL property to the Settings class.

Python


# Vector Database Configuration - COMPLETE with missing QDRANT_URL
QDRANT_HOST: str = os.getenv("QDRANT_HOST", "qdrant-07")
QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_COLLECTION_NAME: str = os.getenv("QDRANT_COLLECTION_NAME", "rag")

# ADD THIS LINE:
QDRANT_URL: str = f"http://{QDRANT_HOST}:{QDRANT_PORT}"


Verification:

Bash


# Test the configuration
docker-compose exec backend python -c "
from app.core.config import settings
print(f'QDRANT_URL: {settings.QDRANT_URL}')
"


Fix 2: Correct DocumentProcessor Constructor

File: backend/app/services/document_processor.py

Problem: The DocumentProcessor.__init__() method doesn't accept a use_gpu parameter, but RAGService is trying to pass it.

Current Constructor:

Python


def __init__(self):
    self.embedding_model = None
    # ... rest of initialization


Solution A (Recommended): Update DocumentProcessor to accept use_gpu parameter:

Python


def __init__(self, use_gpu: bool = True):
    self.use_gpu = use_gpu
    self.device = torch.device("cuda" if use_gpu and torch.cuda.is_available() else "cpu")
    self.embedding_model = None
    # ... rest of initialization


Solution B (Alternative): Update RAGService to not pass use_gpu:

File: backend/app/services/rag_service.py

Python


# CHANGE FROM:
self.document_processor = DocumentProcessor(use_gpu=use_gpu)

# CHANGE TO:
self.document_processor = DocumentProcessor()


Fix 3: Update Deprecated PyTorch API

File: backend/app/services/gpu_accelerator.py

Problem: Using deprecated torch.cuda.amp.GradScaler() API.

Current Code (Line ~158):

Python


return torch.cuda.amp.GradScaler()


Solution:

Python


return torch.amp.GradScaler('cuda')


Fix 4: Ensure Proper Vector Database Collection Setup

File: backend/app/services/vector_db.py

Problem: The vector database service creates a "documents" collection but the application uses "rag" collection.

Current Code:

Python


if "documents" not in collection_names:
    self.client.create_collection(
        collection_name="documents",
        # ...
    )


Solution: Update to use the configured collection name:

Python


def _ensure_collections(self):
    """Ensure required collections exist"""
    from app.core.config import settings
    
    collections = self.client.get_collections().collections
    collection_names = [c.name for c in collections]
    
    # Use the configured collection name
    collection_name = settings.QDRANT_COLLECTION_NAME
    
    if collection_name not in collection_names:
        self.client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=768,  # Default embedding size
                distance=models.Distance.COSINE
            )
        )


Also update all methods to use the configured collection name:

Python


def add_document_embeddings(self, document_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
    from app.core.config import settings
    # ... existing code ...
    
    self.client.upsert(
        collection_name=settings.QDRANT_COLLECTION_NAME,  # Use configured name
        points=points
    )

def search_similar(self, query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
    from app.core.config import settings
    
    results = self.client.search(
        collection_name=settings.QDRANT_COLLECTION_NAME,  # Use configured name
        query_vector=query_embedding,
        limit=limit
    )
    # ... rest of method

def delete_document(self, document_id: str):
    from app.core.config import settings
    
    self.client.delete(
        collection_name=settings.QDRANT_COLLECTION_NAME,  # Use configured name
        points_selector=models.FilterSelector(
            # ... rest of method
        )
    )


Implementation Priority

Phase 1: Critical Fixes (Immediate)

1.
Fix 1: Add QDRANT_URL configuration

2.
Fix 2: Correct DocumentProcessor constructor

Phase 2: Important Fixes (Next)

1.
Fix 3: Update deprecated PyTorch API

2.
Fix 4: Fix vector database collection naming

Testing Procedures

Test 1: Configuration Fix Verification

Bash


# Rebuild backend with configuration fix
docker-compose build --no-cache backend
docker-compose up -d backend

# Test configuration loading
docker-compose exec backend python -c "
from app.core.config import settings
print('QDRANT_URL:', settings.QDRANT_URL)
print('QDRANT_HOST:', settings.QDRANT_HOST)
print('QDRANT_PORT:', settings.QDRANT_PORT)
"


Test 2: Query Processing Verification

Bash


# Test query endpoint
curl -X POST http://localhost:8000/api/v1/queries/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is VAST Data?", "department": "General"}'


Test 3: Vector Database Connection

Bash


# Test Qdrant connection
curl http://localhost:6333/collections

# Test collection creation
docker-compose exec backend python -c "
from app.services.vector_db import VectorDBService
vdb = VectorDBService()
print('Vector DB initialized successfully')
"


Test 4: Full Integration Test

Bash


# Upload a document
curl -X POST http://localhost:8000/api/v1/documents/ \
  -F "file=@test_document.pdf"

# Wait for processing, then query
curl -X POST http://localhost:8000/api/v1/queries/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is in the uploaded document?", "department": "General"}'


Expected Results After Fixes

Before Fixes:

•
❌ AttributeError: 'Settings' object has no attribute 'QDRANT_URL'

•
❌ DocumentProcessor.__init__() got an unexpected keyword argument 'use_gpu'

•
❌ Placeholder responses instead of AI-generated content

•
⚠️ Deprecated API warnings

After Fixes:

•
✅ Successful RAG service initialization

•
✅ Proper vector database connectivity

•
✅ Real AI-generated responses using Mistral-7B

•
✅ GPU acceleration working properly

•
✅ Document retrieval and source citations

•
✅ Processing times of 2-5 seconds for actual inference

Rollback Plan

If issues occur after implementing fixes:

1.
Revert configuration changes:

2.
Restart with original code:

3.
Check logs for new issues:

Additional Recommendations

1. Environment Variables

Ensure your .env file contains:

Bash


QDRANT_HOST=qdrant-07
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=rag
HF_TOKEN=your_huggingface_token_here


2. Docker Compose Verification

Verify your docker-compose.yml has correct service names:

YAML


services:
  qdrant-07:
    image: qdrant/qdrant
    ports:
      - "6333:6333"


3. Model Cache Validation

Ensure the Mistral-7B model cache is properly initialized:

Bash


ls -la /models_cache/models--mistralai--Mistral-7B-Instruct-v0.2/


Monitoring and Validation

After implementing fixes, monitor these metrics:

1.
Query Success Rate: Should be 100% for valid queries

2.
Response Quality: Should contain actual AI-generated content

3.
Processing Time: Should be 2-5 seconds for GPU-accelerated inference

4.
Error Logs: Should show no more AttributeError or TypeError messages

5.
GPU Utilization: Should show GPU usage during query processing

Support and Troubleshooting

If issues persist after implementing these fixes:

1.
Check Docker logs: docker-compose logs backend

2.
Verify environment variables: docker-compose exec backend env | grep -E "(QDRANT|HF_)"

3.
Test individual components: Use the test procedures above

4.
Check GPU availability: docker-compose exec backend nvidia-smi

This comprehensive fix should resolve all identified issues and enable full rich query functionality in the RAG application.

Quick Implementation Checklist

✅ Step-by-Step Implementation

Step 1: Fix QDRANT_URL Configuration

Bash


# Edit the config file
nano backend/app/core/config.py

# Add this line after the existing QDRANT configuration:
QDRANT_URL: str = f"http://{QDRANT_HOST}:{QDRANT_PORT}"


Step 2: Fix DocumentProcessor Constructor

Bash


# Edit the document processor
nano backend/app/services/document_processor.py

# Update the __init__ method to accept use_gpu parameter:
def __init__(self, use_gpu: bool = True):
    self.use_gpu = use_gpu
    self.device = torch.device("cuda" if use_gpu and torch.cuda.is_available() else "cpu")
    # ... rest of existing initialization


Step 3: Update Deprecated PyTorch API

Bash


# Edit the GPU accelerator
nano backend/app/services/gpu_accelerator.py

# Change line ~158 from:
return torch.cuda.amp.GradScaler()
# To:
return torch.amp.GradScaler('cuda')


Step 4: Fix Vector Database Collection Naming

Bash


# Edit the vector database service
nano backend/app/services/vector_db.py

# Update _ensure_collections method and all collection references
# to use settings.QDRANT_COLLECTION_NAME instead of hardcoded "documents"


Step 5: Rebuild and Test

Bash


# Rebuild the backend
docker-compose build --no-cache backend

# Restart the application
docker-compose up -d

# Test the query endpoint
curl -X POST http://localhost:8000/api/v1/queries/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is VAST Data?", "department": "General"}'


File-by-File Change Summary

1. backend/app/core/config.py

Change: Add missing QDRANT_URL configuration
Line to add: QDRANT_URL: str = f"http://{QDRANT_HOST}:{QDRANT_PORT}"
Location: After existing QDRANT configuration variables

2. backend/app/services/document_processor.py

Change: Update constructor to accept use_gpu parameter
Method: __init__(self, use_gpu: bool = True)
Impact: Enables GPU acceleration configuration

3. backend/app/services/gpu_accelerator.py

Change: Update deprecated PyTorch API
Line ~158: return torch.amp.GradScaler('cuda')
Impact: Removes deprecation warning

4. backend/app/services/vector_db.py

Change: Use configured collection name instead of hardcoded "documents"
Methods: _ensure_collections, add_document_embeddings, search_similar, delete_document
Impact: Ensures consistency with configuration

Validation Commands

Quick Health Check

Bash


# Check if backend is running
curl http://localhost:8000/

# Check Qdrant connection
curl http://localhost:6333/collections

# Check configuration
docker-compose exec backend python -c "from app.core.config import settings; print(settings.QDRANT_URL)"


Full Functionality Test

Bash


# 1. Upload a test document
curl -X POST http://localhost:8000/api/v1/documents/ \
  -F "file=@test.pdf"

# 2. Wait 30 seconds for processing

# 3. Submit a query
curl -X POST http://localhost:8000/api/v1/queries/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is in the document?", "department": "General"}'

# 4. Check query history
curl http://localhost:8000/api/v1/queries/history?limit=5


Success Indicators

After implementing all fixes, you should see:

1.
No more error messages in the logs about missing QDRANT_URL or DocumentProcessor arguments

2.
Actual AI responses instead of placeholder text

3.
GPU acceleration indicators in the response metadata

4.
Processing times of 2-5 seconds for real inference

5.
Source citations from uploaded documents

6.
Successful query history storage and retrieval

Common Issues and Solutions

Issue: "Still getting placeholder responses"

Solution: Check that the Mistral-7B model is properly loaded and the HuggingFace token is valid.

Issue: "Vector database connection failed"

Solution: Verify Qdrant service is running and accessible at the configured URL.

Issue: "GPU not being used"

Solution: Check NVIDIA drivers and CUDA availability in the container.

Issue: "Documents not being processed"

Solution: Check document upload endpoint and background task processing.

This comprehensive fix documentation should resolve all syntax errors and integration issues preventing rich query functionality in your RAG application.

