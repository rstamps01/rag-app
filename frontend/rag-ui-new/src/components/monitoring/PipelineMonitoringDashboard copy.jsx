import React, { useState, useEffect } from 'react';
import useWebSocket from '../../hooks/useWebSocket.jsx.v7c'; // Adjust the import path as necessary

const PipelineMonitoringDashboard = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [localMetrics, setLocalMetrics] = useState({
    system_health: { cpu_percent: 0, memory_percent: 0, memory_available: '0GB' },
    gpu_performance: [],
    pipeline_status: { queries_per_minute: 0, avg_response_time: 0, active_queries: 0 },
    connection_status: { websocket_connections: 0, backend_status: 'unknown', database_status: 'unknown', vector_db_status: 'unknown' }
  });

  const { 
    connectionStatus, 
    lastMessage, 
    currentMetrics, 
    pipelineState, 
    debugInfo 
  } = useWebSocket('ws://localhost:8000/api/v1/ws/pipeline-monitoring', { 
    debug: debugMode 
  });

  // Update local metrics when WebSocket data changes
  useEffect(() => {
    if (currentMetrics) {
      setLocalMetrics(currentMetrics);
      console.log('📊 Local metrics updated:', currentMetrics);
    }
  }, [currentMetrics]);

  // Format percentage values
  const formatPercentage = (value) => {
    const num = parseFloat(value) || 0;
    return `${num.toFixed(1)}%`;
  };

  // Format memory values
  const formatMemory = (used, total) => {
    if (!used || !total) return 'N/A';
    return `${used}MB / ${total}MB`;
  };

  // Get connection status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'connected': return 'text-green-400';
      case 'unknown': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">RAG Pipeline Monitor</h1>
          <span className="text-blue-400">Real-time Monitoring</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">System</span>
          <span className="text-yellow-400">Unknown</span>
          <div className={`flex items-center space-x-2 ${connectionStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <span>{connectionStatus}</span>
          </div>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Debug
          </button>
          <div className="text-right text-sm text-gray-400">
            <div>{formatPercentage(localMetrics.system_health.cpu_percent)} CPU</div>
            <div>{formatPercentage(localMetrics.system_health.memory_percent)} Memory</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Metrics */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-green-400">{formatPercentage(localMetrics.system_health.cpu_percent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Memory</span>
                <span className="text-blue-400">{formatPercentage(localMetrics.system_health.memory_percent)}</span>
              </div>
            </div>
          </div>

          {/* GPU Performance */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">GPU Performance (RTX 5090)</h3>
            {localMetrics.gpu_performance && localMetrics.gpu_performance.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Utilization</span>
                  <span className="text-green-400">{formatPercentage(localMetrics.gpu_performance[0].utilization)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory</span>
                  <span className="text-blue-400">
                    {formatMemory(localMetrics.gpu_performance[0].memory_used, localMetrics.gpu_performance[0].memory_total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Temperature</span>
                  <span className="text-yellow-400">{localMetrics.gpu_performance[0].temperature}°C</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No GPU data available</div>
            )}
          </div>

          {/* Query Performance */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Queries/Min</span>
                <span className="text-purple-400">{localMetrics.pipeline_status.queries_per_minute}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Response</span>
                <span className="text-blue-400">{localMetrics.pipeline_status.avg_response_time}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Queries</span>
                <span className="text-green-400">{localMetrics.pipeline_status.active_queries}</span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Connection Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">WebSocket</span>
                <span className="text-green-400">{localMetrics.connection_status.websocket_connections} clients</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Backend</span>
                <span className={getStatusColor(localMetrics.connection_status.backend_status)}>
                  {localMetrics.connection_status.backend_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Database</span>
                <span className={getStatusColor(localMetrics.connection_status.database_status)}>
                  {localMetrics.connection_status.database_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vector DB</span>
                <span className={getStatusColor(localMetrics.connection_status.vector_db_status)}>
                  {localMetrics.connection_status.vector_db_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Pipeline Status */}
          <div className="bg-gray-800 rounded-lg p-8 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">Pipeline Active</h2>
              <p className="text-gray-400 mb-4">Real-time monitoring active</p>
              <div className="text-sm text-gray-500">
                <div>CPU: {formatPercentage(localMetrics.system_health.cpu_percent)}</div>
                <div>Memory: {formatPercentage(localMetrics.system_health.memory_percent)}</div>
                <div>Queries/Min: {localMetrics.pipeline_status.queries_per_minute}</div>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          {debugMode && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Connection Status:</h4>
                  <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify({
                      connectionStatus,
                      lastUpdateTime: debugInfo.lastMessageTime
                    }, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Current Metrics:</h4>
                  <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(localMetrics, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Last Message:</h4>
                  <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(lastMessage, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Pipeline State:</h4>
                  <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(pipelineState, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Debug Stats:</h4>
                <div className="text-sm text-gray-400">
                  <div>Messages Received: {debugInfo.messagesReceived}</div>
                  <div>Connection Attempts: {debugInfo.connectionAttempts}</div>
                  <div>Last Message: {debugInfo.lastMessageTime}</div>
                  <div>Errors: {debugInfo.errors.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineMonitoringDashboard;

