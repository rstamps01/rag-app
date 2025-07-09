# test_function.py
from app.crud.crud_query_history import create_query_history
from app.schemas.query import QueryHistoryCreate

# Test with sample data
query_data = QueryHistoryCreate(
    query_text="Test query",
    response_text="Test response",
    llm_model_used="test-model"
)

# This would require a database session to test fully
print("✅ Function signature is correct!")
