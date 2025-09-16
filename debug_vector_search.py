#!/usr/bin/env python3
"""
Debug script to test vector search with different parameters
"""
import requests
import json

def test_vector_search(query, score_threshold=None):
    """Test vector search with different score thresholds"""
    print(f"\n🔍 Testing vector search for: '{query}'")
    
    # Test with different score thresholds
    thresholds = [0.0, 0.1, 0.3, 0.5, 0.7, 0.9] if score_threshold is None else [score_threshold]
    
    for threshold in thresholds:
        try:
            # Make request to backend
            response = requests.post(
                "http://10.0.0.48:8000/api/v1/queries/ask",
                json={
                    "query": query,
                    "department": "General",
                    "use_llm": False,  # Disable LLM to focus on vector search
                    "use_vector_search": True
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                sources = result.get("sources", [])
                print(f"  Score threshold {threshold}: {len(sources)} results")
                
                if sources:
                    for i, source in enumerate(sources[:3]):  # Show first 3 results
                        print(f"    {i+1}. Score: {source.get('score', 'N/A'):.3f}")
                        print(f"       Content: {source.get('content', '')[:100]}...")
                        print(f"       Filename: {source.get('filename', 'Unknown')}")
            else:
                print(f"  Score threshold {threshold}: Error {response.status_code}")
                print(f"    Response: {response.text}")
                
        except Exception as e:
            print(f"  Score threshold {threshold}: Exception - {e}")

def test_direct_qdrant_search():
    """Test direct Qdrant search to see raw results"""
    print("\n🔍 Testing direct Qdrant search...")
    
    try:
        # Test a simple search
        search_request = {
            "vector": [0.1] * 384,  # Dummy vector (all-MiniLM-L6-v2 has 384 dimensions)
            "limit": 5,
            "with_payload": True
        }
        
        response = requests.post(
            "http://10.0.0.48:6333/collections/rag/points/search",
            json=search_request,
            timeout=10
        )
        
        if response.status_code == 200:
            results = response.json()
            points = results.get("result", [])
            print(f"  Direct Qdrant search returned {len(points)} points")
            
            if points:
                for i, point in enumerate(points[:3]):
                    print(f"    {i+1}. Score: {point.get('score', 'N/A'):.3f}")
                    print(f"       ID: {point.get('id', 'Unknown')}")
                    payload = point.get('payload', {})
                    print(f"       Content: {payload.get('content', '')[:100]}...")
                    print(f"       Filename: {payload.get('filename', 'Unknown')}")
        else:
            print(f"  Direct Qdrant search failed: {response.status_code}")
            print(f"    Response: {response.text}")
            
    except Exception as e:
        print(f"  Direct Qdrant search exception: {e}")

def main():
    print("🚀 Vector Search Debug Tool")
    print("=" * 50)
    
    # Test with different queries
    test_queries = [
        "Tell me what you know",
        "What topics are you most knowledgeable about?",
        "what is the significance of the number 42?",
        "artificial intelligence",
        "test"
    ]
    
    for query in test_queries:
        test_vector_search(query)
    
    # Test direct Qdrant search
    test_direct_qdrant_search()
    
    print("\n" + "=" * 50)
    print("✅ Debug complete")

if __name__ == "__main__":
    main()
