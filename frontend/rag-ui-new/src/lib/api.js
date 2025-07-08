// File Path: /home/ubuntu/rag-app/frontend/rag-ui-new/src/lib/api.js
import axios from 'axios';

// --- Configuration --- 
const API_BASE_URL = 'http://localhost:8000'; 

// --- Axios Instance --- 
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  }
}) ;

// --- API Endpoints --- 
export const endpoints = {
  // Document Management (Updated with /v1/)
  documents: '/api/v1/documents', // GET for list, POST for upload
  
  // Query Interface (Updated with /v1/)
  query: '/api/v1/queries/ask', // POST for asking a question
  
  // Monitoring Dashboard (No /v1/ prefix based on main.py)
  monitoring: {
    pipelines: '/api/monitoring/pipelines', 
    pipeline: (id) => `/api/monitoring/pipelines/${id}`, 
    stats: '/api/monitoring/stats' 
  },

  // Auth endpoints (Assuming they also use /v1/ based on main.py)
  auth: {
      login: '/api/v1/auth/login',
      register: '/api/v1/auth/register',
      me: '/api/v1/auth/me'
  },

  // System/Admin endpoints (Assuming /v1/)
  admin: '/api/v1/admin',
  system: '/api/v1/system',

  // Health check (No /v1/ prefix)
  health: '/health'
};

// --- Interceptors (Optional) --- 
// Add interceptors if needed for auth tokens or error handling

export default api;
