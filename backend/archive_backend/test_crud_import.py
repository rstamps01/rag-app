# test_crud_import.py
try:
    from app.crud.crud_query_history import create_query_history
    print("✅ create_query_history import successful!")
except ImportError as e:
    print(f"❌ Import error: {e}")
