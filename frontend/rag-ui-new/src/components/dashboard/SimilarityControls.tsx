import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import ElasticSlider from '../ElasticSlider';
import RotatingText from '../RotatingText';
import ElectricBorder from '../ElectricBorder';
import { Settings, BarChart3, Zap, Target, Layers } from 'lucide-react';

interface SimilarityControlsProps {
  similarityMode: string;
  onSimilarityModeChange: (mode: string) => void;
  similarityThreshold: number;
  onThresholdChange: (threshold: number) => void;
  minDistance: number;
  onMinDistanceChange: (distance: number) => void;
  maxDistance: number;
  onMaxDistanceChange: (distance: number) => void;
  connectionLevels: number;
  onConnectionLevelsChange: (levels: number) => void;
  nodeSize: number;
  onNodeSizeChange: (size: number) => void;
  linkWidth: number;
  onLinkWidthChange: (width: number) => void;
  movementSpeed: number;
  onMovementSpeedChange: (speed: number) => void;
}

const SimilarityControls: React.FC<SimilarityControlsProps> = ({
  similarityMode,
  onSimilarityModeChange,
  similarityThreshold,
  onThresholdChange,
  minDistance,
  onMinDistanceChange,
  maxDistance,
  onMaxDistanceChange,
  connectionLevels,
  onConnectionLevelsChange,
  nodeSize,
  onNodeSizeChange,
  linkWidth,
  onLinkWidthChange,
  movementSpeed,
  onMovementSpeedChange
}) => {
  const [activeTab, setActiveTab] = useState('similarity');

  const similarityModes = [
    { value: 'semantic', label: 'Semantic (Multi-factor)', description: 'Combines multiple factors with weighted importance' },
    { value: 'department', label: 'Department', description: 'Organizational department similarity' },
    { value: 'file_type', label: 'File Type', description: 'File extension/type similarity' },
    { value: 'document', label: 'Document', description: 'Same document chunk similarity' },
    { value: 'content_length', label: 'Content Length', description: 'Text content length similarity' },
    { value: 'chunk_index', label: 'Chunk Index', description: 'Sequential chunk proximity similarity' }
  ];

  const getSimilarityModeInfo = (mode: string) => {
    return similarityModes.find(m => m.value === mode) || similarityModes[0];
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-4xl mx-auto bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Similarity Visualization Controls
            </CardTitle>
            <ElectricBorder>
              <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300">
                <Zap className="h-3 w-3 mr-1" />
                Enhanced UI
              </Badge>
            </ElectricBorder>
          </div>
          
          {/* Dynamic Similarity Mode Display */}
          <div className="mt-4">
            <RotatingText
              text={`Active Mode: ${getSimilarityModeInfo(similarityMode).label}`}
              className="text-lg font-semibold text-blue-400"
              tag="h3"
              duration={2}
              delay={50}
            />
            <p className="text-sm text-gray-400 mt-1">
              {getSimilarityModeInfo(similarityMode).description}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700">
              <TabsTrigger value="similarity" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Similarity
              </TabsTrigger>
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="interaction" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Interaction
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Similarity Tab */}
            <TabsContent value="similarity" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Similarity Mode Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Similarity Mode</label>
                  <Select value={similarityMode} onValueChange={onSimilarityModeChange}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {similarityModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value} className="text-white hover:bg-gray-600">
                          <div>
                            <div className="font-medium">{mode.label}</div>
                            <div className="text-xs text-gray-400">{mode.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Similarity Threshold */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Similarity Threshold</label>
                    <Badge variant="secondary" className="bg-blue-900/20 text-blue-300">
                      {similarityThreshold.toFixed(2)}
                    </Badge>
                  </div>
                  <ElasticSlider
                    value={[similarityThreshold]}
                    onValueChange={(value) => onThresholdChange(value[0])}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0.0 (No similarity)</span>
                    <span>1.0 (Perfect match)</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Visual Tab */}
            <TabsContent value="visual" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Node Size */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Node Size</label>
                    <Badge variant="secondary" className="bg-green-900/20 text-green-300">
                      {nodeSize}px
                    </Badge>
                  </div>
                  <ElasticSlider
                    value={[nodeSize]}
                    onValueChange={(value) => onNodeSizeChange(value[0])}
                    min={1}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* Link Width */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Link Width</label>
                    <Badge variant="secondary" className="bg-purple-900/20 text-purple-300">
                      {linkWidth}px
                    </Badge>
                  </div>
                  <ElasticSlider
                    value={[linkWidth]}
                    onValueChange={(value) => onLinkWidthChange(value[0])}
                    min={0.5}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Min Distance */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Min Distance</label>
                    <Badge variant="secondary" className="bg-orange-900/20 text-orange-300">
                      {minDistance}px
                    </Badge>
                  </div>
                  <ElasticSlider
                    value={[minDistance]}
                    onValueChange={(value) => onMinDistanceChange(value[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Max Distance */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Max Distance</label>
                    <Badge variant="secondary" className="bg-red-900/20 text-red-300">
                      {maxDistance}px
                    </Badge>
                  </div>
                  <ElasticSlider
                    value={[maxDistance]}
                    onValueChange={(value) => onMaxDistanceChange(value[0])}
                    min={100}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Interaction Tab */}
            <TabsContent value="interaction" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Movement Speed */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Movement Speed</label>
                    <Badge variant="secondary" className="bg-yellow-900/20 text-yellow-300">
                      {movementSpeed}x
                    </Badge>
                  </div>
                  <ElasticSlider
                    value={[movementSpeed]}
                    onValueChange={(value) => onMovementSpeedChange(value[0])}
                    min={0.5}
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                {/* Connection Levels */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Connection Levels</label>
                    <Badge variant="secondary" className="bg-cyan-900/20 text-cyan-300">
                      {connectionLevels}
                    </Badge>
                  </div>
                  <ElasticSlider
                    value={[connectionLevels]}
                    onValueChange={(value) => onConnectionLevelsChange(value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Direct only</span>
                    <span>5 levels deep</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6 mt-6">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Settings className="h-12 w-12 mx-auto mb-2" />
                  <p>Advanced similarity settings coming soon...</p>
                </div>
                <Badge variant="outline" className="bg-gray-700 text-gray-300">
                  Future Enhancement
                </Badge>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default SimilarityControls;
