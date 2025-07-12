// File: frontend/rag-ui-new/src/components/monitoring/widgets/MetricsWidget.jsx
// MetricsWidget - Displays key performance metrics with visualizations

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  TrendingUp, TrendingDown, Activity, Zap, Database, 
  Clock, Users, FileText, Brain, AlertCircle, CheckCircle,
  BarChart3, PieChart, LineChart, Settings, RefreshCw
} from 'lucide-react';

const MetricsWidget = ({ 
  metrics = {}, 
  config = {}, 
  onConfigChange,
  refreshInterval = 30000,
  showTrends = true,
  showComparisons = true 
}) => {
  const [currentMetrics, setCurrentMetrics] = useState(metrics);
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Default metrics configuration
  const defaultMetrics = [
    {
      id: 'response_time',
      name: 'Avg Response Time',
      value: currentMetrics.response_time || 0,
      unit: 'ms',
      icon: Clock,
      color: '#3b82f6',
      target: 500,
      trend: 'down', // down is good for response time
      format: (val) => `${val.toFixed(0)}ms`
    },
    {
      id: 'throughput',
      name: 'Requests/sec',
      value: currentMetrics.throughput || 0,
      unit: 'req/s',
      icon: Activity,
      color: '#10b981',
      target: 100,
      trend: 'up',
      format: (val) => `${val.toFixed(1)}/s`
    },
    {
      id: 'error_rate',
      name: 'Error Rate',
      value: currentMetrics.error_rate || 0,
      unit: '%',
      icon: AlertCircle,
      color: '#ef4444',
      target: 1,
      trend: 'down',
      format: (val) => `${val.toFixed(2)}%`
    },
    {
      id: 'active_users',
      name: 'Active Users',
      value: currentMetrics.active_users || 0,
      unit: 'users',
      icon: Users,
      color: '#8b5cf6',
      target: 50,
      trend: 'up',
      format: (val) => val.toString()
    },
    {
      id: 'documents_processed',
      name: 'Documents Processed',
      value: currentMetrics.documents_processed || 0,
      unit: 'docs',
      icon: FileText,
      color: '#06b6d4',
      target: 1000,
      trend: 'up',
      format: (val) => val.toLocaleString()
    },
    {
      id: 'gpu_utilization',
      name: 'GPU Utilization',
      value: currentMetrics.gpu_utilization || 0,
      unit: '%',
      icon: Zap,
      color: '#f59e0b',
      target: 80,
      trend: 'stable',
      format: (val) => `${val.toFixed(1)}%`
    },
    {
      id: 'memory_usage',
      name: 'Memory Usage',
      value: currentMetrics.memory_usage || 0,
      unit: 'GB',
      icon: Database,
      color: '#84cc16',
      target: 16,
      trend: 'stable',
      format: (val) => `${val.toFixed(1)}GB`
    },
    {
      id: 'vector_operations',
      name: 'Vector Ops/sec',
      value: currentMetrics.vector_operations || 0,
      unit: 'ops/s',
      icon: Brain,
      color: '#ec4899',
      target: 1000,
      trend: 'up',
      format: (val) => `${val.toFixed(0)}/s`
    }
  ];

  // Fetch metrics data
  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/monitoring/metrics?timeRange=${selectedTimeRange}`);
      const data = await response.json();
      setCurrentMetrics(data.current);
      setHistoricalData(data.historical || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, selectedTimeRange]);

  // Calculate trend direction
  const getTrendDirection = (current, previous, preferredTrend) => {
    if (!previous) return 'stable';
    
    const change = current - previous;
    const percentChange = (change / previous) * 100;
    
    if (Math.abs(percentChange) < 2) return 'stable';
    
    if (preferredTrend === 'down') {
      return change < 0 ? 'good' : 'bad';
    } else if (preferredTrend === 'up') {
      return change > 0 ? 'good' : 'bad';
    }
    
    return change > 0 ? 'up' : 'down';
  };

  // Get trend icon and color
  const getTrendDisplay = (trendDirection) => {
    switch (trendDirection) {
      case 'good':
        return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' };
      case 'bad':
        return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' };
      case 'up':
        return { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'down':
        return { icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-100' };
      default:
        return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Get status color based on target
  const getStatusColor = (value, target, preferredTrend) => {
    const ratio = value / target;
    
    if (preferredTrend === 'down') {
      if (ratio <= 0.5) return 'text-green-600';
      if (ratio <= 1) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (ratio >= 1.2) return 'text-green-600';
      if (ratio >= 0.8) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  // Mini chart component
  const MiniChart = ({ data, color }) => {
    if (!data || data.length < 2) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 20 - ((value - min) / range) * 20;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="60" height="20" className="opacity-70">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="5m">5 minutes</option>
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigChange?.()}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {defaultMetrics.map((metric) => {
            const MetricIcon = metric.icon;
            const previousValue = historicalData.length > 0 
              ? historicalData[historicalData.length - 2]?.[metric.id] 
              : null;
            
            const trendDirection = getTrendDirection(
              metric.value, 
              previousValue, 
              metric.trend
            );
            
            const trendDisplay = getTrendDisplay(trendDirection);
            const TrendIcon = trendDisplay.icon;
            const statusColor = getStatusColor(metric.value, metric.target, metric.trend);
            
            const chartData = historicalData.map(d => d[metric.id]).filter(v => v !== undefined);
            
            return (
              <div
                key={metric.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${metric.color}20` }}
                    >
                      <MetricIcon 
                        className="h-4 w-4" 
                        style={{ color: metric.color }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {metric.name}
                    </span>
                  </div>
                  
                  {showTrends && (
                    <div className={`p-1 rounded ${trendDisplay.bg}`}>
                      <TrendIcon className={`h-3 w-3 ${trendDisplay.color}`} />
                    </div>
                  )}
                </div>

                {/* Value */}
                <div className="mb-2">
                  <div className={`text-2xl font-bold ${statusColor}`}>
                    {metric.format(metric.value)}
                  </div>
                  {showComparisons && (
                    <div className="text-xs text-gray-500">
                      Target: {metric.format(metric.target)}
                    </div>
                  )}
                </div>

                {/* Mini Chart */}
                {showTrends && chartData.length > 1 && (
                  <div className="flex justify-between items-end">
                    <MiniChart data={chartData} color={metric.color} />
                    {previousValue && (
                      <div className="text-xs text-gray-500">
                        {metric.value > previousValue ? '+' : ''}
                        {((metric.value - previousValue) / previousValue * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}

                {/* Status Badge */}
                <div className="mt-2">
                  <Badge 
                    variant={
                      trendDirection === 'good' ? 'default' :
                      trendDirection === 'bad' ? 'destructive' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {trendDirection === 'good' ? 'Optimal' :
                     trendDirection === 'bad' ? 'Attention' :
                     trendDirection === 'stable' ? 'Stable' :
                     trendDirection === 'up' ? 'Increasing' : 'Decreasing'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {defaultMetrics.filter(m => 
                  getTrendDirection(m.value, historicalData[historicalData.length - 2]?.[m.id], m.trend) === 'good'
                ).length}
              </div>
              <div className="text-xs text-gray-600">Optimal</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">
                {defaultMetrics.filter(m => 
                  getTrendDirection(m.value, historicalData[historicalData.length - 2]?.[m.id], m.trend) === 'stable'
                ).length}
              </div>
              <div className="text-xs text-gray-600">Stable</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {defaultMetrics.filter(m => 
                  getTrendDirection(m.value, historicalData[historicalData.length - 2]?.[m.id], m.trend) === 'bad'
                ).length}
              </div>
              <div className="text-xs text-gray-600">Attention</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {Math.round(defaultMetrics.reduce((sum, m) => sum + (m.value / m.target * 100), 0) / defaultMetrics.length)}%
              </div>
              <div className="text-xs text-gray-600">Avg Performance</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsWidget;
