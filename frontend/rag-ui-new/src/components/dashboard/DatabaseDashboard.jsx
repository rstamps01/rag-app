/**
 * Database Dashboard Component
 * 
 * Comprehensive dashboard for both PostgreSQL and Qdrant databases
 * with real-time metrics, health monitoring, and performance analytics.
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  BarChart3, 
  Eye, 
  RefreshCw, 
  ExternalLink, 
  Settings,
  TrendingUp,
  Activity,
  Layers,
  Search,
  AlertCircle,
  CheckCircle,
  Server,
  HardDrive,
  Cpu
} from 'lucide-react';

const DatabaseDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [postgresMetrics, setPostgresMetrics] = useState(null);
  const [qdrantMetrics, setQdrantMetrics] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [qdrantAvailable, setQdrantAvailable] = useState(false);

  // Qdrant configuration
  const qdrantBaseUrl = 'http://localhost:6333';
  const backendBaseUrl = 'http://localhost:8000/api/v1';

  // Check service availability
  const checkServiceAvailability = async () => {
    // Check backend availability
    try {
      const response = await fetch(`http://localhost:8000/health`, {
        method: 'HEAD',
        timeout: 2000
      });
      setBackendAvailable(response.ok);
    } catch (error) {
      setBackendAvailable(false);
    }

    // Check Qdrant availability
    try {
      const response = await fetch(`${qdrantBaseUrl}/`, {
        method: 'HEAD',
        timeout: 2000
      });
      setQdrantAvailable(response.ok);
    } catch (error) {
      setQdrantAvailable(false);
    }
  };

  useEffect(() => {
    checkServiceAvailability();
    fetchAllMetrics();
    const interval = setInterval(() => {
      checkServiceAvailability();
      fetchAllMetrics();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchAllMetrics = async () => {
    setIsLoading(true);
    try {
      const promises = [];
      if (backendAvailable) {
        promises.push(fetchPostgresMetrics());
        promises.push(fetchQdrantMetrics());
        promises.push(fetchSystemMetrics());
      } else {
        setPostgresMetrics(getDemoPostgresMetrics());
        setQdrantMetrics(getDemoQdrantMetrics());
        setSystemMetrics(getDemoSystemMetrics());
      }
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Error fetching database metrics:', error);
      // Set demo data on error
      setPostgresMetrics(getDemoPostgresMetrics());
      setQdrantMetrics(getDemoQdrantMetrics());
      setSystemMetrics(getDemoSystemMetrics());
    } finally {
      setIsLoading(false);
    }
  };

  // Demo data functions
  const getDemoPostgresMetrics = () => ({
    health: { status: 'healthy', connectionCount: 12, activeConnections: 8 },
    tables: { 
      users: { count: 25 }, 
      documents: { count: 150 }, 
      queryHistory: { count: 500 } 
    },
    performance: { 
      totalQueries: 500, 
      avgResponseTime: 45, 
      cacheHitRatio: 92 
    },
    storage: { 
      databaseSize: 245, 
      freeSpace: 800 
    }
  });

  const getDemoQdrantMetrics = () => ({
    collections: [
      { name: 'rag', points_count: 13122, status: 'green' }
    ],
    health: { title: 'ok' },
    performance: {
      searchLatency: 23,
      memoryUsage: 45,
      indexSize: 13122
    }
  });

  const getDemoSystemMetrics = () => ({
    cpu: { usage: 45 },
    memory: { usage: 29, available: 23010185216 },
    disk: { usage: 16.7 },
    gpu: { utilization: 5, memoryUsed: 16541, memoryTotal: 32607 },
    network: { bytesSent: 21471168, bytesRecv: 30883088 }
  });

  const fetchPostgresMetrics = async () => {
    try {
      const [comprehensiveResponse, documentsResponse, queriesResponse] = await Promise.all([
        fetch(`${backendBaseUrl}/metrics/comprehensive`),
        fetch(`${backendBaseUrl}/documents?limit=1000`),
        fetch(`${backendBaseUrl}/queries/history?limit=1000`)
      ]);
      
      if (!comprehensiveResponse.ok || !documentsResponse.ok || !queriesResponse.ok) {
        throw new Error('One or more API calls failed');
      }
      
      const comprehensiveData = await comprehensiveResponse.json();
      const documentsData = await documentsResponse.json();
      const queriesData = await queriesResponse.json();
      
      // Calculate real PostgreSQL metrics
      const documentsCount = documentsData.documents?.length || 0;
      const queriesCount = queriesData.queries?.length || 0;
      
      const postgresData = {
        health: {
          status: comprehensiveData.connection_metrics.database_status === 'connected' ? 'healthy' : 'unhealthy',
          lastCheck: comprehensiveData.timestamp
        },
        tables: {
          documents: { 
            count: documentsCount, 
            size: Math.floor(documentsCount * 0.5) 
          },
          queryHistory: { 
            count: queriesCount, 
            size: Math.floor(queriesCount * 0.1) 
          }
        },
        performance: {
          totalQueries: queriesCount,
          avgResponseTime: Math.round(comprehensiveData.postgres_metrics.query_performance * 1000),
          cacheHitRatio: comprehensiveData.postgres_metrics.cache_hit_ratio,
          activeConnections: comprehensiveData.postgres_metrics.active_connections
        },
        storage: {
          databaseSize: Math.round(comprehensiveData.postgres_metrics.database_size / 1024 / 1024), // Convert bytes to MB
          freeSpace: 1000 // Placeholder - would need separate endpoint for actual free space
        }
      };
      
      setPostgresMetrics(postgresData);
    } catch (error) {
      console.error('Error fetching PostgreSQL metrics:', error);
      setBackendAvailable(false);
      setPostgresMetrics(getDemoPostgresMetrics());
    }
  };

  const fetchQdrantMetrics = async () => {
    try {
      const [comprehensiveResponse, collectionsResponse] = await Promise.all([
        fetch(`${backendBaseUrl}/metrics/comprehensive`),
        fetch(`${qdrantBaseUrl}/collections`)
      ]);
      
      if (!comprehensiveResponse.ok || !collectionsResponse.ok) {
        throw new Error('API calls failed');
      }
      
      const comprehensiveData = await comprehensiveResponse.json();
      const collectionsData = await collectionsResponse.json();
      
      // Use real Qdrant metrics from comprehensive endpoint
      const qdrantData = {
        health: {
          status: comprehensiveData.connection_metrics.vector_db_status === 'connected' ? 'healthy' : 'unhealthy',
          lastCheck: comprehensiveData.timestamp
        },
        collections: {
          count: comprehensiveData.qdrant_metrics.collections_count,
          totalVectors: comprehensiveData.qdrant_metrics.total_points,
          avgVectorsPerCollection: comprehensiveData.qdrant_metrics.collections_count > 0 ? 
            Math.floor(comprehensiveData.qdrant_metrics.total_points / comprehensiveData.qdrant_metrics.collections_count) : 0
        },
        performance: {
          searchLatency: comprehensiveData.qdrant_metrics.search_latency,
          memoryUsage: comprehensiveData.qdrant_metrics.memory_usage,
          indexSize: comprehensiveData.qdrant_metrics.total_points
        }
      };
      
      setQdrantMetrics(qdrantData);
    } catch (error) {
      console.error('Error fetching Qdrant metrics:', error);
      setQdrantAvailable(false);
      setQdrantMetrics(getDemoQdrantMetrics());
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/metrics/comprehensive`);
      
      if (!response.ok) {
        throw new Error('System metrics API call failed');
      }
      
      const comprehensiveData = await response.json();
      
      // Extract real system metrics
      const systemData = {
        cpu: { 
          usage: comprehensiveData.system_metrics.cpu_usage 
        },
        memory: { 
          usage: comprehensiveData.system_metrics.memory_usage,
          available: comprehensiveData.system_metrics.memory_available
        },
        disk: { 
          usage: comprehensiveData.system_metrics.disk_usage 
        },
        gpu: {
          utilization: comprehensiveData.system_metrics.gpu_metrics.utilization,
          memoryUsed: comprehensiveData.system_metrics.gpu_metrics.memory_used,
          memoryTotal: comprehensiveData.system_metrics.gpu_metrics.memory_total
        },
        network: {
          bytesSent: comprehensiveData.system_metrics.network_bytes_sent,
          bytesRecv: comprehensiveData.system_metrics.network_bytes_recv
        }
      };
      
      setSystemMetrics(systemData);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      setSystemMetrics(getDemoSystemMetrics());
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'unhealthy': return 'text-yellow-400';
      case 'unreachable': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'unhealthy': return <AlertCircle className="w-4 h-4" />;
      case 'unreachable': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const tabs = [
    { 
      id: 'overview', 
      label: `Overview${(!backendAvailable || !qdrantAvailable) ? ' *' : ''}`, 
      icon: BarChart3 
    },
    { 
      id: 'postgres', 
      label: `PostgreSQL${!backendAvailable ? ' *' : ''}`, 
      icon: Database 
    },
    { 
      id: 'qdrant', 
      label: `Qdrant${!qdrantAvailable ? ' *' : ''}`, 
      icon: Layers 
    },
    { 
      id: 'system', 
      label: `System${!backendAvailable ? ' *' : ''}`, 
      icon: Cpu 
    },
    { 
      id: 'performance', 
      label: `Performance${(!backendAvailable || !qdrantAvailable) ? ' *' : ''}`, 
      icon: TrendingUp 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">
                Database Dashboard
                {(!backendAvailable || !qdrantAvailable) && (
                  <span className="text-yellow-400 text-lg ml-2">*</span>
                )}
              </h1>
              <p className="text-gray-400">
                PostgreSQL & Qdrant monitoring and analytics
                {(!backendAvailable || !qdrantAvailable) && (
                  <span className="text-yellow-400 ml-1">*Demo Data</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Service Status Indicators */}
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                backendAvailable 
                  ? 'bg-green-900 text-green-400' 
                  : 'bg-red-900 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  backendAvailable ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span>PostgreSQL</span>
              </div>
              
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                qdrantAvailable 
                  ? 'bg-green-900 text-green-400' 
                  : 'bg-red-900 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  qdrantAvailable ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span>Qdrant</span>
              </div>
            </div>
            
            {/* Refresh Controls */}
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            
            <button
              onClick={fetchAllMetrics}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Database Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PostgreSQL Status */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Database className="w-5 h-5 text-green-400" />
                    <span>PostgreSQL</span>
                  </h3>
                  <div className={`flex items-center space-x-2 ${getStatusColor(postgresMetrics?.health?.status)}`}>
                    {getStatusIcon(postgresMetrics?.health?.status)}
                    <span className="text-sm font-medium">
                      {postgresMetrics?.health?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Tables</div>
                    <div className="text-xl font-semibold">
                      {postgresMetrics?.tables ? 
                        Object.values(postgresMetrics.tables).reduce((sum, table) => sum + table.count, 0) : 0
                      }
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Total Queries</div>
                    <div className="text-xl font-semibold">
                      {postgresMetrics?.performance?.totalQueries?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Avg Response Time</div>
                    <div className="text-xl font-semibold">
                      {postgresMetrics?.performance?.avgResponseTime || 0}ms
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Cache Hit Ratio</div>
                    <div className="text-xl font-semibold">
                      {postgresMetrics?.performance?.cacheHitRatio?.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Qdrant Status */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span>Qdrant</span>
                  </h3>
                  <div className={`flex items-center space-x-2 ${getStatusColor(qdrantMetrics?.health?.status)}`}>
                    {getStatusIcon(qdrantMetrics?.health?.status)}
                    <span className="text-sm font-medium">
                      {qdrantMetrics?.health?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Collections</div>
                    <div className="text-xl font-semibold">
                      {qdrantMetrics?.collections?.count || 0}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Total Vectors</div>
                    <div className="text-xl font-semibold">
                      {qdrantMetrics?.collections?.totalVectors?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Search Latency</div>
                    <div className="text-xl font-semibold">
                      {qdrantMetrics?.performance?.searchLatency || 0}ms
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Memory Usage</div>
                    <div className="text-xl font-semibold">
                      {qdrantMetrics?.performance?.memoryUsage || 0}MB
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => window.open(`${backendBaseUrl}/monitoring/health`, '_blank')}
                  className="flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  <span>Health Check</span>
                </button>
                <button
                  onClick={() => window.open(`${qdrantBaseUrl}/collections`, '_blank')}
                  className="flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>Qdrant Collections</span>
                </button>
                <button
                  onClick={() => window.open(`${backendBaseUrl}/documents`, '_blank')}
                  className="flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Database className="w-4 h-4" />
                  <span>PostgreSQL Tables</span>
                </button>
                <button
                  onClick={() => window.open(`${qdrantBaseUrl}/metrics`, '_blank')}
                  className="flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Qdrant Metrics</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'postgres' && (
          <div className="space-y-6">
            {/* PostgreSQL Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Table Statistics</h3>
                <div className="space-y-3">
                  {postgresMetrics?.tables && Object.entries(postgresMetrics.tables).map(([table, data]) => (
                    <div key={table} className="flex justify-between items-center">
                      <span className="text-gray-400 capitalize">{table}</span>
                      <div className="text-right">
                        <div className="font-semibold">{data.count.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{data.size}MB</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Connections</span>
                    <span className="font-semibold">{postgresMetrics?.performance?.activeConnections || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Database Size</span>
                    <span className="font-semibold">{postgresMetrics?.storage?.databaseSize || 0}MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Free Space</span>
                    <span className="font-semibold">{postgresMetrics?.storage?.freeSpace || 0}MB</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Queries</span>
                    <span className="font-semibold">{postgresMetrics?.performance?.totalQueries?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg Response Time</span>
                    <span className="font-semibold">{postgresMetrics?.performance?.avgResponseTime || 0}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Cache Hit Ratio</span>
                    <span className="font-semibold">{postgresMetrics?.performance?.cacheHitRatio?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qdrant' && (
          <div className="space-y-6">
            {/* Qdrant Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Collection Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Collections</span>
                    <span className="font-semibold">{qdrantMetrics?.collections?.count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Vectors</span>
                    <span className="font-semibold">{qdrantMetrics?.collections?.totalVectors?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg Vectors/Collection</span>
                    <span className="font-semibold">{qdrantMetrics?.collections?.avgVectorsPerCollection?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Search Latency</span>
                    <span className="font-semibold">{qdrantMetrics?.performance?.searchLatency || 0}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Memory Usage</span>
                    <span className="font-semibold">{qdrantMetrics?.performance?.memoryUsage || 0}MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Index Size</span>
                    <span className="font-semibold">{qdrantMetrics?.performance?.indexSize?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Qdrant Dashboard Embed */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300 ml-3">
                    Qdrant Dashboard: {qdrantBaseUrl}/dashboard
                  </span>
                </div>
                <button
                  onClick={() => window.open(`${qdrantBaseUrl}/dashboard`, '_blank')}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </button>
              </div>
              
              <div className="h-[400px]">
                <iframe
                  src={`${qdrantBaseUrl}/dashboard`}
                  className="w-full h-full border-0"
                  title="Qdrant Dashboard"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* System Metrics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CPU and Memory */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <span>CPU & Memory</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>CPU Usage</span>
                      <span>{systemMetrics?.cpu?.usage?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{width: `${systemMetrics?.cpu?.usage || 0}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Memory Usage</span>
                      <span>{systemMetrics?.memory?.usage?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full" 
                        style={{width: `${systemMetrics?.memory?.usage || 0}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Available: {systemMetrics?.memory?.available ? (systemMetrics.memory.available / 1024 / 1024 / 1024).toFixed(1) : 0} GB
                  </div>
                </div>
              </div>

              {/* GPU Metrics */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <HardDrive className="w-5 h-5 text-purple-400" />
                  <span>GPU Metrics</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>GPU Utilization</span>
                      <span>{systemMetrics?.gpu?.utilization || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-400 h-2 rounded-full" 
                        style={{width: `${systemMetrics?.gpu?.utilization || 0}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>GPU Memory</span>
                      <span>{systemMetrics?.gpu?.memoryUsed || 0}MB / {systemMetrics?.gpu?.memoryTotal || 0}MB</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-400 h-2 rounded-full" 
                        style={{width: `${systemMetrics?.gpu?.memoryTotal ? (systemMetrics.gpu.memoryUsed / systemMetrics.gpu.memoryTotal) * 100 : 0}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disk and Network */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <HardDrive className="w-5 h-5 text-yellow-400" />
                  <span>Disk Usage</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Disk Usage</span>
                      <span>{systemMetrics?.disk?.usage?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{width: `${systemMetrics?.disk?.usage || 0}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span>Network Activity</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Bytes Sent</span>
                    <span className="font-semibold">{(systemMetrics?.network?.bytesSent / 1024 / 1024).toFixed(1) || 0} MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Bytes Received</span>
                    <span className="font-semibold">{(systemMetrics?.network?.bytesRecv / 1024 / 1024).toFixed(1) || 0} MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">PostgreSQL Performance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Query Response Time</span>
                      <span>{postgresMetrics?.performance?.avgResponseTime || 0}ms</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full" 
                        style={{width: `${Math.min((postgresMetrics?.performance?.avgResponseTime || 0) / 2, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Cache Hit Ratio</span>
                      <span>{postgresMetrics?.performance?.cacheHitRatio?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{width: `${postgresMetrics?.performance?.cacheHitRatio || 0}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Qdrant Performance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Search Latency</span>
                      <span>{qdrantMetrics?.performance?.searchLatency || 0}ms</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-400 h-2 rounded-full" 
                        style={{width: `${Math.min((qdrantMetrics?.performance?.searchLatency || 0) * 2, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Memory Usage</span>
                      <span>{qdrantMetrics?.performance?.memoryUsage || 0}MB</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-400 h-2 rounded-full" 
                        style={{width: `${Math.min((qdrantMetrics?.performance?.memoryUsage || 0) / 2, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseDashboard;
