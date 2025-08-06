import React, { useState, useEffect } from 'react';
import useWebSocket from '../../hooks/useWebSocket.jsx.v7c';

const PipelineMonitoringDashboard = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // WebSocket connection
  const {
    connectionStatus,
    lastMessage,
    messageHistory,
    metrics,
    pipelineState,
    reconnect
  } = useWebSocket('ws://localhost:8000/api/v1/ws/pipeline-monitoring');

  // Update last update time when metrics change
  useEffect(() => {
    if (metrics) {
      setLastUpdateTime(new Date().toLocaleTimeString());
      console.log('📊 Dashboard received new metrics:', metrics);
    }
  }, [metrics]);

  // Log connection status changes
  useEffect(() => {
    console.log('🔌 Connection status changed:', connectionStatus);
  }, [connectionStatus]);

  const formatPercentage = (value) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)}%`;
    }
    return '0%';
  };

  const formatMemory = (used, total) => {
    if (typeof used === 'number' && typeof total === 'number') {
      return `${used}MB / ${total}MB`;
    }
    return 'N/A';
  };

  const formatResponseTime = (time) => {
    if (typeof time === 'number') {
      return `${time}ms`;
    }
    if (typeof time === 'string' && time.includes('ms')) {
      return time;
    }
    return '0ms';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'Connected':
        return 'text-green-400';
      case 'disconnected':
      case 'Disconnected':
        return 'text-red-400';
      case 'unknown':
      default:
        return 'text-yellow-400';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected':
        return 'text-green-400';
      case 'Connecting':
        return 'text-yellow-400';
      case 'Disconnected':
      case 'Error':
      case 'Failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
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
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">System</span>
            <span className="text-gray-400">Unknown</span>
          </div>
          <div className={`flex items-center space-x-2 ${getConnectionStatusColor()}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <span>{connectionStatus}</span>
          </div>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-3 py-1 bg-blue-600 rounded text-sm"
          >
            Debug
          </button>
          <div className="text-right text-sm text-gray-400">
            <div>0/min</div>
            <div>0ms</div>
            <div>0% CPU</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Metrics */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-green-400">
                  {metrics ? formatPercentage(metrics.systemHealth.cpuUsage) : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Memory</span>
                <span className="text-blue-400">
                  {metrics ? formatPercentage(metrics.systemHealth.memoryUsage) : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* GPU Performance */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">GPU Performance (RTX 5090)</h3>
            {metrics && metrics.gpuPerformance && metrics.gpuPerformance.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Utilization</span>
                  <span className="text-green-400">
                    {formatPercentage(metrics.gpuPerformance[0].utilization)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory</span>
                  <span className="text-blue-400">
                    {formatMemory(metrics.gpuPerformance[0].memory_used, metrics.gpuPerformance[0].memory_total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Temperature</span>
                  <span className="text-yellow-400">
                    {metrics.gpuPerformance[0].temperature}°C
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No GPU data available</div>
            )}
          </div>

          {/* Query Performance */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Queries/Min</span>
                <span className="text-green-400">
                  {metrics ? metrics.pipelineStatus.queriesPerMinute : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Response</span>
                <span className="text-blue-400">
                  {metrics ? formatResponseTime(metrics.pipelineStatus.avgResponseTime) : '0ms'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Queries</span>
                <span className="text-yellow-400">
                  {metrics ? metrics.pipelineStatus.activeQueries : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Connection Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">WebSocket</span>
                <span className="text-green-400">
                  {metrics ? `${metrics.connectionStatus.websocketConnections} clients` : '0 clients'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Backend</span>
                <span className={metrics ? getStatusColor(metrics.connectionStatus.backendStatus) : 'text-gray-400'}>
                  {metrics ? metrics.connectionStatus.backendStatus : 'unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Database</span>
                <span className={metrics ? getStatusColor(metrics.connectionStatus.databaseStatus) : 'text-gray-400'}>
                  {metrics ? metrics.connectionStatus.databaseStatus : 'unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vector DB</span>
                <span className={metrics ? getStatusColor(metrics.connectionStatus.vectorDbStatus) : 'text-gray-400'}>
                  {metrics ? metrics.connectionStatus.vectorDbStatus : 'unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-lg p-8 h-full flex flex-col items-center justify-center">
            {connectionStatus === 'Connected' ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">Pipeline Active</h2>
                <p className="text-gray-400 mb-4">Real-time monitoring active</p>
                {metrics && (
                  <div className="space-y-2 text-sm">
                    <div>CPU: {formatPercentage(metrics.systemHealth.cpuUsage)}</div>
                    <div>Memory: {formatPercentage(metrics.systemHealth.memoryUsage)}</div>
                    <div>Queries/Min: {metrics.pipelineStatus.queriesPerMinute}</div>
                    {lastUpdateTime && (
                      <div className="text-xs text-gray-500">Last update: {lastUpdateTime}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-red-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">
                  {connectionStatus === 'Connecting' ? 'Connecting...' : 'Disconnected'}
                </h2>
                <p className="text-gray-400 mb-4">
                  {connectionStatus === 'Connecting' 
                    ? 'Attempting to connect to pipeline monitoring...' 
                    : 'Pipeline monitoring connection lost'}
                </p>
                {connectionStatus !== 'Connecting' && (
                  <button
                    onClick={reconnect}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold mb-2">Connection Status:</h4>
              <pre className="bg-gray-900 p-2 rounded overflow-auto">
                {JSON.stringify({ connectionStatus, lastUpdateTime }, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Current Metrics:</h4>
              <pre className="bg-gray-900 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(metrics, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Last Message:</h4>
              <pre className="bg-gray-900 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(lastMessage, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Pipeline State:</h4>
              <pre className="bg-gray-900 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(pipelineState, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineMonitoringDashboard;