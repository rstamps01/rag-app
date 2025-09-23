/**
 * Qdrant Graph Visualization Component
 * 
 * Interactive graph visualization for Qdrant collection data
 * showing vector relationships and clustering patterns.
 */

import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Settings,
  Download,
  Eye,
  EyeOff,
  Palette,
  X,
  Type,
  Circle,
  Square,
  Diamond,
  Filter,
  Layers
} from 'lucide-react';

const QdrantGraph = ({ collectionName = 'rag', qdrantBaseUrl = 'http://localhost:6333', height = '500px', fullWidth = false }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showVisualizationMenu, setShowVisualizationMenu] = useState(false);
  const [settings, setSettings] = useState({
    nodeLimit: 100,
    linkDistance: 30,
    chargeStrength: -300,
    showLabels: true,
    nodeSize: 3,
    linkWidth: 1
  });
  const [visualizationSettings, setVisualizationSettings] = useState({
    labelMode: 'filename', // filename, chunk_index, document_id, department, file_type, content_preview, combined
    colorScheme: 'group', // group, department, file_type, document, chunk_index, processing_time, content_length
    sizeMode: 'fixed', // fixed, content_length, chunk_index, department, file_type
    nodeShape: 'circle', // circle, square, diamond, text
    showTooltips: true,
    showClustering: false,
    showAnimations: true,
    enableFiltering: false,
    multiSelect: false,
    showText: true, // Show/hide text labels
    showInterconnectivity: false, // Show node connections
    maxSeparationLevels: 3, // Maximum levels of separation to show
    highlightSelected: true, // Highlight selected node and connections
    useVariableDistance: true, // Use variable distance based on similarity
    distanceMode: 'semantic', // semantic, department, file_type, document, content_length, chunk_index
    minDistance: 20, // Minimum distance between nodes
    maxDistance: 200, // Maximum distance between nodes
    similarityThreshold: 0.7 // Threshold for considering nodes similar
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [nodeConnections, setNodeConnections] = useState({});
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState(new Set());
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const graphRef = useRef();
  const containerRef = useRef();

  // Helper functions for visualization
  const generateNodeLabel = (node) => {
    const { labelMode } = visualizationSettings;
    const payload = node.payload || {};
    
    switch (labelMode) {
      case 'filename':
        return payload.filename ? payload.filename.substring(0, 20) + '...' : `Point ${node.id?.substring(0, 8)}`;
      case 'chunk_index':
        return `Chunk ${payload.chunk_index || 0}`;
      case 'document_id':
        return payload.document_id ? payload.document_id.substring(0, 12) + '...' : `Doc ${node.id?.substring(0, 8)}`;
      case 'department':
        return payload.department || 'Unknown';
      case 'file_type':
        return payload.file_type || '.unknown';
      case 'content_preview':
        return payload.content ? payload.content.substring(0, 15) + '...' : 'No content';
      case 'combined':
        const filename = payload.filename ? payload.filename.substring(0, 10) : 'Unknown';
        const chunk = payload.chunk_index || 0;
        return `${filename} (${chunk})`;
      default:
        return node.label || node.id;
    }
  };

  const generateNodeColor = (node) => {
    const { colorScheme } = visualizationSettings;
    const payload = node.payload || {};
    
    const colorPalette = {
      department: {
        'General': '#4ecdc4',
        'Engineering': '#45b7d1',
        'Marketing': '#96ceb4',
        'Sales': '#feca57',
        'HR': '#ff9ff3',
        'Finance': '#54a0ff',
        'IT': '#5f27cd',
        'Operations': '#00d2d3'
      },
      file_type: {
        '.pdf': '#e74c3c',
        '.docx': '#3498db',
        '.txt': '#2ecc71',
        '.md': '#f39c12',
        '.html': '#9b59b6',
        '.json': '#1abc9c',
        '.xml': '#34495e'
      },
      document: {
        // Generate consistent colors based on document_id
      }
    };

    switch (colorScheme) {
      case 'department':
        return colorPalette.department[payload.department] || '#95a5a6';
      case 'file_type':
        return colorPalette.file_type[payload.file_type] || '#95a5a6';
      case 'document':
        // Generate consistent color based on document_id hash
        const docId = payload.document_id || node.id;
        const hash = docId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 60%)`;
      case 'chunk_index':
        const chunkIndex = payload.chunk_index || 0;
        const intensity = Math.min(chunkIndex / 100, 1);
        return `hsl(200, 70%, ${50 + intensity * 30}%)`;
      case 'processing_time':
        const processedAt = payload.processed_at || 0;
        const timeIntensity = (Date.now() / 1000 - processedAt) / (365 * 24 * 3600); // Years ago
        return `hsl(${Math.max(0, 120 - timeIntensity * 120)}, 70%, 60%)`;
      case 'content_length':
        const contentLength = payload.content ? payload.content.length : 0;
        const lengthIntensity = Math.min(contentLength / 1000, 1);
        return `hsl(${120 + lengthIntensity * 120}, 70%, 60%)`;
      case 'group':
      default:
        return node.group % 2 === 0 ? '#4ecdc4' : '#45b7d1';
    }
  };

  const generateNodeSize = (node) => {
    const { sizeMode } = visualizationSettings;
    const payload = node.payload || {};
    const baseSize = settings.nodeSize;
    
    switch (sizeMode) {
      case 'content_length':
        const contentLength = payload.content ? payload.content.length : 0;
        return Math.max(1, baseSize + (contentLength / 500));
      case 'chunk_index':
        const chunkIndex = payload.chunk_index || 0;
        return Math.max(1, baseSize + (chunkIndex / 100));
      case 'department':
        const deptSizes = {
          'General': 1,
          'Engineering': 1.5,
          'Marketing': 1.2,
          'Sales': 1.3,
          'HR': 1.1,
          'Finance': 1.4,
          'IT': 1.6,
          'Operations': 1.3
        };
        return baseSize * (deptSizes[payload.department] || 1);
      case 'file_type':
        const typeSizes = {
          '.pdf': 1.5,
          '.docx': 1.3,
          '.txt': 1.0,
          '.md': 1.2,
          '.html': 1.4,
          '.json': 1.1,
          '.xml': 1.3
        };
        return baseSize * (typeSizes[payload.file_type] || 1);
      case 'fixed':
      default:
        return baseSize;
    }
  };

  // Calculate node connections and separation levels
  const calculateNodeConnections = (nodeId, maxLevels = 3) => {
    const connections = {
      levels: {},
      allConnected: new Set(),
      links: new Set()
    };

    // BFS to find connections at each level
    const queue = [{ nodeId, level: 0 }];
    const visited = new Set();
    visited.add(nodeId);

    while (queue.length > 0) {
      const { nodeId: currentId, level } = queue.shift();
      
      if (level > maxLevels) break;

      if (!connections.levels[level]) {
        connections.levels[level] = new Set();
      }
      connections.levels[level].add(currentId);
      connections.allConnected.add(currentId);

      // Find all links connected to current node
      const connectedLinks = graphData.links.filter(link => 
        link.source === currentId || link.target === currentId
      );

      connectedLinks.forEach(link => {
        connections.links.add(link);
        const nextNodeId = link.source === currentId ? link.target : link.source;
        
        if (!visited.has(nextNodeId) && level < maxLevels) {
          visited.add(nextNodeId);
          queue.push({ nodeId: nextNodeId, level: level + 1 });
        }
      });
    }

    return connections;
  };

  // Get color for separation level
  const getSeparationLevelColor = (level) => {
    const colors = [
      '#ff6b6b', // Level 0 (selected node) - Red
      '#4ecdc4', // Level 1 - Teal
      '#45b7d1', // Level 2 - Blue
      '#96ceb4', // Level 3 - Green
      '#feca57', // Level 4 - Yellow
      '#ff9ff3', // Level 5 - Pink
      '#54a0ff', // Level 6 - Light Blue
      '#5f27cd'  // Level 7+ - Purple
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  // Handle node selection
  const handleNodeSelection = (node) => {
    if (visualizationSettings.multiSelect) {
      // Multi-select mode
      setSelectedNodes(prev => {
        const isSelected = prev.some(n => n.id === node.id);
        if (isSelected) {
          return prev.filter(n => n.id !== node.id);
        } else {
          return [...prev, node];
        }
      });
    } else {
      // Single select mode
      setSelectedNode(node);
      setSelectedNodes([node]);
    }

    // Calculate connections if interconnectivity is enabled
    if (visualizationSettings.showInterconnectivity) {
      const connections = calculateNodeConnections(node.id, visualizationSettings.maxSeparationLevels);
      setNodeConnections(connections);
      
      // Update highlighted nodes and links
      setHighlightedNodes(connections.allConnected);
      setHighlightedLinks(connections.links);
    }
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedNode(null);
    setSelectedNodes([]);
    setNodeConnections({});
    setHighlightedNodes(new Set());
    setHighlightedLinks(new Set());
  };

  // Calculate similarity between two nodes
  const calculateNodeSimilarity = (node1, node2) => {
    const { distanceMode } = visualizationSettings;
    const payload1 = node1.payload || {};
    const payload2 = node2.payload || {};
    
    switch (distanceMode) {
      case 'department':
        return payload1.department === payload2.department ? 1.0 : 0.0;
      
      case 'file_type':
        return payload1.file_type === payload2.file_type ? 1.0 : 0.0;
      
      case 'document':
        return payload1.document_id === payload2.document_id ? 1.0 : 0.0;
      
      case 'content_length':
        const contentLen1 = payload1.content ? payload1.content.length : 0;
        const contentLen2 = payload2.content ? payload2.content.length : 0;
        const maxContentLen = Math.max(contentLen1, contentLen2);
        if (maxContentLen === 0) return 0.0;
        return 1.0 - Math.abs(contentLen1 - contentLen2) / maxContentLen;
      
      case 'chunk_index':
        const chunk1 = payload1.chunk_index || 0;
        const chunk2 = payload2.chunk_index || 0;
        const maxChunk = Math.max(chunk1, chunk2);
        if (maxChunk === 0) return 1.0;
        return 1.0 - Math.abs(chunk1 - chunk2) / maxChunk;
      
      case 'semantic':
      default:
        // Semantic similarity based on multiple factors
        let similarity = 0.0;
        let factors = 0;
        
        // Department similarity
        if (payload1.department && payload2.department) {
          similarity += payload1.department === payload2.department ? 0.3 : 0.0;
          factors += 0.3;
        }
        
        // File type similarity
        if (payload1.file_type && payload2.file_type) {
          similarity += payload1.file_type === payload2.file_type ? 0.2 : 0.0;
          factors += 0.2;
        }
        
        // Document similarity
        if (payload1.document_id && payload2.document_id) {
          similarity += payload1.document_id === payload2.document_id ? 0.4 : 0.0;
          factors += 0.4;
        }
        
        // Content length similarity
        const semanticLen1 = payload1.content ? payload1.content.length : 0;
        const semanticLen2 = payload2.content ? payload2.content.length : 0;
        if (semanticLen1 > 0 && semanticLen2 > 0) {
          const maxSemanticLen = Math.max(semanticLen1, semanticLen2);
          const lengthSim = 1.0 - Math.abs(semanticLen1 - semanticLen2) / maxSemanticLen;
          similarity += lengthSim * 0.1;
          factors += 0.1;
        }
        
        return factors > 0 ? similarity / factors : 0.0;
    }
  };

  // Calculate distance between two nodes based on similarity
  const calculateNodeDistance = (node1, node2) => {
    if (!visualizationSettings.useVariableDistance) {
      return settings.linkDistance;
    }
    
    const similarity = calculateNodeSimilarity(node1, node2);
    const { minDistance, maxDistance, similarityThreshold } = visualizationSettings;
    
    // Convert similarity to distance (inverse relationship)
    // High similarity = low distance, low similarity = high distance
    const normalizedSimilarity = Math.max(0, Math.min(1, similarity));
    const distance = maxDistance - (normalizedSimilarity * (maxDistance - minDistance));
    
    // Apply threshold - nodes below threshold get maximum distance
    if (similarity < similarityThreshold) {
      return maxDistance;
    }
    
    return Math.max(minDistance, distance);
  };

  // Generate links with variable distances
  const generateVariableDistanceLinks = (nodes) => {
    const links = [];
    const { useVariableDistance } = visualizationSettings;
    
    if (!useVariableDistance) {
      // Use original random link generation
      for (let i = 0; i < Math.min(nodes.length, 50); i++) {
        for (let j = i + 1; j < Math.min(nodes.length, 50); j++) {
          if (Math.random() > 0.8) {
            links.push({
              source: nodes[i].id,
              target: nodes[j].id,
              value: 1,
              distance: settings.linkDistance
            });
          }
        }
      }
      return links;
    }
    
    // Generate links based on similarity
    for (let i = 0; i < Math.min(nodes.length, 100); i++) {
      for (let j = i + 1; j < Math.min(nodes.length, 100); j++) {
        const similarity = calculateNodeSimilarity(nodes[i], nodes[j]);
        const distance = calculateNodeDistance(nodes[i], nodes[j]);
        
        // Only create links for nodes that meet similarity threshold
        if (similarity >= visualizationSettings.similarityThreshold) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: similarity,
            distance: distance,
            similarity: similarity
          });
        }
      }
    }
    
    return links;
  };

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && fullWidth) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateDimensions();
    
    // Use ResizeObserver for better container size detection
    let resizeObserver;
    if (containerRef.current && fullWidth && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [fullWidth]);

  // Fetch sample points from Qdrant collection
  const fetchGraphData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch sample points from the collection using the correct Qdrant API
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: settings.nodeLimit,
          with_payload: true,
          with_vector: false // Don't fetch vectors for performance
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch points: ${response.status}`);
      }
      
      const data = await response.json();
      const points = data.result?.points || [];
      
      if (points.length === 0) {
        setGraphData({ nodes: [], links: [] });
        return;
      }

      // Create nodes from points
      const nodes = points.map((point, index) => {
        const node = {
          id: point.id || `point_${index}`,
          group: Math.floor(index / 10), // Group nodes for clustering
          payload: point.payload || {},
          chunkIndex: point.payload?.chunk_index || 0,
          documentId: point.payload?.document_id || null
        };
        
        // Generate label, color, and size based on visualization settings
        node.label = generateNodeLabel(node);
        node.color = generateNodeColor(node);
        node.size = generateNodeSize(node);
        
        return node;
      });

      // Create links with variable distances based on similarity
      const links = generateVariableDistanceLinks(nodes);

      setGraphData({ nodes, links });
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when settings change
  useEffect(() => {
    fetchGraphData();
  }, [collectionName, settings.nodeLimit]);

  // Handle node click
  const handleNodeClick = (node) => {
    handleNodeSelection(node);
  };

  // Handle node hover
  const handleNodeHover = (node) => {
    if (node) {
      // Highlight connected nodes
      const connectedNodes = new Set();
      graphData.links.forEach(link => {
        if (link.source === node.id) connectedNodes.add(link.target);
        if (link.target === node.id) connectedNodes.add(link.source);
      });
      
      // Update node colors based on connection
      const updatedNodes = graphData.nodes.map(n => ({
        ...n,
        color: connectedNodes.has(n.id) ? '#ff6b6b' : n.group % 2 === 0 ? '#4ecdc4' : '#45b7d1'
      }));
      
      setGraphData(prev => ({ ...prev, nodes: updatedNodes }));
    }
  };

  // Handle background click
  const handleBackgroundClick = () => {
    if (!visualizationSettings.multiSelect) {
      clearSelections();
    }
  };

  // Reset graph view
  const resetView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  // Download graph data
  const downloadData = () => {
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qdrant_graph_${collectionName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${fullWidth ? 'h-full w-full' : 'bg-gray-800 rounded-lg'} overflow-hidden`}>
      {/* Header */}
      <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">
            Collection Graph: {collectionName}
          </h3>
          <span className="text-sm text-gray-400">
            {graphData.nodes.length} nodes, {graphData.links.length} links
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVisualizationMenu(!showVisualizationMenu)}
            className="p-2 bg-purple-600 hover:bg-purple-500 rounded transition-colors"
            title="Visualization Options"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={resetView}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={downloadData}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Download Data"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={fetchGraphData}
            disabled={isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {(selectedNode || selectedNodes.length > 0) && (
            <button
              onClick={clearSelections}
              className="p-2 bg-red-600 hover:bg-red-500 rounded transition-colors"
              title="Clear Selections"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-600 px-4 py-3 border-b border-gray-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Node Limit</label>
              <input
                type="number"
                value={settings.nodeLimit}
                onChange={(e) => setSettings(prev => ({ ...prev, nodeLimit: parseInt(e.target.value) }))}
                className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
                min="10"
                max="500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Node Size</label>
              <input
                type="number"
                value={settings.nodeSize}
                onChange={(e) => setSettings(prev => ({ ...prev, nodeSize: parseInt(e.target.value) }))}
                className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
                min="1"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Link Distance</label>
              <input
                type="number"
                value={settings.linkDistance}
                onChange={(e) => setSettings(prev => ({ ...prev, linkDistance: parseInt(e.target.value) }))}
                className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
                min="10"
                max="100"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showLabels"
                checked={settings.showLabels}
                onChange={(e) => setSettings(prev => ({ ...prev, showLabels: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="showLabels" className="text-sm text-gray-300">Show Labels</label>
            </div>
          </div>
        </div>
      )}

      {/* Visualization Menu - Slide out from left */}
      {showVisualizationMenu && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowVisualizationMenu(false)}
          />
          
          {/* Slide-out Panel */}
          <div className="absolute left-0 top-0 h-full w-96 bg-gray-800 border-r border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Visualization Options
                </h2>
                <button
                  onClick={() => setShowVisualizationMenu(false)}
                  className="p-2 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Label Options */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Type className="w-4 h-4 mr-2" />
                    Node Labels
                  </h3>
                  <div className="space-y-3">
                    {[
                      { value: 'filename', label: 'Document Filename', desc: 'Show document filename' },
                      { value: 'chunk_index', label: 'Chunk Index', desc: 'Show chunk position' },
                      { value: 'document_id', label: 'Document ID', desc: 'Show document identifier' },
                      { value: 'department', label: 'Department', desc: 'Show department name' },
                      { value: 'file_type', label: 'File Type', desc: 'Show file extension' },
                      { value: 'content_preview', label: 'Content Preview', desc: 'Show content snippet' },
                      { value: 'combined', label: 'Combined', desc: 'Filename + Chunk Index' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="labelMode"
                          value={option.value}
                          checked={visualizationSettings.labelMode === option.value}
                          onChange={(e) => setVisualizationSettings(prev => ({ ...prev, labelMode: e.target.value }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-sm font-medium text-white">{option.label}</div>
                          <div className="text-xs text-gray-400">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color Coding Options */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Color Coding
                  </h3>
                  <div className="space-y-3">
                    {[
                      { value: 'group', label: 'Group', desc: 'Alternating group colors' },
                      { value: 'department', label: 'Department', desc: 'Color by department' },
                      { value: 'file_type', label: 'File Type', desc: 'Color by file extension' },
                      { value: 'document', label: 'Document', desc: 'Color by document' },
                      { value: 'chunk_index', label: 'Chunk Index', desc: 'Color by position' },
                      { value: 'processing_time', label: 'Processing Time', desc: 'Color by age' },
                      { value: 'content_length', label: 'Content Length', desc: 'Color by content size' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="colorScheme"
                          value={option.value}
                          checked={visualizationSettings.colorScheme === option.value}
                          onChange={(e) => setVisualizationSettings(prev => ({ ...prev, colorScheme: e.target.value }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-sm font-medium text-white">{option.label}</div>
                          <div className="text-xs text-gray-400">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Options */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    Node Size
                  </h3>
                  <div className="space-y-3">
                    {[
                      { value: 'fixed', label: 'Fixed Size', desc: 'All nodes same size' },
                      { value: 'content_length', label: 'Content Length', desc: 'Size by content size' },
                      { value: 'chunk_index', label: 'Chunk Index', desc: 'Size by position' },
                      { value: 'department', label: 'Department', desc: 'Size by department' },
                      { value: 'file_type', label: 'File Type', desc: 'Size by file type' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="sizeMode"
                          value={option.value}
                          checked={visualizationSettings.sizeMode === option.value}
                          onChange={(e) => setVisualizationSettings(prev => ({ ...prev, sizeMode: e.target.value }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-sm font-medium text-white">{option.label}</div>
                          <div className="text-xs text-gray-400">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Shape Options */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Circle className="w-4 h-4 mr-2" />
                    Node Shape
                  </h3>
                  <div className="space-y-3">
                    {[
                      { value: 'circle', label: 'Circle', desc: 'Round nodes', icon: Circle },
                      { value: 'square', label: 'Square', desc: 'Square nodes', icon: Square },
                      { value: 'diamond', label: 'Diamond', desc: 'Diamond nodes', icon: Diamond },
                      { value: 'text', label: 'Text Block', desc: 'Text-based nodes', icon: Type }
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="nodeShape"
                            value={option.value}
                            checked={visualizationSettings.nodeShape === option.value}
                            onChange={(e) => setVisualizationSettings(prev => ({ ...prev, nodeShape: e.target.value }))}
                            className="mt-1"
                          />
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-white">{option.label}</div>
                              <div className="text-xs text-gray-400">{option.desc}</div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Text and Interconnectivity Options */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Type className="w-4 h-4 mr-2" />
                    Display Options
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'showText', label: 'Show Text Labels', desc: 'Display node labels on graph' },
                      { key: 'showInterconnectivity', label: 'Show Interconnectivity', desc: 'Highlight node connections' },
                      { key: 'highlightSelected', label: 'Highlight Selected', desc: 'Highlight selected nodes and connections' }
                    ].map((feature) => (
                      <label key={feature.key} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visualizationSettings[feature.key]}
                          onChange={(e) => setVisualizationSettings(prev => ({ ...prev, [feature.key]: e.target.checked }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-sm font-medium text-white">{feature.label}</div>
                          <div className="text-xs text-gray-400">{feature.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {/* Separation Levels Control */}
                  {visualizationSettings.showInterconnectivity && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <label className="block text-sm font-medium text-white mb-2">
                        Max Separation Levels: {visualizationSettings.maxSeparationLevels}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="7"
                        value={visualizationSettings.maxSeparationLevels}
                        onChange={(e) => setVisualizationSettings(prev => ({ 
                          ...prev, 
                          maxSeparationLevels: parseInt(e.target.value) 
                        }))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1</span>
                        <span>7</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Variable Distance Options */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    Node Distance & Similarity
                  </h3>
                  
                  {/* Enable Variable Distance */}
                  <div className="mb-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualizationSettings.useVariableDistance}
                        onChange={(e) => setVisualizationSettings(prev => ({ ...prev, useVariableDistance: e.target.checked }))}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">Use Variable Distance</div>
                        <div className="text-xs text-gray-400">Position nodes based on similarity</div>
                      </div>
                    </label>
                  </div>

                  {/* Distance Mode Selection */}
                  {visualizationSettings.useVariableDistance && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Similarity Mode</label>
                        <select
                          value={visualizationSettings.distanceMode}
                          onChange={(e) => setVisualizationSettings(prev => ({ ...prev, distanceMode: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="semantic">Semantic (Multi-factor)</option>
                          <option value="department">Department</option>
                          <option value="file_type">File Type</option>
                          <option value="document">Document</option>
                          <option value="content_length">Content Length</option>
                          <option value="chunk_index">Chunk Index</option>
                        </select>
                      </div>

                      {/* Distance Range Controls */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-1">
                            Min Distance: {visualizationSettings.minDistance}
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={visualizationSettings.minDistance}
                            onChange={(e) => setVisualizationSettings(prev => ({ 
                              ...prev, 
                              minDistance: parseInt(e.target.value) 
                            }))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-1">
                            Max Distance: {visualizationSettings.maxDistance}
                          </label>
                          <input
                            type="range"
                            min="100"
                            max="500"
                            value={visualizationSettings.maxDistance}
                            onChange={(e) => setVisualizationSettings(prev => ({ 
                              ...prev, 
                              maxDistance: parseInt(e.target.value) 
                            }))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Similarity Threshold */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          Similarity Threshold: {visualizationSettings.similarityThreshold.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={visualizationSettings.similarityThreshold}
                          onChange={(e) => setVisualizationSettings(prev => ({ 
                            ...prev, 
                            similarityThreshold: parseFloat(e.target.value) 
                          }))}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>0.1 (Loose)</span>
                          <span>1.0 (Strict)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Features */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Features
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'showTooltips', label: 'Show Tooltips', desc: 'Display info on hover' },
                      { key: 'showClustering', label: 'Enable Clustering', desc: 'Group related nodes' },
                      { key: 'showAnimations', label: 'Enable Animations', desc: 'Smooth transitions' },
                      { key: 'enableFiltering', label: 'Enable Filtering', desc: 'Filter nodes by criteria' },
                      { key: 'multiSelect', label: 'Multi-Select', desc: 'Select multiple nodes' }
                    ].map((feature) => (
                      <label key={feature.key} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visualizationSettings[feature.key]}
                          onChange={(e) => setVisualizationSettings(prev => ({ ...prev, [feature.key]: e.target.checked }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-sm font-medium text-white">{feature.label}</div>
                          <div className="text-xs text-gray-400">{feature.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apply Changes Button */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <button
                    onClick={() => {
                      // Refresh graph data to apply new visualization settings
                      fetchGraphData();
                      setShowVisualizationMenu(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graph Visualization */}
      <div ref={containerRef} className="relative" style={{ height: height }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-gray-400">Loading graph data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-400 mb-2">⚠️</div>
              <p className="text-red-400 mb-2">Error loading graph data</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button
                onClick={fetchGraphData}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-gray-400">No data available for visualization</p>
            </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel={settings.showLabels ? 'label' : ''}
            nodeColor={node => node.color || generateNodeColor(node)}
            nodeVal={node => node.size || generateNodeSize(node)}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.label || node.id;
              const fontSize = 12/globalScale;
              const size = node.size || generateNodeSize(node);
              
              // Determine node color based on selection and interconnectivity
              let nodeColor = node.color || generateNodeColor(node);
              
              // Apply selection highlighting
              if (visualizationSettings.highlightSelected) {
                if (selectedNodes.some(n => n.id === node.id)) {
                  nodeColor = '#ff6b6b'; // Selected node - Red
                } else if (highlightedNodes.has(node.id)) {
                  // Find which separation level this node belongs to
                  let level = 0;
                  for (const [levelKey, nodes] of Object.entries(nodeConnections.levels || {})) {
                    if (nodes.has(node.id)) {
                      level = parseInt(levelKey);
                      break;
                    }
                  }
                  nodeColor = getSeparationLevelColor(level);
                }
              }
              
              // Draw node shape based on visualization settings
              const { nodeShape } = visualizationSettings;
              ctx.fillStyle = nodeColor;
              
              if (nodeShape === 'square') {
                ctx.fillRect(node.x - size, node.y - size, size * 2, size * 2);
              } else if (nodeShape === 'diamond') {
                ctx.beginPath();
                ctx.moveTo(node.x, node.y - size);
                ctx.lineTo(node.x + size, node.y);
                ctx.lineTo(node.x, node.y + size);
                ctx.lineTo(node.x - size, node.y);
                ctx.closePath();
                ctx.fill();
              } else if (nodeShape === 'text') {
                ctx.fillRect(node.x - size * 2, node.y - size, size * 4, size * 2);
                ctx.fillStyle = 'white';
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label.substring(0, 8), node.x, node.y);
                return;
              } else {
                // Circle (default)
                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                ctx.fill();
              }
              
              // Draw label if enabled and showText is true
              if (settings.showLabels && visualizationSettings.showText) {
                ctx.fillStyle = 'white';
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, node.x, node.y);
              }
            }}
            linkColor={(link) => {
              if (highlightedLinks.has(link)) {
                return 'rgba(255,255,255,0.8)';
              }
              // Color based on similarity if available
              if (link.similarity !== undefined) {
                const intensity = link.similarity;
                return `rgba(255,255,255,${0.2 + intensity * 0.6})`;
              }
              return 'rgba(255,255,255,0.3)';
            }}
            linkWidth={(link) => {
              if (highlightedLinks.has(link)) {
                return settings.linkWidth * 2;
              }
              // Width based on similarity if available
              if (link.similarity !== undefined) {
                return settings.linkWidth * (0.5 + link.similarity * 1.5);
              }
              return settings.linkWidth;
            }}
            linkDistance={(link) => {
              // Use custom distance if available, otherwise use default
              return link.distance || settings.linkDistance;
            }}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onBackgroundClick={handleBackgroundClick}
            cooldownTicks={100}
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.3}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            width={fullWidth ? dimensions.width : 800}
            height={fullWidth ? dimensions.height : 500}
          />
        )}
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="bg-gray-700 px-4 py-3 border-t border-gray-500 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Selected Node Details
            </h4>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-blue-300">Basic Information</h5>
              <div className="text-sm text-gray-300 space-y-1">
                <p><strong>ID:</strong> {selectedNode.id}</p>
                <p><strong>Group:</strong> {selectedNode.group}</p>
                {selectedNode.payload?.filename && (
                  <p><strong>Filename:</strong> {selectedNode.payload.filename}</p>
                )}
                {selectedNode.chunkIndex !== undefined && (
                  <p><strong>Chunk Index:</strong> {selectedNode.chunkIndex}</p>
                )}
                {selectedNode.documentId && (
                  <p><strong>Document ID:</strong> {selectedNode.documentId.substring(0, 12)}...</p>
                )}
                {selectedNode.payload?.department && (
                  <p><strong>Department:</strong> {selectedNode.payload.department}</p>
                )}
                {selectedNode.payload?.file_type && (
                  <p><strong>File Type:</strong> {selectedNode.payload.file_type}</p>
                )}
                {selectedNode.payload?.processed_at && (
                  <p><strong>Processed:</strong> {new Date(selectedNode.payload.processed_at * 1000).toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Connection Information */}
            {visualizationSettings.showInterconnectivity && nodeConnections.levels && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-green-300">Connection Analysis</h5>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>Total Connected:</strong> {nodeConnections.allConnected.size - 1}</p>
                  <p><strong>Direct Links:</strong> {nodeConnections.levels[1]?.size || 0}</p>
                  <p><strong>Max Level:</strong> {Object.keys(nodeConnections.levels).length - 1}</p>
                  
                  {/* Separation Level Breakdown */}
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Separation Levels:</p>
                    {Object.entries(nodeConnections.levels).map(([level, nodes]) => (
                      <div key={level} className="flex items-center space-x-2 text-xs">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getSeparationLevelColor(parseInt(level)) }}
                        ></div>
                        <span>Level {level}: {nodes.size} nodes</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Display */}
          {selectedNode.payload?.content && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h5 className="text-sm font-semibold text-purple-300 mb-2">Content</h5>
              <div className="bg-gray-800 p-3 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {selectedNode.payload.content}
                </p>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Content Length: {selectedNode.payload.content.length} characters
              </div>
            </div>
          )}

          {/* Multi-Select Information */}
          {visualizationSettings.multiSelect && selectedNodes.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h5 className="text-sm font-semibold text-yellow-300 mb-2">
                Multi-Select ({selectedNodes.length} nodes)
              </h5>
              <div className="text-sm text-gray-300">
                <p>Selected nodes: {selectedNodes.map(n => n.id.substring(0, 8)).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QdrantGraph;
