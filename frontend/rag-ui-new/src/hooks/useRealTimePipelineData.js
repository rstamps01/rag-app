/**
 * React Hook for Real-time Pipeline Data
 * 
 * This hook provides real-time pipeline metrics to React components
 * by connecting to the WebSocket service and managing state updates.
 */

import { useState, useEffect, useCallback } from 'react';
import realTimePipelineService from '../services/realTimePipelineService';

export const useRealTimePipelineData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);

  // Initialize connection and data
  useEffect(() => {
    let cleanup;

    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to connect to WebSocket
        realTimePipelineService.connect();

        // Add listener for updates
        cleanup = realTimePipelineService.addListener((event, data) => {
          switch (event) {
            case 'connected':
              setIsConnected(true);
              setIsLoading(false);
              setError(null);
              break;

            case 'disconnected':
              setIsConnected(false);
              break;

            case 'error':
              setError(data);
              setIsLoading(false);
              break;

            case 'data':
              if (data) {
                setSystemMetrics(data);
                // Generate pipeline data based on system metrics
                const generatedData = realTimePipelineService.generatePipelineData();
                setPipelineData(generatedData);
              }
              break;

            default:
              break;
          }
        });

        // Get initial data
        const initialMetrics = realTimePipelineService.getMetrics();
        console.log('🔧 Initial metrics from service:', initialMetrics);
        if (initialMetrics) {
          setSystemMetrics(initialMetrics);
          const initialPipelineData = realTimePipelineService.generatePipelineData();
          console.log('🔧 Initial pipeline data generated:', initialPipelineData);
          setPipelineData(initialPipelineData);
        }

        // Set a timeout to stop loading if WebSocket doesn't connect
        const timeout = setTimeout(() => {
          if (!realTimePipelineService.isConnected) {
            console.warn('⚠️ WebSocket connection timeout, using fallback data');
            setIsLoading(false);
            setIsConnected(false);
            setError('WebSocket connection timeout - using demo data');
            
            // Generate fallback data
            const fallbackData = realTimePipelineService.generatePipelineData();
            setPipelineData(fallbackData);
          }
        }, 3000); // 3 second timeout

        return () => clearTimeout(timeout);

      } catch (err) {
        console.error('❌ Error initializing real-time service:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (realTimePipelineService.isConnected) {
      const currentMetrics = realTimePipelineService.getMetrics();
      if (currentMetrics) {
        setSystemMetrics(currentMetrics);
        const newPipelineData = realTimePipelineService.generatePipelineData();
        setPipelineData(newPipelineData);
      }
    }
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    realTimePipelineService.disconnect();
    realTimePipelineService.connect();
  }, []);

  return {
    // Connection status
    isConnected,
    isLoading,
    error,
    
    // Data
    pipelineData,
    systemMetrics,
    
    // Actions
    refresh,
    reconnect
  };
};

export default useRealTimePipelineData;
