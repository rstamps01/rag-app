# File: backend/app/scripts/init_qdrant_collection.py
"""
Qdrant collection initialization script for integrated solution
Sets up vector collection with proper configuration
"""

import os
import sys
import logging
import httpx
import asyncio
from pathlib import Path

# Add app directory to Python path
app_dir = Path(__file__ ).parent.parent
sys.path.insert(0, str(app_dir))

from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def init_qdrant_collection():
    """Initialize Qdrant collection with comprehensive error handling"""
    try:
        logger.info("🚀 Starting Qdrant collection initialization...")
        
        # Get configuration
        qdrant_url = getattr(settings, 'QDRANT_URL', 'http://qdrant-07:6333' )
        collection_name = getattr(settings, 'QDRANT_COLLECTION_NAME', 'rag')
        
        async with httpx.AsyncClient(timeout=30.0 ) as client:
            # Test Qdrant connection
            try:
                response = await client.get(f"{qdrant_url}/collections")
                if response.status_code == 200:
                    logger.info(f"✅ Connected to Qdrant at {qdrant_url}")
                else:
                    logger.error(f"❌ Qdrant connection failed: {response.status_code}")
                    return False
            except Exception as e:
                logger.error(f"❌ Failed to connect to Qdrant: {e}")
                return False
            
            # Check if collection exists
            try:
                response = await client.get(f"{qdrant_url}/collections/{collection_name}")
                
                if response.status_code == 200:
                    logger.info(f"✅ Collection '{collection_name}' already exists")
                    
                    # Get collection info
                    collection_info = response.json()
                    points_count = collection_info.get('result', {}).get('points_count', 0)
                    logger.info(f"📊 Collection has {points_count} points")
                    
                elif response.status_code == 404:
                    # Create collection
                    logger.info(f"📋 Creating collection '{collection_name}'...")
                    
                    collection_config = {
                        "vectors": {
                            "size": 384,  # all-MiniLM-L6-v2 embedding size
                            "distance": "Cosine"
                        },
                        "optimizers_config": {
                            "deleted_threshold": 0.2,
                            "vacuum_min_vector_number": 1000,
                            "default_segment_number": 2
                        },
                        "hnsw_config": {
                            "m": 16,
                            "ef_construct": 100,
                            "full_scan_threshold": 10000
                        }
                    }
                    
                    response = await client.put(
                        f"{qdrant_url}/collections/{collection_name}",
                        json=collection_config
                    )
                    
                    if response.status_code == 200:
                        logger.info(f"✅ Collection '{collection_name}' created successfully")
                    else:
                        logger.error(f"❌ Failed to create collection: {response.text}")
                        return False
                        
                else:
                    logger.error(f"❌ Unexpected response checking collection: {response.status_code}")
                    return False
                    
            except Exception as e:
                logger.error(f"❌ Error managing collection: {e}")
                return False
        
        logger.info("🎉 Qdrant collection initialization completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Qdrant initialization failed: {e}")
        return False

def main():
    """Main function to run async initialization"""
    success = asyncio.run(init_qdrant_collection())
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
