/**
 * Qdrant Graph Visualization Component (Modular Version)
 * 
 * Interactive graph visualization for Qdrant collection data
 * showing vector relationships and clustering patterns.
 * 
 * Updated to use the modular graph system with support for
 * both 2D and 3D visualizations with specialized modules.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QDRANT_URL } from '../../config';
import GraphContainer from './graphs/core/GraphContainer';
import { getGraphTypeById } from './graphs/core/GraphTypes';
import { 
  calculateSimilarity, 
  generateSimilarityLinks, 
  filterNodesBySimilarity,
  getSimilarityStats,
  validateSimilarityData
} from '../../utils/similarityUtils';
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

const QdrantGraphModular = ({ 
  collectionName = 'rag', 
  qdrantBaseUrl = QDRANT_URL, 
  height = '500px', 
  fullWidth = false,
  similarityMode = 'semantic',
  similarityThreshold = 0.45,
  minDistance = 20,
  maxDistance = 200
}) => {
  // Core state
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [originalGraphData, setOriginalGraphData] = useState({ nodes: [], links: [] }); // CRITICAL: Store original data for reprocessing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showVisualizationMenu, setShowVisualizationMenu] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState({
    nodeLimit: 100,
    linkDistance: 30,
    chargeStrength: -300,
    showLabels: true,
    nodeSize: 3,
    linkWidth: 1
  });

  // Visualization settings with modular graph types
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
    minDistance: minDistance, // Use prop value from parent
    maxDistance: maxDistance, // Use prop value from parent
    similarityThreshold: similarityThreshold, // Use prop value from parent
    graphType: 'force-directed-2d', // Use modular graph types
    showAnchors: true, // Show central anchor points
    use3D: false, // Toggle between 2D and 3D visualization
    anchorStrength: 0.02, // Strength of anchor connections
    maintainInterconnectivity: true, // Maintain interconnectivity
    hubSpokeMode: true, // Enable hub and spoke model
    spokesPerHub: 5, // Number of spokes per hub
    maxHubs: 10 // Maximum number of hubs allowed
  });

  // Selection and interaction state
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [nodeConnections, setNodeConnections] = useState({});
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState(new Set());
  const [hubs, setHubs] = useState([]);
  const [hubConnections, setHubConnections] = useState([]);
  const [nodePositions, setNodePositions] = useState(new Map());
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
    nodesPerHub: 5,
    autoGenerate: false
  });

  // Refs
  const graphRef = useRef();
  const containerRef = useRef();
  const doubleClickTimer = useRef(null);
  const fetchInProgressRef = useRef(false); // Prevent concurrent fetches
  const dataLoadedRef = useRef(new Set()); // Track loaded collections to prevent duplicate fetches

  // Helper function to get initial positions based on graph type (like QdrantGraphWorking)
  const getInitialPositions = useCallback((nodes, graphType, width = 800, height = 500) => {
    const nodeCount = nodes.length;
    if (nodeCount === 0) return [];
    
    // Map modular graph types to positioning strategies
    const normalizedType = graphType?.replace('-2d', '').replace('-3d', '') || 'force-directed';
    
    switch (normalizedType) {
      case 'hierarchical':
      case 'hierarchical-cluster': {
        // Arrange nodes in tree-like structure (top to bottom)
        const positions = [];
        const levels = Math.ceil(Math.sqrt(nodeCount));
        
        nodes.forEach((node, index) => {
          const level = Math.floor((index / nodeCount) * levels);
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
      
      default: // force-directed, disjoint-force, force-tree, etc.
        // Random positions for force-directed
        return nodes.map(() => ({
          x: Math.random() * width,
          y: Math.random() * height
        }));
    }
  }, []);

  // Process similarity data (CRITICAL: Like QdrantGraphWorking)
  const processSimilarityData = useCallback((data) => {
    if (!data.nodes || data.nodes.length === 0) return data;

    // Validate data availability for the selected similarity mode
    const validation = validateSimilarityData(data.nodes, similarityMode);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✨ Similarity Mode: ${similarityMode}`);
      console.log(`✅ Data Validation:`, {
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
        console.log(`📈 Average link distance: ${avgDistance.toFixed(2)} (similarity: ${avgSimilarity.toFixed(3)})`);
      } else if (!validation.isValid) {
        console.warn(`⚠️ No links generated - similarity mode may not be suitable for current data`);
      }
    }

    // Combine original links with similarity links
    const allLinks = [...(data.links || []), ...similarityLinks];

    return {
      ...data,
      nodes: data.nodes,
      links: allLinks
    };
  }, [similarityMode, similarityThreshold, minDistance, maxDistance]);

  // Fetch graph data from Qdrant
  const fetchGraphData = async () => {
    const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
    
    // Guard against concurrent fetches
    if (fetchInProgressRef.current) {
      return; // Silent skip - no logging to reduce noise
    }
    
    // Guard against duplicate fetches for same collection (works with StrictMode)
    if (dataLoadedRef.current.has(collectionKey)) {
      return; // Silent skip - data already loaded
    }
    
    setIsLoading(true);
    setError(null);
    fetchInProgressRef.current = true;
    
    try {
      // Only log once per actual fetch
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Fetching graph data from Qdrant...');
      }
      
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: settings.nodeLimit,
          with_payload: true,
          with_vector: true,  // CRITICAL: Must be true to fetch vectors for similarity calculations
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

      // Process nodes with embeddings, content, and timestamps (like QdrantGraphWorking)
      const tempNodes = points.map((point, index) => ({
        id: point.id || `point_${index}`,
        label: point.payload?.filename || `Node ${index}`,
        group: Math.floor(index / 10),
        payload: point.payload || {},
        embedding: point.vector || null,  // CRITICAL: Store embedding for similarity
        content: point.payload?.content || point.payload?.text || '',  // CRITICAL: Store content
        timestamp: point.payload?.timestamp || null  // CRITICAL: Store timestamp
      }));

      // Get initial positions based on graph type (like QdrantGraphWorking)
      const graphType = visualizationSettings.graphType || 'force-directed-2d';
      const initialPositions = getInitialPositions(tempNodes, graphType, 800, 500);

      // Create nodes with proper initial positions
      const nodes = tempNodes.map((node, index) => {
        const position = initialPositions[index] || { x: Math.random() * 800, y: Math.random() * 500 };
        return {
          ...node,
          x: position.x,
          y: position.y
        };
      });

      // Don't create random links - similarity links will be generated based on real data
      const links = [];

      const originalData = { nodes, links };
      setOriginalGraphData(originalData); // CRITICAL: Store original data for reprocessing
      
      // Process with similarity calculations (like QdrantGraphWorking)
      const processedData = processSimilarityData(originalData);
      setGraphData(processedData);
      
      // Mark as loaded BEFORE logging to prevent duplicate logs
      dataLoadedRef.current.add(collectionKey);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Graph loaded with ${nodes.length} nodes and ${processedData.links.length} links`);
      }
    } catch (err) {
      console.error('❌ Error fetching graph data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }

  };

  // Handle refresh - clear cache and refetch
  const handleRefresh = () => {
    const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
    dataLoadedRef.current.delete(collectionKey);
    fetchInProgressRef.current = false;
    setGraphData({ nodes: [], links: [] });
    setOriginalGraphData({ nodes: [], links: [] }); // CRITICAL: Clear original data too
    fetchGraphData();
  };

  // Reprocess data when similarity settings change (like QdrantGraphWorking)
  useEffect(() => {
    if (originalGraphData.nodes.length > 0) {
      const processedData = processSimilarityData(originalGraphData);
      setGraphData(processedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [similarityMode, similarityThreshold, minDistance, maxDistance, originalGraphData]);

  // Load data on mount (only once per collection, even with React StrictMode)
  useEffect(() => {
    const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
    
    // Skip if already loaded for this collection (works with StrictMode double-mount)
    if (dataLoadedRef.current.has(collectionKey)) {
      return;
    }
    
    // Call fetchGraphData - it will handle its own guards
    fetchGraphData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, qdrantBaseUrl]); // Only depend on collection identifiers

  // Event handlers
  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
    setSelectedNodeContent(node);
    setShowContentFlag(true);
  };

  const handleNodeHover = (node) => {
    setHoveredNode(node);
    setIsHovering(true);
  };

  const handleNodeDrag = (node) => {
    // Handle drag events if needed
  };

  const handleNodeDragEnd = (node) => {
    // Handle drag end events if needed
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setSelectedNodes([]);
    setShowContentFlag(false);
  };

  const handleLinkClick = (link) => {
    console.log('Link clicked:', link);
  };

  const handleLinkHover = (link) => {
    // Handle link hover if needed
  };

  // Get current graph type info
  const currentGraphType = getGraphTypeById(visualizationSettings.graphType);

  return (
    <div className={`${fullWidth ? 'h-full w-full' : ''} overflow-hidden relative`} style={{ backgroundColor: 'transparent' }}>
      {/* Graph Container - Uses Modular System (includes its own header) */}
      <GraphContainer
        collectionName={collectionName}
        qdrantBaseUrl={qdrantBaseUrl}
        height={height}
        fullWidth={fullWidth}
        graphData={graphData}
        isLoading={isLoading}
        error={error}
        onRefresh={handleRefresh}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeDrag={handleNodeDrag}
        onNodeDragEnd={handleNodeDragEnd}
        onBackgroundClick={handleBackgroundClick}
        onLinkClick={handleLinkClick}
        onLinkHover={handleLinkHover}
        visualizationSettings={visualizationSettings}
        setVisualizationSettings={setVisualizationSettings}
        settings={settings}
        setSettings={setSettings}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        selectedNodes={selectedNodes}
        setSelectedNodes={setSelectedNodes}
        showContentFlag={showContentFlag}
        setShowContentFlag={setShowContentFlag}
      />

      {/* Node Content Flag - Right side flag for viewing node content */}
      {showContentFlag && selectedNode && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-l-lg shadow-lg cursor-pointer hover:bg-blue-500 transition-colors flex items-center space-x-2"
               onClick={() => setShowNodeContent(!showNodeContent)}>
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">View Node Content</span>
          </div>
        </div>
      )}

      {/* Node Content Panel */}
      {showNodeContent && selectedNode && (
        <div className="absolute right-0 top-0 h-full w-96 bg-gray-800 border-l border-gray-700 shadow-2xl z-30">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Node Details</h3>
            <button
              onClick={() => setShowNodeContent(false)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Basic Info</h4>
              <div className="bg-gray-700 p-3 rounded space-y-2">
                <div><span className="text-gray-400">ID:</span> <span className="text-white">{selectedNode.id}</span></div>
                <div><span className="text-gray-400">Label:</span> <span className="text-white">{selectedNode.label}</span></div>
                <div><span className="text-gray-400">Group:</span> <span className="text-white">{selectedNode.group}</span></div>
              </div>
            </div>
            
            {selectedNode.payload && Object.keys(selectedNode.payload).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Payload</h4>
                <div className="bg-gray-700 p-3 rounded">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(selectedNode.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Position</h4>
              <div className="bg-gray-700 p-3 rounded space-y-1">
                <div><span className="text-gray-400">X:</span> <span className="text-white">{selectedNode.x?.toFixed(2) || 'N/A'}</span></div>
                <div><span className="text-gray-400">Y:</span> <span className="text-white">{selectedNode.y?.toFixed(2) || 'N/A'}</span></div>
                <div><span className="text-gray-400">Z:</span> <span className="text-white">{selectedNode.z?.toFixed(2) || 'N/A'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QdrantGraphModular;

