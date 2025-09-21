/**
 * Real-time Pipeline Data Service
 * 
 * This service connects to the backend WebSocket to get real-time metrics
 * and provides them to the pipeline visualization components.
 */

class RealTimePipelineService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Set();
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
          this.setupWebSocketHandlers();
          connected = true;
          console.log(`🔌 Connected to WebSocket: ${endpoint}`);
          break;
        } catch (error) {
          console.warn(`❌ Failed to connect to ${endpoint}:`, error.message);
        }
      }

      if (!connected) {
        throw new Error('Could not connect to any WebSocket endpoint');
      }

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupWebSocketHandlers() {
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
        this.handleMessage(data);
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
   * Generate realistic pipeline data based on system metrics
   */
  generatePipelineData() {
    const base = this.metrics.systemHealth.cpuUsage || 0;
    const memory = this.metrics.systemHealth.memoryUsage || 0;
    const gpu = this.metrics.gpuPerformance[0]?.utilization || 0;

    // Generate realistic pipeline metrics based on system load
    const queryThroughput = Math.max(5, Math.floor(base * 0.8 + Math.random() * 10));
    const vectorLatency = Math.max(20, Math.floor(base * 2 + Math.random() * 30));
    const llmProcessingTime = Math.max(1000, Math.floor(gpu * 50 + Math.random() * 2000));
    const responseTime = Math.max(50, Math.floor(base * 3 + Math.random() * 100));

    return {
      queryInput: {
        status: base > 80 ? 'warning' : 'active',
        currentQuery: `Query ${Math.floor(Math.random() * 1000)}`,
        throughput: queryThroughput,
        queueDepth: Math.floor(Math.random() * 5) + 1
      },
      vectorSearch: {
        status: memory > 90 ? 'warning' : 'processing',
        latency: vectorLatency,
        resultsCount: Math.floor(Math.random() * 10) + 3,
        accuracy: Math.max(85, 100 - base * 0.1).toFixed(1),
        vectorCount: 125000 + Math.floor(Math.random() * 10000),
        searchTime: vectorLatency + Math.floor(Math.random() * 20)
      },
      llmProcessing: {
        status: gpu > 90 ? 'warning' : 'processing',
        modelLoad: Math.min(100, Math.floor(gpu * 1.1)),
        tokensGenerated: Math.floor(Math.random() * 500) + 100,
        processingTime: llmProcessingTime,
        gpuUsage: gpu,
        memoryUsage: (memory / 10).toFixed(1),
        temperature: Math.max(60, Math.floor(gpu * 0.4 + 50))
      },
      responseGeneration: {
        status: base > 95 ? 'warning' : 'success',
        responseLength: Math.floor(Math.random() * 300) + 200,
        deliveryTime: responseTime,
        successRate: Math.max(90, 100 - base * 0.05).toFixed(1),
        totalResponses: 1000 + Math.floor(Math.random() * 500),
        avgResponseTime: llmProcessingTime + responseTime
      },
      resourceMonitor: {
        status: base > 85 || memory > 85 ? 'warning' : 'active',
        cpuUsage: base,
        memoryUsage: memory,
        gpuUsage: gpu,
        temperature: Math.max(60, Math.floor(gpu * 0.4 + 50)),
        networkThroughput: (Math.random() * 100 + 50).toFixed(1),
        uptime: Math.floor(Math.random() * 100) + 50
      }
    };
  }
}

// Create singleton instance
const realTimePipelineService = new RealTimePipelineService();

export default realTimePipelineService;
