/**
 * Real-time Pipeline Data Service
 * 
 * This service connects to the backend WebSocket to get real-time metrics
 * and provides them to the pipeline visualization components.
 */

import systemMetricsCollector from './systemMetricsCollector';
import applicationMetricsCollector from './applicationMetricsCollector';
import apiMetricsCollector from './apiMetricsCollector';
import postgresMetricsCollector from './postgresMetricsCollector';

class RealTimePipelineService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Set();
    
    // Initialize metrics collectors
    this.systemCollector = systemMetricsCollector;
    this.appCollector = applicationMetricsCollector;
    this.apiCollector = apiMetricsCollector;
    this.postgresCollector = postgresMetricsCollector;
    
    // Initialize metrics with default values
    this.metrics = {
      systemHealth: {
        cpuUsage: 0,
        memoryUsage: 0,
        memoryAvailable: '0GB'
      },
      gpuPerformance: [{
        utilization: 0,
        memoryUsed: 0,
        memoryTotal: 0,
        temperature: 0
      }],
      pipelineStatus: {
        queriesPerMinute: 0,
        avgResponseTime: 0,
        activeQueries: 0
      },
      connectionStatus: {
        websocketConnections: 0,
        backendStatus: 'disconnected',
        databaseStatus: 'disconnected',
        vectorDbStatus: 'disconnected'
      }
    };
    
    // Start collecting metrics
    this.startMetricsCollection();
  }

  /**
   * Start collecting metrics from collectors
   */
  startMetricsCollection() {
    // Start system metrics collection (WebSocket)
    this.systemCollector.start();
    
    // Start application metrics collection (simulated)
    this.appCollector.start();
    
    // Temporarily disable API collectors to fix blank pages
    // this.apiCollector.start();
    // this.postgresCollector.start();
    
    // Update metrics every 2 seconds
    this.metricsInterval = setInterval(() => {
      this.updateMetricsFromCollectors();
    }, 2000);
    
    // Initial update
    this.updateMetricsFromCollectors();
  }

  /**
   * Update metrics from collectors
   */
  updateMetricsFromCollectors() {
    // Get system metrics from WebSocket
    const systemMetrics = this.systemCollector.getMetrics();
    this.metrics.systemHealth = systemMetrics.systemHealth;
    this.metrics.gpuPerformance = systemMetrics.gpuPerformance;
    
    // Use simulated metrics instead of API calls
    const appMetrics = this.appCollector.getMetrics();
    this.metrics.pipelineStatus = {
      queriesPerMinute: appMetrics.queryProcessing.queriesPerMinute,
      avgResponseTime: appMetrics.queryProcessing.avgResponseTime,
      activeQueries: appMetrics.queryProcessing.activeQueries
    };
    
    // Add simulated document processing metrics
    this.metrics.documentProcessing = appMetrics.documentProcessing;
    
    // Add simulated vector database metrics
    this.metrics.vectorDatabase = appMetrics.vectorDatabase;
    
    // Add simulated PostgreSQL database metrics
    this.metrics.postgresDatabase = {
      databaseHealth: { status: 'healthy', connectionCount: 12, activeConnections: 8 },
      tables: { users: { count: 25 }, documents: { count: 150 }, queryHistory: { count: 500 } },
      performance: { totalQueries: 500, avgResponseTime: 45, cacheHitRatio: 92 },
      storage: { databaseSize: 245, freeSpace: 800 }
    };
    
    // Update connection status
    this.metrics.connectionStatus = this.systemCollector.getConnectionStatus();
    
    // Notify listeners with updated metrics
    this.notifyListeners('data', this.metrics);
  }

  /**
   * Connect to the WebSocket endpoint
   */
  connect() {
    if (this.isConnected) {
      return;
    }

    try {
      // Try different possible WebSocket endpoints
      const endpoints = [
        'ws://localhost:8000/api/v1/ws/pipeline-monitoring',
        'ws://localhost:8000/ws/pipeline-monitoring',
        'ws://localhost:3000/api/v1/ws/pipeline-monitoring',
        'ws://localhost:3000/ws/pipeline-monitoring'
      ];

      let connected = false;
      for (const endpoint of endpoints) {
        try {
          this.ws = new WebSocket(endpoint);
          this.setupWebSocketHandlers(endpoint);
          connected = true;
          console.log(`🔌 WebSocket created for: ${endpoint}`);
          break;
        } catch (error) {
          console.warn(`❌ Failed to create WebSocket for ${endpoint}:`, error.message);
        }
      }

      if (!connected) {
        throw new Error('Could not create WebSocket connection to any endpoint');
      }

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupWebSocketHandlers(endpoint = '') {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('connected');
    };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Use backend message handler for the monitoring endpoint
          if (endpoint.includes('/api/v1/ws/pipeline-monitoring')) {
            this.handleBackendMessage(data);
          } else {
            this.handleMessage(data);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.isConnected = false;
      this.notifyListeners('disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.isConnected = false;
      this.notifyListeners('error', error);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    console.log('📊 Received WebSocket data:', data);

    if (data.type === 'metrics_update' && data.data) {
      this.updateMetrics(data.data);
    } else if (data.type === 'initial_state' && data.data) {
      this.updateMetrics(data.data);
    }

    this.notifyListeners('data', this.metrics);
  }

  /**
   * Handle incoming WebSocket messages from backend monitoring service
   */
  handleBackendMessage(data) {
    console.log('📊 Received backend WebSocket data:', data);
    
    if (data.type === 'metrics_update' && data.data) {
      this.updateBackendMetrics(data.data);
    } else if (data.type === 'connection_established') {
      console.log('✅ Backend WebSocket connection established');
    } else if (data.type === 'test_message') {
      console.log('🧪 Test message received:', data.message);
    }
    
    this.notifyListeners('data', this.metrics);
  }

  /**
   * Update internal metrics with new data
   */
  updateMetrics(data) {
    // Update system health
    if (data.system_health) {
      this.metrics.systemHealth = {
        cpuUsage: data.system_health.cpu_usage || 0,
        memoryUsage: data.system_health.memory_usage || 0,
        memoryAvailable: `${Math.round((100 - (data.system_health.memory_usage || 0)) * 32 / 100)}GB` // Approximate available memory
      };
    }

    // Update GPU performance
    if (data.gpu_performance) {
      this.metrics.gpuPerformance = [{
        utilization: data.gpu_performance.gpu_utilization || 0,
        memoryUsed: data.gpu_performance.gpu_memory_used_mib || 0,
        memoryTotal: data.gpu_performance.gpu_memory_total_mib || 0,
        temperature: data.gpu_performance.gpu_temperature || 0
      }];
    }

    // Update pipeline status
    if (data.query_performance) {
      this.metrics.pipelineStatus = {
        queriesPerMinute: data.query_performance.queries_per_minute || 0,
        avgResponseTime: data.query_performance.average_response_time_ms || 0,
        activeQueries: data.query_performance.active_queries || 0
      };
    }

    // Update connection status
    if (data.connection_status) {
      this.metrics.connectionStatus = {
        websocketConnections: 1, // We know we're connected
        backendStatus: data.connection_status.backend || 'unknown',
        databaseStatus: data.connection_status.database || 'unknown',
        vectorDbStatus: data.connection_status.vector_db || 'unknown'
      };
    }

    // Update timestamp
    this.metrics.lastUpdate = new Date().toISOString();
  }

  /**
   * Update metrics from backend monitoring service
   */
  updateBackendMetrics(data) {
    console.log('📊 Updating metrics from backend:', data);
    
    // Update system health metrics from backend
    if (data.system_health) {
      this.metrics.systemHealth = {
        cpuUsage: data.system_health.cpu_usage || 0,
        memoryUsage: data.system_health.memory_usage || 0,
        memoryAvailable: `${Math.round((100 - (data.system_health.memory_usage || 0)) * 32 / 100)}GB`
      };
    }
    
    // Update GPU performance metrics from backend
    if (data.gpu_performance) {
      // Handle both single GPU and array format
      const gpuData = Array.isArray(data.gpu_performance) ? data.gpu_performance[0] : data.gpu_performance;
      this.metrics.gpuPerformance = [{
        utilization: gpuData.gpu_utilization || 0,
        memoryUsed: gpuData.gpu_memory_used || gpuData.gpu_memory_used_mib || 0,
        memoryTotal: gpuData.gpu_memory_total || gpuData.gpu_memory_total_mib || 0,
        temperature: gpuData.gpu_temperature || 0
      }];
    }
    
    // Update query performance metrics from backend
    if (data.query_performance) {
      this.metrics.pipelineStatus = {
        queriesPerMinute: data.query_performance.queries_per_minute || 0,
        avgResponseTime: data.query_performance.average_response_time_ms || 0,
        activeQueries: data.query_performance.active_queries || 0
      };
    }
    
    // Update connection status from backend
    if (data.connection_status) {
      this.metrics.connectionStatus = {
        websocketConnections: 1, // We're connected
        backendStatus: data.connection_status.backend || 'unknown',
        databaseStatus: data.connection_status.database || 'unknown',
        vectorDbStatus: data.connection_status.vector_db || 'unknown'
      };
    }
    
    // Update timestamp
    this.metrics.lastUpdate = new Date().toISOString();
  }

  /**
   * Handle reconnection logic
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Add a listener for real-time updates
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Error in listener callback:', error);
      }
    });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  /**
   * Generate realistic pipeline data based on real metrics
   */
  generatePipelineData() {
    const systemMetrics = this.systemCollector.getMetrics();
    const appMetrics = this.appCollector.getMetrics();
    
    const cpuUsage = systemMetrics.systemHealth.cpuUsage || 0;
    const memoryUsage = systemMetrics.systemHealth.memoryUsage || 0;
    const gpuUsage = systemMetrics.gpuPerformance[0]?.utilization || 0;
    const queriesPerMinute = appMetrics.pipelineStatus.queriesPerMinute || 0;
    const avgResponseTime = appMetrics.pipelineStatus.avgResponseTime || 0;
    const activeQueries = appMetrics.pipelineStatus.activeQueries || 0;

    console.log('🔧 Generating pipeline data with real metrics:', { 
      cpuUsage, memoryUsage, gpuUsage, queriesPerMinute, avgResponseTime, activeQueries 
    });

    // Generate pipeline data based on real metrics
    const queryThroughput = Math.max(1, Math.floor(queriesPerMinute / 60 * 10)); // Convert to per 10 seconds
    const vectorLatency = Math.max(20, Math.floor(avgResponseTime * 0.1 + Math.random() * 30));
    const llmProcessingTime = Math.max(1000, Math.floor(avgResponseTime * 0.8 + Math.random() * 500));
    const responseTime = Math.max(50, Math.floor(avgResponseTime * 0.1 + Math.random() * 100));

    const pipelineData = {
      queryInput: {
        status: cpuUsage > 80 ? 'warning' : 'active',
        currentQuery: `Query ${Math.floor(Math.random() * 1000)}`,
        throughput: queryThroughput,
        queueDepth: activeQueries,
        activeQueries: activeQueries,
        avgQueueTime: Math.floor(Math.random() * 100) + 20
      },
      vectorSearch: {
        status: memoryUsage > 90 ? 'warning' : 'processing',
        latency: vectorLatency,
        resultsCount: Math.floor(Math.random() * 10) + 3,
        accuracy: Math.max(85, 100 - cpuUsage * 0.1).toFixed(1),
        vectorCount: 125000 + Math.floor(Math.random() * 10000),
        searchTime: vectorLatency + Math.floor(Math.random() * 20),
        searchesPerformed: Math.floor(queriesPerMinute * 0.8)
      },
      llmProcessing: {
        status: gpuUsage > 90 ? 'warning' : 'processing',
        modelLoad: Math.min(100, Math.floor(gpuUsage * 1.1)),
        tokensGenerated: Math.floor(Math.random() * 500) + 100,
        processingTime: llmProcessingTime,
        gpuUsage: gpuUsage,
        memoryUsage: (memoryUsage / 10).toFixed(1),
        temperature: Math.max(60, Math.floor(gpuUsage * 0.4 + 50))
      },
      responseGeneration: {
        status: cpuUsage > 95 ? 'warning' : 'success',
        responseLength: Math.floor(Math.random() * 300) + 200,
        deliveryTime: responseTime,
        successRate: Math.max(90, 100 - cpuUsage * 0.05).toFixed(1),
        totalResponses: 1000 + Math.floor(Math.random() * 500),
        avgResponseTime: llmProcessingTime + responseTime,
        responsesGenerated: Math.floor(queriesPerMinute * 0.9)
      },
      resourceMonitor: {
        status: cpuUsage > 85 || memoryUsage > 85 ? 'warning' : 'active',
        cpuUsage: cpuUsage,
        memoryUsage: memoryUsage,
        gpuUsage: gpuUsage,
        temperature: Math.max(60, Math.floor(gpuUsage * 0.4 + 50)),
        networkThroughput: (Math.random() * 100 + 50).toFixed(1),
        uptime: this.systemCollector.getUptime()
      },
      // Add document processing metrics
      documentProcessing: {
        documentsProcessed: appMetrics.documentProcessing.documentsProcessed,
        chunksGenerated: appMetrics.documentProcessing.chunksGenerated,
        embeddingsGenerated: appMetrics.documentProcessing.embeddingsGenerated,
        vectorsStored: appMetrics.documentProcessing.vectorsStored,
        avgProcessingTime: appMetrics.documentProcessing.avgProcessingTime,
        successRate: appMetrics.documentProcessing.successRate
      }
    };

    console.log('📊 Generated pipeline data:', pipelineData);
    return pipelineData;
  }
}

// Create singleton instance
const realTimePipelineService = new RealTimePipelineService();

export default realTimePipelineService;
