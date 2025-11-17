# Query Processing Fix - Missing Thread Pool Functions

## Problem

Queries were not being processed after implementing the thread pool fix. The error was:
```
name '_query_processing_executor' is not defined
```

## Root Cause

The thread pool executor and wrapper functions were being called in the `ask_query` endpoint but were never defined in the code.

## Solution

Added the missing definitions before the `ask_query` endpoint:

### **1. Thread Pool Executor**
```python
_query_processing_executor = ThreadPoolExecutor(
    max_workers=2,
    thread_name_prefix="query_processor"
)
```

### **2. Embedding Generation Wrapper**
```python
def _generate_embedding_sync(query: str):
    """Synchronous embedding generation for thread pool execution"""
    global embedding_model
    if embedding_model is None:
        return None
    try:
        return embedding_model.encode(query).tolist()
    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        return None
```

### **3. LLM Response Generation Wrapper**
```python
def _generate_llm_response_sync(query: str, context: str):
    """Synchronous LLM response generation for thread pool execution"""
    global llm_service
    if llm_service is None:
        return None
    try:
        result = llm_service.generate_response(
            query=query,
            context=context
        )
        return result
    except Exception as e:
        logger.error(f"LLM generation error: {e}")
        return None
```

## Status

✅ **Fixed**
- Thread pool executor defined
- Wrapper functions defined
- Container rebuilt and restarted
- Changes committed and pushed

## Testing

Queries should now process correctly:
1. Embedding generation runs in thread pool (non-blocking)
2. LLM generation runs in thread pool (non-blocking)
3. Metrics continue updating during query processing
4. Event loop remains free

---

**Last Updated**: Fix applied and deployed

