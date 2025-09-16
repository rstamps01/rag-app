import { useState, useEffect, useCallback, useMemo } from 'react';
import useWebSocket from './useWebSocket';

/**
 * Enhanced hook for real-time pipeline visualization with React Flow
 * 
 * This hook integrates WebSocket data with React Flow visualization,
 * providing real-time updates for pipeline nodes and edges.
 * 
 * @param {string} websocketUrl - WebSocket URL for real-time data
 * @param {Object} options - Configuration options
 * @returns {Object} Pipeline flow state and handlers
 */
const usePipelineFlow = (websocketUrl = '/ws/pipeline-monitoring', options = {}) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pipelineData, setPipelineData] = useState(null);
  
  const { 
    onNodeClick: customOnNodeClick,
    onNodeHover: customOnNodeHover,
    debug = false 
  } = options;
  
  // WebSocket connection
  const { data: metrics, connectionStatus, isConnected: wsConnected } = useWebSocket(websocketUrl, {
    onMessage: (data) => {
      if (data.type === 'metrics_update') {
        setPipelineData(data.data);
        if (debug) console.log('🔄 Pipeline data updated:', data.data);
      }
    },
    onConnect: () => {
      setIsConnected(true);
      if (debug) console.log('🔌 Pipeline WebSocket connected');
    },
    onDisconnect: () => {
      setIsConnected(false);
      if (debug) console.log('🔌 Pipeline WebSocket disconnected');
    }
  });
  
  // Transform real-time data to pipeline visualization format
  const transformToPipelineData = useCallback((rawMetrics) => {
    if (!rawMetrics) return { nodes: [], edges: [] };
    
    const { system_health, gpu_performance, pipeline_status, connection_status } = rawMetrics;
    
    // Define pipeline stages with real-time data
    const stages = [
      {
        id: 'query-input',
        label: 'Query Input',
        status: pipeline_status?.active_queries > 0 ? 'active' : 'idle',
        health: calculateHealth(pipeline_status),
        metrics: {
          throughput: pipeline_status?.queries_per_minute || 0,
          latency: pipeline_status?.avg_response_time || 0,
          active_queries: pipeline_status?.active_queries || 0,
          error_rate: 0 // Calculate from error tracking
        }
      },
      {
        id: 'vector-search',
        label: 'Vector Search',
        status: connection_status?.vector_db_status === 'healthy' ? 'idle' : 'error',
        health: connection_status?.vector_db_status === 'healthy' ? 'healthy' : 'critical',
        metrics: {
          search_latency: (pipeline_status?.avg_response_time || 0) * 0.3,
          results_count: 0,
          collection_health: connection_status?.vector_db_status || 'unknown'
        }
      },
      {
        id: 'llm-processing',
        label: 'LLM Processing',
        status: pipeline_status?.active_queries > 0 ? 'processing' : 'idle',
        health: calculateLLMHealth(gpu_performance),
        metrics: {
          gpu_utilization: gpu_performance?.[0]?.utilization || 0,
          gpu_memory: gpu_performance?.[0]?.memory_used || 0,
          processing_time: (pipeline_status?.avg_response_time || 0) * 0.7,
          temperature: gpu_performance?.[0]?.temperature || 0
        }
      },
      {
        id: 'response',
        label: 'Response Delivery',
        status: pipeline_status?.active_queries > 0 ? 'active' : 'idle',
        health: 'healthy',
        metrics: {
          response_time: pipeline_status?.avg_response_time || 0,
          success_rate: 100,
          throughput: pipeline_status?.queries_per_minute || 0
        }
      },
      {
        id: 'resource-monitor',
        label: 'Resource Monitor',
        status: 'active',
        health: calculateSystemHealth(system_health),
        metrics: {
          cpu_percent: system_health?.cpu_percent || 0,
          memory_percent: system_health?.memory_percent || 0,
          memory_available: system_health?.memory_available || '0GB',
          gpu_utilization: gpu_performance?.[0]?.utilization || 0,
          gpu_temperature: gpu_performance?.[0]?.temperature || 0
        }
      }
    ];
    
    // Convert stages to React Flow nodes
    const pipelineNodes = stages.map((stage, idx) => ({
      id: stage.id,
      type: 'stage',
      position: { x: idx * 250, y: Math.sin(idx * 0.5) * 50 },
      data: stage,
      selected: selectedNodeId === stage.id
    }));
    
    // Define connections between stages
    const pipelineEdges = [
      {
        id: 'query-to-vector',
        source: 'query-input',
        target: 'vector-search',
        animated: (pipeline_status?.queries_per_minute || 0) > 0,
        data: { 
          throughput: pipeline_status?.queries_per_minute || 0,
          latency: (pipeline_status?.avg_response_time || 0) * 0.3
        }
      },
      {
        id: 'vector-to-llm',
        source: 'vector-search',
        target: 'llm-processing',
        animated: (pipeline_status?.queries_per_minute || 0) > 0,
        data: { 
          throughput: pipeline_status?.queries_per_minute || 0,
          latency: (pipeline_status?.avg_response_time || 0) * 0.4
        }
      },
      {
        id: 'llm-to-response',
        source: 'llm-processing',
        target: 'response',
        animated: (pipeline_status?.queries_per_minute || 0) > 0,
        data: { 
          throughput: pipeline_status?.queries_per_minute || 0,
          latency: (pipeline_status?.avg_response_time || 0) * 0.3
        }
      }
    ];
    
    return {
      nodes: pipelineNodes,
      edges: pipelineEdges,
      stages,
      system_health,
      gpu_performance,
      pipeline_status,
      connection_status
    };
  }, [selectedNodeId]);
  
  // Helper functions for health calculations
  const calculateHealth = (metrics) => {
    if (!metrics) return 'unknown';
    if (metrics.error_rate > 0.1) return 'critical';
    if (metrics.avg_response_time > 5000) return 'warning';
    return 'healthy';
  };
  
  const calculateLLMHealth = (gpuMetrics) => {
    if (!gpuMetrics || gpuMetrics.length === 0) return 'unknown';
    const gpu = gpuMetrics[0];
    if (gpu.temperature > 85) return 'critical';
    if (gpu.utilization > 95) return 'warning';
    return 'healthy';
  };
  
  const calculateSystemHealth = (systemMetrics) => {
    if (!systemMetrics) return 'unknown';
    if (systemMetrics.cpu_percent > 90 || systemMetrics.memory_percent > 90) return 'critical';
    if (systemMetrics.cpu_percent > 80 || systemMetrics.memory_percent > 80) return 'warning';
    return 'healthy';
  };
  
  // Update nodes and edges when pipeline data changes
  useEffect(() => {
    if (pipelineData) {
      const transformedData = transformToPipelineData(pipelineData);
      setNodes(transformedData.nodes);
      setEdges(transformedData.edges);
    }
  }, [pipelineData, transformToPipelineData]);
  
  // Handle node click events
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    if (debug) console.log('🖱️ Node clicked:', node);
    
    if (customOnNodeClick) {
      customOnNodeClick(event, node);
    }
  }, [customOnNodeClick, debug]);
  
  // Handle node hover events
  const handleNodeHover = useCallback((event, node) => {
    setHoveredNodeId(node.id);
    if (debug) console.log('🖱️ Node hovered:', node);
    
    if (customOnNodeHover) {
      customOnNodeHover(event, node);
    }
  }, [customOnNodeHover, debug]);
  
  // Get selected node data
  const selectedNode = useMemo(() => {
    return nodes.find(node => node.id === selectedNodeId);
  }, [nodes, selectedNodeId]);
  
  // Get hovered node data
  const hoveredNode = useMemo(() => {
    return nodes.find(node => node.id === hoveredNodeId);
  }, [nodes, hoveredNodeId]);
  
  // Pipeline statistics
  const pipelineStats = useMemo(() => {
    if (!pipelineData) return null;
    
    const { pipeline_status, system_health, gpu_performance } = pipelineData;
    
    return {
      totalQueries: pipeline_status?.queries_per_minute || 0,
      avgResponseTime: pipeline_status?.avg_response_time || 0,
      activeQueries: pipeline_status?.active_queries || 0,
      cpuUsage: system_health?.cpu_percent || 0,
      memoryUsage: system_health?.memory_percent || 0,
      gpuUtilization: gpu_performance?.[0]?.utilization || 0,
      gpuTemperature: gpu_performance?.[0]?.temperature || 0,
      isConnected: isConnected
    };
  }, [pipelineData, isConnected]);
  
  return {
    // React Flow data
    nodes,
    edges,
    selectedNodeId,
    hoveredNodeId,
    selectedNode,
    hoveredNode,
    
    // Connection status
    isConnected,
    connectionStatus,
    
    // Event handlers
    handleNodeClick,
    handleNodeHover,
    
    // Pipeline data
    pipelineData,
    pipelineStats,
    
    // Utility functions
    setSelectedNodeId,
    setHoveredNodeId
  };
};

export default usePipelineFlow;
