# RAG Application Query Pipeline Documentation

## Overview

This document provides a comprehensive description of the RAG (Retrieval-Augmented Generation) application's query processing pipeline, from user query submission through response generation and storage. The pipeline retrieves relevant context from vector storage, generates embeddings, performs semantic search, and uses an LLM to generate contextualized responses.

---

## Complete Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QUERY PROCESSING PIPELINE                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. QUERY RECEPTION
   │
   ├─► HTTP POST /api/v1/queries/ask
   ├─► FastAPI QueryRequest endpoint
   ├─► Extract query parameters (query, department, use_llm, use_vector_search)
   │
   └─► [Component 1: Query Handler]

2. QUERY VALIDATION
   │
   ├─► Validate query text (non-empty, minimum length)
   ├─► Validate department parameter
   ├─► Validate service flags (use_llm, use_vector_search)
   │
   └─► [Component 2: Query Validator]

3. QUERY RESULT CACHE CHECK
   │
   ├─► Generate cache key (MD5 hash of query + parameters)
   ├─► Check query_cache for existing result
   ├─► If cache hit: Return cached response immediately
   │
   └─► [Component 3: Query Cache Service]

4. EMBEDDING MODEL INITIALIZATION (Lazy)
   │
   ├─► Check if embedding_model is loaded
   ├─► If not: Lazy initialize sentence-transformers/all-MiniLM-L6-v2
   ├─► Apply Pydantic validation patches
   ├─► Verify model with test encoding
   │
   └─► [Component 4: Embedding Model Service]

5. EMBEDDING CACHE CHECK
   │
   ├─► Generate cache key (MD5 hash of query text)
   ├─► Check embedding_cache for existing embedding
   ├─► If cache hit: Return cached embedding
   │
   └─► [Component 5: Embedding Cache Service]

6. QUERY EMBEDDING GENERATION
   │
   ├─► Execute in thread pool (non-blocking)
   ├─► embedding_model.encode(query)
   ├─► Convert to list format (384D vector)
   ├─► Cache embedding for future use
   │
   └─► [Component 6: Embedding Generator]

7. QDRANT CLIENT INITIALIZATION (Lazy)
   │
   ├─► Check if qdrant_client is connected
   ├─► If not: Lazy connect to http://qdrant-07:6333
   ├─► Verify connection
   │
   └─► [Component 7: Qdrant Client Service]

8. VECTOR SEARCH EXECUTION
   │
   ├─► qdrant_client.search(
   │   ├─► collection_name: "rag"
   │   ├─► query_vector: 384D embedding
   │   ├─► limit: 5 (default, configurable)
   │   ├─► score_threshold: 0.5 (default, configurable)
   │   └─► with_payload: True
   │
   └─► [Component 8: Vector Search Service]

9. SEARCH RESULT PROCESSING
   │
   ├─► Extract ScoredPoint objects from results
   ├─► Process each result:
   │   ├─► Extract content (backward compatible: "content" or "text")
   │   ├─► Extract metadata (filename, chunk_index, department, file_type)
   │   ├─► Extract similarity score
   │   └─► Format as source document
   │
   └─► [Component 9: Result Processor]

10. CONTEXT PREPARATION
    │
    ├─► Select top N chunks (default: 8, configurable via MAX_CONTEXT_CHUNKS)
    ├─► Extract content from source documents
    ├─► Join chunks with "\n\n" separator
    ├─► Prepare context string for LLM
    │
    └─► [Component 10: Context Builder]

11. LLM SERVICE INITIALIZATION (Lazy)
    │
    ├─► Check if llm_service is loaded
    ├─► If not: Lazy initialize LLM model
    │   ├─► CPU: microsoft/phi-2 (2.7B)
    │   └─► GPU: mistralai/Mistral-7B-Instruct-v0.2 (7B)
    ├─► Load tokenizer and model
    │
    └─► [Component 11: LLM Service]

12. PROMPT CONSTRUCTION
    │
    ├─► Build prompt template:
    │   ├─► If context available:
    │   │   └─► Include context + query + instructions
    │   └─► If no context:
    │       └─► Simple query format
    │
    └─► [Component 12: Prompt Builder]

13. LLM RESPONSE GENERATION
    │
    ├─► Execute in thread pool (non-blocking, ~30s generation)
    ├─► pipeline.generate():
    │   ├─► max_new_tokens: 1536
    │   ├─► temperature: 0.7
    │   ├─► top_p: 0.9
    │   ├─► top_k: 50
    │   ├─► repetition_penalty: 1.15
    │   └─► do_sample: True
    ├─► Extract generated text
    ├─► Calculate tokens per second
    │
    └─► [Component 13: LLM Generator]

14. RESPONSE FORMATTING
    │
    ├─► Extract response text (handle dict/string formats)
    ├─► Prepare QueryResponse object:
    │   ├─► response: Generated text
    │   ├─► model: Model name used
    │   ├─► timestamp: Unix timestamp
    │   ├─► query_id: Unique query identifier
    │   ├─► processing_time: Total processing time
    │   ├─► sources: List of source documents
    │   ├─► used_llm: Boolean flag
    │   └─► used_vector_search: Boolean flag
    │
    └─► [Component 14: Response Formatter]

15. QUERY RESULT CACHING
    │
    ├─► Store response in query_cache
    ├─► Cache key: MD5 hash of query + parameters
    ├─► Cache TTL: 1800 seconds (30 minutes)
    │
    └─► [Component 15: Query Cache Service]

16. QUERY HISTORY STORAGE
    │
    ├─► Create QueryHistory record in PostgreSQL
    ├─► Store:
    │   ├─► query_text
    │   ├─► response_text
    │   ├─► llm_model_used
    │   ├─► processing_time_ms
    │   ├─► department_filter
    │   ├─► gpu_accelerated
    │   └─► sources_retrieved (JSON)
    │
    └─► [Component 16: Query History Service]

17. FALLBACK HANDLING
    │
    ├─► If LLM fails: Use contextual response from sources
    ├─► If no sources: Use generic response
    ├─► If vector search fails: Continue without context
    │
    └─► [Component 17: Fallback Handler]

18. RESPONSE RETURN
    │
    └─► Return QueryResponse to client
```

---

## Component Descriptions

### Component 1: Query Handler
**Location:** `backend/app/main.py:1086-1090`

**Function:**
- Receives HTTP POST requests at `/api/v1/queries/ask`
- Accepts `QueryRequest` with query text and optional parameters
- Logs query reception with service status
- Records start time for performance tracking

**Input:**
- `request: QueryRequest` - Contains:
  - `query: str` - User query text
  - `department: str` - Optional department filter (default: "General")
  - `use_llm: bool` - Enable LLM generation (default: True)
  - `use_vector_search: bool` - Enable vector search (default: True)
- `db: Session` - Database session for query history

**Output:**
- Returns `QueryResponse` with generated response and metadata

**Transition to Next Component:**
- Passes query to Component 2 (Query Validator) for validation

---

### Component 2: Query Validator
**Location:** `backend/app/main.py:1093-1095` (implicit validation)

**Function:**
- Validates query text is not empty
- Validates minimum query length (implicit: 3+ characters)
- Validates service availability flags

**Validation Rules:**
- Query must be non-empty string
- Query should have minimum meaningful length
- Department must be valid (defaults to "General" if invalid)

**Error Handling:**
- Raises `HTTPException(400)` for invalid queries
- Logs validation failures

**Transition to Next Component:**
- If valid, passes to Component 3 (Query Cache Service)

---

### Component 3: Query Cache Service
**Location:** `backend/app/main.py:1097-1118`

**Function:**
- Checks if query result is cached
- Generates cache key from query and parameters
- Returns cached response if available

**Cache Key Generation:**
```python
cache_key_data = {
    "query": request.query,
    "department": request.department,
    "use_llm": request.use_llm,
    "use_vector_search": request.use_vector_search
}
cache_key = MD5(json.dumps(cache_key_data, sort_keys=True))
```

**Cache Configuration:**
- Service: `app.services.cache_service.query_cache`
- Max Size: 500 entries
- TTL: 1800 seconds (30 minutes)

**Cache Hit Behavior:**
- Returns cached response immediately
- Adds `"cached": True` flag to response
- Skips all downstream processing

**Transition to Next Component:**
- If cache miss, continues to Component 4 (Embedding Model Service)

---

### Component 4: Embedding Model Service
**Location:** `backend/app/main.py:978-1045`

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
- Returns `None` if all initialization strategies fail

**Transition to Next Component:**
- Initialized model passed to Component 5 (Embedding Cache Service)

---

### Component 5: Embedding Cache Service
**Location:** `backend/app/main.py:1048-1057`

**Function:**
- Checks if query embedding is cached
- Generates cache key from query text
- Returns cached embedding if available

**Cache Key Generation:**
```python
cache_key = hashlib.md5(query.encode()).hexdigest()
```

**Cache Configuration:**
- Service: `app.services.cache_service.embedding_cache`
- Max Size: 1000 entries
- TTL: 7200 seconds (2 hours)

**Cache Hit Behavior:**
- Returns cached embedding immediately
- Skips embedding generation

**Transition to Next Component:**
- If cache miss, passes to Component 6 (Embedding Generator)

---

### Component 6: Embedding Generator
**Location:** `backend/app/main.py:1059-1066`

**Function:**
- Generates vector embedding for query text
- Executes in thread pool to avoid blocking event loop
- Caches embedding for future use

**Process:**
```python
embedding = embedding_model.encode(query).tolist()
# embedding is now a 384-element list
```

**Thread Pool Execution:**
- Uses `_query_processing_executor` (8 workers)
- Prevents blocking FastAPI event loop
- Allows concurrent query processing

**Caching:**
- Stores embedding in `embedding_cache` after generation
- Cache key: MD5 hash of query text

**Error Handling:**
- Returns `None` if embedding generation fails
- Logs errors for debugging

**Transition to Next Component:**
- Embedding passed to Component 7 (Qdrant Client Service)

---

### Component 7: Qdrant Client Service
**Location:** `backend/app/main.py:598-606` (from ingestion pipeline)

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
- Initialized client passed to Component 8 (Vector Search Service)

---

### Component 8: Vector Search Service
**Location:** `backend/app/main.py:1148-1153`

**Function:**
- Performs semantic search in Qdrant vector database
- Finds most similar document chunks to query
- Applies similarity threshold filtering

**Search Parameters:**
```python
search_results = qdrant_client.search(
    collection_name="rag",
    query_vector=query_embedding,  # 384D list
    limit=5,                       # Default, configurable
    score_threshold=0.5,           # Default, configurable
    with_payload=True              # Include metadata
)
```

**Configuration:**
- `VECTOR_SEARCH_LIMIT`: Default 5 results (configurable)
- `VECTOR_SEARCH_SCORE_THRESHOLD`: Default 0.5 (configurable)
- `VECTOR_SEARCH_EF`: HNSW search quality parameter (default: 128)

**Search Algorithm:**
- Uses HNSW (Hierarchical Navigable Small World) index
- Cosine similarity for distance calculation
- Returns top N results above threshold

**Error Handling:**
- Catches and logs search exceptions
- Returns empty list on failure
- Continues processing without sources

**Transition to Next Component:**
- Search results passed to Component 9 (Result Processor)

---

### Component 9: Result Processor
**Location:** `backend/app/main.py:1155-1167`

**Function:**
- Processes Qdrant ScoredPoint objects
- Extracts content and metadata
- Formats results as source documents

**Result Structure:**
```python
{
    "content": str,           # Chunk text (backward compatible: "content" or "text")
    "filename": str,          # Original filename
    "score": float,           # Similarity score (0.0-1.0)
    "chunk_index": int,       # Position in document
    "department": str,        # Department categorization
    "file_type": str          # File extension
}
```

**Backward Compatibility:**
- Handles both "content" (new) and "text" (old) payload fields
- Ensures compatibility with older document formats

**Metadata Extraction:**
- Extracts all available metadata from payload
- Provides defaults for missing fields
- Preserves document structure information

**Transition to Next Component:**
- Processed sources passed to Component 10 (Context Builder)

---

### Component 10: Context Builder
**Location:** `backend/app/main.py:1183-1190`

**Function:**
- Prepares context string from retrieved document chunks
- Selects top N chunks for LLM context
- Formats context for prompt injection

**Context Selection:**
- Default: Top 8 chunks (configurable via `MAX_CONTEXT_CHUNKS`)
- Selection based on similarity score (already sorted)
- Limits context to prevent token overflow

**Context Formatting:**
```python
context_chunks = [source.get("content", "") for source in sources[:max_context_chunks]]
context = "\n\n".join(context_chunks)
```

**Configuration:**
- `MAX_CONTEXT_CHUNKS`: Default 8 (configurable)
- Chunk separator: `"\n\n"` (double newline)

**Error Handling:**
- Returns empty string if no sources available
- Handles missing content gracefully

**Transition to Next Component:**
- Context string passed to Component 11 (LLM Service)

---

### Component 11: LLM Service
**Location:** `backend/app/services/enhanced_llm_service.py:125-157`

**Function:**
- Manages LLM model loading and generation
- Lazy loads model on first use
- Handles CPU/GPU model selection

**Model Selection:**
- **CPU-only systems**: `microsoft/phi-2` (2.7B parameters)
- **GPU systems**: `mistralai/Mistral-7B-Instruct-v0.2` (7B parameters)

**Lazy Loading:**
- Model loads on first query (not at startup)
- Thread-safe loading with lock mechanism
- Prevents multiple simultaneous loads

**Model Configuration:**
- Precision: float16 (reduces memory usage)
- Device: CPU or CUDA (auto-detected)
- Cache directory: `/app/models_cache`

**Error Handling:**
- Logs initialization failures
- Returns `None` if model unavailable
- Continues with fallback responses

**Transition to Next Component:**
- Initialized service passed to Component 12 (Prompt Builder)

---

### Component 12: Prompt Builder
**Location:** `backend/app/services/enhanced_llm_service.py:417-432`

**Function:**
- Constructs prompt template for LLM
- Includes context and query
- Formats according to model requirements

**Prompt Template (with context):**
```
<s>[INST] You are an expert assistant. Based on the following context, provide a comprehensive, detailed answer to the question.

Context:
{context}

Question: {query}

Instructions:
- Provide a thorough, well-structured answer
- Include relevant details from the context
- Use clear explanations and examples where appropriate
- If the context doesn't fully answer the question, indicate what information is available
[/INST]
```

**Prompt Template (no context):**
```
<s>[INST] {query} [/INST]
```

**Model Format:**
- Uses Mistral instruction format (`[INST]...[/INST]`)
- Includes system message for context-aware responses
- Provides clear instructions for response quality

**Transition to Next Component:**
- Constructed prompt passed to Component 13 (LLM Generator)

---

### Component 13: LLM Generator
**Location:** `backend/app/services/enhanced_llm_service.py:436-448`

**Function:**
- Generates response using LLM pipeline
- Executes in thread pool to avoid blocking
- Applies generation parameters

**Generation Parameters:**
- `max_new_tokens`: 1536 (increased from 512 for longer responses)
- `temperature`: 0.7 (creativity/randomness)
- `top_p`: 0.9 (nucleus sampling)
- `top_k`: 50 (diversity)
- `repetition_penalty`: 1.15 (prevents repetition)
- `do_sample`: True (enables sampling)

**Thread Pool Execution:**
- Uses `_query_processing_executor` (8 workers)
- Prevents blocking FastAPI event loop during ~30s generation
- Allows concurrent query processing

**Performance Metrics:**
- Calculates processing time
- Counts input/output tokens
- Calculates tokens per second

**Error Handling:**
- Catches generation exceptions
- Returns `None` on failure
- Logs errors for debugging

**Transition to Next Component:**
- Generated response passed to Component 14 (Response Formatter)

---

### Component 14: Response Formatter
**Location:** `backend/app/main.py:1201-1298`

**Function:**
- Formats LLM response for API return
- Handles both dict and string response formats
- Constructs QueryResponse object

**Response Structure:**
```python
QueryResponse(
    response=str,                    # Generated text
    model=str,                      # Model name
    timestamp=float,                # Unix timestamp
    query_id=str,                   # Unique identifier
    processing_time=float,          # Total time (seconds)
    sources=List[Dict],             # Source documents
    used_llm=bool,                  # LLM flag
    used_vector_search=bool         # Vector search flag
)
```

**Format Handling:**
- Extracts response from dict if needed
- Converts to string format
- Preserves all metadata

**Error Handling:**
- Handles missing response gracefully
- Provides fallback text if needed
- Logs formatting errors

**Transition to Next Component:**
- Formatted response passed to Component 15 (Query Cache Service)

---

### Component 15: Query Cache Service
**Location:** `backend/app/main.py:1245-1250`

**Function:**
- Stores query result in cache
- Uses same cache key as check (Component 3)
- Enables fast retrieval for repeated queries

**Cache Storage:**
```python
query_cache.set(response_data, cache_key)
```

**Cache Configuration:**
- Service: `app.services.cache_service.query_cache`
- Max Size: 500 entries
- TTL: 1800 seconds (30 minutes)

**Cached Data:**
- Complete response object
- Sources and metadata
- Processing flags

**Error Handling:**
- Logs cache failures (non-fatal)
- Continues processing even if caching fails

**Transition to Next Component:**
- After caching, passes to Component 16 (Query History Service)

---

### Component 16: Query History Service
**Location:** `backend/app/main.py:1252-1281`

**Function:**
- Stores query and response in PostgreSQL
- Creates QueryHistory record
- Tracks query metadata for analytics

**Database Schema (QueryHistory model):**
```python
- id: int (primary key, auto-increment)
- query_text: str
- response_text: str
- llm_model_used: str
- processing_time_ms: int
- query_timestamp: datetime
- department_filter: str
- gpu_accelerated: bool
- sources_retrieved: JSON
  - context_chunks_used: int
  - vector_search_used: bool
  - sources: List[Dict] (first 3 sources)
```

**Storage Process:**
1. Extract response text (handle dict/string)
2. Create QueryHistory record
3. Commit to database
4. Generate query_id from database ID

**Error Handling:**
- Database errors are logged but don't block response
- Query ID falls back to timestamp-based ID
- Graceful degradation if database unavailable

**Transition to Next Component:**
- After storage, response is returned to client

---

### Component 17: Fallback Handler
**Location:** `backend/app/main.py:1212-1229`

**Function:**
- Provides fallback responses when services fail
- Ensures user always receives a response
- Maintains system availability

**Fallback Strategies:**

**1. LLM Generation Failed (with sources):**
```python
response_text = f"Based on the relevant documents found, here's what I can tell you about '{query}': {sources[0].get('content', '')[:500]}..."
```

**2. LLM Generation Failed (no sources):**
```python
response_text = f"I understand you're asking about: '{query}'. While I'm currently unable to access the full LLM capabilities..."
```

**3. No LLM, No Sources (VAST query):**
```python
response_text = f"Based on your question about '{query}', VAST Data provides enterprise-grade storage solutions..."
```

**4. Generic Fallback:**
```python
response_text = f"Thank you for your question: '{query}'. The RAG system is operational..."
```

**Error Handling:**
- Always provides a response
- Logs fallback usage
- Maintains user experience

**Transition to Next Component:**
- Fallback response passed to Component 14 (Response Formatter)

---

## Data Flow Summary

### Synchronous Flow (Cache Hit):
1. Query Reception → Validation → Cache Check → **Return Cached Response**

### Asynchronous Flow (Cache Miss):
1. Query Reception → Validation → Cache Check (miss) → Embedding Generation → Vector Search → Context Preparation → LLM Generation → Response Formatting → Caching → History Storage → **Return Response**

### Parallel Processing:
- Embedding generation and Qdrant connection can initialize in parallel
- Vector search executes while LLM service initializes (if needed)
- Thread pool execution prevents blocking

---

## Configuration Parameters

### Query Processing
| Parameter | Default | Location | Description |
|-----------|---------|----------|-------------|
| `VECTOR_SEARCH_LIMIT` | 5 | `main.py:1144` | Number of search results |
| `VECTOR_SEARCH_SCORE_THRESHOLD` | 0.5 | `main.py:1145` | Minimum similarity score |
| `VECTOR_SEARCH_EF` | 128 | `integrated_vector_db_service.py:465` | HNSW search quality |
| `MAX_CONTEXT_CHUNKS` | 8 | `main.py:1187` | Max chunks for LLM context |

### LLM Generation
| Parameter | Default | Location | Description |
|-----------|---------|----------|-------------|
| `max_new_tokens` | 1536 | `enhanced_llm_service.py:402` | Maximum response length |
| `temperature` | 0.7 | `enhanced_llm_service.py:403` | Creativity/randomness |
| `top_p` | 0.9 | `enhanced_llm_service.py:404` | Nucleus sampling |
| `top_k` | 50 | `enhanced_llm_service.py:443` | Diversity parameter |
| `repetition_penalty` | 1.15 | `enhanced_llm_service.py:406` | Prevents repetition |

### Caching
| Parameter | Default | Location | Description |
|-----------|---------|----------|-------------|
| Query Cache Size | 500 | `cache_service.py:45` | Max cached queries |
| Query Cache TTL | 1800s | `cache_service.py:45` | 30 minutes |
| Embedding Cache Size | 1000 | `cache_service.py:46` | Max cached embeddings |
| Embedding Cache TTL | 7200s | `cache_service.py:46` | 2 hours |

### Thread Pool
| Parameter | Default | Location | Description |
|-----------|---------|----------|-------------|
| `max_workers` | 8 | `main.py:974` | Thread pool size |
| Thread Name Prefix | "query_processor" | `main.py:975` | Thread identification |

---

## Error Handling Strategy

### Graceful Degradation
- **Cache failures**: Continue without caching (non-fatal)
- **Embedding failures**: Skip vector search, continue with LLM only
- **Vector search failures**: Continue without sources, use LLM with no context
- **LLM failures**: Use fallback responses from sources or generic messages
- **Database failures**: Continue without history storage

### Error States
- **Query Validation Errors**: Return HTTP 400 immediately
- **Service Unavailable**: Use fallback responses
- **Generation Errors**: Log and return fallback

### Recovery Mechanisms
- Lazy initialization retries for services
- Thread pool isolation prevents cascading failures
- Fallback handlers ensure response delivery

---

## Performance Considerations

### Optimization Strategies
1. **Caching**: Query results and embeddings cached to avoid recomputation
2. **Lazy Loading**: Services initialize on first use, not at startup
3. **Thread Pool Execution**: Non-blocking embedding and LLM generation
4. **Parallel Processing**: Embedding and Qdrant connection can initialize concurrently

### Bottlenecks
1. **LLM Generation**: ~30 seconds for 1536 tokens (CPU), ~5-10 seconds (GPU)
2. **Embedding Generation**: ~100-500ms per query
3. **Vector Search**: ~50-200ms depending on collection size
4. **Database Storage**: ~10-50ms per query history record

### Scalability
- Thread pool allows concurrent query processing
- Caching reduces load on LLM and embedding services
- Lazy loading reduces startup time and memory usage
- Database indexing on query_timestamp for fast history retrieval

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
   - `transformers`
   - `torch`
   - `sqlalchemy`
   - `psycopg2`

### Implementation Steps

1. **Set up Query Endpoint:**
   ```python
   @app.post("/api/v1/queries/ask")
   async def ask_query(
       request: QueryRequest,
       db: Session = Depends(get_db)
   ):
       # Implement Components 1-3
   ```

2. **Implement Query Cache:**
   ```python
   from app.services.cache_service import query_cache
   cache_key = hashlib.md5(json.dumps(cache_data).encode()).hexdigest()
   cached = query_cache.get(cache_key)
   ```

3. **Implement Embedding Generation:**
   ```python
   from sentence_transformers import SentenceTransformer
   embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
   embedding = embedding_model.encode(query).tolist()
   ```

4. **Implement Vector Search:**
   ```python
   from qdrant_client import QdrantClient
   qdrant_client = QdrantClient(url="http://qdrant-07:6333")
   results = qdrant_client.search(
       collection_name="rag",
       query_vector=embedding,
       limit=5,
       score_threshold=0.5
   )
   ```

5. **Implement Context Preparation:**
   ```python
   context_chunks = [source["content"] for source in sources[:8]]
   context = "\n\n".join(context_chunks)
   ```

6. **Implement LLM Generation:**
   ```python
   from app.services.enhanced_llm_service import LLMService
   llm_service = LLMService()
   response = llm_service.generate_response(query=query, context=context)
   ```

7. **Implement Thread Pool Execution:**
   ```python
   from concurrent.futures import ThreadPoolExecutor
   executor = ThreadPoolExecutor(max_workers=8)
   result = await loop.run_in_executor(executor, sync_function, args)
   ```

8. **Store Query History:**
   ```python
   query_record = QueryHistory(
       query_text=query,
       response_text=response,
       processing_time_ms=int(time * 1000),
       ...
   )
   db.add(query_record)
   db.commit()
   ```

---

## Testing Checklist

### Unit Tests
- [ ] Query validation (empty, too short, invalid)
- [ ] Cache key generation (consistency, uniqueness)
- [ ] Embedding generation (dimension, format)
- [ ] Vector search (results, scores, metadata)
- [ ] Context preparation (chunk selection, formatting)
- [ ] Prompt construction (with/without context)
- [ ] Response formatting (dict/string handling)

### Integration Tests
- [ ] End-to-end query → response flow
- [ ] Cache hit/miss scenarios
- [ ] Vector search with various queries
- [ ] LLM generation with context
- [ ] Fallback handling (service failures)
- [ ] Query history storage
- [ ] Concurrent query processing

### Performance Tests
- [ ] Cache hit response time (< 10ms)
- [ ] Embedding generation time (< 500ms)
- [ ] Vector search time (< 200ms)
- [ ] LLM generation time (CPU: ~30s, GPU: ~5-10s)
- [ ] Concurrent query throughput
- [ ] Memory usage under load

---

## Monitoring and Observability

### Key Metrics
- Query processing time (total and per stage)
- Cache hit rate
- Embedding generation time
- Vector search time and result count
- LLM generation time and tokens per second
- Error rates by component
- Service availability

### Logging Points
- Query reception and parameters
- Cache hit/miss events
- Embedding generation completion
- Vector search results count
- Context preparation (chunk count)
- LLM generation start/completion
- Response formatting
- Query history storage
- Fallback usage

### Pipeline Events
- Query Input Processing
- Embedding Generation
- Vector Search
- Document Retrieval
- Context Preparation
- LLM Processing
- Response Formatting
- Query History Storage

---

## Advanced Features

### Department Filtering
- Optional department parameter filters vector search results
- Applied as Qdrant filter condition
- Improves relevance for department-specific queries

### Score Thresholding
- Filters results below similarity threshold
- Prevents low-quality matches from entering context
- Configurable per query or globally

### Context Chunk Selection
- Selects top N chunks by similarity score
- Limits context to prevent token overflow
- Configurable maximum chunk count

### Repetition Prevention
- `repetition_penalty` parameter reduces repetitive text
- Prevents LLM from getting stuck in loops
- Improves response quality

---

## Conclusion

This pipeline provides a robust, scalable solution for processing queries in a RAG system. The architecture supports:

- **Performance**: Caching, lazy loading, and thread pool execution
- **Reliability**: Graceful degradation and fallback handling
- **Scalability**: Concurrent processing and efficient resource usage
- **Observability**: Comprehensive logging and metrics collection
- **Flexibility**: Configurable parameters for different use cases

The modular design allows for easy extension and modification of individual components while maintaining the overall pipeline integrity. The caching strategy significantly improves response times for repeated queries, while the fallback mechanisms ensure system availability even when services are degraded.
