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
  const [metrics, setMetrics] = useState(null);
  // WebSocket connection to backend
  const {
    connectionStatus,
    lastMessage,
    messageHistory,
    metrics,
    pipelineState,
    reconnect,
  } = useWebSocket('ws://10.0.0.48:8000/api/v1/ws/pipeline-monitoring', {
    onMessage: (message) => {
      // Transform backend data structure to frontend expected format
      if (message.type === 'metrics_update' && message.data) {
        const data = message.data;
        const transformedMetrics = {
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
        // Update the metrics state
        setMetrics(transformedMetrics);
      }
    }
  });
  // Update timestamp when metrics arrive
  useEffect(() => {
    if (metrics) {
      setLastUpdateTime(new Date().toLocaleTimeString());
    }
  }, [metrics]);
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
      if (metrics && metrics.pipelineStatus && metrics.pipelineStatus.activeQueries > 0) {
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
  }, [pipelineState, metrics]);
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
            {connectionStatus}
          </span>
          <span>•</span>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-3 py-1 bg-blue-600 rounded text-sm text-white hover:bg-blue-500"
          >
            Debug
          </button>
          <span>•</span>
          <span>{metrics ? metrics.pipelineStatus.queriesPerMinute : 0}/min</span>
          <span>•</span>
          <span>{metrics ? formatResponseTime(metrics.pipelineStatus.avgResponseTime) : '0ms'}</span>
          <span>•</span>
          <span>{metrics ? formatPercentage(metrics.systemHealth.cpuUsage) : '0% CPU'}</span>
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
              <span>{metrics ? formatPercentage(metrics.systemHealth.cpuUsage) : '0%'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Memory</span>
              <span>{metrics ? formatPercentage(metrics.systemHealth.memoryUsage) : '0%'}</span>
            </div>
          </div>
          {/* GPU Performance */}
          <div className="bg-gray-800 p-4 rounded shadow space-y-1">
            <h2 className="text-lg font-semibold text-white">GPU Performance (RTX 5090)</h2>
            {metrics && metrics.gpuPerformance && metrics.gpuPerformance.length > 0 ? (
              <>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Utilization</span>
                  <span>{formatPercentage(metrics.gpuPerformance[0].utilization)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Memory</span>
                  <span>{formatMemory(metrics.gpuPerformance[0].memory_used, metrics.gpuPerformance[0].memory_total)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Temperature</span>
                  <span>{metrics.gpuPerformance[0].temperature}°C</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Power</span>
                  <span>{metrics.gpuPerformance[0].power_draw}W / {metrics.gpuPerformance[0].power_limit}W</span>
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
              <span>{metrics ? metrics.pipelineStatus.queriesPerMinute : 0}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Avg Response</span>
              <span>{metrics ? formatResponseTime(metrics.pipelineStatus.avgResponseTime) : '0ms'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Active Queries</span>
              <span>{metrics ? metrics.pipelineStatus.activeQueries : 0}</span>
            </div>
          </div>
          {/* Connection Status */}
          <div className="bg-gray-800 p-4 rounded shadow space-y-1">
            <h2 className="text-lg font-semibold text-white">Connection Status</h2>
            <div className="flex justify-between text-sm text-gray-300">
              <span>WebSocket</span>
              <span>{metrics ? `${metrics.connectionStatus.websocketConnections} clients` : '0 clients'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Backend</span>
              <span>{metrics ? metrics.connectionStatus.backendStatus : 'unknown'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Database</span>
              <span>{metrics ? metrics.connectionStatus.databaseStatus : 'unknown'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Vector DB</span>
              <span>{metrics ? metrics.connectionStatus.vectorDbStatus : 'unknown'}</span>
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
              {metrics && (
                <div className="mt-4 text-sm text-gray-400 space-x-4">
                  <span>CPU: {formatPercentage(metrics.systemHealth.cpuUsage)}</span>
                  <span>Memory: {formatPercentage(metrics.systemHealth.memoryUsage)}</span>
                  <span>Queries/Min: {metrics.pipelineStatus.queriesPerMinute}</span>
                  {lastUpdateTime && <span>Last update: {lastUpdateTime}</span>}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-300">
                {connectionStatus === 'Connecting' ? 'Connecting...' : 'Disconnected'}
              </h2>
              <p className="text-sm text-gray-400">
                {connectionStatus === 'Connecting'
                  ? 'Attempting to connect to pipeline monitoring...'
                  : 'Pipeline monitoring connection lost'}
              </p>
              {connectionStatus !== 'Connecting' && (
                <button
                  onClick={reconnect}
                  className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500"
                >
                  Reconnect
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Debug panel */}
      {debugMode && (
        <div className="bg-gray-800 p-4 rounded shadow text-sm text-gray-200 space-y-2">
          <h3 className="text-lg font-semibold text-white">Debug Information</h3>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify({ connectionStatus, lastUpdateTime }, null, 2)}</pre>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(metrics, null, 2)}</pre>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(lastMessage, null, 2)}</pre>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(pipelineState, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PipelineMonitoringDashboard;