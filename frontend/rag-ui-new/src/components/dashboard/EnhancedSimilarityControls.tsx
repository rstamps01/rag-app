import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Settings, SlidersHorizontal, GitGraph, Palette, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { validateSimilarityData } from '../../utils/similarityUtils';

interface EnhancedSimilarityControlsProps {
  onSimilarityThresholdChange: (value: number) => void;
  onNodeDistanceChange: (value: number) => void;
  onLinkWidthChange: (value: number) => void;
  onNodeSizeChange: (value: number) => void;
  onSimilarityModeChange: (mode: string) => void;
  onConnectionLevelsChange: (levels: number) => void;
  onMovementSpeedChange: (speed: number) => void;
  currentSimilarityThreshold: number;
  currentNodeDistance: number;
  currentLinkWidth: number;
  currentNodeSize: number;
  currentSimilarityMode: string;
  currentConnectionLevels: number;
  currentMovementSpeed: number;
  similarityModes: { value: string; label: string; description: string }[];
  graphNodes?: any[]; // Optional: for data validation
}

const EnhancedSimilarityControls: React.FC<EnhancedSimilarityControlsProps> = ({
  onSimilarityThresholdChange,
  onNodeDistanceChange,
  onLinkWidthChange,
  onNodeSizeChange,
  onSimilarityModeChange,
  onConnectionLevelsChange,
  onMovementSpeedChange,
  currentSimilarityThreshold,
  currentNodeDistance,
  currentLinkWidth,
  currentNodeSize,
  currentSimilarityMode,
  currentConnectionLevels,
  currentMovementSpeed,
  similarityModes,
  graphNodes = [],
}) => {
  const [activeTab, setActiveTab] = React.useState('general');
  
  // Validate data for current similarity mode
  const validation = React.useMemo(() => {
    if (graphNodes.length === 0) return null;
    return validateSimilarityData(graphNodes, currentSimilarityMode);
  }, [graphNodes, currentSimilarityMode]);

  return (
    <Card className="w-full bg-gray-800 text-white border-gray-700 shadow-lg">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-xl font-bold flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Similarity Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-700 mb-4">
            <TabsTrigger value="general" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
              <SlidersHorizontal className="h-4 w-4 mr-1" /> General
            </TabsTrigger>
            <TabsTrigger value="layout" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
              <GitGraph className="h-4 w-4 mr-1" /> Layout
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
              <Palette className="h-4 w-4 mr-1" /> Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="similarity-mode" className="text-sm font-medium text-gray-300">
                  Similarity Mode
                </Label>
                <Select onValueChange={onSimilarityModeChange} value={currentSimilarityMode}>
                  <SelectTrigger id="similarity-mode" className="w-full bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a similarity mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    {similarityModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value} className="hover:bg-gray-600">
                        <div>
                          <div className="font-medium">{mode.label}</div>
                          <div className="text-xs text-gray-400">{mode.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Data Validation Feedback */}
                {validation && (
                  <div className="mt-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600">
                    <div className="flex items-start gap-2 mb-2">
                      {validation.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-300 mb-1">
                          Data Availability
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className={`text-xs ${validation.hasEmbeddings > 0 ? 'bg-green-900/20 border-green-500 text-green-300' : 'bg-gray-900/20 border-gray-500 text-gray-400'}`}>
                            Embeddings: {validation.hasEmbeddings}/{validation.totalNodes}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${validation.hasContent > 0 ? 'bg-green-900/20 border-green-500 text-green-300' : 'bg-gray-900/20 border-gray-500 text-gray-400'}`}>
                            Content: {validation.hasContent}/{validation.totalNodes}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${validation.hasTimestamps > 0 ? 'bg-green-900/20 border-green-500 text-green-300' : 'bg-gray-900/20 border-gray-500 text-gray-400'}`}>
                            Timestamps: {validation.hasTimestamps}/{validation.totalNodes}
                          </Badge>
                        </div>
                        {validation.warnings.length > 0 && (
                          <div className="space-y-1">
                            {validation.warnings.map((warning, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-yellow-400">
                                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="similarity-threshold" className="text-sm font-medium text-gray-300">
                  Similarity Threshold: {currentSimilarityThreshold.toFixed(2)}
                </Label>
                <div className="mt-2">
                  <Slider
                    id="similarity-threshold"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[currentSimilarityThreshold]}
                    onValueChange={(value) => onSimilarityThresholdChange(value[0])}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="connection-levels" className="text-sm font-medium text-gray-300">
                  Connection Levels: {currentConnectionLevels}
                </Label>
                <div className="mt-2">
                  <Slider
                    id="connection-levels"
                    min={1}
                    max={5}
                    step={1}
                    value={[currentConnectionLevels]}
                    onValueChange={(value) => onConnectionLevelsChange(value[0])}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="node-distance" className="text-sm font-medium text-gray-300">
                  Node Distance: {currentNodeDistance}
                </Label>
                <div className="mt-2">
                  <Slider
                    id="node-distance"
                    min={20}
                    max={200}
                    step={5}
                    value={[currentNodeDistance]}
                    onValueChange={(value) => onNodeDistanceChange(value[0])}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="movement-speed" className="text-sm font-medium text-gray-300">
                  Movement Speed: {currentMovementSpeed.toFixed(1)}x
                </Label>
                <div className="mt-2">
                  <Slider
                    id="movement-speed"
                    min={0.5}
                    max={5.0}
                    step={0.1}
                    value={[currentMovementSpeed]}
                    onValueChange={(value) => onMovementSpeedChange(value[0])}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="node-size" className="text-sm font-medium text-gray-300">
                  Node Size: {currentNodeSize}
                </Label>
                <div className="mt-2">
                  <Slider
                    id="node-size"
                    min={1}
                    max={10}
                    step={0.5}
                    value={[currentNodeSize]}
                    onValueChange={(value) => onNodeSizeChange(value[0])}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="link-width" className="text-sm font-medium text-gray-300">
                  Link Width: {currentLinkWidth}
                </Label>
                <div className="mt-2">
                  <Slider
                    id="link-width"
                    min={0.5}
                    max={5}
                    step={0.1}
                    value={[currentLinkWidth]}
                    onValueChange={(value) => onLinkWidthChange(value[0])}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedSimilarityControls;
