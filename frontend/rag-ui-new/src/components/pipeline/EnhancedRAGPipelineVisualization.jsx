import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import QueryInputNode from './QueryInputNode';
import VectorSearchNode from './VectorSearchNode';
import LLMProcessingNode from './LLMProcessingNode';
import ResponseGenerationNode from './ResponseGenerationNode';
import ResourceMonitorNode from './ResourceMonitorNode';
import DocumentIngestionNode from './DocumentIngestionNode';
import TextProcessingNode from './TextProcessingNode';
import EmbeddingGenerationNode from './EmbeddingGenerationNode';
import VectorStorageNode from './VectorStorageNode';

// Import real-time data hook
import { useRealTimePipelineData } from '../../hooks/useRealTimePipelineData';

// Import VAST Data styles
import '../../styles/vast-colors.css';

// Define custom node types
const nodeTypes = {
  queryNode: QueryInputNode,
  vectorNode: VectorSearchNode,
  llmNode: LLMProcessingNode,
  responseNode: ResponseGenerationNode,
  monitorNode: ResourceMonitorNode,
  documentNode: DocumentIngestionNode,
  textNode: TextProcessingNode,
  embeddingNode: EmbeddingGenerationNode,
  storageNode: VectorStorageNode,
};

        // Professional ERD-style pipeline layout with adjusted positioning
        const initialNodes = [
          // QUERY PROCESSING PIPELINE (Upper Section) - Bottom aligned and evenly spaced
          {
            id: 'query-input',
            type: 'queryNode',
            position: { x: 100, y: 100 },
            data: {
              status: 'active',
              currentQuery: 'Query 372', // * Placeholder data
              throughput: 6, // * Placeholder data
              queueDepth: 1, // * Placeholder data
              label: 'Query Input'
            }
          },
          {
            id: 'vector-search',
            type: 'vectorNode',
            position: { x: 500, y: 100 },
            data: {
              status: 'processing',
              latency: 22, // * Placeholder data
              resultsCount: 3, // * Placeholder data
              accuracy: 99.9, // * Placeholder data
              vectorCount: 132001, // * Placeholder data
              searchTime: 41, // * Placeholder data
              label: 'Vector Search'
            }
          },
          {
            id: 'llm-processing',
            type: 'llmNode',
            position: { x: 900, y: 100 },
            data: {
              status: 'processing',
              modelLoad: 4, // * Placeholder data
              tokensGenerated: 541, // * Placeholder data
              processingTime: 1800, // * Placeholder data
              gpuUsage: 4, // * Placeholder data
              memoryUsage: 2.2, // * Placeholder data
              temperature: 60, // * Placeholder data
              label: 'LLM Processing'
            }
          },
          {
            id: 'response-generation',
            type: 'responseNode',
            position: { x: 1300, y: 100 },
            data: {
              status: 'success',
              responseLength: 426, // * Placeholder data
              deliveryTime: 50, // * Placeholder data
              successRate: 99.9, // * Placeholder data
              totalResponses: 1177, // * Placeholder data
              avgResponseTime: 1800, // * Placeholder data
              label: 'Response Generation'
            }
          },
          
          // CENTRAL RESOURCE MONITOR - Moved down 3 inches (288px)
          {
            id: 'resource-monitor',
            type: 'monitorNode',
            position: { x: 700, y: 638 },
            data: {
              status: 'active',
              cpuUsage: 1.3, // * Placeholder data
              memoryUsage: 22.3, // * Placeholder data
              gpuUsage: 4.0, // * Placeholder data
              temperature: 60, // * Placeholder data
              networkThroughput: 108.6, // * Placeholder data
              uptime: 123, // * Placeholder data
              label: 'Resource Monitor'
            }
          },
          
          // DOCUMENT PROCESSING PIPELINE (Lower Section) - Moved down 6 inches (576px) and top aligned
          {
            id: 'document-ingestion',
            type: 'documentNode',
            position: { x: 100, y: 1176 },
            data: {
              status: 'active',
              documentsProcessed: 15, // * Placeholder data
              processingRate: 2.5, // * Placeholder data
              queueSize: 3, // * Placeholder data
              supportedFormats: ['PDF', 'DOCX', 'TXT'],
              lastProcessed: '2024-01-15 14:30', // * Placeholder data
              label: 'Document Ingestion'
            }
          },
          {
            id: 'text-processing',
            type: 'textNode',
            position: { x: 500, y: 1176 },
            data: {
              status: 'processing',
              chunksProcessed: 0, // * Placeholder data
              processingRate: 0, // * Placeholder data
              avgChunkSize: 512, // * Placeholder data
              languagesDetected: ['en'], // * Placeholder data
              processingTime: 1200, // * Placeholder data
              label: 'Text Processing'
            }
          },
          {
            id: 'embedding-generation',
            type: 'embeddingNode',
            position: { x: 900, y: 1176 },
            data: {
              status: 'processing',
              embeddingsGenerated: 2847, // * Placeholder data
              generationRate: 0, // * Placeholder data
              embeddingDimensions: 1536, // * Placeholder data
              modelVersion: 'text-embedding-ada-002', // * Placeholder data
              processingTime: 800, // * Placeholder data
              label: 'Embedding Generation'
            }
          },
          {
            id: 'vector-storage',
            type: 'storageNode',
            position: { x: 1300, y: 1176 },
            data: {
              status: 'success',
              vectorsStored: 125000, // * Placeholder data
              storageRate: 0, // * Placeholder data
              storageUsed: 2.5, // * Placeholder data
              indexSize: 0, // * Placeholder data
              queryLatency: 0, // * Placeholder data
              label: 'Vector Storage'
            }
          }
        ];

const initialEdges = [
  // QUERY PROCESSING PIPELINE CONNECTIONS (Green)
  {
    id: 'query-to-vector',
    source: 'query-input',
    target: 'vector-search',
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#00FF88', 
      strokeWidth: 3,
      strokeOpacity: 0.9
    },
    className: 'vast-edge curved animated',
    data: { throughput: 45, label: 'Query Data*' } // * Placeholder data
  },
  {
    id: 'vector-to-llm',
    source: 'vector-search',
    target: 'llm-processing',
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#00CC6A', 
      strokeWidth: 3,
      strokeOpacity: 0.9
    },
    className: 'vast-edge curved animated',
    data: { results: 5, label: 'Vector Results*' } // * Placeholder data
  },
  {
    id: 'llm-to-response',
    source: 'llm-processing',
    target: 'response-generation',
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#33FF99', 
      strokeWidth: 3,
      strokeOpacity: 0.9
    },
    className: 'vast-edge curved animated',
    data: { tokens: 150, label: 'Generated Text*' } // * Placeholder data
  },
  
  // DOCUMENT PROCESSING PIPELINE CONNECTIONS (Blue)
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
  
  // RESOURCE MONITOR CONNECTIONS (Gray - Monitoring all pipeline nodes)
  
  // QUERY PROCESSING PIPELINE MONITORING (Top connectors to Resource Monitor bottom)
  {
    id: 'query-to-monitor',
    source: 'query-input',
    target: 'resource-monitor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Query Input' }
  },
  {
    id: 'vector-to-monitor',
    source: 'vector-search',
    target: 'resource-monitor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Vector Search' }
  },
  {
    id: 'llm-to-monitor',
    source: 'llm-processing',
    target: 'resource-monitor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor LLM Processing' }
  },
  {
    id: 'response-to-monitor',
    source: 'response-generation',
    target: 'resource-monitor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Response Generation' }
  },
  
  // DOCUMENT PROCESSING PIPELINE MONITORING (Top connectors to Resource Monitor bottom)
  {
    id: 'document-to-monitor',
    source: 'document-ingestion',
    target: 'resource-monitor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Document Ingestion' }
  },
  {
    id: 'text-to-monitor',
    source: 'text-processing',
    target: 'resource-monitor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Text Processing' }
  },
  {
    id: 'embedding-to-monitor',
    source: 'embedding-generation',
    target: 'resource-monitor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Embedding Generation' }
  },
  {
    id: 'storage-to-monitor',
    source: 'vector-storage',
    target: 'resource-monitor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Vector Storage' }
  },
  
  // BIDIRECTIONAL MONITORING - Resource Monitor bottom to Query Processing tops
  {
    id: 'monitor-to-query',
    source: 'resource-monitor',
    target: 'query-input',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Query Input' }
  },
  {
    id: 'monitor-to-vector',
    source: 'resource-monitor',
    target: 'vector-search',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Vector Search' }
  },
  {
    id: 'monitor-to-llm',
    source: 'resource-monitor',
    target: 'llm-processing',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor LLM Processing' }
  },
  {
    id: 'monitor-to-response',
    source: 'resource-monitor',
    target: 'response-generation',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: false,
    style: { 
      stroke: '#4A5568', 
      strokeWidth: 2, 
      strokeDasharray: '8,4',
      strokeOpacity: 0.7
    },
    className: 'vast-edge curved',
    data: { monitoring: true, label: 'Monitor Response Generation' }
  }
];

const EnhancedRAGPipelineVisualization = ({ debugMode = false, pipelineData: externalPipelineData = null }) => {
  // Real-time data hook
  const { 
    isConnected, 
    isLoading, 
    error, 
    pipelineData: hookPipelineData, 
    systemMetrics, 
    refresh, 
    reconnect 
  } = useRealTimePipelineData();

  // Use external pipeline data if provided, otherwise use hook data
  const pipelineData = externalPipelineData || hookPipelineData;

  // Debug logging
  React.useEffect(() => {
    if (debugMode) {
      console.log('🔧 Debug Mode Enabled - Pipeline Data:', {
        isConnected,
        isLoading,
        error,
        pipelineData: pipelineData ? 'Present' : 'Missing',
        systemMetrics: systemMetrics ? 'Present' : 'Missing'
      });
    }
  }, [debugMode, isConnected, isLoading, error, pipelineData, systemMetrics]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [connectionMode, setConnectionMode] = useState('normal'); // 'normal', 'adding', 'removing'
  const [sourceHandle, setSourceHandle] = useState(null);
  const [isLayoutSaved, setIsLayoutSaved] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [connectionColors, setConnectionColors] = useState({
    query: '#00FF88',      // Green for Query Processing
    document: '#3B82F6',   // Blue for Document Processing
    monitoring: '#4A5568'  // Gray for Monitoring
  });
  const [lineThickness, setLineThickness] = useState(3);

  // Load saved layout from localStorage on component mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('pipeline-monitor-layout');
    if (savedLayout) {
      try {
        const { savedNodes, savedEdges } = JSON.parse(savedLayout);
        setNodes(savedNodes);
        setEdges(savedEdges);
        setIsLayoutSaved(true);
      } catch (error) {
        console.error('Error loading saved layout:', error);
      }
    }
  }, [setNodes, setEdges]);

  // Auto-hide layout saved message after 5 seconds
  useEffect(() => {
    if (isLayoutSaved) {
      const timer = setTimeout(() => {
        setIsLayoutSaved(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLayoutSaved]);

  // Save layout to localStorage
  const saveLayout = useCallback(() => {
    try {
      const layoutData = {
        savedNodes: nodes,
        savedEdges: edges,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pipeline-monitor-layout', JSON.stringify(layoutData));
      setIsLayoutSaved(true);
      console.log('Layout saved successfully');
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  }, [nodes, edges]);

  // Reset layout to default
  const resetLayout = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setIsLayoutSaved(false);
    localStorage.removeItem('pipeline-monitor-layout');
    console.log('Layout reset to default');
  }, [setNodes, setEdges]);

  // Close menu when clicking outside (handled by backdrop overlay)
  // No need for click-outside handler since backdrop handles it

  // Update connection colors
  const updateConnectionColor = (type, color) => {
    setConnectionColors(prev => ({
      ...prev,
      [type]: color
    }));
  };

  // Color slider component
  const ColorSlider = ({ type, colors, currentColor, onColorChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [sliderRef, setSliderRef] = useState(null);

    const handleMouseDown = (e) => {
      e.preventDefault(); // Prevent menu from closing
      setIsDragging(true);
      handleColorSelect(e);
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        e.preventDefault(); // Prevent menu from closing
        handleColorSelect(e);
      }
    };

    const handleMouseUp = (e) => {
      e.preventDefault(); // Prevent menu from closing
      setIsDragging(false);
    };

    const handleColorSelect = (e) => {
      if (!sliderRef) return;
      
      const rect = sliderRef.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const colorIndex = Math.floor((percentage / 100) * (colors.length - 1));
      const selectedColor = colors[colorIndex];
      
      if (selectedColor && selectedColor.value !== currentColor) {
        onColorChange(selectedColor.value);
      }
    };

    // Add event listeners for mouse events
    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging]);

    const currentIndex = colors.findIndex(c => c.value === currentColor);
    const sliderPosition = (currentIndex / (colors.length - 1)) * 100;

    return (
      <div className="relative">
        <div
          ref={setSliderRef}
          className="relative h-8 w-full rounded-lg cursor-pointer overflow-hidden border border-gray-600"
          onMouseDown={handleMouseDown}
          style={{
            background: `linear-gradient(to right, ${colors.map(c => c.value).join(', ')})`
          }}
        >
          {/* Slider thumb */}
          <div
            className="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-150"
            style={{ left: `${sliderPosition}%` }}
          />
        </div>
      </div>
    );
  };

  // Color presets
  const colorPresets = {
    query: [
      { name: 'Green', value: '#00FF88' },
      { name: 'Blue', value: '#3B82F6' },
      { name: 'Purple', value: '#8B5CF6' },
      { name: 'Orange', value: '#F59E0B' },
      { name: 'Red', value: '#EF4444' },
      { name: 'Cyan', value: '#06B6D4' }
    ],
    document: [
      { name: 'Blue', value: '#3B82F6' },
      { name: 'Green', value: '#00FF88' },
      { name: 'Purple', value: '#8B5CF6' },
      { name: 'Orange', value: '#F59E0B' },
      { name: 'Red', value: '#EF4444' },
      { name: 'Cyan', value: '#06B6D4' }
    ],
    monitoring: [
      { name: 'Gray', value: '#4A5568' },
      { name: 'Blue', value: '#3B82F6' },
      { name: 'Green', value: '#00FF88' },
      { name: 'Purple', value: '#8B5CF6' },
      { name: 'Orange', value: '#F59E0B' },
      { name: 'Red', value: '#EF4444' }
    ]
  };

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
      // The onConnect callback will handle the actual connection creation
    }
  }, [connectionMode, sourceHandle]);

  // Handle edge connection
  const onConnect = useCallback(
    (params) => {
      if (connectionMode === 'adding' && sourceHandle) {
        // Complete the connection using specific handle information
        const newEdge = {
          ...params,
          id: `edge-${params.source}-${params.target}-${Date.now()}`,
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#00FF88', 
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
        // Normal connection
        const newEdge = {
          ...params,
          id: `edge-${params.source}-${params.target}-${Date.now()}`,
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#00FF88', 
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

  // Update nodes with real-time data
  useEffect(() => {
    if (!pipelineData) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === 'query-input' && pipelineData.queryInput) {
          return {
            ...node,
            data: {
              ...node.data,
              ...pipelineData.queryInput
            },
          };
        }
        if (node.id === 'vector-search' && pipelineData.vectorSearch) {
          return {
            ...node,
            data: {
              ...node.data,
              ...pipelineData.vectorSearch
            },
          };
        }
        if (node.id === 'llm-processing' && pipelineData.llmProcessing) {
          return {
            ...node,
            data: {
              ...node.data,
              ...pipelineData.llmProcessing
            },
          };
        }
        if (node.id === 'response-generation' && pipelineData.responseGeneration) {
          return {
            ...node,
            data: {
              ...node.data,
              ...pipelineData.responseGeneration
            },
          };
        }
        if (node.id === 'resource-monitor' && pipelineData.resourceMonitor) {
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
        if (edge.id === 'query-to-vector' && pipelineData.queryInput) {
          return {
            ...edge,
            data: { throughput: pipelineData.queryInput.throughput }
          };
        }
        if (edge.id === 'vector-to-llm' && pipelineData.vectorSearch) {
          return {
            ...edge,
            data: { results: pipelineData.vectorSearch.resultsCount }
          };
        }
        if (edge.id === 'llm-to-response' && pipelineData.llmProcessing) {
          return {
            ...edge,
            data: { tokens: pipelineData.llmProcessing.tokensGenerated }
          };
        }
        return edge;
      })
    );
  }, [pipelineData, setNodes, setEdges]);

  // Toggle animation
  const toggleAnimation = () => {
    const newAnimationState = !isAnimating;
    setIsAnimating(newAnimationState);
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: newAnimationState
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
    <div className="h-full w-full overflow-hidden" style={{ 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      background: 'var(--bg-primary)'
    }}>
              {/* Pipeline Controls Menu Toggle Button */}
              <div className="absolute top-2 left-6 z-30">
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-3 text-white hover:text-gray-300 transition-all duration-200 flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: '#1F2937' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setIsDropdownOpen(!isDropdownOpen);
                    }
                  }}
                  aria-label="Toggle pipeline controls"
                >
                  {/* Gear Icon */}
                  <svg 
                    className={`w-8 h-8 transition-all duration-200 ${isDropdownOpen ? 'rotate-90' : ''}`}
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                  </svg>
                </div>
              </div>

      {/* Slide-out Menu from Left */}
      <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 shadow-2xl border-r border-gray-600 z-20 transform transition-transform duration-300 ease-in-out ${
        isDropdownOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 h-full overflow-y-auto">
          {/* Animation Controls */}
          <div className="px-4 py-2 border-b border-gray-600">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Animation</h3>
            <button
              onClick={() => {
                toggleAnimation();
                setIsDropdownOpen(false);
              }}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                isAnimating 
                  ? 'bg-amber-600 text-white hover:bg-amber-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isAnimating ? (
                <>
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Play
                </>
              )}
            </button>
          </div>
                      
          {/* Connection Controls */}
          <div className="px-4 py-2 border-b border-gray-600">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Connections</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  startAddingConnection();
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  connectionMode === 'adding' 
                    ? 'bg-green-700 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {connectionMode === 'adding' ? (
                  <>
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  removeSelectedEdge();
                  setIsDropdownOpen(false);
                }}
                disabled={!selectedEdge}
                className={`w-full px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  selectedEdge 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
                      
          {/* Layout Management */}
          <div className="px-4 py-2 border-b border-gray-600">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Layout</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  saveLayout();
                  setIsDropdownOpen(false);
                }}
                className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-all duration-200"
              >
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                Save
              </button>
              <button
                onClick={() => {
                  resetLayout();
                  setIsDropdownOpen(false);
                }}
                className="w-full px-3 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 transition-all duration-200"
              >
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Reset
              </button>
            </div>
          </div>
                      
          {/* Color Controls */}
          <div className="px-4 py-2 border-b border-gray-600">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Connection Colors</h3>
                        
            {/* Line Thickness Slider */}
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-300 font-medium">Line Thickness</div>
                <div className="text-xs text-gray-400 font-medium">{lineThickness}px</div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={lineThickness}
                  onChange={(e) => setLineThickness(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #4A5568 0%, #4A5568 ${(lineThickness - 1) / 7 * 100}%, #6B7280 ${(lineThickness - 1) / 7 * 100}%, #6B7280 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1px</span>
                  <span>8px</span>
                </div>
              </div>
            </div>
                        
            <div className="space-y-4">
              {/* Query Processing Color Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-300 font-medium">Query Processing</label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-500"
                      style={{ backgroundColor: connectionColors.query }}
                    ></div>
                    <span className="text-xs text-gray-400 font-medium">
                      {colorPresets.query.find(p => p.value === connectionColors.query)?.name || 'Custom'}
                    </span>
                  </div>
                </div>
                <ColorSlider
                  type="query"
                  colors={colorPresets.query}
                  currentColor={connectionColors.query}
                  onColorChange={(color) => updateConnectionColor('query', color)}
                />
              </div>
                          
              {/* Document Processing Color Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-300 font-medium">Document Processing</label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-500"
                      style={{ backgroundColor: connectionColors.document }}
                    ></div>
                    <span className="text-xs text-gray-400 font-medium">
                      {colorPresets.document.find(p => p.value === connectionColors.document)?.name || 'Custom'}
                    </span>
                  </div>
                </div>
                <ColorSlider
                  type="document"
                  colors={colorPresets.document}
                  currentColor={connectionColors.document}
                  onColorChange={(color) => updateConnectionColor('document', color)}
                />
              </div>
                          
              {/* Monitoring Color Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-300 font-medium">Monitoring</label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-500"
                      style={{ backgroundColor: connectionColors.monitoring }}
                    ></div>
                    <span className="text-xs text-gray-400 font-medium">
                      {colorPresets.monitoring.find(p => p.value === connectionColors.monitoring)?.name || 'Custom'}
                    </span>
                  </div>
                </div>
                <ColorSlider
                  type="monitoring"
                  colors={colorPresets.monitoring}
                  currentColor={connectionColors.monitoring}
                  onColorChange={(color) => updateConnectionColor('monitoring', color)}
                />
              </div>
            </div>
          </div>
                      
          {/* System Controls */}
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">System</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  refresh();
                  setIsDropdownOpen(false);
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-all duration-200"
              >
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop Overlay */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
        
        {/* Connection Mode Status */}
        {connectionMode !== 'normal' && (
          <div className="absolute top-6 left-80 z-10 px-4 py-2 bg-blue-800 text-blue-100 rounded-lg text-sm font-medium border border-blue-600">
            {connectionMode === 'adding' && !sourceHandle && '🔄 Adding Mode: Click on a connection point to start, then click target point'}
            {connectionMode === 'adding' && sourceHandle && `🔄 Adding Mode: Selected ${sourceHandle.handleId} from ${sourceHandle.nodeId} - Click target point`}
            {connectionMode === 'removing' && '🗑️ Removing Mode: Click on a connection to select it, then click Remove'}
          </div>
        )}
        
        {/* Selection Status */}
        {(selectedNode || selectedEdge) && (
          <div className="absolute top-6 left-80 z-10 px-4 py-2 bg-green-800 text-green-100 rounded-lg text-sm font-medium border border-green-600">
            {selectedNode && `📦 Selected: ${selectedNode.data.label || selectedNode.type}`}
            {selectedEdge && `🔗 Selected: ${selectedEdge.source} → ${selectedEdge.target}`}
          </div>
        )}
        
      {/* Layout Status - Rendered in header via portal */}
      {isLayoutSaved && typeof document !== 'undefined' && document.getElementById('header-message-area') && createPortal(
        <div className="px-4 py-2 bg-green-800 text-green-100 rounded-lg text-sm font-medium border border-green-600 animate-fade-in">
          💾 Layout Saved - Changes will persist across sessions
        </div>,
        document.getElementById('header-message-area')
      )}

      {/* Connected Status - Rendered in header via portal */}
      {typeof document !== 'undefined' && document.getElementById('connected-status-area') && createPortal(
        <div className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
          isConnected 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>,
        document.getElementById('connected-status-area')
      )}

      {/* Debug Mode Indicator */}
      {debugMode && (
        <div className="absolute top-20 left-6 z-30 bg-purple-800 text-purple-100 px-3 py-2 rounded-lg text-sm font-medium border border-purple-600">
          🔧 Debug Mode Active - Check console for detailed logs
        </div>
      )}

      {/* Professional Pipeline Visualization */}
      <div className="h-full w-full overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges.map(edge => {
            // Determine edge color based on edge type
            let edgeColor = edge.style?.stroke || '#00FF88';
            if (edge.id.includes('monitor') || edge.data?.monitoring) {
              edgeColor = connectionColors.monitoring;
            } else if (edge.id.includes('document') || edge.id.includes('docs') || 
                      edge.id.includes('text') || edge.id.includes('embedding') || 
                      edge.id.includes('storage')) {
              edgeColor = connectionColors.document;
            } else {
              edgeColor = connectionColors.query;
            }

            return {
              ...edge,
              animated: edge.animated, // Preserve the animated state
              style: {
                ...edge.style,
                stroke: edgeColor,
                strokeWidth: lineThickness
              },
              className: selectedEdge && selectedEdge.id === edge.id 
                ? 'vast-edge curved animated selected' 
                : 'vast-edge curved animated'
            };
          })}
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
            animated: isAnimating,
            style: { 
              stroke: '#00FF88', 
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
          fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.2 }}
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
            padding: '8px',
            position: 'absolute',
            bottom: 'calc(100% - 192px)',
            left: '10px'
          }}
        />
        <MiniMap 
          className="professional-minimap"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--vast-neutral)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            position: 'absolute',
            bottom: 'calc(100% - 192px)',
            right: '10px'
          }}
          nodeColor={(node) => {
            switch (node.type) {
              case 'queryNode': return '#00FF88';
              case 'vectorNode': return '#00CC6A';
              case 'llmNode': return '#00FF88';
              case 'responseNode': return '#33FF99';
              case 'monitorNode': return '#4A5568';
              default: return '#4A5568';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
      </div>

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

export default EnhancedRAGPipelineVisualization;