import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import EnhancedSimilarityControls from './EnhancedSimilarityControls';
import EnhancedVisualizationControls from './EnhancedVisualizationControls';
import SimilarityContextSheet from './SimilarityContextSheet';
import NodeInformationPanel from './NodeInformationPanel';
import Particles from '../Particles';
import MagnetLines from '../MagnetLines';
import { 
  calculateSimilarity,
  cosineSimilarity,
  calculateTextSimilarity,
  temporalSimilarity,
  hybridSimilarity,
  structuralSimilarity,
  generateBaseLinksForStructural
} from '../../utils/similarityUtils';
// import RotatingText from '../RotatingText';
import { 
  BarChart3, 
  Settings, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Zap, 
  Target,
  Layers,
  Activity,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RefreshCw,
  Pin,
  PinOff
} from 'lucide-react';

interface EnhancedSimilarityDemoProps {
  children: React.ReactNode;
  selectedNode?: any;
  similarityData?: any[];
  onNodeSelect?: (node: any) => void;
  onSettingsChange?: (settings: any) => void;
  className?: string;
  visualizationSettings?: any; // Allow parent to pass visualization settings
  onPanelStateChange?: (state: { leftPanel: boolean; rightPanel: boolean }) => void; // Callback for panel state changes
  collectionName?: string; // Collection name for display
  graphStats?: { collectionName: string; nodeCount: number; linkCount: number; is3D: boolean; status: string } | null; // Graph statistics
  graphNodes?: any[]; // All graph nodes for similarity calculations
  graphLinks?: any[]; // Optional: graph links for structural similarity (when not provided, base links are generated from nodes)
  similarityMode?: string; // Current similarity mode
  similarityThreshold?: number; // Current similarity threshold
  minDistance?: number; // Minimum link distance
  maxDistance?: number; // Maximum link distance
}

const EnhancedSimilarityDemo: React.FC<EnhancedSimilarityDemoProps> = ({
  children,
  selectedNode,
  similarityData = [],
  onNodeSelect,
  onSettingsChange,
  className = '',
  visualizationSettings: parentVisualizationSettings,
  onPanelStateChange,
  collectionName = 'rag',
  graphStats = null,
  graphNodes = [],
  graphLinks,
  similarityMode = 'semantic',
  similarityThreshold = 0.45,
  minDistance = 20,
  maxDistance = 200
}) => {
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  // Notify parent of panel state changes
  useEffect(() => {
    if (onPanelStateChange) {
      onPanelStateChange({ leftPanel: showLeftPanel, rightPanel: showRightPanel });
    }
  }, [showLeftPanel, showRightPanel, onPanelStateChange]);
  const [showParticles, setShowParticles] = useState(true);
  const [showMagnetLines, setShowMagnetLines] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('graph');
  const [isPinned, setIsPinned] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [isRightPanelPinned, setIsRightPanelPinned] = useState(false);
  const [similarityNodes, setSimilarityNodes] = useState<any[]>([]);
  const defaultVisualizationSettings = {
    // Graph Layout
    graphType: 'force-directed',
    
    // Node Labels
    showTextLabels: true,
    labelMode: 'filename',
    
    // Color Coding
    colorScheme: 'group',
    
    // Node Size
    nodeSizeMode: 'fixed',
    nodeSize: 3,
    
    // Node Shape
    nodeShape: 'circle',
    
    // Node Mobility & Interconnectivity
    maintainInterconnectivity: true,
    showAnchorPoints: false,
    
    // Display Options
    showInterconnectivity: false,
    highlightSelected: true,
    
    // Node Distance & Similarity
    useVariableDistance: true,
    similarityMode: 'semantic',
    minDistance: 20,
    maxDistance: 200,
    similarityThreshold: 0.45,
    
    // Advanced Features
    showTooltips: true,
    enableClustering: false,
    enableAnimations: true,
    enableFiltering: false,
    multiSelect: false,
    
    // Hub & Spoke Model
    enableHubSpoke: false,
    spokesPerHub: 5,
    maxHubs: 10,
    
    // 3D Settings
    is3D: false,
    movementSpeed: 2.0,
    linkWidth: 1
  };
  
  // Use parent settings if provided, otherwise use local state
  const [localVisualizationSettings, setLocalVisualizationSettings] = useState(defaultVisualizationSettings);
  const visualizationSettings = parentVisualizationSettings || localVisualizationSettings;
  
  // Sync local settings when parent settings change (prevent unnecessary updates)
  const prevParentSettingsRef = useRef<string | null>(null);
  useEffect(() => {
    if (parentVisualizationSettings) {
      // Create a stable key for comparison
      const settingsKey = JSON.stringify(parentVisualizationSettings);
      
      if (settingsKey !== prevParentSettingsRef.current) {
        prevParentSettingsRef.current = settingsKey;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Syncing visualization settings from parent:', parentVisualizationSettings);
        }
        setLocalVisualizationSettings(prev => {
          // Only update if settings actually changed
          const hasChanges = Object.keys(parentVisualizationSettings).some(
            key => prev[key] !== parentVisualizationSettings[key]
          );
          return hasChanges ? { ...prev, ...parentVisualizationSettings } : prev;
        });
      }
    }
  }, [parentVisualizationSettings]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewSettings, setPreviewSettings] = useState<any>(null);

  // Similarity settings state
  const [similaritySettings, setSimilaritySettings] = useState({
    similarityMode: 'semantic',
    similarityThreshold: 0.45,
    minDistance: 20,
    maxDistance: 200,
    connectionLevels: 1,
    nodeSize: 3,
    linkWidth: 1,
    movementSpeed: 2.0
  });

  const similarityModes = [
    { value: 'semantic', label: 'Semantic', description: 'Content-based similarity using embeddings' },
    { value: 'structural', label: 'Structural', description: 'Graph structure and connections' },
    { value: 'temporal', label: 'Temporal', description: 'Time-based similarity patterns' },
    { value: 'hybrid', label: 'Hybrid', description: 'Combination of multiple similarity measures' }
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const handleSettingsChange = (newSettings: any) => {
    if (isPreviewMode) {
      setPreviewSettings(prev => ({ ...prev, ...newSettings }));
    } else {
      setSimilaritySettings(prev => ({ ...prev, ...newSettings }));
      onSettingsChange?.(newSettings);
    }
  };

  const applyPreviewSettings = () => {
    if (previewSettings) {
      setSimilaritySettings(prev => ({ ...prev, ...previewSettings }));
      onSettingsChange?.(previewSettings);
      setPreviewSettings(null);
      setIsPreviewMode(false);
    }
  };

  const discardPreviewSettings = () => {
    setPreviewSettings(null);
    setIsPreviewMode(false);
  };

  const handleVisualizationSettingsChange = (settings: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 EnhancedSimilarityDemo: Visualization settings changed:', settings);
    }
    
    // Update local settings
    setLocalVisualizationSettings(prev => {
      const updated = { ...prev, ...settings };
      if (settings.graphType) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 EnhancedSimilarityDemo: Updating graphType to: ${settings.graphType}`);
        }
      }
      return updated;
    });
    
    // Apply changes immediately if live preview is enabled
    if (livePreview) {
      console.log('✅ Live preview enabled, applying changes to parent...');
      // Notify parent component with visualization settings
      if (onSettingsChange) {
        onSettingsChange({ ...similaritySettings, ...settings });
      }
    } else {
      console.log('⏸️ Live preview disabled, changes will be applied when "Apply Changes" is clicked');
    }
  };

  const handleApplyVisualizationChanges = () => {
    // Apply visualization settings to the graph
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Applying visualization changes:', visualizationSettings);
    }
    if (onSettingsChange) {
      onSettingsChange({ ...similaritySettings, ...visualizationSettings });
    }
  };

  const handleTogglePin = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    setLivePreview(newPinnedState); // Enable live preview when pinning
    if (newPinnedState) {
      setShowLeftPanel(true);
    }
  };

  const handleToggleLivePreview = () => {
    setLivePreview(!livePreview);
  };

  const handleCloseVisualizationPanel = () => {
    if (!isPinned) {
      setShowLeftPanel(false);
    }
  };

  const handleToggleRightPanelPin = () => {
    setIsRightPanelPinned(!isRightPanelPinned);
    if (!isRightPanelPinned) {
      setShowRightPanel(true);
    }
  };

  const handleCloseRightPanel = () => {
    if (!isRightPanelPinned) {
      setShowRightPanel(false);
    }
  };

  const handleNodeSelect = (nodeId: string) => {
    // This would typically find the node by ID and select it
    console.log('Selecting node:', nodeId);
    // You would implement the actual node selection logic here
  };

  // Calculate real similarity nodes when a node is selected
  useEffect(() => {
    if (selectedNode && graphNodes.length > 0) {
      // Use provided graph links when available; for structural/hybrid without links, generate base links from nodes
      const links =
        graphLinks && graphLinks.length > 0
          ? graphLinks
          : (similarityMode === 'structural' || similarityMode === 'hybrid')
            ? generateBaseLinksForStructural(graphNodes, Math.max(0.2, similarityThreshold * 0.5))
            : [];
      const graphData = { nodes: graphNodes, links };
      
      // Calculate similarity for all other nodes (without threshold filter first to get all values)
      const allSimilarities = graphNodes
        .filter(node => node.id !== selectedNode.id) // Exclude the selected node itself
        .map(node => {
          // Calculate similarity without threshold filter to get actual values
          // We'll filter by threshold after getting all similarities
          let similarity = 0;
          
          // Use the same calculation logic as calculateSimilarity but without threshold filtering
          switch (similarityMode) {
            case 'semantic':
              if (selectedNode.embedding && node.embedding) {
                similarity = cosineSimilarity(selectedNode.embedding, node.embedding);
              } else if (selectedNode.content && node.content) {
                similarity = calculateTextSimilarity(selectedNode.content, node.content);
              }
              break;
            case 'structural':
              similarity = structuralSimilarity(selectedNode, node, graphData);
              break;
            case 'temporal':
              if (selectedNode.timestamp && node.timestamp) {
                similarity = temporalSimilarity(selectedNode, node);
              }
              break;
            case 'hybrid':
              similarity = hybridSimilarity(selectedNode, node, graphData);
              break;
            default:
              similarity = 0;
          }
          
          // Calculate distance based on similarity (inverse relationship)
          // Higher similarity = shorter distance
          const distance = similarity > 0 
            ? maxDistance - (similarity * (maxDistance - minDistance))
            : maxDistance;
          
          return {
            id: node.id,
            label: node.label || node.id,
            similarity: similarity,
            distance: distance,
            type: 'similarity'
          };
        })
        .filter(result => result.similarity >= similarityThreshold) // Filter by threshold
        .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (highest first)
        .slice(0, 10); // Take top 10 most similar nodes
      
      setSimilarityNodes(allSimilarities);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Found ${allSimilarities.length} similar nodes (threshold: ${similarityThreshold}) for ${selectedNode.id}`);
        if (allSimilarities.length > 0) {
          console.log(`📊 Similarity range: ${allSimilarities[allSimilarities.length - 1].similarity.toFixed(3)} - ${allSimilarities[0].similarity.toFixed(3)}`);
        }
      }
    } else {
      setSimilarityNodes([]);
    }
  }, [selectedNode, graphNodes, graphLinks, similarityMode, similarityThreshold, minDistance, maxDistance]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  };

  // Sync fullscreen state when user exits via ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle clicks outside panels to close them (only if not pinned)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close left panel if it's not pinned
      if (!isPinned && leftPanelRef.current && !leftPanelRef.current.contains(event.target as Node)) {
        // Check if click is on the toggle button
        const target = event.target as HTMLElement;
        const isToggleButton = target.closest('button[aria-label*="Controls"], button:has(svg[class*="Settings"])');
        if (!isToggleButton) {
          setShowLeftPanel(false);
        }
      }
      // Only close right panel if it's not pinned
      if (!isRightPanelPinned && rightPanelRef.current && !rightPanelRef.current.contains(event.target as Node)) {
        // Check if click is on the toggle button
        const target = event.target as HTMLElement;
        const isToggleButton = target.closest('button[aria-label*="Node Info"], button:has(svg[class*="Target"])');
        if (!isToggleButton) {
          setShowRightPanel(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPinned, isRightPanelPinned]);

  // Apply preview settings in real-time
  useEffect(() => {
    if (isPreviewMode && previewSettings) {
      onSettingsChange?.(previewSettings);
    }
  }, [previewSettings, isPreviewMode, onSettingsChange]);

  const currentSettings = isPreviewMode && previewSettings ? previewSettings : similaritySettings;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Particles Background */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <Particles
            count={50}
            speed={0.5}
            size={2}
            color="#3b82f6"
            opacity={0.3}
          />
        </div>
      )}

      {/* Magnet Lines Overlay */}
      {showMagnetLines && selectedNode && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <MagnetLines
            targetNode={selectedNode}
            connections={similarityData}
            intensity={0.8}
            color="#8b5cf6"
          />
        </div>
      )}

      {/* Main Container */}
      <div ref={containerRef} className="relative z-20 h-full flex">
        {/* Left Slide-out Panel - Controls */}
        <div
          ref={leftPanelRef}
          className={`fixed left-0 top-0 h-full w-[28rem] bg-gray-800 border-r border-gray-700 transform panel-transition z-30 ${
            showLeftPanel ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-900">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Visualization Controls
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isPreviewMode && (
                    <Badge variant="outline" className="bg-yellow-900/20 border-yellow-500 text-yellow-300">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview Mode
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLeftPanel(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              <EnhancedVisualizationControls
                settings={visualizationSettings}
                onSettingsChange={handleVisualizationSettingsChange}
                onApplyChanges={handleApplyVisualizationChanges}
                isPinned={isPinned}
                onTogglePin={handleTogglePin}
                onClose={handleCloseVisualizationPanel}
                livePreview={livePreview}
                onToggleLivePreview={handleToggleLivePreview}
                graphNodes={graphNodes}
              />
            </div>

            {/* Panel Footer */}
            {isPreviewMode && (
              <div className="p-4 border-t border-gray-700 bg-gray-900">
                <div className="flex gap-2">
                  <Button
                    onClick={applyPreviewSettings}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Apply Changes
                  </Button>
                  <Button
                    onClick={discardPreviewSettings}
                    variant="outline"
                    className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Slide-out Panel - Node Information */}
        <div
          ref={rightPanelRef}
          className={`fixed right-0 top-0 h-full w-[28rem] bg-gray-800 border-l border-gray-700 transform panel-transition z-50 ${
            showRightPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <NodeInformationPanel
            selectedNode={selectedNode}
            similarityNodes={similarityNodes}
            onClose={handleCloseRightPanel}
            isPinned={isRightPanelPinned}
            onTogglePin={handleToggleRightPanelPin}
            onNodeSelect={handleNodeSelect}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 transition-all duration-300 overflow-hidden">
          <div className="h-full flex flex-col overflow-hidden">
            {/* Header - Sticky position, title shifts with left panel, buttons shift with right panel only */}
            <div className="sticky top-0 z-40 flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 lg:p-4 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 min-h-[4rem] gap-2 lg:gap-4"
              style={{
                marginLeft: showLeftPanel ? '28rem' : '0',
                width: showLeftPanel
                  ? 'calc(100% - 28rem)'
                  : '100%',
                transition: 'margin-left 0.3s ease, width 0.3s ease',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                position: 'relative'
              }}>
              {/* Left section - Title shifts with left panel */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 w-full lg:w-auto overflow-hidden">
                <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2 min-w-0">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                  <span className="truncate">
                    Collection Graph: {collectionName || 'rag'} {graphStats && graphStats.nodeCount !== undefined ? graphStats.nodeCount : 0} nodes, {graphStats && graphStats.linkCount !== undefined ? graphStats.linkCount : 0} links
                  </span>
                  <span className="text-xs text-green-300 bg-green-900 px-2 py-1 rounded flex-shrink-0">
                    {graphStats && graphStats.status ? graphStats.status : 'WORKING'}
                  </span>
                  <span className="text-xs text-blue-300 bg-blue-900 px-2 py-1 rounded flex-shrink-0">
                    {graphStats && graphStats.is3D !== undefined ? (graphStats.is3D ? '3D' : '2D') : '2D'}
                  </span>
                  <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300 text-xs flex-shrink-0">
                    <Zap className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">React Bits</span>
                  </Badge>
                </CardTitle>
                
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {selectedNode && (
                    <Badge variant="secondary" className="bg-green-900/20 text-green-300 text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Node Selected</span>
                    </Badge>
                  )}

                  {isPreviewMode && (
                    <Badge variant="outline" className="bg-yellow-900/20 border-yellow-500 text-yellow-300 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Preview Active</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Right section - Buttons shift left when right panel opens, stay fixed when left panel opens */}
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end flex-shrink-0 min-w-0"
                style={{
                  marginRight: showRightPanel ? '28rem' : '0',
                  transition: 'margin-right 0.3s ease',
                  maxWidth: showRightPanel ? 'calc(100% - 28rem)' : '100%',
                  boxSizing: 'border-box'
                }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeftPanel(!showLeftPanel)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0 whitespace-nowrap"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  <span className="hidden md:inline">Controls</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0 whitespace-nowrap"
                  title="Toggle Node Information Panel"
                >
                  <Target className="h-3 w-3 mr-1" />
                  <span className="hidden md:inline">Node Info</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`${isPreviewMode ? 'bg-yellow-700 border-yellow-500 text-yellow-300' : 'bg-gray-700 border-gray-600 text-white'} hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0 whitespace-nowrap`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  <span className="hidden md:inline">Preview</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowParticles(!showParticles)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0 whitespace-nowrap"
                >
                  {showParticles ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span className="hidden lg:inline ml-1">Particles</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMagnetLines(!showMagnetLines)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0 whitespace-nowrap"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  <span className="hidden lg:inline">Magnet Lines</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0 whitespace-nowrap"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="hidden lg:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                </Button>
              </div>
            </div>

            {/* Graph View - Always visible, no tabs */}
            <div className="flex-1 m-0 p-0 overflow-hidden">
              <div className={`relative w-full h-full transition-all duration-300 ${
                showLeftPanel ? 'ml-[28rem]' : ''
              }`}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSimilarityDemo;
