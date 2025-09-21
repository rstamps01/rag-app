/**
 * Application Metrics Collector
 * 
 * Collects application-level metrics for query processing,
 * document processing, and other RAG pipeline operations.
 */

class ApplicationMetricsCollector {
  constructor() {
    this.metrics = {
      queryProcessing: {
        queriesPerMinute: 0,
        avgResponseTime: 0,
        activeQueries: 0,
        successRate: 0,
        queueLength: 0
      },
      documentProcessing: {
        documentsProcessed: 0,
        chunksGenerated: 0,
        embeddingsGenerated: 0,
        vectorsStored: 0,
        avgProcessingTime: 0,
        successRate: 0
      },
      pipelineStatus: {
        queriesPerMinute: 0,
        avgResponseTime: 0,
        activeQueries: 0
      }
    };
    
    this.startTime = Date.now();
    this.updateInterval = null;
    this.isCollecting = false;
    
    // Counters for realistic data generation
    this.queryCount = 0;
    this.documentCount = 0;
    this.totalResponseTime = 0;
    this.successfulQueries = 0;
    this.successfulDocuments = 0;
  }

  /**
   * Start collecting application metrics
   */
  start() {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, 3000); // Update every 3 seconds
    
    // Collect initial metrics
    this.collectMetrics();
  }

  /**
   * Stop collecting application metrics
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isCollecting = false;
  }

  /**
   * Collect all application metrics
   */
  collectMetrics() {
    this.collectQueryMetrics();
    this.collectDocumentMetrics();
    this.updatePipelineStatus();
  }

  /**
   * Collect query processing metrics
   */
  collectQueryMetrics() {
    const now = Date.now();
    const timeSinceStart = (now - this.startTime) / 1000; // seconds
    
    // Simulate realistic query patterns
    const baseQueriesPerMinute = 35 + Math.random() * 20; // 35-55 queries/min
    const timeVariation = Math.sin(timeSinceStart / 30) * 10; // Cyclical variation
    const queriesPerMinute = Math.max(5, baseQueriesPerMinute + timeVariation);
    
    // Simulate response times based on system load
    const baseResponseTime = 1200 + Math.random() * 800; // 1.2-2.0 seconds
    const loadVariation = Math.random() * 1000; // Additional load variation
    const avgResponseTime = baseResponseTime + loadVariation;
    
    // Simulate active queries (0-15)
    const activeQueries = Math.floor(Math.random() * 16);
    
    // Simulate success rate (95-99.5%)
    const successRate = 95 + Math.random() * 4.5;
    
    // Simulate queue length (0-8)
    const queueLength = Math.floor(Math.random() * 9);
    
    this.metrics.queryProcessing = {
      queriesPerMinute: Math.round(queriesPerMinute),
      avgResponseTime: Math.round(avgResponseTime),
      activeQueries: activeQueries,
      successRate: Math.round(successRate * 10) / 10,
      queueLength: queueLength
    };
    
    // Update pipeline status
    this.metrics.pipelineStatus = {
      queriesPerMinute: Math.round(queriesPerMinute),
      avgResponseTime: Math.round(avgResponseTime),
      activeQueries: activeQueries
    };
  }

  /**
   * Collect document processing metrics
   */
  collectDocumentMetrics() {
    const now = Date.now();
    const timeSinceStart = (now - this.startTime) / 1000; // seconds
    
    // Simulate document processing patterns
    const baseDocumentsPerHour = 50 + Math.random() * 30; // 50-80 docs/hour
    const documentsProcessed = Math.floor((timeSinceStart / 3600) * baseDocumentsPerHour);
    
    // Simulate chunks generated (average 12 chunks per document)
    const avgChunksPerDoc = 10 + Math.random() * 4; // 10-14 chunks
    const chunksGenerated = Math.floor(documentsProcessed * avgChunksPerDoc);
    
    // Simulate embeddings generated (1 per chunk)
    const embeddingsGenerated = chunksGenerated;
    
    // Simulate vectors stored (same as embeddings)
    const vectorsStored = embeddingsGenerated;
    
    // Simulate processing time (0.8-2.0 seconds per document)
    const avgProcessingTime = 0.8 + Math.random() * 1.2;
    
    // Simulate success rate (97-99.8%)
    const successRate = 97 + Math.random() * 2.8;
    
    this.metrics.documentProcessing = {
      documentsProcessed: documentsProcessed,
      chunksGenerated: chunksGenerated,
      embeddingsGenerated: embeddingsGenerated,
      vectorsStored: vectorsStored,
      avgProcessingTime: Math.round(avgProcessingTime * 1000) / 1000,
      successRate: Math.round(successRate * 10) / 10
    };
  }

  /**
   * Update pipeline status
   */
  updatePipelineStatus() {
    // This is already updated in collectQueryMetrics()
    // but we can add additional pipeline-specific metrics here
  }

  /**
   * Simulate a query being processed
   */
  simulateQuery() {
    this.queryCount++;
    const startTime = performance.now();
    
    // Simulate processing time
    const processingTime = 800 + Math.random() * 2000; // 0.8-2.8 seconds
    
    setTimeout(() => {
      const actualTime = performance.now() - startTime;
      this.totalResponseTime += actualTime;
      
      // 95-99% success rate
      if (Math.random() < 0.97) {
        this.successfulQueries++;
      }
    }, processingTime);
  }

  /**
   * Simulate a document being processed
   */
  simulateDocument() {
    this.documentCount++;
    
    // Simulate processing time
    const processingTime = 1000 + Math.random() * 3000; // 1-4 seconds
    
    setTimeout(() => {
      // 97-99.5% success rate
      if (Math.random() < 0.98) {
        this.successfulDocuments++;
      }
    }, processingTime);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get detailed query metrics
   */
  getQueryMetrics() {
    return {
      ...this.metrics.queryProcessing,
      totalQueries: this.queryCount,
      successfulQueries: this.successfulQueries,
      avgResponseTime: this.queryCount > 0 ? this.totalResponseTime / this.queryCount : 0
    };
  }

  /**
   * Get detailed document metrics
   */
  getDocumentMetrics() {
    return {
      ...this.metrics.documentProcessing,
      totalDocuments: this.documentCount,
      successfulDocuments: this.successfulDocuments
    };
  }
}

// Create singleton instance
const applicationMetricsCollector = new ApplicationMetricsCollector();

export default applicationMetricsCollector;
