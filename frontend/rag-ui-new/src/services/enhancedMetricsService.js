/**
 * Enhanced Metrics Service
 * 
 * This service connects to the enhanced metrics API endpoints to get comprehensive
 * monitoring data including Qdrant, PostgreSQL, Pipeline, and Connection Status metrics.
 */

class EnhancedMetricsService {
  constructor() {
    this.baseUrl = 'http://localhost:8000/api/v1';
    this.isConnected = false;
    this.listeners = new Set();
    this.metrics = {
      qdrant: null,
      postgres: null,
      pipeline: null,
      connection: null,
      system: null,
      health: null,
      comprehensive: null
    };
    
    // Start collecting metrics
    this.startMetricsCollection();
  }

  /**
   * Start collecting metrics from all endpoints
   */
  startMetricsCollection() {
    // Collect metrics every 2 seconds
    this.metricsInterval = setInterval(() => {
      this.collectAllMetrics();
    }, 2000);
    
    // Initial collection
    this.collectAllMetrics();
  }

  /**
   * Stop collecting metrics
   */
  stopMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Collect metrics from all endpoints
   */
  async collectAllMetrics() {
    try {
      const promises = [
        this.fetchQdrantMetrics(),
        this.fetchPostgresMetrics(),
        this.fetchPipelineMetrics(),
        this.fetchConnectionStatus(),
        this.fetchSystemMetrics(),
        this.fetchHealthStatus(),
        this.fetchComprehensiveMetrics()
      ];

      await Promise.allSettled(promises);
      this.isConnected = true;
      
      // Notify listeners
      this.notifyListeners();
      
    } catch (error) {
      console.error('Error collecting enhanced metrics:', error);
      this.isConnected = false;
    }
  }

  /**
   * Fetch Qdrant metrics
   */
  async fetchQdrantMetrics() {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/qdrant`);
      if (response.ok) {
        const data = await response.json();
        this.metrics.qdrant = data;
      }
    } catch (error) {
      console.error('Error fetching Qdrant metrics:', error);
    }
  }

  /**
   * Fetch PostgreSQL metrics
   */
  async fetchPostgresMetrics() {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/postgres`);
      if (response.ok) {
        const data = await response.json();
        this.metrics.postgres = data;
      }
    } catch (error) {
      console.error('Error fetching PostgreSQL metrics:', error);
    }
  }

  /**
   * Fetch pipeline metrics
   */
  async fetchPipelineMetrics() {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/pipeline`);
      if (response.ok) {
        const data = await response.json();
        this.metrics.pipeline = data;
      }
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
    }
  }

  /**
   * Fetch connection status
   */
  async fetchConnectionStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/connection-status`);
      if (response.ok) {
        const data = await response.json();
        this.metrics.connection = data;
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    }
  }

  /**
   * Fetch system metrics
   */
  async fetchSystemMetrics() {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/system`);
      if (response.ok) {
        const data = await response.json();
        this.metrics.system = data;
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  }

  /**
   * Fetch health status
   */
  async fetchHealthStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/health`);
      if (response.ok) {
        const data = await response.json();
        this.metrics.health = data;
      }
    } catch (error) {
      console.error('Error fetching health status:', error);
    }
  }

  /**
   * Fetch comprehensive metrics
   */
  async fetchComprehensiveMetrics() {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/comprehensive`);
      if (response.ok) {
        const data = await response.json();
        this.metrics.comprehensive = data;
      }
    } catch (error) {
      console.error('Error fetching comprehensive metrics:', error);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Get specific metric category
   */
  getMetricCategory(category) {
    return this.metrics[category] || null;
  }

  /**
   * Get Qdrant metrics
   */
  getQdrantMetrics() {
    return this.metrics.qdrant?.metrics || null;
  }

  /**
   * Get PostgreSQL metrics
   */
  getPostgresMetrics() {
    return this.metrics.postgres?.metrics || null;
  }

  /**
   * Get pipeline metrics
   */
  getPipelineMetrics() {
    return this.metrics.pipeline?.metrics || null;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.metrics.connection?.connection_status || null;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    return this.metrics.system?.system_metrics || null;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return this.metrics.health || null;
  }

  /**
   * Get comprehensive metrics
   */
  getComprehensiveMetrics() {
    return this.metrics.comprehensive || null;
  }

  /**
   * Add listener for metrics updates
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Error in metrics listener:', error);
      }
    });
  }

  /**
   * Get connection status
   */
  isServiceConnected() {
    return this.isConnected;
  }

  /**
   * Get service health summary
   */
  getServiceHealthSummary() {
    const health = this.getHealthStatus();
    if (!health) return null;

    return {
      overall: health.overall_health,
      healthyServices: health.healthy_services,
      totalServices: health.total_services,
      services: {
        backend: health.connection_metrics?.backend_status || 'unknown',
        database: health.connection_metrics?.database_status || 'unknown',
        vectorDb: health.connection_metrics?.vector_db_status || 'unknown',
        llmService: health.connection_metrics?.llm_service_status || 'unknown'
      }
    };
  }

  /**
   * Get pipeline performance summary
   */
  getPipelinePerformanceSummary() {
    const pipeline = this.getPipelineMetrics();
    if (!pipeline) return null;

    return {
      documentProcessing: {
        rate: pipeline.document_processing_rate || 0,
        avgTime: pipeline.avg_document_processing_time || 0,
        active: pipeline.active_documents || 0
      },
      queryProcessing: {
        rate: pipeline.query_processing_rate || 0,
        avgTime: pipeline.avg_query_processing_time || 0,
        active: pipeline.active_queries || 0
      },
      successRate: pipeline.success_rate || 0,
      errorRate: pipeline.error_rate || 0
    };
  }

  /**
   * Get system performance summary
   */
  getSystemPerformanceSummary() {
    const system = this.getSystemMetrics();
    if (!system) return null;

    return {
      cpu: system.cpu_usage || 0,
      memory: system.memory_usage || 0,
      disk: system.disk_usage || 0,
      network: {
        bytesSent: system.network_bytes_sent || 0,
        bytesRecv: system.network_bytes_recv || 0
      }
    };
  }

  /**
   * Get Qdrant performance summary
   */
  getQdrantPerformanceSummary() {
    const qdrant = this.getQdrantMetrics();
    if (!qdrant) return null;

    return {
      collections: qdrant.collections_count || 0,
      totalPoints: qdrant.total_points || 0,
      memoryUsage: qdrant.memory_usage || 0,
      searchLatency: qdrant.search_latency || 0,
      connectionStatus: qdrant.connection_status || 'unknown'
    };
  }

  /**
   * Get PostgreSQL performance summary
   */
  getPostgresPerformanceSummary() {
    const postgres = this.getPostgresMetrics();
    if (!postgres) return null;

    return {
      activeConnections: postgres.active_connections || 0,
      totalConnections: postgres.total_connections || 0,
      databaseSize: postgres.database_size || 0,
      cacheHitRatio: postgres.cache_hit_ratio || 0,
      connectionStatus: postgres.connection_status || 'unknown'
    };
  }
}

// Create and export singleton instance
const enhancedMetricsService = new EnhancedMetricsService();
export default enhancedMetricsService;
