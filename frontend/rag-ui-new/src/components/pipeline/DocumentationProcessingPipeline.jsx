import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import custom node components
import DocumentIngestionNode from './DocumentIngestionNode';
import TextProcessingNode from './TextProcessingNode';
import EmbeddingGenerationNode from './EmbeddingGenerationNode';
import VectorStorageNode from './VectorStorageNode';
import ResourceMonitorNode from './ResourceMonitorNode';

// Import real-time data hook
import { useRealTimePipelineData } from '../../hooks/useRealTimePipelineData';

// Import VAST Data styles
import '../../styles/vast-colors.css';

// Define custom node types
const nodeTypes = {
  documentIngestionNode: DocumentIngestionNode,
  textProcessingNode: TextProcessingNode,
  embeddingGenerationNode: EmbeddingGenerationNode,
  vectorStorageNode: VectorStorageNode,
  monitorNode: ResourceMonitorNode,
};

// Documentation processing pipeline layout
const initialNodes = [
  {
    id: 'document-ingestion',
    type: 'documentIngestionNode',
    position: { x: 80, y: 120 },
    data: {
      status: 'active',
      documentsProcessed: 1247, // * Placeholder data
      processingRate: 15, // * Placeholder data
      queueSize: 3, // * Placeholder data
      supportedFormats: ['PDF', 'DOCX', 'TXT', 'MD'],
      lastProcessed: 'user_manual_v2.1.pdf', // * Placeholder data
      label: 'Document Ingestion'
    }
  },
  {
    id: 'text-processing',
    type: 'textProcessingNode',
    position: { x: 400, y: 120 },
    data: {
      status: 'processing',
      chunksCreated: 2847, // * Placeholder data
      processingTime: 2500, // * Placeholder data
      chunkSize: 512,
      textExtracted: 125000, // * Placeholder data
      language: 'en',
      label: 'Text Processing'
    }
  },
  {
    id: 'embedding-generation',
    type: 'embeddingGenerationNode',
    position: { x: 720, y: 120 },
    data: {
      status: 'processing',
      embeddingsGenerated: 2847, // * Placeholder data
      modelName: 'text-embedding-ada-002',
      embeddingDimension: 1536,
      processingTime: 4500, // * Placeholder data
      tokensProcessed: 125000, // * Placeholder data
      label: 'Embedding Generation'
    }
  },
  {
    id: 'vector-storage',
    type: 'vectorStorageNode',
    position: { x: 1040, y: 120 },
    data: {
      status: 'success',
      vectorsStored: 2847, // * Placeholder data
      storageUsed: 45, // * Placeholder data
      storageTotal: 100, // * Placeholder data
      indexingTime: 1200, // * Placeholder data
      collectionName: 'documents',
      label: 'Vector Storage'
    }
  },
  {
    id: 'resource-monitor-docs',
    type: 'monitorNode',
    position: { x: 560, y: 350 },
    data: {
      status: 'active',
      cpuUsage: 25.1, // * Placeholder data
      memoryUsage: 45.2, // * Placeholder data
      gpuUsage: 15.0, // * Placeholder data
      temperature: 45, // * Placeholder data
      networkThroughput: 85.5, // * Placeholder data
      uptime: 72, // * Placeholder data
      label: 'Resource Monitor'
    }
  }
];

const initialEdges = [
  {
    id: 'docs-to-text',
    source: 'document-ingestion',
    target: 'text-processing',
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#3B82F6', 
      strokeWidth: 3,
      strokeOpacity: 0.9
    },
    className: 'vast-edge curved animated',
    data: { documents: 15, label: 'Documents*' } // * Placeholder data
  },
  {
    id: 'text-to-embedding',
    source: 'text-processing',
    target: 'embedding-generation',
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#3B82F6', 
      strokeWidth: 3,
      strokeOpacity: 0.9
    },
    className: 'vast-edge curved animated',
    data: { chunks: 2847, label: 'Text Chunks*' } // * Placeholder data
  },
  {
    id: 'embedding-to-storage',
    source: 'embedding-generation',
    target: 'vector-storage',
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#3B82F6', 
      strokeWidth: 3,
      strokeOpacity: 0.9
    },
    className: 'vast-edge curved animated',
    data: { embeddings: 2847, label: 'Embeddings*' } // * Placeholder data
  },
  {
    id: 'monitor-connection-docs',
    source: 'resource-monitor-docs',
    target: 'embedding-generation',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitoring' }
  }
];

const DocumentationProcessingPipeline = () => {
  // Real-time data hook
  const { 
    isConnected, 
    isLoading, 
    error, 
    pipelineData, 
    systemMetrics, 
    refresh, 
    reconnect 
  } = useRealTimePipelineData();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [connectionMode, setConnectionMode] = useState('normal');
  const [sourceHandle, setSourceHandle] = useState(null);

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    console.log('Selected node:', node);
  }, []);

  // Handle edge click for selection
  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    console.log('Selected edge:', edge);
  }, []);

  // Handle connection start
  const onConnectStart = useCallback((event, { nodeId, handleType, handleId }) => {
    if (connectionMode === 'adding') {
      setSourceHandle({ nodeId, handleType, handleId });
      console.log('Connection started from:', nodeId, handleType, handleId);
    }
  }, [connectionMode]);

  // Handle connection end
  const onConnectEnd = useCallback((event, { nodeId, handleType, handleId }) => {
    if (connectionMode === 'adding' && sourceHandle) {
      console.log('Connection ended at:', nodeId, handleType, handleId);
    }
  }, [connectionMode, sourceHandle]);

  // Handle edge connection
  const onConnect = useCallback(
    (params) => {
      if (connectionMode === 'adding' && sourceHandle) {
        const newEdge = {
          ...params,
          id: `edge-${params.source}-${params.target}-${Date.now()}`,
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#3B82F6', 
            strokeWidth: 3,
            strokeOpacity: 0.9
          },
          className: 'vast-edge curved animated',
          sourceHandle: sourceHandle.handleId,
          targetHandle: params.targetHandle
        };
        setEdges((eds) => addEdge(newEdge, eds));
        setConnectionMode('normal');
        setSourceHandle(null);
        console.log('Connection created:', newEdge);
      } else if (connectionMode === 'normal') {
        const newEdge = {
          ...params,
          id: `edge-${params.source}-${params.target}-${Date.now()}`,
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#3B82F6', 
            strokeWidth: 3,
            strokeOpacity: 0.9
          },
          className: 'vast-edge curved animated'
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [setEdges, connectionMode, sourceHandle]
  );

  // Update nodes with real-time data for documentation processing
  useEffect(() => {
    if (!pipelineData) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === 'document-ingestion' && pipelineData.queryInput) {
          return {
            ...node,
            data: {
              ...node.data,
              documentsProcessed: pipelineData.queryInput.throughput * 10,
              processingRate: pipelineData.queryInput.throughput,
              queueSize: pipelineData.queryInput.queueDepth,
              status: pipelineData.queryInput.status
            },
          };
        }
        if (node.id === 'text-processing' && pipelineData.vectorSearch) {
          return {
            ...node,
            data: {
              ...node.data,
              chunksCreated: pipelineData.vectorSearch.resultsCount * 100,
              processingTime: pipelineData.vectorSearch.latency * 50,
              textExtracted: pipelineData.vectorSearch.resultsCount * 1000,
              status: pipelineData.vectorSearch.status
            },
          };
        }
        if (node.id === 'embedding-generation' && pipelineData.llmProcessing) {
          return {
            ...node,
            data: {
              ...node.data,
              embeddingsGenerated: pipelineData.llmProcessing.tokensGenerated * 2,
              processingTime: pipelineData.llmProcessing.processingTime,
              tokensProcessed: pipelineData.llmProcessing.tokensGenerated,
              status: pipelineData.llmProcessing.status
            },
          };
        }
        if (node.id === 'vector-storage' && pipelineData.responseGeneration) {
          return {
            ...node,
            data: {
              ...node.data,
              vectorsStored: pipelineData.responseGeneration.totalResponses * 2,
              storageUsed: Math.floor(pipelineData.responseGeneration.avgResponseTime / 100),
              status: pipelineData.responseGeneration.status
            },
          };
        }
        if (node.id === 'resource-monitor-docs' && pipelineData.resourceMonitor) {
          return {
            ...node,
            data: {
              ...node.data,
              ...pipelineData.resourceMonitor
            },
          };
        }
        return node;
      })
    );

    // Update edges with real-time data
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === 'docs-to-text' && pipelineData.queryInput) {
          return {
            ...edge,
            data: { documents: pipelineData.queryInput.throughput }
          };
        }
        if (edge.id === 'text-to-embedding' && pipelineData.vectorSearch) {
          return {
            ...edge,
            data: { chunks: pipelineData.vectorSearch.resultsCount * 100 }
          };
        }
        if (edge.id === 'embedding-to-storage' && pipelineData.llmProcessing) {
          return {
            ...edge,
            data: { embeddings: pipelineData.llmProcessing.tokensGenerated * 2 }
          };
        }
        return edge;
      })
    );
  }, [pipelineData, setNodes, setEdges]);

  // Toggle animation
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: !isAnimating
      }))
    );
  };

  // Start adding connection mode
  const startAddingConnection = () => {
    setConnectionMode('adding');
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  // Cancel connection mode
  const cancelConnectionMode = () => {
    setConnectionMode('normal');
    setSourceHandle(null);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  // Remove selected edge
  const removeSelectedEdge = () => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        background: 'var(--bg-primary)'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to real-time data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        background: 'var(--bg-primary)'
      }}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">Connection Error</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={reconnect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            🔄 Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      background: 'var(--bg-primary)'
    }}>
      {/* Dark Theme Toolbar */}
      <div className="absolute top-6 left-6 z-10 flex flex-col space-y-3">
        <div className="flex space-x-3">
          <button
            onClick={toggleAnimation}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isAnimating 
                ? 'bg-amber-600 text-white shadow-lg hover:bg-amber-700 hover:shadow-glow-primary' 
                : 'bg-green-600 text-white shadow-lg hover:bg-green-700 hover:shadow-glow-primary'
            }`}
          >
            {isAnimating ? '⏸️ Pause' : '▶️ Play'} Animation
          </button>
          
          {/* Connection Status */}
          <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isConnected 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 hover:shadow-glow-primary transition-all duration-200"
          >
            🔄 Refresh
          </button>
          
          <button
            onClick={cancelConnectionMode}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 hover:shadow-glow-primary transition-all duration-200"
          >
            Clear Selection
          </button>
          
          <button
            onClick={startAddingConnection}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              connectionMode === 'adding' 
                ? 'bg-green-700 text-white shadow-lg' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-glow-primary'
            }`}
          >
            {connectionMode === 'adding' ? '🔄 Adding...' : '➕ Add Connection'}
          </button>
          
          <button
            onClick={removeSelectedEdge}
            disabled={!selectedEdge}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedEdge 
                ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-glow-primary' 
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            ➖ Remove Selected
          </button>
        </div>
        
        {/* Connection Mode Status */}
        {connectionMode !== 'normal' && (
          <div className="px-4 py-2 bg-blue-800 text-blue-100 rounded-lg text-sm font-medium border border-blue-600">
            {connectionMode === 'adding' && !sourceHandle && '🔄 Adding Mode: Click on a connection point to start, then click target point'}
            {connectionMode === 'adding' && sourceHandle && `🔄 Adding Mode: Selected ${sourceHandle.handleId} from ${sourceHandle.nodeId} - Click target point`}
            {connectionMode === 'removing' && '🗑️ Removing Mode: Click on a connection to select it, then click Remove'}
          </div>
        )}
        
        {/* Selection Status */}
        {(selectedNode || selectedEdge) && (
          <div className="px-4 py-2 bg-green-800 text-green-100 rounded-lg text-sm font-medium border border-green-600">
            {selectedNode && `📦 Selected: ${selectedNode.data.label || selectedNode.type}`}
            {selectedEdge && `🔗 Selected: ${selectedEdge.source} → ${selectedEdge.target}`}
          </div>
        )}
      </div>

      {/* Documentation Processing Pipeline Visualization */}
      <ReactFlow
        nodes={nodes}
        edges={edges.map(edge => ({
          ...edge,
          className: selectedEdge && selectedEdge.id === edge.id 
            ? 'vast-edge curved animated selected' 
            : 'vast-edge curved animated'
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#3B82F6', 
            strokeWidth: 3,
            strokeOpacity: 0.9
          },
          className: 'vast-edge curved animated'
        }}
        connectionMode="loose"
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        selectionKeyCode={null}
        nodesDraggable={connectionMode === 'normal'}
        nodesConnectable={true}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.1, minZoom: 0.5, maxZoom: 1.5 }}
        attributionPosition="bottom-left"
        className="professional-pipeline-flow"
        style={{ background: 'transparent' }}
      >
        <Background 
          variant="dots" 
          gap={24} 
          size={1.2} 
          color="var(--vast-neutral)"
          className="opacity-30"
        />
        <Controls 
          className="professional-controls"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--vast-neutral)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            padding: '8px'
          }}
        />
        <MiniMap 
          className="professional-minimap"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--vast-neutral)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}
          nodeColor={(node) => {
            switch (node.type) {
              case 'documentIngestionNode': return '#00FF88';
              case 'textProcessingNode': return '#00CC6A';
              case 'embeddingGenerationNode': return '#00FF88';
              case 'vectorStorageNode': return '#33FF99';
              case 'monitorNode': return '#4A5568';
              default: return '#4A5568';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Dark Theme Node Details Panel */}
      {selectedNode && (
        <div className="absolute top-6 right-6 w-96 rounded-xl shadow-2xl border overflow-hidden" style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--vast-neutral)'
        }}>
          <div className="px-6 py-4 border-b" style={{
            background: 'linear-gradient(90deg, var(--bg-secondary), var(--bg-hover))',
            borderColor: 'var(--vast-neutral)'
          }}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedNode.data.label || selectedNode.type}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg transition-all duration-200 hover:shadow-glow-primary"
                style={{ 
                  color: 'var(--text-secondary)',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--vast-primary)';
                  e.target.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--text-secondary)';
                  e.target.style.background = 'transparent';
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {Object.entries(selectedNode.data)
              .filter(([key]) => key !== 'label')
              .map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b last:border-b-0" style={{
                borderColor: 'var(--vast-neutral)'
              }}>
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationProcessingPipeline;
