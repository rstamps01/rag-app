import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, AlertCircle, CheckCircle, RefreshCw, TrendingUp, Database, Cpu } from 'lucide-react';
import { apiHelpers } from '../../lib/api';

const MonitoringDashboard = () => {
  const [pipelines, setPipelines] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ✅ CORRECTED: Fetch monitoring data using proper API helpers
  const fetchMonitoringData = async () => {
    setLoading(true);
    setError('');

    try {
      // ✅ CORRECTED: Use API helpers with proper error handling
      const [pipelinesData, statsData, healthData] = await Promise.allSettled([
        apiHelpers.getMonitoringPipelines(),
        apiHelpers.getMonitoringStats(),
        apiHelpers.getMonitoringHealth()
      ]);

      // Handle pipelines data
      if (pipelinesData.status === 'fulfilled') {
        const pipelineArray = Array.isArray(pipelinesData.value) 
          ? pipelinesData.value 
          : (pipelinesData.value?.pipelines || []);
        setPipelines(pipelineArray);
        console.log(`✅ Fetched ${pipelineArray.length} pipeline entries`);
      } else {
        console.warn('Failed to fetch pipelines:', pipelinesData.reason);
        setPipelines([]);
      }

      // Handle stats data
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
        console.log('✅ Fetched monitoring stats:', statsData.value);
      } else {
        console.warn('Failed to fetch stats:', statsData.reason);
        setStats(null);
      }

      // Handle health data
      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value);
        console.log('✅ Fetched health data:', healthData.value);
      } else {
        console.warn('Failed to fetch health:', healthData.reason);
        setHealth(null);
      }

      setLastRefresh(new Date());

    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Failed to fetch monitoring data. Please check if the monitoring endpoints are available.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ IMPROVED: Format duration helper
  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  // ✅ IMPROVED: Format timestamp helper
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  // ✅ IMPROVED: Get status color helper
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
      case 'running':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
      case 'error':
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ✅ IMPROVED: Get status icon helper
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'healthy':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'processing':
      case 'running':
      case 'in_progress':
        return <Activity size={16} className="text-blue-600" />;
      case 'failed':
      case 'error':
      case 'unhealthy':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // ✅ IMPROVED: Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pipeline Monitoring</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Last updated: {formatTimestamp(lastRefresh)}
          </span>
          <button 
            onClick={fetchMonitoringData} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* System Health Overview */}
      {health && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity size={20} />
              System Health
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded border ${getStatusColor(health.status)}`}>
                  {getStatusIcon(health.status)}
                  <span className="font-medium">{health.status || 'Unknown'}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Overall Status</p>
              </div>
              
              {health.uptime && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDuration(health.uptime)}
                  </div>
                  <p className="text-sm text-gray-600">Uptime</p>
                </div>
              )}
              
              {health.version && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {health.version}
                  </div>
                  <p className="text-sm text-gray-600">Version</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Overview */}
      {stats && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp size={20} />
              Statistics
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.total_pipelines !== undefined && (
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.total_pipelines}
                  </div>
                  <p className="text-sm text-gray-600">Total Pipelines</p>
                </div>
              )}
              
              {stats.successful_pipelines !== undefined && (
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-green-600">
                    {stats.successful_pipelines}
                  </div>
                  <p className="text-sm text-gray-600">Successful</p>
                </div>
              )}
              
              {stats.failed_pipelines !== undefined && (
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-red-600">
                    {stats.failed_pipelines}
                  </div>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              )}
              
              {stats.average_processing_time && (
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatDuration(stats.average_processing_time)}
                  </div>
                  <p className="text-sm text-gray-600">Avg Processing Time</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pipeline History */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database size={20} />
            Recent Pipelines
          </h2>
          <p className="text-gray-600 mt-1">
            View recent document processing pipeline executions.
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading pipeline data...</p>
            </div>
          ) : pipelines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database size={48} className="mx-auto mb-4 opacity-50" />
              <p>No pipeline data available.</p>
              <p className="text-sm">Process some documents to see pipeline activity here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pipelines.slice(0, 10).map((pipeline, index) => (
                <div key={pipeline.id || index} className="border rounded p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {pipeline.document_id || pipeline.name || `Pipeline ${index + 1}`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {pipeline.description || 'Document processing pipeline'}
                      </p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-sm ${getStatusColor(pipeline.status)}`}>
                      {getStatusIcon(pipeline.status)}
                      <span>{pipeline.status || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <p className="font-medium">{formatTimestamp(pipeline.start_time || pipeline.created_at)}</p>
                    </div>
                    
                    {pipeline.end_time && (
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <p className="font-medium">{formatTimestamp(pipeline.end_time)}</p>
                      </div>
                    )}
                    
                    {pipeline.processing_time && (
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="font-medium">{formatDuration(pipeline.processing_time)}</p>
                      </div>
                    )}
                    
                    {pipeline.gpu_accelerated && (
                      <div className="flex items-center gap-1">
                        <Zap size={14} className="text-blue-600" />
                        <span className="text-blue-600 font-medium">GPU Accelerated</span>
                      </div>
                    )}
                  </div>
                  
                  {pipeline.error_message && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">{pipeline.error_message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
