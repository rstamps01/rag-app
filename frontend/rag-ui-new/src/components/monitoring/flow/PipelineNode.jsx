/**
 * Pipeline Node Component
 * Individual node representation in the pipeline flow with theme support
 */

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Database, 
    FileText, 
    Cpu, 
    MessageSquare, 
    Save,
    Play,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Clock
} from 'lucide-react';
import useTheme from '../hooks/useTheme';

const PipelineNode = ({ 
    stage, 
    position, 
    onClick, 
    onDoubleClick, 
    debugMode = false, 
    isConnected = false 
}) => {
    const { getThemeClasses, isDark } = useTheme();
    const themeClasses = getThemeClasses();
    const [isAnimating, setIsAnimating] = useState(false);
    const [pulseCount, setPulseCount] = useState(0);

    // Stage icons mapping
    const stageIcons = {
        query_input: Play,
        embedding: Search,
        vector_search: Database,
        document_retrieval: FileText,
        context_prep: FileText,
        llm_processing: Cpu,
        response: MessageSquare,
        history_log: Save
    };

    // Get status-specific styling
    const getStatusStyles = () => {
        const baseStyles = `
            relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 
            transform hover:scale-105 hover:shadow-lg min-w-[160px] min-h-[80px]
            ${themeClasses.nodeBackground} ${themeClasses.nodeBorder} ${themeClasses.nodeHover}
        `;

        switch (stage.status) {
            case 'processing':
            case 'active':
                return `${baseStyles} border-blue-400 shadow-blue-400/20 shadow-lg animate-pulse`;
            case 'success':
                return `${baseStyles} border-green-400 shadow-green-400/20`;
            case 'warning':
                return `${baseStyles} border-yellow-400 shadow-yellow-400/20`;
            case 'error':
                return `${baseStyles} border-red-400 shadow-red-400/20`;
            case 'idle':
            default:
                return `${baseStyles} ${themeClasses.border}`;
        }
    };

    // Get status icon
    const getStatusIcon = () => {
        const iconProps = { className: "w-4 h-4" };
        
        switch (stage.status) {
            case 'processing':
            case 'active':
                return <Clock {...iconProps} className="w-4 h-4 text-blue-400 animate-spin" />;
            case 'success':
                return <CheckCircle {...iconProps} className="w-4 h-4 text-green-400" />;
            case 'warning':
                return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-400" />;
            case 'error':
                return <XCircle {...iconProps} className="w-4 h-4 text-red-400" />;
            case 'idle':
            default:
                return <div className={`w-4 h-4 rounded-full ${themeClasses.border} border-2`}></div>;
        }
    };

    // Get stage icon
    const StageIcon = stageIcons[stage.id] || FileText;

    // Handle processing animation
    useEffect(() => {
        if (stage.status === 'processing' || stage.status === 'active') {
            setIsAnimating(true);
            const interval = setInterval(() => {
                setPulseCount(prev => prev + 1);
            }, 1000);
            
            return () => clearInterval(interval);
        } else {
            setIsAnimating(false);
            setPulseCount(0);
        }
    }, [stage.status]);

    // Format metrics for display
    const formatMetrics = () => {
        if (!stage.metrics) return null;
        
        const metrics = [];
        
        if (stage.metrics.active_count > 0) {
            metrics.push(`Active: ${stage.metrics.active_count}`);
        }
        
        if (stage.metrics.total_processed > 0) {
            metrics.push(`Processed: ${stage.metrics.total_processed}`);
        }
        
        if (stage.metrics.avg_time_ms) {
            metrics.push(`Avg: ${Math.round(stage.metrics.avg_time_ms)}ms`);
        }
        
        if (stage.metrics.success_rate !== undefined) {
            metrics.push(`Success: ${Math.round(stage.metrics.success_rate)}%`);
        }
        
        return metrics;
    };

    // Handle node click
    const handleClick = (e) => {
        e.stopPropagation();
        onClick?.(stage);
    };

    // Handle node double click
    const handleDoubleClick = (e) => {
        e.stopPropagation();
        onDoubleClick?.(stage);
    };

    return (
        <div
            className={getStatusStyles()}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
                zIndex: 10
            }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            title={`${stage.name} - ${stage.status}`}
        >
            {/* Processing Animation Overlay */}
            {isAnimating && (
                <div className="absolute inset-0 rounded-lg border-2 border-blue-400 animate-ping opacity-75"></div>
            )}
            
            {/* Node Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <StageIcon className={`w-5 h-5 ${themeClasses.textSecondary}`} />
                    <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                        {stage.name}
                    </span>
                </div>
                
                <div className="flex items-center space-x-1">
                    {getStatusIcon()}
                    {!isConnected && (
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title="Disconnected" />
                    )}
                </div>
            </div>
            
            {/* Node Metrics */}
            {stage.metrics && (
                <div className="space-y-1">
                    {formatMetrics()?.map((metric, index) => (
                        <div key={index} className={`text-xs ${themeClasses.textMuted}`}>
                            {metric}
                        </div>
                    ))}
                </div>
            )}
            
            {/* Debug Information */}
            {debugMode && (
                <div className="mt-2 pt-2 border-t border-gray-600 text-xs space-y-1">
                    <div className={themeClasses.textMuted}>ID: {stage.id}</div>
                    <div className={themeClasses.textMuted}>Status: {stage.status}</div>
                    {stage.lastUpdate && (
                        <div className={themeClasses.textMuted}>
                            Updated: {new Date(stage.lastUpdate).toLocaleTimeString()}
                        </div>
                    )}
                    {pulseCount > 0 && (
                        <div className="text-blue-400">Pulses: {pulseCount}</div>
                    )}
                </div>
            )}
            
            {/* Connection Points */}
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                <div className={`w-4 h-4 rounded-full border-2 ${
                    stage.status === 'processing' ? 'border-blue-400 bg-blue-400' : 
                    `${themeClasses.border} ${themeClasses.bgSecondary}`
                }`}></div>
            </div>
            
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                <div className={`w-4 h-4 rounded-full border-2 ${
                    stage.status === 'processing' ? 'border-blue-400 bg-blue-400' : 
                    `${themeClasses.border} ${themeClasses.bgSecondary}`
                }`}></div>
            </div>
            
            {/* Performance Indicator */}
            {stage.metrics?.avg_time_ms && (
                <div className="absolute -top-2 -right-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                        stage.metrics.avg_time_ms < 1000 ? 'bg-green-500 text-white' :
                        stage.metrics.avg_time_ms < 3000 ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                    }`}>
                        {Math.round(stage.metrics.avg_time_ms)}ms
                    </div>
                </div>
            )}
            
            {/* Error Count Badge */}
            {stage.metrics?.success_rate < 95 && stage.metrics?.total_processed > 0 && (
                <div className="absolute -top-2 -left-2">
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {Math.round(100 - stage.metrics.success_rate)}% err
                    </div>
                </div>
            )}
        </div>
    );
};

export default PipelineNode;
