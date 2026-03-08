# RAG Application — Consolidated Issue Tracker

> **Workflow:** Assess all areas -> Review & organize -> Identify interdependencies -> Remediate systematically
>
> See `.cursor/rules/issue-assessment-workflow.mdc` for the governing process.

## Summary

| ID | Title | Severity | Category | Area | Status |
|----|-------|----------|----------|------|--------|
| ISS-001 | No text normalization before embedding | Critical | Data Pipeline | 1 | Resolved |
| ISS-002 | No document/chunk deduplication | Critical | Data Pipeline | 1 | Resolved |
| ISS-003 | Chunking ignores configured CHUNK_STRATEGY | High | Data Pipeline | 1 | Resolved |
| ISS-004 | Sentence boundary heuristic is fragile | High | Data Pipeline | 1 | Resolved |
| ISS-005 | CRUD create_document drops size and department | High | Storage | 1 | Resolved |
| ISS-006 | Four divergent pipeline implementations | High | Data Pipeline | 1 | Resolved |
| ISS-007 | Hardcoded collection name "rag" in main.py | Medium | Config | 1 | Resolved |
| ISS-008 | query_processor uses undefined config keys | High | Config | 1 | Resolved |
| ISS-009 | Document embeddings run on CPU, one at a time | High | Performance | 1 | Resolved |
| ISS-010 | timestamp vs processed_at field mismatch | Medium | Storage | 1 | Resolved |
| ISS-011 | Two overlapping Pydantic schema sets | Medium | API | 1 | Resolved |
| ISS-012 | No chunk-level metadata (page number, section) | Medium | Data Pipeline | 1 | Resolved |
| ISS-013 | No OCR or table extraction for PDFs | Medium | Data Pipeline | 1 | Resolved |
| ISS-014 | GPU config inconsistency (USE_GPU vs ENABLE_GPU) | Medium | Config | 1 | Resolved |
| ISS-015 | No embedding cache for document chunks | Low | Performance | 1 | Open |
| ISS-016 | Broken import in documents.py (process_and_store_document) | High | API | 1 | Resolved |
| ISS-017 | document_id not returned in all query paths | Medium | API | 1 | Resolved |
| ISS-018 | Six route files unmounted (dead/incomplete code) | High | API | 2 | Resolved |
| ISS-019 | main.py monolithic — 1809 lines, 18 inline endpoints | Medium | API | 2 | Resolved |
| ISS-020 | No centralized exception handler | Medium | API | 2 | Resolved |
| ISS-021 | Inconsistent API versioning (/api/qdrant vs /api/v1/) | Medium | API | 2 | Resolved |
| ISS-022 | File uploads have no size limit | High | API | 2 | Resolved |
| ISS-023 | Most endpoints return raw dicts, not Pydantic models | Low | API | 2 | Resolved |
| ISS-024 | CORS allow_origins=["*"] with allow_credentials=True | High | Security | 2 | Resolved |
| ISS-025 | Bare except in enhanced_documents_api swallows errors | Medium | API | 2 | Resolved |
| ISS-026 | system.py calls undefined supports_pytorch_sdpa() | High | API | 2 | Resolved |
| ISS-027 | enhanced_documents_api calls non-existent methods | High | API | 2 | Resolved |
| ISS-028 | query_wrapper and enhanced_query_wrapper use undefined VectorDBService | Critical | Services | 3 | Resolved |
| ISS-029 | query_processor passes prompt= but LLM expects query= | High | Services | 3 | Resolved |
| ISS-030 | OCR service never wired into active code path | High | Services | 3 | Resolved |
| ISS-031 | model_manager has unresolved git merge conflict | High | Services | 3 | Resolved |
| ISS-032 | GPUAccelerator missing setup_mixed_precision; rag_service crashes | High | Services | 3 | Resolved |
| ISS-033 | rag_service and enhanced_query_processor import non-existent symbols | High | Services | 3 | Resolved |
| ISS-034 | 8 orphaned service files never imported by active code | Medium | Services | 3 | Resolved |
| ISS-035 | Duplicate service pairs with divergent behavior | Medium | Services | 3 | Resolved |
| ISS-036 | vector_db.py has self.collection_name bug in async delete | Medium | Services | 3 | Resolved |
| ISS-037 | integrated_document_processor and integrated_database_service imported but unused in main.py | Low | Services | 3 | Resolved |
| ISS-038 | Five separate SQLAlchemy engines created at runtime | High | Storage | 4 | Resolved |
| ISS-039 | base.py and session.py duplicate engine/SessionLocal/get_db | High | Storage | 4 | Resolved |
| ISS-040 | enhanced_session and integrated_database_service unused get_db | Medium | Storage | 4 | Resolved |
| ISS-041 | integrated_database_service get_db returns None when unavailable | Medium | Storage | 4 | Resolved |
| ISS-042 | No Alembic migration versions exist | Critical | Storage | 4 | Resolved |
| ISS-043 | init_database has no schema migration support | High | Storage | 4 | Resolved |
| ISS-044 | SECRET_KEY, JWT_SECRET, ALGORITHM not defined in Settings | Critical | Config | 4 | Resolved |
| ISS-045 | DATABASE_URL_COMPUTED and SQLALCHEMY_DATABASE_URI never used | Medium | Config | 4 | Resolved |
| ISS-046 | FallbackSettings CORS_ORIGINS_LIST returns single-element list | Low | Config | 4 | Resolved |
| ISS-047 | Production-inappropriate default values in config | Medium | Config | 4 | Resolved |
| ISS-048 | No canonical .env.example template | Medium | Config | 4 | Resolved |
| ISS-049 | enhanced_metrics_collector leaks DB session via next(get_db()) | High | Storage | 4 | Resolved |
| ISS-050 | main.py get_db fallback returns None when DB import fails | Medium | Storage | 4 | Resolved |
| ISS-051 | 30+ files with hardcoded localhost URLs | High | Frontend | 5 | Open |
| ISS-052 | API integration inconsistency — direct fetch bypasses api.js | High | Frontend | 5 | Open |
| ISS-053 | No frontend .env; VITE_API_URL never configured | Medium | Frontend | 5 | Open |
| ISS-054 | Zero test files in frontend | Medium | Frontend | 5 | Open |
| ISS-055 | Duplicate api.js at project root with wrong endpoints | Medium | Frontend | 5 | Open |
| ISS-056 | Dead/backup component files (QdrantGraph_clean, _backup) | Low | Frontend | 5 | Open |
| ISS-057 | No global state management; prop drilling in similarity components | Low | Frontend | 5 | Open |
| ISS-058 | Orphaned enhanced_documents_page and enhanced_queries_page | Low | Frontend | 5 | Open |
| ISS-059 | Backend blocks forever on cache-init; cache-init in profile | Critical | Infrastructure | 6 | Resolved |
| ISS-060 | docker-compose.dev.yml depends on undefined redis-07 | Critical | Infrastructure | 6 | Resolved |
| ISS-061 | docker-compose.dev.yml wrong build context for backend | High | Infrastructure | 6 | Resolved |
| ISS-062 | Dockerfile.optimized requires pre-built base not in compose | High | Infrastructure | 6 | Resolved |
| ISS-063 | Four backend Dockerfiles with divergent deps | High | Infrastructure | 6 | Resolved |
| ISS-064 | Healthcheck mismatch between Dockerfile and compose | Medium | Infrastructure | 6 | Resolved |
| ISS-065 | Frontend nginx volume mount overrides conf.d but not used | Medium | Infrastructure | 6 | Resolved |
| ISS-066 | db-init mounts entire backend over container /app | Medium | Infrastructure | 6 | Resolved |
| ISS-067 | models_cache bind mount — risk of data loss | Medium | Infrastructure | 6 | Resolved |
| ISS-068 | build-backend.sh uses wrong context for Dockerfile.optimized | High | Infrastructure | 6 | Resolved |
| ISS-069 | Auth router not mounted; no endpoints protected | Critical | Security | 7 | Resolved |
| ISS-070 | JWT secret mismatch (SECRET_KEY vs JWT_SECRET) | Critical | Security | 7 | Resolved |
| ISS-071 | Admin endpoints unprotected | Critical | Security | 7 | Resolved |
| ISS-072 | Hardcoded demo password and broken registration | High | Security | 7 | Resolved |
| ISS-073 | File upload path traversal vulnerability | Critical | Security | 7 | Resolved |
| ISS-074 | File type validation by extension only | Medium | Security | 7 | Resolved |
| ISS-075 | No Content-Type verification on upload | Medium | Security | 7 | Resolved |
| ISS-076 | Query input has no length limit | Medium | Security | 7 | Resolved |
| ISS-077 | Delete endpoint does not validate path under upload dir | High | Security | 7 | Resolved |
| ISS-078 | No rate limiting on API endpoints | High | Security | 7 | Resolved |
| ISS-079 | No CI/CD pipeline (GitHub Actions or equivalent) | Critical | CI/CD | 8 | Resolved |
| ISS-080 | No structured backend test suite (pytest layout) | Critical | CI/CD | 8 | Resolved |
| ISS-081 | No frontend test suite (Vitest/Jest) | High | CI/CD | 8 | Resolved |
| ISS-082 | No pre-commit hooks for lint/format/secrets | High | CI/CD | 8 | Resolved |
| ISS-083 | No Makefile or task runner for dev workflow | Medium | CI/CD | 8 | Resolved |
| ISS-084 | No ruff config for Python linting (pyproject.toml) | Medium | CI/CD | 8 | Resolved |
| ISS-085 | No code coverage tooling or thresholds | Medium | CI/CD | 8 | Resolved |
| ISS-086 | No security scanning in pipeline (pip-audit, npm audit) | High | CI/CD | 8 | Resolved |
| ISS-087 | No Cursor rules for code quality, testing, or CI/CD standards | Medium | CI/CD | 8 | Resolved |
| ISS-088 | Ad-hoc test scripts in backend/scripts/ instead of pytest suite | Medium | CI/CD | 8 | Open |

**Totals: 88 issues** — 12 Critical, 35 High, 31 Medium, 10 Low

---

## Severity Breakdown

| Severity | Count | IDs |
|----------|-------|-----|
| Critical | 10 | ISS-001, 002, 028, 042, 044, 059, 060, 069, 070, 073 |
| High | 32 | ISS-003–006, 008–009, 016, 018, 022, 024, 026–027, 029–033, 038–039, 043, 049, 051–052, 061–063, 068, 071–072, 077–078 |
| Medium | 28 | ISS-007, 010–014, 017, 019–021, 025, 034–036, 040–041, 045, 047–048, 050, 053–055, 064–067, 074–076 |
| Low | 8 | ISS-015, 023, 037, 046, 056–058 |

---

## Category Breakdown

| Category | Count | IDs |
|----------|-------|-----|
| Data Pipeline | 9 | ISS-001–004, 006, 012–013, 003, 004 |
| API | 12 | ISS-011, 016–023, 025–027 |
| Services | 10 | ISS-028–037 |
| Storage | 10 | ISS-005, 038–043, 049–050, 010 |
| Config | 8 | ISS-007–008, 014, 044–048 |
| Performance | 3 | ISS-009, 015 |
| Frontend | 8 | ISS-051–058 |
| Infrastructure | 10 | ISS-059–068 |
| Security | 8 | ISS-024, 069–078 |

---

## Remediation Clusters

Issues that should be fixed together because they share code, root cause, or dependencies:

### Cluster A: Pipeline Unification (20 issues)
**Root cause:** Four divergent pipeline implementations; dead code not cleaned up.
- ISS-001, 002, 003, 004, 006, 009, 012, 013 (data pipeline)
- ISS-016, 018, 025, 026, 027 (broken/unmounted API routes)
- ISS-028, 029, 030, 031, 032, 033, 034 (broken/orphaned services)

**Approach:** Consolidate to one pipeline; delete dead code; wire OCR.

### Cluster B: Configuration & Settings (8 issues)
**Root cause:** Settings class incomplete; config keys referenced but undefined.
- ISS-007, 008, 014, 044, 045, 046, 047, 048

**Approach:** Audit all config references; add missing fields with defaults; create .env.example.

### Cluster C: Storage & Database (9 issues)
**Root cause:** Multiple DB session factories; no migrations; session leaks.
- ISS-005, 038, 039, 040, 041, 042, 043, 049, 050

**Approach:** Single engine/session factory; set up Alembic; fix session leak; fix CRUD.

### Cluster D: Security Hardening (12 issues)
**Root cause:** Auth implemented but not wired; no input validation.
- ISS-024, 069, 070, 071, 072, 073, 074, 075, 076, 077, 078, 022

**Approach:** Mount auth; sanitize uploads; add rate limiting; fix CORS.

### Cluster E: Frontend Standardization (8 issues)
**Root cause:** No centralized config; inconsistent API usage.
- ISS-051, 052, 053, 054, 055, 056, 057, 058

**Approach:** Centralize URLs via env; route all API through api.js; delete dead files.

### Cluster F: Infrastructure & Docker (10 issues)
**Root cause:** Multiple Dockerfiles; broken compose overrides.
- ISS-059, 060, 061, 062, 063, 064, 065, 066, 067, 068

**Approach:** Canonical Dockerfile; fix compose files; fix healthchecks.

### Cluster H: CI/CD & Testing (10 issues)
**Root cause:** No automated quality gates or testing infrastructure.
- ISS-079, 080, 081, 082, 083, 084, 085, 086, 087, 088

**Approach:** RESOLVED (9 of 10). Remaining: migrate ad-hoc scripts to pytest (ISS-088).

### Cluster G: API Layer Cleanup (7 issues)
**Root cause:** Monolithic main.py; inconsistent patterns.
- ISS-010, 011, 017, 019, 020, 021, 023

**Approach:** Extract routes from main.py; add exception handler; standardize responses.

---

## Dependency Graph

```
Cluster B (Config)
  └──► Cluster C (Storage) — needs correct DB URLs, settings
  └──► Cluster A (Pipeline) — needs GPU, embedding, Qdrant config
  └──► Cluster D (Security) — needs SECRET_KEY, JWT config

Cluster C (Storage)
  └──► Cluster A (Pipeline) — pipeline stores to Postgres + Qdrant
  └──► Cluster G (API) — routes depend on DB sessions

Cluster A (Pipeline)
  └──► Cluster G (API) — clean API routes for document/query endpoints

Cluster D (Security)
  └──► Cluster G (API) — auth decorators on routes

Cluster E (Frontend)
  └──► Cluster B (Config) — needs env variables from backend config

Cluster F (Infrastructure)
  └──► Cluster B (Config) — Docker env vars must match config
  └──► Cluster C (Storage) — DB init in Docker startup
```

### Recommended Remediation Order

1. **Cluster B** — Config & Settings (foundation for everything)
2. **Cluster C** — Storage & Database (single engine, migrations)
3. **Cluster F** — Infrastructure & Docker (working dev environment)
4. **Cluster A** — Pipeline Unification (core data flow)
5. **Cluster D** — Security Hardening (protect endpoints)
6. **Cluster G** — API Layer Cleanup (clean up main.py)
7. **Cluster E** — Frontend Standardization (env-driven config)

---

## Detail

### ISS-001: No text normalization before embedding
- **Severity**: Critical
- **Category**: Data Pipeline
- **Component(s)**: `backend/app/main.py`, `backend/app/services/integrated_document_processor.py`, `backend/app/services/integrated_vector_db_service.py`
- **Description**: Raw extracted text is passed directly to the embedding model with only `.strip()`. No Unicode normalization (NFC), whitespace collapse, control character removal, or artifact stripping.
- **Impact**: Embedding quality degrades; semantically identical text produces different vectors.
- **Dependencies**: ISS-006
- **Status**: Open
- **Resolution**:

### ISS-002: No document/chunk deduplication
- **Severity**: Critical
- **Category**: Data Pipeline
- **Component(s)**: `backend/app/main.py`, `backend/app/services/integrated_vector_db_service.py`
- **Description**: Re-uploading the same file creates duplicate vectors in Qdrant. `text_hash` (MD5) is stored by one path but never checked before upsert.
- **Impact**: Duplicate chunks pollute search results, waste storage, skew similarity.
- **Dependencies**: ISS-006
- **Status**: Open
- **Resolution**:

### ISS-003: Chunking ignores configured CHUNK_STRATEGY
- **Severity**: High
- **Category**: Data Pipeline
- **Component(s)**: `backend/app/core/config.py`, all pipeline files
- **Description**: Config defines `CHUNK_STRATEGY` with options but no implementation reads or branches on this value.
- **Impact**: Cannot switch chunking strategies via configuration.
- **Dependencies**: ISS-004, ISS-006
- **Status**: Open
- **Resolution**:

### ISS-004: Sentence boundary heuristic is fragile
- **Severity**: High
- **Category**: Data Pipeline
- **Component(s)**: All pipeline files
- **Description**: Sentence detection relies on `. `, `! `, `? ` which fails on abbreviations, URLs, numbered lists, code.
- **Impact**: Chunks split mid-sentence, reducing retrieval accuracy.
- **Dependencies**: ISS-003, ISS-006
- **Status**: Open
- **Resolution**:

### ISS-005: CRUD create_document drops size and department
- **Severity**: High
- **Category**: Storage
- **Component(s)**: `backend/app/crud/crud_document.py`
- **Description**: `create_document()` ignores `size` and `department` from `DocumentCreate`.
- **Impact**: Incomplete metadata in PostgreSQL; department filtering broken at DB level.
- **Dependencies**: ISS-011
- **Status**: Open
- **Resolution**:

### ISS-006: Four divergent pipeline implementations
- **Severity**: High
- **Category**: Data Pipeline
- **Component(s)**: `backend/app/main.py`, `backend/app/services/integrated_document_processor.py`, `backend/app/services/integrated_vector_db_service.py`
- **Description**: Four separate code paths for document->chunk->embed->store with differing behavior.
- **Impact**: Maintenance burden; inconsistent data; fixes don't propagate.
- **Dependencies**: ISS-001, 002, 003, 004, 009
- **Status**: Open
- **Resolution**:

### ISS-007: Hardcoded collection name "rag" in main.py
- **Severity**: Medium
- **Category**: Config
- **Component(s)**: `backend/app/main.py`
- **Description**: Uses hardcoded `"rag"` instead of `settings.QDRANT_COLLECTION_NAME`.
- **Impact**: Config change to collection name is ignored by main.py.
- **Dependencies**: ISS-006
- **Status**: Open
- **Resolution**:

### ISS-008: query_processor uses undefined config keys
- **Severity**: High
- **Category**: Config
- **Component(s)**: `backend/app/services/query_processor.py`, `backend/app/core/config.py`
- **Description**: References `QDRANT_HOST`, `QDRANT_PORT`, `ENABLE_GPU` — none defined in Settings.
- **Impact**: AttributeError at runtime; GPU never used for queries.
- **Dependencies**: ISS-014
- **Status**: Open
- **Resolution**:

### ISS-009: Document embeddings run on CPU, one at a time
- **Severity**: High
- **Category**: Performance
- **Component(s)**: `backend/app/main.py`
- **Description**: Active pipeline calls `encode(chunk)` per chunk on CPU with no batching.
- **Impact**: Ingestion orders of magnitude slower than necessary on RTX 5090.
- **Dependencies**: ISS-006, ISS-014
- **Status**: Open
- **Resolution**:

### ISS-010: timestamp vs processed_at field mismatch
- **Severity**: Medium
- **Category**: Storage
- **Component(s)**: `backend/app/main.py`, `frontend/.../QdrantGraphWorking.jsx`
- **Description**: Backend stores `processed_at`; frontend looks for `timestamp`.
- **Impact**: Temporal similarity always returns 0.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-011: Two overlapping Pydantic schema sets
- **Severity**: Medium
- **Category**: API
- **Component(s)**: `backend/app/schemas/documents.py`, `backend/app/schemas/document.py`
- **Description**: Two schema files define overlapping but different document types.
- **Impact**: Confusion; risk of importing wrong schema.
- **Dependencies**: ISS-005
- **Status**: Open
- **Resolution**:

### ISS-012: No chunk-level metadata (page number, section)
- **Severity**: Medium
- **Category**: Data Pipeline
- **Component(s)**: All pipeline files
- **Description**: Chunks lack source page number, section heading, or character offset.
- **Impact**: Cannot provide precise source attribution in query responses.
- **Dependencies**: ISS-006, ISS-013
- **Status**: Open
- **Resolution**:

### ISS-013: No OCR or table extraction for PDFs
- **Severity**: Medium
- **Category**: Data Pipeline
- **Component(s)**: All pipeline files
- **Description**: PDF extraction uses PyPDF2 only. Scanned PDFs return empty text.
- **Impact**: Scanned documents silently lost; tabular data loses structure.
- **Dependencies**: ISS-006, ISS-030
- **Status**: Open
- **Resolution**:

### ISS-014: GPU config inconsistency (USE_GPU vs ENABLE_GPU)
- **Severity**: Medium
- **Category**: Config
- **Component(s)**: `backend/app/core/config.py`, `backend/app/services/query_processor.py`
- **Description**: Config defines `USE_GPU`; query_processor checks `ENABLE_GPU`.
- **Impact**: GPU never activated for query embedding.
- **Dependencies**: ISS-008
- **Status**: Open
- **Resolution**:

### ISS-015: No embedding cache for document chunks
- **Severity**: Low
- **Category**: Performance
- **Component(s)**: `backend/app/main.py`
- **Description**: Query embeddings cached but document chunk embeddings regenerated every time.
- **Impact**: Wasted compute on re-processing.
- **Dependencies**: ISS-002
- **Status**: Open
- **Resolution**:

### ISS-016: Broken import in documents.py (process_and_store_document)
- **Severity**: High
- **Category**: API
- **Component(s)**: `backend/app/api/routes/documents.py`
- **Description**: Imports `process_and_store_document` which doesn't exist.
- **Impact**: ImportError if router mounted. Masked because not included.
- **Dependencies**: ISS-018
- **Status**: Open
- **Resolution**:

### ISS-017: document_id not returned in all query paths
- **Severity**: Medium
- **Category**: API
- **Component(s)**: `backend/app/services/query_processor.py`, `backend/app/main.py`
- **Description**: Some query paths omit `document_id` from results.
- **Impact**: Frontend cannot link results to source documents.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-018: Six route files unmounted (dead/incomplete code)
- **Severity**: High
- **Category**: API
- **Component(s)**: `backend/app/api/routes/documents.py`, `enhanced_documents_api.py`, `enhanced_queries_api.py`, `queries.py`, `system.py`, `auth.py`
- **Description**: Six route files defined but never included in the app.
- **Impact**: Dead code; duplicate implementations; confusion.
- **Dependencies**: ISS-016, ISS-026, ISS-027
- **Status**: Open
- **Resolution**:

### ISS-019: main.py monolithic — 1809 lines, 18 inline endpoints
- **Severity**: Medium
- **Category**: API
- **Component(s)**: `backend/app/main.py`
- **Description**: 1809 lines with 18 endpoints inline. Duplicate logic with route files.
- **Impact**: Hard to maintain; single-file bottleneck.
- **Dependencies**: ISS-018
- **Status**: Open
- **Resolution**:

### ISS-020: No centralized exception handler
- **Severity**: Medium
- **Category**: API
- **Component(s)**: `backend/app/main.py`
- **Description**: No `app.add_exception_handler()`. Each route handles exceptions locally.
- **Impact**: Inconsistent error responses; no global error logging.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-021: Inconsistent API versioning (/api/qdrant vs /api/v1/)
- **Severity**: Medium
- **Category**: API
- **Component(s)**: `backend/app/api/routes/qdrant_proxy.py`
- **Description**: qdrant_proxy uses `/api/qdrant`; others use `/api/v1/`.
- **Impact**: Inconsistent API surface; version migration harder.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-022: File uploads have no size limit
- **Severity**: High
- **Category**: API
- **Component(s)**: `backend/app/main.py`
- **Description**: No file size validation. "100MB limit removed as requested."
- **Impact**: DoS via large uploads; OOM; disk exhaustion.
- **Dependencies**: ISS-073
- **Status**: Open
- **Resolution**:

### ISS-023: Most endpoints return raw dicts, not Pydantic models
- **Severity**: Low
- **Category**: API
- **Component(s)**: `backend/app/main.py`
- **Description**: Only ask_query uses response_model. Others return raw dicts.
- **Impact**: No response validation; OpenAPI schema incomplete.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-024: CORS allow_origins=["*"] with allow_credentials=True
- **Severity**: High
- **Category**: Security
- **Component(s)**: `backend/app/main.py`
- **Description**: Overly permissive CORS; credentials with wildcard origin.
- **Impact**: Any origin can make credentialed requests.
- **Dependencies**: ISS-069
- **Status**: Open
- **Resolution**:

### ISS-025: Bare except in enhanced_documents_api swallows errors
- **Severity**: Medium
- **Category**: API
- **Component(s)**: `backend/app/api/routes/enhanced_documents_api.py`
- **Description**: `except: pass` catches everything including KeyboardInterrupt.
- **Impact**: Errors hidden; debugging harder.
- **Dependencies**: ISS-018
- **Status**: Open
- **Resolution**:

### ISS-026: system.py calls undefined supports_pytorch_sdpa()
- **Severity**: High
- **Category**: API
- **Component(s)**: `backend/app/api/routes/system.py`
- **Description**: Calls undefined function; would NameError if route hit.
- **Impact**: Masked because router not mounted.
- **Dependencies**: ISS-018
- **Status**: Open
- **Resolution**:

### ISS-027: enhanced_documents_api calls non-existent methods
- **Severity**: High
- **Category**: API
- **Component(s)**: `backend/app/api/routes/enhanced_documents_api.py`
- **Description**: Calls `process_document()` and `delete_document()` which don't exist on the service.
- **Impact**: AttributeError if mounted. Masked.
- **Dependencies**: ISS-018
- **Status**: Open
- **Resolution**:

### ISS-028: query_wrapper and enhanced_query_wrapper use undefined VectorDBService
- **Severity**: Critical
- **Category**: Services
- **Component(s)**: `backend/app/services/query_wrapper.py`, `backend/app/services/enhanced_query_wrapper.py`
- **Description**: Both assign `self.vector_db = VectorDBService()` but VectorDBService is not imported.
- **Impact**: NameError on `initialize()`.
- **Dependencies**: ISS-034
- **Status**: Open
- **Resolution**:

### ISS-029: query_processor passes prompt= but LLM expects query=
- **Severity**: High
- **Category**: Services
- **Component(s)**: `backend/app/services/query_processor.py`, `backend/app/services/enhanced_llm_service.py`
- **Description**: Parameter name mismatch causes TypeError.
- **Impact**: LLM call fails every time query_processor is used.
- **Dependencies**: ISS-034
- **Status**: Open
- **Resolution**:

### ISS-030: OCR service never wired into active code path
- **Severity**: High
- **Category**: Services
- **Component(s)**: `backend/app/services/ocr_service.py`
- **Description**: OCRService exists but is never imported by active code.
- **Impact**: Scanned PDFs silently lost; Tesseract installed but unused.
- **Dependencies**: ISS-013
- **Status**: Open
- **Resolution**:

### ISS-031: model_manager has unresolved git merge conflict
- **Severity**: High
- **Category**: Services
- **Component(s)**: `backend/app/services/model_manager.py`
- **Description**: File contains `<<<<<<< HEAD`, `=======`, `>>>>>>>` markers.
- **Impact**: SyntaxError if imported.
- **Dependencies**: ISS-034
- **Status**: Open
- **Resolution**:

### ISS-032: GPUAccelerator missing setup_mixed_precision; rag_service crashes
- **Severity**: High
- **Category**: Services
- **Component(s)**: `backend/app/services/gpu_accelerator.py`, `backend/app/services/rag_service.py`
- **Description**: `rag_service` calls `gpu_accelerator.setup_mixed_precision()` which doesn't exist.
- **Impact**: AttributeError on rag_service instantiation.
- **Dependencies**: ISS-034
- **Status**: Open
- **Resolution**:

### ISS-033: rag_service and enhanced_query_processor import non-existent symbols
- **Severity**: High
- **Category**: Services
- **Component(s)**: `backend/app/services/rag_service.py`, `backend/app/services/enhanced_query_processor.py`
- **Description**: Import symbols that don't exist in their target modules.
- **Impact**: ImportError if loaded.
- **Dependencies**: ISS-006, ISS-034
- **Status**: Open
- **Resolution**:

### ISS-034: 8 orphaned service files never imported by active code
- **Severity**: Medium
- **Category**: Services
- **Component(s)**: `llm_service.py`, `vector_db.py`, `query_processor.py`, `enhanced_query_processor.py`, `rag_service.py`, `model_manager.py`, `ocr_service.py`, `gpu_accelerator.py`
- **Description**: These services are not imported by any mounted router or main.py.
- **Impact**: Dead code; maintenance burden; confusion.
- **Dependencies**: ISS-018
- **Status**: Open
- **Resolution**:

### ISS-035: Duplicate service pairs with divergent behavior
- **Severity**: Medium
- **Category**: Services
- **Component(s)**: Multiple service pairs
- **Description**: query_processor/enhanced, llm_service/enhanced, vector_db/integrated — same purpose, different implementations.
- **Impact**: Unclear which to use; behavior diverges.
- **Dependencies**: ISS-034
- **Status**: Open
- **Resolution**:

### ISS-036: vector_db.py has self.collection_name bug in async delete
- **Severity**: Medium
- **Category**: Services
- **Component(s)**: `backend/app/services/vector_db.py`
- **Description**: References `self.collection_name` which doesn't exist on the class.
- **Impact**: AttributeError on delete. Masked because service is orphaned.
- **Dependencies**: ISS-034
- **Status**: Open
- **Resolution**:

### ISS-037: integrated_document_processor and integrated_database_service imported but unused
- **Severity**: Low
- **Category**: Services
- **Component(s)**: `backend/app/main.py`
- **Description**: Imported but never called in main.py.
- **Impact**: Unused imports; engines created on import.
- **Dependencies**: ISS-038
- **Status**: Open
- **Resolution**:

### ISS-038: Five separate SQLAlchemy engines created at runtime
- **Severity**: High
- **Category**: Storage
- **Component(s)**: `backend/app/db/session.py`, `base.py`, `enhanced_session.py`, `integrated_database_service.py`, `alembic/enhanced_db_session.py`
- **Description**: Five separate `create_engine()` instances with separate connection pools.
- **Impact**: Connection pool fragmentation; up to 5x connections; pool exhaustion.
- **Dependencies**: ISS-039, ISS-040
- **Status**: Open
- **Resolution**:

### ISS-039: base.py and session.py duplicate engine/SessionLocal/get_db
- **Severity**: High
- **Category**: Storage
- **Component(s)**: `backend/app/db/base.py`, `backend/app/db/session.py`
- **Description**: Both create engine + SessionLocal + get_db with different pool settings.
- **Impact**: Two engines; inconsistent pool behavior.
- **Dependencies**: ISS-038
- **Status**: Open
- **Resolution**:

### ISS-040: enhanced_session and integrated_database_service unused get_db
- **Severity**: Medium
- **Category**: Storage
- **Component(s)**: `backend/app/db/enhanced_session.py`, `backend/app/services/integrated_database_service.py`
- **Description**: Each defines get_db() but routes use session.py's version. Engines still created on import.
- **Impact**: Dead code; extra engines; confusion.
- **Dependencies**: ISS-038
- **Status**: Open
- **Resolution**:

### ISS-041: integrated_database_service get_db returns None when unavailable
- **Severity**: Medium
- **Category**: Storage
- **Component(s)**: `backend/app/services/integrated_database_service.py`
- **Description**: Returns None instead of yielding when DB unavailable. Would break FastAPI Depends.
- **Impact**: AttributeError if used and DB down. Currently masked.
- **Dependencies**: ISS-040
- **Status**: Open
- **Resolution**:

### ISS-042: No Alembic migration versions exist
- **Severity**: Critical
- **Category**: Storage
- **Component(s)**: `backend/app/alembic/`
- **Description**: alembic/versions/ has no migration files. Schema managed via create_all().
- **Impact**: Cannot evolve schema (add/change columns) without manual SQL; no rollback.
- **Dependencies**: ISS-043
- **Status**: Open
- **Resolution**:

### ISS-043: init_database has no schema migration support
- **Severity**: High
- **Category**: Storage
- **Component(s)**: `backend/app/scripts/init_database.py`
- **Description**: Uses create_all() which only creates missing tables; cannot alter existing.
- **Impact**: Model changes require manual intervention.
- **Dependencies**: ISS-042
- **Status**: Open
- **Resolution**:

### ISS-044: SECRET_KEY, JWT_SECRET, ALGORITHM not defined in Settings
- **Severity**: Critical
- **Category**: Config
- **Component(s)**: `backend/app/core/config.py`, `security.py`, `deps.py`
- **Description**: Auth code uses these settings but they're not in the Settings class. Depends on env vars via extra="allow".
- **Impact**: Auth fails with AttributeError if env vars missing; no documented defaults.
- **Dependencies**: ISS-069, ISS-070
- **Status**: Open
- **Resolution**:

### ISS-045: DATABASE_URL_COMPUTED and SQLALCHEMY_DATABASE_URI never used
- **Severity**: Medium
- **Category**: Config
- **Component(s)**: `backend/app/core/config.py`
- **Description**: Defined but all DB code uses `settings.DATABASE_URL` directly.
- **Impact**: SQLALCHEMY_DATABASE_URI setting has no effect; misleading.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-046: FallbackSettings CORS_ORIGINS_LIST returns single-element list
- **Severity**: Low
- **Category**: Config
- **Component(s)**: `backend/app/core/config.py`
- **Description**: Returns `["origin1,origin2"]` instead of `["origin1", "origin2"]`.
- **Impact**: CORS fails when fallback settings used.
- **Dependencies**: ISS-024
- **Status**: Open
- **Resolution**:

### ISS-047: Production-inappropriate default values in config
- **Severity**: Medium
- **Category**: Config
- **Component(s)**: `backend/app/core/config.py`
- **Description**: DATABASE_URL defaults to Docker hostname; REACT_APP_ENVIRONMENT defaults to "production" for dev.
- **Impact**: Local dev fails; misleading environment detection.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-048: No canonical .env.example template
- **Severity**: Medium
- **Category**: Config
- **Component(s)**: Repo root
- **Description**: No .env.example or .env.template for new developers. .env and .env-NEW exist with unclear roles.
- **Impact**: New developers lack setup guidance; inconsistent environments.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-049: enhanced_metrics_collector leaks DB session via next(get_db())
- **Severity**: High
- **Category**: Storage
- **Component(s)**: `backend/app/services/enhanced_metrics_collector.py`
- **Description**: Uses `db = next(get_db())` which never runs the generator's finally block.
- **Impact**: Session leak on each metrics collection; pool exhaustion over time.
- **Dependencies**: ISS-038
- **Status**: Open
- **Resolution**:

### ISS-050: main.py get_db fallback returns None when DB import fails
- **Severity**: Medium
- **Category**: Storage
- **Component(s)**: `backend/app/main.py`
- **Description**: Fallback `get_db()` returns None. Routes using `Depends(get_db)` get None session.
- **Impact**: AttributeError on any DB operation if import failed.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-051: 30+ files with hardcoded localhost URLs
- **Severity**: High
- **Category**: Frontend
- **Component(s)**: 30+ files across `frontend/rag-ui-new/src/`
- **Description**: `localhost:8000`, `localhost:6333`, `ws://localhost:8000` hardcoded instead of using env/config.
- **Impact**: Cannot deploy to non-localhost without modifying source; no env-driven configuration.
- **Dependencies**: ISS-053
- **Status**: Open
- **Resolution**:

### ISS-052: API integration inconsistency — direct fetch bypasses api.js
- **Severity**: High
- **Category**: Frontend
- **Component(s)**: `DocumentsPage.jsx`, `QueriesPage.jsx`, `MetricsDashboardPage.jsx`, `DatabaseDashboard.jsx`, 10+ more
- **Description**: Mix of centralized api.js and direct `fetch()` calls. No consistent error handling or auth headers.
- **Impact**: Can't add auth/headers in one place; inconsistent error handling.
- **Dependencies**: ISS-051
- **Status**: Open
- **Resolution**:

### ISS-053: No frontend .env; VITE_API_URL never configured
- **Severity**: Medium
- **Category**: Frontend
- **Component(s)**: `frontend/rag-ui-new/`
- **Description**: No .env file. `VITE_API_URL` referenced by adminService but never set. api.js uses `import.meta.env.MODE` only.
- **Impact**: API URLs fixed at build time; no per-environment configuration.
- **Dependencies**: ISS-051
- **Status**: Open
- **Resolution**:

### ISS-054: Zero test files in frontend
- **Severity**: Medium
- **Category**: Frontend
- **Component(s)**: `frontend/rag-ui-new/`
- **Description**: No test files, no test runner configured, no testing library installed.
- **Impact**: No automated verification of UI behavior; regressions undetected.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-055: Duplicate api.js at project root with wrong endpoints
- **Severity**: Medium
- **Category**: Frontend
- **Component(s)**: `api.js` (root), `frontend/rag-ui-new/src/lib/api.js`
- **Description**: Root-level api.js duplicates the frontend lib version with different endpoints.
- **Impact**: Confusion; wrong file could be imported.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-056: Dead/backup component files
- **Severity**: Low
- **Category**: Frontend
- **Component(s)**: `QdrantGraph_clean.jsx`, `QdrantGraph_backup.jsx`, `QdrantGraph.jsx.backup`
- **Description**: Backup files left in source tree.
- **Impact**: Clutter; confusion about which is current.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-057: No global state management; prop drilling in similarity components
- **Severity**: Low
- **Category**: Frontend
- **Component(s)**: Similarity component chain
- **Description**: Deep prop drilling through SimilarityTestPage -> SimilarityVisualizationDemo -> EnhancedSimilarityDemo -> graph components.
- **Impact**: Verbose; error-prone when adding new props.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-058: Orphaned enhanced_documents_page and enhanced_queries_page
- **Severity**: Low
- **Category**: Frontend
- **Component(s)**: `enhanced_documents_page.jsx`, `enhanced_queries_page.jsx`
- **Description**: Not imported by any route in App.jsx.
- **Impact**: Dead code.
- **Dependencies**: ISS-056
- **Status**: Open
- **Resolution**:

### ISS-059: Backend blocks forever on cache-init; cache-init in profile
- **Severity**: Critical
- **Category**: Infrastructure
- **Component(s)**: `docker-compose.yml`, `backend/Dockerfile`
- **Description**: Backend waits for `.initialization_complete` file. cache-init service is under `profiles: [cache-init]` so `docker-compose up` doesn't start it.
- **Impact**: Fresh `docker-compose up` hangs indefinitely.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-060: docker-compose.dev.yml depends on undefined redis-07
- **Severity**: Critical
- **Category**: Infrastructure
- **Component(s)**: `docker-compose.dev.yml`
- **Description**: backend-07 `depends_on` includes redis-07 but no redis service is defined.
- **Impact**: Dev compose up fails.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-061: docker-compose.dev.yml wrong build context for backend
- **Severity**: High
- **Category**: Infrastructure
- **Component(s)**: `docker-compose.dev.yml`
- **Description**: Uses `context: .` but Dockerfile.optimized expects backend/ structure.
- **Impact**: Dev compose backend build fails.
- **Dependencies**: ISS-062
- **Status**: Open
- **Resolution**:

### ISS-062: Dockerfile.optimized requires pre-built base not in compose
- **Severity**: High
- **Category**: Infrastructure
- **Component(s)**: `backend/Dockerfile.optimized`, compose files
- **Description**: `FROM rag-app-07-backend-base:latest` must be built separately.
- **Impact**: No single-command dev startup.
- **Dependencies**: ISS-061
- **Status**: Open
- **Resolution**:

### ISS-063: Four backend Dockerfiles with divergent deps
- **Severity**: High
- **Category**: Infrastructure
- **Component(s)**: `backend/Dockerfile`, `Dockerfile.optimized`, `Dockerfile.base`, `Dockerfile.cache-init`
- **Description**: Inconsistent system deps, mixed CUDA comments, different dependency sets.
- **Impact**: Different images behave differently; maintenance burden.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-064: Healthcheck mismatch between Dockerfile and compose
- **Severity**: Medium
- **Category**: Infrastructure
- **Component(s)**: `backend/Dockerfile`, `docker-compose.yml`
- **Description**: Dockerfile checks initialization_status.json; compose checks /health.
- **Impact**: Confusion; inconsistent health detection.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-065: Frontend nginx volume mount overrides conf.d but not used
- **Severity**: Medium
- **Category**: Infrastructure
- **Component(s)**: `frontend/Dockerfile`, `docker-compose.yml`
- **Description**: Dockerfile replaces nginx.conf entirely; compose mounts to conf.d which isn't included.
- **Impact**: Runtime nginx config mount has no effect.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-066: db-init mounts entire backend over container /app
- **Severity**: Medium
- **Category**: Infrastructure
- **Component(s)**: `docker-compose.yml`
- **Description**: `volumes: [./backend:/app]` overwrites container contents.
- **Impact**: Non-reproducible init if host differs from image.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-067: models_cache bind mount — risk of data loss
- **Severity**: Medium
- **Category**: Infrastructure
- **Component(s)**: `docker-compose.yml`
- **Description**: Uses bind mount instead of named volume for model cache.
- **Impact**: Host directory deletion loses model cache; no backup/restore.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-068: build-backend.sh uses wrong context for Dockerfile.optimized
- **Severity**: High
- **Category**: Infrastructure
- **Component(s)**: `scripts/build-backend.sh`
- **Description**: Script uses context `.` but Dockerfile expects backend/ layout.
- **Impact**: Build script fails.
- **Dependencies**: ISS-062
- **Status**: Open
- **Resolution**:

### ISS-069: Auth router not mounted; no endpoints protected
- **Severity**: Critical
- **Category**: Security
- **Component(s)**: `backend/app/main.py`, `backend/app/api/routes/auth.py`
- **Description**: Auth exists but is not wired in. No endpoint uses `Depends(get_current_user)`.
- **Impact**: All endpoints unauthenticated including admin.
- **Dependencies**: ISS-044, ISS-018
- **Status**: Open
- **Resolution**:

### ISS-070: JWT secret mismatch (SECRET_KEY vs JWT_SECRET)
- **Severity**: Critical
- **Category**: Security
- **Component(s)**: `backend/app/core/security.py`, `backend/app/api/deps.py`
- **Description**: Token creation uses `SECRET_KEY`; validation uses `JWT_SECRET`. If different, tokens never validate.
- **Impact**: Auth completely broken when enabled.
- **Dependencies**: ISS-044
- **Status**: Open
- **Resolution**:

### ISS-071: Admin endpoints unprotected
- **Severity**: Critical
- **Category**: Security
- **Component(s)**: `backend/app/api/routes/admin.py`
- **Description**: Admin routes (cleanup, bulk delete, orphan management) have no auth dependency.
- **Impact**: Anyone can delete data and access admin functions.
- **Dependencies**: ISS-069
- **Status**: Open
- **Resolution**:

### ISS-072: Hardcoded demo password and broken registration
- **Severity**: High
- **Category**: Security
- **Component(s)**: `backend/app/api/routes/auth.py`
- **Description**: In-memory user store with hardcoded bcrypt hash; register stores same hash for all users.
- **Impact**: Default credentials; no real user persistence.
- **Dependencies**: ISS-069
- **Status**: Open
- **Resolution**:

### ISS-073: File upload path traversal vulnerability
- **Severity**: Critical
- **Category**: Security
- **Component(s)**: `backend/app/main.py`
- **Description**: `file.filename` used in `os.path.join()` without sanitization. Filenames like `../../etc/passwd` can escape upload dir.
- **Impact**: Arbitrary file write; possible system file overwrite.
- **Dependencies**: ISS-022
- **Status**: Open
- **Resolution**:

### ISS-074: File type validation by extension only
- **Severity**: Medium
- **Category**: Security
- **Component(s)**: `backend/app/main.py`
- **Description**: Only checks file extension, no magic-byte or content-type verification.
- **Impact**: Malicious files with allowed extensions can be uploaded.
- **Dependencies**: ISS-075
- **Status**: Open
- **Resolution**:

### ISS-075: No Content-Type verification on upload
- **Severity**: Medium
- **Category**: Security
- **Component(s)**: `backend/app/main.py`
- **Description**: Content-type stored but not validated against actual file content.
- **Impact**: Content-Type spoofing possible.
- **Dependencies**: ISS-074
- **Status**: Open
- **Resolution**:

### ISS-076: Query input has no length limit
- **Severity**: Medium
- **Category**: Security
- **Component(s)**: `backend/app/main.py`
- **Description**: QueryRequest `query: str` has no max_length constraint.
- **Impact**: DoS via extremely long queries; LLM/embedding abuse.
- **Dependencies**: None
- **Status**: Open
- **Resolution**:

### ISS-077: Delete endpoint does not validate path under upload dir
- **Severity**: High
- **Category**: Security
- **Component(s)**: `backend/app/main.py`
- **Description**: Uses `document.path` from DB to `os.remove()` without checking it's under UPLOAD_DIR.
- **Impact**: Arbitrary file deletion if malicious paths were stored.
- **Dependencies**: ISS-073
- **Status**: Open
- **Resolution**:

### ISS-078: No rate limiting on API endpoints
- **Severity**: High
- **Category**: Security
- **Component(s)**: `backend/app/main.py`
- **Description**: Config defines rate limit settings but no middleware applied.
- **Impact**: Brute force, DoS, and abuse of expensive endpoints.
- **Dependencies**: ISS-069
- **Status**: Open
- **Resolution**:

### ISS-079: No CI/CD pipeline (GitHub Actions or equivalent)
- **Severity**: Critical
- **Category**: CI/CD
- **Component(s)**: `.github/workflows/`
- **Description**: No automated CI/CD pipeline existed. No build/test/deploy automation on push or PR.
- **Impact**: No automated quality gates; regressions undetected; manual testing only.
- **Dependencies**: ISS-080, ISS-081
- **Status**: Resolved
- **Resolution**: Created `.github/workflows/ci.yml` with 8-job pipeline: lint (backend + frontend), security scan, unit/integration/API tests (parallel), frontend tests, Docker build validation, and quality gate summary.

### ISS-080: No structured backend test suite (pytest layout)
- **Severity**: Critical
- **Category**: CI/CD
- **Component(s)**: `backend/tests/`
- **Description**: No pytest test directory, no conftest.py, no fixtures, no structured test suite. Only ad-hoc scripts in backend/scripts/.
- **Impact**: No automated regression testing; no coverage tracking; no CI test stage.
- **Dependencies**: None
- **Status**: Resolved
- **Resolution**: Created `backend/tests/` with conftest.py (fixtures for DB, TestClient, mock services, factories), unit tests (config, text processing, schemas), API tests (health, documents, queries), and integration tests (data consistency). Added `backend/pyproject.toml` with pytest and ruff configuration.

### ISS-081: No frontend test suite (Vitest/Jest)
- **Severity**: High
- **Category**: CI/CD
- **Component(s)**: `frontend/rag-ui-new/`
- **Description**: Zero test files, no test runner, no testing library installed.
- **Impact**: UI regressions undetected; no automated verification.
- **Dependencies**: None
- **Status**: Resolved
- **Resolution**: Installed Vitest + React Testing Library + jsdom + coverage. Created `vitest.config.js`, test setup, smoke tests for App and API client. Added `test`, `test:ci`, `test:watch` scripts to package.json.

### ISS-082: No pre-commit hooks for lint/format/secrets
- **Severity**: High
- **Category**: CI/CD
- **Component(s)**: `.pre-commit-config.yaml`
- **Description**: No pre-commit hooks to catch lint errors, formatting issues, merge conflicts, or secrets before commit.
- **Impact**: Low-quality code reaches CI; secrets could be accidentally committed.
- **Dependencies**: None
- **Status**: Resolved
- **Resolution**: Created `.pre-commit-config.yaml` with ruff (lint + format), pre-commit-hooks (trailing whitespace, YAML/JSON check, merge conflict detection, large file prevention, branch protection), and detect-secrets.

### ISS-083: No Makefile or task runner for dev workflow
- **Severity**: Medium
- **Category**: CI/CD
- **Component(s)**: `Makefile`
- **Description**: No single command to install, lint, test, build, or clean. Developers must remember individual tool commands.
- **Impact**: Onboarding friction; inconsistent dev workflows.
- **Dependencies**: None
- **Status**: Resolved
- **Resolution**: Created `Makefile` with targets: install, lint, lint-backend, lint-frontend, format, test, test-unit, test-api, test-integration, test-frontend, test-all, test-coverage, docker-build, docker-up, docker-down, docker-logs, pre-commit, clean.

### ISS-084: No ruff config for Python linting (pyproject.toml)
- **Severity**: Medium
- **Category**: CI/CD
- **Component(s)**: `backend/pyproject.toml`
- **Description**: Python linting tools (black, isort, flake8) in requirements but no config files.
- **Impact**: No consistent code style enforcement.
- **Dependencies**: None
- **Status**: Resolved
- **Resolution**: Added `[tool.ruff]` and `[tool.ruff.lint]` config in `backend/pyproject.toml` — replaces black + isort + flake8 with ruff.

### ISS-085: No code coverage tooling or thresholds
- **Severity**: Medium
- **Category**: CI/CD
- **Component(s)**: `backend/pyproject.toml`, `frontend/rag-ui-new/vitest.config.js`
- **Description**: No coverage configuration, no thresholds, no coverage reporting.
- **Impact**: Cannot track test coverage; no ratchet to prevent regression.
- **Dependencies**: ISS-080, ISS-081
- **Status**: Resolved
- **Resolution**: Added `[tool.coverage]` in pyproject.toml and coverage config in vitest.config.js. CI pipeline uploads coverage artifacts.

### ISS-086: No security scanning in pipeline (pip-audit, npm audit)
- **Severity**: High
- **Category**: CI/CD
- **Component(s)**: `.github/workflows/ci.yml`
- **Description**: No automated dependency vulnerability scanning.
- **Impact**: Known vulnerabilities in dependencies go undetected.
- **Dependencies**: ISS-079
- **Status**: Resolved
- **Resolution**: Added security scan job in CI with pip-audit for Python and npm audit for Node.js dependencies.

### ISS-087: No Cursor rules for code quality, testing, or CI/CD standards
- **Severity**: Medium
- **Category**: CI/CD
- **Component(s)**: `.cursor/rules/`
- **Description**: Only one rule (issue-assessment-workflow) existed. No rules for code quality, testing patterns, or CI/CD standards.
- **Impact**: AI assistant has no persistent guidance for quality standards.
- **Dependencies**: None
- **Status**: Resolved
- **Resolution**: Created three new rules: `cicd-pipeline-standards.mdc`, `code-quality-standards.mdc`, `testing-standards.mdc`.

### ISS-088: Ad-hoc test scripts in backend/scripts/ instead of pytest suite
- **Severity**: Medium
- **Category**: CI/CD
- **Component(s)**: `backend/scripts/test_*.py`
- **Description**: 12+ test-related scripts in backend/scripts/ that are manual/ad-hoc, not proper pytest tests. They define test_* functions but use standalone execution, not pytest fixtures or markers.
- **Impact**: Cannot run in CI; no coverage; duplicated test logic.
- **Dependencies**: ISS-080
- **Status**: Open
- **Resolution**:
