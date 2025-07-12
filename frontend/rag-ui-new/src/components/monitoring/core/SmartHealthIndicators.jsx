// Smart Health Indicators - Adaptive health monitoring with AI insights
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  Heart, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, 
  Brain, Zap, Database, Cpu, Network, Activity
} from 'lucide-react';

const SmartHealthIndicators = ({ 
  healthData = {}, 
  predictions = [], 
  onComponentClick,
  onRecommendationApply 
}) => {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [healthTrend, setHealthTrend] = useState('stable');
  const [alertLevel, setAlertLevel] = useState('normal');

  const healthComponents = [
    {
      id: 'database',
      name: 'PostgreSQL',
      icon: Database,
      score: healthData.database?.score || 95,
      trend: healthData.database?.trend || 'up',
      status: healthData.database?.status || 'healthy',
      metrics: healthData.database?.metrics || {}
    },
    {
      id: 'vector_db',
      name: 'Qdrant Vector DB',
      icon: Brain,
      score: healthData.vector_db?.score || 88,
      trend: healthData.vector_db?.trend || 'stable',
      status: healthData.vector_db?.status || 'healthy',
      metrics: healthData.vector_db?.metrics || {}
    },
    {
      id: 'llm',
      name: 'Mistral LLM',
      icon: Zap,
      score: healthData.llm?.score || 92,
      trend: healthData.llm?.trend || 'up',
      status: healthData.llm?.status || 'healthy',
      metrics: healthData.llm?.metrics || {}
    },
    {
      id: 'api',
      name: 'API Gateway',
      icon: Network,
      score: healthData.api?.score || 97,
      trend: healthData.api?.trend || 'stable',
      status: healthData.api?.status || 'healthy',
      metrics: healthData.api?.metrics || {}
    },
    {
      id: 'system',
      name: 'System Resources',
      icon: Cpu,
      score: healthData.system?.score || 89,
      trend: healthData.system?.trend || 'down',
      status: healthData.system?.status || 'warning',
      metrics: healthData.system?.metrics || {}
    }
  ];

  const getHealthColor = (score) => {
    if (score >= 90) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
    if (score >= 70) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
    if (score >= 50) return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <CheckCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const overallHealthScore = Math.round(
    healthComponents.reduce((sum, comp) => sum + comp.score, 0) / healthComponents.length
  );

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Smart Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Health Score Circle */}
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke={overallHealthScore >= 90 ? '#10b981' : overallHealthScore >= 70 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - overallHealthScore / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{overallHealthScore}%</span>
                </div>
              </div>

              {/* Health Summary */}
              <div>
                <div className="text-lg font-semibold">
                  {overallHealthScore >= 90 ? 'Excellent' : 
                   overallHealthScore >= 70 ? 'Good' : 
                   overallHealthScore >= 50 ? 'Fair' : 'Poor'}
                </div>
                <div className="text-sm text-gray-600">
                  {healthComponents.filter(c => c.status === 'healthy').length} of {healthComponents.length} components healthy
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {getTrendIcon(healthTrend)}
                  <span className="text-sm text-gray-600">
                    {healthTrend === 'up' ? 'Improving' : healthTrend === 'down' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm">
                View Details
              </Button>
              <Button variant="outline" size="sm">
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Health Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Component Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthComponents.map((component) => {
              const ComponentIcon = component.icon;
              const colors = getHealthColor(component.score);
              
              return (
                <div
                  key={component.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${colors.bg} ${colors.border} ${
                    selectedComponent === component.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedComponent(component.id);
                    onComponentClick?.(component);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ComponentIcon className="h-5 w-5" />
                      <span className="font-medium text-sm">{component.name}</span>
                    </div>
                    {getStatusIcon(component.status)}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{component.score}%</span>
                    {getTrendIcon(component.trend)}
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        component.score >= 90 ? 'bg-green-500' :
                        component.score >= 70 ? 'bg-yellow-500' :
                        component.score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${component.score}%` }}
                    />
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Health Alerts */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Predictive Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.map((prediction, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    prediction.severity === 'high' ? 'bg-red-50 border-red-200' :
                    prediction.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-4 w-4 ${
                          prediction.severity === 'high' ? 'text-red-600' :
                          prediction.severity === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <span className="font-semibold text-sm">{prediction.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(prediction.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{prediction.description}</p>
                      <p className="text-xs text-gray-500">
                        Predicted for: {prediction.timeframe}
                      </p>
                    </div>
                    {prediction.recommendation && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRecommendationApply?.(prediction.recommendation)}
                      >
                        Apply Fix
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Details Panel */}
      {selectedComponent && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {healthComponents.find(c => c.id === selectedComponent)?.name} Details
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedComponent(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(
                healthComponents.find(c => c.id === selectedComponent)?.metrics || {}
              ).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-lg font-semibold mt-1">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartHealthIndicators;