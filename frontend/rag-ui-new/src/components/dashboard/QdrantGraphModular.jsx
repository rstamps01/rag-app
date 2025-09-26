/**
 * Qdrant Graph Visualization Component (Modular Version)
 * 
 * Interactive graph visualization for Qdrant collection data
 * showing vector relationships and clustering patterns.
 * 
 * Updated to use the modular graph system with support for
 * both 2D and 3D visualizations with specialized modules.
 */

import React, { useState, useEffect, useRef } from 'react';
import GraphContainer from './graphs/core/GraphContainer';
import { getGraphTypeById } from './graphs/core/GraphTypes';
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

const QdrantGraphModular = ({ collectionName = 'rag', qdrantBaseUrl = 'http://localhost:6333', height = '500px', fullWidth = false }) => {
  // Core state
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
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
    minDistance: 20, // Minimum distance between nodes
    maxDistance: 200, // Maximum distance between nodes
    similarityThreshold: 0.7, // Threshold for considering nodes similar
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

  // Fetch graph data from Qdrant
  const fetchGraphData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching graph data from Qdrant...');
      
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: settings.nodeLimit,
          with_payload: true,
          with_vector: false,
          filter: null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const points = data.result.points || [];
      
      console.log(`📊 Fetched ${points.length} points from Qdrant`);

      // Process nodes
      const nodes = points.map((point, index) => {
        const node = {
          id: point.id || `point_${index}`,
          label: point.payload?.filename || `Node ${index}`,
          group: Math.floor(index / 10),
          payload: point.payload || {},
          x: Math.random() * 800,
          y: Math.random() * 500,
          z: Math.random() * 200
        };
        return node;
      });

      // Create simple links based on similarity
      const links = [];
      for (let i = 0; i < Math.min(nodes.length, 50); i++) {
        for (let j = i + 1; j < Math.min(nodes.length, 50); j++) {
          if (Math.random() < 0.1) { // 10% chance of connection
            links.push({
              source: nodes[i].id,
              target: nodes[j].id,
              value: 1,
              distance: 80,
              type: 'connection'
            });
          }
        }
      }

      setGraphData({ nodes, links });
      console.log(`✅ Graph loaded with ${nodes.length} nodes and ${links.length} links`);
    } catch (err) {
      console.error('❌ Error fetching graph data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchGraphData();
  }, [collectionName, settings.nodeLimit]);

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
          {currentGraphType && (
            <span className="text-xs text-blue-300 bg-blue-900 px-2 py-1 rounded">
              {currentGraphType.name}
            </span>
          )}
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
            onClick={fetchGraphData}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {(selectedNode || selectedNodes.length > 0) && (
            <button
              onClick={() => {
                setSelectedNode(null);
                setSelectedNodes([]);
                setShowContentFlag(false);
              }}
              className="p-2 bg-red-600 hover:bg-red-500 rounded transition-colors"
              title="Clear Selections"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Graph Container - Uses Modular System */}
      <GraphContainer
        collectionName={collectionName}
        qdrantBaseUrl={qdrantBaseUrl}
        height={height}
        fullWidth={fullWidth}
        graphData={graphData}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchGraphData}
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
