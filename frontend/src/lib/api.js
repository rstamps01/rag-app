// API Configuration for RAG Application
// Handles browser-based API calls correctly

const getApiUrl = () => {
  // For React apps, API calls are made from the browser
  // Browser needs to use localhost, not container names
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  console.log('Using API URL:', apiUrl);
  return apiUrl;
};

export const API_BASE_URL = getApiUrl();
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

// API endpoints
export const API_ENDPOINTS = {
  queries: {
    ask: `${API_V1_URL}/queries/ask`,
    history: `${API_V1_URL}/queries/history`
  },
  documents: {
    list: `${API_V1_URL}/documents/`,
    upload: `${API_V1_URL}/documents/upload`
  },
  health: `${API_BASE_URL}/health`,
  docs: `${API_BASE_URL}/docs`,
  status: `${API_V1_URL}/status`
};

// Default fetch configuration
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...apiConfig,
    ...options,
    headers: {
      ...apiConfig.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    console.log('API Call:', url, config);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default {
  API_BASE_URL,
  API_V1_URL,
  API_ENDPOINTS,
  apiConfig,
  apiCall
};
