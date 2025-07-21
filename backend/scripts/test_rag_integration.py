# test_rag_integration.py
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.append('/app')

from app.services.query_wrapper import process_query

async def test_integration():
    """Test the RAG integration"""
    
    test_queries = [
        "What is machine learning?",
        "Explain artificial intelligence",
        "How does deep learning work?",
        "What are neural networks?"
    ]
    
    print("Testing RAG Integration...")
    print("=" * 50)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\nTest {i}: {query}")
        print("-" * 30)
        
        try:
            # Process query (db parameter can be None for testing)
            result = await process_query(
                db=None,
                query_text=query,
                department="General",
                user_id=None
            )
            
            print(f"✅ Success!")
            print(f"Model: {result.model}")
            print(f"GPU Accelerated: {result.gpu_accelerated}")
            print(f"Processing Time: {result.processing_time}s")
            print(f"Response Length: {len(result.response)} chars")
            print(f"Sources: {len(result.sources)}")
            print(f"Response Preview: {result.response[:100]}...")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_integration())