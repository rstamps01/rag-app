import * as React from 'react';
import { useState, useEffect } from 'react';
import EnhancedSimilarityDemo from './EnhancedSimilarityDemo';
import QdrantGraphWorking from './QdrantGraphWorking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import RotatingText from '../RotatingText';
// import ElectricBorder from '../ElectricBorder';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  BarChart3, 
  Target,
  Settings,
  Layers
} from 'lucide-react';

const SimilarityVisualizationDemo: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [similarityData, setSimilarityData] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoMode, setDemoMode] = useState<'static' | 'interactive'>('static');
  const [similarityMode, setSimilarityMode] = useState('semantic');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [similarityStats, setSimilarityStats] = useState(null);
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

  // Mock similarity data for demo
  useEffect(() => {
    if (selectedNode) {
      // Generate mock similarity connections
      const mockConnections = Array.from({ length: 8 }, (_, i) => ({
        id: `connection-${i}`,
        source: selectedNode.id,
        target: `node-${i}`,
        similarity: Math.random() * 0.5 + 0.3, // 0.3-0.8
        distance: Math.random() * 100 + 50, // 50-150
        type: 'similarity'
      }));
      setSimilarityData(mockConnections);
    }
  }, [selectedNode]);

  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
    // console.log('Node selected:', node);
  };

  const handleSettingsChange = (settings: any) => {
    console.log('Settings changed:', settings);
    
    // Update similarity settings
    if (settings.similarityMode) {
      setSimilarityMode(settings.similarityMode);
    }
    if (settings.similarityThreshold !== undefined) {
      setSimilarityThreshold(settings.similarityThreshold);
    }
    
    // Update visualization settings
    setVisualizationSettings(prev => ({ ...prev, ...settings }));
  };

  const handleSimilarityChange = (similarityInfo: any) => {
    setSimilarityStats(similarityInfo.stats);
    // console.log('Similarity changed:', similarityInfo);
  };

  const toggleDemo = () => {
    setIsPlaying(!isPlaying);
  };

  const resetDemo = () => {
    setSelectedNode(null);
    setSimilarityData([]);
    setIsPlaying(false);
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
            <CardTitle className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3 min-w-0">
              <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 flex-shrink-0" />
              <span className="truncate">
                Enhanced Similarity Visualization Demo
              </span>
            </CardTitle>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                React Bits + shadcn/ui
              </Badge>
              
              <Badge variant="secondary" className="bg-green-900/20 text-green-300 text-xs">
                <Target className="h-3 w-3 mr-1" />
                Interactive Demo
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setDemoMode(demoMode === 'static' ? 'interactive' : 'static')}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-sm"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">{demoMode === 'static' ? 'Interactive' : 'Static'} Mode</span>
              <span className="sm:hidden">{demoMode === 'static' ? 'Interactive' : 'Static'}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={toggleDemo}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-sm"
              size="sm"
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-1 lg:mr-2" /> : <Play className="h-4 w-4 mr-1 lg:mr-2" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'} Demo</span>
              <span className="sm:hidden">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={resetDemo}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-sm"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <EnhancedSimilarityDemo
          selectedNode={selectedNode}
          similarityData={similarityData}
          onNodeSelect={handleNodeSelect}
          onSettingsChange={handleSettingsChange}
          className="h-full"
        >
          {/* This is where your actual graph component would go */}
          <div className="w-full h-full bg-gray-800/50 backdrop-blur-sm">
            <QdrantGraphWorking
              collectionName="rag"
              qdrantBaseUrl="http://localhost:6333"
              height="100%"
              fullWidth={true}
              similarityMode={similarityMode}
              similarityThreshold={similarityThreshold}
              onNodeSelect={handleNodeSelect}
              onSimilarityChange={handleSimilarityChange}
              // Pass visualization settings
              showTextLabels={visualizationSettings.showTextLabels}
              labelMode={visualizationSettings.labelMode}
              colorScheme={visualizationSettings.colorScheme}
              nodeSizeMode={visualizationSettings.nodeSizeMode}
              nodeSize={visualizationSettings.nodeSize}
              nodeShape={visualizationSettings.nodeShape}
              maintainInterconnectivity={visualizationSettings.maintainInterconnectivity}
              showAnchorPoints={visualizationSettings.showAnchorPoints}
              showInterconnectivity={visualizationSettings.showInterconnectivity}
              highlightSelected={visualizationSettings.highlightSelected}
              useVariableDistance={visualizationSettings.useVariableDistance}
              minDistance={visualizationSettings.minDistance}
              maxDistance={visualizationSettings.maxDistance}
              showTooltips={visualizationSettings.showTooltips}
              enableClustering={visualizationSettings.enableClustering}
              enableAnimations={visualizationSettings.enableAnimations}
              enableFiltering={visualizationSettings.enableFiltering}
              multiSelect={visualizationSettings.multiSelect}
              enableHubSpoke={visualizationSettings.enableHubSpoke}
              spokesPerHub={visualizationSettings.spokesPerHub}
              maxHubs={visualizationSettings.maxHubs}
              is3D={visualizationSettings.is3D}
              movementSpeed={visualizationSettings.movementSpeed}
              linkWidth={visualizationSettings.linkWidth}
            />
          </div>
        </EnhancedSimilarityDemo>
      </div>

      {/* Demo Instructions */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">Demo Instructions:</span>
                </div>
                <div className="text-sm text-gray-300">
                  Click on nodes to see similarity metrics • Use controls to adjust visualization • Toggle effects with buttons
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Status: {isPlaying ? 'Playing' : 'Paused'}</span>
                <span>•</span>
                <span>Mode: {demoMode}</span>
                <span>•</span>
                <span>Selected: {selectedNode ? selectedNode.id : 'None'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimilarityVisualizationDemo;
