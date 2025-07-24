/**
 * Real-time Metrics Panel
 * Displays live system metrics with charts and indicators
 */

import React, { useState, useEffect } from 'react';
import { 
    Activity, 
    Cpu, 
    MemoryStick, 
    Thermometer, 
    Clock, 
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';
import useTheme from '../hooks/useTheme';

const RealTimeMetricsPanel = ({ metrics = {} }) => {
    const { getThemeClasses, getChartColors, isDark } = useTheme();
    const themeClasses = getThemeClasses();
    const chartColors = getChartColors();
    
    const [historicalData, setHistoricalData] = useState({
        gpu: [],
        queries: [],
        stages: []
    });

    // Update historical data when new metrics arrive
    useEffect(() => {
        const timestamp = Date.now();
        
        setHistoricalData(prev => {
            const newData = { ...prev };
            
            // GPU metrics
            if (metrics.gpu) {
                newData.gpu = [...prev.gpu.slice(-19), {
                    timestamp,
                    utilization: metrics.gpu.gpu_utilization || 0,
                    memory: metrics.gpu.memory_usage || 0,
                    temperature: metrics.gpu.temperature || 0
                }];
            }
            
            // Query metrics
            if (metrics.queries) {
                newData.queries = [...prev.queries.slice(-19), {
                    timestamp,
                    qpm: metrics.queries.queries_per_minute || 0,
                    avgTime: metrics.queries.avg_response_time || 0,
                    active: metrics.queries.active_queries || 0,
                    queue: metrics.queries.queue_depth || 0
                }];
            }
            
            // Stage metrics
            if (metrics.stages) {
                const totalProcessed = Object.values(metrics.stages).reduce(
                    (sum, stage) => sum + (stage.total_processed || 0), 0
                );
                const avgSuccessRate = Object.values(metrics.stages).reduce(
                    (sum, stage) => sum + (stage.success_rate || 100), 0
                ) / Math.max(Object.keys(metrics.stages).length, 1);
                
                newData.stages = [...prev.stages.slice(-19), {
                    timestamp,
                    totalProcessed,
                    avgSuccessRate,
                    activeStages: Object.values(metrics.stages).filter(
                        stage => stage.active_count > 0
                    ).length
                }];
            }
            
            return newData;
        });
    }, [metrics]);

    // Format number with appropriate units
    const formatNumber = (value, unit = '') => {
        if (value === undefined || value === null) return 'N/A';
        
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M${unit}`;
        } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K${unit}`;
        }
        
        return `${Math.round(value)}${unit}`;
    };

    // Get trend indicator
    const getTrendIndicator = (current, previous) => {
        if (!previous || current === previous) {
            return <Minus className="w-4 h-4 text-gray-400" />;
        }
        
        if (current > previous) {
            return <TrendingUp className="w-4 h-4 text-green-400" />;
        }
        
        return <TrendingDown className="w-4 h-4 text-red-400" />;
    };

    // Mini chart component
    const MiniChart = ({ data, dataKey, color, height = 40 }) => {
        if (!data || data.length < 2) {
            return (
                <div 
                    className={`${themeClasses.bgTertiary} rounded`}
                    style={{ height }}
                >
                    <div className="flex items-center justify-center h-full text-xs text-gray-500">
                        No data
                    </div>
                </div>
            );
        }

        const max = Math.max(...data.map(d => d[dataKey] || 0));
        const min = Math.min(...data.map(d => d[dataKey] || 0));
        const range = max - min || 1;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = ((max - (d[dataKey] || 0)) / range) * 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className={`${themeClasses.bgTertiary} rounded p-1`} style={{ height }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                    <defs>
                        <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                            <stop offset="100%" stopColor={color} stopOpacity="0.1"/>
                        </linearGradient>
                    </defs>
                    <polygon
                        points={`0,100 ${points} 100,100`}
                        fill={`url(#gradient-${dataKey})`}
                    />
                </svg>
            </div>
        );
    };

    // Metric card component
    const MetricCard = ({ 
        title, 
        value, 
        unit = '', 
        icon: Icon, 
        trend, 
        chart, 
        status = 'normal' 
    }) => {
        const getStatusColor = () => {
            switch (status) {
                case 'good': return 'text-green-400';
                case 'warning': return 'text-yellow-400';
                case 'error': return 'text-red-400';
                default: return themeClasses.textPrimary;
            }
        };

        return (
            <div className={`${themeClasses.panelBackground} ${themeClasses.panelBorder} border rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${themeClasses.textSecondary}`} />
                        <span className={`text-sm ${themeClasses.textSecondary}`}>{title}</span>
                    </div>
                    {trend}
                </div>
                
                <div className={`text-lg font-semibold ${getStatusColor()} mb-2`}>
                    {formatNumber(value, unit)}
                </div>
                
                {chart && (
                    <div className="mt-2">
                        {chart}
                    </div>
                )}
            </div>
        );
    };

    // Get GPU status
    const getGPUStatus = () => {
        const utilization = metrics.gpu?.gpu_utilization || 0;
        const temperature = metrics.gpu?.temperature || 0;
        
        if (temperature > 85 || utilization > 95) return 'error';
        if (temperature > 75 || utilization > 85) return 'warning';
        return 'good';
    };

    // Get query performance status
    const getQueryStatus = () => {
        const avgTime = metrics.queries?.avg_response_time || 0;
        const queueDepth = metrics.queries?.queue_depth || 0;
        
        if (avgTime > 10000 || queueDepth > 10) return 'error';
        if (avgTime > 5000 || queueDepth > 5) return 'warning';
        return 'good';
    };

    return (
        <div className="space-y-4">
            {/* GPU Metrics */}
            <div>
                <h3 className={`text-sm font-medium ${themeClasses.textPrimary} mb-3 flex items-center`}>
                    <Cpu className="w-4 h-4 mr-2" />
                    GPU Performance (RTX 5090)
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                    <MetricCard
                        title="Utilization"
                        value={metrics.gpu?.gpu_utilization}
                        unit="%"
                        icon={Activity}
                        status={getGPUStatus()}
                        trend={getTrendIndicator(
                            metrics.gpu?.gpu_utilization,
                            historicalData.gpu[historicalData.gpu.length - 2]?.utilization
                        )}
                        chart={
                            <MiniChart
                                data={historicalData.gpu}
                                dataKey="utilization"
                                color={chartColors.primary}
                            />
                        }
                    />
                    
                    <MetricCard
                        title="Memory"
                        value={metrics.gpu?.memory_usage}
                        unit="GB"
                        icon={MemoryStick}
                        trend={getTrendIndicator(
                            metrics.gpu?.memory_usage,
                            historicalData.gpu[historicalData.gpu.length - 2]?.memory
                        )}
                        chart={
                            <MiniChart
                                data={historicalData.gpu}
                                dataKey="memory"
                                color={chartColors.secondary}
                            />
                        }
                    />
                    
                    {metrics.gpu?.temperature && (
                        <MetricCard
                            title="Temperature"
                            value={metrics.gpu.temperature}
                            unit="°C"
                            icon={Thermometer}
                            status={metrics.gpu.temperature > 80 ? 'warning' : 'good'}
                            trend={getTrendIndicator(
                                metrics.gpu.temperature,
                                historicalData.gpu[historicalData.gpu.length - 2]?.temperature
                            )}
                        />
                    )}
                </div>
            </div>

            {/* Query Metrics */}
            <div>
                <h3 className={`text-sm font-medium ${themeClasses.textPrimary} mb-3 flex items-center`}>
                    <Activity className="w-4 h-4 mr-2" />
                    Query Performance
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                    <MetricCard
                        title="Queries/Min"
                        value={metrics.queries?.queries_per_minute}
                        icon={TrendingUp}
                        trend={getTrendIndicator(
                            metrics.queries?.queries_per_minute,
                            historicalData.queries[historicalData.queries.length - 2]?.qpm
                        )}
                        chart={
                            <MiniChart
                                data={historicalData.queries}
                                dataKey="qpm"
                                color={chartColors.primary}
                            />
                        }
                    />
                    
                    <MetricCard
                        title="Avg Response"
                        value={metrics.queries?.avg_response_time}
                        unit="ms"
                        icon={Clock}
                        status={getQueryStatus()}
                        trend={getTrendIndicator(
                            metrics.queries?.avg_response_time,
                            historicalData.queries[historicalData.queries.length - 2]?.avgTime
                        )}
                        chart={
                            <MiniChart
                                data={historicalData.queries}
                                dataKey="avgTime"
                                color={chartColors.warning}
                            />
                        }
                    />
                    
                    <MetricCard
                        title="Active Queries"
                        value={metrics.queries?.active_queries}
                        icon={Activity}
                        trend={getTrendIndicator(
                            metrics.queries?.active_queries,
                            historicalData.queries[historicalData.queries.length - 2]?.active
                        )}
                    />
                    
                    <MetricCard
                        title="Queue Depth"
                        value={metrics.queries?.queue_depth}
                        icon={Clock}
                        status={metrics.queries?.queue_depth > 5 ? 'warning' : 'good'}
                        trend={getTrendIndicator(
                            metrics.queries?.queue_depth,
                            historicalData.queries[historicalData.queries.length - 2]?.queue
                        )}
                    />
                </div>
            </div>

            {/* Pipeline Metrics */}
            {metrics.pipeline && (
                <div>
                    <h3 className={`text-sm font-medium ${themeClasses.textPrimary} mb-3 flex items-center`}>
                        <Activity className="w-4 h-4 mr-2" />
                        Pipeline Health
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <MetricCard
                            title="Success Rate"
                            value={metrics.pipeline.success_rate}
                            unit="%"
                            icon={TrendingUp}
                            status={metrics.pipeline.success_rate > 95 ? 'good' : 'warning'}
                        />
                        
                        <MetricCard
                            title="Active Connections"
                            value={metrics.pipeline.active_connections}
                            icon={Activity}
                        />
                    </div>
                </div>
            )}

            {/* Last Update */}
            <div className={`text-xs ${themeClasses.textMuted} text-center pt-2 border-t ${themeClasses.borderLight}`}>
                Last update: {metrics.lastUpdate ? 
                    new Date(metrics.lastUpdate).toLocaleTimeString() : 
                    'Never'
                }
            </div>
        </div>
    );
};

export default RealTimeMetricsPanel;

