// File: frontend/rag-ui-new/src/components/monitoring/widgets/InsightsWidget.jsx
// InsightsWidget - AI-powered insights, recommendations, and predictive analytics

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  Brain, Lightbulb, TrendingUp, Target, Zap, AlertTriangle,
  CheckCircle, Clock, BarChart3, PieChart, Activity, Settings,
  RefreshCw, ThumbsUp, ThumbsDown, ExternalLink, Bookmark,
  Star, Filter, Search, ChevronRight, Eye, EyeOff
} from 'lucide-react';

const InsightsWidget = ({ 
  insights = [], 
  onInsightAction,
  onInsightFeedback,
  showCategories = true,
  showConfidence = true,
  autoRefresh = true,
  refreshInterval = 60000 
}) => {
  const [currentInsights, setCurrentInsights] = useState(insights);
  const [filteredInsights, setFilteredInsights] = useState(insights);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedInsight, setExpandedInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showImplemented, setShowImplemented] = useState(false);

  // Insight categories and types
  const categories = {
    performance: {
      label: 'Performance',
      icon: Zap,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    },
    optimization: {
      label: 'Optimization',
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    security: {
      label: 'Security',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200'
    },
    cost: {
      label: 'Cost Savings',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    prediction: {
      label: 'Predictions',
      icon: Brain,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    maintenance: {
      label: 'Maintenance',
      icon: Settings,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200'
    }
  };

  const insightTypes = {
    recommendation: { label: 'Recommendation', icon: Lightbulb },
    prediction: { label: 'Prediction', icon: Brain },
    anomaly: { label: 'Anomaly Detection', icon: AlertTriangle },
    trend: { label: 'Trend Analysis', icon: TrendingUp },
    optimization: { label: 'Optimization', icon: Target }
  };

  // Sample insights for demonstration
  const sampleInsights = [
    {
      id: '1',
      title: 'GPU Memory Optimization Opportunity',
      description: 'Analysis shows GPU memory usage patterns suggest implementing model quantization could reduce memory consumption by 30% while maintaining 98% accuracy.',
      category: 'optimization',
      type: 'recommendation',
      confidence: 0.92,
      impact: 'high',
      effort: 'medium',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      source: 'Performance Analyzer',
      implemented: false,
      bookmarked: false,
      feedback: null,
      metrics: {
        potential_memory_savings: '4.2GB',
        accuracy_retention: '98.2%',
        implementation_time: '2-3 days'
      },
      actions: [
        { label: 'Implement Quantization', action: 'implement_quantization', primary: true },
        { label: 'View Analysis', action: 'view_analysis' },
        { label: 'Schedule Implementation', action: 'schedule_implementation' }
      ],
      relatedMetrics: ['gpu_memory_usage', 'model_accuracy', 'inference_speed']
    },
    {
      id: '2',
      title: 'Predicted Database Connection Bottleneck',
      description: 'Based on current growth trends, database connection pool will reach capacity within 48 hours during peak usage periods.',
      category: 'prediction',
      type: 'prediction',
      confidence: 0.87,
      impact: 'high',
      effort: 'low',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      source: 'Predictive Analytics',
      implemented: false,
      bookmarked: true,
      feedback: null,
      metrics: {
        predicted_time: '48 hours',
        current_utilization: '78%',
        growth_rate: '12%/day'
      },
      actions: [
        { label: 'Increase Pool Size', action: 'increase_pool_size', primary: true },
        { label: 'Set Up Monitoring', action: 'setup_monitoring' },
        { label: 'View Trend Analysis', action: 'view_trends' }
      ],
      relatedMetrics: ['db_connections', 'response_time', 'error_rate']
    },
    {
      id: '3',
      title: 'Document Processing Pipeline Efficiency',
      description: 'Implementing batch processing for similar document types could improve throughput by 45% and reduce processing costs.',
      category: 'performance',
      type: 'optimization',
      confidence: 0.89,
      impact: 'medium',
      effort: 'medium',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      source: 'Pipeline Optimizer',
      implemented: false,
      bookmarked: false,
      feedback: 'positive',
      metrics: {
        throughput_improvement: '45%',
        cost_reduction: '23%',
        processing_time_saved: '2.3 hours/day'
      },
      actions: [
        { label: 'Enable Batch Processing', action: 'enable_batch_processing', primary: true },
        { label: 'Run Simulation', action: 'run_simulation' },
        { label: 'View Implementation Guide', action: 'view_guide' }
      ],
      relatedMetrics: ['processing_throughput', 'queue_size', 'processing_cost']
    },
    {
      id: '4',
      title: 'Unusual Query Pattern Detected',
      description: 'Anomalous spike in complex queries detected. Pattern suggests potential inefficient client implementation or possible security concern.',
      category: 'security',
      type: 'anomaly',
      confidence: 0.76,
      impact: 'medium',
      effort: 'low',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      source: 'Anomaly Detector',
      implemented: false,
      bookmarked: false,
      feedback: null,
      metrics: {
        query_complexity_increase: '340%',
        affected_endpoints: '3',
        time_window: '2 hours'
      },
      actions: [
        { label: 'Investigate Queries', action: 'investigate_queries', primary: true },
        { label: 'Review Access Logs', action: 'review_logs' },
        { label: 'Set Up Alert', action: 'setup_alert' }
      ],
      relatedMetrics: ['query_complexity', 'response_time', 'error_rate']
    },
    {
      id: '5',
      title: 'Cost Optimization: Off-Peak Resource Scaling',
      description: 'Analysis shows 40% of compute resources are underutilized during off-peak hours. Implementing auto-scaling could save $1,200/month.',
      category: 'cost',
      type: 'recommendation',
      confidence: 0.94,
      impact: 'high',
      effort: 'low',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      source: 'Cost Optimizer',
      implemented: true,
      bookmarked: false,
      feedback: 'positive',
      metrics: {
        potential_savings: '$1,200/month',
        resource_utilization: '40%',
        implementation_effort: '4 hours'
      },
      actions: [
        { label: 'View Savings Report', action: 'view_savings' },
        { label: 'Adjust Scaling Policy', action: 'adjust_scaling' }
      ],
      relatedMetrics: ['resource_utilization', 'cost_per_hour', 'scaling_events']
    }
  ];

  // Initialize with sample data if no insights provided
  useEffect(() => {
    if (insights.length === 0) {
      setCurrentInsights(sampleInsights);
    } else {
      setCurrentInsights(insights);
    }
  }, [insights]);

  // Fetch insights from API
  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/monitoring/insights');
      const data = await response.json();
      setCurrentInsights(data.insights || sampleInsights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setCurrentInsights(sampleInsights);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh insights
  useEffect(() => {
    if (autoRefresh) {
      fetchInsights();
      const interval = setInterval(fetchInsights, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Filter insights
  useEffect(() => {
    let filtered = currentInsights.filter(insight => {
      if (!showImplemented && insight.implemented) return false;
      
      if (selectedCategory !== 'all' && insight.category !== selectedCategory) return false;
      if (selectedType !== 'all' && insight.type !== selectedType) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          insight.title.toLowerCase().includes(searchLower) ||
          insight.description.toLowerCase().includes(searchLower) ||
          insight.source.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });

    // Sort by confidence and impact
    const impactOrder = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => {
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.confidence - a.confidence;
    });

    setFilteredInsights(filtered);
  }, [currentInsights, selectedCategory, selectedType, searchTerm, showImplemented]);

  // Handle insight actions
  const handleInsightAction = (insight, action) => {
    onInsightAction?.(insight, action);
    
    if (action === 'implement_quantization' || action === 'increase_pool_size' || action === 'enable_batch_processing') {
      setCurrentInsights(prev => 
        prev.map(i => 
          i.id === insight.id 
            ? { ...i, implemented: true }
            : i
        )
      );
    }
  };

  // Handle feedback
  const handleFeedback = (insightId, feedback) => {
    onInsightFeedback?.(insightId, feedback);
    
    setCurrentInsights(prev => 
      prev.map(i => 
        i.id === insightId 
          ? { ...i, feedback }
          : i
      )
    );
  };

  // Toggle bookmark
  const toggleBookmark = (insightId) => {
    setCurrentInsights(prev => 
      prev.map(i => 
        i.id === insightId 
          ? { ...i, bookmarked: !i.bookmarked }
          : i
      )
    );
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get impact badge variant
  const getImpactVariant = (impact) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights & Recommendations
            <Badge variant="secondary" className="ml-2">
              {filteredInsights.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImplemented(!showImplemented)}
            >
              {showImplemented ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showImplemented ? 'Hide' : 'Show'} Implemented
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInsights}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Insight Summary */}
        <div className="flex gap-2 mt-2">
          {Object.entries(categories).map(([key, config]) => {
            const count = currentInsights.filter(i => i.category === key && !i.implemented).length;
            if (count === 0) return null;
            
            return (
              <Badge
                key={key}
                variant="outline"
                className="text-xs"
                style={{ color: config.color }}
              >
                {count} {config.label}
              </Badge>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        {showCategories && (
          <div className="mb-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search insights..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(categories).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(insightTypes).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Insights List */}
        <div className="space-y-4">
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No insights available</p>
              <p className="text-sm">AI is analyzing your system for optimization opportunities</p>
            </div>
          ) : (
            filteredInsights.map((insight) => {
              const categoryConfig = categories[insight.category];
              const typeConfig = insightTypes[insight.type];
              const CategoryIcon = categoryConfig.icon;
              const TypeIcon = typeConfig.icon;
              const isExpanded = expandedInsight === insight.id;
              
              return (
                <div
                  key={insight.id}
                  className={`border rounded-lg p-4 transition-all ${categoryConfig.border} ${categoryConfig.bg} ${
                    insight.implemented ? 'opacity-70' : ''
                  }`}
                >
                  {/* Insight Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-1">
                        <CategoryIcon className={`h-5 w-5 ${categoryConfig.color}`} />
                        <TypeIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          <Badge variant={getImpactVariant(insight.impact)} className="text-xs">
                            {insight.impact} impact
                          </Badge>
                          {showConfidence && (
                            <Badge variant="outline" className="text-xs">
                              <span className={getConfidenceColor(insight.confidence)}>
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            </Badge>
                          )}
                          {insight.implemented && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Implemented
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(insight.timestamp).toLocaleString()}
                          </span>
                          <span>{insight.source}</span>
                          <span className="capitalize">{typeConfig.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBookmark(insight.id)}
                      >
                        <Bookmark className={`h-4 w-4 ${insight.bookmarked ? 'fill-current text-yellow-500' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                      >
                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {!insight.implemented && insight.actions && (
                    <div className="flex gap-2 mb-3">
                      {insight.actions.slice(0, 2).map((action, index) => (
                        <Button
                          key={index}
                          variant={action.primary ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleInsightAction(insight, action.action)}
                          className="text-xs"
                        >
                          {action.label}
                        </Button>
                      ))}
                      {insight.actions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedInsight(insight.id)}
                          className="text-xs"
                        >
                          +{insight.actions.length - 2} more
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-gray-200">
                      {/* Metrics */}
                      {insight.metrics && (
                        <div className="mb-4">
                          <h5 className="font-medium text-sm mb-2">Key Metrics</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(insight.metrics).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <div className="text-gray-600 text-xs">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                <div className="font-semibold">{value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All Actions */}
                      {insight.actions && insight.actions.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-sm mb-2">Available Actions</h5>
                          <div className="flex gap-2 flex-wrap">
                            {insight.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant={action.primary ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleInsightAction(insight, action.action)}
                                className="text-xs"
                                disabled={insight.implemented && action.primary}
                              >
                                {action.label}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {!insight.implemented && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Was this helpful?</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(insight.id, 'positive')}
                            className={insight.feedback === 'positive' ? 'text-green-600' : ''}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(insight.id, 'negative')}
                            className={insight.feedback === 'negative' ? 'text-red-600' : ''}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsWidget;
