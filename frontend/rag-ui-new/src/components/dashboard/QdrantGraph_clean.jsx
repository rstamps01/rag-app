import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Settings, 
  RefreshCw, 
  X, 
  Type, 
  Palette, 
  Layers, 
  Circle, 
  Filter, 
  Pin, 
  PinOff,
  HelpCircle
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
    similarityThreshold: 0.7, // Threshold for considering nodes similar
    graphType: 'force-directed', // force-directed, disjoint-force, force-tree, qdrant-native, hierarchical-cluster
    showAnchors: false, // Show central anchor points
    anchorStrength: 0.02, // Strength of anchor connections
    stabilizePositions: true // Maintain interconnectivity
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [nodeConnections, setNodeConnections] = useState({});
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState(new Set());
  const [nodePositions, setNodePositions] = useState(new Map()); // Track stable positions
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isMenuPinned, setIsMenuPinned] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [showNodeContent, setShowNodeContent] = useState(false);
  const [selectedNodeContent, setSelectedNodeContent] = useState(null);
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
        return payload.content ? payload.content.substring(0, 30) + '...' : 'No content';
      case 'combined':
        return `${payload.filename?.substring(0, 15) || 'Unknown'} (${payload.chunk_index || 0})`;
      default:
        return `Point ${node.id?.substring(0, 8)}`;
    }
  };

  const generateNodeColor = (node) => {
    const { colorScheme } = visualizationSettings;
    const payload = node.payload || {};
    
    // Define color palettes
    const colorPalettes = {
      group: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
      department: ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'],
      file_type: ['#FF5733', '#33FF57', '#3357FF', '#FF33F1', '#F1FF33', '#33FFF1', '#F133FF', '#57FF33'],
      document: ['#8E44AD', '#3498DB', '#E74C3C', '#F39C12', '#27AE60', '#E67E22', '#2C3E50', '#95A5A6'],
      chunk_index: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
      processing_time: ['#2ECC71', '#F39C12', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'],
      content_length: ['#FF9999', '#66B2FF', '#99FF99', '#FFCC99', '#FF99CC', '#99FFCC', '#CCFF99', '#FFB366']
    };
    
    const colors = colorPalettes[colorScheme] || colorPalettes.group;
    
    switch (colorScheme) {
      case 'department':
        const deptHash = payload.department ? payload.department.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
        return colors[deptHash % colors.length];
      case 'file_type':
        const typeHash = payload.file_type ? payload.file_type.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
        return colors[typeHash % colors.length];
      case 'document':
        const docHash = payload.document_id ? payload.document_id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
        return colors[docHash % colors.length];
      case 'chunk_index':
        return colors[(payload.chunk_index || 0) % colors.length];
      case 'processing_time':
        // Color based on processing time if available
        const time = payload.processed_at ? new Date(payload.processed_at).getTime() : Date.now();
        return colors[Math.floor(time / 1000000) % colors.length];
      case 'content_length':
        const length = payload.content ? payload.content.length : 0;
        const lengthIndex = Math.floor(length / 1000) % colors.length;
        return colors[lengthIndex];
      default:
        return colors[Math.abs(node.id?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) || 0) % colors.length];
    }
  };

  const generateNodeSize = (node) => {
    const { sizeMode } = visualizationSettings;
    const payload = node.payload || {};
    const baseSize = settings.nodeSize || 3;
    
    switch (sizeMode) {
      case 'content_length':
        const length = payload.content ? payload.content.length : 0;
        return Math.max(baseSize, Math.min(baseSize * 3, baseSize + (length / 1000)));
      case 'chunk_index':
        return baseSize + ((payload.chunk_index || 0) * 0.5);
      case 'department':
        // Size based on department name length
        const deptLength = payload.department ? payload.department.length : 5;
        return baseSize + (deptLength * 0.1);
      case 'file_type':
        // Different sizes for different file types
        const typeSize = {
          'pdf': baseSize * 1.5,
          'txt': baseSize * 1.2,
          'docx': baseSize * 1.3,
          'md': baseSize * 1.1
        };
        return typeSize[payload.file_type] || baseSize;
      default:
        return baseSize;
    }
  };

  // Fetch graph data from Qdrant
  const fetchGraphData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: settings.nodeLimit,
          with_payload: true,
          with_vector: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result || !data.result.points) {
        throw new Error('Invalid response format from Qdrant');
      }

      const points = data.result.points;
      
      // Transform points into graph nodes
      const nodes = points.map(point => ({
        id: point.id,
        label: generateNodeLabel({ payload: point.payload }),
        color: generateNodeColor({ payload: point.payload }),
        size: generateNodeSize({ payload: point.payload }),
        payload: point.payload
      }));

      // Generate links based on similarity (simplified approach)
      const links = [];
      const { similarityThreshold, useVariableDistance, distanceMode } = visualizationSettings;
      
      // Create links based on selected similarity mode
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          
          let shouldLink = false;
          let similarity = 0;
          
          switch (distanceMode) {
            case 'semantic':
              // Simple semantic similarity based on content overlap
              if (nodeA.payload?.content && nodeB.payload?.content) {
                const wordsA = nodeA.payload.content.toLowerCase().split(/\s+/).slice(0, 50);
                const wordsB = nodeB.payload.content.toLowerCase().split(/\s+/).slice(0, 50);
                const intersection = wordsA.filter(word => wordsB.includes(word));
                similarity = intersection.length / Math.max(wordsA.length, wordsB.length);
                shouldLink = similarity > similarityThreshold;
              }
              break;
            case 'department':
              shouldLink = nodeA.payload?.department === nodeB.payload?.department;
              similarity = shouldLink ? 1 : 0;
              break;
            case 'file_type':
              shouldLink = nodeA.payload?.file_type === nodeB.payload?.file_type;
              similarity = shouldLink ? 1 : 0;
              break;
            case 'document':
              shouldLink = nodeA.payload?.document_id === nodeB.payload?.document_id;
              similarity = shouldLink ? 1 : 0;
              break;
            case 'content_length':
              if (nodeA.payload?.content && nodeB.payload?.content) {
                const lengthA = nodeA.payload.content.length;
                const lengthB = nodeB.payload.content.length;
                const lengthDiff = Math.abs(lengthA - lengthB);
                similarity = 1 - (lengthDiff / Math.max(lengthA, lengthB));
                shouldLink = similarity > similarityThreshold;
              }
              break;
            case 'chunk_index':
              if (nodeA.payload?.chunk_index !== undefined && nodeB.payload?.chunk_index !== undefined) {
                const indexDiff = Math.abs(nodeA.payload.chunk_index - nodeB.payload.chunk_index);
                similarity = indexDiff <= 2 ? (1 - indexDiff / 3) : 0;
                shouldLink = similarity > similarityThreshold;
              }
              break;
            default:
              // Random linking for demonstration
              shouldLink = Math.random() > 0.8;
              similarity = Math.random();
          }
          
          if (shouldLink) {
            links.push({
              source: nodeA.id,
              target: nodeB.id,
              similarity: similarity,
              distance: useVariableDistance ? 
                visualizationSettings.minDistance + (visualizationSettings.maxDistance - visualizationSettings.minDistance) * (1 - similarity) :
                settings.linkDistance
            });
          }
        }
      }

      const processedGraphData = generateGraphLayout(nodes, links);
      setGraphData(processedGraphData);
      
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize node positions for stability
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
        }
      });
      
      resizeObserver.observe(containerRef.current);
      
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (graphData.nodes.length === 0) {
      setNodePositions(new Map());
    }
    fetchGraphData();
  }, [collectionName, settings.nodeLimit]);

  // Auto-refresh graph when visualization settings change and menu is pinned
  useEffect(() => {
    // Only refresh when settings actually change, not when menu is pinned/unpinned
    if (isMenuPinned && showVisualizationMenu) {
      console.log('Auto-refreshing graph due to settings change');
      const timeoutId = setTimeout(() => {
        fetchGraphData();
      }, 500); // Debounce changes by 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [visualizationSettings]); // Only depend on visualizationSettings changes

  // Generate graph layout based on current settings
  const generateGraphLayout = (nodes, links) => {
    // Graph layout is now handled by the configureD3Forces function
    // based on the graphType setting
    return { nodes, links };
  };

  // Configure D3 forces based on graph type and visualization settings
  const configureD3Forces = (d3) => {
    const { 
      graphType, 
      minDistance = 20, 
      maxDistance = 200, 
      similarityThreshold = 0.7,
      useVariableDistance = true,
      stabilizePositions = true
    } = visualizationSettings;
    
    // Clear existing forces
    d3.force('charge', null);
    d3.force('link', null);
    d3.force('center', null);
    d3.force('containment', null);
    d3.force('cluster', null);
    d3.force('tree', null);
    d3.force('hierarchy', null);
    
    // Base link distance calculation based on settings
    const baseLinkDistance = useVariableDistance ? 
      (link) => {
        if (link.similarity !== undefined) {
          // Higher similarity = closer distance
          const normalizedSimilarity = Math.max(0, Math.min(1, link.similarity));
          return minDistance + (maxDistance - minDistance) * (1 - normalizedSimilarity);
        }
        return (minDistance + maxDistance) / 2;
      } : 80;
    
    // Configure forces based on graph type
    switch (graphType) {
      case 'force-directed':
        // Standard D3 force-directed graph
        d3.force('charge', d3.forceManyBody().strength(-800));
        d3.force('link', d3.forceLink().id(d => d.id).distance(baseLinkDistance).strength(0.1));
        d3.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
        break;
        
      case 'disjoint-force':
        // Disjoint force-directed with containment
        d3.force('charge', d3.forceManyBody().strength(-600));
        d3.force('link', d3.forceLink().id(d => d.id).distance(baseLinkDistance).strength(0.3));
        d3.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.2));
        
        // Strong containment to prevent detached subgraphs
        d3.force('containment', () => {
          const nodes = d3.nodes();
          const viewportWidth = dimensions.width || 800;
          const viewportHeight = dimensions.height || 500;
          const margin = 30;
          
          nodes.forEach(node => {
            if (node.x < margin) {
              node.vx += (margin - node.x) * 0.5;
            }
            if (node.x > viewportWidth - margin) {
              node.vx += (viewportWidth - margin - node.x) * 0.5;
            }
            if (node.y < margin) {
              node.vy += (margin - node.y) * 0.5;
            }
            if (node.y > viewportHeight - margin) {
              node.vy += (viewportHeight - margin - node.y) * 0.5;
            }
          });
        });
        break;
        
      case 'force-tree':
        // Tree layout with hierarchical positioning
        d3.force('charge', d3.forceManyBody().strength(-400));
        d3.force('link', d3.forceLink().id(d => d.id).distance(baseLinkDistance).strength(0.8));
        d3.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.3));
        
        // Custom tree positioning
        d3.force('tree', () => {
          const nodes = d3.nodes();
          const levels = {};
          
          // Group nodes by chunk_index for hierarchical levels
          nodes.forEach(node => {
            const level = node.payload?.chunk_index || 0;
            if (!levels[level]) levels[level] = [];
            levels[level].push(node);
          });
          
          // Position nodes in tree-like structure
          Object.entries(levels).forEach(([level, levelNodes], levelIndex) => {
            const y = (dimensions.height / (Object.keys(levels).length + 1)) * (levelIndex + 1);
            levelNodes.forEach((node, nodeIndex) => {
              const x = (dimensions.width / (levelNodes.length + 1)) * (nodeIndex + 1);
              const targetX = x;
              const targetY = y;
              
              // Gentle force towards target position
              const dx = targetX - node.x;
              const dy = targetY - node.y;
              node.vx += dx * 0.1;
              node.vy += dy * 0.1;
            });
          });
        });
        break;
        
      case 'qdrant-native':
        // Replicate Qdrant's native graph appearance
        d3.force('charge', d3.forceManyBody().strength(-1000));
        d3.force('link', d3.forceLink().id(d => d.id).distance(baseLinkDistance).strength(0.05));
        d3.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.05));
        
        // Custom clustering force for Qdrant-style grouping
        d3.force('cluster', () => {
          const nodes = d3.nodes();
          const clusters = {};
          
          // Group nodes by department or file_type
          nodes.forEach(node => {
            const cluster = node.payload?.department || node.payload?.file_type || 'default';
            if (!clusters[cluster]) clusters[cluster] = [];
            clusters[cluster].push(node);
          });
          
          // Position clusters in circular arrangement
          const clusterKeys = Object.keys(clusters);
          clusterKeys.forEach((cluster, index) => {
            const angle = (2 * Math.PI * index) / clusterKeys.length;
            const clusterRadius = Math.min(dimensions.width, dimensions.height) / 4;
            const clusterX = dimensions.width / 2 + Math.cos(angle) * clusterRadius;
            const clusterY = dimensions.height / 2 + Math.sin(angle) * clusterRadius;
            
            clusters[cluster].forEach(node => {
              const dx = clusterX - node.x;
              const dy = clusterY - node.y;
              node.vx += dx * 0.1;
              node.vy += dy * 0.1;
            });
          });
        });
        break;
        
      case 'hierarchical-cluster':
        // Hierarchical clustering with document-based organization
        d3.force('charge', d3.forceManyBody().strength(-600));
        d3.force('link', d3.forceLink().id(d => d.id).distance(baseLinkDistance).strength(0.2));
        d3.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
        
        // Custom hierarchy force for document-based clustering
        d3.force('hierarchy', () => {
          const nodes = d3.nodes();
          const documents = {};
          
          // Group nodes by document_id
          nodes.forEach(node => {
            const docId = node.payload?.document_id || 'unknown';
            if (!documents[docId]) documents[docId] = [];
            documents[docId].push(node);
          });
          
          // Arrange documents in grid layout
          const docKeys = Object.keys(documents);
          const cols = Math.ceil(Math.sqrt(docKeys.length));
          const cellWidth = dimensions.width / cols;
          const cellHeight = dimensions.height / Math.ceil(docKeys.length / cols);
          
          docKeys.forEach((docId, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const centerX = cellWidth * (col + 0.5);
            const centerY = cellHeight * (row + 0.5);
            
            // Arrange nodes within each document in circular pattern
            const docNodes = documents[docId];
            docNodes.forEach((node, nodeIndex) => {
              const angle = (2 * Math.PI * nodeIndex) / docNodes.length;
              const radius = Math.min(cellWidth, cellHeight) / 4;
              const targetX = centerX + Math.cos(angle) * radius;
              const targetY = centerY + Math.sin(angle) * radius;
              
              const dx = targetX - node.x;
              const dy = targetY - node.y;
              node.vx += dx * 0.1;
              node.vy += dy * 0.1;
            });
          });
        });
        break;
        
      default:
        // Fallback to standard force-directed
        d3.force('charge', d3.forceManyBody().strength(-800));
        d3.force('link', d3.forceLink().id(d => d.id).distance(baseLinkDistance).strength(0.1));
        d3.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
    }
    
    // Add stabilization force if enabled
    if (stabilizePositions) {
      d3.force('stabilization', () => {
        const nodes = d3.nodes();
        const alpha = d3.alpha();
        
        // Reduce velocity as simulation cools down
        if (alpha < 0.1) {
          nodes.forEach(node => {
            if (!node.isAnchor) {
              node.vx *= 0.95;
              node.vy *= 0.95;
            }
          });
        }
      });
    }
  };

  // Handle node click
  const handleNodeClick = (node) => {
    handleNodeSelection(node);
    
    // Show node content tile
    if (node && node.payload) {
      setSelectedNodeContent({
        id: node.id,
        content: node.payload.content || 'No content available',
        filename: node.payload.filename || 'Unknown file',
        department: node.payload.department || 'Unknown',
        file_type: node.payload.file_type || 'Unknown',
        chunk_index: node.payload.chunk_index || 0
      });
      setShowNodeContent(true);
    }
  };

  // Handle node hover with completely stable positioning - NO STATE UPDATES
  const handleNodeHover = (node) => {
    if (node) {
      setIsHovering(true);
      setHoveredNode(node);
      
      if (visualizationSettings.showInterconnectivity) {
        // Find connected nodes without updating graphData
        const connectedNodeIds = new Set();
        const connectedLinkSet = new Set();
        
        graphData.links.forEach(link => {
          if (link.source === node.id || link.target === node.id) {
            connectedNodeIds.add(link.source === node.id ? link.target : link.source);
            connectedLinkSet.add(link);
          }
        });
        
        setHighlightedNodes(connectedNodeIds);
        setHighlightedLinks(connectedLinkSet);
      }
    } else {
      setIsHovering(false);
      setHoveredNode(null);
      setHighlightedNodes(new Set());
      setHighlightedLinks(new Set());
    }
  };

  // Handle node drag - NO STATE UPDATES
  const handleNodeDrag = (node) => {
    // D3 handles the drag internally, no need to update state
  };

  // Handle node drag end - NO STATE UPDATES
  const handleNodeDragEnd = (node) => {
    // D3 handles the drag internally, no need to update state
  };

  // Handle node selection
  const handleNodeSelection = (node) => {
    if (visualizationSettings.multiSelect) {
      const isAlreadySelected = selectedNodes.some(n => n.id === node.id);
      if (isAlreadySelected) {
        setSelectedNodes(selectedNodes.filter(n => n.id !== node.id));
      } else {
        setSelectedNodes([...selectedNodes, node]);
      }
    } else {
      setSelectedNode(node);
      setSelectedNodes([node]);
    }

    // Calculate interconnectivity for the selected node
    if (visualizationSettings.showInterconnectivity) {
      const connections = calculateNodeConnections(node, graphData, visualizationSettings.maxSeparationLevels);
      setNodeConnections(connections);
      
      if (visualizationSettings.highlightSelected) {
        setHighlightedNodes(connections.allConnected);
        setHighlightedLinks(new Set(connections.allLinks));
      }
    }
  };

  // Calculate node connections and separation levels
  const calculateNodeConnections = (startNode, graphData, maxLevels = 3) => {
    const levels = { 0: new Set([startNode.id]) };
    const allConnected = new Set([startNode.id]);
    const allLinks = [];
    
    for (let level = 0; level < maxLevels; level++) {
      const currentLevelNodes = levels[level];
      const nextLevelNodes = new Set();
      
      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (currentLevelNodes.has(sourceId) && !allConnected.has(targetId)) {
          nextLevelNodes.add(targetId);
          allConnected.add(targetId);
          allLinks.push(link);
        } else if (currentLevelNodes.has(targetId) && !allConnected.has(sourceId)) {
          nextLevelNodes.add(sourceId);
          allConnected.add(sourceId);
          allLinks.push(link);
        }
      });
      
      if (nextLevelNodes.size > 0) {
        levels[level + 1] = nextLevelNodes;
      } else {
        break;
      }
    }
    
    return { levels, allConnected, allLinks };
  };

  // Get color for separation level
  const getSeparationLevelColor = (level) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[level % colors.length];
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white relative">
      {/* Visualization Options Menu */}
      {showVisualizationMenu && (
        <div className="fixed left-0 top-0 bottom-0 z-40 w-80 bg-gray-800 border-r border-gray-600 shadow-lg overflow-hidden flex flex-col">
          <div className="flex-shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-700">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Visualization Options</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMenuPinned(!isMenuPinned)}
                  className={`p-2 rounded transition-colors ${
                    isMenuPinned ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  title={isMenuPinned ? 'Unpin menu' : 'Pin menu'}
                >
                  {isMenuPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowVisualizationMenu(false)}
                  className="p-2 hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Live Preview Toggle */}
            {isMenuPinned && (
              <div className="px-4 py-2 bg-blue-900/20 border-b border-blue-700/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-300 font-medium">Live Preview</span>
                  <span className="text-xs text-gray-400">Changes apply automatically</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6">
            {/* Graph Layout Options */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Graph Layout
              </h3>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white">Graph Visualization Type</label>
                <select
                  value={visualizationSettings.graphType}
                  onChange={(e) => setVisualizationSettings(prev => ({ ...prev, graphType: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                >
                  <option value="force-directed">1. Force-Directed Graph</option>
                  <option value="disjoint-force">2. Disjoint Force-Directed</option>
                  <option value="force-tree">3. Force-Directed Tree</option>
                  <option value="qdrant-native">4. Qdrant Native Style</option>
                  <option value="hierarchical-cluster">5. Hierarchical Clustering</option>
                </select>
                
                {/* Dynamic help text based on graph type */}
                <div className="text-sm text-gray-300 bg-gray-800 p-3 rounded">
                  {visualizationSettings.graphType === 'force-directed' && 'Standard D3 force-directed layout with natural clustering'}
                  {visualizationSettings.graphType === 'disjoint-force' && 'Disjoint force layout with stronger containment to prevent detached subgraphs'}
                  {visualizationSettings.graphType === 'force-tree' && 'Tree-like positioning with hierarchical arrangement based on chunk indices'}
                  {visualizationSettings.graphType === 'qdrant-native' && 'Replicates Qdrant dashboard style with circular cluster arrangement'}
                  {visualizationSettings.graphType === 'hierarchical-cluster' && 'Shows document hierarchy and semantic clustering'}
                </div>
              </div>
            </div>

            {/* Node Mobility & Interconnectivity Options */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Node Mobility & Interconnectivity
              </h3>
              
              <div className="space-y-4">
                {[
                  { key: 'stabilizePositions', label: 'Maintain Interconnectivity', desc: 'Keep related nodes connected while allowing movement' },
                  { key: 'showAnchors', label: 'Show Anchor Points', desc: 'Display central cluster anchors' }
                ].map((feature) => (
                  <label key={feature.key} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visualizationSettings[feature.key]}
                      onChange={(e) => setVisualizationSettings(prev => ({ ...prev, [feature.key]: e.target.checked }))}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-white font-medium">{feature.label}</div>
                      <div className="text-sm text-gray-400">{feature.desc}</div>
                    </div>
                  </label>
                ))}
                
                {/* Anchor Strength Control */}
                {visualizationSettings.showAnchors && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <label className="block text-sm font-medium text-white mb-1">
                      Anchor Strength: {(visualizationSettings.anchorStrength || 0.02).toFixed(3)}
                    </label>
                    <input
                      type="range"
                      min="0.001"
                      max="0.1"
                      step="0.001"
                      value={visualizationSettings.anchorStrength || 0.02}
                      onChange={(e) => setVisualizationSettings(prev => ({ 
                        ...prev, 
                        anchorStrength: parseFloat(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Weak</span>
                      <span>Strong</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Display Options */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Type className="w-4 h-4 mr-2" />
                Display Options
              </h3>
              
              <div className="space-y-4">
                {[
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
                      <div className="text-white font-medium">{feature.label}</div>
                      <div className="text-sm text-gray-400">{feature.desc}</div>
                    </div>
                  </label>
                ))}
                
                {/* Max Separation Levels */}
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
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1</span>
                      <span>7</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Node Distance & Similarity */}
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
                    <div className="text-white font-medium">Use Variable Distance</div>
                    <div className="text-sm text-gray-400">Position nodes based on similarity</div>
                  </div>
                </label>
              </div>
              
              {/* Similarity Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">Similarity Mode</label>
                <select
                  value={visualizationSettings.distanceMode}
                  onChange={(e) => setVisualizationSettings(prev => ({ ...prev, distanceMode: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                >
                  <option value="semantic">Semantic (Multi-factor)</option>
                  <option value="department">Department</option>
                  <option value="file_type">File Type</option>
                  <option value="document">Document</option>
                  <option value="content_length">Content Length</option>
                  <option value="chunk_index">Chunk Index</option>
                </select>
              </div>
              
              {/* Distance and Similarity Controls */}
              {visualizationSettings.useVariableDistance && (
                <div className="space-y-4">
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
                        className="w-full"
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
                        className="w-full"
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
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0.1</span>
                      <span>1.0</span>
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
              
              <div className="space-y-4">
                {[
                  { key: 'showClustering', label: 'Show Clustering', desc: 'Group similar nodes together' },
                  { key: 'showAnimations', label: 'Enable Animations', desc: 'Smooth node transitions' },
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
                      <div className="text-white font-medium">{feature.label}</div>
                      <div className="text-sm text-gray-400">{feature.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* Fixed Apply Changes Button at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
            <button
              onClick={() => {
                // Refresh graph data to apply new visualization settings
                fetchGraphData();
                if (!isMenuPinned) {
                  setShowVisualizationMenu(false);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors"
            >
              Apply Changes
            </button>
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
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel={settings.showLabels ? 'label' : ''}
            nodeColor={node => node.color || generateNodeColor(node)}
            nodeVal={node => node.size || generateNodeSize(node)}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.label || node.id;
              const fontSize = 12/globalScale;
              const size = node.size || generateNodeSize(node);
              
              // Set cursor for draggable nodes
              if (!node.isAnchor) {
                ctx.canvas.style.cursor = 'grab';
              }
              
              // Hide anchor nodes completely to eliminate visual artifacts
              if (node.isAnchor) {
                return;
              }
              
              // Determine node color based on selection, hover, and interconnectivity
              let nodeColor = node.color || generateNodeColor(node);
              
              // Apply hover highlighting first (highest priority)
              if (isHovering && hoveredNode && hoveredNode.id === node.id) {
                nodeColor = '#ff6b6b'; // Red for hovered node
              } else if (isHovering && highlightedNodes.has(node.id)) {
                nodeColor = '#4ecdc4'; // Teal for connected nodes during hover
              } else if (visualizationSettings.highlightSelected) {
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
              // Hide anchor links completely to eliminate visual artifacts
              if (link.isAnchorLink) {
                return 'rgba(0,0,0,0)'; // Transparent
              }
              
              // Only show interconnectivity if enabled
              if (!visualizationSettings.showInterconnectivity) {
                return 'rgba(255,255,255,0.1)'; // Very faint links
              }
              
              // Apply hover highlighting for links connected to hovered node
              if (isHovering && hoveredNode && 
                  (link.source === hoveredNode.id || link.target === hoveredNode.id)) {
                return 'rgba(255,255,255,0.9)'; // Bright white for hovered connections
              }
              
              if (highlightedLinks.has(link)) {
                return 'rgba(255,255,255,0.8)';
              }
              // Color based on similarity if available
              if (link.similarity !== undefined) {
                const intensity = Math.max(0, Math.min(1, link.similarity));
                return `rgba(255,255,255,${0.2 + intensity * 0.6})`;
              }
              return 'rgba(255,255,255,0.3)';
            }}
            linkWidth={(link) => {
              // Apply hover highlighting for links connected to hovered node
              if (isHovering && hoveredNode && 
                  (link.source === hoveredNode.id || link.target === hoveredNode.id)) {
                return settings.linkWidth * 2; // Thicker for hovered connections
              }
              
              if (highlightedLinks.has(link)) {
                return settings.linkWidth * 2;
              }
              // Special width for anchor links
              if (link.isAnchorLink) {
                return settings.linkWidth * 1.5;
              }
              // Width based on similarity if available
              if (link.similarity !== undefined) {
                const intensity = Math.max(0, Math.min(1, link.similarity));
                return settings.linkWidth * (0.5 + intensity * 1.5);
              }
              return settings.linkWidth;
            }}
            linkDistance={(link) => {
              // Use variable distance based on settings
              if (visualizationSettings.useVariableDistance && link.similarity !== undefined) {
                const { minDistance = 20, maxDistance = 200 } = visualizationSettings;
                const normalizedSimilarity = Math.max(0, Math.min(1, link.similarity));
                return minDistance + (maxDistance - minDistance) * (1 - normalizedSimilarity);
              }
              return link.distance || settings.linkDistance;
            }}
            d3Force={(d3) => {
              // Configure forces based on selected graph type
              configureD3Forces(d3);
            }}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            cooldownTicks={100}
            d3AlphaDecay={0.0228}
            d3VelocityDecay={0.4}
          />
        )}
      </div>

      {/* Node Content Tile - Slides out from right side */}
      {showNodeContent && selectedNodeContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowNodeContent(false)}
          />
          
          {/* Sliding Content Tile */}
          <div className="relative bg-gray-800 border-l border-gray-600 rounded-l-lg shadow-2xl w-full max-w-2xl max-h-[80vh] transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Node Content</h3>
              </div>
              <button
                onClick={() => setShowNodeContent(false)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Metadata */}
              <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Filename</div>
                  <div className="text-white font-medium">{selectedNodeContent.filename}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Department</div>
                  <div className="text-white font-medium">{selectedNodeContent.department}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs">File Type</div>
                  <div className="text-white font-medium">{selectedNodeContent.file_type}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Chunk Index</div>
                  <div className="text-white font-medium">{selectedNodeContent.chunk_index}</div>
                </div>
              </div>
              
              {/* Content Text */}
              <div className="bg-gray-700 rounded p-4">
                <div className="text-gray-400 text-xs mb-2">Content</div>
                <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNodeContent.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QdrantGraph;

