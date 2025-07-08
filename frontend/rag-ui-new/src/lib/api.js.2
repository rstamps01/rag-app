// File Path: /home/vastdata/rag-app/frontend/rag-ui-new/src/lib/api.js
import axios from 'axios';

// --- Configuration --- 
// Ensure this points to your backend container's exposed port
const API_BASE_URL = 'http://localhost:8000'; 

// --- Axios Instance --- 
// Create an Axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Optional: Set a timeout (e.g., 30 seconds) 
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers if needed, e.g., for authentication
  }
});

// --- API Endpoints --- 
// Define the specific API paths used by the application
export const endpoints = {
  // Document Management
  documents: '/api/documents', // GET for list, POST for upload
  
  // Query Interface
  query: '/api/queries/ask', // POST for asking a question
  
  // Monitoring Dashboard
  monitoring: {
    pipelines: '/api/monitoring/pipelines', // GET list of pipeline runs
    pipeline: (id) => `/api/monitoring/pipelines/${id}`, // GET specific pipeline run details
    stats: '/api/monitoring/stats' // GET monitoring statistics
  },

  // Add other endpoints if needed (e.g., auth)
};

// --- Interceptors (Optional) --- 
// You can add interceptors for handling requests/responses globally
// Example: Add authorization token to requests
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('authToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// Example: Handle global errors
// api.interceptors.response.use(
//   response => response,
//   error => {
//     console.error("API Error:", error.response || error.message);
//     // Handle specific error codes (e.g., 401 Unauthorized)
//     return Promise.reject(error);
//   }
// );

export default api;
