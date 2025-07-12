// Customizable Monitoring Views - Drag-and-drop dashboard builder
import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Layout, Plus, Settings, Save, RotateCcw, Eye, EyeOff,
  BarChart3, PieChart, Activity, Gauge, TrendingUp
} from 'lucide-react';

const WIDGET_TYPES = {
  METRICS: 'metrics',
  CHART: 'chart',
  HEALTH: 'health',
  ALERTS: 'alerts',
  INSIGHTS: 'insights'
};

const availableWidgets = [
  {
    id: 'cpu-usage',
    type: WIDGET_TYPES.METRICS,
    title: 'CPU Usage',
    icon: Gauge,
    size: { width: 1, height: 1 },
    config: { metric: 'cpu_usage', unit: '%' }
  },
  {
    id: 'memory-usage',
    type: WIDGET_TYPES.METRICS,
    title: 'Memory Usage',
    icon: BarChart3,
    size: { width: 1, height: 1 },
    config: { metric: 'memory_usage', unit: 'GB' }
  },
  {
    id: 'response-time',
    type: WIDGET_TYPES.CHART,
    title: 'Response Time Trend',
    icon: TrendingUp,
    size: { width: 2, height: 1 },
    config: { chartType: 'line', metric: 'response_time' }
  },
  {
    id: 'health-overview',
    type: WIDGET_TYPES.HEALTH,
    title: 'System Health',
    icon: Activity,
    size: { width: 2, height: 2 },
    config: { showComponents: true }
  },
  {
    id: 'error-distribution',
    type: WIDGET_TYPES.CHART,
    title: 'Error Distribution',
    icon: PieChart,
    size: { width: 1, height: 1 },
    config: { chartType: 'pie', metric: 'errors' }
  }
];

const DraggableWidget = ({ widget, onRemove, onConfigure }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { id: widget.id, type: widget.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const WidgetIcon = widget.icon;

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-move transition-all ${
        isDragging ? 'opacity-50' : 'hover:shadow-md'
      }`}
      style={{
        gridColumn: `span ${widget.size.width}`,
        gridRow: `span ${widget.size.height}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <WidgetIcon className="h-4 w-4" />
          <span className="font-medium text-sm">{widget.title}</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfigure(widget)}
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(widget.id)}
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Widget Content Preview */}
      <div className="bg-gray-50 rounded p-2 h-20 flex items-center justify-center">
        <span className="text-xs text-gray-500">Widget Preview</span>
      </div>
    </div>
  );
};

const DropZone = ({ onDrop, children }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'widget',
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`min-h-96 border-2 border-dashed rounded-lg p-4 transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      {children}
    </div>
  );
};

const CustomizableMonitoringViews = ({ onSaveLayout, onLoadLayout }) => {
  const [currentLayout, setCurrentLayout] = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(true);
  const [layoutName, setLayoutName] = useState('');

  const handleWidgetDrop = useCallback((item) => {
    const widget = availableWidgets.find(w => w.id === item.id);
    if (widget && !currentLayout.find(w => w.id === widget.id)) {
      setCurrentLayout(prev => [...prev, { ...widget, instanceId: Date.now() }]);
    }
  }, [currentLayout]);

  const handleWidgetRemove = useCallback((widgetId) => {
    setCurrentLayout(prev => prev.filter(w => w.instanceId !== widgetId));
  }, []);

  const handleWidgetConfigure = useCallback((widget) => {
    setSelectedWidget(widget);
  }, []);

  const handleSaveLayout = () => {
    if (layoutName.trim()) {
      onSaveLayout?.({
        name: layoutName,
        layout: currentLayout,
        timestamp: new Date().toISOString()
      });
      alert(`Layout "${layoutName}" saved successfully!`);
    }
  };

  const handleResetLayout = () => {
    setCurrentLayout([]);
    setLayoutName('');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header Controls */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Dashboard Builder
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
                >
                  {showWidgetLibrary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Widget Library
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetLayout}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveLayout}
                  disabled={!layoutName.trim()}
                >
                  <Save className="h-4 w-4" />
                  Save Layout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Enter layout name..."
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="px-3 py-2 border rounded-lg flex-1"
              />
              <Badge variant="secondary">
                {currentLayout.length} widgets
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Widget Library */}
          {showWidgetLibrary && (
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Widget Library</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableWidgets.map((widget) => {
                    const WidgetIcon = widget.icon;
                    const isAdded = currentLayout.some(w => w.id === widget.id);
                    
                    return (
                      <div
                        key={widget.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isAdded 
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                            : 'hover:shadow-md hover:border-blue-300'
                        }`}
                        onClick={() => !isAdded && handleWidgetDrop({ id: widget.id, type: widget.type })}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <WidgetIcon className="h-4 w-4" />
                          <span className="font-medium text-sm">{widget.title}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Size: {widget.size.width}x{widget.size.height}
                        </div>
                        {isAdded && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Added
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Canvas */}
          <Card className={showWidgetLibrary ? "lg:col-span-3" : "lg:col-span-4"}>
            <CardHeader>
              <CardTitle>Dashboard Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <DropZone onDrop={handleWidgetDrop}>
                {currentLayout.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Plus className="h-12 w-12 mb-4 opacity-50" />
                    <p>Drag widgets from the library to build your dashboard</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 auto-rows-fr">
                    {currentLayout.map((widget) => (
                      <DraggableWidget
                        key={widget.instanceId}
                        widget={widget}
                        onRemove={handleWidgetRemove}
                        onConfigure={handleWidgetConfigure}
                      />
                    ))}
                  </div>
                )}
              </DropZone>
            </CardContent>
          </Card>
        </div>

        {/* Widget Configuration Panel */}
        {selectedWidget && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Configure Widget: {selectedWidget.title}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWidget(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Widget Title</label>
                  <input
                    type="text"
                    value={selectedWidget.title}
                    className="w-full px-3 py-2 border rounded-lg"
                    onChange={(e) => {
                      setSelectedWidget(prev => ({ ...prev, title: e.target.value }));
                      setCurrentLayout(prev => 
                        prev.map(w => 
                          w.instanceId === selectedWidget.instanceId 
                            ? { ...w, title: e.target.value }
                            : w
                        )
                      );
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Refresh Interval</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DndProvider>
  );
};

export default CustomizableMonitoringViews;