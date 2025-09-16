import React, { useState } from 'react';
import DynamicPipelineVisualization from '../components/DynamicPipelineVisualization';
// Simple UI components to avoid import issues
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-200 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
import { 
  Play, 
  Pause, 
  Settings, 
  Palette, 
  Zap, 
  Database, 
  Cpu, 
  MemoryStick,
  Network,
  FileText,
  Search,
  Brain,
  Send,
  BarChart3,
  Activity,
  Info,
  Code,
  Eye,
  MousePointer
} from 'lucide-react';

// Simple UI components
const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-4 border-b border-gray-700 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
);

const Tabs = ({ children, value, onValueChange, className = '' }) => (
  <div className={className}>{children}</div>
);

const TabsList = ({ children, className = '' }) => (
  <div className={`flex space-x-1 ${className}`}>{children}</div>
);

const TabsTrigger = ({ children, value, className = '' }) => (
  <button className={`px-3 py-2 text-sm font-medium rounded-md ${
    value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
  } ${className}`}>
    {children}
  </button>
);

const TabsContent = ({ children, value, className = '' }) => (
  <div className={`mt-4 ${className}`}>{children}</div>
);

/**
 * Dynamic Pipeline Visualization Sample Page
 * 
 * This page demonstrates the enhanced dynamic pipeline visualization
 * with draggable components, real-time animations, and customization features.
 */
const DynamicPipelinePage = () => {
  const [activeTab, setActiveTab] = useState('visualization');
  const [showInstructions, setShowInstructions] = useState(true);

  const features = [
    {
      icon: <MousePointer className="w-5 h-5" />,
      title: "Drag & Drop",
      description: "Move components around freely to design your ideal pipeline layout"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Real-time Animations",
      description: "Watch data flow through your pipeline with animated particles and indicators"
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: "Visual Customization",
      description: "Customize colors, sizes, and visual properties of each component"
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "Information Display",
      description: "Configure what information is shown on each component"
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "Live Data Integration",
      description: "Connect to real-time data sources for live monitoring"
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: "Extensible Architecture",
      description: "Add custom components and behaviors to fit your needs"
    }
  ];

  const componentTypes = [
    { type: 'query-input', icon: <Search className="w-4 h-4" />, name: 'Query Input', description: 'User query entry point' },
    { type: 'vector-search', icon: <Database className="w-4 h-4" />, name: 'Vector Search', description: 'Vector database operations' },
    { type: 'llm-processing', icon: <Brain className="w-4 h-4" />, name: 'LLM Processing', description: 'AI model inference' },
    { type: 'response', icon: <Send className="w-4 h-4" />, name: 'Response Delivery', description: 'Output generation' },
    { type: 'resource-monitor', icon: <BarChart3 className="w-4 h-4" />, name: 'Resource Monitor', description: 'System monitoring' },
    { type: 'data-processor', icon: <Cpu className="w-4 h-4" />, name: 'Data Processor', description: 'Data transformation' },
    { type: 'memory-cache', icon: <MemoryStick className="w-4 h-4" />, name: 'Memory Cache', description: 'Caching layer' },
    { type: 'network-gateway', icon: <Network className="w-4 h-4" />, name: 'Network Gateway', description: 'Network interface' },
    { type: 'document-store', icon: <FileText className="w-4 h-4" />, name: 'Document Store', description: 'Document storage' }
  ];

  return (
    <div className="dynamic-pipeline-page min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dynamic Pipeline Visualization</h1>
              <p className="text-gray-600 mt-1">
                Interactive, customizable data pipeline monitoring with real-time animations
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Live Demo
              </Badge>
              <Button
                onClick={() => setShowInstructions(!showInstructions)}
                variant="outline"
                size="sm"
              >
                <Info className="w-4 h-4 mr-2" />
                {showInstructions ? 'Hide' : 'Show'} Instructions
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Panel */}
      {showInstructions && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How to Use This Visualization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
                  <div>
                    <strong>1. Drag Components:</strong> Click and drag any component to reposition it
                  </div>
                  <div>
                    <strong>2. Connect Components:</strong> Drag from one component's edge to another to create connections
                  </div>
                  <div>
                    <strong>3. Customize:</strong> Click on any component to open the customization panel
                  </div>
                  <div>
                    <strong>4. Add Components:</strong> Use the "Add Components" panel to add new pipeline stages
                  </div>
                  <div>
                    <strong>5. Control Animation:</strong> Use the play/pause button to control real-time updates
                  </div>
                  <div>
                    <strong>6. View Details:</strong> Hover over components to see detailed metrics and information
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 m-4">
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="text-blue-600 mt-0.5">
                        {feature.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{feature.title}</div>
                        <div className="text-xs text-gray-600">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
                    <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> - Play/Pause animation</div>
                    <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">C</kbd> - Toggle customization panel</div>
                    <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">F</kbd> - Fit view to all components</div>
                    <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Delete</kbd> - Remove selected component</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="components" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Available Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {componentTypes.map((component, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                        <div className="text-blue-600">
                          {component.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{component.name}</div>
                          <div className="text-xs text-gray-600">{component.description}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {component.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Visualization Area */}
        <div className="flex-1 relative">
          <DynamicPipelineVisualization />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-gray-600">
          <div>
            Dynamic Pipeline Visualization - Built with React Flow & VAST Data Design System
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Data
            </div>
            <div>Real-time Updates</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPipelinePage;