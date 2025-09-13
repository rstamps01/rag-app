/**
 * RAG Pipeline Flow Component
 * React Flow-based visualization of the RAG data processing pipeline
 * Integrates VAST Data branding and real-time monitoring
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import { 
  Database, 
  Cpu, 
  Brain, 
  FileText, 
  Zap,
  Activity,
  TrendingUp,
  Clock,
  Users,
  Server
} from 'lucide-react';

// Custom Node Components
const QueryInputNode = ({ data, selected }) => (
  <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] ${
    selected ? 'border-vast-primary' : 'border-gray-300'
  } ${data.status === 'active' ? 'bg-vast-primary/10' : 'bg-white'}`}>
    <div className="flex items-center space-x-2">
      <FileText className="w-5 h-5 text-vast-primary" />
      <div>
        <div className="text-sm font-bold text-vast-neutral">Query Input</div>
        <div className="text-xs text-gray-600">
          Status: <span className={`font-semibold ${
            data.status === 'active' ? 'text-green-600' : 'text-gray-500'
          }`}>{data.status}</span>
        </div>
      </div>
    </div>
    {data.currentQuery && (
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
        <div className="font-semibold">Current Query:</div>
        <div className="truncate">{data.currentQuery}</div>
      </div>
    )}
    <div className="mt-2 text-xs text-gray-600">
      Throughput: <span className="font-semibold text-vast-primary">{data.throughput || 0}/min</span>
    </div>
  </div>
);

const VectorSearchNode = ({ data, selected }) => (
  <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] ${
    selected ? 'border-vast-secondary' : 'border-gray-300'
  } ${data.status === 'connected' ? 'bg-vast-secondary/10' : 'bg-white'}`}>
    <div className="flex items-center space-x-2">
      <Database className="w-5 h-5 text-vast-secondary" />
      <div>
        <div className="text-sm font-bold text-vast-neutral">Vector Search</div>
        <div className="text-xs text-gray-600">
          Status: <span className={`font-semibold ${
            data.status === 'connected' ? 'text-green-600' : 'text-red-600'
          }`}>{data.status}</span>
        </div>
      </div>
    </div>
    <div className="mt-2 space-y-1">
      <div className="text-xs text-gray-600">
        Latency: <span className="font-semibold text-vast-secondary">{data.latency || 0}ms</span>
      </div>
      <div className="text-xs text-gray-600">
        Results: <span className="font-semibold text-vast-secondary">{data.results || 0}</span>
      </div>
    </div>
  </div>
);

const LLMProcessingNode = ({ data, selected }) => (
  <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] ${
    selected ? 'border-vast-accent' : 'border-gray-300'
  } ${data.status === 'processing' ? 'bg-vast-accent/10' : 'bg-white'}`}>
    <div className="flex items-center space-x-2">
      <Brain className="w-5 h-5 text-vast-accent" />
      <div>
        <div className="text-sm font-bold text-vast-neutral">LLM Processing</div>
        <div className="text-xs text-gray-600">
          Model: <span className="font-semibold text-vast-accent">Mistral-7B</span>
        </div>
      </div>
    </div>
    <div className="mt-2 space-y-1">
      <div className="text-xs text-gray-600">
        Status: <span className={`font-semibold ${
          data.status === 'processing' ? 'text-yellow-600' : 
          data.status === 'idle' ? 'text-gray-600' : 'text-green-600'
        }`}>{data.status || 'idle'}</span>
      </div>
      <div className="text-xs text-gray-600">
        Tokens/sec: <span className="font-semibold text-vast-accent">{data.tokensPerSec || 0}</span>
      </div>
    </div>
  </div>
);

const ResponseGenerationNode = ({ data, selected }) => (
  <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] ${
    selected ? 'border-green-500' : 'border-gray-300'
  } ${data.status === 'generating' ? 'bg-green-100' : 'bg-white'}`}>
    <div className="flex items-center space-x-2">
      <Zap className="w-5 h-5 text-green-500" />
      <div>
        <div className="text-sm font-bold text-vast-neutral">Response Generation</div>
        <div className="text-xs text-gray-600">
          Status: <span className={`font-semibold ${
            data.status === 'generating' ? 'text-yellow-600' : 'text-green-600'
          }`}>{data.status || 'ready'}</span>
        </div>
      </div>
    </div>
    <div className="mt-2 space-y-1">
      <div className="text-xs text-gray-600">
        Length: <span className="font-semibold text-green-600">{data.responseLength || 0} chars</span>
      </div>
      <div className="text-xs text-gray-600">
        Confidence: <span className="font-semibold text-green-600">{data.confidence || 0}%</span>
      </div>
    </div>
  </div>
);

const ResourceMonitorNode = ({ data, selected }) => (
  <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] ${
    selected ? 'border-purple-500' : 'border-gray-300'
  } bg-purple-50`}>
    <div className="flex items-center space-x-2">
      <Activity className="w-5 h-5 text-purple-500" />
      <div>
        <div className="text-sm font-bold text-vast-neutral">Resource Monitor</div>
        <div className="text-xs text-gray-600">RTX 5090</div>
      </div>
    </div>
    <div className="mt-2 space-y-1">
      <div className="text-xs text-gray-600">
        GPU: <span className="font-semibold text-purple-600">{data.gpuUtilization || 0}%</span>
      </div>
      <div className="text-xs text-gray-600">
        Memory: <span className="font-semibold text-purple-600">{data.memoryUsage || 0}%</span>
      </div>
      <div className="text-xs text-gray-600">
        Temp: <span className="font-semibold text-purple-600">{data.temperature || 0}°C</span>
      </div>
    </div>
  </div>
);

// Custom Node Types
const nodeTypes = {
  queryNode: QueryInputNode,
  vectorNode: VectorSearchNode,
  llmNode: LLMProcessingNode,
  responseNode: ResponseGenerationNode,
  monitorNode: ResourceMonitorNode
};

// Custom Edge Styles
const getEdgeStyle = (edge) => {
  const baseStyle = {
    strokeWidth: 2,
    strokeDasharray: '5,5'
  };

  if (edge.data?.throughput > 0) {
    return {
      ...baseStyle,
      stroke: '#00D4AA',
      strokeDasharray: 'none'
    };
  }

  return {
    ...baseStyle,
    stroke: '#9CA3AF'
  };
};

const RAGPipelineFlow = ({ metrics, isConnected, onNodeSelect }) => {
  const { fitView } = useReactFlow();
  
  // Initial pipeline nodes
  const initialNodes = useMemo(() => [
    {
      id: 'query-input',
      type: 'queryNode',
      position: { x: 100, y: 200 },
      data: { 
        status: 'active',
        currentQuery: null,
        throughput: 0
      }
    },
    {
      id: 'vector-search',
      type: 'vectorNode',
      position: { x: 400, y: 200 },
      data: {
        status: 'connected',
        latency: 0,
        results: 0
      }
    },
    {
      id: 'llm-processing',
      type: 'llmNode',
      position: { x: 700, y: 200 },
      data: {
        status: 'idle',
        tokensPerSec: 0
      }
    },
    {
      id: 'response-generation',
      type: 'responseNode',
      position: { x: 1000, y: 200 },
      data: {
        status: 'ready',
        responseLength: 0,
        confidence: 0
      }
    },
    {
      id: 'resource-monitor',
      type: 'monitorNode',
      position: { x: 400, y: 400 },
      data: {
        gpuUtilization: 0,
        memoryUsage: 0,
        temperature: 0
      }
    }
  ], []);

  // Initial pipeline edges
  const initialEdges = useMemo(() => [
    {
      id: 'query-to-vector',
      source: 'query-input',
      target: 'vector-search',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#00D4AA'
      },
      data: { throughput: 0 }
    },
    {
      id: 'vector-to-llm',
      source: 'vector-search',
      target: 'llm-processing',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#0066CC'
      },
      data: { throughput: 0 }
    },
    {
      id: 'llm-to-response',
      source: 'llm-processing',
      target: 'response-generation',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#FF6B35'
      },
      data: { throughput: 0 }
    },
    {
      id: 'monitor-connection',
      source: 'resource-monitor',
      target: 'llm-processing',
      type: 'straight',
      style: { stroke: '#8B5CF6', strokeWidth: 1 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8B5CF6'
      }
    }
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes with real-time metrics
  useEffect(() => {
    if (metrics) {
      setNodes(prevNodes => 
        prevNodes.map(node => {
          switch (node.id) {
            case 'query-input':
              return {
                ...node,
                data: {
                  ...node.data,
                  throughput: metrics.pipeline_status?.queries_per_minute || 0,
                  currentQuery: metrics.current_query || null
                }
              };
            case 'vector-search':
              return {
                ...node,
                data: {
                  ...node.data,
                  status: metrics.connection_status?.vector_db_status === 'connected' ? 'connected' : 'disconnected',
                  latency: metrics.vector_performance?.search_latency || 0,
                  results: metrics.vector_performance?.results_count || 0
                }
              };
            case 'llm-processing':
              return {
                ...node,
                data: {
                  ...node.data,
                  status: metrics.llm_performance?.status || 'idle',
                  tokensPerSec: metrics.llm_performance?.tokens_per_second || 0
                }
              };
            case 'response-generation':
              return {
                ...node,
                data: {
                  ...node.data,
                  status: metrics.response_performance?.status || 'ready',
                  responseLength: metrics.response_performance?.length || 0,
                  confidence: metrics.response_performance?.confidence || 0
                }
              };
            case 'resource-monitor':
              return {
                ...node,
                data: {
                  ...node.data,
                  gpuUtilization: metrics.gpu_performance?.[0]?.utilization || 0,
                  memoryUsage: metrics.gpu_performance?.[0]?.memory_used || 0,
                  temperature: metrics.gpu_performance?.[0]?.temperature || 0
                }
              };
            default:
              return node;
          }
        })
      );

      // Update edge animations based on throughput
      setEdges(prevEdges =>
        prevEdges.map(edge => ({
          ...edge,
          animated: (edge.data?.throughput || 0) > 0,
          data: {
            ...edge.data,
            throughput: metrics.pipeline_status?.queries_per_minute || 0
          }
        }))
      );
    }
  }, [metrics, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    onNodeSelect(node);
  }, [onNodeSelect]);

  return (
    <div className="w-full h-full bg-vast-dark">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeOptions={{
          style: getEdgeStyle,
          animated: true
        }}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls className="bg-white/90 backdrop-blur-sm" />
        <MiniMap 
          className="bg-white/90 backdrop-blur-sm"
          nodeColor={(node) => {
            switch (node.type) {
              case 'queryNode': return '#00D4AA';
              case 'vectorNode': return '#0066CC';
              case 'llmNode': return '#FF6B35';
              case 'responseNode': return '#10B981';
              case 'monitorNode': return '#8B5CF6';
              default: return '#9CA3AF';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background 
          color="#374151" 
          gap={20} 
          size={1}
          variant="dots"
        />
        
        {/* Status Panel */}
        <Panel position="top-right" className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-sm font-semibold text-vast-neutral">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Pipeline Status: <span className="font-semibold text-vast-primary">
                {metrics?.pipeline_status?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </Panel>

        {/* Metrics Panel */}
        <Panel position="bottom-left" className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-vast-neutral">CPU</div>
              <div className="text-vast-primary font-bold">
                {metrics?.system_health?.cpu_percent || 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-vast-neutral">Memory</div>
              <div className="text-vast-secondary font-bold">
                {metrics?.system_health?.memory_percent || 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-vast-neutral">GPU</div>
              <div className="text-vast-accent font-bold">
                {metrics?.gpu_performance?.[0]?.utilization || 0}%
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default RAGPipelineFlow;
