# File: backend/app/scripts/verify_integration.py
"""
Integration verification script for integrated solution
Verifies that all components are working together correctly
"""

import os
import sys
import logging
import asyncio
from pathlib import Path

# Add app directory to Python path
app_dir = Path(__file__).parent.parent
sys.path.insert(0, str(app_dir))

from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def verify_integration():
    """Verify that all integrated components are working correctly"""
    try:
        logger.info("🔍 Starting integration verification...")
        
        verification_results = {
            "database": False,
            "vector_db": False,
            "embedding_model": False,
            "services": False
        }
        
        # Test database connection
        try:
            from sqlalchemy import create_engine, text
            engine = create_engine(settings.DATABASE_URL)
            
            with engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"))
                table_count = result.fetchone()[0]
                
                if table_count > 0:
                    verification_results["database"] = True
                    logger.info(f"✅ Database verification passed ({table_count} tables)")
                else:
                    logger.error("❌ Database verification failed: no tables found")
                    
        except Exception as e:
            logger.error(f"❌ Database verification failed: {e}")
        
        # Test Qdrant connection
        try:
            import httpx
            qdrant_url = getattr(settings, 'QDRANT_URL', 'http://qdrant-07:6333' )
            collection_name = getattr(settings, 'QDRANT_COLLECTION_NAME', 'rag')
            
            async with httpx.AsyncClient(timeout=10.0 ) as client:
                response = await client.get(f"{qdrant_url}/collections/{collection_name}")
                
                if response.status_code == 200:
                    verification_results["vector_db"] = True
                    logger.info("✅ Vector database verification passed")
                else:
                    logger.error(f"❌ Vector database verification failed: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"❌ Vector database verification failed: {e}")
        
        # Test embedding model loading
        try:
            from sentence_transformers import SentenceTransformer
            model_name = getattr(settings, 'EMBEDDING_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
            
            # Try to load model (this might take time on first run)
            model = SentenceTransformer(model_name)
            
            # Test encoding
            test_embedding = model.encode(["test text"])
            
            if test_embedding is not None and len(test_embedding) > 0:
                verification_results["embedding_model"] = True
                logger.info(f"✅ Embedding model verification passed ({model_name})")
            else:
                logger.error("❌ Embedding model verification failed: no embedding generated")
                
        except Exception as e:
            logger.error(f"❌ Embedding model verification failed: {e}")
        
        # Test integrated services
        try:
            # Import and test integrated services
            from app.services.integrated_database_service import integrated_database_service
            from app.services.integrated_vector_db_service import integrated_vector_db_service
            
            db_available = integrated_database_service.is_available()
            vector_available = integrated_vector_db_service.is_available()
            embedding_ready = integrated_vector_db_service.is_embedding_ready()
            
            if db_available and vector_available and embedding_ready:
                verification_results["services"] = True
                logger.info("✅ Integrated services verification passed")
            else:
                logger.error(f"❌ Integrated services verification failed: DB={db_available}, Vector={vector_available}, Embedding={embedding_ready}")
                
        except Exception as e:
            logger.error(f"❌ Integrated services verification failed: {e}")
        
        # Summary
        passed_tests = sum(verification_results.values())
        total_tests = len(verification_results)
        
        logger.info(f"📊 Verification Summary: {passed_tests}/{total_tests} tests passed")
        
        for component, passed in verification_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            logger.info(f"  {component}: {status}")
        
        if passed_tests == total_tests:
            logger.info("🎉 Integration verification completed successfully - all components working")
            return True
        else:
            logger.error(f"❌ Integration verification failed - {total_tests - passed_tests} components not working")
            return False
            
    except Exception as e:
        logger.error(f"❌ Integration verification failed with exception: {e}")
        return False

def main():
    """Main function to run async verification"""
    success = asyncio.run(verify_integration())
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
    