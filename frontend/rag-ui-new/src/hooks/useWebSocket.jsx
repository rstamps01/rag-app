import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced WebSocket Hook for Pipeline Monitoring
 * 
 * FIXES APPLIED:
 * - Better data transformation handling
 * - Enhanced error recovery
 * - Improved connection management
 * - Comprehensive debug logging
 * - Fallback data handling
 */
const useWebSocket = (url, options = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [pipelineState, setPipelineState] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    messagesReceived: 0,
    lastMessageTime: null,
    connectionAttempts: 0,
    errors: [],
    dataTransformations: 0,
    lastTransformTime: null
  });

  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { 
    reconnectInterval = 3000, 
    maxReconnectAttempts = 10,
    debug = false 
  } = options;

  // Enhanced data transformation function with comprehensive field mapping
  const transformWebSocketData = useCallback((rawData) => {
    if (!rawData || typeof rawData !== 'object') {
      console.warn('❌ Invalid WebSocket data received:', rawData);
      return null;
    }

    try {
      setDebugInfo(prev => ({
        ...prev,
        dataTransformations: prev.dataTransformations + 1,
        lastTransformTime: new Date().toISOString()
      }));

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

      // Enhanced system health transformation with multiple field name support
      const system_health = {
        cpu_percent: parseFloat(
          data.system_health?.cpu_percent || 
          data.system_health?.cpu_usage || 
          data.cpu_percent || 
          data.cpu_usage || 
          0
        ),
        memory_percent: parseFloat(
          data.system_health?.memory_percent || 
          data.system_health?.memory_usage || 
          data.memory_percent || 
          data.memory_usage || 
          0
        ),
        memory_available: 
          data.system_health?.memory_available || 
          data.memory_available || 
          '0GB'
      };

      // Enhanced GPU performance transformation with array/object handling
      let gpu_performance = [];
      const gpuData = data.gpu_performance || data.gpu || [];
      
      if (Array.isArray(gpuData)) {
        gpu_performance = gpuData.map(gpu => ({
          utilization: parseFloat(gpu.utilization || gpu.gpu_utilization || 0),
          memory_used: parseFloat(gpu.memory_used || 0),
          memory_total: parseFloat(gpu.memory_total || 32768), // Default RTX 5090
          temperature: parseFloat(gpu.temperature || gpu.temp || 0),
          name: gpu.name || 'RTX 5090'
        }));
      } else if (gpuData && typeof gpuData === 'object') {
        gpu_performance = [{
          utilization: parseFloat(gpuData.utilization || gpuData.gpu_utilization || 0),
          memory_used: parseFloat(gpuData.memory_used || 0),
          memory_total: parseFloat(gpuData.memory_total || 32768),
          temperature: parseFloat(gpuData.temperature || gpuData.temp || 0),
          name: gpuData.name || 'RTX 5090'
        }];
      }

      // Enhanced pipeline stats transformation with multiple field name support
      const pipeline_stats = {
        queries_per_minute: parseInt(
          data.pipeline_stats?.queries_per_minute || 
          data.pipeline_status?.queries_per_minute ||
          data.pipeline_stats?.queries_per_min || 
          data.pipeline_status?.queries_per_min ||
          data.queries_per_minute ||
          data.queries_per_min ||
          0
        ),
        avg_response_time: parseFloat(
          data.pipeline_stats?.avg_response_time || 
          data.pipeline_status?.avg_response_time ||
          data.avg_response_time ||
          0
        ),
        active_queries: parseInt(
          data.pipeline_stats?.active_queries || 
          data.pipeline_status?.active_queries ||
          data.active_queries ||
          0
        ),
        total_queries: parseInt(
          data.pipeline_stats?.total_queries || 
          data.pipeline_status?.total_queries ||
          data.total_queries ||
          0
        ),
        success_rate: parseFloat(
          data.pipeline_stats?.success_rate || 
          data.pipeline_status?.success_rate ||
          data.success_rate ||
          100.0
        )
      };

      // Enhanced connection status transformation
      const connection_status = {
        websocket_connections: parseInt(
          data.connection_status?.websocket_connections || 
          data.connection_status?.websocket || 
          data.websocket_connections ||
          data.websocket ||
          0
        ),
        backend_status: 
          data.connection_status?.backend_status || 
          data.connection_status?.backend || 
          data.backend_status ||
          data.backend ||
          'unknown',
        database_status: 
          data.connection_status?.database_status || 
          data.connection_status?.database || 
          data.database_status ||
          data.database ||
          'unknown',
        vector_db_status: 
          data.connection_status?.vector_db_status || 
          data.connection_status?.vector_db || 
          data.vector_db_status ||
          data.vector_db ||
          'unknown'
      };

      // Enhanced network stats transformation
      const network_stats = {
        bytes_sent: parseInt(data.network_stats?.bytes_sent || 0),
        bytes_recv: parseInt(data.network_stats?.bytes_recv || 0),
        packets_sent: parseInt(data.network_stats?.packets_sent || 0),
        packets_recv: parseInt(data.network_stats?.packets_recv || 0)
      };

      // Enhanced disk stats transformation
      const disk_stats = {
        disk_usage_percent: parseFloat(data.disk_stats?.disk_usage_percent || 0),
        disk_free_gb: parseFloat(data.disk_stats?.disk_free_gb || 0),
        disk_total_gb: parseFloat(data.disk_stats?.disk_total_gb || 0),
        disk_read_mb: parseFloat(data.disk_stats?.disk_read_mb || 0),
        disk_write_mb: parseFloat(data.disk_stats?.disk_write_mb || 0)
      };

      // Create comprehensive transformed data object
      const transformed = {
        system_health,
        gpu_performance,
        pipeline_stats,
        connection_status,
        network_stats,
        disk_stats,
        timestamp: data.timestamp || data.lastUpdate || new Date().toISOString(),
        lastUpdate: data.lastUpdate || data.timestamp || new Date().toISOString()
      };

      if (debug) {
        console.log('🔄 Enhanced data transformation:', {
          original: rawData,
          extracted: data,
          transformed: transformed
        });
      }

      return transformed;
    } catch (error) {
      console.error('❌ Error in enhanced data transformation:', error);
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-4), { 
          time: new Date().toISOString(), 
          error: `Transformation error: ${error.message}`,
          data: rawData
        }]
      }));
      return null;
    }
  }, [debug]);

  // Enhanced message handler with better error recovery
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
        console.log('📨 Enhanced WebSocket message received:', rawMessage);
      }

      // Handle different message types with enhanced processing
      if (rawMessage.type === 'metrics_update' || rawMessage.type === 'monitoring_update') {
        const transformedData = transformWebSocketData(rawMessage);
        if (transformedData) {
          setCurrentMetrics(transformedData);
          
          if (debug) {
            console.log('✅ Enhanced metrics updated:', transformedData);
          }
        }
      } else if (rawMessage.type === 'initial_state') {
        const transformedData = transformWebSocketData(rawMessage);
        if (transformedData) {
          setPipelineState(transformedData);
          setCurrentMetrics(transformedData);
          
          if (debug) {
            console.log('🏁 Enhanced initial state set:', transformedData);
          }
        }
      } else {
        // Handle messages without explicit type - try to transform anyway
        const transformedData = transformWebSocketData(rawMessage);
        if (transformedData) {
          setCurrentMetrics(transformedData);
          
          if (debug) {
            console.log('📊 Enhanced generic metrics update:', transformedData);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error parsing enhanced WebSocket message:', error);
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-4), { 
          time: new Date().toISOString(), 
          error: `Message parsing error: ${error.message}`,
          rawData: event.data
        }]
      }));
    }
  }, [transformWebSocketData, debug]);

  // Enhanced connection management with better error handling
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setDebugInfo(prev => ({
        ...prev,
        connectionAttempts: prev.connectionAttempts + 1
      }));

      if (debug) {
        console.log(`🔄 Enhanced WebSocket connection attempt #${debugInfo.connectionAttempts + 1} to ${url}`);
      }

      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('🔌 Enhanced WebSocket connected successfully');
        setConnectionStatus('Connected');
        
        // Reset connection attempts on successful connection
        setDebugInfo(prev => ({
          ...prev,
          connectionAttempts: 0
        }));
      };
      
      ws.current.onmessage = handleMessage;
      
      ws.current.onclose = (event) => {
        console.log('🔌 Enhanced WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        
        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        if (debugInfo.connectionAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Enhanced WebSocket attempting to reconnect...');
            connect();
          }, reconnectInterval);
        } else {
          console.error('❌ Enhanced WebSocket max reconnection attempts reached');
          setConnectionStatus('Error');
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('❌ Enhanced WebSocket error:', error);
        setConnectionStatus('Error');
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors.slice(-4), { 
            time: new Date().toISOString(), 
            error: 'Enhanced WebSocket connection error',
            details: error
          }]
        }));
      };
    } catch (error) {
      console.error('❌ Failed to create enhanced WebSocket connection:', error);
      setConnectionStatus('Error');
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-4), { 
          time: new Date().toISOString(), 
          error: `Connection creation error: ${error.message}`
        }]
      }));
    }
  }, [url, handleMessage, reconnectInterval, maxReconnectAttempts, debugInfo.connectionAttempts, debug]);

  // Initialize connection with cleanup
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

  // Enhanced return object with additional utilities
  return {
    connectionStatus,
    lastMessage,
    currentMetrics,
    pipelineState,
    debugInfo,
    reconnect: connect,
    isConnected: connectionStatus === 'Connected',
    hasError: connectionStatus === 'Error',
    isConnecting: connectionStatus === 'Connecting'
  };
};

export default useWebSocket;

