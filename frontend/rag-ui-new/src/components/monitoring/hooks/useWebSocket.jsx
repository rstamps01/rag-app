import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [pipelineState, setPipelineState] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    messagesReceived: 0,
    lastMessageTime: null,
    connectionAttempts: 0,
    errors: []
  });

  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { 
    reconnectInterval = 3000, 
    maxReconnectAttempts = 10,
    debug = false 
  } = options;

  // Enhanced data transformation function - Fixed to handle backend field variations
  const transformWebSocketData = useCallback((rawData) => {
    if (!rawData || typeof rawData !== 'object') {
      console.warn('Invalid WebSocket data received:', rawData);
      return null;
    }

    try {
      // Handle different message formats
      let data = rawData;
      
      // If data is wrapped in a 'data' property, extract it
      if (rawData.data && typeof rawData.data === 'object') {
        data = rawData.data;
      }

      // If data is wrapped in a 'metrics' property, extract it
      if (rawData.metrics && typeof rawData.metrics === 'object') {
        data = rawData.metrics;
      }

      // Transform the data to match frontend expectations
      const transformed = {
        system_health: {
          // Handle both backend field names: cpu_usage and cpu_percent
          cpu_percent: parseFloat(data.system_health?.cpu_percent || data.system_health?.cpu_usage || 0),
          // Handle both backend field names: memory_usage and memory_percent
          memory_percent: parseFloat(data.system_health?.memory_percent || data.system_health?.memory_usage || 0),
          // Calculate memory_available if not provided
          memory_available: data.system_health?.memory_available || '0GB'
        },
        
        gpu_performance: (() => {
          // Backend sends GPU data as single object, convert to array format
          if (data.gpu_performance && typeof data.gpu_performance === 'object') {
            // Check if it's already an array
            if (Array.isArray(data.gpu_performance)) {
              return data.gpu_performance.map(gpu => ({
                utilization: parseFloat(gpu.utilization || gpu.gpu_utilization || 0),
                memory_used: parseFloat(gpu.memory_used || gpu.gpu_memory_used || 0),
                memory_total: parseFloat(gpu.memory_total || gpu.gpu_memory_total || 0),
                temperature: parseFloat(gpu.temperature || gpu.gpu_temperature || 0)
              }));
            } else {
              // Convert single object to array format
              return [{
                utilization: parseFloat(data.gpu_performance.utilization || data.gpu_performance.gpu_utilization || 0),
                memory_used: parseFloat(data.gpu_performance.memory_used || data.gpu_performance.gpu_memory_used || 0),
                memory_total: parseFloat(data.gpu_performance.memory_total || data.gpu_performance.gpu_memory_total || 0),
                temperature: parseFloat(data.gpu_performance.temperature || data.gpu_performance.gpu_temperature || 0)
              }];
            }
          }
          return [];
        })(),
        
        pipeline_status: {
          // Handle both section names: pipeline_status and query_performance
          queries_per_minute: parseInt(
            data.pipeline_status?.queries_per_minute || 
            data.query_performance?.queries_per_minute || 
            data.pipeline_status?.queries_per_min || 
            data.query_performance?.queries_per_min || 
            0
          ),
          // Handle different field names for response time
          avg_response_time: parseFloat(
            data.pipeline_status?.avg_response_time || 
            data.query_performance?.avg_response_time || 
            data.pipeline_status?.average_response_time_ms || 
            data.query_performance?.average_response_time_ms || 
            0
          ),
          active_queries: parseInt(
            data.pipeline_status?.active_queries || 
            data.query_performance?.active_queries || 
            0
          )
        },
        
        connection_status: {
          // Handle different field naming conventions
          websocket_connections: parseInt(
            data.connection_status?.websocket_connections || 
            data.connection_status?.websocket || 
            0
          ),
          backend_status: data.connection_status?.backend_status || 
                         data.connection_status?.backend || 
                         'unknown',
          database_status: data.connection_status?.database_status || 
                          data.connection_status?.database || 
                          'unknown',
          vector_db_status: data.connection_status?.vector_db_status || 
                           data.connection_status?.vector_db || 
                           'unknown'
        },
        timestamp: data.timestamp || data.lastUpdate || new Date().toISOString()
      };

      if (debug) {
        console.log('🔄 Transformed WebSocket data:', {
          original: rawData,
          transformed: transformed
        });
      }

      return transformed;
    } catch (error) {
      console.error('❌ Error transforming WebSocket data:', error);
      return null;
    }
  }, [debug]);

  // Enhanced message handler
  const handleMessage = useCallback((event) => {
    try {
      const rawMessage = JSON.parse(event.data);
      
      setDebugInfo(prev => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
        lastMessageTime: new Date().toISOString()
      }));

      setLastMessage(rawMessage);

      if (debug) {
        console.log('📨 Raw WebSocket message received:', rawMessage);
      }

      // Handle different message types
      if (rawMessage.type === 'metrics_update' || rawMessage.type === 'monitoring_update') {
        const transformedData = transformWebSocketData(rawMessage);
        if (transformedData) {
          setCurrentMetrics(transformedData);
          
          if (debug) {
            console.log('✅ Metrics updated:', transformedData);
          }
        }
      } else if (rawMessage.type === 'initial_state') {
        const transformedData = transformWebSocketData(rawMessage);
        if (transformedData) {
          setPipelineState(transformedData);
          setCurrentMetrics(transformedData);
          
          if (debug) {
            console.log('🏁 Initial state set:', transformedData);
          }
        }
      } else {
        // Handle messages without explicit type
        const transformedData = transformWebSocketData(rawMessage);
        if (transformedData) {
          setCurrentMetrics(transformedData);
          
          if (debug) {
            console.log('📊 Generic metrics update:', transformedData);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-4), { 
          time: new Date().toISOString(), 
          error: error.message 
        }]
      }));
    }
  }, [transformWebSocketData, debug]);

  // Connection management
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setDebugInfo(prev => ({
        ...prev,
        connectionAttempts: prev.connectionAttempts + 1
      }));

      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setConnectionStatus('Connected');
      };
      
      ws.current.onmessage = handleMessage;
      
      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        
        // Attempt to reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (debugInfo.connectionAttempts < maxReconnectAttempts) {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }
        }, reconnectInterval);
      };
      
      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('Error');
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors.slice(-4), { 
            time: new Date().toISOString(), 
            error: 'WebSocket connection error' 
          }]
        }));
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionStatus('Error');
    }
  }, [url, handleMessage, reconnectInterval, maxReconnectAttempts, debugInfo.connectionAttempts]);

  // Initialize connection
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    connectionStatus,
    lastMessage,
    currentMetrics,
    pipelineState,
    debugInfo,
    reconnect: connect
  };
};

export default useWebSocket;
