# Pending Database Recommendations - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing all pending Qdrant and PostgreSQL database recommendations. Each recommendation includes implementation steps, code examples, testing procedures, and verification methods.

---

## 🔵 QDRANT PENDING RECOMMENDATIONS

### 1. ⚠️ HNSW Index Tuning (m, ef_construct) - **HIGH PRIORITY**

**Priority**: High  
**Estimated Effort**: 2-4 hours  
**Impact**: Significant performance improvement for vector search

#### Current State
- No explicit HNSW configuration
- Using Qdrant defaults (m=16, ef_construct=200)

#### Implementation Steps

**Step 1: Add HNSW Configuration to Config**

```python
# File: backend/app/core/config.py

class Settings(BaseSettings):
    # ... existing settings ...
    
    # Qdrant HNSW Index Configuration
    QDRANT_HNSW_M: int = Field(
        default=16,
        description="HNSW parameter m: number of bi-directional links (higher = faster search, more memory)"
    )
    QDRANT_HNSW_EF_CONSTRUCT: int = Field(
        default=200,
        description="HNSW parameter ef_construct: size of candidate list during index construction (higher = better quality, slower build)"
    )
    QDRANT_HNSW_EF: int = Field(
        default=128,
        description="HNSW parameter ef: size of candidate list during search (higher = better quality, slower search)"
    )
```

**Step 2: Update Collection Creation Code**

```python
# File: backend/app/services/integrated_vector_db_service.py

from qdrant_client.models import (
    Distance, VectorParams, HnswConfigDiff, OptimizersConfigDiff
)

def create_collection_if_not_exists(self):
    """Create collection with optimized HNSW parameters"""
    try:
        from app.core.config import settings
        
        # Get HNSW parameters from config
        hnsw_m = getattr(settings, 'QDRANT_HNSW_M', 16)
        hnsw_ef_construct = getattr(settings, 'QDRANT_HNSW_EF_CONSTRUCT', 200)
        hnsw_ef = getattr(settings, 'QDRANT_HNSW_EF', 128)
        
        # Configure HNSW
        hnsw_config = HnswConfigDiff(
            m=hnsw_m,
            ef_construct=hnsw_ef_construct,
            full_scan_threshold=10000  # Use HNSW for collections > 10K points
        )
        
        # Create collection with HNSW config
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=384,  # Embedding dimension
                distance=Distance.COSINE
            ),
            hnsw_config=hnsw_config,
            optimizers_config=OptimizersConfigDiff(
                indexing_threshold=20000  # Index after 20K points
            )
        )
        
        logger.info(f"✅ Created collection '{self.collection_name}' with HNSW config: m={hnsw_m}, ef_construct={hnsw_ef_construct}")
        
    except Exception as e:
        if "already exists" in str(e).lower():
            logger.info(f"Collection '{self.collection_name}' already exists")
            # Update existing collection HNSW config if needed
            self._update_hnsw_config()
        else:
            logger.error(f"Failed to create collection: {e}")
            raise

def _update_hnsw_config(self):
    """Update HNSW configuration for existing collection"""
    try:
        from app.core.config import settings
        
        hnsw_m = getattr(settings, 'QDRANT_HNSW_M', 16)
        hnsw_ef_construct = getattr(settings, 'QDRANT_HNSW_EF_CONSTRUCT', 200)
        
        # Update collection configuration
        self.client.update_collection(
            collection_name=self.collection_name,
            hnsw_config=HnswConfigDiff(
                m=hnsw_m,
                ef_construct=hnsw_ef_construct
            )
        )
        
        logger.info(f"✅ Updated HNSW config: m={hnsw_m}, ef_construct={hnsw_ef_construct}")
        
    except Exception as e:
        logger.warning(f"Could not update HNSW config (may require collection recreation): {e}")
```

**Step 3: Update Search to Use ef Parameter**

```python
# File: backend/app/services/integrated_vector_db_service.py

def search_similar_documents(
    self,
    query: str,
    limit: Optional[int] = None,
    score_threshold: Optional[float] = None,
    filter_conditions: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Search with optimized HNSW ef parameter"""
    try:
        from app.core.config import settings
        
        # Get ef parameter from config
        search_ef = getattr(settings, 'QDRANT_HNSW_EF', 128)
        
        # Generate embedding
        embedding = self._generate_embedding(query)
        
        # Perform search with ef parameter
        search_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=embedding,
            limit=limit or getattr(settings, 'VECTOR_SEARCH_LIMIT', 5),
            score_threshold=score_threshold or getattr(settings, 'VECTOR_SEARCH_SCORE_THRESHOLD', 0.5),
            query_filter=filter_conditions,
            search_params=models.SearchParams(
                hnsw_ef=search_ef  # Use configured ef value
            )
        )
        
        # ... rest of search processing ...
```

**Step 4: Add Environment Variables**

```bash
# File: .env

# Qdrant HNSW Index Configuration
QDRANT_HNSW_M=16              # Number of bi-directional links (8-64, default: 16)
QDRANT_HNSW_EF_CONSTRUCT=200  # Index construction quality (100-500, default: 200)
QDRANT_HNSW_EF=128            # Search quality (64-512, default: 128)
```

**Step 5: Testing**

```bash
# Test 1: Verify collection creation with HNSW config
curl -X PUT "http://localhost:6333/collections/test_hnsw" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 384,
      "distance": "Cosine"
    },
    "hnsw_config": {
      "m": 16,
      "ef_construct": 200
    }
  }'

# Test 2: Check collection config
curl "http://localhost:6333/collections/test_hnsw" | jq '.result.config.hnsw_config'

# Test 3: Test search performance
# Compare search latency before/after HNSW tuning
```

**Verification Checklist**
- [ ] Config values added to `config.py`
- [ ] Collection creation uses HNSW config
- [ ] Search uses `ef` parameter
- [ ] Environment variables documented
- [ ] Collection config verified via API
- [ ] Search performance measured and compared

---

### 2. ⚠️ Payload Indexing Configuration - **HIGH PRIORITY**

**Priority**: High  
**Estimated Effort**: 1-2 hours  
**Impact**: Faster filtering by department, filename, file_type

#### Implementation Steps

**Step 1: Add Payload Index Configuration**

```python
# File: backend/app/services/integrated_vector_db_service.py

from qdrant_client.models import PayloadSchemaType

def create_collection_if_not_exists(self):
    """Create collection with payload indexes"""
    try:
        # ... existing collection creation code ...
        
        # Create collection first
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=384,
                distance=Distance.COSINE
            )
        )
        
        # Add payload indexes for frequently filtered fields
        self._create_payload_indexes()
        
    except Exception as e:
        # ... error handling ...

def _create_payload_indexes(self):
    """Create payload indexes for faster filtering"""
    try:
        # Index for department filtering
        self.client.create_payload_index(
            collection_name=self.collection_name,
            field_name="department",
            field_schema=PayloadSchemaType.KEYWORD
        )
        
        # Index for filename filtering
        self.client.create_payload_index(
            collection_name=self.collection_name,
            field_name="filename",
            field_schema=PayloadSchemaType.KEYWORD
        )
        
        # Index for file_type filtering
        self.client.create_payload_index(
            collection_name=self.collection_name,
            field_name="file_type",
            field_schema=PayloadSchemaType.KEYWORD
        )
        
        # Index for processed_at (datetime) for date range queries
        self.client.create_payload_index(
            collection_name=self.collection_name,
            field_name="processed_at",
            field_schema=PayloadSchemaType.FLOAT  # Store as timestamp
        )
        
        logger.info("✅ Created payload indexes for: department, filename, file_type, processed_at")
        
    except Exception as e:
        if "already exists" in str(e).lower():
            logger.info("Payload indexes already exist")
        else:
            logger.warning(f"Could not create payload indexes: {e}")

def ensure_payload_indexes(self):
    """Ensure payload indexes exist (call after collection creation)"""
    try:
        # Get existing indexes
        collection_info = self.client.get_collection(self.collection_name)
        existing_indexes = collection_info.payload_schema or {}
        
        # Create missing indexes
        required_indexes = {
            "department": PayloadSchemaType.KEYWORD,
            "filename": PayloadSchemaType.KEYWORD,
            "file_type": PayloadSchemaType.KEYWORD,
            "processed_at": PayloadSchemaType.FLOAT
        }
        
        for field_name, schema_type in required_indexes.items():
            if field_name not in existing_indexes:
                try:
                    self.client.create_payload_index(
                        collection_name=self.collection_name,
                        field_name=field_name,
                        field_schema=schema_type
                    )
                    logger.info(f"✅ Created payload index for: {field_name}")
                except Exception as e:
                    logger.warning(f"Could not create index for {field_name}: {e}")
                    
    except Exception as e:
        logger.error(f"Error ensuring payload indexes: {e}")
```

**Step 2: Update Collection Initialization**

```python
# File: backend/app/services/integrated_vector_db_service.py

def __init__(self):
    # ... existing initialization ...
    
    # Ensure collection exists with indexes
    if self.is_available():
        self.create_collection_if_not_exists()
        self.ensure_payload_indexes()  # Add this call
```

**Step 3: Testing**

```bash
# Test 1: Create payload index
curl -X PUT "http://localhost:6333/collections/rag/index" \
  -H "Content-Type: application/json" \
  -d '{
    "field_name": "department",
    "field_schema": {
      "type": "keyword"
    }
  }'

# Test 2: Verify indexes exist
curl "http://localhost:6333/collections/rag" | jq '.result.payload_schema'

# Test 3: Test filtered search performance
# Compare search time with/without department filter
```

**Verification Checklist**
- [ ] Payload indexes created for department, filename, file_type, processed_at
- [ ] Indexes verified via Qdrant API
- [ ] Filtered search performance improved
- [ ] No errors in logs during index creation

---

### 3. ⚠️ Quantization Settings - **LOW PRIORITY**

**Priority**: Low  
**Estimated Effort**: 2-3 hours  
**Impact**: 4x-16x memory reduction, faster search

#### Implementation Steps

**Step 1: Add Quantization Config**

```python
# File: backend/app/core/config.py

class Settings(BaseSettings):
    # ... existing settings ...
    
    # Qdrant Quantization Configuration
    QDRANT_USE_QUANTIZATION: bool = Field(
        default=False,
        description="Enable quantization for memory optimization"
    )
    QDRANT_QUANTIZATION_TYPE: str = Field(
        default="scalar",
        description="Quantization type: scalar (int8) or product (x16 compression)"
    )
```

**Step 2: Implement Quantization in Collection Creation**

```python
# File: backend/app/services/integrated_vector_db_service.py

from qdrant_client.models import ScalarQuantization, ProductQuantization, QuantizationConfig

def create_collection_if_not_exists(self):
    """Create collection with optional quantization"""
    try:
        from app.core.config import settings
        
        use_quantization = getattr(settings, 'QDRANT_USE_QUANTIZATION', False)
        quant_type = getattr(settings, 'QDRANT_QUANTIZATION_TYPE', 'scalar')
        
        # Build quantization config if enabled
        quantization_config = None
        if use_quantization:
            if quant_type == "scalar":
                quantization_config = QuantizationConfig(
                    scalar=ScalarQuantization(
                        type="int8",
                        quantile=0.99,
                        always_ram=True  # Keep quantized vectors in RAM
                    )
                )
            elif quant_type == "product":
                quantization_config = QuantizationConfig(
                    product=ProductQuantization(
                        compression="x16",  # 16x compression
                        always_ram=True
                    )
                )
        
        # Create collection
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=384,
                distance=Distance.COSINE
            ),
            quantization_config=quantization_config  # Add quantization
        )
        
        if use_quantization:
            logger.info(f"✅ Created collection with {quant_type} quantization")
        
    except Exception as e:
        # ... error handling ...
```

**Step 3: Add Environment Variables**

```bash
# File: .env

# Qdrant Quantization (optional, for memory optimization)
QDRANT_USE_QUANTIZATION=false        # Enable quantization
QDRANT_QUANTIZATION_TYPE=scalar      # scalar or product
```

**Step 4: Testing**

```bash
# Test 1: Create collection with scalar quantization
curl -X PUT "http://localhost:6333/collections/test_quant" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 384,
      "distance": "Cosine"
    },
    "quantization_config": {
      "scalar": {
        "type": "int8",
        "quantile": 0.99,
        "always_ram": true
      }
    }
  }'

# Test 2: Verify quantization config
curl "http://localhost:6333/collections/test_quant" | jq '.result.config.quantization_config'

# Test 3: Measure memory usage before/after quantization
```

**Verification Checklist**
- [ ] Quantization config added to settings
- [ ] Collection creation supports quantization
- [ ] Memory usage reduced (verify via metrics)
- [ ] Search quality maintained (test accuracy)
- [ ] Performance impact measured

**Note**: Quantization requires recreating the collection. Consider this for new deployments or during maintenance windows.

---

### 4. ⚠️ Batch Size Optimization - **LOW PRIORITY**

**Priority**: Low  
**Estimated Effort**: 1 hour  
**Impact**: Faster bulk operations, better memory utilization

#### Implementation Steps

**Step 1: Add Dynamic Batch Size Logic**

```python
# File: backend/app/services/integrated_vector_db_service.py

def get_optimal_batch_size(self, collection_size: Optional[int] = None) -> int:
    """Get optimal batch size based on collection size"""
    try:
        # Get collection size if not provided
        if collection_size is None:
            collection_info = self.client.get_collection(self.collection_name)
            collection_size = collection_info.points_count
        
        # Dynamic batch size based on collection size
        if collection_size < 1000:
            return 100  # Small collection
        elif collection_size < 10000:
            return 500  # Medium collection
        elif collection_size < 100000:
            return 1000  # Large collection
        else:
            return 2000  # Very large collection
            
    except Exception as e:
        logger.warning(f"Could not determine optimal batch size: {e}")
        return 100  # Default fallback

def store_document_vectors(
    self,
    document_id: str,
    chunks: List[str],
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """Store vectors with optimized batch size"""
    try:
        # Get optimal batch size
        batch_size = self.get_optimal_batch_size()
        
        # Process in optimized batches
        for i in range(0, len(chunks), batch_size):
            batch_chunks = chunks[i:i + batch_size]
            batch_points = []
            
            for j, chunk in enumerate(batch_chunks):
                # ... existing point creation code ...
                batch_points.append(point)
            
            # Upsert batch
            self.client.upsert(
                collection_name=self.collection_name,
                points=batch_points
            )
            
            logger.debug(f"Stored batch {i//batch_size + 1} ({len(batch_points)} points)")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to store vectors: {e}")
        return False
```

**Step 2: Add Config for Max Batch Size**

```python
# File: backend/app/core/config.py

class Settings(BaseSettings):
    # ... existing settings ...
    
    QDRANT_MAX_BATCH_SIZE: int = Field(
        default=1000,
        description="Maximum batch size for vector operations"
    )
```

**Step 3: Testing**

```python
# Test batch size logic
collection_sizes = [500, 5000, 50000, 500000]
for size in collection_sizes:
    batch_size = get_optimal_batch_size(size)
    print(f"Collection size: {size} -> Batch size: {batch_size}")
```

**Verification Checklist**
- [ ] Dynamic batch size logic implemented
- [ ] Batch size scales with collection size
- [ ] Performance improved for large collections
- [ ] Memory usage optimized

---

### 5. ⚠️ Collection Segmentation Optimization - **LOW PRIORITY**

**Priority**: Low  
**Estimated Effort**: 2-3 hours  
**Impact**: Better performance for very large collections (>100K vectors)

#### Implementation Steps

**Step 1: Add Optimizer Configuration**

```python
# File: backend/app/services/integrated_vector_db_service.py

from qdrant_client.models import OptimizersConfigDiff

def create_collection_if_not_exists(self):
    """Create collection with optimized segmentation"""
    try:
        # ... existing code ...
        
        # Optimizer config for large collections
        optimizer_config = OptimizersConfigDiff(
            indexing_threshold=20000,  # Index after 20K vectors
            memmap_threshold=50000,    # Use memory-mapped files after 50K
            vacuum_threshold=0.2,      # Vacuum when 20% deleted
            max_optimization_threads=4  # Parallel optimization
        )
        
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            optimizers_config=optimizer_config
        )
        
    except Exception as e:
        # ... error handling ...
```

**Step 2: Testing**

```bash
# Test optimizer config
curl "http://localhost:6333/collections/rag" | jq '.result.config.optimizer_config'
```

**Verification Checklist**
- [ ] Optimizer config applied
- [ ] Thresholds appropriate for collection size
- [ ] Performance improved for large collections

---

### 6. ❌ Collection Health Monitoring - **NOT STARTED**

**Priority**: Medium  
**Estimated Effort**: 4-6 hours

#### Implementation Steps

**Step 1: Add Health Monitoring Endpoint**

```python
# File: backend/app/api/routes/admin.py or new health.py

@router.get("/qdrant/health")
async def qdrant_health():
    """Comprehensive Qdrant collection health check"""
    try:
        if qdrant_client is None:
            return {"status": "unavailable", "error": "Qdrant client not initialized"}
        
        health_report = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "collections": {}
        }
        
        # Get all collections
        collections = qdrant_client.get_collections().collections
        
        for collection in collections:
            collection_name = collection.name
            info = qdrant_client.get_collection(collection_name)
            
            # Check segment status
            segments_info = qdrant_client.get_collection(collection_name)
            segment_count = len(segments_info.segments) if hasattr(segments_info, 'segments') else 0
            
            # Check index status
            indexed_vectors = info.indexed_vectors_count if hasattr(info, 'indexed_vectors_count') else 0
            total_vectors = info.points_count
            
            # Calculate health metrics
            index_ratio = indexed_vectors / total_vectors if total_vectors > 0 else 0
            health_status = "healthy" if index_ratio > 0.9 else "degraded"
            
            health_report["collections"][collection_name] = {
                "status": health_status,
                "points_count": total_vectors,
                "indexed_vectors": indexed_vectors,
                "index_ratio": round(index_ratio, 2),
                "segments_count": segment_count,
                "config": {
                    "hnsw_m": info.config.hnsw_config.m if hasattr(info.config, 'hnsw_config') else None,
                    "hnsw_ef_construct": info.config.hnsw_config.ef_construct if hasattr(info.config, 'hnsw_config') else None
                }
            }
        
        return health_report
        
    except Exception as e:
        logger.error(f"Error checking Qdrant health: {e}")
        return {"status": "error", "error": str(e)}
```

**Step 2: Add Scheduled Health Checks**

```python
# File: backend/app/services/health_monitor.py (new file)

import asyncio
from datetime import datetime
from app.services.integrated_vector_db_service import integrated_vector_db_service

async def monitor_qdrant_health():
    """Periodic Qdrant health monitoring"""
    while True:
        try:
            # Check health every 5 minutes
            health = await check_qdrant_health()
            
            # Log warnings for degraded collections
            for collection_name, status in health.get("collections", {}).items():
                if status["status"] == "degraded":
                    logger.warning(
                        f"Qdrant collection '{collection_name}' is degraded: "
                        f"index_ratio={status['index_ratio']}"
                    )
            
            await asyncio.sleep(300)  # 5 minutes
            
        except Exception as e:
            logger.error(f"Error in health monitoring: {e}")
            await asyncio.sleep(60)  # Retry in 1 minute
```

**Verification Checklist**
- [ ] Health monitoring endpoint created
- [ ] Segment status checked
- [ ] Index health monitored
- [ ] Alerts for degraded collections
- [ ] Scheduled monitoring implemented

---

## 🟢 POSTGRESQL PENDING RECOMMENDATIONS

### 1. ⚠️ Database Indexes on Frequently Queried Fields - **HIGH PRIORITY**

**Priority**: High  
**Estimated Effort**: 1-2 hours  
**Impact**: Significant query performance improvement

#### Implementation Steps

**Step 1: Create Alembic Migration**

```python
# File: backend/app/alembic/versions/XXXX_add_database_indexes.py

"""Add indexes on frequently queried fields

Revision ID: add_database_indexes
Revises: previous_revision
Create Date: 2025-01-XX
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Indexes for documents table
    op.create_index(
        'idx_documents_status',
        'documents',
        ['status'],
        unique=False
    )
    op.create_index(
        'idx_documents_department',
        'documents',
        ['department'],
        unique=False
    )
    op.create_index(
        'idx_documents_created_at',
        'documents',
        ['created_at'],
        unique=False
    )
    op.create_index(
        'idx_documents_filename',
        'documents',
        ['filename'],
        unique=False
    )
    
    # Indexes for query_history table
    op.create_index(
        'idx_query_history_timestamp',
        'query_history',
        ['query_timestamp'],
        unique=False
    )
    op.create_index(
        'idx_query_history_department',
        'query_history',
        ['department_filter'],
        unique=False
    )
    op.create_index(
        'idx_query_history_user',
        'query_history',
        ['user_id'],
        unique=False
    )
    
    # Composite index for common query pattern
    op.create_index(
        'idx_query_history_timestamp_department',
        'query_history',
        ['query_timestamp', 'department_filter'],
        unique=False
    )

def downgrade():
    # Drop indexes in reverse order
    op.drop_index('idx_query_history_timestamp_department', table_name='query_history')
    op.drop_index('idx_query_history_user', table_name='query_history')
    op.drop_index('idx_query_history_department', table_name='query_history')
    op.drop_index('idx_query_history_timestamp', table_name='query_history')
    op.drop_index('idx_documents_filename', table_name='documents')
    op.drop_index('idx_documents_created_at', table_name='documents')
    op.drop_index('idx_documents_department', table_name='documents')
    op.drop_index('idx_documents_status', table_name='documents')
```

**Step 2: Run Migration**

```bash
# Generate migration
cd /home/vastdata/rag-app-07/backend
alembic revision -m "add_database_indexes"

# Edit the generated file with the code above

# Run migration
alembic upgrade head
```

**Step 3: Verify Indexes**

```sql
-- Connect to PostgreSQL
psql -U postgres -d rag_app

-- Check indexes on documents table
\d documents

-- Check indexes on query_history table
\d query_history

-- Verify index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE tablename IN ('documents', 'query_history')
ORDER BY idx_scan DESC;
```

**Step 4: Testing**

```python
# Test query performance before/after indexes
import time
from app.db.session import get_db

def test_query_performance():
    db = next(get_db())
    
    # Test 1: Filter by status
    start = time.time()
    results = db.query(Document).filter(Document.status == "processed").all()
    duration = time.time() - start
    print(f"Status filter query: {duration:.3f}s, {len(results)} results")
    
    # Test 2: Filter by department
    start = time.time()
    results = db.query(Document).filter(Document.department == "Engineering").all()
    duration = time.time() - start
    print(f"Department filter query: {duration:.3f}s, {len(results)} results")
    
    # Test 3: Date range query
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=7)
    start = time.time()
    results = db.query(QueryHistory).filter(
        QueryHistory.query_timestamp >= cutoff
    ).all()
    duration = time.time() - start
    print(f"Date range query: {duration:.3f}s, {len(results)} results")
```

**Verification Checklist**
- [ ] Migration created and tested
- [ ] Indexes created successfully
- [ ] Query performance improved (measure before/after)
- [ ] Index usage verified via pg_stat_user_indexes
- [ ] No errors in application logs

---

### 2. ⚠️ Query Caching - **MEDIUM PRIORITY**

**Priority**: Medium  
**Estimated Effort**: 3-4 hours  
**Impact**: Reduced database load, faster response times

#### Implementation Steps

**Step 1: Install Caching Library**

```bash
# Add to requirements.txt
redis==5.0.1  # Or use cachetools for in-memory caching
```

**Step 2: Create Cache Service**

```python
# File: backend/app/services/cache_service.py (new file)

import hashlib
import json
from typing import Optional, Any
from functools import wraps
import time

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    from cachetools import TTLCache

class CacheService:
    """Query result caching service"""
    
    def __init__(self):
        self.use_redis = REDIS_AVAILABLE
        if self.use_redis:
            try:
                self.redis_client = redis.Redis(
                    host='redis-07',  # Or localhost
                    port=6379,
                    db=0,
                    decode_responses=True
                )
                self.redis_client.ping()
                logger.info("✅ Redis cache enabled")
            except Exception as e:
                logger.warning(f"Redis not available, using in-memory cache: {e}")
                self.use_redis = False
        
        if not self.use_redis:
            # Fallback to in-memory cache
            self.cache = TTLCache(maxsize=1000, ttl=300)  # 5-minute TTL
            logger.info("✅ In-memory cache enabled")
    
    def get_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = {
            "args": args,
            "kwargs": kwargs
        }
        key_string = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{prefix}:{key_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if self.use_redis:
                value = self.redis_client.get(key)
                return json.loads(value) if value else None
            else:
                return self.cache.get(key)
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL"""
        try:
            if self.use_redis:
                self.redis_client.setex(key, ttl, json.dumps(value))
            else:
                self.cache[key] = value
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
    
    def invalidate(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        try:
            if self.use_redis:
                keys = self.redis_client.keys(f"{pattern}*")
                if keys:
                    self.redis_client.delete(*keys)
            else:
                # For in-memory cache, clear all (simple implementation)
                self.cache.clear()
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")

# Global cache instance
cache_service = CacheService()
```

**Step 3: Add Caching Decorator**

```python
# File: backend/app/services/cache_service.py

def cached_query(ttl: int = 300, prefix: str = "query"):
    """Decorator for caching query results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache_service.get_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {prefix}")
                return cached_result
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            cache_service.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator
```

**Step 4: Apply Caching to Queries**

```python
# File: backend/app/api/routes/documents.py

from app.services.cache_service import cached_query, cache_service

@router.get("/", response_model=List[Document])
@cached_query(ttl=60, prefix="documents_list")  # Cache for 1 minute
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get documents with caching"""
    # ... existing query logic ...
    return documents

# Invalidate cache on document updates
@router.post("/")
async def upload_document(...):
    # ... existing upload logic ...
    
    # Invalidate cache
    cache_service.invalidate("documents_list")
    
    return document
```

**Step 5: Testing**

```python
# Test cache performance
import time

# First call (cache miss)
start = time.time()
result1 = await get_documents(skip=0, limit=100)
duration1 = time.time() - start
print(f"First call (cache miss): {duration1:.3f}s")

# Second call (cache hit)
start = time.time()
result2 = await get_documents(skip=0, limit=100)
duration2 = time.time() - start
print(f"Second call (cache hit): {duration2:.3f}s")
print(f"Speedup: {duration1/duration2:.1f}x")
```

**Verification Checklist**
- [ ] Cache service implemented
- [ ] Caching decorator working
- [ ] Cache hits verified (check logs)
- [ ] Performance improved for cached queries
- [ ] Cache invalidation working on updates

---

### 3. ⚠️ Batch Database Operations - **MEDIUM PRIORITY**

**Priority**: Medium  
**Estimated Effort**: 2-3 hours

#### Implementation Steps

**Step 1: Add Bulk Insert Function**

```python
# File: backend/app/services/database_service.py (new file or add to existing)

from sqlalchemy.orm import Session
from app.models.models import Document, QueryHistory

def bulk_insert_documents(db: Session, documents: List[Dict[str, Any]]):
    """Bulk insert documents"""
    try:
        db.bulk_insert_mappings(Document, documents)
        db.commit()
        logger.info(f"✅ Bulk inserted {len(documents)} documents")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Bulk insert failed: {e}")
        return False

def bulk_update_documents(db: Session, updates: List[Dict[str, Any]]):
    """Bulk update documents"""
    try:
        db.bulk_update_mappings(Document, updates)
        db.commit()
        logger.info(f"✅ Bulk updated {len(updates)} documents")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Bulk update failed: {e}")
        return False
```

**Step 2: Use Bulk Operations**

```python
# File: backend/app/api/routes/documents.py

@router.post("/bulk")
async def bulk_upload_documents(
    files: List[UploadFile],
    department: str = "General",
    db: Session = Depends(get_db)
):
    """Bulk upload documents"""
    documents_to_insert = []
    
    for file in files:
        # Process file...
        documents_to_insert.append({
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "department": department,
            "status": "uploaded",
            # ... other fields ...
        })
    
    # Bulk insert
    from app.services.database_service import bulk_insert_documents
    success = bulk_insert_documents(db, documents_to_insert)
    
    return {"inserted": len(documents_to_insert) if success else 0}
```

**Verification Checklist**
- [ ] Bulk insert function implemented
- [ ] Bulk update function implemented
- [ ] Performance improved vs individual inserts
- [ ] Transaction handling correct

---

### 4. ⚠️ Connection Pool Tuning - **MEDIUM PRIORITY**

**Priority**: Medium  
**Estimated Effort**: 1 hour

#### Implementation Steps

**Step 1: Update Database Connection String**

```python
# File: backend/app/db/session.py

from sqlalchemy import create_engine
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,           # Number of connections to maintain
    max_overflow=10,        # Additional connections allowed
    pool_pre_ping=True,     # Verify connections before use
    pool_recycle=3600,      # Recycle connections after 1 hour
    pool_timeout=30,        # Timeout for getting connection
    echo=False              # Set to True for SQL logging
)
```

**Step 2: Add Config Values**

```python
# File: backend/app/core/config.py

class Settings(BaseSettings):
    # ... existing settings ...
    
    # Database Connection Pool Configuration
    DB_POOL_SIZE: int = Field(default=20, description="Connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=10, description="Maximum overflow connections")
    DB_POOL_RECYCLE: int = Field(default=3600, description="Connection recycle time (seconds)")
    DB_POOL_TIMEOUT: int = Field(default=30, description="Connection timeout (seconds)")
```

**Step 3: Testing**

```python
# Monitor connection pool usage
from sqlalchemy import inspect

def check_pool_status():
    pool = engine.pool
    print(f"Pool size: {pool.size()}")
    print(f"Checked out: {pool.checkedout()}")
    print(f"Overflow: {pool.overflow()}")
    print(f"Invalid: {pool.invalid()}")
```

**Verification Checklist**
- [ ] Pool configuration applied
- [ ] Pool size appropriate for load
- [ ] No connection errors under load
- [ ] Pool status monitored

---

### 5. ⚠️ Cache Hit Ratio Monitoring - **LOW PRIORITY**

**Priority**: Low  
**Estimated Effort**: 1-2 hours

#### Implementation Steps

**Step 1: Add Cache Hit Ratio Collection**

```python
# File: backend/app/services/enhanced_metrics_collector.py

def _collect_postgresql_metrics(self) -> Dict[str, Any]:
    """Collect PostgreSQL metrics including cache hit ratio"""
    try:
        # ... existing metrics collection ...
        
        # Get cache statistics
        cache_query = text("""
            SELECT 
                sum(blks_hit) as cache_hits,
                sum(blks_read) as disk_reads,
                sum(blks_hit) + sum(blks_read) as total_reads
            FROM pg_stat_database
            WHERE datname = current_database()
        """)
        
        result = self.db.execute(cache_query).fetchone()
        
        if result and result.total_reads > 0:
            cache_hit_ratio = (result.cache_hits / result.total_reads) * 100
        else:
            cache_hit_ratio = 0
        
        metrics["cache_hit_ratio"] = round(cache_hit_ratio, 2)
        metrics["cache_hits"] = result.cache_hits if result else 0
        metrics["disk_reads"] = result.disk_reads if result else 0
        
        # Alert if cache hit ratio is low
        if cache_hit_ratio < 90:
            logger.warning(
                f"Low PostgreSQL cache hit ratio: {cache_hit_ratio:.2f}% "
                f"(recommended: >90%)"
            )
        
        return metrics
        
    except Exception as e:
        logger.error(f"Error collecting PostgreSQL cache metrics: {e}")
        return {}
```

**Verification Checklist**
- [ ] Cache hit ratio collected
- [ ] Alerts for low cache hit ratio
- [ ] Metrics displayed in dashboard

---

### 6. ⚠️ Slow Query Logging - **MEDIUM PRIORITY**

**Priority**: Medium  
**Estimated Effort**: 2-3 hours

#### Implementation Steps

**Step 1: Add Query Timing Middleware**

```python
# File: backend/app/middleware/query_timing.py (new file)

import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)
SLOW_QUERY_THRESHOLD = 1.0  # Log queries > 1 second

class QueryTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        if duration > SLOW_QUERY_THRESHOLD:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {duration:.3f}s"
            )
        
        return response
```

**Step 2: Add Database Query Timing**

```python
# File: backend/app/db/session.py

from sqlalchemy import event
import time

@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.time()

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - context._query_start_time
    
    if total > 1.0:  # Log queries > 1 second
        logger.warning(
            f"Slow SQL query ({total:.3f}s): {statement[:200]}"
        )
```

**Step 3: Add to Application**

```python
# File: backend/app/main.py

from app.middleware.query_timing import QueryTimingMiddleware

app.add_middleware(QueryTimingMiddleware)
```

**Verification Checklist**
- [ ] Slow query logging enabled
- [ ] Queries > 1s logged
- [ ] Query patterns identified
- [ ] Performance optimized based on logs

---

### 7. ⚠️ Database Vacuum and Analyze - **LOW PRIORITY**

**Priority**: Low  
**Estimated Effort**: 1-2 hours

#### Implementation Steps

**Step 1: Add Scheduled Maintenance**

```python
# File: backend/app/services/database_maintenance.py (new file)

import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def vacuum_and_analyze_tables():
    """Run VACUUM ANALYZE on tables"""
    db = next(get_db())
    
    try:
        # Vacuum and analyze documents table
        db.execute(text("VACUUM ANALYZE documents;"))
        
        # Vacuum and analyze query_history table
        db.execute(text("VACUUM ANALYZE query_history;"))
        
        db.commit()
        logger.info("✅ Database maintenance completed: VACUUM ANALYZE")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Database maintenance failed: {e}")

# Schedule to run weekly
async def schedule_maintenance():
    while True:
        await asyncio.sleep(7 * 24 * 60 * 60)  # 7 days
        await vacuum_and_analyze_tables()
```

**Step 2: Add Admin Endpoint**

```python
# File: backend/app/api/routes/admin.py

@router.post("/database/maintenance")
async def run_database_maintenance(db: Session = Depends(get_db)):
    """Manually trigger database maintenance"""
    try:
        from app.services.database_maintenance import vacuum_and_analyze_tables
        await vacuum_and_analyze_tables()
        return {"status": "success", "message": "Database maintenance completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Verification Checklist**
- [ ] Maintenance function implemented
- [ ] Scheduled maintenance working
- [ ] Manual trigger endpoint working
- [ ] Table statistics updated

---

## 📋 IMPLEMENTATION PRIORITY ORDER

### Week 1 (High Priority)
1. ✅ Database Indexes (PostgreSQL) - 1-2 hours
2. ✅ HNSW Index Tuning (Qdrant) - 2-4 hours
3. ✅ Payload Indexing (Qdrant) - 1-2 hours

### Week 2 (Medium Priority)
4. ✅ Query Caching (PostgreSQL) - 3-4 hours
5. ✅ Slow Query Logging (PostgreSQL) - 2-3 hours
6. ✅ Batch Database Operations (PostgreSQL) - 2-3 hours
7. ✅ Connection Pool Tuning (PostgreSQL) - 1 hour

### Week 3 (Low Priority)
8. ✅ Collection Health Monitoring (Qdrant) - 4-6 hours
9. ✅ Cache Hit Ratio Monitoring (PostgreSQL) - 1-2 hours
10. ✅ Database Vacuum and Analyze (PostgreSQL) - 1-2 hours
11. ✅ Quantization Settings (Qdrant) - 2-3 hours
12. ✅ Batch Size Optimization (Qdrant) - 1 hour
13. ✅ Collection Segmentation (Qdrant) - 2-3 hours

---

## 🧪 TESTING STRATEGY

### For Each Implementation

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test with actual database/Qdrant
3. **Performance Tests**: Measure before/after improvements
4. **Load Tests**: Verify under production-like load
5. **Monitoring**: Verify metrics collection

### Test Commands

```bash
# Run tests
pytest backend/tests/

# Performance benchmark
python backend/scripts/benchmark_database.py

# Load test
locust -f backend/tests/load_test.py
```

---

## 📝 NOTES

1. **Backup First**: Always backup database/Qdrant before major changes
2. **Test in Dev**: Test all changes in development environment first
3. **Monitor Closely**: Watch metrics after each implementation
4. **Rollback Plan**: Have rollback procedures ready
5. **Documentation**: Update documentation as you implement

---

**Last Updated**: Implementation guide created
**Status**: Ready for implementation

