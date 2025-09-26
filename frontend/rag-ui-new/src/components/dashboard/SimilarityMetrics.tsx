import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import RotatingText from '../RotatingText';
import ElectricBorder from '../ElectricBorder';
import { BarChart3, TrendingUp, Target, Zap, Activity, Database } from 'lucide-react';

interface SimilarityMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
  color: string;
}

interface SimilarityMetricsProps {
  selectedNode?: any;
  similarityData?: any[];
  className?: string;
}

const SimilarityMetrics: React.FC<SimilarityMetricsProps> = ({
  selectedNode,
  similarityData = [],
  className = ''
}) => {
  const [metrics, setMetrics] = useState<SimilarityMetric[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (selectedNode && similarityData.length > 0) {
      setIsAnimating(true);
      
      // Generate similarity metrics based on selected node
      const newMetrics: SimilarityMetric[] = [
        {
          id: 'cosine-similarity',
          name: 'Cosine Similarity',
          value: Math.random() * 0.4 + 0.6, // 0.6-1.0
          threshold: 0.7,
          trend: 'up',
          description: 'Vector direction similarity',
          color: 'blue'
        },
        {
          id: 'semantic-similarity',
          name: 'Semantic Similarity',
          value: Math.random() * 0.3 + 0.5, // 0.5-0.8
          threshold: 0.6,
          trend: 'stable',
          description: 'Content meaning similarity',
          color: 'green'
        },
        {
          id: 'structural-similarity',
          name: 'Structural Similarity',
          value: Math.random() * 0.4 + 0.4, // 0.4-0.8
          threshold: 0.5,
          trend: 'down',
          description: 'Document structure similarity',
          color: 'purple'
        },
        {
          id: 'temporal-similarity',
          name: 'Temporal Similarity',
          value: Math.random() * 0.5 + 0.3, // 0.3-0.8
          threshold: 0.4,
          trend: 'up',
          description: 'Time-based similarity',
          color: 'orange'
        }
      ];

      setMetrics(newMetrics);
      
      // Reset animation state after delay
      setTimeout(() => setIsAnimating(false), 1000);
    }
  }, [selectedNode, similarityData]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />;
      default:
        return <Activity className="h-3 w-3 text-yellow-400" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-900/20 border-blue-500 text-blue-300',
      green: 'bg-green-900/20 border-green-500 text-green-300',
      purple: 'bg-purple-900/20 border-purple-500 text-purple-300',
      orange: 'bg-orange-900/20 border-orange-500 text-orange-300'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getProgressColor = (value: number, threshold: number) => {
    const ratio = value / threshold;
    if (ratio >= 1) return 'bg-green-500';
    if (ratio >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!selectedNode) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <RotatingText
              text="Select a node to view similarity metrics"
              className="text-gray-400 text-lg"
              tag="p"
              duration={3}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Similarity Metrics
          </CardTitle>
          <ElectricBorder>
            <Badge variant="outline" className="bg-blue-900/20 border-blue-500 text-blue-300">
              <Zap className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          </ElectricBorder>
        </div>
        
        <div className="mt-2">
          <RotatingText
            text={`Node: ${selectedNode.id || 'Unknown'}`}
            className="text-sm text-blue-400 font-medium"
            tag="p"
            duration={2}
            delay={100}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.id}
            className={`p-4 rounded-lg border transition-all duration-500 ${
              isAnimating ? 'animate-pulse' : ''
            }`}
            style={{ animationDelay: `${index * 200}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white">{metric.name}</h4>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getColorClasses(metric.color)}>
                  {(metric.value * 100).toFixed(1)}%
                </Badge>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  Threshold: {(metric.threshold * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>100%</span>
              </div>
              <div className="relative">
                <Progress
                  value={metric.value * 100}
                  className="h-2 bg-gray-700"
                />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-1000 ${
                    getProgressColor(metric.value, metric.threshold)
                  }`}
                  style={{
                    width: `${metric.value * 100}%`,
                    animationDelay: `${index * 200}ms`
                  }}
                />
                {/* Threshold line */}
                <div
                  className="absolute top-0 h-2 w-0.5 bg-white opacity-60"
                  style={{ left: `${metric.threshold * 100}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2">{metric.description}</p>
          </div>
        ))}

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {metrics.filter(m => m.value >= m.threshold).length}
              </div>
              <div className="text-xs text-gray-400">Above Threshold</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">Average Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {similarityData.length}
              </div>
              <div className="text-xs text-gray-400">Total Connections</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimilarityMetrics;
