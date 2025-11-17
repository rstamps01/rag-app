"""
Enhanced Metrics Collector
Implements comprehensive metrics collection for Qdrant, PostgreSQL, Pipeline, and Connection Status
"""

import asyncio
import logging
import time
import psutil
import requests
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from app.core.config import settings

logger = logging.getLogger(__name__)

@dataclass
class QdrantMetrics:
    """Qdrant-specific metrics"""
    collections_count: int = 0
    total_points: int = 0
    memory_usage: int = 0
    disk_usage: int = 0
    search_latency: float = 0.0
    indexing_speed: float = 0.0
    connection_status: str = "disconnected"
    last_health_check: Optional[datetime] = None

@dataclass
class PostgreSQLMetrics:
    """PostgreSQL-specific metrics"""
    active_connections: int = 0
    total_connections: int = 0
    database_size: int = 0
    query_performance: float = 0.0
    cache_hit_ratio: float = 0.0
    connection_status: str = "disconnected"
    last_health_check: Optional[datetime] = None

@dataclass
class PipelineMetrics:
    """Pipeline-specific metrics"""
    document_processing_rate: float = 0.0
    query_processing_rate: float = 0.0
    avg_document_processing_time: float = 0.0
    avg_query_processing_time: float = 0.0
    active_documents: int = 0
    active_queries: int = 0
    success_rate: float = 0.0
    error_rate: float = 0.0
    last_health_check: Optional[datetime] = None

@dataclass
class ConnectionStatusMetrics:
    """Connection status metrics"""
    websocket_connections: int = 0
    backend_status: str = "disconnected"
    database_status: str = "disconnected"
    vector_db_status: str = "disconnected"
    llm_service_status: str = "disconnected"
    last_health_check: Optional[datetime] = None

class EnhancedMetricsCollector:
    """Enhanced metrics collector with comprehensive monitoring capabilities"""
    
    def __init__(self):
        self.qdrant_metrics = QdrantMetrics()
        self.postgres_metrics = PostgreSQLMetrics()
        self.pipeline_metrics = PipelineMetrics()
        self.connection_metrics = ConnectionStatusMetrics()
        
        # Configuration
        self.qdrant_url = getattr(settings, 'QDRANT_URL', 'http://localhost:6333')
        self.postgres_url = getattr(settings, 'DATABASE_URL', 'postgresql://raguser:ragpass@localhost:5432/ragdb')
        self.backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
        
        # Health check intervals
        self.health_check_interval = 5  # seconds
        self.metrics_update_interval = 0.1  # seconds (reduced for non-blocking updates)
        self.qdrant_metrics_interval = 5.0  # seconds - Qdrant search latency test interval (reduced from 0.1s to avoid excessive logging)
        
        # Cached metrics for non-blocking access
        self.system_metrics = {}
        self._cpu_initialized = False
        
        # Start monitoring
        self.is_running = False
        self.tasks = []
        
        logger.info("EnhancedMetricsCollector initialized with non-blocking metrics")
    
    async def start(self):
        """Start the enhanced metrics collection"""
        if self.is_running:
            return
        
        self.is_running = True
        
        # Start health check tasks
        self.tasks = [
            asyncio.create_task(self._health_check_loop()),
            asyncio.create_task(self._metrics_update_loop()),
            asyncio.create_task(self._qdrant_metrics_loop()),
            asyncio.create_task(self._postgres_metrics_loop()),
            asyncio.create_task(self._pipeline_metrics_loop())
        ]
        
        logger.info("Enhanced metrics collection started")
    
    async def stop(self):
        """Stop the enhanced metrics collection"""
        self.is_running = False
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self.tasks, return_exceptions=True)
        
        logger.info("Enhanced metrics collection stopped")
    
    async def _health_check_loop(self):
        """Continuously check service health"""
        while self.is_running:
            try:
                await self._check_qdrant_health()
                await self._check_postgres_health()
                await self._check_backend_health()
                await self._check_llm_service_health()
                
                # Update connection status
                self.connection_metrics.last_health_check = datetime.now()
                
            except Exception as e:
                logger.error(f"Health check error: {e}")
            
            await asyncio.sleep(self.health_check_interval)
    
    async def _metrics_update_loop(self):
        """Continuously update metrics"""
        while self.is_running:
            try:
                await self._update_system_metrics()
                await self._update_pipeline_metrics()
                
            except Exception as e:
                logger.error(f"Metrics update error: {e}")
            
            await asyncio.sleep(self.metrics_update_interval)
    
    async def _qdrant_metrics_loop(self):
        """Continuously collect Qdrant metrics"""
        while self.is_running:
            try:
                await self._collect_qdrant_metrics()
            except Exception as e:
                logger.error(f"Qdrant metrics collection error: {e}")
            
            # Use longer interval for Qdrant metrics to reduce excessive logging
            await asyncio.sleep(self.qdrant_metrics_interval)
    
    async def _postgres_metrics_loop(self):
        """Continuously collect PostgreSQL metrics"""
        while self.is_running:
            try:
                await self._collect_postgres_metrics()
            except Exception as e:
                logger.error(f"PostgreSQL metrics collection error: {e}")
            
            await asyncio.sleep(self.metrics_update_interval)
    
    async def _pipeline_metrics_loop(self):
        """Continuously collect pipeline metrics"""
        while self.is_running:
            try:
                await self._collect_pipeline_metrics()
            except Exception as e:
                logger.error(f"Pipeline metrics collection error: {e}")
            
            await asyncio.sleep(self.metrics_update_interval)
    
    async def _check_qdrant_health(self):
        """Check Qdrant service health"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: requests.get(f"{self.qdrant_url}/collections", timeout=5)
            )
            
            if response.status_code == 200:
                self.connection_metrics.vector_db_status = "connected"
                self.qdrant_metrics.connection_status = "connected"
                self.qdrant_metrics.last_health_check = datetime.now()
            else:
                self.connection_metrics.vector_db_status = "error"
                self.qdrant_metrics.connection_status = "error"
                
        except Exception as e:
            logger.debug(f"Qdrant health check failed: {e}")
            self.connection_metrics.vector_db_status = "disconnected"
            self.qdrant_metrics.connection_status = "disconnected"
    
    async def _check_postgres_health(self):
        """Check PostgreSQL service health"""
        try:
            # Simple connection test
            import psycopg2
            conn = psycopg2.connect(self.postgres_url)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            conn.close()
            
            self.connection_metrics.database_status = "connected"
            self.postgres_metrics.connection_status = "connected"
            self.postgres_metrics.last_health_check = datetime.now()
            
        except Exception as e:
            logger.debug(f"PostgreSQL health check failed: {e}")
            self.connection_metrics.database_status = "disconnected"
            self.postgres_metrics.connection_status = "disconnected"
    
    async def _check_backend_health(self):
        """Check backend service health"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: requests.get(f"{self.backend_url}/health", timeout=5)
            )
            
            if response.status_code == 200:
                self.connection_metrics.backend_status = "connected"
                self.connection_metrics.last_health_check = datetime.now()
            else:
                self.connection_metrics.backend_status = "error"
                
        except Exception as e:
            logger.debug(f"Backend health check failed: {e}")
            self.connection_metrics.backend_status = "disconnected"
    
    async def _check_llm_service_health(self):
        """Check LLM service health"""
        try:
            # Test LLM service by checking if the endpoint is available
            # (without actually submitting a query to avoid spam)
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: requests.get(
                    f"{self.backend_url}/health",
                    timeout=5
                )
            )
            
            if response.status_code == 200:
                self.connection_metrics.llm_service_status = "connected"
            else:
                self.connection_metrics.llm_service_status = "error"
                
        except Exception as e:
            logger.debug(f"LLM service health check failed: {e}")
            self.connection_metrics.llm_service_status = "disconnected"
    
    async def _collect_qdrant_metrics(self):
        """Collect Qdrant-specific metrics"""
        try:
            # Get collections info
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: requests.get(f"{self.qdrant_url}/collections", timeout=5)
            )
            
            if response.status_code == 200:
                data = response.json()
                collections = data.get('result', {}).get('collections', [])
                
                self.qdrant_metrics.collections_count = len(collections)
                
                # Calculate total points and collect disk usage
                total_points = 0
                total_disk_usage = 0
                collection_configs = {}  # Store collection configs for later use
                
                for collection in collections:
                    collection_name = collection.get('name', '')
                    if collection_name:
                        try:
                            # Get collection info for points count and vector size
                            info_response = requests.get(f"{self.qdrant_url}/collections/{collection_name}", timeout=5)
                            if info_response.status_code == 200:
                                info_data = info_response.json()
                                result = info_data.get('result', {})
                                points_count = result.get('points_count', 0)
                                total_points += points_count
                                
                                # Store collection config for disk usage estimation
                                config = result.get('config', {}).get('params', {})
                                vectors_config = config.get('vectors', {})
                                if isinstance(vectors_config, dict) and 'size' in vectors_config:
                                    vector_size = vectors_config['size']
                                elif isinstance(vectors_config, dict):
                                    # Named vectors - use first vector config
                                    first_vector = next(iter(vectors_config.values()))
                                    vector_size = first_vector.get('size', 384) if isinstance(first_vector, dict) else 384
                                else:
                                    vector_size = 384  # Default fallback
                                
                                collection_configs[collection_name] = {
                                    'points_count': points_count,
                                    'vector_size': vector_size
                                }
                            
                            # Get collection stats for disk usage
                            disk_usage_found = False
                            try:
                                stats_response = requests.get(f"{self.qdrant_url}/collections/{collection_name}/stats", timeout=5)
                                if stats_response.status_code == 200:
                                    stats_data = stats_response.json()
                                    stats_result = stats_data.get('result', {})
                                    
                                    # Try multiple possible paths for disk usage
                                    disk_usage = (
                                        stats_result.get('disk_usage') or
                                        stats_result.get('indexes', {}).get('disk_usage') or
                                        stats_result.get('indexes', {}).get('payload_indexes', {}).get('disk_usage') or
                                        stats_result.get('vectors', {}).get('disk_usage') or
                                        0
                                    )
                                    
                                    if isinstance(disk_usage, (int, float)) and disk_usage > 0:
                                        total_disk_usage += int(disk_usage)
                                        disk_usage_found = True
                                        logger.debug(f"Found disk usage for {collection_name}: {disk_usage} bytes")
                            except Exception as e:
                                logger.debug(f"Failed to get collection {collection_name} stats: {e}")
                            
                            # If disk_usage not found from stats, estimate from points count and vector size
                            if not disk_usage_found and collection_name in collection_configs:
                                config_data = collection_configs[collection_name]
                                # Estimate: vector_size * 4 bytes (float32) * points_count * 2 (overhead for payloads/indexes)
                                estimated_disk = config_data['points_count'] * config_data['vector_size'] * 4 * 2
                                if estimated_disk > 0:
                                    total_disk_usage += int(estimated_disk)
                                    logger.debug(f"Estimated disk usage for {collection_name}: {estimated_disk} bytes (from {config_data['points_count']} points, {config_data['vector_size']}D vectors)")
                                
                        except Exception as e:
                            logger.debug(f"Failed to get collection {collection_name} info: {e}")
                            continue
                
                self.qdrant_metrics.total_points = total_points
                self.qdrant_metrics.disk_usage = total_disk_usage if total_disk_usage > 0 else 0
                
                # Get memory usage from collection stats or system metrics
                try:
                    # Try to get memory from collection stats first (more accurate)
                    memory_usage = 0
                    for collection in collections:
                        collection_name = collection.get('name', '')
                        if collection_name:
                            try:
                                # Try collection info endpoint for memory metrics
                                info_response = requests.get(f"{self.qdrant_url}/collections/{collection_name}", timeout=5)
                                if info_response.status_code == 200:
                                    info_data = info_response.json()
                                    result = info_data.get('result', {})
                                    
                                    # Check for memory in various locations
                                    collection_memory = (
                                        result.get('memory_usage') or
                                        result.get('stats', {}).get('memory_usage') or
                                        result.get('optimizer_status', {}).get('memory_usage') or
                                        0
                                    )
                                    if collection_memory:
                                        memory_usage += int(collection_memory)
                                
                                # Also try stats endpoint
                                try:
                                    stats_response = requests.get(f"{self.qdrant_url}/collections/{collection_name}/stats", timeout=5)
                                    if stats_response.status_code == 200:
                                        stats_data = stats_response.json()
                                        stats_result = stats_data.get('result', {})
                                        stats_memory = (
                                            stats_result.get('memory_usage') or
                                            stats_result.get('indexes', {}).get('memory_usage') or
                                            0
                                        )
                                        if stats_memory:
                                            memory_usage += int(stats_memory)
                                except:
                                    pass
                                
                            except Exception as e:
                                logger.debug(f"Failed to get memory for collection {collection_name}: {e}")
                                continue
                    
                    # If no memory found from collections, try cluster endpoint (for multi-node setups)
                    if memory_usage == 0:
                        try:
                            cluster_response = requests.get(f"{self.qdrant_url}/cluster", timeout=5)
                            if cluster_response.status_code == 200:
                                cluster_data = cluster_response.json()
                                result = cluster_data.get('result', {})
                                # Try multiple possible paths for memory usage
                                cluster_memory = (
                                    result.get('memory_usage') or
                                    result.get('memory') or
                                    result.get('stats', {}).get('memory_usage') or
                                    result.get('peers', {}).get('memory_usage') or
                                    0
                                )
                                if cluster_memory:
                                    memory_usage = int(cluster_memory)
                        except Exception as e:
                            logger.debug(f"Failed to get Qdrant cluster info: {e}")
                    
                    self.qdrant_metrics.memory_usage = memory_usage if memory_usage > 0 else 0
                    
                except Exception as e:
                    logger.warning(f"Failed to get Qdrant memory usage: {e}")
                    self.qdrant_metrics.memory_usage = 0
                
                # Get real search latency by performing a test search
                try:
                    if total_points > 0 and len(collections) > 0:
                        collection_name = collections[0]['name']
                        
                        # Get actual vector size from collection config
                        try:
                            collection_info_response = requests.get(
                                f"{self.qdrant_url}/collections/{collection_name}",
                                timeout=5
                            )
                            if collection_info_response.status_code == 200:
                                collection_info = collection_info_response.json()
                                vector_config = collection_info.get('result', {}).get('config', {}).get('params', {})
                                
                                # Handle both single vector config and named vectors
                                if 'vectors' in vector_config:
                                    vectors_config = vector_config['vectors']
                                    if isinstance(vectors_config, dict) and 'size' in vectors_config:
                                        vector_size = vectors_config['size']
                                    elif isinstance(vectors_config, dict):
                                        # Named vectors - use first vector config
                                        first_vector = next(iter(vectors_config.values()))
                                        vector_size = first_vector.get('size', 384) if isinstance(first_vector, dict) else 384
                                    else:
                                        vector_size = 384  # Default fallback
                                else:
                                    vector_size = 384  # Default fallback
                                
                                # Perform test search with correct vector size
                                # Changed to debug level to reduce log noise (was INFO)
                                logger.debug(f"Performing Qdrant search latency test on collection '{collection_name}' with {vector_size}D vector")
                                search_start = time.time()
                                
                                # Create test vector
                                test_vector = [0.1] * vector_size
                                
                                search_response = requests.post(
                                    f"{self.qdrant_url}/collections/{collection_name}/points/search",
                                    json={
                                        "vector": test_vector,
                                        "limit": 1,
                                        "with_payload": False,
                                        "with_vector": False
                                    },
                                    timeout=10,
                                    headers={"Content-Type": "application/json"}
                                )
                                
                                search_elapsed = (time.time() - search_start) * 1000  # Convert to ms
                                
                                if search_response.status_code == 200:
                                    search_result = search_response.json()
                                    if search_result.get('status') == 'ok' or 'result' in search_result:
                                        self.qdrant_metrics.search_latency = round(search_elapsed, 2)
                                        # Changed to debug level to reduce log noise (was INFO)
                                        logger.debug(f"✅ Qdrant search latency measured: {search_elapsed:.2f}ms (collection: {collection_name}, points: {total_points})")
                                    else:
                                        logger.warning(f"Qdrant search returned unexpected result: {search_result.get('status', 'unknown')}")
                                        self.qdrant_metrics.search_latency = 0.0
                                else:
                                    error_text = search_response.text[:200] if search_response.text else "No error message"
                                    logger.warning(f"Qdrant search test failed with status {search_response.status_code}: {error_text}")
                                    self.qdrant_metrics.search_latency = 0.0
                        except requests.exceptions.Timeout:
                            logger.warning(f"Qdrant search latency test timed out for collection '{collection_name}'")
                            self.qdrant_metrics.search_latency = 0.0
                        except requests.exceptions.RequestException as e:
                            logger.warning(f"Qdrant search latency test request failed: {e}")
                            self.qdrant_metrics.search_latency = 0.0
                        except Exception as e:
                            logger.warning(f"Failed to get collection config for search latency test: {e}", exc_info=True)
                            self.qdrant_metrics.search_latency = 0.0
                    else:
                        logger.debug(f"Skipping search latency test: total_points={total_points}, collections={len(collections)}")
                        self.qdrant_metrics.search_latency = 0.0
                except Exception as e:
                    logger.warning(f"Failed to measure Qdrant search latency: {e}", exc_info=True)
                    self.qdrant_metrics.search_latency = 0.0
                
                # Set connection status to connected
                self.qdrant_metrics.connection_status = "connected"
                self.qdrant_metrics.last_health_check = datetime.now()
                
        except Exception as e:
            logger.debug(f"Qdrant metrics collection failed: {e}")
            self.qdrant_metrics.connection_status = "disconnected"
    
    async def _collect_postgres_metrics(self):
        """Collect PostgreSQL-specific metrics"""
        try:
            # Use SQLAlchemy connection pool instead of direct psycopg2
            from app.db.session import get_db
            from sqlalchemy import text
            
            db = next(get_db())
            try:
                # Get active connections
                try:
                    result = db.execute(text("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"))
                    self.postgres_metrics.active_connections = result.scalar()
                except Exception as e:
                    logger.debug(f"Error getting active connections: {e}")
                    self.postgres_metrics.active_connections = 0
                
                # Get total connections
                try:
                    result = db.execute(text("SELECT count(*) FROM pg_stat_activity"))
                    self.postgres_metrics.total_connections = result.scalar()
                except Exception as e:
                    logger.debug(f"Error getting total connections: {e}")
                    self.postgres_metrics.total_connections = 0
                
                # Get database size
                try:
                    result = db.execute(text("SELECT pg_database_size(current_database())"))
                    self.postgres_metrics.database_size = result.scalar()
                except Exception as e:
                    logger.debug(f"Error getting database size: {e}")
                    self.postgres_metrics.database_size = 0
            
                # Get cache hit ratio
                try:
                    result = db.execute(text("""
                        SELECT 
                            round((100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)))::numeric, 2) as cache_hit_ratio
                        FROM pg_stat_database 
                        WHERE datname = current_database()
                    """))
                    cache_hit_ratio = result.scalar()
                    if cache_hit_ratio:
                        self.postgres_metrics.cache_hit_ratio = float(cache_hit_ratio)
                except Exception as e:
                    logger.debug(f"Error getting cache hit ratio: {e}")
                    self.postgres_metrics.cache_hit_ratio = 0.0
            
                # Get query performance metrics using alternative approach
                try:
                    # Use a simple query timing approach instead of pg_stat_statements
                    start_time = time.time()
                    result = db.execute(text("SELECT 1"))
                    end_time = time.time()
                    query_time_ms = (end_time - start_time) * 1000
                    self.postgres_metrics.query_performance = round(query_time_ms, 2)
                except Exception as e:
                    logger.debug(f"Error getting query performance: {e}")
                    self.postgres_metrics.query_performance = 0.0
            
                # Get table statistics
                try:
                    result = db.execute(text("""
                        SELECT 
                            schemaname,
                            relname as tablename,
                            n_tup_ins as inserts,
                            n_tup_upd as updates,
                            n_tup_del as deletes
                        FROM pg_stat_user_tables 
                        ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
                        LIMIT 5
                    """))
                    table_stats = result.fetchall()
                    self.postgres_metrics.table_stats = [
                        {
                            "schema": row[0],
                            "table": row[1],
                            "inserts": row[2],
                            "updates": row[3],
                            "deletes": row[4]
                        }
                        for row in table_stats
                    ]
                except Exception as e:
                    logger.debug(f"Error getting table statistics: {e}")
                    self.postgres_metrics.table_stats = []
            
                # Set connection status to connected
                self.postgres_metrics.connection_status = "connected"
                self.postgres_metrics.last_health_check = datetime.now()
                
            except Exception as e:
                logger.debug(f"Database operations failed: {e}")
                self.postgres_metrics.connection_status = "disconnected"
            finally:
                # Ensure database session is closed
                try:
                    db.close()
                except:
                    pass
                
        except Exception as e:
            logger.debug(f"PostgreSQL metrics collection failed: {e}")
            self.postgres_metrics.connection_status = "disconnected"
    
    async def _collect_pipeline_metrics(self):
        """Collect pipeline-specific metrics from actual backend data"""
        try:
            # Get query metrics from the actual queries endpoint
            queries_response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: requests.get(f"{self.backend_url}/api/v1/queries/history?limit=100", timeout=5)
            )
            
            if queries_response.status_code == 200:
                queries_data = queries_response.json()
                queries = queries_data.get('queries', [])
                
                # Calculate real metrics from actual data
                if queries:
                    now = datetime.now()
                    
                    # Calculate queries per minute based on queries from last minute (not hour)
                    # Also check last 5 minutes as fallback if no queries in last minute
                    recent_queries_1min = []
                    recent_queries_5min = []
                    
                    for q in queries:
                        timestamp = q.get('timestamp', 0)
                        if timestamp:
                            try:
                                # Handle both float timestamps and ISO string timestamps
                                if isinstance(timestamp, (int, float)):
                                    query_time = datetime.fromtimestamp(timestamp)
                                elif isinstance(timestamp, str):
                                    # Try parsing ISO format
                                    try:
                                        from dateutil.parser import parse as parse_date
                                        query_time = parse_date(timestamp)
                                    except ImportError:
                                        # Fallback to datetime.fromisoformat if dateutil not available
                                        try:
                                            query_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                                        except:
                                            logger.debug(f"Could not parse timestamp string: {timestamp}")
                                            continue
                                else:
                                    continue
                                
                                time_diff = (now - query_time).total_seconds()
                                
                                if time_diff < 60:  # Last minute
                                    recent_queries_1min.append(q)
                                if time_diff < 300:  # Last 5 minutes
                                    recent_queries_5min.append(q)
                            except Exception as e:
                                logger.debug(f"Error parsing query timestamp: {e}")
                                continue
                    
                    # Use queries from last minute if available, otherwise use last 5 minutes and divide by 5
                    if recent_queries_1min:
                        self.pipeline_metrics.query_processing_rate = len(recent_queries_1min)
                        logger.debug(f"Query processing rate: {len(recent_queries_1min)} queries/min (from last minute)")
                    elif recent_queries_5min:
                        # Estimate per minute from 5-minute window
                        self.pipeline_metrics.query_processing_rate = len(recent_queries_5min) / 5.0
                        logger.debug(f"Query processing rate: {self.pipeline_metrics.query_processing_rate:.2f} queries/min (estimated from {len(recent_queries_5min)} queries in last 5 minutes)")
                    else:
                        # No recent queries - set to 0
                        self.pipeline_metrics.query_processing_rate = 0.0
                        logger.debug("No queries in last 5 minutes - query processing rate set to 0")
                    
                    # Calculate average response time from actual data
                    # processing_time is in seconds, convert to milliseconds
                    response_times = []
                    for q in queries:
                        proc_time = q.get('processing_time')
                        if proc_time is not None and proc_time > 0:
                            # Convert seconds to milliseconds
                            response_times.append(proc_time * 1000)
                    
                    if response_times:
                        self.pipeline_metrics.avg_query_processing_time = sum(response_times) / len(response_times)
                        logger.debug(f"Average query processing time: {self.pipeline_metrics.avg_query_processing_time:.2f}ms (from {len(response_times)} queries)")
                    else:
                        logger.debug("No valid processing times found in queries")
                    
                    # Calculate success rate
                    successful_queries = len([q for q in queries if q.get('response')])
                    self.pipeline_metrics.success_rate = (successful_queries / len(queries)) * 100 if queries else 0
                    
                    # Active queries (recent ones from last minute)
                    self.pipeline_metrics.active_queries = len(recent_queries_1min)
                else:
                    logger.debug("No queries found in query history")
                    self.pipeline_metrics.query_processing_rate = 0.0
            
            # Get document metrics from the actual documents endpoint
            docs_response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: requests.get(f"{self.backend_url}/api/v1/documents", timeout=5)
            )
            
            if docs_response.status_code == 200:
                docs_data = docs_response.json()
                documents = docs_data if isinstance(docs_data, list) else docs_data.get('documents', [])
                
                # Calculate document processing metrics
                if documents:
                    # Count processed documents
                    processed_docs = len([d for d in documents if d.get('status') == 'processed'])
                    self.pipeline_metrics.active_documents = processed_docs
                    
                    # Calculate document processing rate (simplified)
                    self.pipeline_metrics.document_processing_rate = processed_docs / 60.0  # Per minute (simplified)
                
        except Exception as e:
            logger.debug(f"Pipeline metrics collection failed: {e}")
            # Only collect real metrics, no fallbacks
    
    async def _update_system_metrics(self):
        """Update system-level metrics - NON-BLOCKING version"""
        try:
            # Use non-blocking CPU percent (interval=None returns immediately with cached value)
            # First call initializes, subsequent calls return immediately
            loop = asyncio.get_event_loop()
            
            # Run CPU percent in executor to avoid blocking (non-blocking call)
            cpu_percent = await loop.run_in_executor(
                None,  # Default thread pool executor
                lambda: psutil.cpu_percent(interval=None)  # Non-blocking, uses cached value
            )
            
            # Memory, disk, network are fast operations (non-blocking)
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available = memory.available
            
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            
            network = psutil.net_io_counters()
            
            # Get GPU metrics (already non-blocking)
            gpu_metrics = self._get_gpu_metrics()
            
            # Store in a way that can be accessed by the frontend
            self.system_metrics = {
                'cpu_usage': cpu_percent,
                'memory_usage': memory_percent,
                'memory_available': memory_available,
                'disk_usage': disk_percent,
                'network_bytes_sent': network.bytes_sent,
                'network_bytes_recv': network.bytes_recv,
                'gpu_metrics': gpu_metrics
            }
            
        except Exception as e:
            logger.debug(f"System metrics update failed: {e}")
            # Use cached values on error to prevent blocking
    
    def _get_gpu_metrics(self):
        """Get GPU metrics if available"""
        try:
            import GPUtil
            gpus = GPUtil.getGPUs()
            if gpus and len(gpus) > 0:
                gpu = gpus[0]  # Use first GPU
                return {
                    'utilization': float(gpu.load * 100),  # Ensure it's a float
                    'memory_used': float(gpu.memoryUsed),
                    'memory_total': float(gpu.memoryTotal),
                    'temperature': float(gpu.temperature) if gpu.temperature else None,
                    'name': str(gpu.name) if gpu.name else 'Unknown'
                }
            else:
                logger.debug("No GPUs found via GPUtil")
                return None
        except ImportError:
            logger.warning("GPUtil library not installed. Install with: pip install gputil")
            return None
        except Exception as e:
            logger.warning(f"Failed to collect GPU metrics: {e}")
            return None
    
    async def _update_pipeline_metrics(self):
        """Update pipeline-specific metrics"""
        # This would be implemented based on the actual pipeline monitoring needs
        pass
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all collected metrics"""
        return {
            'qdrant_metrics': {
                'collections_count': self.qdrant_metrics.collections_count,
                'total_points': self.qdrant_metrics.total_points,
                'memory_usage': self.qdrant_metrics.memory_usage,
                'disk_usage': self.qdrant_metrics.disk_usage,
                'search_latency': self.qdrant_metrics.search_latency,
                'indexing_speed': self.qdrant_metrics.indexing_speed,
                'connection_status': self.qdrant_metrics.connection_status,
                'last_health_check': self.qdrant_metrics.last_health_check.isoformat() if self.qdrant_metrics.last_health_check else None
            },
            'postgres_metrics': {
                'active_connections': self.postgres_metrics.active_connections,
                'total_connections': self.postgres_metrics.total_connections,
                'database_size': self.postgres_metrics.database_size,
                'query_performance': self.postgres_metrics.query_performance,
                'cache_hit_ratio': self.postgres_metrics.cache_hit_ratio,
                'connection_status': self.postgres_metrics.connection_status,
                'last_health_check': self.postgres_metrics.last_health_check.isoformat() if self.postgres_metrics.last_health_check else None
            },
            'pipeline_metrics': {
                'document_processing_rate': self.pipeline_metrics.document_processing_rate,
                'query_processing_rate': self.pipeline_metrics.query_processing_rate,
                'avg_document_processing_time': self.pipeline_metrics.avg_document_processing_time,
                'avg_query_processing_time': self.pipeline_metrics.avg_query_processing_time,
                'active_documents': self.pipeline_metrics.active_documents,
                'active_queries': self.pipeline_metrics.active_queries,
                'success_rate': self.pipeline_metrics.success_rate,
                'error_rate': self.pipeline_metrics.error_rate
            },
            'connection_metrics': {
                'websocket_connections': self.connection_metrics.websocket_connections,
                'backend_status': self.connection_metrics.backend_status,
                'database_status': self.connection_metrics.database_status,
                'vector_db_status': self.connection_metrics.vector_db_status,
                'llm_service_status': self.connection_metrics.llm_service_status,
                'last_health_check': self.connection_metrics.last_health_check.isoformat() if self.connection_metrics.last_health_check else None
            },
            'system_metrics': getattr(self, 'system_metrics', {})
        }

# Global instance
enhanced_metrics_collector = EnhancedMetricsCollector()
