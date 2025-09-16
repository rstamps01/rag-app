import React, { useState, useEffect } from 'react';
import EnhancedPipelineDashboard from '../components/EnhancedPipelineDashboard';
import PipelineGraph from '../components/PipelineGraph';
import usePipelineFlow from '../hooks/usePipelineFlow';
import QdrantVectorVisualization from '../components/QdrantVectorVisualization';
import PerformanceMonitor from '../components/PerformanceMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

/**
 * Pipeline Visualization Demo
 * 
 * This component demonstrates all the enhanced pipeline visualization features
 * with sample data and interactive examples.
 */
const PipelineVisualizationDemo = () => {
  const [demoMode, setDemoMode] = useState('full'); // 'full', 'components', 'custom'
  const [sampleData, setSampleData] = useState(null);
  
  // Generate sample data for demonstration
  useEffect(() => {
    const generateSampleData = () => {
      return {
        system_health: {
          cpu_percent: Math.random() * 100,
          memory_percent: Math.random() * 100,
          memory_available: `${(Math.random() * 16).toFixed(1)}GB`
        },
        gpu_performance: [{
          utilization: Math.random() * 100,
          memory_used: Math.random() * 24000,
          memory_total: 24576,
          temperature: 60 + Math.random() * 30
        }],
        pipeline_status: {
          queries_per_minute: Math.floor(Math.random() * 50),
          avg_response_time: Math.random() * 3000,
          active_queries: Math.floor(Math.random() * 10)
        },
        connection_status: {
          websocket_connections: Math.floor(Math.random() * 5) + 1,
          backend_status: 'connected',
          database_status: 'connected',
          vector_db_status: 'connected'
        }
      };
    };
    
    // Generate initial sample data
    setSampleData(generateSampleData());
    
    // Update sample data every 3 seconds for demo
    const interval = setInterval(() => {
      setSampleData(generateSampleData());
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Sample pipeline stages for demonstration
  const sampleStages = [
    {
      id: 'query-input',
      label: 'Query Input',
      status: 'active',
      health: 'healthy',
      metrics: {
        throughput: sampleData?.pipeline_status?.queries_per_minute || 0,
        latency: sampleData?.pipeline_status?.avg_response_time || 0,
        active_queries: sampleData?.pipeline_status?.active_queries || 0,
        error_rate: 0
      }
    },
    {
      id: 'vector-search',
      label: 'Vector Search',
      status: 'processing',
      health: 'healthy',
      metrics: {
        search_latency: (sampleData?.pipeline_status?.avg_response_time || 0) * 0.3,
        results_count: Math.floor(Math.random() * 20),
        collection_health: 'healthy'
      }
    },
    {
      id: 'llm-processing',
      label: 'LLM Processing',
      status: 'processing',
      health: sampleData?.gpu_performance?.[0]?.temperature > 80 ? 'warning' : 'healthy',
      metrics: {
        gpu_utilization: sampleData?.gpu_performance?.[0]?.utilization || 0,
        gpu_memory: sampleData?.gpu_performance?.[0]?.memory_used || 0,
        processing_time: (sampleData?.pipeline_status?.avg_response_time || 0) * 0.7,
        temperature: sampleData?.gpu_performance?.[0]?.temperature || 0
      }
    },
    {
      id: 'response',
      label: 'Response Delivery',
      status: 'idle',
      health: 'healthy',
      metrics: {
        response_time: sampleData?.pipeline_status?.avg_response_time || 0,
        success_rate: 100,
        throughput: sampleData?.pipeline_status?.queries_per_minute || 0
      }
    },
    {
      id: 'resource-monitor',
      label: 'Resource Monitor',
      status: 'active',
      health: sampleData?.cpu_percent > 90 ? 'critical' : 
              sampleData?.cpu_percent > 80 ? 'warning' : 'healthy',
      metrics: {
        cpu_percent: sampleData?.system_health?.cpu_percent || 0,
        memory_percent: sampleData?.system_health?.memory_percent || 0,
        memory_available: sampleData?.system_health?.memory_available || '0GB',
        gpu_utilization: sampleData?.gpu_performance?.[0]?.utilization || 0,
        gpu_temperature: sampleData?.gpu_performance?.[0]?.temperature || 0
      }
    }
  ];
  
  const sampleEdges = [
    {
      id: 'query-to-vector',
      source: 'query-input',
      target: 'vector-search',
      throughput: sampleData?.pipeline_status?.queries_per_minute || 0,
      latency: (sampleData?.pipeline_status?.avg_response_time || 0) * 0.3
    },
    {
      id: 'vector-to-llm',
      source: 'vector-search',
      target: 'llm-processing',
      throughput: sampleData?.pipeline_status?.queries_per_minute || 0,
      latency: (sampleData?.pipeline_status?.avg_response_time || 0) * 0.4
    },
    {
      id: 'llm-to-response',
      source: 'llm-processing',
      target: 'response',
      throughput: sampleData?.pipeline_status?.queries_per_minute || 0,
      latency: (sampleData?.pipeline_status?.avg_response_time || 0) * 0.3
    }
  ];
  
  // Custom implementation demo
  const CustomImplementationDemo = () => {
    const {
      nodes,
      edges,
      selectedNodeId,
      handleNodeClick,
      handleNodeHover,
      isConnected,
      pipelineStats
    } = usePipelineFlow('/ws/pipeline-monitoring', {
      debug: true
    });
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Custom Implementation Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                This demonstrates how to use the individual components with custom configuration.
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Pipeline Graph Component</h3>
                  <div className="h-64 border rounded-lg">
                    <PipelineGraph
                      stages={sampleStages}
                      edges={sampleEdges}
                      onNodeClick={handleNodeClick}
                      onNodeHover={handleNodeHover}
                      selectedNodeId={selectedNodeId}
                      showTooltips={true}
                      realTimeData={sampleData}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Performance Monitor</h3>
                  <div className="h-64 overflow-y-auto">
                    <PerformanceMonitor 
                      pipelineStats={pipelineStats || {
                        cpuUsage: sampleData?.system_health?.cpu_percent || 0,
                        memoryUsage: sampleData?.system_health?.memory_percent || 0,
                        gpuUtilization: sampleData?.gpu_performance?.[0]?.utilization || 0,
                        gpuTemperature: sampleData?.gpu_performance?.[0]?.temperature || 0,
                        totalQueries: sampleData?.pipeline_status?.queries_per_minute || 0,
                        avgResponseTime: sampleData?.pipeline_status?.avg_response_time || 0,
                        activeQueries: sampleData?.pipeline_status?.active_queries || 0,
                        isConnected: true
                      }}
                      showCharts={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Components showcase demo
  const ComponentsShowcaseDemo = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Individual Components Showcase</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pipeline" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pipeline">Pipeline Graph</TabsTrigger>
                <TabsTrigger value="vector">Vector Visualization</TabsTrigger>
                <TabsTrigger value="performance">Performance Monitor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pipeline" className="mt-4">
                <div className="h-96 border rounded-lg">
                  <PipelineGraph
                    stages={sampleStages}
                    edges={sampleEdges}
                    onNodeClick={(event, node) => console.log('Node clicked:', node)}
                    onNodeHover={(event, node) => console.log('Node hovered:', node)}
                    showTooltips={true}
                    realTimeData={sampleData}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="vector" className="mt-4">
                <QdrantVectorVisualization 
                  collectionName="demo"
                  onPointSelect={(point) => console.log('Vector point selected:', point)}
                  showControls={true}
                  autoRefresh={false}
                />
              </TabsContent>
              
              <TabsContent value="performance" className="mt-4">
                <PerformanceMonitor 
                  pipelineStats={{
                    cpuUsage: sampleData?.system_health?.cpu_percent || 0,
                    memoryUsage: sampleData?.system_health?.memory_percent || 0,
                    gpuUtilization: sampleData?.gpu_performance?.[0]?.utilization || 0,
                    gpuTemperature: sampleData?.gpu_performance?.[0]?.temperature || 0,
                    totalQueries: sampleData?.pipeline_status?.queries_per_minute || 0,
                    avgResponseTime: sampleData?.pipeline_status?.avg_response_time || 0,
                    activeQueries: sampleData?.pipeline_status?.active_queries || 0,
                    isConnected: true
                  }}
                  showCharts={true}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  return (
    <div className="pipeline-visualization-demo min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pipeline Visualization Demo</h1>
              <p className="text-sm text-gray-500">Interactive demonstration of enhanced pipeline visualization features</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Sample data updates every 3 seconds
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setDemoMode('full')}
                  variant={demoMode === 'full' ? 'default' : 'outline'}
                  size="sm"
                >
                  Full Dashboard
                </Button>
                <Button
                  onClick={() => setDemoMode('components')}
                  variant={demoMode === 'components' ? 'default' : 'outline'}
                  size="sm"
                >
                  Components
                </Button>
                <Button
                  onClick={() => setDemoMode('custom')}
                  variant={demoMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                >
                  Custom
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {demoMode === 'full' && <EnhancedPipelineDashboard />}
        {demoMode === 'components' && <ComponentsShowcaseDemo />}
        {demoMode === 'custom' && <CustomImplementationDemo />}
      </div>
    </div>
  );
};

export default PipelineVisualizationDemo;
