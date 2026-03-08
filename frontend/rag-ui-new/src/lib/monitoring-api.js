// Monitoring API functions
import api from './api';
import { API_URL } from '../config';

export const monitoringAPI = {
  // Pipeline Journey
  getDocumentJourney: (documentId) => 
    api.get(`/api/monitoring/documents/${documentId}/journey`),
  
  // Health Data
  getSystemHealth: () => 
    api.get('/api/monitoring/health'),
  
  getComponentHealth: () => 
    api.get('/api/monitoring/health/components'),
  
  // Predictions
  getHealthPredictions: () => 
    api.get('/api/monitoring/predictions'),
  
  // Real-time Data
  subscribeToRealTimeData: (callback) => {
    const ws = new WebSocket(`${API_URL.replace('http', 'ws')}/ws/monitoring`);
    ws.onmessage = (event) => callback(JSON.parse(event.data));
    return ws;
  }
};