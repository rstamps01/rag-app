# Metrics Dashboard Blocking Issue - Analysis & Solution

## Problem Summary

During document processing operations:
- **CPU Utilization**: 99.3% on single Python process (PID 28)
- **GPU Utilization**: Only 14-22% (underutilized)
- **GPU Memory**: 16.49GB / 32.6GB (50% usage)
- **Issue**: Metrics dashboard stops updating during processing
- **Impact**: Cannot monitor resources during critical operations

---

## Root Cause Analysis

### 1. **CPU-Bound Document Processing Blocks Event Loop**

**Problem**: Document processing is synchronous and CPU-intensive:
- Text extraction (PDF/DOCX parsing)
- Text chunking (string operations)
- Embedding generation (CPU-bound, not GPU-optimized)
- All running in the same event loop

**Evidence**:
```python
# backend/app/api/routes/documents.py
async def process_document_pipeline(...):
    # This calls synchronous processing
    result = process_and_store_document(...)  # BLOCKING
```

**Impact**: Blocks FastAPI event loop, preventing:
- Metrics collection
- WebSocket updates
- Other API requests
- Health checks

---

### 2. **Blocking Metrics Collection**

**Problem**: Metrics collection uses blocking calls:
```python
# backend/app/services/enhanced_metrics_collector.py
cpu_percent = psutil.cpu_percent(interval=1)  # BLOCKS for 1 second
```

**Impact**: 
- Each metrics update blocks for 1+ seconds
- Combined with blocked event loop = no metrics updates

---

### 3. **GPU Underutilization**

**Problem**: 
- GPU utilization only 14-22% during processing
- Embedding generation not batched
- Single-threaded processing

**Evidence from nvidia-smi**:
- GPU Memory: 16.49GB / 32.6GB (50% - models loaded but idle)
- GPU Utilization: 14-22% (should be 80-95% for optimal performance)
- Power: 137-160W / 600W (low power usage = underutilized)

---

### 4. **Background Tasks Run in Same Event Loop**

**Problem**: FastAPI `BackgroundTasks` run in the same event loop:
```python
background_tasks.add_task(process_document_for_vectors, ...)
# This still runs in the main event loop, blocking it
```

**Impact**: Background tasks block the event loop, preventing async operations

---

## Solutions Required

### **Solution 1: Move CPU-Intensive Processing to Thread Pool** ⚠️ **CRITICAL**

**Priority**: Critical  
**Effort**: 2-3 hours

Move document processing to a separate thread pool executor to prevent blocking the event loop.

**Implementation**:
```python
# backend/app/api/routes/documents.py
from concurrent.futures import ThreadPoolExecutor
import asyncio

# Create thread pool for CPU-intensive tasks
thread_pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="doc_processor")

async def process_document_pipeline(doc_id: str, file_path: str, ...):
    """Process document in thread pool to avoid blocking event loop"""
    loop = asyncio.get_event_loop()
    
    # Run CPU-intensive processing in thread pool
    result = await loop.run_in_executor(
        thread_pool,
        process_and_store_document_sync,  # Synchronous function
        file_path,
        filename,
        content_type,
        db
    )
    
    # Update status (async, non-blocking)
    await update_document_status_async(doc_id, result)
```

**Benefits**:
- Event loop remains free for metrics, WebSocket, API requests
- Metrics continue updating during processing
- Better resource utilization

---

### **Solution 2: Non-Blocking Metrics Collection** ⚠️ **CRITICAL**

**Priority**: Critical  
**Effort**: 1-2 hours

Make metrics collection non-blocking by using cached values and async collection.

**Implementation**:
```python
# backend/app/services/enhanced_metrics_collector.py

class EnhancedMetricsCollector:
    def __init__(self):
        # Cache metrics to avoid blocking
        self._cached_cpu = 0.0
        self._cached_memory = {}
        self._last_cpu_update = 0
        self._cpu_update_interval = 0.1  # Update every 100ms
    
    async def _update_system_metrics(self):
        """Non-blocking system metrics update"""
        try:
            # Use non-blocking CPU percent (interval=None)
            loop = asyncio.get_event_loop()
            cpu_percent = await loop.run_in_executor(
                None,  # Default executor
                lambda: psutil.cpu_percent(interval=None)  # Non-blocking
            )
            
            # Get memory (fast, non-blocking)
            memory = psutil.virtual_memory()
            
            # Update cached values
            self._cached_cpu = cpu_percent
            self._cached_memory = {
                'percent': memory.percent,
                'available': memory.available
            }
            
        except Exception as e:
            logger.debug(f"Metrics update error: {e}")
            # Use cached values on error
```

**Alternative: Use psutil with interval=None**:
```python
# First call: psutil.cpu_percent()  # Returns immediately with cached value
# Subsequent calls: psutil.cpu_percent(interval=None)  # Non-blocking
```

**Benefits**:
- Metrics collection never blocks
- Dashboard continues updating during heavy operations
- Real-time monitoring maintained

---

### **Solution 3: Batch Embedding Generation for GPU Optimization** ⚠️ **HIGH PRIORITY**

**Priority**: High  
**Effort**: 2-3 hours

Batch embedding generation to better utilize GPU.

**Current Problem**:
```python
# Single embedding at a time
for chunk in chunks:
    embedding = model.encode([chunk])  # Inefficient
```

**Solution**:
```python
# Batch embeddings
def generate_embeddings_batch(chunks: List[str], batch_size: int = 32):
    """Generate embeddings in batches for GPU efficiency"""
    all_embeddings = []
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        embeddings = model.encode(batch, batch_size=len(batch), show_progress_bar=False)
        all_embeddings.extend(embeddings)
    
    return all_embeddings
```

**Benefits**:
- GPU utilization: 14-22% → 80-95%
- Processing speed: 5-10x faster
- Better resource utilization

---

### **Solution 4: Async Document Processing Pipeline** ⚠️ **MEDIUM PRIORITY**

**Priority**: Medium  
**Effort**: 3-4 hours

Refactor document processing to be fully async.

**Implementation**:
```python
async def process_document_async(
    self,
    file_path: str,
    filename: str,
    content_type: str,
    department: str
) -> Dict[str, Any]:
    """Fully async document processing"""
    
    # 1. Extract text (async I/O)
    text_content = await asyncio.to_thread(
        self.extract_text, file_path, content_type
    )
    
    # 2. Chunk text (CPU-bound, use thread pool)
    chunks = await asyncio.to_thread(
        self.create_chunks, text_content
    )
    
    # 3. Generate embeddings (batch, GPU-optimized)
    embeddings = await asyncio.to_thread(
        self._generate_embeddings_batch, chunks, batch_size=32
    )
    
    # 4. Store in Qdrant (async)
    await self.store_in_qdrant_async(document_id, chunks, embeddings, ...)
    
    return result
```

**Benefits**:
- Non-blocking processing
- Better concurrency
- Metrics continue updating

---

### **Solution 5: Separate Metrics Collection Process** ⚠️ **LOW PRIORITY**

**Priority**: Low  
**Effort**: 4-6 hours

Run metrics collection in a separate process to ensure it never blocks.

**Implementation**:
- Use multiprocessing for metrics collection
- Shared memory for metrics data
- Independent of main event loop

**Benefits**:
- Guaranteed metrics updates
- Complete isolation from processing

---

## Recommended Implementation Order

### **Phase 1: Critical Fixes (Immediate)**
1. ✅ **Non-Blocking Metrics Collection** (1-2 hours)
   - Use `psutil.cpu_percent(interval=None)`
   - Cache metrics values
   - Update in background thread

2. ✅ **Thread Pool for Document Processing** (2-3 hours)
   - Move CPU-intensive processing to thread pool
   - Keep event loop free for metrics/WebSocket

### **Phase 2: Performance Optimization (This Week)**
3. ✅ **Batch Embedding Generation** (2-3 hours)
   - Increase GPU utilization to 80-95%
   - 5-10x faster processing

4. ✅ **Async Document Processing** (3-4 hours)
   - Full async pipeline
   - Better concurrency

---

## Expected Results After Fixes

### **Before**:
- CPU: 99.3% (blocking)
- GPU: 14-22% (underutilized)
- Metrics: Stops updating
- Processing: Blocks event loop

### **After**:
- CPU: 50-70% (distributed, non-blocking)
- GPU: 80-95% (optimized with batching)
- Metrics: Continues updating (real-time)
- Processing: Non-blocking, concurrent

---

## Testing Strategy

### **Test 1: Metrics During Processing**
1. Start document upload
2. Monitor metrics dashboard
3. Verify metrics continue updating
4. Check WebSocket connections remain active

### **Test 2: GPU Utilization**
1. Process large document
2. Monitor `nvidia-smi` output
3. Verify GPU utilization > 80%
4. Check processing speed improvement

### **Test 3: Concurrent Operations**
1. Process document
2. Make API requests simultaneously
3. Verify all operations complete
4. Check no blocking occurs

---

## Files to Modify

1. **`backend/app/services/enhanced_metrics_collector.py`**
   - Make `_update_system_metrics()` non-blocking
   - Use cached values and async collection

2. **`backend/app/api/routes/documents.py`**
   - Add thread pool executor
   - Move processing to thread pool

3. **`backend/app/services/integrated_document_processor.py`**
   - Add batch embedding generation
   - Optimize GPU usage

4. **`backend/app/main.py`**
   - Configure thread pool
   - Ensure proper async handling

---

## Configuration Changes

### **Thread Pool Configuration**
```python
# backend/app/core/config.py
THREAD_POOL_MAX_WORKERS: int = Field(
    default=2,
    description="Maximum workers for CPU-intensive tasks"
)
```

### **Metrics Collection Configuration**
```python
METRICS_UPDATE_INTERVAL: float = Field(
    default=0.1,
    description="Metrics update interval in seconds (non-blocking)"
)
```

---

## Status

**Current**: Metrics stop during processing (blocking issue)  
**Target**: Metrics continue updating during all operations  
**Priority**: Critical - Prevents monitoring during critical operations

---

**Next Steps**: Implement Phase 1 fixes (non-blocking metrics + thread pool)

