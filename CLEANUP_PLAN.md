# Service Consolidation Plan

## Overview
This cleanup removes duplicate service files and consolidates functionality to ensure consistent behavior across the RAG application.

## Issues Identified
- Multiple LLM service implementations (llm_service.py vs enhanced_llm_service.py)
- Multiple vector DB service implementations (vector_db.py vs enhanced_vector_db.py vs integrated_vector_db_service.py)
- Multiple query processing implementations (query_wrapper.py vs enhanced_query_wrapper.py)
- Multiple document processing implementations (document_processor.py vs integrated_document_processor.py)
- 27+ backup and version files cluttering the services directory

## Consolidation Strategy

### Services to Keep (Standard Implementation)
- **LLM Service**: `enhanced_llm_service.py` (243 lines, most complete)
- **Vector DB Service**: `integrated_vector_db_service.py` (most integrated)
- **Query Processing**: `enhanced_query_wrapper.py` (most feature-complete)
- **Document Processing**: `integrated_document_processor.py` (most integrated)

### Files to Remove
- All `.backup*` files
- All `.v8*` files  
- All `.copy*` files
- All `.original` files
- Duplicate API route files

### Import Updates Required
- `main.py`: Update LLM and Vector DB service imports
- `enhanced_queries_api.py`: Update service imports
- `queries_enhanced.py`: Update query wrapper import
- `documents.py`: Update document processor import
- `rag_service.py`: Update service imports

## Expected Benefits
- Consistent service behavior across all endpoints
- Reduced memory usage (single service instances)
- Simplified maintenance and debugging
- Cleaner codebase structure
- Eliminated parallel usage conflicts

## Risk Mitigation
- All changes committed incrementally
- Full Git history preserved
- Easy rollback via `git checkout main`
- Branch-based approach allows testing before merge
