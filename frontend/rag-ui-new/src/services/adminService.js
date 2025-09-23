/**
 * Admin Service for Bulk Operations and Cleanup
 * Provides API calls for administrative functions
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class AdminService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/v1/admin`;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Admin API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Health check
  async getHealth() {
    return this.makeRequest('/health');
  }

  // Query cleanup operations
  async cleanupTestQueries(daysOld = 7, pattern = 'test', dryRun = true) {
    const params = new URLSearchParams({
      days_old: daysOld.toString(),
      pattern,
      dry_run: dryRun.toString(),
    });
    
    return this.makeRequest(`/cleanup/test-queries?${params}`, {
      method: 'POST',
    });
  }

  async cleanupOldQueries(daysOld = 30, dryRun = true) {
    const params = new URLSearchParams({
      days_old: daysOld.toString(),
      dry_run: dryRun.toString(),
    });
    
    return this.makeRequest(`/cleanup/old-queries?${params}`, {
      method: 'POST',
    });
  }

  // Bulk document operations
  async bulkDeleteDocuments(documentIds, dryRun = true) {
    const params = new URLSearchParams({
      dry_run: dryRun.toString(),
    });
    
    return this.makeRequest(`/documents/bulk?${params}`, {
      method: 'DELETE',
      body: JSON.stringify(documentIds),
    });
  }

  // Orphan detection and cleanup
  async detectOrphans() {
    return this.makeRequest('/orphans/detect');
  }

  async cleanupOrphans(cleanupFiles = true, cleanupVectors = true, dryRun = true) {
    const params = new URLSearchParams({
      cleanup_files: cleanupFiles.toString(),
      cleanup_vectors: cleanupVectors.toString(),
      dry_run: dryRun.toString(),
    });
    
    return this.makeRequest(`/orphans/cleanup?${params}`, {
      method: 'POST',
    });
  }

  // Statistics
  async getStats() {
    return this.makeRequest('/stats/overview');
  }
}

// Create and export singleton instance
const adminService = new AdminService();
export default adminService;
