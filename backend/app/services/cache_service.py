import time
from functools import lru_cache
import hashlib
import json

class CacheService:
    def __init__(self, max_size=1000, ttl=3600):
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl  # Time to live in seconds
    
    def _get_key(self, *args, **kwargs):
        """Generate a cache key from arguments"""
        key_parts = [str(arg) for arg in args]
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        key_str = ":".join(key_parts)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, *args, **kwargs):
        """Get item from cache"""
        key = self._get_key(*args, **kwargs)
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp <= self.ttl:
                return value
            else:
                # Expired
                del self.cache[key]
        return None
    
    def set(self, value, *args, **kwargs):
        """Set item in cache"""
        key = self._get_key(*args, **kwargs)
        self.cache[key] = (value, time.time())
        
        # Evict oldest items if cache is too large
        if len(self.cache) > self.max_size:
            oldest_key = min(self.cache.items(), key=lambda x: x[1][1])[0]
            del self.cache[oldest_key]
        
        return value

# Create specialized caches
document_cache = CacheService(max_size=100, ttl=3600)
query_cache = CacheService(max_size=500, ttl=1800)
embedding_cache = CacheService(max_size=1000, ttl=7200)

# LRU cache for expensive computations
@lru_cache(maxsize=128)
def cached_embedding_computation(text):
    """Example of using Python's built-in LRU cache"""
    # This would be replaced with actual embedding computation
    return f"embedding_for_{text}"
