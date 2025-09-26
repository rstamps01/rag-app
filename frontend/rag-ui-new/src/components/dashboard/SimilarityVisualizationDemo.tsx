import React, { useState, useEffect } from 'react';
import EnhancedGraphContainer from './EnhancedGraphContainer';
import QdrantGraphWorking from './QdrantGraphWorking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RotatingText from '../RotatingText';
import ElectricBorder from '../ElectricBorder';
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
    console.log('Node selected:', node);
  };

  const handleSettingsChange = (settings: any) => {
    console.log('Settings changed:', settings);
    // Here you would typically update your graph component with new settings
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              <RotatingText
                text="Enhanced Similarity Visualization Demo"
                className="text-2xl"
                tag="span"
                duration={5}
              />
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <ElectricBorder>
                <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300">
                  <Zap className="h-3 w-3 mr-1" />
                  React Bits + shadcn/ui
                </Badge>
              </ElectricBorder>
              
              <Badge variant="secondary" className="bg-green-900/20 text-green-300">
                <Target className="h-3 w-3 mr-1" />
                Interactive Demo
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setDemoMode(demoMode === 'static' ? 'interactive' : 'static')}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <Settings className="h-4 w-4 mr-2" />
              {demoMode === 'static' ? 'Interactive' : 'Static'} Mode
            </Button>
            
            <Button
              variant="outline"
              onClick={toggleDemo}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'} Demo
            </Button>
            
            <Button
              variant="outline"
              onClick={resetDemo}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <EnhancedGraphContainer
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
            />
          </div>
        </EnhancedGraphContainer>
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
