import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SimilarityControls from './SimilarityControls';
import SimilarityMetrics from './SimilarityMetrics';
import Particles from '../Particles';
import MagnetLines from '../MagnetLines';
import ElectricBorder from '../ElectricBorder';
import RotatingText from '../RotatingText';
import { 
  BarChart3, 
  Settings, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Zap, 
  Target,
  Layers,
  Activity
} from 'lucide-react';

interface EnhancedGraphContainerProps {
  children: React.ReactNode;
  selectedNode?: any;
  similarityData?: any[];
  onNodeSelect?: (node: any) => void;
  onSettingsChange?: (settings: any) => void;
  className?: string;
}

const EnhancedGraphContainer: React.FC<EnhancedGraphContainerProps> = ({
  children,
  selectedNode,
  similarityData = [],
  onNodeSelect,
  onSettingsChange,
  className = ''
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [showMagnetLines, setShowMagnetLines] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('graph');

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

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSettingsChange = (newSettings: any) => {
    setSimilaritySettings(prev => ({ ...prev, ...newSettings }));
    onSettingsChange?.(newSettings);
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
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
      <div ref={containerRef} className="relative z-20 h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <RotatingText
                  text="Enhanced Similarity Visualization"
                  className="text-xl"
                  tag="span"
                  duration={4}
                />
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <ElectricBorder>
                  <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300">
                    <Zap className="h-3 w-3 mr-1" />
                    React Bits
                  </Badge>
                </ElectricBorder>
                
                {selectedNode && (
                  <Badge variant="secondary" className="bg-green-900/20 text-green-300">
                    <Target className="h-3 w-3 mr-1" />
                    Node Selected
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
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
          <TabsContent value="graph" className="flex-1 m-0 p-0">
            <div className="relative w-full h-full">
              {children}
              
              {/* Graph Overlay Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowControls(!showControls)}
                  className="bg-gray-800/90 backdrop-blur-sm border-gray-600 text-white hover:bg-gray-700"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetrics(!showMetrics)}
                  className="bg-gray-800/90 backdrop-blur-sm border-gray-600 text-white hover:bg-gray-700"
                >
                  <Target className="h-4 w-4" />
                </Button>
              </div>

              {/* Floating Controls Panel */}
              {showControls && (
                <div className="absolute top-16 right-4 w-80 max-h-96 overflow-y-auto">
                  <SimilarityControls
                    {...similaritySettings}
                    onSimilarityModeChange={(mode) => handleSettingsChange({ similarityMode: mode })}
                    onThresholdChange={(threshold) => handleSettingsChange({ similarityThreshold: threshold })}
                    onMinDistanceChange={(distance) => handleSettingsChange({ minDistance: distance })}
                    onMaxDistanceChange={(distance) => handleSettingsChange({ maxDistance: distance })}
                    onConnectionLevelsChange={(levels) => handleSettingsChange({ connectionLevels: levels })}
                    onNodeSizeChange={(size) => handleSettingsChange({ nodeSize: size })}
                    onLinkWidthChange={(width) => handleSettingsChange({ linkWidth: width })}
                    onMovementSpeedChange={(speed) => handleSettingsChange({ movementSpeed: speed })}
                  />
                </div>
              )}

              {/* Floating Metrics Panel */}
              {showMetrics && selectedNode && (
                <div className="absolute bottom-4 right-4 w-80 max-h-96 overflow-y-auto">
                  <SimilarityMetrics
                    selectedNode={selectedNode}
                    similarityData={similarityData}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="flex-1 p-4">
            <SimilarityControls
              {...similaritySettings}
              onSimilarityModeChange={(mode) => handleSettingsChange({ similarityMode: mode })}
              onThresholdChange={(threshold) => handleSettingsChange({ similarityThreshold: threshold })}
              onMinDistanceChange={(distance) => handleSettingsChange({ minDistance: distance })}
              onMaxDistanceChange={(distance) => handleSettingsChange({ maxDistance: distance })}
              onConnectionLevelsChange={(levels) => handleSettingsChange({ connectionLevels: levels })}
              onNodeSizeChange={(size) => handleSettingsChange({ nodeSize: size })}
              onLinkWidthChange={(width) => handleSettingsChange({ linkWidth: width })}
              onMovementSpeedChange={(speed) => handleSettingsChange({ movementSpeed: speed })}
            />
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="flex-1 p-4">
            <SimilarityMetrics
              selectedNode={selectedNode}
              similarityData={similarityData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedGraphContainer;
