import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedSimilarityControls from './EnhancedSimilarityControls';
import SimilarityContextSheet from './SimilarityContextSheet';
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
  RefreshCw
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
          className={`fixed left-0 top-0 h-full w-96 bg-gray-800 border-r border-gray-700 transform panel-transition z-30 ${
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
            <div className="flex-1 overflow-y-auto p-4 panel-scrollbar">
              <EnhancedSimilarityControls
                currentSimilarityThreshold={currentSettings.similarityThreshold || 0.7}
                currentNodeDistance={currentSettings.minDistance || 20}
                currentLinkWidth={currentSettings.linkWidth || 1}
                currentNodeSize={currentSettings.nodeSize || 3}
                currentSimilarityMode={currentSettings.similarityMode || 'semantic'}
                currentConnectionLevels={currentSettings.connectionLevels || 1}
                currentMovementSpeed={currentSettings.movementSpeed || 2.0}
                similarityModes={similarityModes}
                onSimilarityModeChange={(mode) => handleSettingsChange({ similarityMode: mode })}
                onSimilarityThresholdChange={(threshold) => handleSettingsChange({ similarityThreshold: threshold })}
                onNodeDistanceChange={(distance) => handleSettingsChange({ minDistance: distance })}
                onLinkWidthChange={(width) => handleSettingsChange({ linkWidth: width })}
                onNodeSizeChange={(size) => handleSettingsChange({ nodeSize: size })}
                onConnectionLevelsChange={(levels) => handleSettingsChange({ connectionLevels: levels })}
                onMovementSpeedChange={(speed) => handleSettingsChange({ movementSpeed: speed })}
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

        {/* Right Slide-out Panel - Metrics */}
        <div
          ref={rightPanelRef}
          className={`fixed right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 transform panel-transition z-30 ${
            showRightPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-900">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Similarity Metrics
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRightPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 panel-scrollbar">
              <SimilarityContextSheet
                selectedNode={selectedNode}
                similarityData={similarityData}
                onNodeSelect={onNodeSelect}
              >
                <Button variant="outline" className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  <Target className="h-4 w-4 mr-2" />
                  Open Context Panel
                </Button>
              </SimilarityContextSheet>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${
          showLeftPanel ? 'ml-96' : ''
        } ${showRightPanel ? 'mr-80' : ''}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
              <div className="flex items-center gap-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-xl">
                    Enhanced Similarity Visualization
                  </span>
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300">
                    <Zap className="h-3 w-3 mr-1" />
                    React Bits
                  </Badge>
                  
                  {selectedNode && (
                    <Badge variant="secondary" className="bg-green-900/20 text-green-300">
                      <Target className="h-3 w-3 mr-1" />
                      Node Selected
                    </Badge>
                  )}

                  {isPreviewMode && (
                    <Badge variant="outline" className="bg-yellow-900/20 border-yellow-500 text-yellow-300">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview Active
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeftPanel(!showLeftPanel)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Controls
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Metrics
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`${isPreviewMode ? 'bg-yellow-700 border-yellow-500 text-yellow-300' : 'bg-gray-700 border-gray-600 text-white'} hover:bg-gray-600`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowParticles(!showParticles)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  {showParticles ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Particles
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMagnetLines(!showMagnetLines)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <Layers className="h-4 w-4" />
                  Magnet Lines
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <Activity className="h-4 w-4" />
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
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
                Metrics
              </TabsTrigger>
            </TabsList>

            {/* Graph Tab */}
            <TabsContent value="graph" className="flex-1 m-0 p-0 overflow-hidden">
              <div className="relative w-full h-full">
                {children}
              </div>
            </TabsContent>

            {/* Controls Tab */}
            <TabsContent value="controls" className="flex-1 p-4 overflow-y-auto panel-scrollbar">
              <EnhancedSimilarityControls
                currentSimilarityThreshold={currentSettings.similarityThreshold || 0.7}
                currentNodeDistance={currentSettings.minDistance || 20}
                currentLinkWidth={currentSettings.linkWidth || 1}
                currentNodeSize={currentSettings.nodeSize || 3}
                currentSimilarityMode={currentSettings.similarityMode || 'semantic'}
                currentConnectionLevels={currentSettings.connectionLevels || 1}
                currentMovementSpeed={currentSettings.movementSpeed || 2.0}
                similarityModes={similarityModes}
                onSimilarityModeChange={(mode) => handleSettingsChange({ similarityMode: mode })}
                onSimilarityThresholdChange={(threshold) => handleSettingsChange({ similarityThreshold: threshold })}
                onNodeDistanceChange={(distance) => handleSettingsChange({ minDistance: distance })}
                onLinkWidthChange={(width) => handleSettingsChange({ linkWidth: width })}
                onNodeSizeChange={(size) => handleSettingsChange({ nodeSize: size })}
                onConnectionLevelsChange={(levels) => handleSettingsChange({ connectionLevels: levels })}
                onMovementSpeedChange={(speed) => handleSettingsChange({ movementSpeed: speed })}
              />
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="flex-1 p-4 overflow-y-auto panel-scrollbar">
              <SimilarityContextSheet
                selectedNode={selectedNode}
                similarityData={similarityData}
                onNodeSelect={onNodeSelect}
              >
                <div className="space-y-4">
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Quick Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">
                        Click the button below to open the detailed context panel with comprehensive metrics and node information.
                      </p>
                      <Button variant="outline" className="w-full bg-gray-600 border-gray-500 text-white hover:bg-gray-500">
                        <Target className="h-4 w-4 mr-2" />
                        Open Detailed Metrics
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </SimilarityContextSheet>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSimilarityDemo;
