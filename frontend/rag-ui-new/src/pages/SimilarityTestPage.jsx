import React, { useState } from 'react';
import SimilarityVisualizationDemo from '../components/dashboard/SimilarityVisualizationDemo';
import IconTest from '../components/IconTest';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../components/ui/drawer';
import { ArrowLeft, TestTube, CheckCircle, XCircle, ChevronDown, Settings, Info, Eye, EyeOff, RotateCcw } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SimilarityTestPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-white p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Visualization</h2>
            <p className="text-gray-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const SimilarityTestPage = () => {
  const [testResults, setTestResults] = useState({
    components: false,
    styling: false,
    interactions: false,
    animations: false
  });
  const [panelState, setPanelState] = useState({ leftPanel: false, rightPanel: false });
  const [graphStats, setGraphStats] = useState(null);
  const [is3D, setIs3D] = useState(false);
  const [is3DToggling, setIs3DToggling] = useState(false); // Flag to prevent feedback loop

  const runTests = () => {
    // Simulate running tests
    setTestResults({
      components: true,
      styling: true,
      interactions: true,
      animations: true
    });
  };

  const resetTests = () => {
    setTestResults({
      components: false,
      styling: false,
      interactions: false,
      animations: false
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header with Drawer Trigger */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-3 lg:p-4 transition-all duration-300 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left section - Title stays left-justified, not affected by left panel */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1" 
            style={{ 
              marginLeft: panelState.leftPanel ? '28rem' : '0',
              transition: 'margin-left 0.3s ease'
            }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 min-w-0">
              <TestTube className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-400 flex-shrink-0" />
              <span className="truncate">Similarity Visualization Test Suite</span>
            </CardTitle>
          </div>

          {/* Right section - Buttons shift left when right panel opens, stay fixed when left panel opens */}
          <div className="flex items-center gap-2 flex-shrink-0"
            style={{
              marginRight: panelState.rightPanel ? '28rem' : '0',
              transition: 'margin-right 0.3s ease',
              maxWidth: panelState.rightPanel ? 'calc(100% - 28rem)' : '100%'
            }}>
            {/* 3D Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (is3DToggling) return; // Prevent rapid clicking
                const newIs3D = !is3D;
                console.log('🔄 3D button clicked, toggling to:', newIs3D);
                setIs3DToggling(true);
                setIs3D(newIs3D);
                // Trigger 3D toggle in child component via event
                window.dispatchEvent(new CustomEvent('toggle3D', { detail: { is3D: newIs3D } }));
                // Reset flag after a short delay
                setTimeout(() => setIs3DToggling(false), 500);
              }}
              disabled={is3DToggling}
              className={`${is3D ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-white'} hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0 ${is3DToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={`Switch to ${is3D ? '2D' : '3D'} view`}
            >
              {is3D ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              <span className="hidden sm:inline">{is3D ? '2D' : '3D'}</span>
            </Button>
            
            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔄 Reset button clicked');
                }
                // Reset 3D state
                setIs3D(false);
                setIs3DToggling(false);
                // Reset will trigger child component reset via callback
                window.dispatchEvent(new CustomEvent('resetDemo', { detail: { resetGraph: true } }));
              }}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs px-2 py-1 h-8 flex-shrink-0"
              title="Reset Demo"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            
            <Drawer>
              <DrawerTrigger asChild>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-600 bg-gray-700 text-white hover:bg-gray-600 px-2 py-1 h-8">
                  <Info className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Test Info</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
              </DrawerTrigger>
              <DrawerContent className="bg-gray-800 border-gray-700 text-white">
                <DrawerHeader>
                  <DrawerTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <TestTube className="h-6 w-6" />
                    Test Suite Information
                  </DrawerTitle>
                  <DrawerDescription className="text-gray-300">
                    Comprehensive testing interface for similarity visualization components
                  </DrawerDescription>
                </DrawerHeader>
                
                <div className="px-4 pb-4 space-y-4 max-h-96 overflow-y-auto panel-scrollbar">
                  {/* Test Status */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Test Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-600 rounded-lg">
                          {testResults.components ? (
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-400" />
                          )}
                          <div>
                            <p className="font-medium text-white">Component Loading</p>
                            <p className="text-sm text-gray-300">All components load without errors</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-600 rounded-lg">
                          {testResults.styling ? (
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-400" />
                          )}
                          <div>
                            <p className="font-medium text-white">Styling & Animations</p>
                            <p className="text-sm text-gray-300">React Bits and shadcn/ui styling work</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-600 rounded-lg">
                          {testResults.interactions ? (
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-400" />
                          )}
                          <div>
                            <p className="font-medium text-white">User Interactions</p>
                            <p className="text-sm text-gray-300">Clicking, sliders, and tabs work</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-600 rounded-lg">
                          {testResults.animations ? (
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-400" />
                          )}
                          <div>
                            <p className="font-medium text-white">Animations</p>
                            <p className="text-sm text-gray-300">ElasticSlider, RotatingText, ElectricBorder</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Icon Test */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Icon Test</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <IconTest />
                    </CardContent>
                  </Card>

                  {/* Test Instructions */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Test Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-gray-300">
                        <p>1. <strong>Component Loading:</strong> Verify all similarity components load without errors</p>
                        <p>2. <strong>Styling:</strong> Check that React Bits animations and shadcn/ui styling work correctly</p>
                        <p>3. <strong>Interactions:</strong> Test clicking nodes, adjusting sliders, and switching tabs</p>
                        <p>4. <strong>Animations:</strong> Verify ElasticSlider, RotatingText, and ElectricBorder animations work</p>
                        <p>5. <strong>Slide-out Panels:</strong> Test the left controls panel and right metrics panel</p>
                        <p>6. <strong>Preview Mode:</strong> Enable preview to test real-time adjustments</p>
                        <p>7. <strong>Scroll Bars:</strong> Verify smooth scrolling in all panels and tabs</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <DrawerFooter>
                  <div className="flex gap-2">
                    <Button
                      onClick={runTests}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Run Tests
                    </Button>
                    <Button
                      onClick={resetTests}
                      variant="outline"
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                      Reset
                    </Button>
                    <DrawerClose asChild>
                      <Button variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                        Close
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* Main Demo Component - Uses flex-1 to fill remaining space */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <SimilarityVisualizationDemo 
            onPanelStateChange={setPanelState}
            onGraphStatsChange={(stats) => {
              setGraphStats(stats);
              // Sync is3D state with graph stats ONLY if not currently toggling (prevents feedback loop)
              if (stats && stats.is3D !== undefined && stats.is3D !== is3D && !is3DToggling) {
                setIs3D(stats.is3D);
              }
            }}
            onResetRequest={() => {
              // Reset will be handled by the component via event
            }}
            on3DToggleRequest={() => {
              const newIs3D = !is3D;
              console.log('🔄 3D toggle request, toggling to:', newIs3D);
              setIs3D(newIs3D);
              // Also dispatch the event to ensure it's handled
              window.dispatchEvent(new CustomEvent('toggle3D', { detail: { is3D: newIs3D } }));
            }}
            is3D={is3D}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default SimilarityTestPage;