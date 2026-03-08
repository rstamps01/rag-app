import * as React from 'react';
import { useState, useEffect } from 'react';
import { QDRANT_URL } from '../../config';
import EnhancedSimilarityDemo from './EnhancedSimilarityDemo';
import QdrantGraphWorking from './QdrantGraphWorking';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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

interface SimilarityVisualizationDemoProps {
  onPanelStateChange?: (state: { leftPanel: boolean; rightPanel: boolean }) => void;
  onGraphStatsChange?: (stats: { collectionName: string; nodeCount: number; linkCount: number; is3D: boolean; status: string }) => void;
  onResetRequest?: () => void;
  on3DToggleRequest?: () => void;
  is3D?: boolean;
}

const SimilarityVisualizationDemo: React.FC<SimilarityVisualizationDemoProps> = ({ 
  onPanelStateChange,
  onGraphStatsChange,
  onResetRequest,
  on3DToggleRequest,
  is3D: parentIs3D
}) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [similarityData, setSimilarityData] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoMode, setDemoMode] = useState<'static' | 'interactive'>('static');
  const [similarityMode, setSimilarityMode] = useState('semantic');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.45);
  const [similarityStats, setSimilarityStats] = useState(null);
  const [demoInterval, setDemoInterval] = useState<NodeJS.Timeout | null>(null);
  const [panelState, setPanelState] = useState({ leftPanel: false, rightPanel: false });
  const [graphStats, setGraphStats] = useState<{ collectionName: string; nodeCount: number; linkCount: number; is3D: boolean; status: string } | null>(null);
  
  // Notify parent of panel state changes
  useEffect(() => {
    if (onPanelStateChange) {
      onPanelStateChange(panelState);
    }
  }, [panelState, onPanelStateChange]);
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

  // Store original graph type before switching to static
  const [originalGraphType, setOriginalGraphType] = useState('force-directed');
  
  // Listen for reset event from parent
  useEffect(() => {
    const handleReset = (event: CustomEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Reset event received', event.detail);
      }
      setSelectedNode(null);
      setSimilarityData([]);
      setIsPlaying(false);
      if (demoInterval) {
        clearInterval(demoInterval);
        setDemoInterval(null);
      }
      // Reset visualization settings to defaults
      setVisualizationSettings({
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
      });
      // Trigger graph reset if requested
      if (event.detail?.resetGraph) {
        window.dispatchEvent(new CustomEvent('resetGraphVisualization'));
      }
    };
    window.addEventListener('resetDemo', handleReset as EventListener);
    return () => window.removeEventListener('resetDemo', handleReset as EventListener);
  }, [demoInterval]);
  
  // Demo mode effect: Control interactivity based on mode
  useEffect(() => {
    if (demoMode === 'static') {
      // Static mode: Disable animations and interactions, use fixed layout
      setVisualizationSettings(prev => {
        // Save current graph type if not already grid
        if (prev.graphType !== 'grid') {
          setOriginalGraphType(prev.graphType);
        }
        return {
          ...prev,
          enableAnimations: false,
          enableFiltering: false,
          multiSelect: false,
          graphType: 'grid' // Use grid layout for static mode
        };
      });
    } else {
      // Interactive mode: Enable animations and interactions, restore original graph type
      setVisualizationSettings(prev => ({
        ...prev,
        enableAnimations: true,
        enableFiltering: true,
        multiSelect: true,
        graphType: originalGraphType // Restore original graph type
      }));
    }
  }, [demoMode, originalGraphType]);

  // Store available nodes for demo cycling
  const [availableNodes, setAvailableNodes] = useState<any[]>([]);
  const [availableLinks, setAvailableLinks] = useState<any[]>([]);
  
  // Play/Pause demo effect: Auto-cycle through nodes when playing
  useEffect(() => {
    if (isPlaying && demoMode === 'interactive' && availableNodes.length > 0) {
      let currentNodeIndex = 0;
      
      // Create interval to cycle through actual nodes
      const interval = setInterval(() => {
        if (availableNodes.length > 0) {
          const node = availableNodes[currentNodeIndex];
          setSelectedNode(node);
          currentNodeIndex = (currentNodeIndex + 1) % availableNodes.length;
        }
      }, 2000); // Change node every 2 seconds
      
      setDemoInterval(interval);
      return () => {
        clearInterval(interval);
        setDemoInterval(null);
      };
    } else {
      // Clear interval when paused or in static mode
      if (demoInterval) {
        clearInterval(demoInterval);
        setDemoInterval(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, demoMode, availableNodes.length]);

  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
    // console.log('Node selected:', node);
  };

  const handleSettingsChange = (settings: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Settings changed:', settings);
    }
    
    // Update similarity settings
    if (settings.similarityMode) {
      setSimilarityMode(settings.similarityMode);
    }
    if (settings.similarityThreshold !== undefined) {
      setSimilarityThreshold(settings.similarityThreshold);
    }
    
    // Update visualization settings
    setVisualizationSettings(prev => {
      const updated = { ...prev, ...settings };
      if (settings.graphType) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Updating graphType to: ${settings.graphType}`);
        }
      }
      return updated;
    });
  };

  const handleSimilarityChange = (similarityInfo: any) => {
    setSimilarityStats(similarityInfo.stats);
    // console.log('Similarity changed:', similarityInfo);
  };

  const toggleDemo = () => {
    if (availableNodes.length === 0) {
      console.warn('⚠️ No nodes available for demo. Please wait for graph to load.');
      return;
    }
    
    setIsPlaying(prev => {
      const newState = !prev;
      if (!newState && demoInterval) {
        // Clear interval when pausing
        clearInterval(demoInterval);
        setDemoInterval(null);
      }
      return newState;
    });
  };

  const resetDemo = () => {
    setSelectedNode(null);
    setSimilarityData([]);
    setIsPlaying(false);
    if (demoInterval) {
      clearInterval(demoInterval);
      setDemoInterval(null);
    }
    // Notify parent of reset request
    if (onResetRequest) {
      onResetRequest();
    }
  };
  
  // Listen for 3D toggle event from parent (single listener to prevent duplicates)
  useEffect(() => {
    const handleToggle3D = (event: CustomEvent) => {
      const { is3D: newIs3D } = event.detail;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 3D toggle event received:', newIs3D);
      }
      setVisualizationSettings(prev => {
        // Only update if different to prevent unnecessary re-renders
        if (prev.is3D !== newIs3D) {
          const updated = { ...prev, is3D: newIs3D };
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Updated visualization settings with is3D:', updated.is3D);
          }
          return updated;
        }
        return prev;
      });
    };
    window.addEventListener('toggle3D', handleToggle3D as EventListener);
    return () => window.removeEventListener('toggle3D', handleToggle3D as EventListener);
  }, []);
  
  // Handle 3D toggle from parent prop (only if different from current state)
  useEffect(() => {
    if (parentIs3D !== undefined) {
      setVisualizationSettings(prev => {
        // Only update if different to prevent feedback loop
        if (prev.is3D !== parentIs3D) {
          return { ...prev, is3D: parentIs3D };
        }
        return prev;
      });
    }
  }, [parentIs3D]);

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 transition-all duration-300 relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left section - Title stays left-justified, not affected by left panel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1"
            style={{
              marginLeft: panelState.leftPanel ? '28rem' : '0',
              transition: 'margin-left 0.3s ease'
            }}>
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

          {/* Right section - Buttons shift left when right panel opens, stay fixed when left panel opens */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0"
            style={{
              marginRight: panelState.rightPanel ? '28rem' : '0',
              transition: 'margin-right 0.3s ease',
              maxWidth: panelState.rightPanel ? 'calc(100% - 28rem)' : '100%'
            }}>
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
          visualizationSettings={visualizationSettings}
          onPanelStateChange={setPanelState}
          collectionName="rag"
          graphStats={graphStats}
          graphNodes={availableNodes}
          graphLinks={availableLinks}
          similarityMode={similarityMode}
          similarityThreshold={similarityThreshold}
          minDistance={visualizationSettings.minDistance}
          maxDistance={visualizationSettings.maxDistance}
        >
          {/* This is where your actual graph component would go */}
          <div className="w-full h-full bg-gray-800/50 backdrop-blur-sm">
            <QdrantGraphWorking
              collectionName="rag"
              qdrantBaseUrl={QDRANT_URL}
              height="100%"
              fullWidth={true}
              similarityMode={similarityMode}
              similarityThreshold={similarityThreshold}
              onNodeSelect={handleNodeSelect}
              onSimilarityChange={handleSimilarityChange}
              // Pass visualization settings
              graphType={visualizationSettings.graphType}
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
              // Callbacks for slider changes
              onNodeSizeChange={(newSize) => {
                setVisualizationSettings(prev => ({ ...prev, nodeSize: newSize }));
              }}
              onLinkWidthChange={(newWidth) => {
                setVisualizationSettings(prev => ({ ...prev, linkWidth: newWidth }));
              }}
              onGraphDataLoaded={(data) => {
                const nodes = data?.nodes ?? (Array.isArray(data) ? data : []);
                const links = data?.links ?? [];
                setAvailableNodes(nodes);
                setAvailableLinks(links);
              }}
              onShowTextLabelsChange={(newValue) => {
                setVisualizationSettings(prev => ({ ...prev, showTextLabels: newValue }));
              }}
              onIs3DChange={(newValue) => {
                setVisualizationSettings(prev => ({ ...prev, is3D: newValue }));
                // Forward to parent for top header button state
                if (on3DToggleRequest && newValue !== parentIs3D) {
                  // Parent will handle the state update
                }
              }}
              onGraphStatsChange={(stats) => {
                setGraphStats(stats);
                // Forward to parent
                if (onGraphStatsChange) {
                  onGraphStatsChange(stats);
                }
              }}
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
