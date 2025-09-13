/**
 * Qdrant API Service
 * Real-time vector point access and collection management
 * Integrates with Qdrant's REST API for live data visualization
 */

class QdrantService {
  constructor(baseUrl = 'http://localhost:8000', apiKey = null) {
    // Use backend proxy instead of direct Qdrant access
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
    };
  }

  /**
   * Get collection information and statistics
   */
  async getCollectionInfo(collectionName = 'rag') {
    try {
      const response = await fetch(`${this.baseUrl}/api/qdrant/collections/${collectionName}/info`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collection info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching collection info:', error);
      throw error;
    }
  }

  /**
   * Get real-time collection statistics
   */
  async getCollectionStats(collectionName = 'rag') {
    try {
      const response = await fetch(`${this.baseUrl}/api/qdrant/collections/${collectionName}/stats`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collection stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching collection stats:', error);
      throw error;
    }
  }

  /**
   * Scroll through vectors with real-time updates
   * This is the primary method for getting vector points for visualization
   */
  async scrollVectors(collectionName = 'rag', options = {}) {
    const {
      limit = 100,
      offset = null,
      with_payload = true,
      with_vector = false,
      filter = null,
      order_by = null
    } = options;

    const scrollRequest = {
      limit,
      with_payload,
      with_vector,
      ...(offset && { offset }),
      ...(filter && { filter }),
      ...(order_by && { order_by })
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/qdrant/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(scrollRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to scroll vectors: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        points: data.result.points || [],
        next_page_offset: data.result.next_page_offset,
        total: data.result.points?.length || 0
      };
    } catch (error) {
      console.error('Error scrolling vectors:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors (for query visualization)
   */
  async searchVectors(collectionName = 'rag', queryVector, options = {}) {
    const {
      limit = 10,
      score_threshold = null,
      with_payload = true,
      with_vector = false,
      filter = null
    } = options;

    const searchRequest = {
      vector: queryVector,
      limit,
      with_payload,
      with_vector,
      ...(score_threshold && { score_threshold }),
      ...(filter && { filter })
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/qdrant/collections/${collectionName}/points/search`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(searchRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to search vectors: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Error searching vectors:', error);
      throw error;
    }
  }

  /**
   * Get specific vector points by IDs
   */
  async getVectorsById(collectionName = 'rag', pointIds, options = {}) {
    const {
      with_payload = true,
      with_vector = false
    } = options;

    const requestBody = {
      ids: Array.isArray(pointIds) ? pointIds : [pointIds],
      with_payload,
      with_vector
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/qdrant/collections/${collectionName}/points`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vectors by ID: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Error fetching vectors by ID:', error);
      throw error;
    }
  }

  /**
   * Get collection clustering information for visualization
   */
  async getClusterInfo(collectionName = 'rag') {
    try {
      // Get a sample of points for clustering visualization
      const scrollResult = await this.scrollVectors(collectionName, {
        limit: 1000,
        with_payload: true,
        with_vector: true
      });

      // Simple clustering based on vector similarity
      const clusters = this.performSimpleClustering(scrollResult.points);
      
      return {
        clusters,
        totalPoints: scrollResult.points.length,
        clusterCount: clusters.length
      };
    } catch (error) {
      console.error('Error getting cluster info:', error);
      throw error;
    }
  }

  /**
   * Simple clustering algorithm for visualization
   * In production, you might want to use more sophisticated clustering
   */
  performSimpleClustering(points, clusterCount = 5) {
    if (!points || points.length === 0) return [];

    // For visualization purposes, we'll create mock clusters based on payload data
    const clusters = {};
    
    points.forEach((point, index) => {
      const department = point.payload?.department || 'General';
      if (!clusters[department]) {
        clusters[department] = {
          id: department,
          name: department,
          points: [],
          center: { x: 0, y: 0 },
          color: this.getDepartmentColor(department)
        };
      }
      clusters[department].points.push({
        id: point.id,
        x: Math.random() * 800, // Mock coordinates for visualization
        y: Math.random() * 400,
        payload: point.payload,
        vector: point.vector
      });
    });

    return Object.values(clusters);
  }

  /**
   * Get color for department visualization
   */
  getDepartmentColor(department) {
    const colors = {
      'Engineering': '#00D4AA',
      'Marketing': '#0066CC', 
      'Sales': '#FF6B35',
      'Support': '#8B5CF6',
      'General': '#6C757D'
    };
    return colors[department] || '#6C757D';
  }

  /**
   * Stream real-time vector updates using WebSocket-like polling
   */
  async streamVectorUpdates(collectionName = 'rag', callback, options = {}) {
    const {
      interval = 5000,
      limit = 100,
      filter = null
    } = options;

    let lastOffset = null;
    let isStreaming = true;

    const stream = async () => {
      try {
        const result = await this.scrollVectors(collectionName, {
          limit,
          offset: lastOffset,
          filter,
          with_payload: true
        });

        if (result.points.length > 0) {
          callback({
            type: 'vector_update',
            points: result.points,
            offset: result.next_page_offset,
            timestamp: new Date().toISOString()
          });
          lastOffset = result.next_page_offset;
        }

        // Get collection stats for real-time metrics
        const stats = await this.getCollectionStats(collectionName);
        callback({
          type: 'stats_update',
          stats,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        callback({
          type: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      if (isStreaming) {
        setTimeout(stream, interval);
      }
    };

    // Start streaming
    stream();

    // Return stop function
    return () => {
      isStreaming = false;
    };
  }

  /**
   * Get real-time query performance metrics
   */
  async getQueryMetrics(collectionName = 'rag') {
    try {
      const [stats, info] = await Promise.all([
        this.getCollectionStats(collectionName),
        this.getCollectionInfo(collectionName)
      ]);

      return {
        totalVectors: stats.result?.points_count || 0,
        indexedVectors: stats.result?.indexed_vectors_count || 0,
        diskUsage: stats.result?.disk_usage_bytes || 0,
        memoryUsage: stats.result?.memory_usage_bytes || 0,
        status: info.result?.status || 'unknown',
        optimizerStatus: info.result?.optimizer_status || {},
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching query metrics:', error);
      throw error;
    }
  }

  /**
   * Health check for Qdrant connection
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/qdrant/health`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const qdrantService = new QdrantService();

export default qdrantService;
export { QdrantService };
