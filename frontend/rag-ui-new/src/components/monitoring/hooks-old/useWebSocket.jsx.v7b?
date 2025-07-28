import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [lastMessage, setLastMessage] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [pipelineState, setPipelineState] = useState(null);
  
  const ws = useRef(null);
  const reconnectTimeoutId = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;

  const connect = useCallback(() => {
    try {
      console.log('🔌 Attempting WebSocket connection to:', url);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setConnectionStatus('Connected');
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          console.log('📨 Raw WebSocket message received:', event.data);
          const message = JSON.parse(event.data);
          console.log('📋 Parsed WebSocket message:', message);
          
          setLastMessage(message);
          setMessageHistory(prev => [...prev.slice(-49), message]);

          // Handle different message types
          if (message.type === 'initial_state') {
            console.log('🚀 Processing initial_state message');
            setPipelineState(message.data);
            console.log('📊 Pipeline state updated:', message.data);
          } 
          else if (message.type === 'metrics_update') {
            console.log('📊 Processing metrics_update message');
            console.log('🔄 Metrics data received:', message.data);
            
            // Transform and set metrics data
            const transformedMetrics = transformMetricsData(message.data);
            console.log('✅ Transformed metrics:', transformedMetrics);
            setMetrics(transformedMetrics);
          }
          else if (message.type === 'monitoring_update') {
            console.log('📊 Processing monitoring_update message (legacy)');
            const transformedMetrics = transformMetricsData(message.data);
            console.log('✅ Transformed monitoring metrics:', transformedMetrics);
            setMetrics(transformedMetrics);
          }
          else {
            console.log('⚠️ Unknown message type:', message.type);
            // Try to process as metrics anyway
            if (message.data) {
              const transformedMetrics = transformMetricsData(message.data);
              setMetrics(transformedMetrics);
            }
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          console.error('📄 Raw message data:', event.data);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts}`);
          reconnectTimeoutId.current = setTimeout(connect, reconnectInterval);
        } else {
          console.log('❌ Max reconnection attempts reached');
          setConnectionStatus('Failed');
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('Error');
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      setConnectionStatus('Error');
    }
  }, [url, maxReconnectAttempts, reconnectInterval]);

  const transformMetricsData = (data) => {
    console.log('🔄 Transforming metrics data:', data);
    
    try {
      // Handle both direct data and nested data structures
      const metricsData = data.metrics || data;
      
      const transformed = {
        systemHealth: {
          cpuUsage: metricsData.system_health?.cpu_percent || metricsData.system_health?.cpu_usage || 0,
          memoryUsage: metricsData.system_health?.memory_percent || metricsData.system_health?.memory_usage || 0,
          memoryAvailable: metricsData.system_health?.memory_available || '0GB'
        },
        gpuPerformance: Array.isArray(metricsData.gpu_performance) 
          ? metricsData.gpu_performance 
          : metricsData.gpu_performance 
            ? [metricsData.gpu_performance]
            : [{
                utilization: 0,
                memory_used: 0,
                memory_total: 0,
                temperature: 0
              }],
        pipelineStatus: {
          queriesPerMinute: metricsData.pipeline_status?.queries_per_minute || metricsData.query_performance?.queries_per_min || 0,
          avgResponseTime: metricsData.pipeline_status?.avg_response_time || metricsData.query_performance?.avg_response_time || 0,
          activeQueries: metricsData.pipeline_status?.active_queries || metricsData.query_performance?.active_queries || 0
        },
        connectionStatus: {
          websocketConnections: metricsData.connection_status?.websocket_connections || metricsData.connection_status?.websocket || 0,
          backendStatus: metricsData.connection_status?.backend_status || metricsData.connection_status?.backend || 'unknown',
          databaseStatus: metricsData.connection_status?.database_status || metricsData.connection_status?.database || 'unknown',
          vectorDbStatus: metricsData.connection_status?.vector_db_status || metricsData.connection_status?.vector_db || 'unknown'
        },
        lastUpdate: metricsData.lastUpdate || metricsData.timestamp || new Date().toISOString()
      };
      
      console.log('✅ Data transformation successful:', transformed);
      return transformed;
    } catch (error) {
      console.error('❌ Error transforming metrics data:', error);
      return {
        systemHealth: { cpuUsage: 0, memoryUsage: 0, memoryAvailable: '0GB' },
        gpuPerformance: [{ utilization: 0, memory_used: 0, memory_total: 0, temperature: 0 }],
        pipelineStatus: { queriesPerMinute: 0, avgResponseTime: 0, activeQueries: 0 },
        connectionStatus: { websocketConnections: 0, backendStatus: 'unknown', databaseStatus: 'unknown', vectorDbStatus: 'unknown' },
        lastUpdate: new Date().toISOString()
      };
    }
  };

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      console.log('📤 Sent WebSocket message:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }
    if (ws.current) {
      ws.current.close();
    }
    setConnectionStatus('Disconnected');
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    lastMessage,
    messageHistory,
    metrics,
    pipelineState,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};

export default useWebSocket;