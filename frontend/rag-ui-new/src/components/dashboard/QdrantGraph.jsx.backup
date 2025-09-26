/**
 * Qdrant Graph Visualization Component
 * 
 * Interactive graph visualization for Qdrant collection data
 * showing vector relationships and clustering patterns.
 */

import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3';
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
  Layers,
  Pin,
  PinOff,
  Network
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
    showClustering: true,
    showAnimations: true,
    enableFiltering: true,
    multiSelect: false,
    showText: false, // Show/hide text labels
    textSize: 'small', // small, medium, large, tiny
    showInterconnectivity: true, // Show node connections
    maxSeparationLevels: 3, // Maximum levels of separation to show
    highlightSelected: true, // Highlight selected node and connections
    useVariableDistance: true, // Use variable distance based on similarity
    distanceMode: 'semantic', // semantic, department, file_type, document, content_length, chunk_index
    minDistance: 20, // Minimum distance between nodes
    maxDistance: 200, // Maximum distance between nodes
    similarityThreshold: 0.7, // Threshold for considering nodes similar
    graphType: 'force-directed', // force-directed, disjoint-force, force-tree, qdrant-native, hierarchical-cluster, auto-colored-3d
    showAnchors: true, // Show central anchor points
    use3D: false, // Toggle between 2D and 3D visualization
    anchorStrength: 0.02, // Strength of anchor connections
    maintainInterconnectivity: true, // Maintain interconnectivity
    hubSpokeMode: true, // Enable hub and spoke model
    spokesPerHub: 5, // Number of spokes per hub
    maxHubs: 10 // Maximum number of hubs allowed
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [nodeConnections, setNodeConnections] = useState({});
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState(new Set());
  const [hubs, setHubs] = useState([]); // Track created hubs
  const [hubConnections, setHubConnections] = useState([]); // Track hub-to-hub connections
  const [nodePositions, setNodePositions] = useState(new Map()); // Track stable positions
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const [isMenuPinned, setIsMenuPinned] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [showNodeContent, setShowNodeContent] = useState(false);
  const [selectedNodeContent, setSelectedNodeContent] = useState(null);
  const [showContentFlag, setShowContentFlag] = useState(false);
  const [doubleClickTest, setDoubleClickTest] = useState(false);
  const [initialHubConfig, setInitialHubConfig] = useState({
    numberOfHubs: 1,
    nodesPerHub: 5, // Will be overridden by visualizationSettings.spokesPerHub
    autoGenerate: false // Disabled - Qdrant should start with single node only
  });
  const graphRef = useRef();
  const containerRef = useRef();

  // Helper functions for visualization
  const generateNodeLabel = (node) => {
    const { labelMode } = visualizationSettings;
    const payload = node.payload || {};
    
    switch (labelMode) {
      case 'filename':
        return payload.filename ? payload.filename.substring(0, 20) + '...' : `Point ${String(node.id || '').substring(0, 8)}`;
      case 'chunk_index':
        return `Chunk ${payload.chunk_index || 0}`;
      case 'document_id':
        return payload.document_id ? payload.document_id.substring(0, 12) + '...' : `Doc ${String(node.id || '').substring(0, 8)}`;
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

  // Generate automatic colors for auto-colored 3D visualization
  const generateAutoColor = (node, index, totalNodes) => {
    const { colorScheme } = visualizationSettings;
    const payload = node.payload || {};
    
    // Create a color palette based on the scheme
    const colorPalettes = {
      'group': ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'],
      'department': ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f'],
      'file_type': ['#ff4757', '#3742fa', '#2ed573', '#ffa502', '#ff6348', '#5352ed', '#ff3838', '#2f3542', '#ff6b6b', '#5f27cd'],
      'document': ['#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
      'chunk_index': ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43']
    };
    
    const palette = colorPalettes[colorScheme] || colorPalettes['group'];
    
    // Determine color based on scheme
    let colorIndex = 0;
    switch (colorScheme) {
      case 'group':
        colorIndex = (node.group || 0) % palette.length;
        break;
      case 'department':
        const dept = payload.department || 'unknown';
        colorIndex = dept.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
        break;
      case 'file_type':
        const fileType = payload.file_type || 'unknown';
        colorIndex = fileType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
        break;
      case 'document':
        const docId = payload.document_id || node.id;
        colorIndex = docId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
        break;
      case 'chunk_index':
        const chunkIdx = payload.chunk_index || 0;
        colorIndex = chunkIdx % palette.length;
        break;
      default:
        colorIndex = index % palette.length;
    }
    
    return palette[colorIndex];
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
        // Special color for star centers ONLY in Qdrant Native layout
        if (node.isStarCenter && visualizationSettings.graphType === 'qdrant-native') {
          return '#ff6b6b'; // Bright red for star centers
        }
        // Different colors for different stars ONLY in Qdrant Native layout
        if (node.starId && visualizationSettings.graphType === 'qdrant-native') {
          const starIndex = parseInt(node.starId.split('_')[1]) || 0;
          const colors = ['#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
          return colors[starIndex % colors.length];
        }
        // Enhanced color scheme for clustering
        if (visualizationSettings.showClustering) {
          const clusterColors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
            '#54a0ff', '#5f27cd', '#00d2d3', '#e74c3c', '#3498db', '#2ecc71'
          ];
          return clusterColors[node.group % clusterColors.length];
        }
        // Standard color scheme for other layouts
        return node.group % 2 === 0 ? '#4ecdc4' : '#45b7d1';
    }
  };

  const generateNodeSize = (node) => {
    const { sizeMode } = visualizationSettings;
    const payload = node.payload || {};
    const baseSize = settings.nodeSize;
    
    // Make star centers larger ONLY in Qdrant Native layout
    if (node.isStarCenter && visualizationSettings.graphType === 'qdrant-native') {
      return baseSize * 2.0; // Star centers are 2x larger
    }
    
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

  // Generate initial hub and spoke objects based on configuration
  const generateInitialHubSpokeObjects = (nodes) => {
    if (!initialHubConfig.autoGenerate || nodes.length === 0) return { hubs: [], links: [] };
    
    // Use Hub & Spoke Model settings from Visualization Options
    const numberOfHubs = initialHubConfig.numberOfHubs; // Default to 1
    const nodesPerHub = visualizationSettings.spokesPerHub; // Use spokes per hub from Hub & Spoke Model
    const generatedHubs = [];
    const generatedLinks = [];
    
    console.log(`Generating ${numberOfHubs} initial hubs with ${nodesPerHub} nodes each`);
    
    // Create multiple independent hub clusters
    const shuffledNodes = [...nodes].sort(() => Math.random() - 0.5);
    const usedNodes = new Set();
    
    for (let hubIndex = 0; hubIndex < numberOfHubs; hubIndex++) {
      // Find an unused node as hub center
      const centerNode = shuffledNodes.find(node => !usedNodes.has(node.id));
      if (!centerNode) break;
      
      usedNodes.add(centerNode.id);
      
      const hubId = `initial_hub_${hubIndex}`;
      // Position hubs in a distributed pattern
      const angle = (hubIndex * 2 * Math.PI) / numberOfHubs;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
      const hubX = dimensions.width / 2 + Math.cos(angle) * radius;
      const hubY = dimensions.height / 2 + Math.sin(angle) * radius;
      
      const hub = {
        id: hubId,
        isHub: true,
        group: `initial_hub_${hubIndex}`,
        label: `Hub ${hubIndex + 1}`,
        color: '#ff6b6b', // Same red color as regular hubs
        size: (settings.nodeSize * 3), // Same 3x size as regular hubs
        x: hubX,
        y: hubY,
        payload: { type: 'hub', sourceNode: centerNode.id } // Same payload type as regular hubs
      };
      
      // Find most similar nodes for this hub (excluding already used nodes)
      const availableNodes = nodes.filter(node => 
        node.id !== centerNode.id && 
        !usedNodes.has(node.id)
      );
      
      const similarNodes = findMostSimilarNodes(centerNode, availableNodes, nodesPerHub);
      
      // Mark similar nodes as used to prevent overlap between hubs
      similarNodes.forEach(node => usedNodes.add(node.id));
      
      // Position spoke nodes around the hub in a spoke pattern
      const spokeAngleStep = (2 * Math.PI) / similarNodes.length;
      similarNodes.forEach((spokeNode, spokeIndex) => {
        const spokeAngle = spokeIndex * spokeAngleStep;
        const spokeRadius = 100; // Distance from hub to spokes
        const spokeX = hubX + Math.cos(spokeAngle) * spokeRadius;
        const spokeY = hubY + Math.sin(spokeAngle) * spokeRadius;
        
        // Update spoke node position
        spokeNode.x = spokeX;
        spokeNode.y = spokeY;
      });
      
      // Create hub connections (same as regular hub-spoke links)
      const hubLinks = similarNodes.map(spokeNode => ({
        source: hubId,
        target: spokeNode.id,
        value: 1,
        distance: 80,
        type: 'hub-spoke', // Same type as regular hub-spoke links
        similarity: calculateNodeSimilarity(centerNode, spokeNode)
      }));
      
      // Create connection to center node (same as regular hub-source links)
      const centerLink = {
        source: hubId,
        target: centerNode.id,
        value: 1,
        distance: 60,
        type: 'hub-source', // Same type as regular hub-source links
        similarity: 1.0
      };
      
      generatedHubs.push(hub);
      generatedLinks.push(...hubLinks, centerLink);
    }
    
    console.log(`Generated ${generatedHubs.length} initial hubs with ${generatedLinks.length} total links`);
    return { hubs: generatedHubs, links: generatedLinks };
  };

  // Find most similar nodes for hub and spoke model
  const findMostSimilarNodes = (sourceNode, allNodes, count) => {
    console.log('Finding similar nodes for:', sourceNode.id, 'from', allNodes.length, 'total nodes');
    
    const filteredNodes = allNodes.filter(node => node.id !== sourceNode.id && !node.isHub);
    console.log('Filtered nodes (excluding self and hubs):', filteredNodes.length);
    
    const similarities = filteredNodes
      .map(node => {
        const similarity = calculateNodeSimilarity(sourceNode, node);
        console.log(`Similarity between ${sourceNode.id} and ${node.id}:`, similarity);
        return {
          node,
          similarity
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, count);
    
    console.log('Top similarities:', similarities.map(s => ({ id: s.node.id, similarity: s.similarity })));
    
    return similarities.map(item => item.node);
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
    const { useVariableDistance, graphType } = visualizationSettings;
    
    if (!useVariableDistance) {
      // For force-directed graphs, use content-based similarity instead of random connections
      if (graphType === 'force-directed') {
        // Create links based on document similarity for meaningful clustering
        for (let i = 0; i < Math.min(nodes.length, 50); i++) {
          for (let j = i + 1; j < Math.min(nodes.length, 50); j++) {
            const similarity = calculateNodeSimilarity(nodes[i], nodes[j]);
            const threshold = 0.3; // Only connect nodes with reasonable similarity
            
            if (similarity > threshold) {
              links.push({
                source: nodes[i].id,
                target: nodes[j].id,
                value: similarity,
                distance: 100 - (similarity * 50), // Closer nodes for higher similarity
                similarity: similarity
              });
            }
          }
        }
        return links;
      } else {
        // Use sparse random connections for other graph types
        const connectionProbability = 0.2;
        for (let i = 0; i < Math.min(nodes.length, 50); i++) {
          for (let j = i + 1; j < Math.min(nodes.length, 50); j++) {
            if (Math.random() > (1 - connectionProbability)) {
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

  // Configure D3 forces based on graph type and visualization settings
  const configureD3Forces = (d3) => {
    console.log('=== configureD3Forces called ===');
    console.log('d3 object:', d3);
    console.log('d3 type:', typeof d3);
    console.log('d3 methods:', Object.getOwnPropertyNames(d3));
    console.log('visualizationSettings:', visualizationSettings);
    
    const { 
      graphType, 
      minDistance = 20, 
      maxDistance = 200, 
      similarityThreshold = 0.7,
      useVariableDistance = true,
      maintainInterconnectivity = true
    } = visualizationSettings;
    
    console.log('Configuring D3 forces for graph type:', graphType);
    console.log('graphType value:', JSON.stringify(graphType));
    console.log('graphType type:', typeof graphType);
    
    // The d3 object is the D3 library, not the simulation
    // We need to return force configuration functions that will be called by the simulation
    console.log('Returning force configuration functions for D3 library');
    
    // Return a function that configures the simulation
    return (simulation) => {
      console.log('=== D3 simulation object received ===');
      console.log('simulation object:', simulation);
      console.log('simulation.force method:', typeof simulation.force);
      console.log('graphType in simulation function:', graphType);
      
      if (typeof simulation.force !== 'function') {
        console.error('simulation.force is not a function. simulation object:', simulation);
        return;
      }
    
      // Clear existing forces
      simulation.force('charge', null);
      simulation.force('link', null);
      simulation.force('center', null);
      simulation.force('containment', null);
      simulation.force('cluster', null);
      simulation.force('tree', null);
      simulation.force('hierarchy', null);
    
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
      console.log('Switch statement - graphType:', graphType);
      switch (graphType) {
        case 'force-directed':
          // Standard D3 force-directed graph
          console.log('✅ Applying force-directed layout');
          simulation.force('charge', d3.forceManyBody().strength(-800));
          simulation.force('link', d3.forceLink().id(d => d.id).distance(80).strength(0.1));
          simulation.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
          break;
        
        case 'disjoint-force':
          // Disjoint force-directed with containment
          console.log('✅ Applying disjoint-force layout');
          simulation.force('charge', d3.forceManyBody().strength(-600));
          simulation.force('link', d3.forceLink().id(d => d.id).distance(60).strength(0.3));
          simulation.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.2));
        
          // Strong containment to prevent detached subgraphs
          simulation.force('containment', () => {
            const nodes = simulation.nodes();
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
          console.log('✅ Applying force-tree layout');
          simulation.force('charge', d3.forceManyBody().strength(-400));
          simulation.force('link', d3.forceLink().id(d => d.id).distance(100).strength(0.8));
          simulation.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.3));
        
          // Custom tree positioning
          simulation.force('tree', () => {
            const nodes = simulation.nodes();
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
          console.log('✅ Applying qdrant-native layout');
          simulation.force('charge', d3.forceManyBody().strength(-1000));
          simulation.force('link', d3.forceLink().id(d => d.id).distance(60).strength(0.05));
          simulation.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.05));
        
          // Custom clustering force for Qdrant-style grouping
          simulation.force('cluster', () => {
            const nodes = simulation.nodes();
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
          console.log('✅ Applying hierarchical-cluster layout');
          simulation.force('charge', d3.forceManyBody().strength(-600));
          simulation.force('link', d3.forceLink().id(d => d.id).distance(70).strength(0.2));
          simulation.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
        
          // Custom hierarchy force for document-based clustering
          simulation.force('hierarchy', () => {
            const nodes = simulation.nodes();
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
          console.log('❌ Applying default force-directed layout (no match found)');
          simulation.force('charge', d3.forceManyBody().strength(-800));
          simulation.force('link', d3.forceLink().id(d => d.id).distance(80).strength(0.1));
          simulation.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
      }
    
      // Add stabilization force if enabled
      if (maintainInterconnectivity) {
        simulation.force('stabilization', () => {
          const nodes = simulation.nodes();
          const alpha = simulation.alpha();
          
          // Reduce velocity as simulation cools down to maintain positions
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
          limit: visualizationSettings.graphType === 'qdrant-native' ? 1 : settings.nodeLimit, // Use Node Limit for non-Qdrant graphs
          with_payload: true,
          with_vector: false, // Don't fetch vectors for performance
          filter: null // Add explicit filter parameter
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

      // Create nodes from points with filtering
      const nodes = points
        .filter((point, index) => {
          // Apply filtering if enabled
          if (!visualizationSettings.enableFiltering) return true;
          
          const payload = point.payload || {};
          
          // Enhanced filtering criteria
          const hasValidContent = payload.filename || payload.document_id || payload.department;
          const hasContent = payload.content && payload.content.length > 10; // Minimum content length
          const hasValidFileType = payload.file_type && payload.file_type !== 'unknown';
          const hasProcessingInfo = payload.processed_at || payload.chunk_index !== undefined;
          
          // Include nodes that meet at least one quality criteria
          const shouldInclude = hasValidContent && (hasContent || hasValidFileType || hasProcessingInfo);
          
          if (!shouldInclude) {
            console.log(`Filtering out node ${point.id}:`, {
              hasValidContent,
              hasContent: hasContent ? `content length: ${payload.content?.length}` : false,
              hasValidFileType,
              hasProcessingInfo,
              payload: Object.keys(payload)
            });
          }
          
          return shouldInclude;
        });
        
      // Log filtering results
      if (visualizationSettings.enableFiltering) {
        console.log(`Filtering results: ${nodes.length} nodes included out of ${points.length} total points`);
      }
      
      const processedNodes = nodes.map((point, index) => {
          const node = {
            id: point.id || `point_${index}`,
          group: visualizationSettings.graphType === 'qdrant-native' 
            ? Math.floor(index / 10) 
            : (visualizationSettings.showClustering ? 
                (point.payload?.document_id ? 
                  parseInt(point.payload.document_id.toString().slice(-2), 16) % 6 : 
                  Math.floor(index / 5)) :
                (point.payload?.document_id ? 
                  point.payload.document_id.toString().slice(-2) : 
                  Math.floor(index / 3))), // Enhanced grouping for clustering
            payload: point.payload || {},
            chunkIndex: point.payload?.chunk_index || 0,
            documentId: point.payload?.document_id || null
          };
        
        // Add multi-star properties ONLY for Qdrant Native layout
        if (visualizationSettings.graphType === 'qdrant-native') {
          // Create multiple star clusters (4-6 stars depending on data size)
          const totalStars = Math.min(6, Math.max(4, Math.ceil(points.length / 8)));
          const nodesPerStar = Math.ceil(points.length / totalStars);
          
          if (index < totalStars) {
            // First few nodes become star centers
            node.isCenter = true;
            node.isStarCenter = true;
            node.starId = `star_${index}`;
            node.depth = 0;
            node.group = `star_${index}`;
          } else {
            // Other nodes become spokes of stars
            const starIndex = Math.floor((index - totalStars) / (nodesPerStar - 1));
            const nodeIndex = (index - totalStars) % (nodesPerStar - 1);
            
            node.isCenter = false;
            node.isStarCenter = false;
            node.starId = `star_${starIndex}`;
            node.depth = 1;
            node.starIndex = starIndex;
            node.nodeIndex = nodeIndex;
            node.group = `star_${starIndex}`;
          }
        } else {
          // For other graph types, use standard grouping
          node.isCenter = false;
          node.isStarCenter = false;
          node.starId = null;
          node.depth = 0;
          node.starIndex = null;
          node.nodeIndex = null;
        }
        
        // Generate label, color, and size based on visualization settings
        node.label = generateNodeLabel(node);
        node.color = generateNodeColor(node);
        node.size = generateNodeSize(node);
        
        return node;
      });

      // Add anchor nodes if showAnchors is enabled
      let finalNodes = processedNodes;
      if (visualizationSettings.showAnchors) {
        console.log('✅ Creating anchor nodes');
        const anchorNodes = [];
        
        // Create anchor nodes for each group
        const groups = [...new Set(processedNodes.map(node => node.group))];
        groups.forEach((group, index) => {
          const anchorNode = {
            id: `anchor_${group}`,
            isAnchor: true,
            group: group,
            label: `Anchor ${group}`,
            color: '#ffd700', // Gold color
            size: settings.nodeSize * 2, // 2x the Node Size setting
            x: (index % 3) * (dimensions.width / 3) + (dimensions.width / 6),
            y: Math.floor(index / 3) * (dimensions.height / 3) + (dimensions.height / 6),
            payload: { type: 'anchor', group: group }
          };
          anchorNodes.push(anchorNode);
        });
        
        finalNodes = [...processedNodes, ...anchorNodes];
        console.log(`Created ${anchorNodes.length} anchor nodes for ${groups.length} groups`);
      }

      // Create links based on graph type
      let links;
      if (visualizationSettings.graphType === 'qdrant-native') {
        // Create multi-star topology links
        links = [];
        
        // Group nodes by star
        const starGroups = {};
        nodes.forEach(node => {
          if (node.starId) {
            if (!starGroups[node.starId]) {
              starGroups[node.starId] = { center: null, spokes: [] };
            }
            if (node.isStarCenter) {
              starGroups[node.starId].center = node;
            } else {
              starGroups[node.starId].spokes.push(node);
            }
          }
        });
        
        // Create intra-star connections (center to spokes only)
        Object.values(starGroups).forEach(star => {
          if (star.center) {
            star.spokes.forEach(spoke => {
              links.push({
                source: star.center.id,
                target: spoke.id,
                distance: 60,
                strength: 0.9,
                type: 'intra-star'
              });
            });
          }
        });
        
        // Create inter-star connections (star centers to other star centers)
        const starCenters = Object.values(starGroups).map(star => star.center).filter(Boolean);
        starCenters.forEach((center1, i) => {
          starCenters.forEach((center2, j) => {
            if (i < j) { // Avoid duplicate connections
              // Only connect stars that are different
              if (center1.starId !== center2.starId) {
                links.push({
                  source: center1.id,
                  target: center2.id,
                  distance: 120,
                  strength: 0.3,
                  type: 'inter-star'
                });
              }
            }
          });
        });
      } else {
        // Use variable distance links for other graph types (including force-directed)
        links = generateVariableDistanceLinks(finalNodes);
      }

      // Add anchor connections if anchors are enabled
      if (visualizationSettings.showAnchors) {
        console.log('✅ Creating anchor connections');
        const anchorLinks = [];
        const anchorNodes = finalNodes.filter(node => node.isAnchor);
        const regularNodes = finalNodes.filter(node => !node.isAnchor);
        
        // Connect each regular node to its group's anchor
        regularNodes.forEach(node => {
          const groupAnchor = anchorNodes.find(anchor => anchor.group === node.group);
          if (groupAnchor) {
            anchorLinks.push({
              source: node.id,
              target: groupAnchor.id,
              value: visualizationSettings.anchorStrength || 0.02,
              distance: 50,
              type: 'anchor-connection'
            });
          }
        });
        
        links = [...links, ...anchorLinks];
        console.log(`Created ${anchorLinks.length} anchor connections`);
      }

      // Create initial hub with spokes (only for Qdrant graphs)
      if (finalNodes.length > 0 && visualizationSettings.hubSpokeMode && visualizationSettings.graphType === 'qdrant-native') {
        const hubNode = finalNodes[0]; // Use the first node as the hub
        const spokesPerHub = visualizationSettings.spokesPerHub;
        const spokeNodes = [];
        const spokeLinks = [];
        
        console.log(`Creating initial Qdrant hub with ${spokesPerHub} spokes for node:`, hubNode.id);
        
        // Create spoke nodes around the hub
        for (let i = 0; i < spokesPerHub; i++) {
          const spokeId = `initial_spoke_${i}`;
          const angle = (i * 2 * Math.PI) / spokesPerHub;
          const radius = 150; // Distance from hub to spokes
          const spokeX = hubNode.x + Math.cos(angle) * radius;
          const spokeY = hubNode.y + Math.sin(angle) * radius;
          
          const spokeNode = {
            id: spokeId,
            label: `Spoke ${i + 1}`,
            color: generateNodeColor({ payload: {} }),
            size: generateNodeSize({ payload: {} }),
            x: spokeX,
            y: spokeY,
            payload: { 
              type: 'initial_spoke',
              sourceNode: hubNode.id,
              content: `Initial spoke node ${i + 1} connected to ${hubNode.id}`,
              filename: `initial_spoke_${i}`,
              department: 'Generated',
              file_type: 'generated'
            }
          };
          
          spokeNodes.push(spokeNode);
          
          // Create connection from hub to spoke
          const spokeLink = {
            source: hubNode.id,
            target: spokeId,
            value: 1,
            distance: 80,
            type: 'hub-spoke',
            similarity: 1.0
          };
          
          spokeLinks.push(spokeLink);
        }
        
        // Combine hub node with spoke nodes
        const allNodes = [...finalNodes, ...spokeNodes];
        const allLinks = [...links, ...spokeLinks];
        
        console.log(`✅ Created initial Qdrant hub with ${spokeNodes.length} spokes`);
        setGraphData({ nodes: allNodes, links: allLinks });
      } else {
        // Non-Qdrant graphs use Node Limit setting
        console.log(`✅ Graph loaded with ${finalNodes.length} nodes (Node Limit: ${settings.nodeLimit})`);
        setGraphData({ nodes: finalNodes, links });
      }
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

  // Keyboard shortcuts for hub management
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Delete key to remove selected hub
      if (event.key === 'Delete' && selectedNode && (selectedNode.isHub || selectedNode.payload?.type === 'spoke_node')) {
        const hubId = selectedNode.isHub ? selectedNode.id : selectedNode.payload?.sourceNode;
        const nodesToDelete = graphData.nodes.filter(node => 
          node.id === hubId || 
          node.payload?.sourceNode === hubId ||
          node.id === selectedNode.id
        );
        const linksToDelete = graphData.links.filter(link => 
          nodesToDelete.some(node => node.id === link.source.id || node.id === link.target.id)
        );
        
        setGraphData(prev => ({
          nodes: prev.nodes.filter(node => !nodesToDelete.some(n => n.id === node.id)),
          links: prev.links.filter(link => !linksToDelete.some(l => l === link))
        }));
        
        setSelectedNode(null);
        console.log(`Deleted hub and ${nodesToDelete.length - 1} associated nodes (keyboard shortcut)`);
      }
      
      // Escape key to clear selection
      if (event.key === 'Escape') {
        setSelectedNode(null);
        setSelectedNodes([]);
        setShowContentFlag(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedNode, graphData]);

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

  // Apply forces when graph type changes
  useEffect(() => {
    console.log('Graph type changed to:', visualizationSettings.graphType);
    if (graphRef.current) {
      console.log('=== Applying forces via useEffect ===');
      console.log('graphRef.current:', graphRef.current);
      console.log('graphRef.current.d3Force:', typeof graphRef.current.d3Force);
      
      // Apply forces directly using the graph reference
      const { graphType } = visualizationSettings;
      console.log('Switch statement - graphType:', graphType);
      
      switch (graphType) {
        case 'force-directed':
          console.log('✅ Applying force-directed layout');
          if (graphRef.current.d3Force) {
            // Standard force-directed layout following D3 best practices
            // Charge force: repulsion between all nodes
            graphRef.current.d3Force('charge', d3.forceManyBody().strength(-300));
            
            // Link force: attraction between connected nodes
            const linkStrength = visualizationSettings.maintainInterconnectivity ? 0.3 : 0.1;
            graphRef.current.d3Force('link', d3.forceLink()
              .id(d => d.id)
              .distance(100)
              .strength(linkStrength)
            );
            
            // Center force: gentle attraction to center
            graphRef.current.d3Force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
            
            // Collision force: prevent node overlap with proper radius
            graphRef.current.d3Force('collide', d3.forceCollide()
              .radius(d => (d.size || 8) + 5)
              .iterations(2)
            );
            
            // Clustering force: group nodes by similarity when enabled
            if (visualizationSettings.showClustering) {
              console.log('✅ Applying clustering force');
              // Use stronger X and Y forces to create distinct clusters
              graphRef.current.d3Force('x', d3.forceX(d => {
                const groupCenter = (d.group % 4) * (dimensions.width / 4) + (dimensions.width / 8);
                return groupCenter;
              }).strength(0.6));
              
              graphRef.current.d3Force('y', d3.forceY(d => {
                const groupCenter = Math.floor(d.group / 4) * (dimensions.height / 4) + (dimensions.height / 8);
                return groupCenter;
              }).strength(0.6));
              
              // Add a weak radial force to keep clusters compact
              graphRef.current.d3Force('radial', d3.forceRadial()
                .radius(d => 50 + (d.group % 3) * 30)
                .strength(0.1)
              );
            }
            
            // Anchor force: attract nodes to their group anchors
            if (visualizationSettings.showAnchors) {
              console.log('✅ Applying anchor force');
              graphRef.current.d3Force('anchor', d3.forceRadial()
                .radius(d => {
                  if (d.isAnchor) return 0; // Anchors stay in place
                  return 50; // Regular nodes are attracted to radius 50 from anchor
                })
                .strength(d => {
                  if (d.isAnchor) return 0; // Anchors don't move
                  return visualizationSettings.anchorStrength || 0.02; // Use anchor strength setting
                })
              );
            }
          }
          break;
          
        case 'disjoint-force':
          console.log('✅ Applying disjoint-force layout');
          if (graphRef.current.d3Force) {
            // Adjust link strength based on maintain interconnectivity setting
            const linkStrength = visualizationSettings.maintainInterconnectivity ? 0.5 : 0.3;
            graphRef.current.d3Force('charge', d3.forceManyBody().strength(-600));
            graphRef.current.d3Force('link', d3.forceLink().id(d => d.id).distance(60).strength(linkStrength));
            graphRef.current.d3Force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.2));
          }
          break;
          
        case 'force-tree':
          console.log('✅ Applying force-tree layout');
          if (graphRef.current.d3Force) {
            graphRef.current.d3Force('charge', d3.forceManyBody().strength(-400));
            graphRef.current.d3Force('link', d3.forceLink().id(d => d.id).distance(100).strength(0.8));
            graphRef.current.d3Force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.3));
          }
          break;
          
        case 'qdrant-native':
          console.log('✅ Applying qdrant-native layout (Multi-Star)');
          if (graphRef.current.d3Force) {
            // Create multi-star layout with distributed star clusters
            graphRef.current.d3Force('charge', d3.forceManyBody().strength(-200));
            graphRef.current.d3Force('link', d3.forceLink().id(d => d.id).distance(d => {
              // Different distances for different link types
              if (d.type === 'intra-star') return 60;  // Short spokes
              if (d.type === 'inter-star') return 120; // Longer inter-star connections
              return 80; // Default
            }).strength(d => {
              // Different strengths for different link types
              const baseStrength = visualizationSettings.maintainInterconnectivity ? 0.9 : 0.6;
              if (d.type === 'intra-star') return baseStrength;  // Strong intra-star connections
              if (d.type === 'inter-star') return visualizationSettings.maintainInterconnectivity ? 0.5 : 0.3;  // Weaker inter-star connections
              return 0.5; // Default
            }));
            graphRef.current.d3Force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.2));
            
            // Add positioning force to arrange stars in distributed pattern
            graphRef.current.d3Force('position', () => {
              const nodes = graphData.nodes;
              const centerX = dimensions.width / 2;
              const centerY = dimensions.height / 2;
              
              // Group nodes by star
              const starGroups = {};
              nodes.forEach(node => {
                if (node.starId) {
                  if (!starGroups[node.starId]) {
                    starGroups[node.starId] = { center: null, spokes: [] };
                  }
                  if (node.isStarCenter) {
                    starGroups[node.starId].center = node;
                  } else {
                    starGroups[node.starId].spokes.push(node);
                  }
                }
              });
              
              // Position star centers in a distributed pattern
              const starCenters = Object.values(starGroups).map(star => star.center).filter(Boolean);
              const starCount = starCenters.length;
              
              starCenters.forEach((center, i) => {
                if (center) {
                  // Position star centers in a circle around the viewport center
                  const angle = (2 * Math.PI * i) / starCount;
                  const radius = Math.min(dimensions.width, dimensions.height) / 3;
                  center.x = centerX + Math.cos(angle) * radius;
                  center.y = centerY + Math.sin(angle) * radius;
                  
                  // Position spokes around their star center
                  const spokes = starGroups[center.starId]?.spokes || [];
                  spokes.forEach((spoke, spokeIndex) => {
                    const spokeAngle = (2 * Math.PI * spokeIndex) / Math.max(spokes.length, 1);
                    const spokeRadius = 40; // Fixed distance for spokes
                    spoke.x = center.x + Math.cos(spokeAngle) * spokeRadius;
                    spoke.y = center.y + Math.sin(spokeAngle) * spokeRadius;
                  });
                }
              });
            });
          }
          break;
          
        case 'hierarchical-cluster':
          console.log('✅ Applying hierarchical-cluster layout');
          if (graphRef.current.d3Force) {
            graphRef.current.d3Force('charge', d3.forceManyBody().strength(-600));
            graphRef.current.d3Force('link', d3.forceLink().id(d => d.id).distance(70).strength(0.2));
            graphRef.current.d3Force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
          }
          break;
          
        default:
          console.log('❌ Applying default force-directed layout (no match found)');
          if (graphRef.current.d3Force) {
            graphRef.current.d3Force('charge', d3.forceManyBody().strength(-800));
            graphRef.current.d3Force('link', d3.forceLink().id(d => d.id).distance(80).strength(0.1));
            graphRef.current.d3Force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1));
          }
      }
    }
  }, [visualizationSettings.graphType]);

  // Handle node selection with multi-select support
  const handleNodeSelection = (node) => {
    if (!node) return;
    
    if (visualizationSettings.multiSelect) {
      // Multi-select mode: toggle selection
      const isSelected = selectedNodes.some(n => n.id === node.id);
      if (isSelected) {
        setSelectedNodes(prev => prev.filter(n => n.id !== node.id));
      } else {
        setSelectedNodes(prev => [...prev, node]);
      }
    } else {
      // Single select mode: replace selection
      setSelectedNodes([node]);
    }
    
    // Set the primary selected node for details panel
    setSelectedNode(node);
    
    // Show content flag when node is selected
    setShowContentFlag(true);
  };

  // Handle double-click to create new nodes with spoke connections
  const handleNodeDoubleClick = (node) => {
    console.log('=== DOUBLE-CLICK EVENT TRIGGERED ===');
    console.log('Node:', node);
    console.log('Node ID:', node?.id);
    console.log('Hub mode enabled:', visualizationSettings.hubSpokeMode);
    
    if (!visualizationSettings.hubSpokeMode) {
      console.log('Hub & Spoke mode is disabled');
      return;
    }
    
    console.log('Creating new nodes connected to:', node.id);
    
    // Create new nodes with spoke connections
    const spokesPerHub = visualizationSettings.spokesPerHub;
    const newNodes = [];
    const newLinks = [];
    
    console.log(`Creating ${spokesPerHub} new nodes with spoke connections to:`, node.id);
    
    // Create new spoke nodes
    for (let i = 0; i < spokesPerHub; i++) {
      const newNodeId = `spoke_${Date.now()}_${i}`;
      const angle = (i * 2 * Math.PI) / spokesPerHub;
      const radius = 150; // Distance from hub to spokes
      const newNodeX = node.x + Math.cos(angle) * radius;
      const newNodeY = node.y + Math.sin(angle) * radius;
      
      const newNode = {
        id: newNodeId,
        label: `Spoke ${i + 1}`,
        color: generateNodeColor({ payload: {} }), // Use standard node color
        size: generateNodeSize({ payload: {} }), // Use standard node size
        x: newNodeX,
        y: newNodeY,
        payload: { 
          type: 'spoke_node',
          sourceNode: node.id,
          content: `Spoke node ${i + 1} connected to ${node.id}`,
          filename: `spoke_${Date.now()}_${i}`,
          department: 'Generated',
          file_type: 'generated'
        }
      };
      
      newNodes.push(newNode);
      
      // Create connection from hub to spoke
      const spokeLink = {
        source: node.id,
        target: newNodeId,
        value: 1,
        distance: 80,
        type: 'hub-spoke',
        similarity: 1.0
      };
      
      newLinks.push(spokeLink);
    }
    
    // Update graph data
    setGraphData(prev => ({
      nodes: [...prev.nodes, ...newNodes],
      links: [...prev.links, ...newLinks]
    }));
    
    console.log(`Created ${newNodes.length} new spoke nodes with ${newLinks.length} connections`);
  };

  // Handle node click - only selection, no content tile
  const handleNodeClick = (node) => {
    handleNodeSelection(node);
  };

  // Handle node hover with completely stable positioning - NO STATE UPDATES
  const handleNodeHover = (node, event) => {
    if (node) {
      console.log('Node hovered:', node.id, 'Tooltips enabled:', visualizationSettings.showTooltips);
      setIsHovering(true);
      setHoveredNode(node);
      
      // Show tooltip if enabled
      if (visualizationSettings.showTooltips) {
        const tooltipContent = `
          <div class="p-2">
            <div class="font-semibold text-white">${node.label || node.id}</div>
            <div class="text-sm text-gray-300">Group: ${node.group || 'Unknown'}</div>
            ${node.payload?.filename ? `<div class="text-sm text-gray-300">File: ${node.payload.filename}</div>` : ''}
            ${node.payload?.department ? `<div class="text-sm text-gray-300">Dept: ${node.payload.department}</div>` : ''}
            ${node.payload?.file_type ? `<div class="text-sm text-gray-300">Type: ${node.payload.file_type}</div>` : ''}
          </div>
        `;
        
        setTooltip({
          visible: true,
          x: event?.clientX || 0,
          y: event?.clientY || 0,
          content: tooltipContent
        });
      }
      
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
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
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

  // Clear all selections
  const clearSelections = () => {
    setSelectedNodes([]);
    setSelectedNode(null);
    setHighlightedNodes(new Set());
    setHighlightedLinks(new Set());
    setShowContentFlag(false); // Hide flag when selections are cleared
  };

  // Handle background click
  const handleBackgroundClick = () => {
    if (!visualizationSettings.multiSelect) {
      clearSelections();
      setShowContentFlag(false); // Hide flag when background is clicked
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
    <div className={`${fullWidth ? 'h-full w-full' : 'bg-gray-800 rounded-lg'} overflow-hidden relative`}>
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
          
          {/* Delete Selected Hub Button */}
          {selectedNode && (selectedNode.isHub || selectedNode.payload?.type === 'spoke_node') && (
            <button
              onClick={() => {
                if (selectedNode.isHub || selectedNode.payload?.type === 'spoke_node') {
                  // Delete the selected hub and its spokes
                  const hubId = selectedNode.isHub ? selectedNode.id : selectedNode.payload?.sourceNode;
                  const nodesToDelete = graphData.nodes.filter(node => 
                    node.id === hubId || 
                    node.payload?.sourceNode === hubId ||
                    node.id === selectedNode.id
                  );
                  const linksToDelete = graphData.links.filter(link => 
                    nodesToDelete.some(node => node.id === link.source.id || node.id === link.target.id)
                  );
                  
                  setGraphData(prev => ({
                    nodes: prev.nodes.filter(node => !nodesToDelete.some(n => n.id === node.id)),
                    links: prev.links.filter(link => !linksToDelete.some(l => l === link))
                  }));
                  
                  setSelectedNode(null);
                  console.log(`Deleted hub and ${nodesToDelete.length - 1} associated nodes`);
                }
              }}
              className="p-2 bg-orange-600 hover:bg-orange-500 rounded transition-colors"
              title="Delete Selected Hub"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {/* Reset All Hubs Button */}
          {graphData.nodes.some(node => node.isHub || node.payload?.type === 'spoke_node') && (
            <button
              onClick={() => {
                // Reset to original data (remove all generated hubs)
                const originalNodes = graphData.nodes.filter(node => 
                  !node.isHub && 
                  !node.payload?.type?.includes('spoke') && 
                  !node.payload?.type?.includes('generated') &&
                  !node.id?.includes('spoke_') &&
                  !node.id?.includes('initial_spoke_')
                );
                const originalLinks = graphData.links.filter(link => 
                  !link.type?.includes('hub-spoke') &&
                  !link.type?.includes('node-connection')
                );
                
                setGraphData({ nodes: originalNodes, links: originalLinks });
                setSelectedNode(null);
                console.log('Reset to original data - removed all generated hubs');
              }}
              className="p-2 bg-purple-600 hover:bg-purple-500 rounded transition-colors"
              title="Reset All Hubs"
            >
              <RefreshCw className="w-4 h-4" />
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
            
            {/* Qdrant Node Generation Configuration */}
            <div className="bg-gray-600 rounded-lg p-3 mt-4">
              <h4 className="text-sm font-semibold text-white mb-3">Qdrant Node Generation</h4>
              <div className="space-y-3">
                <div className="bg-gray-500 rounded p-2">
                  <div className="text-xs text-gray-300 mb-1">
                    Qdrant starts with single node only
                  </div>
                  <div className="text-xs text-gray-400">
                    No automatic hub objects are created
                  </div>
                </div>
                
                <div className="bg-gray-500 rounded p-2">
                  <div className="text-xs text-gray-300 mb-1">
                    Double-click behavior: Creates new nodes
                  </div>
                  <div className="text-xs text-gray-400">
                    Double-click any node to create new nodes with {visualizationSettings.spokesPerHub} connections
                  </div>
                </div>
                
                <div className="bg-gray-500 rounded p-2">
                  <div className="text-xs text-gray-300 mb-1">
                    Spokes per Node: {visualizationSettings.spokesPerHub}
                  </div>
                  <div className="text-xs text-gray-400">
                    Controlled by Hub & Spoke Model settings in Visualization Options
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  Original node acts as hub for new connections
                </div>
              </div>
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
         <div className="fixed left-0 top-0 h-screen z-50 overflow-hidden">
           {/* Backdrop - only show when menu is not pinned */}
           {!isMenuPinned && (
             <div 
               className="fixed left-0 top-0 w-96 h-screen bg-black bg-opacity-20"
               onClick={() => setShowVisualizationMenu(false)}
             />
           )}
           
           {/* Slide-out Panel */}
           <div className="relative h-screen w-96 bg-gray-800 border-r border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out">
             <div className="flex flex-col h-screen">
               {/* Header */}
               <div className="flex items-center justify-between p-6 border-b border-gray-700">
                 <h2 className="text-xl font-semibold text-white flex items-center">
                   <Palette className="w-5 h-5 mr-2" />
                   Visualization Options
                 </h2>
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={() => setIsMenuPinned(!isMenuPinned)}
                     className={`p-2 rounded transition-colors ${
                       isMenuPinned 
                         ? 'bg-blue-600 hover:bg-blue-500' 
                         : 'bg-gray-600 hover:bg-gray-500'
                     }`}
                     title={isMenuPinned ? 'Unpin Menu' : 'Pin Menu'}
                   >
                     {isMenuPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                   </button>
                   <button
                     onClick={() => {
                       if (!isMenuPinned) {
                         setShowVisualizationMenu(false);
                       }
                     }}
                     className={`p-2 rounded transition-colors ${
                       isMenuPinned 
                         ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                         : 'hover:bg-gray-700'
                     }`}
                     disabled={isMenuPinned}
                     title={isMenuPinned ? 'Menu is pinned - use pin button to close' : 'Close Menu'}
                   >
                     <X className="w-5 h-5 text-gray-400" />
                   </button>
                 </div>
               </div>

               {/* Preview Section */}
               {isMenuPinned && (
                 <div className="px-6 py-4 border-b border-gray-700 bg-gray-750">
                   <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center">
                     <Eye className="w-4 h-4 mr-2" />
                     Live Preview
                     {isLoading && (
                       <div className="ml-2 flex items-center">
                         <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                         <span className="text-xs text-blue-400 ml-1">Updating...</span>
                       </div>
                     )}
                   </h3>
                   <div className="grid grid-cols-2 gap-3 text-xs">
                     <div className="bg-gray-600 rounded p-2">
                       <div className="text-gray-400">Layout</div>
                       <div className="text-white font-medium capitalize">
                         {visualizationSettings.graphType.replace('-', ' ')}
                       </div>
                     </div>
                     <div className="bg-gray-600 rounded p-2">
                       <div className="text-gray-400">Labels</div>
                       <div className="text-white font-medium capitalize">
                         {visualizationSettings.labelMode?.replace('_', ' ') || 'filename'}
                       </div>
                     </div>
                     <div className="bg-gray-600 rounded p-2">
                       <div className="text-gray-400">Colors</div>
                       <div className="text-white font-medium capitalize">
                         {visualizationSettings.colorScheme?.replace('_', ' ') || 'group'}
                       </div>
                     </div>
                     <div className="bg-gray-600 rounded p-2">
                       <div className="text-gray-400">Shape</div>
                       <div className="text-white font-medium capitalize">
                         {visualizationSettings.nodeShape?.replace('_', ' ') || 'circle'}
                       </div>
                     </div>
                     <div className="bg-gray-600 rounded p-2">
                       <div className="text-gray-400">Distance</div>
                       <div className="text-white font-medium">
                         {visualizationSettings.useVariableDistance ? 'Variable' : 'Fixed'}
                       </div>
                     </div>
                     <div className="bg-gray-600 rounded p-2">
                       <div className="text-gray-400">Stabilization</div>
                       <div className="text-white font-medium">
                         {visualizationSettings.maintainInterconnectivity ? 'On' : 'Off'}
                       </div>
                     </div>
                     <div className="bg-gray-600 rounded p-2">
                       <div className="text-gray-400">Anchors</div>
                       <div className="text-white font-medium">
                         {visualizationSettings.showAnchors ? 'On' : 'Off'}
                       </div>
                     </div>
                     <div className="bg-gray-600 rounded p-2">
                       <div className="text-gray-400">Text</div>
                       <div className="text-white font-medium">
                         {visualizationSettings.showText ? 'On' : 'Off'}
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {/* Content */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ paddingBottom: '100px' }}>
                 {/* Graph Layout Options */}
                 <div className="bg-gray-700 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                     <Layers className="w-4 h-4 mr-2" />
                     Graph Layout
                   </h3>
                   
                   {/* Graph Type Selection */}
                   <div className="mb-4">
                     <label className="block text-sm font-medium text-white mb-2">Graph Visualization Type</label>
                     <select
                       value={visualizationSettings.graphType}
                       onChange={(e) => setVisualizationSettings(prev => ({ ...prev, graphType: e.target.value }))}
                       className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                     >
                       <option value="force-directed">1. Force-Directed Graph</option>
                       <option value="disjoint-force">2. Disjoint Force-Directed</option>
                       <option value="force-tree">3. Force-Directed Tree</option>
                       <option value="qdrant-native">4. Qdrant Native Style</option>
                       <option value="hierarchical-cluster">5. Hierarchical Clustering</option>
                       <option value="auto-colored-3d">6. Auto-Colored 3D</option>
                     </select>
                     <p className="text-xs text-gray-400 mt-1">
                       {visualizationSettings.graphType === 'force-directed' && 'Standard D3 force-directed layout with natural clustering'}
                       {visualizationSettings.graphType === 'disjoint-force' && 'Prevents detached subgraphs from escaping viewport'}
                       {visualizationSettings.graphType === 'force-tree' && 'Tree-like hierarchy with force-directed positioning'}
                       {visualizationSettings.graphType === 'qdrant-native' && 'Replicates Qdrant dashboard visualization style'}
                       {visualizationSettings.graphType === 'hierarchical-cluster' && 'Shows document hierarchy and semantic clustering'}
                       {visualizationSettings.graphType === 'auto-colored-3d' && '3D visualization with automatic color assignment based on node properties'}
                     </p>
                   </div>
                 </div>

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

                 {/* Node Mobility & Interconnectivity Options */}
                 <div className="bg-gray-700 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                     <Layers className="w-4 h-4 mr-2" />
                     Node Mobility & Interconnectivity
                   </h3>
                   
                   <div className="space-y-3">
                     {[
                       { key: 'maintainInterconnectivity', label: 'Maintain Interconnectivity', desc: 'Keep related nodes connected while allowing movement' },
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
                           <div className="text-sm font-medium text-white">{feature.label}</div>
                           <div className="text-xs text-gray-400">{feature.desc}</div>
                         </div>
                       </label>
                     ))}
                   </div>
                   
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
                         className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                       />
                       <div className="flex justify-between text-xs text-gray-400 mt-1">
                         <span>Weak</span>
                         <span>Strong</span>
                       </div>
                     </div>
                   )}
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
                     
                     {/* Text Size Control */}
                     <div className="mt-4 pt-4 border-t border-gray-600">
                       <label className="block text-sm font-medium text-white mb-2">Text Size</label>
                       <select
                         value={visualizationSettings.textSize}
                         onChange={(e) => setVisualizationSettings(prev => ({ ...prev, textSize: e.target.value }))}
                         className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                       >
                         <option value="tiny">Tiny (4px)</option>
                         <option value="small">Small (8px)</option>
                         <option value="medium">Medium (12px)</option>
                         <option value="large">Large (16px)</option>
                       </select>
                       <p className="text-xs text-gray-400 mt-1">Control the size of node text labels</p>
                     </div>
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
                      { key: 'use3D', label: '3D Visualization', desc: 'Enable 3D graph with depth and rotation' },
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

                {/* Hub and Spoke Model */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Network className="w-4 h-4 mr-2" />
                    Hub & Spoke Model
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualizationSettings.hubSpokeMode}
                        onChange={(e) => setVisualizationSettings(prev => ({ ...prev, hubSpokeMode: e.target.checked }))}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-white font-medium">Enable Hub & Spoke</div>
                        <div className="text-xs text-gray-400">Double-click nodes to create hubs with similarity-based spokes</div>
                      </div>
                    </label>
                    
                    {visualizationSettings.hubSpokeMode && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            Spokes per Hub: {visualizationSettings.spokesPerHub}
                          </label>
                          <input
                            type="range"
                            min="2"
                            max="10"
                            value={visualizationSettings.spokesPerHub}
                            onChange={(e) => setVisualizationSettings(prev => ({ 
                              ...prev, 
                              spokesPerHub: parseInt(e.target.value) 
                            }))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>2</span>
                            <span>10</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            Max Hubs: {visualizationSettings.maxHubs}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={visualizationSettings.maxHubs}
                            onChange={(e) => setVisualizationSettings(prev => ({ 
                              ...prev, 
                              maxHubs: parseInt(e.target.value) 
                            }))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>1</span>
                            <span>20</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          <div>• Double-click any node to create a hub</div>
                          <div>• Hub connects to {visualizationSettings.spokesPerHub} most similar nodes</div>
                          <div>• Current hubs: {hubs.length}/{visualizationSettings.maxHubs}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

               </div>
             </div>
             
             {/* Fixed Apply Changes Button at Bottom */}
             <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 shadow-lg z-10">
               {/* Gradient fade effect above button */}
               <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-t from-gray-800 to-transparent pointer-events-none"></div>
               <button
                 onClick={() => {
                   // Refresh graph data to apply new visualization settings
                   fetchGraphData();
                   if (!isMenuPinned) {
                     setShowVisualizationMenu(false);
                   }
                 }}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors shadow-md"
               >
                 Apply Changes
               </button>
               <div className="text-xs text-gray-400 text-center mt-2">
                 {isMenuPinned ? 'Settings auto-apply when pinned' : 'Click to apply and close menu'}
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Graph Visualization */}
      <div ref={containerRef} className="relative" style={{ height: height, backgroundColor: '#1f2937' }}>
        {/* Interactive indicator when menu is pinned */}
        {showVisualizationMenu && isMenuPinned && (
          <div className="absolute top-2 right-2 z-10 bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span>Interactive</span>
          </div>
        )}
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
        ) : (visualizationSettings.use3D || visualizationSettings.graphType === 'auto-colored-3d') ? (
          <ForceGraph3D
            ref={graphRef}
            graphData={graphData}
            nodeLabel={visualizationSettings.showText ? 'label' : ''}
            nodeColor={node => {
              if (visualizationSettings.graphType === 'auto-colored-3d') {
                // Use auto-coloring for auto-colored 3D mode
                const nodeIndex = graphData.nodes.indexOf(node);
                return generateAutoColor(node, nodeIndex, graphData.nodes.length);
              }
              return node.color || generateNodeColor(node);
            }}
            nodeVal={node => node.size || generateNodeSize(node)}
            nodeThreeObject={(node) => {
              // Create 3D node objects based on shape
              const size = node.size || generateNodeSize(node);
              const color = visualizationSettings.graphType === 'auto-colored-3d' 
                ? generateAutoColor(node, graphData.nodes.indexOf(node), graphData.nodes.length)
                : (node.color || generateNodeColor(node));
              
              if (visualizationSettings.nodeShape === 'square') {
                const geometry = new THREE.BoxGeometry(size, size, size);
                const material = new THREE.MeshLambertMaterial({ color });
                return new THREE.Mesh(geometry, material);
              } else if (visualizationSettings.nodeShape === 'diamond') {
                const geometry = new THREE.OctahedronGeometry(size / 2);
                const material = new THREE.MeshLambertMaterial({ color });
                return new THREE.Mesh(geometry, material);
              } else {
                // Circle (sphere in 3D)
                const geometry = new THREE.SphereGeometry(size / 2, 16, 12);
                const material = new THREE.MeshLambertMaterial({ color });
                return new THREE.Mesh(geometry, material);
              }
            }}
            linkThreeObject={(link) => {
              // Hide link text if interconnectivity is disabled
              if (!visualizationSettings.showInterconnectivity) {
                return null;
              }
              // Create text labels for links
              const sprite = new SpriteText(link.label || `${link.source.id} → ${link.target.id}`);
              sprite.color = link.type === 'hub-spoke' ? '#ff6b6b' : '#fff';
              sprite.textHeight = 4;
              return sprite;
            }}
            linkThreeObjectExtend={visualizationSettings.showInterconnectivity}
            linkPositionUpdate={(sprite, { start, end }) => {
              // Position link text at the midpoint
              const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
                [c]: start[c] + (end[c] - start[c]) / 2
              })));
              Object.assign(sprite.position, middlePos);
            }}
            linkColor={link => {
              // Hide links if interconnectivity is disabled
              if (!visualizationSettings.showInterconnectivity) {
                return 'rgba(0,0,0,0)'; // Transparent
              }
              if (link.type === 'hub-spoke') return '#ff6b6b';
              if (link.type === 'anchor') return '#ffd700';
              if (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) {
                return '#4CAF50';
              }
              return '#666';
            }}
            linkWidth={link => {
              // Hide links if interconnectivity is disabled
              if (!visualizationSettings.showInterconnectivity) {
                return 0; // No width
              }
              if (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) {
                return 3;
              }
              return settings.linkWidth;
            }}
            linkDirectionalArrowLength={visualizationSettings.showInterconnectivity ? 3 : 0}
            linkDirectionalArrowRelPos={1}
            onNodeClick={(node) => {
              // Handle both single click and double-click detection
              const now = Date.now();
              const lastClickTime = node._lastClickTime || 0;
              const timeDiff = now - lastClickTime;
              
              if (timeDiff < 300) { // Double-click detected (within 300ms)
                console.log('=== 3D DOUBLE-CLICK DETECTED ===');
                console.log('Node:', node);
                console.log('Time difference:', timeDiff);
                
                // Visual test indicator
                setDoubleClickTest(true);
                setTimeout(() => setDoubleClickTest(false), 2000);
                
                handleNodeDoubleClick(node);
              } else {
                // Single click
                handleNodeClick(node);
              }
              
              // Update last click time
              node._lastClickTime = now;
            }}
            onNodeHover={handleNodeHover}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            onBackgroundClick={handleBackgroundClick}
            cooldownTicks={visualizationSettings.showAnimations ? 100 : 0}
            d3AlphaDecay={visualizationSettings.showAnimations ? 0.0228 : 0.1}
            d3VelocityDecay={visualizationSettings.showAnimations ? 0.4 : 0.8}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            enableNodeDrag={true}
            enablePointerInteraction={true}
            showNavInfo={false}
            controlType="orbit"
            width={fullWidth ? dimensions.width : 800}
            height={fullWidth ? dimensions.height : 500}
          />
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel={visualizationSettings.showText ? 'label' : ''}
            nodeColor={node => node.color || generateNodeColor(node)}
            nodeVal={node => node.size || generateNodeSize(node)}
            backgroundRender={(ctx, globalScale) => {
              // Set background to match UI theme
              ctx.fillStyle = '#1f2937';
              ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
              // Skip anchor nodes if they shouldn't be shown
              if (node.isAnchor && !visualizationSettings.showAnchors) {
                return;
              }
              
              const label = node.label || node.id;
              // Calculate font size based on text size setting
              const baseFontSize = {
                'tiny': 4,
                'small': 8,
                'medium': 12,
                'large': 16
              }[visualizationSettings.textSize] || 8;
              const fontSize = baseFontSize/globalScale;
              const size = node.size || generateNodeSize(node);

              // Handle different node shapes
              if (visualizationSettings.nodeShape === 'text') {
                // Text-only nodes
                ctx.font = `${fontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = node.color || generateNodeColor(node);
                ctx.fillText(label, node.x, node.y);
              } else {
                // Shape-based nodes
                ctx.fillStyle = node.color || generateNodeColor(node);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1/globalScale;

                if (visualizationSettings.nodeShape === 'square') {
                  ctx.fillRect(node.x - size/2, node.y - size/2, size, size);
                  ctx.strokeRect(node.x - size/2, node.y - size/2, size, size);
                } else if (visualizationSettings.nodeShape === 'diamond') {
                  ctx.save();
                  ctx.translate(node.x, node.y);
                  ctx.rotate(Math.PI / 4);
                  ctx.fillRect(-size/2, -size/2, size, size);
                  ctx.strokeRect(-size/2, -size/2, size, size);
                  ctx.restore();
                } else {
                  // Circle (default)
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size/2, 0, 2 * Math.PI, false);
                  ctx.fill();
                  ctx.stroke();
                }

                // Add text label if enabled
                if (visualizationSettings.showText) {
                  ctx.font = `${fontSize}px Arial`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#fff';
                  ctx.strokeStyle = '#000';
                  ctx.lineWidth = 0.5/globalScale;
                  ctx.strokeText(label, node.x, node.y + size/2 + fontSize);
                  ctx.fillText(label, node.x, node.y + size/2 + fontSize);
                }
              }
            }}
            linkColor={link => {
              // Hide links if interconnectivity is disabled
              if (!visualizationSettings.showInterconnectivity) {
                return 'rgba(0,0,0,0)'; // Transparent
              }
              if (link.type === 'hub-spoke') return '#ff6b6b';
              if (link.type === 'anchor') return '#ffd700';
              if (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) {
                return '#4CAF50';
              }
              return '#666';
            }}
            linkWidth={link => {
              // Hide links if interconnectivity is disabled
              if (!visualizationSettings.showInterconnectivity) {
                return 0; // No width
              }
              if (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) {
                return 3;
              }
              return settings.linkWidth;
            }}
            linkDirectionalArrowLength={visualizationSettings.showInterconnectivity ? 3 : 0}
            linkDirectionalArrowRelPos={1}
            onNodeClick={(node) => {
              // Handle both single click and double-click detection
              const now = Date.now();
              const lastClickTime = node._lastClickTime || 0;
              const timeDiff = now - lastClickTime;
              
              if (timeDiff < 300) { // Double-click detected (within 300ms)
                console.log('=== DOUBLE-CLICK DETECTED ===');
                console.log('Node:', node);
                console.log('Time difference:', timeDiff);
                
                // Visual test indicator
                setDoubleClickTest(true);
                setTimeout(() => setDoubleClickTest(false), 2000);
                
                handleNodeDoubleClick(node);
              } else {
                // Single click
                handleNodeClick(node);
              }
              
              // Update last click time
              node._lastClickTime = now;
            }}
            onNodeHover={handleNodeHover}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            onBackgroundClick={handleBackgroundClick}
            cooldownTicks={visualizationSettings.showAnimations ? 100 : 0}
            d3AlphaDecay={visualizationSettings.showAnimations ? 0.0228 : 0.1}
            d3VelocityDecay={visualizationSettings.showAnimations ? 0.4 : 0.8}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            enableNodeDrag={true}
            enablePointerInteraction={true}
            width={fullWidth ? dimensions.width : 800}
            height={fullWidth ? dimensions.height : 500}
          />
        )}
      </div>

      {/* Tooltip */}
      {tooltip.visible && visualizationSettings.showTooltips && (
        <div 
          className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            maxWidth: '300px'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* Double-Click Test Indicator */}
      {doubleClickTest && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">Double-Click Detected!</span>
          </div>
        </div>
      )}

      {/* View Node Content Flag - Short Flag from Right Side */}
      {showContentFlag && selectedNode && (
        <div 
          className="fixed right-0 top-40 z-50 cursor-pointer"
          onClick={() => {
            // Populate node content when flag is clicked
            if (selectedNode && selectedNode.payload) {
              setSelectedNodeContent({
                id: selectedNode.id,
                content: selectedNode.payload.content || 'No content available',
                filename: selectedNode.payload.filename || 'Unknown file',
                department: selectedNode.payload.department || 'Unknown',
                file_type: selectedNode.payload.file_type || 'Unknown',
                chunk_index: selectedNode.payload.chunk_index || 0
              });
              setShowNodeContent(true);
            }
          }}
        >
          <div className="bg-blue-600 text-white px-3 py-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs font-medium">View Content</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContentFlag(false);
                }}
                className="ml-2 text-white hover:text-gray-300 text-sm"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Node Content Modal */}
      {showNodeContent && selectedNodeContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Node Content</h3>
              <button
                onClick={() => setShowNodeContent(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Node ID</label>
                <p className="text-white bg-gray-700 p-2 rounded">{selectedNodeContent.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Filename</label>
                <p className="text-white bg-gray-700 p-2 rounded">{selectedNodeContent.filename}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                  <p className="text-white bg-gray-700 p-2 rounded">{selectedNodeContent.department}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">File Type</label>
                  <p className="text-white bg-gray-700 p-2 rounded">{selectedNodeContent.file_type}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Chunk Index</label>
                <p className="text-white bg-gray-700 p-2 rounded">{selectedNodeContent.chunk_index}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                <div className="text-white bg-gray-700 p-3 rounded max-h-64 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm">{selectedNodeContent.content}</pre>
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
