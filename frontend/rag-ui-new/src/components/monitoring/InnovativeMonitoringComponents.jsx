// File: frontend/src/components/monitoring/InnovativeMonitoringComponents.jsx
// Version 2: Revolutionary RAG Pipeline Monitoring UI Components
import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Sankey, Treemap
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Cpu, Database, 
  FileText, Gauge, Heart, Layers, Network, Zap, TrendingUp,
  Brain, Eye, Target, Workflow, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';

// In InnovativeMonitoringDashboard.jsx
import PipelineJourneyMap from './core/PipelineJourneyMap';
import LiveDataFlowAnimation from './core/LiveDataFlowAnimation';
import SmartHealthIndicators from './core/SmartHealthIndicators';
import CustomizableMonitoringViews from './advanced/CustomizableMonitoringViews';
import MetricsWidget from './components/monitoring/widgets/MetricsWidget';
import AlertWidget from './components/monitoring/widgets/AlertWidget';
import InsightsWidget from './components/monitoring/widgets/InsightsWidget';

// ============================================================================
// 1. LIVE PIPELINE FLOW VISUALIZATION
// ============================================================================

const LivePipelineFlow = ({ pipelineData, activeDocuments, realTimeMetrics }) => {
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showParticles, setShowParticles] = useState(true);
  
  const pipelineStages = [
    { id: 'upload', name: 'Document Upload', icon: FileText, color: '#3b82f6' },
    { id: 'extract', name: 'Text Extraction', icon: Eye, color: '#8b5cf6' },
    { id: 'embed', name: 'Embedding Generation', icon: Brain, color: '#06b6d4' },
    { id: 'store', name: 'Vector Storage', icon: Database, color: '#10b981' },
    { id: 'query', name: 'Query Processing', icon: Target, color: '#f59e0b' }
  ];

  return (
    <Card className="w-full h-96 relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Live Pipeline Flow
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowParticles(!showParticles)}
            >
              {showParticles ? 'Hide' : 'Show'} Particles
            </Button>
            <select 
              value={animationSpeed} 
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value={0.5}>Slow</option>
              <option value={1}>Normal</option>
              <option value={2}>Fast</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-full relative">
        {/* Pipeline Stages */}
        <div className="flex justify-between items-center h-20 relative z-10">
          {pipelineStages.map((stage, index) => (
            <div key={stage.id} className="flex flex-col items-center">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
                  realTimeMetrics?.activeStage === stage.id ? 'scale-110 shadow-xl' : ''
                }`}
                style={{ backgroundColor: stage.color }}
              >
                <stage.icon className="h-6 w-6" />
              </div>
              <span className="text-xs mt-1 text-center font-medium">{stage.name}</span>
              <Badge variant="secondary" className="text-xs mt-1">
                {realTimeMetrics?.stageCounts?.[stage.id] || 0}
              </Badge>
            </div>
          ))}
        </div>

        {/* Animated Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {pipelineStages.slice(0, -1).map((stage, index) => (
            <g key={`connection-${index}`}>
              {/* Connection Line */}
              <line
                x1={`${(index + 1) * 20}%`}
                y1="40%"
                x2={`${(index + 2) * 20}%`}
                y2="40%"
                stroke="#e5e7eb"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              
              {/* Animated Data Particles */}
              {showParticles && (
                <circle
                  r="3"
                  fill={pipelineStages[index].color}
                  opacity="0.8"
                >
                  <animateMotion
                    dur={`${2 / animationSpeed}s`}
                    repeatCount="indefinite"
                    path={`M ${(index + 1) * 20}% 40% L ${(index + 2) * 20}% 40%`}
                  />
                </circle>
              )}
            </g>
          ))}
        </svg>

        {/* Real-Time Metrics Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{realTimeMetrics?.throughput || 0}</div>
              <div className="text-gray-600">Docs/min</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{realTimeMetrics?.avgLatency || 0}ms</div>
              <div className="text-gray-600">Avg Latency</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">{realTimeMetrics?.queueSize || 0}</div>
              <div className="text-gray-600">Queue Size</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">{realTimeMetrics?.errorRate || 0}%</div>
              <div className="text-gray-600">Error Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// 2. ADAPTIVE HEALTH DASHBOARD
// ============================================================================

const AdaptiveHealthDashboard = ({ systemHealth, componentHealth, predictions }) => {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');

  const getHealthColor = (score) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    if (score >= 50) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getHealthIcon = (score) => {
    if (score >= 90) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return AlertTriangle;
  };

  const healthComponents = [
    { id: 'database', name: 'PostgreSQL', score: componentHealth?.database || 95, type: 'database' },
    { id: 'vector_db', name: 'Qdrant', score: componentHealth?.vector_db || 88, type: 'vector' },
    { id: 'llm', name: 'Mistral LLM', score: componentHealth?.llm || 92, type: 'ai' },
    { id: 'embedding', name: 'Embeddings', score: componentHealth?.embedding || 94, type: 'ai' },
    { id: 'api', name: 'API Gateway', score: componentHealth?.api || 97, type: 'api' },
    { id: 'frontend', name: 'Frontend', score: componentHealth?.frontend || 99, type: 'ui' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Health Score */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={getHealthColor(systemHealth?.overall || 93)}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - (systemHealth?.overall || 93) / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{systemHealth?.overall || 93}%</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="font-semibold text-lg">Excellent</div>
            <div className="text-sm text-gray-600">All systems operational</div>
          </div>
        </CardContent>
      </Card>

      {/* Component Health Grid */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Component Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {healthComponents.map((component) => {
              const HealthIcon = getHealthIcon(component.score);
              return (
                <div
                  key={component.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedComponent === component.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedComponent(component.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <HealthIcon 
                      className="h-5 w-5" 
                      style={{ color: getHealthColor(component.score) }}
                    />
                    <span className="font-semibold">{component.score}%</span>
                  </div>
                  <div className="text-sm font-medium">{component.name}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${component.score}%`,
                        backgroundColor: getHealthColor(component.score)
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Health Insights */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predictive Health Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predictions?.insights?.map((insight, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    insight.severity === 'high' ? 'bg-red-100 text-red-600' :
                    insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{insight.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {Math.round(insight.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
            )) || (
              <div className="col-span-3 text-center text-gray-500 py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div>AI insights will appear here as the system learns your patterns</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// 3. INTERACTIVE PERFORMANCE ANALYTICS
// ============================================================================

const InteractivePerformanceAnalytics = ({ performanceData, timeRange, onTimeRangeChange }) => {
  const [selectedMetric, setSelectedMetric] = useState('latency');
  const [viewMode, setViewMode] = useState('chart');
  const [drillDownData, setDrillDownData] = useState(null);

  const performanceMetrics = {
    latency: {
      name: 'Response Latency',
      unit: 'ms',
      color: '#3b82f6',
      icon: Clock,
      data: performanceData?.latency || []
    },
    throughput: {
      name: 'Throughput',
      unit: 'req/s',
      color: '#10b981',
      icon: Zap,
      data: performanceData?.throughput || []
    },
    gpu_utilization: {
      name: 'GPU Utilization',
      unit: '%',
      color: '#8b5cf6',
      icon: Cpu,
      data: performanceData?.gpu_utilization || []
    },
    memory_usage: {
      name: 'Memory Usage',
      unit: 'GB',
      color: '#f59e0b',
      icon: Gauge,
      data: performanceData?.memory_usage || []
    }
  };

  const handleDataPointClick = (data, index) => {
    setDrillDownData({ ...data, index });
  };

  return (
    <div className="space-y-6">
      {/* Metric Selection and Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Analytics
            </CardTitle>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => onTimeRangeChange(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              <div className="flex border rounded">
                <button
                  className={`px-3 py-1 text-sm ${viewMode === 'chart' ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => setViewMode('chart')}
                >
                  Chart
                </button>
                <button
                  className={`px-3 py-1 text-sm ${viewMode === 'heatmap' ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => setViewMode('heatmap')}
                >
                  Heatmap
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Metric Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {Object.entries(performanceMetrics).map(([key, metric]) => {
              const MetricIcon = metric.icon;
              return (
                <button
                  key={key}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                    selectedMetric === key 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMetric(key)}
                >
                  <MetricIcon className="h-4 w-4" />
                  {metric.name}
                </button>
              );
            })}
          </div>

          {/* Visualization Area */}
          <div className="h-80">
            {viewMode === 'chart' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={performanceMetrics[selectedMetric].data}
                  onClick={handleDataPointClick}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [
                      `${value} ${performanceMetrics[selectedMetric].unit}`,
                      performanceMetrics[selectedMetric].name
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={performanceMetrics[selectedMetric].color}
                    fill={performanceMetrics[selectedMetric].color}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid grid-cols-24 gap-1 h-full">
                {/* Heatmap visualization */}
                {Array.from({ length: 24 * 7 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-blue-100 hover:bg-blue-200 cursor-pointer rounded"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${Math.random() * 0.8 + 0.2})`
                    }}
                    title={`Hour ${i % 24}, Day ${Math.floor(i / 24)}`}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drill-Down Panel */}
      {drillDownData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Detailed Analysis</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setDrillDownData(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Timestamp</div>
                <div className="font-semibold">{drillDownData.timestamp}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Value</div>
                <div className="font-semibold">
                  {drillDownData.value} {performanceMetrics[selectedMetric].unit}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Trend</div>
                <div className="font-semibold text-green-600">↗ +5.2%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// 4. SMART INSIGHTS PANEL
// ============================================================================

const SmartInsightsPanel = ({ insights, anomalies, recommendations }) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [insightFilter, setInsightFilter] = useState('all');

  const insightTypes = {
    performance: { name: 'Performance', color: 'blue', icon: Zap },
    security: { name: 'Security', color: 'red', icon: AlertTriangle },
    optimization: { name: 'Optimization', color: 'green', icon: TrendingUp },
    prediction: { name: 'Prediction', color: 'purple', icon: Brain }
  };

  const filteredInsights = insights?.filter(insight => 
    insightFilter === 'all' || insight.type === insightFilter
  ) || [];

  return (
    <Card className="h-96">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
          <div className="flex gap-2">
            <select
              value={insightFilter}
              onChange={(e) => setInsightFilter(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="all">All Types</option>
              {Object.entries(insightTypes).map(([key, type]) => (
                <option key={key} value={key}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="recommendations">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="h-full overflow-y-auto">
            <div className="space-y-3">
              {filteredInsights.map((insight, index) => {
                const InsightIcon = insightTypes[insight.type]?.icon || Brain;
                const colorClass = `text-${insightTypes[insight.type]?.color || 'gray'}-600`;
                
                return (
                  <div key={index} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-gray-100 ${colorClass}`}>
                        <InsightIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{insight.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confidence
                          </Badge>
                          <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                            {insight.impact} impact
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredInsights.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div>No insights available for the selected filter</div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="anomalies" className="h-full overflow-y-auto">
            <div className="space-y-3">
              {anomalies?.map((anomaly, index) => (
                <div key={index} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{anomaly.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{anomaly.description}</div>
                      <div className="text-xs text-orange-600 mt-2">
                        Detected at {anomaly.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <div>No anomalies detected</div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="h-full overflow-y-auto">
            <div className="space-y-3">
              {recommendations?.map((rec, index) => (
                <div key={index} className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{rec.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{rec.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          Apply
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <div>No recommendations at this time</div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// 5. MAIN MONITORING DASHBOARD COMPONENT
// ============================================================================

const InnovativeMonitoringDashboard = () => {
  const [realTimeData, setRealTimeData] = useState({});
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Mock data - replace with actual API calls
  const mockData = {
    pipelineData: {},
    activeDocuments: [],
    realTimeMetrics: {
      throughput: 45,
      avgLatency: 234,
      queueSize: 12,
      errorRate: 0.2,
      activeStage: 'embed'
    },
    systemHealth: {
      overall: 93
    },
    componentHealth: {
      database: 95,
      vector_db: 88,
      llm: 92,
      embedding: 94,
      api: 97,
      frontend: 99
    },
    performanceData: {
      latency: Array.from({ length: 24 }, (_, i) => ({
        timestamp: `${i}:00`,
        value: Math.random() * 100 + 200
      })),
      throughput: Array.from({ length: 24 }, (_, i) => ({
        timestamp: `${i}:00`,
        value: Math.random() * 50 + 30
      }))
    },
    insights: [
      {
        type: 'performance',
        title: 'GPU Memory Optimization Opportunity',
        description: 'GPU memory usage could be reduced by 15% with batch size optimization',
        confidence: 87,
        impact: 'medium'
      },
      {
        type: 'prediction',
        title: 'Peak Load Prediction',
        description: 'System load expected to increase by 40% in the next 2 hours',
        confidence: 92,
        impact: 'high'
      }
    ],
    anomalies: [],
    recommendations: [
      {
        title: 'Increase Vector Database Cache',
        description: 'Increasing Qdrant cache size could improve query performance by 25%'
      }
    ]
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RAG Pipeline Monitoring</h1>
          <p className="text-gray-600">Real-time insights and performance analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-sm">Live</span>
          </div>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Live Pipeline Flow */}
      <LivePipelineFlow 
        pipelineData={mockData.pipelineData}
        activeDocuments={mockData.activeDocuments}
        realTimeMetrics={mockData.realTimeMetrics}
      />

      {/* Health Dashboard */}
      <AdaptiveHealthDashboard 
        systemHealth={mockData.systemHealth}
        componentHealth={mockData.componentHealth}
        predictions={{ insights: mockData.insights }}
      />

      {/* Performance Analytics and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractivePerformanceAnalytics 
          performanceData={mockData.performanceData}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
        <SmartInsightsPanel 
          insights={mockData.insights}
          anomalies={mockData.anomalies}
          recommendations={mockData.recommendations}
        />
      </div>
    </div>
  );
};

export default InnovativeMonitoringDashboard;
export {
  LivePipelineFlow,
  AdaptiveHealthDashboard,
  InteractivePerformanceAnalytics,
  SmartInsightsPanel
};
