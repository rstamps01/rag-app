import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '../ui/accordion';
import { 
  Settings, 
  Pin, 
  PinOff, 
  X, 
  Eye, 
  EyeOff, 
  Palette, 
  GitGraph, 
  Target, 
  SlidersHorizontal,
  Filter,
  Network,
  Layers,
  Type,
  Circle,
  Square,
  Diamond,
  FileText,
  Zap,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface GraphType {
  id: string;
  name: string;
  description: string;
  image: string;
  features: string[];
}

interface VisualizationSettings {
  // Graph Layout
  graphType: string;
  
  // Node Labels
  showTextLabels: boolean;
  labelMode: string;
  
  // Color Coding
  colorScheme: string;
  
  // Node Size
  nodeSizeMode: string;
  nodeSize: number;
  
  // Node Shape
  nodeShape: string;
  
  // Node Mobility & Interconnectivity
  maintainInterconnectivity: boolean;
  showAnchorPoints: boolean;
  
  // Display Options
  showInterconnectivity: boolean;
  highlightSelected: boolean;
  
  // Node Distance & Similarity
  useVariableDistance: boolean;
  similarityMode: string;
  minDistance: number;
  maxDistance: number;
  similarityThreshold: number;
  
  // Advanced Features
  showTooltips: boolean;
  enableClustering: boolean;
  enableAnimations: boolean;
  enableFiltering: boolean;
  multiSelect: boolean;
  
  // Hub & Spoke Model
  enableHubSpoke: boolean;
  spokesPerHub: number;
  maxHubs: number;
  
  // 3D Settings
  is3D: boolean;
  movementSpeed: number;
  linkWidth: number;
}

interface EnhancedVisualizationControlsProps {
  settings: VisualizationSettings;
  onSettingsChange: (settings: Partial<VisualizationSettings>) => void;
  onApplyChanges: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  livePreview: boolean;
  onToggleLivePreview: () => void;
}

const graphTypes: GraphType[] = [
  {
    id: 'force-directed',
    name: 'Force-Directed Graph',
    description: 'Classic force-directed layout with natural node positioning',
    image: '/api/placeholder/300/200',
    features: ['Natural clustering', 'Interactive positioning', 'Smooth animations']
  },
  {
    id: 'hierarchical',
    name: 'Hierarchical Layout',
    description: 'Tree-like structure with clear parent-child relationships',
    image: '/api/placeholder/300/200',
    features: ['Clear hierarchy', 'Organized structure', 'Easy navigation']
  },
  {
    id: 'circular',
    name: 'Circular Layout',
    description: 'Nodes arranged in a circle with connections between them',
    image: '/api/placeholder/300/200',
    features: ['Compact view', 'Equal importance', 'Clear connections']
  },
  {
    id: 'grid',
    name: 'Grid Layout',
    description: 'Nodes arranged in a regular grid pattern',
    image: '/api/placeholder/300/200',
    features: ['Organized structure', 'Easy comparison', 'Regular spacing']
  },
  {
    id: 'qdrant-native',
    name: 'Qdrant Native Style',
    description: 'Multi-star topology with hub and spoke connections',
    image: '/api/placeholder/300/200',
    features: ['Hub-spoke model', 'Similarity-based', 'Cluster-focused']
  }
];

const EnhancedVisualizationControls: React.FC<EnhancedVisualizationControlsProps> = ({
  settings,
  onSettingsChange,
  onApplyChanges,
  isPinned,
  onTogglePin,
  onClose,
  livePreview,
  onToggleLivePreview
}) => {
  const [currentGraphTypeIndex, setCurrentGraphTypeIndex] = useState(0);
  const [accordionValue, setAccordionValue] = useState<string[]>(['graph-layout', 'node-labels']);

  // Live preview effect
  useEffect(() => {
    if (livePreview) {
      onApplyChanges();
    }
  }, [settings, livePreview, onApplyChanges]);

  const handleSettingChange = (key: keyof VisualizationSettings, value: any) => {
    onSettingsChange({ [key]: value });
  };

  const nextGraphType = () => {
    setCurrentGraphTypeIndex((prev) => (prev + 1) % graphTypes.length);
  };

  const prevGraphType = () => {
    setCurrentGraphTypeIndex((prev) => (prev - 1 + graphTypes.length) % graphTypes.length);
  };

  const selectGraphType = (typeId: string) => {
    handleSettingChange('graphType', typeId);
  };

  return (
    <Card className="w-full bg-gray-800 text-white border-gray-700 shadow-lg h-full flex flex-col">
      {/* Header with Pin and Close */}
      <CardHeader className="border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Visualization Controls
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePin}
              className={`p-2 ${isPinned ? 'text-blue-400 bg-blue-900/20' : 'text-gray-400 hover:text-white'}`}
              title={isPinned ? 'Unpin and disable live preview' : 'Pin and enable live preview'}
            >
              {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Content with Accordion */}
      <CardContent className="flex-1 overflow-y-auto panel-scrollbar p-4">
        <Accordion
          type="multiple"
          value={accordionValue}
          onValueChange={setAccordionValue}
          className="w-full"
        >
          {/* Graph Layout Section */}
          <AccordionItem value="graph-layout" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <GitGraph className="mr-2 h-4 w-4" />
                Graph Layout
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">
                  Graph Visualization Type
                </Label>
                
                {/* Graph Type Carousel */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevGraphType}
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-400">
                      {currentGraphTypeIndex + 1} of {graphTypes.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextGraphType}
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4 mb-3">
                    <div className="aspect-video bg-gray-600 rounded mb-3 flex items-center justify-center">
                      <div className="text-gray-400 text-sm">
                        {graphTypes[currentGraphTypeIndex].name} Preview
                      </div>
                    </div>
                    <h3 className="font-medium text-white mb-1">
                      {graphTypes[currentGraphTypeIndex].name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {graphTypes[currentGraphTypeIndex].description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {graphTypes[currentGraphTypeIndex].features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-gray-600 text-gray-300">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => selectGraphType(graphTypes[currentGraphTypeIndex].id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    variant={settings.graphType === graphTypes[currentGraphTypeIndex].id ? "default" : "outline"}
                  >
                    {settings.graphType === graphTypes[currentGraphTypeIndex].id ? 'Selected' : 'Select This Layout'}
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Node Labels Section */}
          <AccordionItem value="node-labels" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <Type className="mr-2 h-4 w-4" />
                Node Labels
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-600 p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="show-labels" className="text-sm text-gray-300">
                    Show Text Labels
                  </Label>
                  <p className="text-xs text-gray-400">Display node labels on graph</p>
                </div>
                <Switch
                  id="show-labels"
                  checked={settings.showTextLabels}
                  onCheckedChange={(checked) => handleSettingChange('showTextLabels', checked)}
                />
              </div>
              
              {settings.showTextLabels && (
                <div>
                  <Label className="text-sm font-medium text-gray-300 mb-2 block">
                    Label Mode
                  </Label>
                  <Select
                    value={settings.labelMode}
                    onValueChange={(value) => handleSettingChange('labelMode', value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 text-white border-gray-600">
                      <SelectItem value="filename" className="hover:bg-gray-600">Document Filename</SelectItem>
                      <SelectItem value="chunk-index" className="hover:bg-gray-600">Chunk Index</SelectItem>
                      <SelectItem value="document-id" className="hover:bg-gray-600">Document ID</SelectItem>
                      <SelectItem value="department" className="hover:bg-gray-600">Department</SelectItem>
                      <SelectItem value="file-type" className="hover:bg-gray-600">File Type</SelectItem>
                      <SelectItem value="content-preview" className="hover:bg-gray-600">Content Preview</SelectItem>
                      <SelectItem value="combined" className="hover:bg-gray-600">Combined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Color Coding Section */}
          <AccordionItem value="color-coding" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <Palette className="mr-2 h-4 w-4" />
                Color Coding
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">
                  Color Scheme
                </Label>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value) => handleSettingChange('colorScheme', value)}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    <SelectItem value="group" className="hover:bg-gray-600">Group</SelectItem>
                    <SelectItem value="department" className="hover:bg-gray-600">Department</SelectItem>
                    <SelectItem value="file-type" className="hover:bg-gray-600">File Type</SelectItem>
                    <SelectItem value="document" className="hover:bg-gray-600">Document</SelectItem>
                    <SelectItem value="chunk-index" className="hover:bg-gray-600">Chunk Index</SelectItem>
                    <SelectItem value="processing-time" className="hover:bg-gray-600">Processing Time</SelectItem>
                    <SelectItem value="content-length" className="hover:bg-gray-600">Content Length</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Node Size Section */}
          <AccordionItem value="node-size" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <Layers className="mr-2 h-4 w-4" />
                Node Size
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">
                  Size Mode
                </Label>
                <Select
                  value={settings.nodeSizeMode}
                  onValueChange={(value) => handleSettingChange('nodeSizeMode', value)}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    <SelectItem value="fixed" className="hover:bg-gray-600">Fixed Size</SelectItem>
                    <SelectItem value="content-length" className="hover:bg-gray-600">Content Length</SelectItem>
                    <SelectItem value="chunk-index" className="hover:bg-gray-600">Chunk Index</SelectItem>
                    <SelectItem value="department" className="hover:bg-gray-600">Department</SelectItem>
                    <SelectItem value="file-type" className="hover:bg-gray-600">File Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">
                  Node Size: {settings.nodeSize}
                </Label>
                <Slider
                  value={[settings.nodeSize]}
                  onValueChange={([value]) => handleSettingChange('nodeSize', value)}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Node Shape Section */}
          <AccordionItem value="node-shape" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <Circle className="mr-2 h-4 w-4" />
                Node Shape
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'circle', label: 'Circle', icon: Circle, desc: 'Round nodes' },
                  { value: 'square', label: 'Square', icon: Square, desc: 'Square nodes' },
                  { value: 'diamond', label: 'Diamond', icon: Diamond, desc: 'Diamond nodes' },
                  { value: 'text-block', label: 'Text Block', icon: FileText, desc: 'Text-based nodes' }
                ].map((shape) => (
                  <Button
                    key={shape.value}
                    variant={settings.nodeShape === shape.value ? "default" : "outline"}
                    onClick={() => handleSettingChange('nodeShape', shape.value)}
                    className="flex flex-col items-center p-3 h-auto bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <shape.icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{shape.label}</span>
                    <span className="text-xs text-gray-400">{shape.desc}</span>
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced Features Section */}
          <AccordionItem value="advanced-features" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Advanced Features
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {[
                { key: 'showTooltips', label: 'Show Tooltips', desc: 'Display info on hover' },
                { key: 'enableClustering', label: 'Enable Clustering', desc: 'Group related nodes' },
                { key: 'enableAnimations', label: 'Enable Animations', desc: 'Smooth transitions' },
                { key: 'enableFiltering', label: 'Enable Filtering', desc: 'Filter nodes by criteria' },
                { key: 'multiSelect', label: 'Multi-Select', desc: 'Select multiple nodes' },
                { key: 'maintainInterconnectivity', label: 'Maintain Interconnectivity', desc: 'Keep related nodes connected' },
                { key: 'showAnchorPoints', label: 'Show Anchor Points', desc: 'Display central cluster anchors' },
                { key: 'showInterconnectivity', label: 'Show Interconnectivity', desc: 'Highlight node connections' },
                { key: 'highlightSelected', label: 'Highlight Selected', desc: 'Highlight selected nodes and connections' }
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between rounded-lg border border-gray-600 p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-gray-300">{feature.label}</Label>
                    <p className="text-xs text-gray-400">{feature.desc}</p>
                  </div>
                  <Switch
                    checked={settings[feature.key as keyof VisualizationSettings] as boolean}
                    onCheckedChange={(checked) => handleSettingChange(feature.key as keyof VisualizationSettings, checked)}
                  />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Node Distance & Similarity Section */}
          <AccordionItem value="distance-similarity" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <Target className="mr-2 h-4 w-4" />
                Node Distance & Similarity
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-600 p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-sm text-gray-300">Use Variable Distance</Label>
                  <p className="text-xs text-gray-400">Position nodes based on similarity</p>
                </div>
                <Switch
                  checked={settings.useVariableDistance}
                  onCheckedChange={(checked) => handleSettingChange('useVariableDistance', checked)}
                />
              </div>
              
              {settings.useVariableDistance && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Similarity Mode
                    </Label>
                    <Select
                      value={settings.similarityMode}
                      onValueChange={(value) => handleSettingChange('similarityMode', value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 text-white border-gray-600">
                        <SelectItem value="semantic" className="hover:bg-gray-600">Semantic (Multi-factor)</SelectItem>
                        <SelectItem value="structural" className="hover:bg-gray-600">Structural</SelectItem>
                        <SelectItem value="temporal" className="hover:bg-gray-600">Temporal</SelectItem>
                        <SelectItem value="hybrid" className="hover:bg-gray-600">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Min Distance: {settings.minDistance}
                    </Label>
                    <Slider
                      value={[settings.minDistance]}
                      onValueChange={([value]) => handleSettingChange('minDistance', value)}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Max Distance: {settings.maxDistance}
                    </Label>
                    <Slider
                      value={[settings.maxDistance]}
                      onValueChange={([value]) => handleSettingChange('maxDistance', value)}
                      min={100}
                      max={500}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Similarity Threshold: {settings.similarityThreshold.toFixed(2)}
                    </Label>
                    <Slider
                      value={[settings.similarityThreshold]}
                      onValueChange={([value]) => handleSettingChange('similarityThreshold', value)}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0.1 (Loose)</span>
                      <span>1.0 (Strict)</span>
                    </div>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Hub & Spoke Model Section */}
          <AccordionItem value="hub-spoke" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <Network className="mr-2 h-4 w-4" />
                Hub & Spoke Model
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-600 p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-sm text-gray-300">Enable Hub & Spoke</Label>
                  <p className="text-xs text-gray-400">Double-click nodes to create hubs with similarity-based spokes</p>
                </div>
                <Switch
                  checked={settings.enableHubSpoke}
                  onCheckedChange={(checked) => handleSettingChange('enableHubSpoke', checked)}
                />
              </div>
              
              {settings.enableHubSpoke && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Spokes per Hub: {settings.spokesPerHub}
                    </Label>
                    <Slider
                      value={[settings.spokesPerHub]}
                      onValueChange={([value]) => handleSettingChange('spokesPerHub', value)}
                      min={2}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Max Hubs: {settings.maxHubs}
                    </Label>
                    <Slider
                      value={[settings.maxHubs]}
                      onValueChange={([value]) => handleSettingChange('maxHubs', value)}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>• Double-click any node to create a hub</p>
                    <p>• Hub connects to {settings.spokesPerHub} most similar nodes</p>
                    <p>• Current hubs: 0/{settings.maxHubs}</p>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 3D Settings Section */}
          <AccordionItem value="3d-settings" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center">
                <Layers className="mr-2 h-4 w-4" />
                3D Settings
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-600 p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-sm text-gray-300">Enable 3D Mode</Label>
                  <p className="text-xs text-gray-400">Switch to 3D visualization mode</p>
                </div>
                <Switch
                  checked={settings.is3D}
                  onCheckedChange={(checked) => handleSettingChange('is3D', checked)}
                />
              </div>
              
              {settings.is3D && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Movement Speed: {settings.movementSpeed.toFixed(1)}x
                    </Label>
                    <Slider
                      value={[settings.movementSpeed]}
                      onValueChange={([value]) => handleSettingChange('movementSpeed', value)}
                      min={0.5}
                      max={5.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Link Width: {settings.linkWidth}
                    </Label>
                    <Slider
                      value={[settings.linkWidth]}
                      onValueChange={([value]) => handleSettingChange('linkWidth', value)}
                      min={0.5}
                      max={5.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      {/* Apply Changes Button - Always Visible */}
      <div className="border-t border-gray-700 p-4 flex-shrink-0">
        <Button
          onClick={onApplyChanges}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={livePreview}
        >
          {livePreview ? 'Live Preview Active' : 'Apply Changes'}
        </Button>
      </div>
    </Card>
  );
};

export default EnhancedVisualizationControls;
