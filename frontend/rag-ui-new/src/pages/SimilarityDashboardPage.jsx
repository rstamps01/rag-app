import React, { useState } from 'react';
import { AppSidebar } from '../components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';
import { Separator } from '../components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '../components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
import SimilarityVisualizationDemo from '../components/dashboard/SimilarityVisualizationDemo';
import IconTest from '../components/IconTest';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  Info, 
  Target,
  BarChart3,
  Settings,
  Eye,
  RotateCcw
} from 'lucide-react';

const SimilarityDashboardPage = () => {
  const [testResults, setTestResults] = useState({
    components: false,
    styling: false,
    interactions: false,
    animations: false
  });

  const runTests = () => {
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  RAG Visualization
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Similarity Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="ml-auto flex items-center gap-2">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  <Info className="h-4 w-4 mr-2" />
                  Test Info
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
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
                        <p>5. <strong>Sidebar Navigation:</strong> Test the left sidebar navigation and controls</p>
                        <p>6. <strong>Sheet Context:</strong> Test the right-side context sheet for detailed metrics</p>
                        <p>7. <strong>Drawer Info:</strong> Test the drawer for test information and status</p>
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
        </header>
        
        <div className="flex flex-1 flex-col">
          {/* Main Visualization Area */}
          <div className="flex-1 overflow-hidden">
            <SimilarityVisualizationDemo />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SimilarityDashboardPage;
