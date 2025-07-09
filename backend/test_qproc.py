# test_query_processor_integration.py
from app.services.query_processor import QueryProcessor

try:
    query_processor = QueryProcessor()
    print("✅ QueryProcessor initialized successfully")
except AttributeError as e:
    print(f"❌ AttributeError: {e}")
