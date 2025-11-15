import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
// import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Target, 
  BarChart3, 
  Activity, 
  Database, 
  Zap, 
  Settings,
  Info,
  TrendingUp,
  Layers,
  Eye,
  RotateCcw
} from 'lucide-react';

interface SimilarityContextSheetProps {
  selectedNode?: any;
  similarityData?: any[];
  onNodeSelect?: (node: any) => void;
  children: React.ReactNode;
}

const SimilarityContextSheet: React.FC<SimilarityContextSheetProps> = ({
  selectedNode,
  similarityData = [],
  onNodeSelect,
  children
}) => {
  const [activeTab, setActiveTab] = React.useState('metrics');

  // Mock metrics data
  const metrics = [
    {
      id: 'similarity-score',
      name: 'Similarity Score',
      value: selectedNode ? Math.random() * 0.4 + 0.6 : 0,
      unit: '',
      description: 'Overall similarity to selected node',
      icon: <Target className="h-4 w-4" />,
      maxValue: 1
    },
    {
      id: 'connection-count',
      name: 'Connections',
      value: selectedNode ? Math.floor(Math.random() * 20) + 5 : 0,
      unit: '',
      description: 'Number of direct connections',
      icon: <Activity className="h-4 w-4" />,
      maxValue: 25
    },
    {
      id: 'cluster-size',
      name: 'Cluster Size',
      value: selectedNode ? Math.floor(Math.random() * 50) + 10 : 0,
      unit: '',
      description: 'Nodes in the same cluster',
      icon: <Layers className="h-4 w-4" />,
      maxValue: 100
    },
    {
      id: 'processing-time',
      name: 'Processing Time',
      value: Math.random() * 50 + 10,
      unit: 'ms',
      description: 'Time to process similarity calculations',
      icon: <Zap className="h-4 w-4" />,
      maxValue: 100
    }
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-96 bg-gray-800 border-gray-700 text-white">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Similarity Context
          </SheetTitle>
          <SheetDescription className="text-gray-300">
            Detailed metrics and information about the selected node
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700 mb-4">
              <TabsTrigger value="metrics" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-1" /> Metrics
              </TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                <Info className="h-4 w-4 mr-1" /> Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4">
              <div className="h-[calc(100vh-200px)] overflow-y-auto panel-scrollbar">
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <Card key={metric.id} className="bg-gray-700 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400">{metric.icon}</span>
                            <span className="text-sm font-medium text-gray-200">{metric.name}</span>
                          </div>
                          <Badge variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white">
                            {metric.value.toFixed(2)}{metric.unit}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{metric.description}</p>
                        {metric.maxValue && (
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(metric.value / metric.maxValue) * 100}%` }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="h-[calc(100vh-200px)] overflow-y-auto panel-scrollbar">
                <div className="space-y-4">
                  {selectedNode ? (
                    <>
                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-lg text-white">Node Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-300">Node ID</Label>
                            <p className="text-white font-mono text-sm">{selectedNode.id}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-300">Group</Label>
                            <p className="text-white">{selectedNode.group || 'Unknown'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-300">Position</Label>
                            <p className="text-white font-mono text-sm">
                              X: {selectedNode.x?.toFixed(2) || '0'}, 
                              Y: {selectedNode.y?.toFixed(2) || '0'}, 
                              Z: {selectedNode.z?.toFixed(2) || '0'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-lg text-white">Similarity Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-300">
                              Found {similarityData.length} similar nodes
                            </p>
                            <div className="space-y-1">
                              {similarityData.slice(0, 5).map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                                  <span className="text-sm text-white">Node {item.id}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {(item.similarity || Math.random()).toFixed(3)}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="p-6 text-center">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300">No node selected</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Click on a node in the graph to see detailed information
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SimilarityContextSheet;
