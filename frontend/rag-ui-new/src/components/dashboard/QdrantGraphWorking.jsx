/**
 * Working Qdrant Graph Component
 * 
 * Simplified version that works without the complex modular system
 * 
 * Note: Non-passive event listener violations in console are from react-force-graph
 * library. These are performance warnings (not errors) and don't affect functionality.
 * The library uses touch events for mobile pan/zoom but doesn't mark them as passive.
 * This is a known limitation of the third-party library.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { QDRANT_URL } from '../../config';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { RefreshCw, Palette, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Target, Shuffle } from 'lucide-react';
import { 
  calculateSimilarity, 
  generateSimilarityLinks, 
  filterNodesBySimilarity,
  getSimilarityStats,
  validateSimilarityData
} from '../../utils/similarityUtils';

// Import specialized 3D modules
import Highlight3DWorking from './graphs/modules/Highlight3DWorking';
import ClickFocus3DWorking from './graphs/modules/ClickFocus3DWorking';

const QdrantGraphWorking = ({ 
  collectionName = 'rag', 
  qdrantBaseUrl = QDRANT_URL, 
  height = '500px', 
  fullWidth = false,
  similarityMode = 'semantic',
  similarityThreshold = 0.45,
  onNodeSelect = () => {},
  onSimilarityChange = () => {},
  // Visualization settings
  showTextLabels = true,
  labelMode = 'filename',
  colorScheme = 'group',
  nodeSizeMode = 'fixed',
  nodeSize = 3,
  nodeShape = 'circle',
  maintainInterconnectivity = true,
  showAnchorPoints = false,
  showInterconnectivity = false,
  highlightSelected = true,
  useVariableDistance = true,
  minDistance = 20,
  maxDistance = 200,
  showTooltips = true,
  enableClustering = false,
  enableAnimations = true,
  enableFiltering = false,
  multiSelect = false,
  enableHubSpoke = false,
  spokesPerHub = 5,
  maxHubs = 10,
  is3D = false,
  movementSpeed = 2.0,
  linkWidth = 1,
  graphType = 'force-directed', // New prop: force-directed, hierarchical, circular, grid, qdrant-native
  onNodeSizeChange = () => {}, // Callback for node size changes
  onLinkWidthChange = () => {}, // Callback for link width changes
  onGraphDataLoaded = () => {}, // Callback when graph data is loaded
  onShowTextLabelsChange = () => {}, // Callback for showTextLabels changes
  onIs3DChange = () => {}, // Callback for is3D changes
  onGraphStatsChange = () => {} // Callback for graph stats changes (nodes, links, status)
}) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [originalGraphData, setOriginalGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [specialized3D, setSpecialized3D] = useState('none'); // none, highlight, click-focus
  // Local state for is3D to handle toggle (will sync with prop)
  const [localIs3D, setLocalIs3D] = useState(is3D);
  const [localShowTextLabels, setLocalShowTextLabels] = useState(showTextLabels);
  
  // Sync local state with props
  useEffect(() => {
    setLocalIs3D(is3D);
  }, [is3D]);
  
  useEffect(() => {
    setLocalShowTextLabels(showTextLabels);
  }, [showTextLabels]);
  
  const [similarityStats, setSimilarityStats] = useState(null);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const current3DRef = useRef(null);
  const current2DRef = useRef(null);
  const [resetKey, setResetKey] = useState(0); // Key to force re-render on reset
  const originalNodePositions = useRef(new Map()); // Store original node positions
  const fetchInProgressRef = useRef(false); // Track fetch in progress to prevent duplicates
  const dataLoadedRef = useRef(new Set()); // Track if data has been loaded to prevent duplicate fetches
  
  // Helper function to get initial positions based on graph type
  const getInitialPositions = useCallback((nodes, graphType, width = 800, height = 500) => {
    const nodeCount = nodes.length;
    if (nodeCount === 0) return [];
    
    switch (graphType) {
      case 'hierarchical': {
        // Arrange nodes in tree-like structure (top to bottom)
        // Use a simpler approach: arrange in levels based on connections
        const positions = [];
        const levels = Math.ceil(Math.sqrt(nodeCount));
        
        nodes.forEach((node, index) => {
          // Calculate level (row) - distribute evenly
          const level = Math.floor((index / nodeCount) * levels);
          // Calculate position within level
          const nodesInLevel = Math.ceil(nodeCount / levels);
          const positionInLevel = index % nodesInLevel;
          const nodesAtThisLevel = Math.min(nodesInLevel, nodeCount - level * nodesInLevel);
          
          const x = (positionInLevel + 0.5) * (width / nodesAtThisLevel);
          const y = (level + 1) * (height / (levels + 1));
          positions.push({ x, y });
        });
        
        return positions;
      }
      
      case 'circular': {
        // Arrange nodes in a circle
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;
        
        return nodes.map((node, index) => {
          const angle = (index / nodeCount) * 2 * Math.PI - Math.PI / 2; // Start at top
          return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          };
        });
      }
      
      case 'grid': {
        // Arrange nodes in a grid pattern
        const cols = Math.ceil(Math.sqrt(nodeCount));
        const rows = Math.ceil(nodeCount / cols);
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        
        return nodes.map((node, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          return {
            x: (col + 0.5) * cellWidth,
            y: (row + 0.5) * cellHeight
          };
        });
      }
      
      case 'qdrant-native': {
        // Hub-spoke pattern: identify hubs and arrange spokes around them
        // For now, use first few nodes as hubs, rest as spokes
        const hubCount = Math.min(3, Math.ceil(nodeCount / 10));
        const hubsPerSpoke = Math.floor((nodeCount - hubCount) / hubCount);
        const positions = [];
        
        // Position hubs in center area
        const hubRadius = Math.min(width, height) * 0.2;
        for (let i = 0; i < hubCount && i < nodeCount; i++) {
          const angle = (i / hubCount) * 2 * Math.PI;
          positions.push({
            x: width / 2 + hubRadius * Math.cos(angle),
            y: height / 2 + hubRadius * Math.sin(angle)
          });
        }
        
        // Position spokes around hubs
        let spokeIndex = 0;
        for (let hubIndex = 0; hubIndex < hubCount && hubIndex + hubCount < nodeCount; hubIndex++) {
          const hubPos = positions[hubIndex];
          const spokesForThisHub = Math.min(hubsPerSpoke, nodeCount - hubCount - spokeIndex);
          
          for (let s = 0; s < spokesForThisHub && hubCount + spokeIndex < nodeCount; s++) {
            const spokeAngle = (s / spokesForThisHub) * 2 * Math.PI;
            const spokeRadius = Math.min(width, height) * 0.15;
            positions.push({
              x: hubPos.x + spokeRadius * Math.cos(spokeAngle),
              y: hubPos.y + spokeRadius * Math.sin(spokeAngle)
            });
            spokeIndex++;
          }
        }
        
        // Fill remaining nodes randomly if any
        while (positions.length < nodeCount) {
          positions.push({
            x: Math.random() * width,
            y: Math.random() * height
          });
        }
        
        return positions;
      }
      
      default: // force-directed
        // Random positions for force-directed
        return nodes.map(() => ({
          x: Math.random() * width,
          y: Math.random() * height
        }));
    }
  }, []);
  
  // Memoize link rendering functions to prevent flashing
  const linkColorFn = useCallback((link) => {
    // Highlight links connected to selected node
    if (selectedNode && highlightSelected) {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (sourceId === selectedNode.id || targetId === selectedNode.id) {
        return '#FFD700'; // Gold color for selected node's links
      }
      return '#666'; // Gray for other links
    }
    return '#666';
  }, [selectedNode, highlightSelected]);
  
  const linkWidthFn = useCallback((link) => {
    // Make links to selected node slightly thicker
    if (selectedNode && highlightSelected) {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (sourceId === selectedNode.id || targetId === selectedNode.id) {
        return linkWidth * 1.5;
      }
    }
    return linkWidth;
  }, [linkWidth, selectedNode, highlightSelected]);
  
  const nodeColorFn = useCallback((node) => {
    // Highlight selected node
    if (selectedNode && node.id === selectedNode.id && highlightSelected) {
      return '#FFD700'; // Gold color for selected node
    }
    // Use group-based colors for other nodes
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
    return colors[node.group % colors.length];
  }, [selectedNode, highlightSelected]);
  
  const nodeValFn = useCallback((node) => {
    // Make selected node slightly larger
    if (selectedNode && node.id === selectedNode.id && highlightSelected) {
      return nodeSize * 1.3;
    }
    return nodeSize;
  }, [nodeSize, selectedNode, highlightSelected]);
  
  // Memoize graph data to prevent unnecessary re-renders (only update when data actually changes)
  // Include resetKey in dependencies to force update on reset
  const memoizedGraphData = useMemo(() => graphData, [graphData, resetKey]);

  // Process similarity data
  const processSimilarityData = useCallback((data) => {
    if (!data.nodes || data.nodes.length === 0) return data;

    // Validate data availability for the selected similarity mode
    const validation = validateSimilarityData(data.nodes, similarityMode);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Similarity Mode: ${similarityMode}`);
      console.log(`📈 Data Validation:`, {
        hasEmbeddings: `${validation.hasEmbeddings}/${validation.totalNodes}`,
        hasContent: `${validation.hasContent}/${validation.totalNodes}`,
        hasTimestamps: `${validation.hasTimestamps}/${validation.totalNodes}`,
        isValid: validation.isValid,
        warnings: validation.warnings
      });
      
      if (validation.warnings.length > 0) {
        console.warn(`⚠️ Similarity Mode Warnings:`, validation.warnings);
      }
    }

    // Generate similarity links with distance scaling
    const similarityLinks = generateSimilarityLinks(
      data.nodes, 
      data, 
      similarityMode, 
      similarityThreshold,
      minDistance,
      maxDistance
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 Generated ${similarityLinks.length} similarity links`);
      if (similarityLinks.length > 0) {
        const avgDistance = similarityLinks.reduce((sum, link) => sum + link.distance, 0) / similarityLinks.length;
        const avgSimilarity = similarityLinks.reduce((sum, link) => sum + link.similarity, 0) / similarityLinks.length;
        console.log(`📏 Average link distance: ${avgDistance.toFixed(2)} (similarity: ${avgSimilarity.toFixed(3)})`);
      } else if (!validation.isValid) {
        console.warn(`⚠️ No links generated - similarity mode may not be suitable for current data`);
      }
    }

    // Calculate similarity statistics
    const stats = getSimilarityStats(data, similarityMode);
    setSimilarityStats(stats);

    // Combine original links with similarity links
    const allLinks = [...(data.links || []), ...similarityLinks];

    // Keep all nodes visible - don't filter them out
    // Instead, we'll highlight the selected node visually
    const allNodes = data.nodes;
    
    // Calculate filtered count for statistics (but don't actually filter)
    let filteredCount = allNodes.length;
    if (selectedNode) {
      const similarNodes = filterNodesBySimilarity(
        allNodes, 
        selectedNode, 
        data, 
        similarityMode, 
        similarityThreshold
      );
      filteredCount = similarNodes.length;
      setFilteredNodes(similarNodes); // Store for reference, but don't use for rendering
    } else {
      setFilteredNodes(allNodes);
    }

    // Notify parent component of similarity changes (only when stats change significantly)
    if (stats && (stats.count > 0 || !similarityStats)) {
      onSimilarityChange({
        mode: similarityMode,
        threshold: similarityThreshold,
        stats: stats,
        filteredCount: filteredCount,
        totalCount: data.nodes.length
      });
    }

    return {
      ...data,
      nodes: allNodes, // Always return all nodes - no filtering
      links: allLinks
    };
  }, [similarityMode, similarityThreshold, selectedNode, onSimilarityChange, minDistance, maxDistance]);

  // Fetch graph data from Qdrant (memoize to prevent recreation)
  const fetchGraphData = useCallback(async () => {
    // Double-check guard with ref to prevent race conditions
    // Only skip if we're actually loading, not just if the ref is set
    if (isLoading) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏳ Graph data fetch already in progress, skipping...');
      }
      return; // Prevent duplicate calls
    }
    
    // Set the ref to prevent concurrent calls
    if (fetchInProgressRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏳ Graph data fetch already in progress (ref check), skipping...');
      }
      return;
    }
    
    // Update status to loading
    if (onGraphStatsChange) {
      onGraphStatsChange({
        collectionName,
        nodeCount: graphData.nodes.length,
        linkCount: graphData.links.length,
        is3D: localIs3D,
        status: 'LOADING'
      });
    }
    setIsLoading(true);
    setError(null);
    fetchInProgressRef.current = true;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Fetching graph data from Qdrant...');
      }
      
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 100,
          with_payload: true,
          with_vector: true,  // Enable vector fetching for real similarity calculations
          filter: null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const points = data.result.points || [];
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Fetched ${points.length} points from Qdrant`);
        const pointsWithVectors = points.filter(p => p.vector).length;
        console.log(`🔢 Points with vectors: ${pointsWithVectors}/${points.length}`);
      }

      // Process nodes with graph-type-specific initial positions
      const tempNodes = points.map((point, index) => ({
        id: point.id || `point_${index}`,
        label: point.payload?.filename || `Node ${index}`,
        group: Math.floor(index / 10),
        payload: point.payload || {},
        embedding: point.vector || null,
        content: point.payload?.content || point.payload?.text || '',
        timestamp: point.payload?.timestamp || null
      }));
      
      // Get initial positions based on graph type
      const initialPositions = getInitialPositions(tempNodes, graphType, 800, 500);
      
      // Create nodes with proper initial positions
      const nodes = tempNodes.map((node, index) => {
        const position = initialPositions[index] || { x: Math.random() * 800, y: Math.random() * 500 };
        const nodeId = node.id;
        
        // Store original position for reset
        originalNodePositions.current.set(nodeId, { x: position.x, y: position.y });
        
        return {
          ...node,
          x: position.x,
          y: position.y
        };
      });

      // Don't create random links - similarity links will be generated based on real data
      const links = [];

      const originalData = { nodes, links };
      setOriginalGraphData(originalData);
      
      // Mark as loaded for this collection (use closure variables)
      const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
      if (!dataLoadedRef.current.has(collectionKey)) {
        dataLoadedRef.current.add(collectionKey);
      }
      
      // Process with similarity calculations
      const processedData = processSimilarityData(originalData);
      setGraphData(processedData);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Graph loaded with ${nodes.length} nodes and ${links.length} links`);
      }
      
      // Notify parent that graph data is loaded (pass nodes and links for structural similarity)
      onGraphDataLoaded({ nodes, links: processedData.links });
      
      // Notify parent of graph stats
      if (onGraphStatsChange) {
        onGraphStatsChange({
          collectionName,
          nodeCount: nodes.length,
          linkCount: processedData.links.length,
          is3D: localIs3D,
          status: 'WORKING'
        });
      }
    } catch (err) {
      console.error('❌ Error fetching graph data:', err);
      setError(err.message);
      
      // Notify parent of error state
      if (onGraphStatsChange) {
        onGraphStatsChange({
          collectionName,
          nodeCount: 0,
          linkCount: 0,
          is3D: localIs3D,
          status: 'ERROR'
        });
      }
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, qdrantBaseUrl]); // processSimilarityData and onGraphStatsChange are stable

  // Listen for reset event (must be after fetchGraphData is defined)
  useEffect(() => {
    const handleReset = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Graph reset event received');
      }
      setSelectedNode(null);
      
      // Clear the data loaded flag to allow fresh fetch (like browser refresh)
      const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
      dataLoadedRef.current.delete(collectionKey);
      
      // Clear original graph data to force fresh fetch
      setOriginalGraphData({ nodes: [], links: [] });
      setGraphData({ nodes: [], links: [] });
      
      // Clear original node positions
      originalNodePositions.current.clear();
      
      // Reset fetch in progress flag
      fetchInProgressRef.current = false;
      
      // Force re-render
      setResetKey(prev => prev + 1);
      
      // Refetch data from Qdrant (like browser refresh)
      fetchGraphData();
      
      // Stop the force simulation first
      if (current2DRef.current && !localIs3D) {
        try {
          current2DRef.current.d3Force('link', null);
          current2DRef.current.d3Force('charge', null);
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Could not stop 2D simulation:', e);
          }
        }
      }
      if (current3DRef.current && localIs3D) {
        try {
          current3DRef.current.d3Force('link', null);
          current3DRef.current.d3Force('charge', null);
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Could not stop 3D simulation:', e);
          }
        }
      }
      
      // Reset camera/zoom/pan after a delay (data will be fetched fresh)
      setTimeout(() => {
        // Reset camera/zoom/pan for 3D only
        if (current3DRef.current && localIs3D) {
          try {
            current3DRef.current.cameraPosition({ x: 0, y: 0, z: 400 }, { x: 0, y: 0, z: 0 }, 1000);
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ 3D camera reset');
            }
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Could not reset 3D camera:', e);
            }
          }
        }
        // 2D view reset removed - let it maintain current zoom/pan state
      }, 500); // Wait for data to start loading
    };
    
    window.addEventListener('resetGraphVisualization', handleReset);
    return () => window.removeEventListener('resetGraphVisualization', handleReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localIs3D, collectionName, qdrantBaseUrl, fetchGraphData]); // Include dependencies needed for reset

  // Reprocess data when similarity settings change (memoize callback to prevent loops)
  const onGraphStatsChangeRef = useRef(onGraphStatsChange);
  useEffect(() => {
    onGraphStatsChangeRef.current = onGraphStatsChange;
  }, [onGraphStatsChange]);
  
  // Track previous processed data to avoid unnecessary reprocessing
  const prevProcessedDataRef = useRef(null);
  
  useEffect(() => {
    if (originalGraphData.nodes.length > 0) {
      // Only reprocess if settings actually changed
      const processedData = processSimilarityData(originalGraphData);
      
      // Check if data actually changed to avoid unnecessary updates
      const dataKey = JSON.stringify({
        nodeCount: processedData.nodes.length,
        linkCount: processedData.links.length,
        similarityMode,
        similarityThreshold,
        selectedNodeId: selectedNode?.id
      });
      
      if (prevProcessedDataRef.current !== dataKey) {
        prevProcessedDataRef.current = dataKey;
        setGraphData(processedData);
        
        // Update stats when data changes (use ref to avoid dependency loop)
        if (onGraphStatsChangeRef.current) {
          onGraphStatsChangeRef.current({
            collectionName,
            nodeCount: processedData.nodes.length,
            linkCount: processedData.links.length,
            is3D: localIs3D,
            status: 'WORKING'
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [similarityMode, similarityThreshold, selectedNode, localIs3D, collectionName, originalGraphData]);
  
  // Update stats when is3D changes (only when is3D actually changes, not on every graphData change)
  const prevIs3DRef = useRef(localIs3D);
  useEffect(() => {
    if (graphData.nodes.length > 0 && localIs3D !== prevIs3DRef.current && onGraphStatsChangeRef.current) {
      prevIs3DRef.current = localIs3D;
      onGraphStatsChangeRef.current({
        collectionName,
        nodeCount: graphData.nodes.length,
        linkCount: graphData.links.length,
        is3D: localIs3D,
        status: 'WORKING'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localIs3D, collectionName]);

  // Load data on mount (only once per collection, even with React StrictMode)
  useEffect(() => {
    const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
    
    // Skip if already loaded for this collection
    if (dataLoadedRef.current.has(collectionKey)) {
      return;
    }
    
    // Skip if we already have data for this collection
    if (originalGraphData.nodes.length > 0) {
      dataLoadedRef.current.add(collectionKey);
      return;
    }
    
    // Call fetchGraphData - it will handle its own guards
    // Don't set fetchInProgressRef here, let fetchGraphData do it
    fetchGraphData();
    
    // Cleanup: remove from set when collection changes
    return () => {
      // Clear the set when collection actually changes (not on unmount in StrictMode)
      // We'll let the next mount check if data exists
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]); // Only depend on collectionName

  // Force re-render when switching 3D modes by updating a state
  const [modeSwitchKey, setModeSwitchKey] = useState(0);
  
  // Only update mode switch key when 3D mode actually changes, don't refetch data
  const prevIs3DRef2 = useRef(localIs3D);
  const prevSpecialized3DRef = useRef(specialized3D);
  useEffect(() => {
    if (localIs3D !== prevIs3DRef2.current || specialized3D !== prevSpecialized3DRef.current) {
      prevIs3DRef2.current = localIs3D;
      prevSpecialized3DRef.current = specialized3D;
      setModeSwitchKey(prev => prev + 1);
      // Don't refetch data - it's already loaded
    }
  }, [specialized3D, localIs3D]);

  // Get force configuration based on graph type
  const getForceConfig = useCallback(() => {
    const baseDistance = useVariableDistance ? (minDistance + maxDistance) / 2 : 80;
    const baseCharge = -300;
    
    // Use function for link distance to read from link.distance if available
    // This allows similarity-based distances to be used
    const linkDistanceFn = (link) => {
      // If link has a distance property (from similarity calculations), use it
      if (link.distance !== undefined && link.distance !== null) {
        return link.distance;
      }
      // Otherwise use the base distance for this graph type
      return baseDistance;
    };
    
    switch (graphType) {
      case 'force-directed':
        // Classic force-directed: balanced forces, natural clustering
        return {
          charge: { strength: baseCharge },
          link: { distance: linkDistanceFn, strength: 0.1 },
          center: { strength: 0.1 },
          collision: { radius: nodeSize * 2 }
        };
      
      case 'hierarchical':
        // Hierarchical: stronger links, weaker repulsion, vertical positioning
        // Add y-positioning force to maintain top-to-bottom structure
        return {
          charge: { strength: baseCharge * 0.5 },
          link: { distance: (link) => link.distance !== undefined ? link.distance : baseDistance * 0.8, strength: 0.3 },
          center: { strength: 0.2 },
          collision: { radius: nodeSize * 2 },
          // Note: Vertical positioning is handled by initial positions
          // The force simulation will maintain the structure
        };
      
      case 'circular':
        // Circular: strong centering, equal spacing
        return {
          charge: { strength: baseCharge * 1.5 },
          link: { distance: (link) => link.distance !== undefined ? link.distance : baseDistance * 1.2, strength: 0.05 },
          center: { strength: 0.5 },
          collision: { radius: nodeSize * 3 }
        };
      
      case 'grid':
        // Grid: strong positioning, minimal movement
        return {
          charge: { strength: baseCharge * 0.3 },
          link: { distance: (link) => link.distance !== undefined ? link.distance : baseDistance * 0.6, strength: 0.5 },
          center: { strength: 0.3 },
          collision: { radius: nodeSize * 2 }
        };
      
      case 'qdrant-native':
        // Qdrant native: hub-spoke model, strong hub connections
        return {
          charge: { strength: baseCharge * 0.8 },
          link: { distance: (link) => link.distance !== undefined ? link.distance : baseDistance * 0.7, strength: enableHubSpoke ? 0.4 : 0.1 },
          center: { strength: 0.15 },
          collision: { radius: nodeSize * 2.5 }
        };
      
      default:
        // Default to force-directed
        return {
          charge: { strength: baseCharge },
          link: { distance: linkDistanceFn, strength: 0.1 },
          center: { strength: 0.1 },
          collision: { radius: nodeSize * 2 }
        };
    }
  }, [graphType, useVariableDistance, minDistance, maxDistance, nodeSize, enableHubSpoke]);

  // Force re-render and update positions when graph type changes
  const prevGraphTypeRef = useRef(graphType);
  useEffect(() => {
    if (graphType !== prevGraphTypeRef.current && graphData.nodes.length > 0) {
      prevGraphTypeRef.current = graphType;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 Graph type changed to: ${graphType}`);
        const config = getForceConfig();
        console.log(`⚙️ Force config:`, config);
      }
      
      // Update node positions based on new graph type
      const newPositions = getInitialPositions(graphData.nodes, graphType, 800, 500);
      const updatedNodes = graphData.nodes.map((node, index) => {
        const newPos = newPositions[index] || { x: node.x, y: node.y };
        // Update original positions for reset
        originalNodePositions.current.set(node.id, { x: newPos.x, y: newPos.y });
        return {
          ...node,
          x: newPos.x,
          y: newPos.y
        };
      });
      
      // Update graph data with new positions
      setGraphData(prev => ({
        ...prev,
        nodes: updatedNodes
      }));
      
      // Force re-render by updating mode switch key
      setModeSwitchKey(prev => prev + 1);
    }
  }, [graphType, getForceConfig, getInitialPositions, graphData.nodes.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
          <p className="text-gray-400">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-400">No data available for visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullWidth ? 'h-full w-full' : 'bg-gray-800 rounded-lg'} overflow-hidden relative`}>
      {/* Header - Removed, info moved to top header */}

      {/* Controls - Node Size and Link Width section shifts with left panel */}
      <div className="bg-gray-600 px-4 py-2 flex items-center justify-between text-sm transition-all duration-300"
        style={{
          marginLeft: '0' // This will be controlled by parent's left panel state
        }}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-gray-300">Node Size:</label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={nodeSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onNodeSizeChange(newSize);
              }}
              className="w-20"
            />
            <span className="text-gray-300 w-6">{nodeSize}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-gray-300">Link Width:</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={linkWidth}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                onLinkWidthChange(newWidth);
              }}
              className="w-20"
            />
            <span className="text-gray-300 w-6">{linkWidth.toFixed(1)}</span>
          </div>

          {/* Specialized 3D Modules */}
          {localIs3D && (
            <div className="flex items-center space-x-2">
              <label className="text-gray-300">3D Mode:</label>
              <select
                value={specialized3D}
                onChange={(e) => setSpecialized3D(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                <option value="none">Basic 3D</option>
                <option value="highlight">Highlight Nodes/Links</option>
                <option value="click-focus">Click-to-Focus</option>
              </select>
            </div>
          )}

          {/* 3D Movement Speed Control */}
          {localIs3D && (
            <div className="flex items-center space-x-2">
              <label className="text-gray-300">Speed:</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={movementSpeed}
                onChange={(e) => setMovementSpeed(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-gray-300 w-8">{movementSpeed}x</span>
            </div>
          )}

        </div>
        
        {selectedNode && (
          <div className="text-gray-300">
            Selected: <span className="text-blue-300">{selectedNode.label}</span>
          </div>
        )}
      </div>

      {/* Graph */}
      <div style={{ height: height, backgroundColor: '#1f2937' }}>
        {localIs3D ? (
          // Render specialized 3D modules
          (() => {
            const commonProps = {
              graphData: memoizedGraphData,
              width: fullWidth ? window.innerWidth : 800,
              height: fullWidth ? window.innerHeight - 100 : 500,
              movementSpeed,
              showLabels: localShowTextLabels,
              nodeSize,
              linkWidth,
              onNodeClick: (node) => {
                // console.log('Node clicked:', node);
                setSelectedNode(node);
                onNodeSelect(node);
              },
              onBackgroundClick: () => {
                console.log('Background clicked');
                setSelectedNode(null);
              }
            };

            switch (specialized3D) {
              case 'highlight':
                return <Highlight3DWorking key={`highlight-${specialized3D}-${graphData.nodes?.length}-${modeSwitchKey}-${resetKey}`} ref={current3DRef} {...commonProps} />;
              case 'click-focus':
                return <ClickFocus3DWorking key={`click-focus-${specialized3D}-${graphData.nodes?.length}-${modeSwitchKey}-${resetKey}`} ref={current3DRef} {...commonProps} />;
              default:
                return (
                  <ForceGraph3D
                    key={`basic-3d-${graphType}-${graphData.nodes?.length}-${modeSwitchKey}-${resetKey}`}
                    ref={current3DRef}
                    graphData={memoizedGraphData}
                    nodeLabel={localShowTextLabels ? "label" : ""}
                    nodeColor={nodeColorFn}
                    nodeVal={nodeValFn}
                    linkColor={linkColorFn}
                    linkWidth={linkWidthFn}
                    width={fullWidth ? window.innerWidth : 800}
                    height={fullWidth ? window.innerHeight - 100 : 500}
                    d3Force="link"
                    d3ForceConfig={getForceConfig()}
                    onNodeClick={(node) => {
                      // console.log('Node clicked:', node);
                      setSelectedNode(node);
                      onNodeSelect(node);
                    }}
                    onBackgroundClick={() => {
                      // Background click handled silently
                      setSelectedNode(null);
                    }}
                    enableNodeDrag={true}
                    enableZoomPanRotate={true}
                    showNavInfo={true}
                    // Free rotation settings - no boundaries
                    cameraPosition={{ x: 0, y: 0, z: 400 }}
                    onEngineStart={() => {
                      // Increase rotation speed for better responsiveness
                      const controls = this.controls();
                      if (controls) {
                        controls.enableDamping = true;
                        controls.dampingFactor = 0.05;
                        controls.rotateSpeed = movementSpeed * 8; // Much faster rotation
                        controls.zoomSpeed = movementSpeed * 4.0; // Faster zoom
                        controls.panSpeed = movementSpeed * 4.0; // Faster pan
                        
                        // Default controls handle rotation properly
                        controls.enableRotate = true;
                        
                        // Set proper target
                        controls.target.set(0, 0, 0);
                        controls.update();
                      }
                      
                      // Optimize WebGL settings to reduce warnings
                      const renderer = this.scene()?.renderer;
                      if (renderer) {
                        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                        renderer.antialias = true;
                        renderer.powerPreference = "high-performance";
                      }
                    }}
                  />
                );
            }
          })()
        ) : (
          <ForceGraph2D
            key={`force-2d-${graphType}-${graphData.nodes?.length}-${modeSwitchKey}-${resetKey}`}
            ref={current2DRef}
            graphData={memoizedGraphData}
            nodeLabel={localShowTextLabels ? "label" : ""}
            nodeColor={nodeColorFn}
            nodeVal={nodeValFn}
            linkColor={linkColorFn}
            linkWidth={linkWidthFn}
            width={fullWidth ? window.innerWidth : 800}
            height={fullWidth ? window.innerHeight - 100 : 500}
            d3Force="link"
            d3ForceConfig={getForceConfig()}
            onNodeClick={(node) => {
              // console.log('Node clicked:', node);
              setSelectedNode(node);
              onNodeSelect(node);
            }}
            onBackgroundClick={() => {
              console.log('Background clicked');
              setSelectedNode(null);
            }}
            enableNodeDrag={true}
            enableZoomPanRotate={true}
            onEngineStop={() => {
              // Force restart when graph type changes
              // Force simulation stopped - will restart automatically
            }}
            onEngineTick={() => {
              // Ensure graph stays responsive
            }}
          />
        )}
      </div>
    </div>
  );
};

export default QdrantGraphWorking;
