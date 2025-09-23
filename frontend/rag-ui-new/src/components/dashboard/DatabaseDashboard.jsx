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
  Cpu,
  FileText,
  Play,
  Edit,
  Save,
  X,
  RotateCcw
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
  const [quickActionResults, setQuickActionResults] = useState(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [collections, setCollections] = useState([]);
  const [editingCollection, setEditingCollection] = useState(null);
  const [collectionConfig, setCollectionConfig] = useState({});

  // Qdrant configuration
  const qdrantBaseUrl = 'http://localhost:6333';
  const backendBaseUrl = 'http://localhost:8000/api/v1';

  // Check service availability
  const checkServiceAvailability = async () => {
    // Check backend availability
    try {
      const response = await fetch(`http://localhost:8000/health`, {
        method: 'GET',
        timeout: 2000
      });
      setBackendAvailable(response.ok);
    } catch (error) {
      setBackendAvailable(false);
    }

    // Check Qdrant availability
    try {
      const response = await fetch(`${qdrantBaseUrl}/`, {
        method: 'GET',
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
    setError(null); // Clear any previous errors
    try {
      // Always try to fetch real data first, fallback to demo data on error
      const promises = [
        fetchPostgresMetrics(),
        fetchQdrantMetrics(),
        fetchSystemMetrics()
      ];
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching database metrics:', error);
      setError(`Failed to fetch metrics: ${error.message}`);
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
        fetch(`${backendBaseUrl}/documents?limit=100`),
        fetch(`${backendBaseUrl}/queries/history?limit=100`)
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
      
      console.log('PostgreSQL Real Data:', {
        documentsCount,
        queriesCount,
        cacheHitRatio: comprehensiveData.postgres_metrics.cache_hit_ratio,
        activeConnections: comprehensiveData.postgres_metrics.active_connections,
        databaseStatus: comprehensiveData.connection_metrics.database_status
      });
      
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
      setBackendAvailable(true);
    } catch (error) {
      console.error('Error fetching PostgreSQL metrics:', error);
      setBackendAvailable(false);
      // Don't throw error - just return, let fetchAllMetrics handle demo data fallback
      return;
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
      console.log('Qdrant Real Data:', {
        collectionsCount: comprehensiveData.qdrant_metrics.collections_count,
        totalPoints: comprehensiveData.qdrant_metrics.total_points,
        vectorDbStatus: comprehensiveData.connection_metrics.vector_db_status
      });
      
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
      setQdrantAvailable(true);
    } catch (error) {
      console.error('Error fetching Qdrant metrics:', error);
      setQdrantAvailable(false);
      // Don't throw error - just return, let fetchAllMetrics handle demo data fallback
      return;
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
      // Don't throw error - just return, let fetchAllMetrics handle demo data fallback
      return;
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

  // Quick Action Handlers
  const handleHealthCheck = async () => {
    setIsLoadingAction(true);
    try {
      const response = await fetch(`${backendBaseUrl}/monitoring/health`);
      const data = await response.json();
      
      setQuickActionResults({
        title: 'Health Check Results',
        type: 'health',
        data: {
          status: data.status,
          timestamp: data.timestamp,
          logsDir: data.logs_dir
        }
      });
    } catch (error) {
      setQuickActionResults({
        title: 'Health Check Results',
        type: 'error',
        data: { error: error.message }
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleQdrantCollections = async () => {
    setIsLoadingAction(true);
    try {
      // Use the new collection management endpoint
      const response = await fetch(`${backendBaseUrl}/collections/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.status}`);
      }
      
      const data = await response.json();
      setCollections(data.collections);
      
      setQuickActionResults({
        title: 'Qdrant Collections',
        type: 'collections',
        data: {
          collections: data.collections,
          totalCollections: data.total_collections,
          totalPoints: data.total_points
        }
      });
    } catch (error) {
      console.error('Qdrant Collections Error:', error);
      setQuickActionResults({
        title: 'Qdrant Collections',
        type: 'error',
        data: { error: `Failed to fetch collections: ${error.message}` }
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleIndexCollection = async (collectionName, forceReindex = false) => {
    try {
      const response = await fetch(`${backendBaseUrl}/collections/${collectionName}/index?force_reindex=${forceReindex}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger indexing: ${response.status}`);
      }
      
      const data = await response.json();
      
      setQuickActionResults({
        title: 'Collection Indexing',
        type: 'indexing',
        data: {
          collectionName: collectionName,
          message: data.message,
          status: data.status,
          forceReindex: forceReindex
        }
      });
      
      // Refresh collections after indexing
      setTimeout(() => {
        handleQdrantCollections();
      }, 2000);
      
    } catch (error) {
      console.error('Index Collection Error:', error);
      setQuickActionResults({
        title: 'Collection Indexing',
        type: 'error',
        data: { error: `Failed to trigger indexing: ${error.message}` }
      });
    }
  };

  const handleRefreshCollections = async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/collections/refresh`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh collections: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Refresh the collections list
      await handleQdrantCollections();
      
      setQuickActionResults({
        title: 'Collections Refreshed',
        type: 'refresh',
        data: {
          message: data.message,
          collectionsFound: data.collections_found,
          collections: data.collections
        }
      });
      
    } catch (error) {
      console.error('Refresh Collections Error:', error);
      setQuickActionResults({
        title: 'Collections Refresh',
        type: 'error',
        data: { error: `Failed to refresh collections: ${error.message}` }
      });
    }
  };

  const handleEditCollection = async (collectionName) => {
    try {
      const response = await fetch(`${backendBaseUrl}/collections/${collectionName}/status`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch collection status: ${response.status}`);
      }
      
      const data = await response.json();
      setEditingCollection(collectionName);
      setCollectionConfig({
        vector_size: data.vector_size,
        distance: data.distance,
        hnsw_config: data.hnsw_config,
        optimizer_config: data.optimizer_config
      });
      
    } catch (error) {
      console.error('Edit Collection Error:', error);
      setQuickActionResults({
        title: 'Collection Edit',
        type: 'error',
        data: { error: `Failed to load collection config: ${error.message}` }
      });
    }
  };

  const handleSaveCollectionConfig = async (collectionName) => {
    try {
      const response = await fetch(`${backendBaseUrl}/collections/${collectionName}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(collectionConfig)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save collection config: ${response.status}`);
      }
      
      const data = await response.json();
      
      setQuickActionResults({
        title: 'Collection Configuration Updated',
        type: 'config_update',
        data: {
          collectionName: collectionName,
          message: data.message,
          updatedConfig: data.updated_config
        }
      });
      
      setEditingCollection(null);
      
      // Refresh collections after config update
      setTimeout(() => {
        handleQdrantCollections();
      }, 1000);
      
    } catch (error) {
      console.error('Save Collection Config Error:', error);
      setQuickActionResults({
        title: 'Collection Configuration',
        type: 'error',
        data: { error: `Failed to save configuration: ${error.message}` }
      });
    }
  };

  const handlePostgreSQLTables = async () => {
    console.log('PostgreSQL Tables button clicked');
    setIsLoadingAction(true);
    setError(null); // Clear any previous errors
    try {
      console.log('Fetching documents from:', `${backendBaseUrl}/documents?limit=100`);
      const response = await fetch(`${backendBaseUrl}/documents?limit=100`);
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Documents data received:', data);
      
      const result = {
        title: 'PostgreSQL Documents',
        type: 'documents',
        data: {
          documents: data.documents || [],
          totalDocuments: data.documents?.length || 0,
          totalPages: data.total_pages || 0
        }
      };
      
      console.log('Setting quick action results:', result);
      setQuickActionResults(result);
    } catch (error) {
      console.error('PostgreSQL Tables Error:', error);
      setError(`PostgreSQL Tables Error: ${error.message}`);
      setQuickActionResults({
        title: 'PostgreSQL Documents',
        type: 'error',
        data: { error: `Failed to fetch documents: ${error.message}` }
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleQdrantMetrics = async () => {
    setIsLoadingAction(true);
    try {
      // Use the comprehensive metrics endpoint instead of raw Prometheus metrics
      const response = await fetch(`${backendBaseUrl}/metrics/comprehensive`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setQuickActionResults({
        title: 'Qdrant Metrics',
        type: 'metrics',
        data: {
          collections: data.qdrant_metrics?.collections_count || 0,
          totalPoints: data.qdrant_metrics?.total_points || 0,
          memoryUsage: data.qdrant_metrics?.memory_usage || 0,
          diskUsage: data.qdrant_metrics?.disk_usage || 0,
          searchLatency: data.qdrant_metrics?.search_latency || 0,
          indexingSpeed: data.qdrant_metrics?.indexing_speed || 0,
          connectionStatus: data.qdrant_metrics?.connection_status || 'unknown',
          lastHealthCheck: data.qdrant_metrics?.last_health_check || new Date().toISOString(),
          timestamp: data.timestamp || new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Qdrant Metrics Error:', error);
      setQuickActionResults({
        title: 'Qdrant Metrics',
        type: 'error',
        data: { error: `Failed to fetch Qdrant metrics: ${error.message}` }
      });
    } finally {
      setIsLoadingAction(false);
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

  // Add error boundary to prevent page from going blank
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Dashboard Error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

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
                
                {/* PostgreSQL Quick Actions */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={handleHealthCheck}
                      disabled={isLoadingAction}
                      className="flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <Activity className="w-4 h-4" />
                      <span>{isLoadingAction ? 'Loading...' : 'Health Check'}</span>
                    </button>
                    <button
                      onClick={handlePostgreSQLTables}
                      disabled={isLoadingAction}
                      className="flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <Database className="w-4 h-4" />
                      <span>{isLoadingAction ? 'Loading...' : 'PostgreSQL Tables'}</span>
                    </button>
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
                
                {/* Qdrant Quick Actions */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={handleQdrantCollections}
                      disabled={isLoadingAction}
                      className="flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <Layers className="w-4 h-4" />
                      <span>{isLoadingAction ? 'Loading...' : 'Qdrant Collections'}</span>
                    </button>
                    <button
                      onClick={handleQdrantMetrics}
                      disabled={isLoadingAction}
                      className="flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{isLoadingAction ? 'Loading...' : 'Qdrant Metrics'}</span>
                    </button>
                  </div>
                </div>
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

        {/* Quick Action Results */}
        {quickActionResults && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{quickActionResults.title}</h3>
              <button
                onClick={() => setQuickActionResults(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {quickActionResults.type === 'error' ? (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Error</span>
                </div>
                <p className="text-red-300 mt-2">{quickActionResults.data.error}</p>
              </div>
            ) : quickActionResults.type === 'health' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="font-semibold text-white">Status</span>
                    </div>
                    <p className="text-green-400 font-mono">{quickActionResults.data.status}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-white">Timestamp</span>
                    </div>
                    <p className="text-blue-400 font-mono text-sm">{new Date(quickActionResults.data.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Server className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Logs Directory</span>
                    </div>
                    <p className="text-purple-400 font-mono text-sm">{quickActionResults.data.logsDir}</p>
                  </div>
                </div>
              </div>
            ) : quickActionResults.type === 'collections' ? (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-white">Qdrant Collections</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleRefreshCollections}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Refresh</span>
                      </button>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Total Collections</div>
                        <div className="text-xl font-bold text-blue-400">{quickActionResults.data.totalCollections}</div>
                      </div>
                    </div>
                  </div>
                  
                  {quickActionResults.data.totalPoints > 0 && (
                    <div className="mb-4 p-3 bg-gray-600 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Points Across All Collections</span>
                        <span className="text-green-400 font-bold text-lg">{quickActionResults.data.totalPoints.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  
                  {quickActionResults.data.collections.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {quickActionResults.data.collections.map((collection, index) => (
                        <div key={index} className="bg-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-white font-semibold">{collection.name}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                collection.status === 'green' ? 'bg-green-900 text-green-300' :
                                collection.status === 'yellow' ? 'bg-yellow-900 text-yellow-300' :
                                collection.status === 'red' ? 'bg-red-900 text-red-300' :
                                'bg-gray-900 text-gray-300'
                              }`}>
                                {collection.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleIndexCollection(collection.name, false)}
                                className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                                title="Trigger Indexing"
                              >
                                <Play className="w-3 h-3" />
                                <span>Index</span>
                              </button>
                              <button
                                onClick={() => handleIndexCollection(collection.name, true)}
                                className="flex items-center space-x-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs transition-colors"
                                title="Force Reindex"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reindex</span>
                              </button>
                              <button
                                onClick={() => handleEditCollection(collection.name)}
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                                title="Edit Configuration"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="text-right">
                              <div className="text-green-400 font-bold">{collection.points_count.toLocaleString()} points</div>
                              <div className="text-xs text-gray-400">{collection.indexed_vectors_count.toLocaleString()} indexed</div>
                            </div>
                            <div className="text-left">
                              <div className="text-sm text-gray-400">Segments: {collection.segments_count}</div>
                              <div className="text-sm text-gray-400">Vector Size: {collection.vector_size}D</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                            <div>
                              <div className="font-semibold text-gray-300 mb-1">Distance Metric</div>
                              <div className="font-mono">{collection.distance}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-300 mb-1">HNSW Config</div>
                              <div className="font-mono">
                                M: {collection.hnsw_config?.m || 'N/A'}, 
                                EF: {collection.hnsw_config?.ef_construct || 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          {editingCollection === collection.name && (
                            <div className="mt-4 p-3 bg-gray-500 rounded border border-gray-400">
                              <div className="text-sm font-semibold text-white mb-2">Edit Configuration</div>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-xs text-gray-300 mb-1">Vector Size</label>
                                  <input
                                    type="number"
                                    value={collectionConfig.vector_size || ''}
                                    onChange={(e) => setCollectionConfig(prev => ({...prev, vector_size: parseInt(e.target.value)}))}
                                    className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-300 mb-1">Distance</label>
                                  <select
                                    value={collectionConfig.distance || ''}
                                    onChange={(e) => setCollectionConfig(prev => ({...prev, distance: e.target.value}))}
                                    className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
                                  >
                                    <option value="Cosine">Cosine</option>
                                    <option value="Euclidean">Euclidean</option>
                                    <option value="Dot">Dot</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setEditingCollection(null)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                                <button
                                  onClick={() => handleSaveCollectionConfig(collection.name)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Save</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No collections found</p>
                  )}
                </div>
              </div>
            ) : quickActionResults.type === 'documents' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="w-5 h-5 text-green-400" />
                      <span className="font-semibold text-white">Total Documents</span>
                    </div>
                    <p className="text-green-400 text-2xl font-bold">{quickActionResults.data.totalDocuments}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-white">Total Pages</span>
                    </div>
                    <p className="text-blue-400 text-2xl font-bold">{quickActionResults.data.totalPages}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Status</span>
                    </div>
                    <p className="text-purple-400 font-mono">Active</p>
                  </div>
                </div>
                {quickActionResults.data.documents.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Recent Documents</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {quickActionResults.data.documents.slice(0, 10).map((doc, index) => (
                        <div key={index} className="bg-gray-600 rounded p-2 flex justify-between items-center">
                          <span className="font-mono text-white text-sm truncate">{doc.filename || doc.name || `Document ${index + 1}`}</span>
                          <span className="text-gray-400 text-xs">{doc.status || 'Unknown'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : quickActionResults.type === 'indexing' ? (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Play className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">Collection Indexing</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Collection:</span>
                      <span className="font-mono text-white">{quickActionResults.data.collectionName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Status:</span>
                      <span className="text-green-400 font-semibold">{quickActionResults.data.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Force Reindex:</span>
                      <span className={quickActionResults.data.forceReindex ? "text-orange-400" : "text-blue-400"}>
                        {quickActionResults.data.forceReindex ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-gray-600 rounded">
                      <p className="text-sm text-gray-300">{quickActionResults.data.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : quickActionResults.type === 'refresh' ? (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <RotateCcw className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-white">Collections Refreshed</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Collections Found:</span>
                      <span className="text-blue-400 font-semibold">{quickActionResults.data.collectionsFound}</span>
                    </div>
                    <div className="mt-3 p-3 bg-gray-600 rounded">
                      <p className="text-sm text-gray-300 mb-2">{quickActionResults.data.message}</p>
                      <div className="text-xs text-gray-400">
                        <div className="font-semibold mb-1">Collections:</div>
                        <div className="font-mono">{quickActionResults.data.collections.join(", ")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : quickActionResults.type === 'config_update' ? (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Save className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">Configuration Updated</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Collection:</span>
                      <span className="font-mono text-white">{quickActionResults.data.collectionName}</span>
                    </div>
                    <div className="mt-3 p-3 bg-gray-600 rounded">
                      <p className="text-sm text-gray-300 mb-2">{quickActionResults.data.message}</p>
                      <div className="text-xs text-gray-400">
                        <div className="font-semibold mb-1">Updated Configuration:</div>
                        <pre className="font-mono text-xs overflow-x-auto">
                          {JSON.stringify(quickActionResults.data.updatedConfig, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : quickActionResults.type === 'metrics' ? (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">Qdrant Metrics</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-400 text-sm">Collections</div>
                      <div className="text-white font-mono text-lg">{quickActionResults.data.collections}</div>
                    </div>
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-400 text-sm">Total Points</div>
                      <div className="text-white font-mono text-lg">{quickActionResults.data.totalPoints?.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-400 text-sm">Memory Usage</div>
                      <div className="text-white font-mono text-lg">{quickActionResults.data.memoryUsage}MB</div>
                    </div>
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-400 text-sm">Disk Usage</div>
                      <div className="text-white font-mono text-lg">{quickActionResults.data.diskUsage}MB</div>
                    </div>
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-400 text-sm">Search Latency</div>
                      <div className="text-white font-mono text-lg">{quickActionResults.data.searchLatency}ms</div>
                    </div>
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-400 text-sm">Indexing Speed</div>
                      <div className="text-white font-mono text-lg">{quickActionResults.data.indexingSpeed} ops/s</div>
                    </div>
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-400 text-sm">Connection Status</div>
                      <div className="text-white font-mono text-lg">{quickActionResults.data.connectionStatus}</div>
                    </div>
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-400 text-sm">Last Health Check</div>
                      <div className="text-white font-mono text-sm">{new Date(quickActionResults.data.lastHealthCheck).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseDashboard;
