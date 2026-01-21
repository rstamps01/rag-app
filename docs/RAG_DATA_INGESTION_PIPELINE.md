# RAG Application Data Ingestion Pipeline Documentation

## Overview

This document provides a comprehensive description of the RAG (Retrieval-Augmented Generation) application's data ingestion pipeline, from file upload through vector storage completion. The pipeline processes documents, extracts text, chunks content, generates embeddings, and stores vectors in Qdrant for semantic search.

---

## Complete Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION PIPELINE                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. FILE UPLOAD
   │
   ├─► HTTP POST /api/v1/documents
   ├─► FastAPI UploadFile endpoint
   ├─► File validation (type, size)
   │
   └─► [Component 1: Upload Handler]

2. FILE VALIDATION
   │
   ├─► Check file extension (.pdf, .txt, .docx, .md, .doc)
   ├─► Validate file size (optional limit)
   ├─► Extract metadata (filename, content_type, size)
   │
   └─► [Component 2: File Validator]

3. FILE STORAGE
   │
   ├─► Generate unique document ID (UUID)
   ├─► Create upload directory (/app/data/uploads)
   ├─► Save file to disk: {file_id}_{filename}
   │
   └─► [Component 3: File Storage Service]

4. DATABASE RECORD CREATION
   │
   ├─► Create PostgreSQL Document record
   ├─► Store metadata: id, filename, content_type, size, path, department
   ├─► Set initial status: "uploaded"
   │
   └─► [Component 4: Database Service]

5. BACKGROUND TASK QUEUE
   │
   ├─► FastAPI BackgroundTasks.add_task()
   ├─► Queue: process_document_for_vectors()
   ├─► Return immediate response to client
   │
   └─► [Component 5: Background Task Manager]

6. TEXT EXTRACTION
   │
   ├─► Detect file type from extension
   ├─► Route to appropriate extractor:
   │   ├─► PDF: PyPDF2.PdfReader → page.extract_text()
   │   ├─► DOCX: python-docx → paragraph.text
   │   ├─► TXT/MD: UTF-8 read (fallback: latin-1)
   │
   └─► [Component 6: Text Extractor]

7. TEXT VALIDATION
   │
   ├─► Check extracted text is not empty
   ├─► Strip whitespace
   ├─► Validate minimum content length
   │
   └─► [Component 7: Text Validator]

8. TEXT CHUNKING
   │
   ├─► Default chunk_size: 1000 characters
   ├─► Default overlap: 200 characters
   ├─► Smart boundary detection:
   │   ├─► Prefer sentence boundaries (. ! ?)
   │   ├─► Fallback to word boundaries (spaces)
   │   ├─► Force break if no boundary found
   │
   └─► [Component 8: Text Chunker]

9. EMBEDDING MODEL INITIALIZATION
   │
   ├─► Lazy load: sentence-transformers/all-MiniLM-L6-v2
   ├─► Model: 384-dimensional embeddings
   ├─► Error handling for Pydantic validation issues
   │
   └─► [Component 9: Embedding Model Service]

10. EMBEDDING GENERATION
    │
    ├─► For each chunk: embedding_model.encode(chunk)
    ├─► Convert to list format (384D vector)
    ├─► Batch processing for efficiency
    │
    └─► [Component 10: Embedding Generator]

11. QDRANT CLIENT INITIALIZATION
    │
    ├─► Lazy connect: QdrantClient(url="http://qdrant-07:6333")
    ├─► Verify connection
    ├─► Ensure collection exists ("rag")
    │
    └─► [Component 11: Qdrant Client Service]

12. VECTOR POINT CREATION
    │
    ├─► For each chunk + embedding:
    │   ├─► Generate unique point ID (UUID)
    │   ├─► Create PointStruct:
    │   │   ├─► id: UUID
    │   │   ├─► vector: 384D embedding
    │   │   └─► payload: metadata
    │   │       ├─► document_id
    │   │       ├─► filename
    │   │       ├─► chunk_index
    │   │       ├─► content (chunk text)
    │   │       ├─► department
    │   │       ├─► file_type
    │   │       ├─► processed_at
    │   │       └─► chunk_id
    │
    └─► [Component 12: Vector Point Builder]

13. QDRANT STORAGE
    │
    ├─► Batch upsert to collection "rag"
    ├─► qdrant_client.upsert(collection_name, points)
    ├─► Verify storage success
    │
    └─► [Component 13: Qdrant Storage Service]

14. STATUS UPDATE
    │
    ├─► Update PostgreSQL Document record:
    │   ├─► status: "processed" (success) or "error" (failure)
    │   ├─► error_message: processing details
    │   ├─► vector_stored: true/false
    │
    └─► [Component 14: Status Update Service]

15. PIPELINE MONITORING
    │
    ├─► Record events in pipeline_monitor:
    │   ├─► "Document Upload Start"
    │   ├─► "Document Upload Complete"
    │   ├─► "Background Processing Queued"
    │   ├─► "Vector Processing Start"
    │   └─► "Vector Processing Complete"
    │
    └─► [Component 15: Pipeline Monitor]

16. COMPLETION
    │
    └─► Document ready for semantic search
```

---

## Component Descriptions

### Component 1: Upload Handler
**Location:** `backend/app/main.py:1373-1506`

**Function:**
- Receives HTTP POST requests at `/api/v1/documents`
- Accepts `UploadFile` and optional `department` form parameter
- Generates unique document ID using UUID
- Logs upload initiation with pipeline monitor

**Input:**
- `file: UploadFile` - The uploaded file
- `department: str` - Optional department categorization (default: "General")
- `background_tasks: BackgroundTasks` - FastAPI background task manager

**Output:**
- Returns JSON response with document_id, filename, status, and processing_queued flag
- Queues background processing task

**Transition to Next Component:**
- Passes file to Component 2 (File Validator) for validation

---

### Component 2: File Validator
**Location:** `backend/app/main.py:1394-1403`

**Function:**
- Validates file extension against allowed types
- Checks file size (if limit configured)
- Extracts file metadata

**Allowed File Types:**
- `.pdf` - PDF documents
- `.txt` - Plain text files
- `.docx` - Microsoft Word documents (OpenXML)
- `.md` - Markdown files
- `.doc` - Legacy Microsoft Word documents

**Validation Rules:**
- File extension must be in allowed list
- File size limit: Configurable (default: no limit, but 100MB mentioned in code)

**Error Handling:**
- Raises `HTTPException(400)` for invalid file types
- Logs validation failures

**Transition to Next Component:**
- If valid, passes to Component 3 (File Storage Service)

---

### Component 3: File Storage Service
**Location:** `backend/app/main.py:1422-1436`

**Function:**
- Creates upload directory if it doesn't exist (`/app/data/uploads`)
- Generates unique filename: `{file_id}_{original_filename}`
- Saves file content to disk as binary

**File Path Format:**
```
/app/data/uploads/{uuid}_{original_filename}
```

**Error Handling:**
- Creates directory with `os.makedirs(UPLOAD_DIR, exist_ok=True)`
- Raises `HTTPException(500)` if file save fails
- Logs file save operations

**Transition to Next Component:**
- After successful save, passes to Component 4 (Database Service)

---

### Component 4: Database Service
**Location:** `backend/app/main.py:1438-1454`

**Function:**
- Creates PostgreSQL `Document` record
- Stores document metadata in database
- Sets initial status to "uploaded"

**Database Schema (Document model):**
```python
- id: str (UUID, primary key)
- filename: str
- content_type: str
- size: int (bytes)
- status: str (default: "uploaded")
- path: str (file system path)
- department: str
- processing_status: str
- vector_stored: bool
- error_message: Optional[str]
- created_at: datetime
- updated_at: datetime
```

**Error Handling:**
- Database errors are logged but don't block processing
- Document record creation is optional (graceful degradation)

**Transition to Next Component:**
- After database record creation, passes to Component 5 (Background Task Manager)

---

### Component 5: Background Task Manager
**Location:** `backend/app/main.py:1465-1481`

**Function:**
- Queues asynchronous processing task using FastAPI `BackgroundTasks`
- Returns immediate response to client (non-blocking)
- Ensures processing happens asynchronously

**Task Function:**
```python
process_document_for_vectors(
    file_id, file_path, filename, department, None
)
```

**Benefits:**
- Client receives immediate response
- Processing happens in background
- Prevents request timeout for large files

**Transition to Next Component:**
- Background task executes Component 6 (Text Extractor) when ready

---

### Component 6: Text Extractor
**Location:** `backend/app/main.py:356-380` and `backend/app/services/integrated_document_processor.py:128-193`

**Function:**
- Extracts text content from various file formats
- Routes to format-specific extractors based on file extension

**Extraction Methods:**

**PDF Extraction:**
- Library: `PyPDF2`
- Method: `PdfReader(file).pages[].extract_text()`
- Processes each page sequentially
- Concatenates page text with newlines

**DOCX Extraction:**
- Library: `python-docx`
- Method: `Document(file_path).paragraphs[].text`
- Extracts all paragraphs
- Concatenates with newlines

**TXT/MD Extraction:**
- Primary encoding: UTF-8
- Fallback encoding: latin-1 (if UTF-8 fails)
- Direct file read

**Error Handling:**
- Returns empty string on extraction failure
- Logs extraction errors
- Continues processing even if extraction partially fails

**Transition to Next Component:**
- Extracted text passed to Component 7 (Text Validator)

---

### Component 7: Text Validator
**Location:** `backend/app/main.py:465-466`

**Function:**
- Validates extracted text is not empty
- Checks text contains meaningful content (not just whitespace)

**Validation Rules:**
- Text must not be empty after stripping
- Raises exception if no content extracted

**Error Handling:**
- Raises `Exception("No text content extracted from file")` if validation fails
- Updates document status to "error" in database

**Transition to Next Component:**
- If valid, passes to Component 8 (Text Chunker)

---

### Component 8: Text Chunker
**Location:** `backend/app/main.py:382-420` and `backend/app/services/integrated_document_processor.py:195-254`

**Function:**
- Splits text into overlapping chunks for vector embedding
- Uses intelligent boundary detection to preserve context

**Configuration:**
- Default `chunk_size`: 1000 characters (configurable via `settings.CHUNK_SIZE`)
- Default `overlap`: 200 characters (configurable via `settings.CHUNK_OVERLAP`)

**Chunking Algorithm:**

1. **Sentence Boundary Detection (Preferred):**
   - Looks for sentence endings: `. `, `! `, `? `, `.\n`, `!\n`, `?\n`
   - Prefers breaks near chunk boundary (within last 50% of chunk)
   - Selects best sentence break position

2. **Word Boundary Detection (Fallback):**
   - If no sentence boundary found, looks for space character
   - Prefers breaks near chunk boundary (within last 50% of chunk)

3. **Force Break (Last Resort):**
   - If no suitable boundary found, breaks at exact chunk_size
   - Ensures progress is made

4. **Overlap Application:**
   - Next chunk starts at: `end_position - overlap`
   - Ensures context preservation between chunks

**Special Cases:**
- If text length ≤ chunk_size: returns single chunk
- Last chunk: includes all remaining text

**Error Handling:**
- Returns original text as single chunk if chunking fails
- Logs chunking errors

**Transition to Next Component:**
- List of chunks passed to Component 9 (Embedding Model Service)

---

### Component 9: Embedding Model Service
**Location:** `backend/app/main.py:472-596`

**Function:**
- Lazy loads embedding model on first use
- Initializes SentenceTransformer model
- Handles Pydantic validation errors gracefully

**Model Details:**
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Embedding Dimension: 384
- Model Type: Sentence Transformer (BERT-based)

**Initialization Strategy:**
1. Try safe loader with Pydantic patches
2. Fallback to direct initialization with error suppression
3. Try CPU-first loading if validation errors occur
4. Verify model works with test encoding

**Error Handling:**
- Multiple fallback strategies for initialization
- Suppresses Pydantic validation warnings (non-fatal)
- Logs initialization attempts and results

**Transition to Next Component:**
- Initialized model passed to Component 10 (Embedding Generator)

---

### Component 10: Embedding Generator
**Location:** `backend/app/main.py:616-618`

**Function:**
- Generates vector embeddings for each text chunk
- Converts embeddings to list format for Qdrant

**Process:**
```python
for chunk in chunks:
    embedding = embedding_model.encode(chunk).tolist()
    # embedding is now a 384-element list
```

**Batch Processing:**
- Model can encode multiple chunks in batch (more efficient)
- Current implementation processes sequentially

**Output Format:**
- List of 384-dimensional float vectors
- Each vector represents semantic meaning of chunk

**Transition to Next Component:**
- Embeddings passed to Component 11 (Qdrant Client Service)

---

### Component 11: Qdrant Client Service
**Location:** `backend/app/main.py:598-606`

**Function:**
- Lazy initializes Qdrant client connection
- Verifies connection to Qdrant server
- Ensures collection exists

**Connection Details:**
- URL: `http://qdrant-07:6333` (default)
- Collection Name: `"rag"` (default)

**Collection Configuration:**
- Vector Size: 384 (matches embedding dimension)
- Distance Metric: Cosine (default)
- Index Type: HNSW (default)

**Error Handling:**
- Logs connection failures
- Continues processing if connection unavailable (graceful degradation)

**Transition to Next Component:**
- Initialized client passed to Component 12 (Vector Point Builder)

---

### Component 12: Vector Point Builder
**Location:** `backend/app/main.py:614-636`

**Function:**
- Creates Qdrant PointStruct objects for each chunk
- Packages embeddings with metadata

**Point Structure:**
```python
PointStruct(
    id=chunk_id,  # UUID string
    vector=embedding,  # 384D list
    payload={
        "document_id": file_id,
        "filename": filename,
        "chunk_index": i,
        "content": chunk,  # Original text
        "department": department,
        "file_type": file_ext,
        "processed_at": time.time(),
        "chunk_id": chunk_id
    }
)
```

**Metadata Fields:**
- `document_id`: Links chunk to original document
- `filename`: Original filename for reference
- `chunk_index`: Position in document (0-based)
- `content`: Full chunk text (for retrieval)
- `department`: Categorization
- `file_type`: File extension
- `processed_at`: Unix timestamp
- `chunk_id`: Unique chunk identifier

**Transition to Next Component:**
- List of PointStruct objects passed to Component 13 (Qdrant Storage Service)

---

### Component 13: Qdrant Storage Service
**Location:** `backend/app/main.py:638-642`

**Function:**
- Stores vector points in Qdrant collection
- Performs batch upsert operation

**Storage Operation:**
```python
qdrant_client.upsert(
    collection_name="rag",
    points=points  # List of PointStruct objects
)
```

**Batch Processing:**
- All points for a document are upserted in single operation
- Efficient for multiple chunks per document

**Error Handling:**
- Catches and logs storage exceptions
- Sets `vectors_stored = False` on failure
- Continues to status update even if storage fails

**Transition to Next Component:**
- Storage result passed to Component 14 (Status Update Service)

---

### Component 14: Status Update Service
**Location:** `backend/app/main.py:657-681`

**Function:**
- Updates PostgreSQL Document record with processing results
- Sets final status based on success/failure

**Status Values:**
- `"uploaded"`: Initial state after file upload
- `"processing"`: Background task started
- `"processed"`: Successfully processed and stored
- `"error"`: Processing failed

**Update Fields:**
- `status`: Final processing status
- `error_message`: Details about processing (success or error)
- `vector_stored`: Boolean indicating if vectors were stored

**Error Handling:**
- Database update errors are logged
- Rollback on database errors
- Always closes database session in finally block

**Transition to Next Component:**
- Status update triggers Component 15 (Pipeline Monitor)

---

### Component 15: Pipeline Monitor
**Location:** `backend/app/main.py:1414-1420, 1457-1463, 1474-1477`

**Function:**
- Records pipeline events for monitoring and debugging
- Tracks processing stages and timing

**Event Types:**
- `"Document Upload Start"`: Upload initiated
- `"Document Upload Complete"`: File saved successfully
- `"Background Processing Queued"`: Task queued
- `"Vector Processing Start"`: Background task started
- `"Vector Processing Complete"`: Processing finished

**Event Data:**
- Timestamp
- Document ID
- Stage name
- Metadata (filename, size, department, etc.)

**Usage:**
- Real-time monitoring via WebSocket
- Historical analysis
- Debugging pipeline issues

**Transition to Next Component:**
- Monitoring completes the pipeline

---

## Data Flow Summary

### Synchronous Flow (Upload Response):
1. File Upload → Validation → Storage → Database Record → Background Task Queue → **Return Response**

### Asynchronous Flow (Background Processing):
1. Text Extraction → Validation → Chunking → Embedding Generation → Vector Storage → Status Update → **Complete**

---

## Configuration Parameters

### File Processing
| Parameter | Default | Location | Description |
|-----------|---------|----------|-------------|
| `UPLOAD_DIR` | `/app/data/uploads` | `main.py:709` | Upload directory path |
| Allowed Extensions | `.pdf, .txt, .docx, .md, .doc` | `main.py:1395` | Supported file types |
| Max File Size | None (100MB mentioned) | `config.py` | File size limit |

### Text Chunking
| Parameter | Default | Location | Description |
|-----------|---------|----------|-------------|
| `CHUNK_SIZE` | 1000 | `main.py:387` | Characters per chunk |
| `CHUNK_OVERLAP` | 200 | `main.py:389` | Overlap between chunks |

### Embedding Model
| Parameter | Default | Location | Description |
|-----------|---------|----------|-------------|
| `EMBEDDING_MODEL_NAME` | `sentence-transformers/all-MiniLM-L6-v2` | `main.py:485` | Model identifier |
| Embedding Dimension | 384 | Model-specific | Vector size |

### Qdrant Configuration
| Parameter | Default | Location | Description |
|-----------|---------|----------|-------------|
| `QDRANT_URL` | `http://qdrant-07:6333` | `main.py:602` | Qdrant server URL |
| `QDRANT_COLLECTION_NAME` | `"rag"` | `main.py:640` | Collection name |
| Vector Size | 384 | Collection config | Must match embedding dimension |
| Distance Metric | Cosine | Collection config | Similarity metric |

---

## Error Handling Strategy

### Graceful Degradation
- Database failures don't block file processing
- Qdrant failures are logged but don't crash pipeline
- Missing services are detected and logged

### Error States
- **Upload Errors**: Return HTTP 400/500 immediately
- **Processing Errors**: Update document status to "error" in database
- **Storage Errors**: Log error, mark document as failed

### Recovery Mechanisms
- Lazy initialization retries for embedding model
- Database session management with proper cleanup
- Background task error handling with status updates

---

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Embedding model and Qdrant client initialized on first use
2. **Background Processing**: Non-blocking upload response
3. **Batch Operations**: Multiple chunks upserted together
4. **Smart Chunking**: Sentence/word boundary detection preserves context

### Bottlenecks
1. **Text Extraction**: PDF/DOCX parsing can be slow for large files
2. **Embedding Generation**: CPU-intensive, sequential processing
3. **Qdrant Storage**: Network latency for vector upserts

### Scalability
- Background tasks allow concurrent uploads
- Batch processing reduces Qdrant API calls
- Database indexing on document_id for fast lookups

---

## Reproducibility Guide

### Prerequisites
1. **Python 3.10+**
2. **PostgreSQL Database**
3. **Qdrant Vector Database**
4. **Required Libraries:**
   - `fastapi`
   - `sentence-transformers`
   - `qdrant-client`
   - `PyPDF2`
   - `python-docx`
   - `sqlalchemy`
   - `psycopg2`

### Implementation Steps

1. **Set up Upload Endpoint:**
   ```python
   @app.post("/api/v1/documents")
   async def upload_document(
       file: UploadFile = File(...),
       department: Optional[str] = Form("General"),
       background_tasks: BackgroundTasks = BackgroundTasks(),
       db: Session = Depends(get_db)
   ):
       # Implement Components 1-5
   ```

2. **Implement Text Extraction:**
   ```python
   def extract_text_from_file(file_path: str, file_ext: str) -> str:
       # Implement Component 6
   ```

3. **Implement Text Chunking:**
   ```python
   def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
       # Implement Component 8
   ```

4. **Initialize Embedding Model:**
   ```python
   from sentence_transformers import SentenceTransformer
   embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
   ```

5. **Initialize Qdrant Client:**
   ```python
   from qdrant_client import QdrantClient
   qdrant_client = QdrantClient(url="http://qdrant-07:6333")
   ```

6. **Create Background Processing Task:**
   ```python
   async def process_document_for_vectors(
       file_id: str, file_path: str, filename: str, department: str
   ):
       # Implement Components 6-14
   ```

7. **Store Vectors in Qdrant:**
   ```python
   from qdrant_client.models import PointStruct
   points = [PointStruct(id=uuid, vector=embedding, payload=metadata)]
   qdrant_client.upsert(collection_name="rag", points=points)
   ```

---

## Testing Checklist

### Unit Tests
- [ ] File validation (allowed types, size limits)
- [ ] Text extraction (PDF, DOCX, TXT)
- [ ] Text chunking (boundary detection, overlap)
- [ ] Embedding generation (dimension, format)
- [ ] Vector point creation (metadata structure)

### Integration Tests
- [ ] End-to-end upload → storage flow
- [ ] Database record creation
- [ ] Qdrant storage verification
- [ ] Status update accuracy
- [ ] Error handling and recovery

### Performance Tests
- [ ] Large file processing (100MB+)
- [ ] Concurrent uploads
- [ ] Embedding generation speed
- [ ] Qdrant batch upsert performance

---

## Monitoring and Observability

### Key Metrics
- Upload success rate
- Processing time per document
- Chunk count per document
- Vector storage success rate
- Error rates by component

### Logging Points
- Upload initiation and completion
- Text extraction results
- Chunking statistics
- Embedding generation completion
- Qdrant storage results
- Status updates

### Pipeline Events
- Document Upload Start
- Document Upload Complete
- Background Processing Queued
- Vector Processing Start
- Vector Processing Complete

---

## Conclusion

This pipeline provides a robust, scalable solution for ingesting documents into a RAG system. The architecture supports:

- **Asynchronous Processing**: Non-blocking uploads
- **Error Resilience**: Graceful degradation and recovery
- **Scalability**: Background tasks and batch operations
- **Observability**: Comprehensive logging and monitoring
- **Flexibility**: Configurable parameters for different use cases

The modular design allows for easy extension and modification of individual components while maintaining the overall pipeline integrity.
