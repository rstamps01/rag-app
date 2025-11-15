import React, { useState, useRef, useEffect } from 'react';
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
}

const EnhancedSimilarityDemo: React.FC<EnhancedSimilarityDemoProps> = ({
  children,
  selectedNode,
  similarityData = [],
  onNodeSelect,
  onSettingsChange,
  className = ''
}) => {
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [showMagnetLines, setShowMagnetLines] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('graph');
  const [isPinned, setIsPinned] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [isRightPanelPinned, setIsRightPanelPinned] = useState(false);
  const [similarityNodes, setSimilarityNodes] = useState<any[]>([]);
  const [visualizationSettings, setVisualizationSettings] = useState({
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
    similarityThreshold: 0.7,
    
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
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewSettings, setPreviewSettings] = useState<any>(null);

  // Similarity settings state
  const [similaritySettings, setSimilaritySettings] = useState({
    similarityMode: 'semantic',
    similarityThreshold: 0.7,
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
    setVisualizationSettings(prev => ({ ...prev, ...settings }));
    
    // Apply changes immediately if live preview is enabled
    if (livePreview) {
      // Notify parent component with visualization settings
      if (onSettingsChange) {
        onSettingsChange({ ...similaritySettings, ...settings });
      }
    }
  };

  const handleApplyVisualizationChanges = () => {
    // Apply visualization settings to the graph
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

  // Generate similarity nodes when a node is selected
  useEffect(() => {
    if (selectedNode) {
      // Generate mock similarity nodes for demonstration
      const mockSimilarityNodes = Array.from({ length: 5 }, (_, i) => ({
        id: `similar_${i}`,
        label: `Similar Node ${i + 1}`,
        similarity: 0.9 - (i * 0.1),
        distance: 10 + (i * 5),
        type: 'similarity'
      }));
      setSimilarityNodes(mockSimilarityNodes);
    } else {
      setSimilarityNodes([]);
    }
  }, [selectedNode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle clicks outside panels to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leftPanelRef.current && !leftPanelRef.current.contains(event.target as Node)) {
        setShowLeftPanel(false);
      }
      if (rightPanelRef.current && !rightPanelRef.current.contains(event.target as Node)) {
        setShowRightPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          className={`fixed right-0 top-0 h-full w-[28rem] bg-gray-800 border-l border-gray-700 transform panel-transition z-30 ${
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
        <div className={`flex-1 transition-all duration-300 ${
          showLeftPanel ? 'ml-[28rem]' : ''
        } ${showRightPanel ? 'mr-[28rem]' : ''}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 lg:p-4 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 min-h-[4rem] gap-2 lg:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 w-full lg:w-auto">
                <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2 min-w-0">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                  <span className="truncate">
                    Enhanced Similarity Visualization
                  </span>
                </CardTitle>
                
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300 text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">React Bits</span>
                  </Badge>
                  
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

              <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end w-full lg:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeftPanel(!showLeftPanel)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  <span className="hidden md:inline">Controls</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8"
                  title="Toggle Node Information Panel"
                >
                  <Target className="h-3 w-3 mr-1" />
                  <span className="hidden md:inline">Node Info</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`${isPreviewMode ? 'bg-yellow-700 border-yellow-500 text-yellow-300' : 'bg-gray-700 border-gray-600 text-white'} hover:bg-gray-600 text-xs px-2 py-1 h-8`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  <span className="hidden md:inline">Preview</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowParticles(!showParticles)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8"
                >
                  {showParticles ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span className="hidden lg:inline ml-1">Particles</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMagnetLines(!showMagnetLines)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  <span className="hidden lg:inline">Magnet Lines</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="hidden lg:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                </Button>
              </div>
            </div>

            {/* Tab Navigation */}
            <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-b border-gray-700">
              <TabsTrigger value="graph" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Graph View
              </TabsTrigger>
              <TabsTrigger value="controls" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Controls
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Node Info
              </TabsTrigger>
            </TabsList>

            {/* Graph Tab */}
            <TabsContent value="graph" className="flex-1 m-0 p-0 overflow-hidden">
              <div className="relative w-full h-full">
                {children}
              </div>
            </TabsContent>

            {/* Controls Tab */}
            <TabsContent value="controls" className="flex-1 p-4 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Controls Header with Pin Button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-white" />
                    <span className="text-lg font-semibold text-white">Visualization Controls</span>
                    {isPinned && (
                      <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTogglePin}
                      className={`${isPinned ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-700 text-gray-300 border-gray-600'} hover:bg-blue-700`}
                      title={isPinned ? 'Unpin and disable live preview' : 'Pin and enable live preview'}
                    >
                      {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLeftPanel(true)}
                      className="bg-gray-700 text-gray-300 hover:bg-gray-600"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Controls Content */}
                <div className="flex-1 overflow-hidden">
                  <EnhancedVisualizationControls
                    settings={visualizationSettings}
                    onSettingsChange={handleVisualizationSettingsChange}
                    onApplyChanges={handleApplyVisualizationChanges}
                    isPinned={isPinned}
                    onTogglePin={handleTogglePin}
                    onClose={() => setShowLeftPanel(false)}
                    livePreview={livePreview}
                    onToggleLivePreview={handleToggleLivePreview}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Node Info Tab */}
            <TabsContent value="metrics" className="flex-1 p-4 overflow-hidden">
              <div className="h-full">
                <NodeInformationPanel
                  selectedNode={selectedNode}
                  similarityNodes={similarityNodes}
                  onClose={() => setShowRightPanel(false)}
                  isPinned={isRightPanelPinned}
                  onTogglePin={handleToggleRightPanelPin}
                  onNodeSelect={handleNodeSelect}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSimilarityDemo;
