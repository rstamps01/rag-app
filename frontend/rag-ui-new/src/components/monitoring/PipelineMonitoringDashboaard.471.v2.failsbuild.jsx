import React, { useState, useEffect } from 'react';
import { Card, Badge, Progress } from '../ui/index.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Activity, Cpu, HardDrive, Network, Zap, Database, Globe, Clock, TrendingUp, Server } from 'lucide-react';
import useWebSocket from '../../hooks/useWebSocket.jsx';

const EnhancedPipelineMonitoringDashboard = () => {
  // Enhanced state management with comprehensive metrics
  const [localMetrics, setLocalMetrics] = useState({
    system_health: { 
      cpu_percent: 0, 
      memory_percent: 0, 
      memory_available: '0GB' 
    },
    gpu_performance: [{
      utilization: 0,
      memory_used: 0,
      memory_total: 32768, // RTX 5090 32GB
      temperature: 0,
      name: 'RTX 5090'
    }],
    pipeline_stats: { 
      queries_per_minute: 0, 
      avg_response_time: 0, 
      active_queries: 0,
      total_queries: 0,
      success_rate: 100.0
    },
    connection_status: { 
      websocket_connections: 0, 
      backend_status: 'unknown', 
      database_status: 'unknown', 
      vector_db_status: 'unknown' 
    },
    network_stats: {
      bytes_sent: 0,
      bytes_recv: 0,
      packets_sent: 0,
      packets_recv: 0
    },
    disk_stats: {
      disk_usage_percent: 0,
      disk_free_gb: 0,
      disk_total_gb: 0,
      disk_read_mb: 0,
      disk_write_mb: 0
    },
    lastUpdate: null
  });

  const [metricsHistory, setMetricsHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [debugMode, setDebugMode] = useState(false);

  // Enhanced WebSocket connection with better error handling
  const { 
    connectionStatus: wsStatus, 
    lastMessage, 
    error: wsError 
  } = useWebSocket('ws://localhost:8000/api/v1/ws/pipeline-monitoring', {
    onOpen: () => {
      console.log('🔌 Enhanced WebSocket connected');
      setConnectionStatus('connected');
    },
    onClose: () => {
      console.log('🔌 Enhanced WebSocket disconnected');
      setConnectionStatus('disconnected');
    },
    onError: (error) => {
      console.error('❌ Enhanced WebSocket error:', error);
      setConnectionStatus('error');
    }
  });

  // Enhanced data processing with comprehensive metrics handling
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        console.log('📊 Enhanced WebSocket data received:', data);

        if (data.type === 'metrics_update' && data.data) {
          const newMetrics = {
            system_health: data.data.system_health || localMetrics.system_health,
            gpu_performance: Array.isArray(data.data.gpu_performance) 
              ? data.data.gpu_performance 
              : [data.data.gpu_performance || localMetrics.gpu_performance[0]],
            pipeline_stats: data.data.pipeline_stats || localMetrics.pipeline_stats,
            connection_status: data.data.connection_status || localMetrics.connection_status,
            network_stats: data.data.network_stats || localMetrics.network_stats,
            disk_stats: data.data.disk_stats || localMetrics.disk_stats,
            lastUpdate: data.data.lastUpdate || new Date().toISOString()
          };

          setLocalMetrics(newMetrics);
          
          // Add to history for charts (keep last 20 points)
          setMetricsHistory(prev => {
            const newHistory = [...prev, {
              timestamp: Date.now(),
              cpu: newMetrics.system_health.cpu_percent,
              memory: newMetrics.system_health.memory_percent,
              gpu: newMetrics.gpu_performance[0]?.utilization || 0,
              queries: newMetrics.pipeline_stats.queries_per_minute,
              response_time: newMetrics.pipeline_stats.avg_response_time
            }];
            return newHistory.slice(-20); // Keep only last 20 points
          });

          console.log('✅ Enhanced metrics updated:', newMetrics);
        } else if (data.type === 'initial_state' && data.data) {
          // Handle initial state
          const initialMetrics = {
            system_health: data.data.system_health || localMetrics.system_health,
            gpu_performance: Array.isArray(data.data.gpu_performance) 
              ? data.data.gpu_performance 
              : [data.data.gpu_performance || localMetrics.gpu_performance[0]],
            pipeline_stats: data.data.pipeline_stats || localMetrics.pipeline_stats,
            connection_status: data.data.connection_status || localMetrics.connection_status,
            network_stats: data.data.network_stats || localMetrics.network_stats,
            disk_stats: data.data.disk_stats || localMetrics.disk_stats,
            lastUpdate: data.data.lastUpdate || new Date().toISOString()
          };

          setLocalMetrics(initialMetrics);
          console.log('🚀 Enhanced initial state loaded:', initialMetrics);
        }
      } catch (error) {
        console.error('❌ Error parsing enhanced WebSocket data:', error);
      }
    }
  }, [lastMessage]);

  // Helper functions for status indicators
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'unknown': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'connected': 'success',
      'disconnected': 'error',
      'unknown': 'warning',
      'active': 'info'
    };
    return variants[status] || 'default';
  };

  // Format bytes to human readable
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with Connection Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Pipeline Monitoring</h1>
          <p className="text-gray-600">Real-time RAG application performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={getStatusBadge(connectionStatus)}>
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(connectionStatus)}`}></div>
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </Badge>
          <button 
            onClick={() => setDebugMode(!debugMode)}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            {debugMode ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      </div>

      {/* Debug Information */}
      {debugMode && (
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Activity className="mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold">Debug Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>WebSocket Status:</strong> {wsStatus}
              <br />
              <strong>Last Update:</strong> {localMetrics.lastUpdate || 'Never'}
              <br />
              <strong>History Points:</strong> {metricsHistory.length}
            </div>
            <div>
              <strong>Raw Data:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(localMetrics, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Usage */}
        <Card className="p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">CPU Usage</h3>
            <Cpu className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{localMetrics.system_health.cpu_percent}%</div>
          <Progress value={localMetrics.system_health.cpu_percent} className="mt-2" />
        </Card>

        {/* Memory Usage */}
        <Card className="p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Memory Usage</h3>
            <HardDrive className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{localMetrics.system_health.memory_percent}%</div>
          <p className="text-xs text-gray-500">{localMetrics.system_health.memory_available} available</p>
          <Progress value={localMetrics.system_health.memory_percent} className="mt-2" />
        </Card>

        {/* GPU Usage */}
        <Card className="p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">GPU Usage</h3>
            <Zap className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{localMetrics.gpu_performance[0]?.utilization || 0}%</div>
          <p className="text-xs text-gray-500">
            {localMetrics.gpu_performance[0]?.name || 'RTX 5090'} - {localMetrics.gpu_performance[0]?.temperature || 0}°C
          </p>
          <Progress value={localMetrics.gpu_performance[0]?.utilization || 0} className="mt-2" />
        </Card>

        {/* Active Queries */}
        <Card className="p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Queries</h3>
            <Activity className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{localMetrics.pipeline_stats.active_queries}</div>
          <p className="text-xs text-gray-500">
            {localMetrics.pipeline_stats.queries_per_minute}/min
          </p>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">System Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU" strokeWidth={2} />
              <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory" strokeWidth={2} />
              <Line type="monotone" dataKey="gpu" stroke="#ffc658" name="GPU" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Query Performance Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                formatter={(value, name) => [
                  name === 'queries' ? `${value}/min` : `${value}ms`, 
                  name === 'queries' ? 'Queries per Minute' : 'Response Time'
                ]}
              />
              <Area type="monotone" dataKey="queries" stackId="1" stroke="#8884d8" fill="#8884d8" name="queries" />
              <Area type="monotone" dataKey="response_time" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="response_time" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPU Details */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Zap className="mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold">GPU Details</h3>
          </div>
          <div className="space-y-4">
            {localMetrics.gpu_performance.map((gpu, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{gpu.name}</span>
                  <span className="text-sm text-gray-600">{gpu.utilization}%</span>
                </div>
                <Progress value={gpu.utilization} />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Memory:</span>
                    <div>{formatBytes(gpu.memory_used * 1024 * 1024)} / {formatBytes(gpu.memory_total * 1024 * 1024)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Temperature:</span>
                    <div>{gpu.temperature}°C</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Network Statistics */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Network className="mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold">Network Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Bytes Sent</div>
                <div className="text-lg font-semibold">{formatBytes(localMetrics.network_stats.bytes_sent)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Bytes Received</div>
                <div className="text-lg font-semibold">{formatBytes(localMetrics.network_stats.bytes_recv)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Packets Sent</div>
                <div className="text-lg font-semibold">{formatNumber(localMetrics.network_stats.packets_sent)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Packets Received</div>
                <div className="text-lg font-semibold">{formatNumber(localMetrics.network_stats.packets_recv)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Disk Statistics */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <HardDrive className="mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold">Disk Statistics</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Disk Usage</span>
                <span>{localMetrics.disk_stats.disk_usage_percent}%</span>
              </div>
              <Progress value={localMetrics.disk_stats.disk_usage_percent} className="mt-1" />
              <div className="text-xs text-gray-600 mt-1">
                {localMetrics.disk_stats.disk_free_gb}GB free of {localMetrics.disk_stats.disk_total_gb}GB
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Read:</span>
                <div>{localMetrics.disk_stats.disk_read_mb} MB</div>
              </div>
              <div>
                <span className="text-gray-600">Write:</span>
                <div>{localMetrics.disk_stats.disk_write_mb} MB</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Performance */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <TrendingUp className="mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold">Query Performance</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Queries per Minute</div>
              <div className="text-3xl font-bold">{localMetrics.pipeline_stats.queries_per_minute}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Avg Response Time</div>
              <div className="text-3xl font-bold">{localMetrics.pipeline_stats.avg_response_time}ms</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Total Queries</div>
              <div className="text-3xl font-bold">{formatNumber(localMetrics.pipeline_stats.total_queries)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-3xl font-bold">{localMetrics.pipeline_stats.success_rate}%</div>
            </div>
          </div>
        </Card>

        {/* Connection Status */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Server className="mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold">Service Status</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>WebSocket Connections</span>
              <Badge variant="info">
                {localMetrics.connection_status.websocket_connections}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Backend Service</span>
              <Badge variant={getStatusBadge(localMetrics.connection_status.backend_status)}>
                {localMetrics.connection_status.backend_status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Database</span>
              <Badge variant={getStatusBadge(localMetrics.connection_status.database_status)}>
                {localMetrics.connection_status.database_status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Vector Database</span>
              <Badge variant={getStatusBadge(localMetrics.connection_status.vector_db_status)}>
                {localMetrics.connection_status.vector_db_status}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Last Update Timestamp */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {localMetrics.lastUpdate ? new Date(localMetrics.lastUpdate).toLocaleString() : 'Never'}
      </div>
    </div>
  );
};

export default EnhancedPipelineMonitoringDashboard;

