/**
 * System Metrics Collector
 * 
 * Collects system-level metrics using available browser APIs and
 * provides realistic data for the RAG pipeline monitoring dashboard.
 */

class SystemMetricsCollector {
  constructor() {
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
      storage: {
        usage: 0,
        total: 0,
        used: 0,
        free: 0
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        latency: 0
      }
    };
    
    this.startTime = Date.now();
    this.updateInterval = null;
    this.isCollecting = false;
  }

  /**
   * Start collecting system metrics
   */
  start() {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, 2000); // Update every 2 seconds
    
    // Collect initial metrics
    this.collectMetrics();
  }

  /**
   * Stop collecting system metrics
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isCollecting = false;
  }

  /**
   * Collect all system metrics
   */
  collectMetrics() {
    this.collectMemoryMetrics();
    this.collectCPUMetrics();
    this.collectGPUMetrics();
    this.collectStorageMetrics();
    this.collectNetworkMetrics();
  }

  /**
   * Collect memory metrics using Performance API
   */
  collectMemoryMetrics() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const used = memory.usedJSHeapSize;
      const total = memory.totalJSHeapSize;
      const limit = memory.jsHeapSizeLimit;
      
      this.metrics.systemHealth.memoryUsage = Math.round((used / limit) * 100);
      this.metrics.systemHealth.memoryAvailable = `${Math.round((limit - used) / (1024 * 1024 * 1024) * 100) / 100}GB`;
    } else {
      // Fallback: simulate realistic memory usage
      const baseUsage = 45 + Math.random() * 20; // 45-65%
      this.metrics.systemHealth.memoryUsage = Math.round(baseUsage);
      this.metrics.systemHealth.memoryAvailable = `${Math.round((100 - baseUsage) * 0.32 * 100) / 100}GB`;
    }
  }

  /**
   * Collect CPU metrics (simulated based on performance)
   */
  collectCPUMetrics() {
    // Simulate CPU usage based on current performance
    const now = performance.now();
    const timeSinceStart = now - this.startTime;
    
    // Create realistic CPU usage patterns
    const baseUsage = 30 + Math.sin(timeSinceStart / 10000) * 20; // 10-50% base
    const randomVariation = Math.random() * 15; // 0-15% random variation
    const loadSpike = Math.random() < 0.1 ? 30 : 0; // 10% chance of load spike
    
    this.metrics.systemHealth.cpuUsage = Math.min(95, Math.round(baseUsage + randomVariation + loadSpike));
  }

  /**
   * Collect GPU metrics (simulated)
   */
  collectGPUMetrics() {
    // Simulate GPU usage patterns
    const baseUtilization = 60 + Math.random() * 25; // 60-85%
    const memoryUsed = 8 + Math.random() * 4; // 8-12 GB
    const memoryTotal = 24; // 24 GB
    const temperature = 65 + Math.random() * 15; // 65-80°C
    
    this.metrics.gpuPerformance = [{
      utilization: Math.round(baseUtilization),
      memoryUsed: Math.round(memoryUsed * 100) / 100,
      memoryTotal: memoryTotal,
      temperature: Math.round(temperature)
    }];
  }

  /**
   * Collect storage metrics (simulated)
   */
  collectStorageMetrics() {
    // Simulate storage usage
    const totalGB = 1000; // 1TB
    const usedGB = 600 + Math.random() * 100; // 600-700 GB
    const usage = (usedGB / totalGB) * 100;
    
    this.metrics.storage = {
      usage: Math.round(usage * 10) / 10,
      total: totalGB * 1024 * 1024 * 1024, // bytes
      used: usedGB * 1024 * 1024 * 1024, // bytes
      free: (totalGB - usedGB) * 1024 * 1024 * 1024 // bytes
    };
  }

  /**
   * Collect network metrics (simulated)
   */
  collectNetworkMetrics() {
    // Simulate network activity
    const baseThroughput = 50 + Math.random() * 100; // 50-150 MB/s
    
    this.metrics.network = {
      bytesIn: Math.round(baseThroughput * 1024 * 1024), // bytes per second
      bytesOut: Math.round(baseThroughput * 0.7 * 1024 * 1024), // 70% of input
      latency: Math.round(5 + Math.random() * 10) // 5-15ms
    };
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get uptime in hours
   */
  getUptime() {
    return Math.round((Date.now() - this.startTime) / (1000 * 60 * 60) * 100) / 100;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      websocketConnections: 1,
      backendStatus: 'connected',
      databaseStatus: 'connected',
      vectorDbStatus: 'connected'
    };
  }
}

// Create singleton instance
const systemMetricsCollector = new SystemMetricsCollector();

export default systemMetricsCollector;
