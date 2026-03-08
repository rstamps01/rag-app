// ✅ CORRECTED API Configuration - Fixes endpoint and caching issues
// File Path: frontend/rag-ui-new/src/lib/api.js

import axios from 'axios';
import { API_URL } from '../config';

const API_BASE_URL = import.meta.env.MODE === 'production'
  ? ''
  : API_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for long-running operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ CORRECTED: API endpoints based on actual backend routes
const endpoints = {
  // Document endpoints - based on actual backend routes
  documents: '/api/v1/documents',
  documentById: (id) => `/api/v1/documents/${id}`,
  
  // ✅ CORRECTED: Query endpoints - based on actual backend routes  
  queries: {
    ask: '/api/v1/queries/ask',           // ← Correct endpoint from backend
    history: '/api/v1/queries/history'    // ← Correct endpoint from backend
  },
  
  // ✅ CORRECTED: Monitoring endpoints - based on actual backend routes
  monitoring: {
    pipelines: '/api/v1/monitoring/pipelines',
    pipelineById: (id) => `/api/v1/monitoring/pipelines/${id}`,
    stats: '/api/v1/monitoring/stats',
    health: '/api/v1/monitoring/health'
  },
  
  // System endpoints
  system: {
    health: '/health',                    // ← Correct endpoint from backend
    root: '/'                            // ← Root endpoint from backend
  }
};

// ✅ IMPROVED: Enhanced error formatting based on backend error responses
const formatApiError = (error) => {
  // Handle network errors
  if (error.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection and ensure the server is running.';
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. The server is taking too long to respond.';
  }
  
  // Handle HTTP status errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return data?.detail || 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Forbidden. You do not have permission to perform this action.';
      case 404:
        return data?.detail || 'Resource not found.';
      case 413:
        return 'File too large. Please upload a smaller file (max 100MB).';
      case 422:
        // ✅ Handle FastAPI validation errors specifically
        if (data?.detail && Array.isArray(data.detail)) {
          const validationErrors = data.detail.map(err => 
            `${err.loc?.join('.')} - ${err.msg}`
          ).join(', ');
          return `Validation error: ${validationErrors}`;
        }
        return data?.detail || 'Validation error. Please check your input format.';
      case 500:
        return data?.detail || 'Internal server error. Please check the server logs.';
      case 502:
        return 'Bad gateway. The server is not responding properly.';
      case 503:
        return 'Service unavailable. The server is temporarily down.';
      default:
        return data?.detail || `HTTP ${status}: ${error.response.statusText}`;
    }
  }
  
  // Handle other errors
  return error.message || 'An unexpected error occurred.';
};

// ✅ IMPROVED: Request interceptor with cache busting for development
api.interceptors.request.use(
  (config) => {
    // ✅ FIX: Add cache busting for GET requests in development to prevent 304 responses
    if (import.meta.env.MODE === 'development' && config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now() // Add timestamp to prevent caching
      };
    }
    
    // Log API requests in development
    if (import.meta.env.MODE === 'development') {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data && config.method !== 'get') {
        console.log('📤 Request Data:', config.data);
      }
    }
    
    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ IMPROVED: Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    // Log API responses in development
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
      console.log('📥 Response Data:', response.data);
    }
    
    return response;
  },
  (error) => {
    // Log API errors
    const errorMessage = formatApiError(error);
    console.error('❌ API Error:', errorMessage);
    
    // Log detailed error information in development
    if (import.meta.env.MODE === 'development') {
      console.error('🔍 Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // Handle authentication errors globally
    if (error.response?.status === 401) {
      // Clear stored auth token
      localStorage.removeItem('auth_token');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ✅ CORRECTED: Helper functions for specific API calls
const apiHelpers = {
  // Document operations
  async getDocuments(skip = 0, limit = 10) {
    const response = await api.get(`${endpoints.documents}?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(endpoints.documents, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteDocument(documentId) {
    const response = await api.delete(endpoints.documentById(documentId));
    return response.data;
  },

  // Query operations
  async submitQuery(query, department = 'General') {
    const response = await api.post(endpoints.queries.ask, {
      query: query.trim(),  // ← Correct property name from backend schema
      department: department || 'General'  // ← Correct property name from backend schema
    });
    return response.data;
  },

  async getQueryHistory(limit = 10) {
    const response = await api.get(`${endpoints.queries.history}?limit=${limit}`);
    return response.data;
  },

  // Monitoring operations
  async getMonitoringPipelines() {
    const response = await api.get(endpoints.monitoring.pipelines);
    return response.data;
  },

  async getMonitoringStats() {
    const response = await api.get(endpoints.monitoring.stats);
    return response.data;
  },

  async getMonitoringHealth() {
    const response = await api.get(endpoints.monitoring.health);
    return response.data;
  },

  // System operations
  async getSystemHealth() {
    const response = await api.get(endpoints.system.health);
    return response.data;
  }
};

// Export everything
export { 
  api as default, 
  api, 
  endpoints, 
  formatApiError,
  apiHelpers
};
