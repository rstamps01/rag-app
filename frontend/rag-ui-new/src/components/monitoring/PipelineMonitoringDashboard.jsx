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
//import useWebSocket from '../../hooks/useWebSocket.jsx.v7c';
import useWebSocket from '../../hooks/useWebSocket.jsx';
import PipelineGraph from '../../components/PipelineGraph';

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
          systemHealth: {
            cpuUsage: data.system_health?.cpu_usage || 0,
            memoryUsage: data.system_health?.memory_usage || 0,
          },
          gpuPerformance: data.gpu_performance ? [{
            utilization: data.gpu_performance.gpu_utilization || 0,
            memory_used: data.gpu_performance.gpu_memory_used_mib || data.gpu_performance.gpu_memory_used || 0,
            memory_total: data.gpu_performance.gpu_memory_total_mib || data.gpu_performance.gpu_memory_total || 0,
            temperature: data.gpu_performance.gpu_temperature || 0,
            power_draw: data.gpu_performance.gpu_power_draw_w || 0,
            power_limit: data.gpu_performance.gpu_power_limit_w || 0,
          }] : [],
          pipelineStatus: {
            queriesPerMinute: data.query_performance?.queries_per_minute || 0,
            avgResponseTime: data.query_performance?.average_response_time_ms || 0,
            activeQueries: data.query_performance?.active_queries || 0,
          },
          connectionStatus: {
            websocketConnections: 1, // We know we're connected
            backendStatus: data.connection_status?.backend || 'unknown',
            databaseStatus: data.connection_status?.database || 'unknown',
            vectorDbStatus: data.connection_status?.vector_db || 'unknown',
          }
        };
        console.log('✅ Setting transformed metrics:', transformed);
        // Update the transformed metrics state
        setTransformedMetrics(transformed);
      } else {
        // Silently ignore other message types (like pong which is handled above)
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
  // Build nodes and edges for document + query workflows
  const { stages, edges } = useMemo(() => {
    /* Define a unified list of stages.  Each stage has an id, label and
     * type indicating which workflow it belongs to (document or query).
     * Adjust or extend this list to reflect your actual pipeline.
     */
    const stageDefinitions = [
      { id: 'upload', label: 'Upload', type: 'document' },
      { id: 'chunk', label: 'Chunk', type: 'document' },
      { id: 'embed', label: 'Embed', type: 'document' },
      { id: 'upsert', label: 'Upsert', type: 'document' },
      { id: 'search', label: 'Search', type: 'query' },
      { id: 'generate', label: 'Generate', type: 'query' },
    ];
    // Determine status for each stage from pipelineState or metrics
    const getStatus = (id, idx) => {
      if (pipelineState && pipelineState.stages && pipelineState.stages[id]) {
        return pipelineState.stages[id].status || 'idle';
      }
      // Fallback: mark first stage of each workflow as processing when active
      if (transformedMetrics && transformedMetrics.pipelineStatus && transformedMetrics.pipelineStatus.activeQueries > 0) {
        if ((id === 'upload' || id === 'search')) return 'processing';
      }
      return 'idle';
    };
    // Build nodes with positions: document stages on the top row, query stages on the bottom
    const nodes = stageDefinitions.map((def, idx) => {
      const row = def.type === 'document' ? 0 : 1;
      const order = def.type === 'document' ? idx : idx - 4; // query stages start after the 4 doc stages
      return {
        id: def.id,
        label: def.label,
        status: getStatus(def.id, idx),
        position: { x: order * 180, y: row * 180 },
      };
    });
    // Define edges separately for each workflow
    const edgeList = [];
    const docIds = stageDefinitions.filter((s) => s.type === 'document').map((s) => s.id);
    const queryIds = stageDefinitions.filter((s) => s.type === 'query').map((s) => s.id);
    for (let i = 0; i < docIds.length - 1; i++) {
      edgeList.push({ id: `e-${docIds[i]}-${docIds[i + 1]}`, source: docIds[i], target: docIds[i + 1] });
    }
    for (let i = 0; i < queryIds.length - 1; i++) {
      edgeList.push({ id: `e-${queryIds[i]}-${queryIds[i + 1]}`, source: queryIds[i], target: queryIds[i + 1] });
    }
    return { stages: nodes, edges: edgeList };
  }, [pipelineState, transformedMetrics]);
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">RAG Pipeline Monitor</h1>
          <span className="text-blue-400 text-sm">Real‑time Monitoring</span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>System</span>
          <span>•</span>
          <span className={connectionStatus === 'Connected' ? 'text-green-400' : 'text-yellow-400'}>
            {connectionStatus} {transformedMetrics ? '(Data)' : '(No Data)'}
          </span>
          <span>•</span>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-3 py-1 bg-blue-600 rounded text-sm text-white hover:bg-blue-500"
          >
            Debug
          </button>
          <span>•</span>
          <span>{transformedMetrics ? transformedMetrics.pipelineStatus.queriesPerMinute : 0}/min</span>
          <span>•</span>
          <span>{transformedMetrics ? formatResponseTime(transformedMetrics.pipelineStatus.avgResponseTime) : '0ms'}</span>
          <span>•</span>
          <span>{transformedMetrics ? formatPercentage(transformedMetrics.systemHealth.cpuUsage) : '0% CPU'}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left column with metrics */}
        <div className="space-y-4 md:col-span-1">
          {/* System Health */}
          <div className="bg-gray-800 p-4 rounded shadow space-y-1">
            <h2 className="text-lg font-semibold text-white">System Health</h2>
            <div className="flex justify-between text-sm text-gray-300">
              <span>CPU Usage</span>
              <span>{transformedMetrics ? formatPercentage(transformedMetrics.systemHealth.cpuUsage) : '0%'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Memory</span>
              <span>{transformedMetrics ? formatPercentage(transformedMetrics.systemHealth.memoryUsage) : '0%'}</span>
            </div>
          </div>
          {/* GPU Performance */}
          <div className="bg-gray-800 p-4 rounded shadow space-y-1">
            <h2 className="text-lg font-semibold text-white">GPU Performance (RTX 5090)</h2>
            {transformedMetrics && transformedMetrics.gpuPerformance && transformedMetrics.gpuPerformance.length > 0 ? (
              <>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Utilization</span>
                  <span>{formatPercentage(transformedMetrics.gpuPerformance[0].utilization)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Memory</span>
                  <span>{formatMemory(transformedMetrics.gpuPerformance[0].memory_used, transformedMetrics.gpuPerformance[0].memory_total)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Temperature</span>
                  <span>{transformedMetrics.gpuPerformance[0].temperature}°C</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Power</span>
                  <span>{transformedMetrics.gpuPerformance[0].power_draw}W / {transformedMetrics.gpuPerformance[0].power_limit}W</span>
                </div>
              </>
            ) : (
              <p className="text-gray-400">No GPU data available</p>
            )}
          </div>
          {/* Query Performance */}
          <div className="bg-gray-800 p-4 rounded shadow space-y-1">
            <h2 className="text-lg font-semibold text-white">Query Performance</h2>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Queries/Min</span>
              <span>{transformedMetrics ? transformedMetrics.pipelineStatus.queriesPerMinute : 0}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Avg Response</span>
              <span>{transformedMetrics ? formatResponseTime(transformedMetrics.pipelineStatus.avgResponseTime) : '0ms'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Active Queries</span>
              <span>{transformedMetrics ? transformedMetrics.pipelineStatus.activeQueries : 0}</span>
            </div>
          </div>
          {/* Connection Status */}
          <div className="bg-gray-800 p-4 rounded shadow space-y-1">
            <h2 className="text-lg font-semibold text-white">Connection Status</h2>
            <div className="flex justify-between text-sm text-gray-300">
              <span>WebSocket</span>
              <span>{transformedMetrics ? `${transformedMetrics.connectionStatus.websocketConnections} clients` : '0 clients'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Backend</span>
              <span>{transformedMetrics ? transformedMetrics.connectionStatus.backendStatus : 'unknown'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Database</span>
              <span>{transformedMetrics ? transformedMetrics.connectionStatus.databaseStatus : 'unknown'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Vector DB</span>
              <span>{transformedMetrics ? transformedMetrics.connectionStatus.vectorDbStatus : 'unknown'}</span>
            </div>
          </div>
        </div>
        {/* Right column - main content */}
        <div className="md:col-span-3 bg-gray-900 p-4 rounded shadow relative overflow-x-auto">
          {connectionStatus === 'Connected' ? (
            <>
              {/* Interactive pipeline graph */}
              <div className="h-64 md:h-96">
                <PipelineGraph
                  stages={stages}
                  edges={edges}
                  onNodeClick={(stage) => {
                    // Extend this callback to open a detail panel
                    console.log('Clicked stage:', stage);
                  }}
                />
              </div>
              {/* Summary metrics at bottom */}
              {transformedMetrics && (
                <div className="mt-4 text-sm text-gray-400 space-x-4">
                  <span>CPU: {formatPercentage(transformedMetrics.systemHealth.cpuUsage)}</span>
                  <span>Memory: {formatPercentage(transformedMetrics.systemHealth.memoryUsage)}</span>
                  <span>Queries/Min: {transformedMetrics.pipelineStatus.queriesPerMinute}</span>
                  {lastUpdateTime && <span>Last update: {lastUpdateTime}</span>}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-300">
                {connectionStatus === 'Connecting' ? 'Connecting...' : 
                 connectionStatus === 'Connected' ? 'Connected' :
                 connectionStatus === 'Failed' ? 'Connection Failed' : 'Disconnected'}
              </h2>
              <p className="text-sm text-gray-400">
                {connectionStatus === 'Connecting'
                  ? `Attempting to connect to pipeline monitoring... (${debugInfo.connectionAttempts}/${debugInfo.connectionAttempts})`
                  : connectionStatus === 'Failed'
                  ? 'Max reconnection attempts reached. Click Reconnect to try again.'
                  : 'Pipeline monitoring connection lost'}
              </p>
              {connectionStatus !== 'Connecting' && (
                <button
                  onClick={reconnect}
                  className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500"
                >
                  {connectionStatus === 'Failed' ? 'Retry Connection' : 'Reconnect'}
                </button>
              )}
              {debugMode && (
                <div className="text-xs text-gray-500 mt-2">
                  <p>Attempts: {debugInfo.connectionAttempts}</p>
                  <p>Messages: {debugInfo.messagesReceived}</p>
                  <p>Errors: {debugInfo.errors.length}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Debug panel */}
      {debugMode && (
        <div className="bg-gray-800 p-4 rounded shadow text-sm text-gray-200 space-y-2">
          <h3 className="text-lg font-semibold text-white">Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-400">Connection Status</h4>
              <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify({ 
                connectionStatus, 
                lastUpdateTime,
                hasTransformedMetrics: !!transformedMetrics,
                hasRawMetrics: !!metrics,
                hasLastMessage: !!lastMessage
              }, null, 2)}</pre>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400">Pipeline State</h4>
              <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify({ 
                stagesCount: stages?.length || 0,
                edgesCount: edges?.length || 0,
                pipelineState: pipelineState || 'null'
              }, null, 2)}</pre>
            </div>
          </div>
          {transformedMetrics && (
            <div>
              <h4 className="font-semibold text-green-400">Transformed Metrics</h4>
              <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(transformedMetrics, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PipelineMonitoringDashboard;