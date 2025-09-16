#!/usr/bin/env python3
"""
Script to check Qdrant collection status and upload test documents
"""
import requests
import json
import os

def check_qdrant_status():
    """Check Qdrant collection status"""
    print("🔍 Checking Qdrant collection status...")
    
    try:
        # Check Qdrant health
        qdrant_health = requests.get("http://10.0.0.48:6333/healthz", timeout=5)
        if qdrant_health.status_code == 200:
            print("✅ Qdrant is running")
        else:
            print("❌ Qdrant health check failed")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to Qdrant: {e}")
        return False
    
    try:
        # Check collections
        collections_response = requests.get("http://10.0.0.48:6333/collections", timeout=5)
        if collections_response.status_code == 200:
            collections = collections_response.json()
            print(f"📊 Available collections: {[c['name'] for c in collections['result']['collections']]}")
            
            # Check 'rag' collection specifically
            rag_collection = requests.get("http://10.0.0.48:6333/collections/rag", timeout=5)
            if rag_collection.status_code == 200:
                collection_info = rag_collection.json()
                points_count = collection_info['result']['points_count']
                print(f"📈 RAG collection has {points_count} points")
                
                if points_count == 0:
                    print("⚠️  RAG collection is empty - this explains why vector search returns 0 chunks")
                    return False
                else:
                    print("✅ RAG collection has data")
                    return True
            else:
                print("❌ RAG collection not found")
                return False
        else:
            print("❌ Failed to get collections")
            return False
            
    except Exception as e:
        print(f"❌ Error checking collections: {e}")
        return False

def check_backend_status():
    """Check backend API status"""
    print("\n🔍 Checking backend API status...")
    
    try:
        # Check backend health
        backend_health = requests.get("http://10.0.0.48:8000/health", timeout=5)
        if backend_health.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend health check failed")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False
    
    try:
        # Check document stats
        doc_stats = requests.get("http://10.0.0.48:8000/api/v1/documents/stats/overview", timeout=5)
        if doc_stats.status_code == 200:
            stats = doc_stats.json()
            print(f"📊 Document stats: {json.dumps(stats, indent=2)}")
            return True
        else:
            print("❌ Failed to get document stats")
            return False
    except Exception as e:
        print(f"❌ Error getting document stats: {e}")
        return False

def upload_test_document():
    """Upload a test document to populate the vector database"""
    print("\n📤 Uploading test document...")
    
    # Create a simple test document
    test_content = """
    This is a test document for the RAG application.
    
    The number 42 is significant in literature, particularly in Douglas Adams' "The Hitchhiker's Guide to the Galaxy" series, where it is described as "the answer to the ultimate question of life, the universe, and everything."
    
    In mathematics, 42 is:
    - A composite number
    - The sum of the first 6 even numbers (2+4+6+8+10+12)
    - The answer to the equation x^3 + x^2 + x = 42
    - A pronic number (6 × 7)
    
    In science, 42 appears in various contexts:
    - The atomic number of molybdenum
    - The number of dots on a pair of dice
    - The number of chromosomes in a human cell (23 pairs)
    
    This document contains information about the significance of the number 42 across different domains.
    """
    
    # Create test file
    test_file_path = "/tmp/test_document.txt"
    with open(test_file_path, "w") as f:
        f.write(test_content)
    
    try:
        # Upload document
        with open(test_file_path, "rb") as f:
            files = {"file": ("test_document.txt", f, "text/plain")}
            data = {"department": "General"}
            
            response = requests.post(
                "http://10.0.0.48:8000/api/v1/documents/",
                files=files,
                data=data,
                timeout=30
            )
            
        if response.status_code == 200:
            print("✅ Test document uploaded successfully")
            result = response.json()
            print(f"📄 Document ID: {result.get('document_id', 'Unknown')}")
            return True
        else:
            print(f"❌ Failed to upload test document: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error uploading test document: {e}")
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def main():
    print("🚀 RAG Application Status Check")
    print("=" * 50)
    
    # Check Qdrant status
    qdrant_ok = check_qdrant_status()
    
    # Check backend status
    backend_ok = check_backend_status()
    
    if not qdrant_ok:
        print("\n🔧 Attempting to fix empty Qdrant collection...")
        if backend_ok:
            upload_success = upload_test_document()
            if upload_success:
                print("\n⏳ Waiting for document processing...")
                import time
                time.sleep(10)  # Wait for processing
                
                print("\n🔍 Re-checking Qdrant status...")
                check_qdrant_status()
        else:
            print("❌ Cannot upload test document - backend not available")
    
    print("\n" + "=" * 50)
    print("✅ Status check complete")

if __name__ == "__main__":
    main()
