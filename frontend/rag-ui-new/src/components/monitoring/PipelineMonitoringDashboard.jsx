/*
 * v1.0.0.0
 * Location: frontend/rag-ui-new/src/components/monitoring/PipelineMonitoringDashboard.jsx
 *
 * This enhanced pipeline monitoring dashboard integrates a two‑row
 * React Flow graph showing both the document processing and query
 * workflows of your RAG application.  Nodes are laid out manually for
 * clarity, and the panel displays live system and pipeline metrics
 * received via WebSocket.  Clicking on a node logs its information
 * (extend this to open a side panel with details).  Use this as a
 * starting point and customise stage names/positions to reflect your
 * actual pipeline.
 */

import React, { useState, useEffect, useMemo } from 'react';
import useWebSocket from '../../hooks/useWebSocket.jsx';
import DynamicPipelineVisualization from '../DynamicPipelineVisualization';
import SimplePipelineTest from '../SimplePipelineTest';

const PipelineMonitoringDashboard = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [transformedMetrics, setTransformedMetrics] = useState(null);
  
  // WebSocket connection to backend
  const {
    connectionStatus,
    isConnected,
    lastMessage,
    messageHistory,
    metrics,
    pipelineState,
    reconnect,
    debugInfo,
  } = useWebSocket('ws://10.0.0.48:8000/api/v1/ws/pipeline-monitoring', {
    onMessage: (message) => {
      console.log('🔌 Dashboard received message:', message);
      
      // Handle pong messages as valid connection indicators
      if (message.type === 'pong') {
        console.log('🏓 Received pong - connection is alive');
        setLastUpdateTime(new Date().toISOString());
        return;
      }
      
      // Transform backend data structure to frontend expected format
      if (message.type === 'metrics_update' && message.data) {
        console.log('📊 Processing metrics_update in dashboard');
        const data = message.data;
        const transformed = {
          system_health: {
            cpu_percent: data.system_health?.cpu_usage || data.system_health?.cpu_percent || 0,
            memory_percent: data.system_health?.memory_usage || data.system_health?.memory_percent || 0,
            memory_available: data.system_health?.memory_available || 'N/A'
          },
          gpu_performance: data.gpu_performance ? [{
            utilization: data.gpu_performance.gpu_utilization || 0,
            memory_used: data.gpu_performance.gpu_memory_used_mib || data.gpu_performance.gpu_memory_used || 0,
            memory_total: data.gpu_performance.gpu_memory_total_mib || data.gpu_performance.gpu_memory_total || 0,
            temperature: data.gpu_performance.gpu_temperature || 0,
            power_draw: data.gpu_performance.gpu_power_draw_w || 0,
            power_limit: data.gpu_performance.gpu_power_limit_w || 0,
          }] : [],
          pipeline_status: {
            queries_per_minute: data.query_performance?.queries_per_minute || 0,
            avg_response_time: data.query_performance?.average_response_time_ms || 0,
            active_queries: data.query_performance?.active_queries || 0,
          },
          connection_status: {
            websocket_connections: 1, // We know we're connected
            backend_status: data.connection_status?.backend || 'unknown',
            database_status: data.connection_status?.database || 'unknown',
            vector_db_status: data.connection_status?.vector_db || 'unknown',
          }
        };
        console.log('✅ Setting transformed metrics:', transformed);
        setTransformedMetrics(transformed);
      } else {
        console.log('📝 Dashboard received message type:', message.type);
      }
    }
  });

  // Update timestamp when metrics arrive
  useEffect(() => {
    if (transformedMetrics) {
      setLastUpdateTime(new Date().toLocaleTimeString());
    }
  }, [transformedMetrics]);

  // Formatters
  const formatPercentage = (value) => (typeof value === 'number' ? `${value.toFixed(1)}%` : '0%');
  const formatMemory = (used, total) => (typeof used === 'number' && typeof total === 'number' ? `${used}MB / ${total}MB` : 'N/A');
  const formatResponseTime = (time) => {
    if (typeof time === 'number') return `${time}ms`;
    if (typeof time === 'string' && time.includes('ms')) return time;
    return '0ms';
  };
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">RAG Pipeline Monitor</h1>
          <p className="text-blue-400 text-sm">Dynamic Real-time Monitoring</p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className={`flex items-center gap-2 ${connectionStatus === 'Connected' ? 'text-green-400' : 'text-yellow-400'}`}>
            <span className={`w-3 h-3 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
            {connectionStatus} {transformedMetrics ? '(Live Data)' : '(No Data)'}
          </div>
          
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-3 py-1 bg-blue-600 rounded text-sm text-white hover:bg-blue-500"
          >
            {debugMode ? 'Hide Debug' : 'Debug'}
          </button>
          
          {transformedMetrics && (
            <div className="flex items-center space-x-4 text-gray-400">
              <span>{transformedMetrics.pipeline_status.queries_per_minute}/min</span>
              <span>{formatResponseTime(transformedMetrics.pipeline_status.avg_response_time)}</span>
              <span>{formatPercentage(transformedMetrics.system_health.cpu_percent)}</span>
              {lastUpdateTime && <span>Last: {lastUpdateTime}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Main Dynamic Pipeline Visualization */}
      <div className="h-[calc(100vh-80px)]">
        {connectionStatus === 'Connected' ? (
          <div className="w-full h-full bg-gray-900">
            <SimplePipelineTest />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-6xl">🔌</div>
            <h2 className="text-2xl font-semibold text-gray-300">
              {connectionStatus === 'Connecting' ? 'Connecting...' : 
               connectionStatus === 'Failed' ? 'Connection Failed' : 'Disconnected'}
            </h2>
            <p className="text-gray-400 max-w-md">
              {connectionStatus === 'Connecting'
                ? `Attempting to connect to pipeline monitoring... (${debugInfo.connectionAttempts}/${debugInfo.maxConnectionAttempts || 5})`
                : connectionStatus === 'Failed'
                ? 'Max reconnection attempts reached. Click Reconnect to try again.'
                : 'Pipeline monitoring connection lost. Click Reconnect to restore connection.'}
            </p>
            {connectionStatus !== 'Connecting' && (
              <button
                onClick={reconnect}
                className="px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors"
              >
                {connectionStatus === 'Failed' ? 'Retry Connection' : 'Reconnect'}
              </button>
            )}
            {debugMode && (
              <div className="text-xs text-gray-500 mt-4 p-4 bg-gray-800 rounded-lg">
                <p>Attempts: {debugInfo.connectionAttempts}</p>
                <p>Messages: {debugInfo.messagesReceived}</p>
                <p>Errors: {debugInfo.errors.length}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 max-h-64 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-400 mb-2">Connection Status</h4>
                <pre className="whitespace-pre-wrap break-words text-xs text-gray-300">
                  {JSON.stringify({ 
                    connectionStatus, 
                    lastUpdateTime,
                    hasTransformedMetrics: !!transformedMetrics,
                    hasRawMetrics: !!metrics,
                    hasLastMessage: !!lastMessage
                  }, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-green-400 mb-2">Pipeline State</h4>
                <pre className="whitespace-pre-wrap break-words text-xs text-gray-300">
                  {JSON.stringify({ 
                    pipelineState: pipelineState || 'null',
                    hasPipelineState: !!pipelineState
                  }, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-400 mb-2">Transformed Metrics</h4>
                <pre className="whitespace-pre-wrap break-words text-xs text-gray-300">
                  {transformedMetrics ? JSON.stringify(transformedMetrics, null, 2) : 'No metrics available'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineMonitoringDashboard;