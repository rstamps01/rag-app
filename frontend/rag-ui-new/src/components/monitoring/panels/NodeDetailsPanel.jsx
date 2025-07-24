/**
 * Node Details Panel
 * Detailed information panel for selected pipeline stages
 */

import React, { useState, useEffect } from 'react';
import { 
    X, 
    Clock, 
    CheckCircle, 
    AlertTriangle, 
    XCircle, 
    Activity,
    BarChart3,
    Info,
    Settings,
    RefreshCw
} from 'lucide-react';
import useTheme from '../hooks/useTheme';

const NodeDetailsPanel = ({ 
    node, 
    onClose, 
    debugMode = false 
}) => {
    const { getThemeClasses, getChartColors, isDark } = useTheme();
    const themeClasses = getThemeClasses();
    const chartColors = getChartColors();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [performanceHistory, setPerformanceHistory] = useState([]);
    const [recentEvents, setRecentEvents] = useState([]);

    // Mock performance data - in real implementation, this would come from the API
    useEffect(() => {
        if (node) {
            // Generate mock performance history
            const history = [];
            for (let i = 0; i < 20; i++) {
                history.push({
                    timestamp: new Date(Date.now() - (19 - i) * 60000).toISOString(),
                    processing_time: Math.random() * 3000 + 500,
                    success: Math.random() > 0.1,
                    throughput: Math.random() * 100 + 50
                });
            }
            setPerformanceHistory(history);

            // Generate mock recent events
            const events = [];
            for (let i = 0; i < 10; i++) {
                events.push({
                    timestamp: new Date(Date.now() - i * 30000).toISOString(),
                    type: Math.random() > 0.8 ? 'error' : 'success',
                    message: Math.random() > 0.8 ? 'Processing failed' : 'Processing completed',
                    duration: Math.random() * 2000 + 500
                });
            }
            setRecentEvents(events);
        }
    }, [node]);

    if (!node) return null;

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'processing':
            case 'active':
                return 'text-blue-400';
            case 'success':
                return 'text-green-400';
            case 'warning':
                return 'text-yellow-400';
            case 'error':
                return 'text-red-400';
            default:
                return themeClasses.textMuted;
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        const iconProps = { className: "w-4 h-4" };
        
        switch (status) {
            case 'processing':
            case 'active':
                return <Clock {...iconProps} className="w-4 h-4 text-blue-400 animate-spin" />;
            case 'success':
                return <CheckCircle {...iconProps} className="w-4 h-4 text-green-400" />;
            case 'warning':
                return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-400" />;
            case 'error':
                return <XCircle {...iconProps} className="w-4 h-4 text-red-400" />;
            default:
                return <div className={`w-4 h-4 rounded-full ${themeClasses.border} border-2`}></div>;
        }
    };

    // Format duration
    const formatDuration = (ms) => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    // Performance chart component
    const PerformanceChart = ({ data, dataKey, color, title }) => {
        if (!data || data.length === 0) {
            return (
                <div className={`${themeClasses.bgTertiary} rounded p-4 text-center`}>
                    <span className={`text-sm ${themeClasses.textMuted}`}>No data available</span>
                </div>
            );
        }

        const max = Math.max(...data.map(d => d[dataKey] || 0));
        const min = Math.min(...data.map(d => d[dataKey] || 0));
        const range = max - min || 1;

        return (
            <div className={`${themeClasses.bgTertiary} rounded p-3`}>
                <h4 className={`text-sm font-medium ${themeClasses.textPrimary} mb-2`}>{title}</h4>
                <div className="h-24 relative">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                                <stop offset="100%" stopColor={color} stopOpacity="0.1"/>
                            </linearGradient>
                        </defs>
                        
                        {/* Area chart */}
                        <polygon
                            points={`0,100 ${data.map((d, i) => {
                                const x = (i / (data.length - 1)) * 100;
                                const y = ((max - (d[dataKey] || 0)) / range) * 80 + 10;
                                return `${x},${y}`;
                            }).join(' ')} 100,100`}
                            fill={`url(#gradient-${dataKey})`}
                        />
                        
                        {/* Line chart */}
                        <polyline
                            points={data.map((d, i) => {
                                const x = (i / (data.length - 1)) * 100;
                                const y = ((max - (d[dataKey] || 0)) / range) * 80 + 10;
                                return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                </div>
                <div className={`text-xs ${themeClasses.textMuted} mt-1`}>
                    Min: {formatDuration(min)} | Max: {formatDuration(max)} | Avg: {formatDuration((max + min) / 2)}
                </div>
            </div>
        );
    };

    // Tab button component
    const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active 
                    ? `${themeClasses.bgTertiary} ${themeClasses.textPrimary}` 
                    : `${themeClasses.textMuted} ${themeClasses.hover}`
            }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {getStatusIcon(node.status)}
                    <div>
                        <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
                            {node.name}
                        </h3>
                        <p className={`text-sm ${getStatusColor(node.status)}`}>
                            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 p-1 bg-gray-700 rounded-lg">
                <TabButton
                    id="overview"
                    label="Overview"
                    icon={Info}
                    active={activeTab === 'overview'}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="performance"
                    label="Performance"
                    icon={BarChart3}
                    active={activeTab === 'performance'}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="events"
                    label="Events"
                    icon={Activity}
                    active={activeTab === 'events'}
                    onClick={setActiveTab}
                />
                {debugMode && (
                    <TabButton
                        id="debug"
                        label="Debug"
                        icon={Settings}
                        active={activeTab === 'debug'}
                        onClick={setActiveTab}
                    />
                )}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Key Metrics */}
                        <div className={`${themeClasses.bgSecondary} rounded-lg p-4`}>
                            <h4 className={`text-sm font-medium ${themeClasses.textPrimary} mb-3`}>
                                Key Metrics
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className={`text-xs ${themeClasses.textMuted}`}>Total Processed</div>
                                    <div className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
                                        {node.metrics?.total_processed || 0}
                                    </div>
                                </div>
                                <div>
                                    <div className={`text-xs ${themeClasses.textMuted}`}>Success Rate</div>
                                    <div className={`text-lg font-semibold ${
                                        (node.metrics?.success_rate || 100) > 95 ? 'text-green-400' : 'text-yellow-400'
                                    }`}>
                                        {Math.round(node.metrics?.success_rate || 100)}%
                                    </div>
                                </div>
                                <div>
                                    <div className={`text-xs ${themeClasses.textMuted}`}>Avg Time</div>
                                    <div className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
                                        {formatDuration(node.metrics?.avg_time_ms || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div className={`text-xs ${themeClasses.textMuted}`}>Active Count</div>
                                    <div className={`text-lg font-semibold ${
                                        (node.metrics?.active_count || 0) > 0 ? 'text-blue-400' : themeClasses.textPrimary
                                    }`}>
                                        {node.metrics?.active_count || 0}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stage Description */}
                        <div className={`${themeClasses.bgSecondary} rounded-lg p-4`}>
                            <h4 className={`text-sm font-medium ${themeClasses.textPrimary} mb-2`}>
                                Stage Description
                            </h4>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                                {getStageDescription(node.id)}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="space-y-4">
                        <PerformanceChart
                            data={performanceHistory}
                            dataKey="processing_time"
                            color={chartColors.primary}
                            title="Processing Time (Last 20 executions)"
                        />
                        
                        <PerformanceChart
                            data={performanceHistory}
                            dataKey="throughput"
                            color={chartColors.secondary}
                            title="Throughput (items/second)"
                        />
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                                Recent Events
                            </h4>
                            <button className={`p-1 ${themeClasses.hover} rounded`}>
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {recentEvents.map((event, index) => (
                                <div 
                                    key={index}
                                    className={`${themeClasses.bgSecondary} rounded p-3 text-sm`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-medium ${
                                            event.type === 'error' ? 'text-red-400' : 'text-green-400'
                                        }`}>
                                            {event.type.toUpperCase()}
                                        </span>
                                        <span className={`text-xs ${themeClasses.textMuted}`}>
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className={themeClasses.textSecondary}>
                                        {event.message}
                                    </div>
                                    <div className={`text-xs ${themeClasses.textMuted} mt-1`}>
                                        Duration: {formatDuration(event.duration)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'debug' && debugMode && (
                    <div className="space-y-4">
                        <div className={`${themeClasses.bgSecondary} rounded-lg p-4`}>
                            <h4 className={`text-sm font-medium ${themeClasses.textPrimary} mb-3`}>
                                Debug Information
                            </h4>
                            <div className="space-y-2 text-sm font-mono">
                                <div>
                                    <span className={themeClasses.textMuted}>Stage ID:</span>
                                    <span className={`ml-2 ${themeClasses.textPrimary}`}>{node.id}</span>
                                </div>
                                <div>
                                    <span className={themeClasses.textMuted}>Status:</span>
                                    <span className={`ml-2 ${getStatusColor(node.status)}`}>{node.status}</span>
                                </div>
                                <div>
                                    <span className={themeClasses.textMuted}>Last Update:</span>
                                    <span className={`ml-2 ${themeClasses.textPrimary}`}>
                                        {node.lastUpdate ? new Date(node.lastUpdate).toLocaleString() : 'Never'}
                                    </span>
                                </div>
                                <div>
                                    <span className={themeClasses.textMuted}>Metrics:</span>
                                    <pre className={`ml-2 mt-1 ${themeClasses.textPrimary} ${themeClasses.bgTertiary} p-2 rounded text-xs overflow-x-auto`}>
                                        {JSON.stringify(node.metrics, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function to get stage descriptions
const getStageDescription = (stageId) => {
    const descriptions = {
        query_input: "Receives and validates incoming user queries, preparing them for processing through the RAG pipeline.",
        embedding: "Converts the user query into vector embeddings using the sentence transformer model for semantic search.",
        vector_search: "Searches the Qdrant vector database to find the most relevant document chunks based on query embeddings.",
        document_retrieval: "Retrieves the full document content and metadata for the most relevant search results.",
        context_prep: "Prepares and formats the retrieved documents into context for the language model processing.",
        llm_processing: "Processes the query and context through the Mistral-7B language model to generate AI responses.",
        response: "Formats and delivers the final response to the user, including source citations and metadata.",
        history_log: "Logs the complete query-response interaction to PostgreSQL for audit trails and analytics."
    };
    
    return descriptions[stageId] || "Pipeline stage for processing user queries through the RAG system.";
};

export default NodeDetailsPanel;
