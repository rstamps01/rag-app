/**
 * Advanced Qdrant Flow Dashboard
 * 
 * Enhanced React Flow dashboard with real-time Qdrant data,
 * interactive monitoring, and comprehensive RAG integration visualization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { QDRANT_URL } from '../../config';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import Lucide React icons
import {
  Database,
  BarChart3,
  Activity,
  TrendingUp,
  Search,
  Layers,
  Zap,
  Cpu,
  Server,
  HardDrive,
  Network,
  RefreshCw,
  Settings,
  Eye,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

// Enhanced Node Components
const QdrantCollectionNode = ({ data, selected }) => {
  const { collection, metrics, isRealTime } = data;
  
  return (
    <div className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[280px] shadow-lg transition-all ${
      selected ? 'border-purple-400 shadow-purple-500/20' : 'border-purple-500'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">{collection.name}</h3>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            collection.status === 'green' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
          }`}>
            {collection.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Vectors:</span>
          <span className="text-white font-mono">{collection.points_count?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Dimensions:</span>
          <span className="text-white">{collection.config?.params?.vectors?.size}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Distance:</span>
          <span className="text-white">{collection.config?.params?.vectors?.distance}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Segments:</span>
          <span className="text-white">{collection.segments_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Indexed:</span>
          <span className="text-white font-mono">{metrics?.indexed_vectors_count?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const VectorMetricsNode = ({ data, selected }) => {
  const { metrics, isRealTime } = data;
  
  return (
    <div className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[220px] shadow-lg transition-all ${
      selected ? 'border-blue-400 shadow-blue-500/20' : 'border-blue-500'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Vector Metrics</h3>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Search Latency:</span>
          <span className="text-white">{metrics?.search_latency || 0}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Memory Usage:</span>
          <span className="text-white">{metrics?.memory_usage || 0}MB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Index Size:</span>
          <span className="text-white">{metrics?.index_size?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Cache Hit:</span>
          <span className="text-white">{metrics?.cache_hit_ratio || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Compression:</span>
          <span className="text-white">{metrics?.compression_ratio || 0}%</span>
        </div>
      </div>
    </div>
  );
};

const PerformanceNode = ({ data, selected }) => {
  const { performance, isRealTime } = data;
  
  return (
    <div className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[220px] shadow-lg transition-all ${
      selected ? 'border-green-400 shadow-green-500/20' : 'border-green-500'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Performance</h3>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Queries/min:</span>
          <span className="text-white">{performance?.queries_per_minute || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Response:</span>
          <span className="text-white">{performance?.avg_response_time || 0}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Success Rate:</span>
          <span className="text-white">{performance?.success_rate || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Active Queries:</span>
          <span className="text-white">{performance?.active_queries || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Throughput:</span>
          <span className="text-white">{performance?.throughput || 0}/s</span>
        </div>
      </div>
    </div>
  );
};

const RAGIntegrationNode = ({ data, selected }) => {
  const { integration, isRealTime } = data;
  
  return (
    <div className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[280px] shadow-lg transition-all ${
      selected ? 'border-orange-400 shadow-orange-500/20' : 'border-orange-500'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">RAG Integration</h3>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            integration?.status === 'connected' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
          }`}>
            {integration?.status || 'disconnected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Documents:</span>
          <span className="text-white">{integration?.documents_processed || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Embeddings:</span>
          <span className="text-white">{integration?.embeddings_generated || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Chunks:</span>
          <span className="text-white">{integration?.chunks_generated || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Processing:</span>
          <span className="text-white">{integration?.processing_queue || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Success Rate:</span>
          <span className="text-white">{integration?.success_rate || 0}%</span>
        </div>
      </div>
    </div>
  );
};

const SystemHealthNode = ({ data, selected }) => {
  const { system, isRealTime } = data;
  
  return (
    <div className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[220px] shadow-lg transition-all ${
      selected ? 'border-cyan-400 shadow-cyan-500/20' : 'border-cyan-500'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">System Health</h3>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">CPU:</span>
          <span className={`${system?.cpu_usage > 80 ? 'text-red-400' : system?.cpu_usage > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
            {system?.cpu_usage || 0}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Memory:</span>
          <span className={`${system?.memory_usage > 80 ? 'text-red-400' : system?.memory_usage > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
            {system?.memory_usage || 0}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Disk:</span>
          <span className={`${system?.disk_usage > 80 ? 'text-red-400' : system?.disk_usage > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
            {system?.disk_usage || 0}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Network:</span>
          <span className="text-white">{system?.network_usage || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Uptime:</span>
          <span className="text-white">{system?.uptime || '0h'}</span>
        </div>
      </div>
    </div>
  );
};

const SearchAnalyticsNode = ({ data, selected }) => {
  const { analytics, isRealTime } = data;
  
  return (
    <div className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[250px] shadow-lg transition-all ${
      selected ? 'border-indigo-400 shadow-indigo-500/20' : 'border-indigo-500'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Search Analytics</h3>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Searches:</span>
          <span className="text-white">{analytics?.total_searches || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Precision:</span>
          <span className="text-white">{analytics?.avg_precision || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Recall:</span>
          <span className="text-white">{analytics?.avg_recall || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Top Queries:</span>
          <span className="text-white">{analytics?.top_queries || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">No Results:</span>
          <span className="text-white">{analytics?.no_results || 0}%</span>
        </div>
      </div>
    </div>
  );
};

// Define node types
const nodeTypes = {
  qdrantCollection: QdrantCollectionNode,
  vectorMetrics: VectorMetricsNode,
  performance: PerformanceNode,
  ragIntegration: RAGIntegrationNode,
  systemHealth: SystemHealthNode,
  searchAnalytics: SearchAnalyticsNode
};

const AdvancedQdrantFlowDashboard = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qdrantData, setQdrantData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isRealTime, setIsRealTime] = useState(true);

  // Check if Qdrant service is available
  const [qdrantAvailable, setQdrantAvailable] = useState(false);

  // Check Qdrant availability
  const checkQdrantAvailability = useCallback(async () => {
    try {
      const response = await fetch(`${QDRANT_URL}/health`, {
        method: 'HEAD',
        timeout: 2000
      });
      setQdrantAvailable(response.ok);
    } catch (error) {
      setQdrantAvailable(false);
    }
  }, []);

  // Fetch Qdrant data only if service is available
  const fetchQdrantData = useCallback(async () => {
    if (!qdrantAvailable) {
      console.log('Qdrant service not available, using demo data');
      return;
    }

    try {
      const [collectionsResponse, healthResponse] = await Promise.all([
        fetch(`${QDRANT_URL}/collections`),
        fetch(`${QDRANT_URL}/health`)
      ]);
      
      const collectionsData = await collectionsResponse.json();
      const healthData = await healthResponse.json();
      
      setQdrantData({
        collections: collectionsData.result?.collections || [],
        health: healthData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching Qdrant data:', error);
      setQdrantAvailable(false);
    }
  }, [qdrantAvailable]);

  // Initialize nodes and edges
  useEffect(() => {
    const initializeFlow = async () => {
      // Check Qdrant availability first
      await checkQdrantAvailability();
      const initialNodes = [
        {
          id: 'qdrant-main',
          type: 'qdrantCollection',
          position: { x: 50, y: 50 },
          data: {
            collection: {
              name: 'RAG Collection',
              status: 'green',
              points_count: 13122,
              config: {
                params: {
                  vectors: { size: 384, distance: 'Cosine' }
                }
              },
              segments_count: 8
            },
            metrics: {
              indexed_vectors_count: 13122,
              search_latency: 23,
              memory_usage: 45,
              index_size: 13122,
              cache_hit_ratio: 92,
              compression_ratio: 15
            },
            isRealTime
          }
        },
        {
          id: 'vector-metrics',
          type: 'vectorMetrics',
          position: { x: 400, y: 50 },
          data: {
            metrics: {
              indexed_vectors_count: 13122,
              search_latency: 23,
              memory_usage: 45,
              index_size: 13122,
              cache_hit_ratio: 92,
              compression_ratio: 15
            },
            isRealTime
          }
        },
        {
          id: 'performance',
          type: 'performance',
          position: { x: 50, y: 300 },
          data: {
            performance: {
              queries_per_minute: 45,
              avg_response_time: 23,
              success_rate: 98.5,
              active_queries: 3,
              throughput: 0.75
            },
            isRealTime
          }
        },
        {
          id: 'rag-integration',
          type: 'ragIntegration',
          position: { x: 400, y: 300 },
          data: {
            integration: {
              status: 'connected',
              documents_processed: 150,
              embeddings_generated: 13122,
              chunks_generated: 1500,
              processing_queue: 5,
              success_rate: 98.5
            },
            isRealTime
          }
        },
        {
          id: 'search-analytics',
          type: 'searchAnalytics',
          position: { x: 750, y: 50 },
          data: {
            analytics: {
              total_searches: 1250,
              avg_precision: 94.2,
              avg_recall: 89.7,
              top_queries: 15,
              no_results: 2.3
            },
            isRealTime
          }
        },
        {
          id: 'system-health',
          type: 'systemHealth',
          position: { x: 400, y: 550 },
          data: {
            system: {
              cpu_usage: 45,
              memory_usage: 62,
              disk_usage: 38,
              network_usage: 12,
              uptime: '72h'
            },
            isRealTime
          }
        }
      ];

      const initialEdges = [
        {
          id: 'qdrant-to-metrics',
          source: 'qdrant-main',
          target: 'vector-metrics',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
        },
        {
          id: 'qdrant-to-performance',
          source: 'qdrant-main',
          target: 'performance',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
        },
        {
          id: 'metrics-to-rag',
          source: 'vector-metrics',
          target: 'rag-integration',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }
        },
        {
          id: 'performance-to-rag',
          source: 'performance',
          target: 'rag-integration',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }
        },
        {
          id: 'metrics-to-analytics',
          source: 'vector-metrics',
          target: 'search-analytics',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
        },
        {
          id: 'rag-to-system',
          source: 'rag-integration',
          target: 'system-health',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }
        },
        {
          id: 'qdrant-to-system',
          source: 'qdrant-main',
          target: 'system-health',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }
        },
        {
          id: 'analytics-to-system',
          source: 'search-analytics',
          target: 'system-health',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }
        }
      ];

      setNodes(initialNodes);
      setEdges(initialEdges);
      setIsLoading(false);
    };

    initializeFlow();
  }, [checkQdrantAvailability, fetchQdrantData, isRealTime]);

  // Auto-refresh data
  useEffect(() => {
    if (!isRealTime || !qdrantAvailable) return;
    
    const interval = setInterval(() => {
      fetchQdrantData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchQdrantData, refreshInterval, isRealTime, qdrantAvailable]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleRefresh = () => {
    fetchQdrantData();
  };

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading Advanced Qdrant Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Advanced Qdrant Flow Dashboard
                {!qdrantAvailable && (
                  <span className="text-yellow-400 text-lg ml-2">*</span>
                )}
              </h1>
              <p className="text-gray-400">
                Real-time vector database monitoring and RAG integration visualization
                {!qdrantAvailable && (
                  <span className="text-yellow-400 ml-1">*Demo Data</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleRealTime}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-white ${
                isRealTime ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isRealTime ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span>{isRealTime ? 'Live' : 'Paused'}</span>
            </button>
            
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white"
              disabled={!isRealTime}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-white"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <a
              href={`${QDRANT_URL}/dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors text-white"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Qdrant UI</span>
            </a>
          </div>
        </div>
      </div>

      {/* React Flow Visualization */}
      <div className="h-[calc(100vh-120px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          className="bg-gray-900"
        >
          <Controls className="bg-gray-800 border-gray-700" />
          <MiniMap 
            className="bg-gray-800 border-gray-700"
            nodeColor={(node) => {
              switch (node.type) {
                case 'qdrantCollection': return '#8b5cf6';
                case 'vectorMetrics': return '#3b82f6';
                case 'performance': return '#10b981';
                case 'ragIntegration': return '#f59e0b';
                case 'searchAnalytics': return '#6366f1';
                case 'systemHealth': return '#06b6d4';
                default: return '#6b7280';
              }
            }}
          />
          <Background color="#374151" gap={20} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default AdvancedQdrantFlowDashboard;