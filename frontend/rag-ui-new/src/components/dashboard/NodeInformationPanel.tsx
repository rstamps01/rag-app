import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { 
  X, 
  Database, 
  Hash, 
  FileText, 
  Clock, 
  Target, 
  Link, 
  Layers,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Tag,
  Calendar,
  MapPin,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface NodeData {
  id: string;
  label: string;
  group: number;
  payload: any;
  x?: number;
  y?: number;
  z?: number;
  similarity?: number;
  connections?: number;
  depth?: number;
  isCenter?: boolean;
  isStarCenter?: boolean;
  starId?: string;
  circleIndex?: number;
  nodeIndex?: number;
  isAnchor?: boolean;
  isHub?: boolean;
  timestamp?: string;
  embedding?: number[];
  content?: string;
  metadata?: any;
}

interface SimilarityNode {
  id: string;
  label: string;
  similarity: number;
  distance: number;
  type: string;
}

interface NodeInformationPanelProps {
  selectedNode: NodeData | null;
  similarityNodes: SimilarityNode[];
  onClose: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onNodeSelect: (nodeId: string) => void;
}

const NodeInformationPanel: React.FC<NodeInformationPanelProps> = ({
  selectedNode,
  similarityNodes,
  onClose,
  isPinned,
  onTogglePin,
  onNodeSelect
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'similarity']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toFixed(3);
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatTimestamp = (timestamp: string | number | Date): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 0.8) return 'text-green-400';
    if (similarity >= 0.6) return 'text-yellow-400';
    if (similarity >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSimilarityBadgeColor = (similarity: number): string => {
    if (similarity >= 0.8) return 'bg-green-900/20 border-green-500 text-green-300';
    if (similarity >= 0.6) return 'bg-yellow-900/20 border-yellow-500 text-yellow-300';
    if (similarity >= 0.4) return 'bg-orange-900/20 border-orange-500 text-orange-300';
    return 'bg-red-900/20 border-red-500 text-red-300';
  };

  if (!selectedNode) {
    return (
      <Card className="w-full bg-gray-800 text-white border-gray-700 shadow-lg h-full flex flex-col">
        <CardHeader className="border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Node Information
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePin}
                className={`p-2 ${isPinned ? 'text-blue-400 bg-blue-900/20' : 'text-gray-400 hover:text-white'}`}
                title={isPinned ? 'Unpin panel' : 'Pin panel'}
              >
                {isPinned ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No Node Selected</p>
            <p className="text-sm">Click on a node to view its information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gray-800 text-white border-gray-700 shadow-lg h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Node Information
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePin}
              className={`p-2 ${isPinned ? 'text-blue-400 bg-blue-900/20' : 'text-gray-400 hover:text-white'}`}
              title={isPinned ? 'Unpin panel' : 'Pin panel'}
            >
              {isPinned ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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

      {/* Content */}
      <CardContent className="flex-1 overflow-y-auto panel-scrollbar p-4">
        <div className="space-y-4">
          {/* Basic Information */}
          <div className="border border-gray-600 rounded-lg">
            <Button
              variant="ghost"
              onClick={() => toggleSection('basic')}
              className="w-full justify-between p-4 text-left hover:bg-gray-700"
            >
              <div className="flex items-center">
                <Hash className="mr-2 h-4 w-4" />
                <span className="font-medium">Basic Information</span>
              </div>
              {expandedSections.includes('basic') ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
            {expandedSections.includes('basic') && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-400">Node ID</Label>
                    <p className="text-sm font-mono bg-gray-700 p-2 rounded">{selectedNode.id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Label</Label>
                    <p className="text-sm bg-gray-700 p-2 rounded">{selectedNode.label || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-400">Group</Label>
                    <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300">
                      {selectedNode.group}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Connections</Label>
                    <Badge variant="outline" className="bg-green-900/20 border-green-500 text-green-300">
                      {selectedNode.connections || 0}
                    </Badge>
                  </div>
                </div>

                {selectedNode.timestamp && (
                  <div>
                    <Label className="text-xs text-gray-400">Timestamp</Label>
                    <p className="text-sm bg-gray-700 p-2 rounded flex items-center">
                      <Clock className="mr-2 h-3 w-3" />
                      {formatTimestamp(selectedNode.timestamp)}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedNode.x !== undefined && (
                    <div>
                      <Label className="text-xs text-gray-400">X Position</Label>
                      <p className="text-sm bg-gray-700 p-2 rounded">{selectedNode.x.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedNode.y !== undefined && (
                    <div>
                      <Label className="text-xs text-gray-400">Y Position</Label>
                      <p className="text-sm bg-gray-700 p-2 rounded">{selectedNode.y.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {selectedNode.z !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-400">Z Position</Label>
                    <p className="text-sm bg-gray-700 p-2 rounded">{selectedNode.z.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Node Properties */}
          <div className="border border-gray-600 rounded-lg">
            <Button
              variant="ghost"
              onClick={() => toggleSection('properties')}
              className="w-full justify-between p-4 text-left hover:bg-gray-700"
            >
              <div className="flex items-center">
                <Layers className="mr-2 h-4 w-4" />
                <span className="font-medium">Node Properties</span>
              </div>
              {expandedSections.includes('properties') ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
            {expandedSections.includes('properties') && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Is Center</span>
                    <Badge variant="outline" className={selectedNode.isCenter ? 'bg-green-900/20 border-green-500 text-green-300' : 'bg-gray-900/20 border-gray-500 text-gray-300'}>
                      {selectedNode.isCenter ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Is Hub</span>
                    <Badge variant="outline" className={selectedNode.isHub ? 'bg-blue-900/20 border-blue-500 text-blue-300' : 'bg-gray-900/20 border-gray-500 text-gray-300'}>
                      {selectedNode.isHub ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Is Anchor</span>
                    <Badge variant="outline" className={selectedNode.isAnchor ? 'bg-purple-900/20 border-purple-500 text-purple-300' : 'bg-gray-900/20 border-gray-500 text-gray-300'}>
                      {selectedNode.isAnchor ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Is Star Center</span>
                    <Badge variant="outline" className={selectedNode.isStarCenter ? 'bg-yellow-900/20 border-yellow-500 text-yellow-300' : 'bg-gray-900/20 border-gray-500 text-gray-300'}>
                      {selectedNode.isStarCenter ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                {selectedNode.depth !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-400">Depth Level</Label>
                    <p className="text-sm bg-gray-700 p-2 rounded">{selectedNode.depth}</p>
                  </div>
                )}

                {selectedNode.starId && (
                  <div>
                    <Label className="text-xs text-gray-400">Star ID</Label>
                    <p className="text-sm font-mono bg-gray-700 p-2 rounded">{selectedNode.starId}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Similarity Information */}
          <div className="border border-gray-600 rounded-lg">
            <Button
              variant="ghost"
              onClick={() => toggleSection('similarity')}
              className="w-full justify-between p-4 text-left hover:bg-gray-700"
            >
              <div className="flex items-center">
                <Target className="mr-2 h-4 w-4" />
                <span className="font-medium">Similarity Analysis</span>
                {similarityNodes.length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-blue-900/20 border-blue-500 text-blue-300">
                    {similarityNodes.length}
                  </Badge>
                )}
              </div>
              {expandedSections.includes('similarity') ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
            {expandedSections.includes('similarity') && (
              <div className="px-4 pb-4 space-y-3">
                {selectedNode.similarity !== undefined && (
                  <div>
                    <Label className="text-xs text-gray-400">Similarity Score</Label>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-mono ${getSimilarityColor(selectedNode.similarity)}`}>
                        {selectedNode.similarity.toFixed(3)}
                      </p>
                      <Badge className={getSimilarityBadgeColor(selectedNode.similarity)}>
                        {selectedNode.similarity >= 0.8 ? 'High' : 
                         selectedNode.similarity >= 0.6 ? 'Medium' : 
                         selectedNode.similarity >= 0.4 ? 'Low' : 'Very Low'}
                      </Badge>
                    </div>
                  </div>
                )}

                {similarityNodes.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-400 mb-2 block">Most Similar Nodes</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {similarityNodes.slice(0, 10).map((node, index) => (
                        <div key={node.id} className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"
                             onClick={() => onNodeSelect(node.id)}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{node.label}</p>
                            <p className="text-xs text-gray-400 font-mono">{node.id}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge className={getSimilarityBadgeColor(node.similarity)}>
                              {(node.similarity * 100).toFixed(1)}%
                            </Badge>
                            <span className="text-xs text-gray-400">{node.distance.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content & Metadata */}
          {(selectedNode.content || selectedNode.metadata) && (
            <div className="border border-gray-600 rounded-lg">
              <Button
                variant="ghost"
                onClick={() => toggleSection('content')}
                className="w-full justify-between p-4 text-left hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="font-medium">Content & Metadata</span>
                </div>
                {expandedSections.includes('content') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
              {expandedSections.includes('content') && (
                <div className="px-4 pb-4 space-y-3">
                  {selectedNode.content && (
                    <div>
                      <Label className="text-xs text-gray-400">Content Preview</Label>
                      <div className="text-sm bg-gray-700 p-3 rounded max-h-32 overflow-y-auto">
                        {selectedNode.content.length > 200 
                          ? `${selectedNode.content.substring(0, 200)}...` 
                          : selectedNode.content}
                      </div>
                    </div>
                  )}

                  {selectedNode.metadata && (
                    <div>
                      <Label className="text-xs text-gray-400">Metadata</Label>
                      <pre className="text-xs bg-gray-700 p-3 rounded max-h-32 overflow-y-auto">
                        {JSON.stringify(selectedNode.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payload Data */}
          {selectedNode.payload && (
            <div className="border border-gray-600 rounded-lg">
              <Button
                variant="ghost"
                onClick={() => toggleSection('payload')}
                className="w-full justify-between p-4 text-left hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Database className="mr-2 h-4 w-4" />
                  <span className="font-medium">Payload Data</span>
                </div>
                {expandedSections.includes('payload') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
              {expandedSections.includes('payload') && (
                <div className="px-4 pb-4">
                  <pre className="text-xs bg-gray-700 p-3 rounded max-h-48 overflow-y-auto">
                    {JSON.stringify(selectedNode.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeInformationPanel;
