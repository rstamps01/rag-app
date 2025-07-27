import React, { useState, useEffect } from 'react';
import { Activity, Settings, Maximize2, Minimize2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import useWebSocket from '../../hooks/useWebSocket';

const PipelineMonitoringDashboard = () => {
    const [debugMode, setDebugMode] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [realTimeMetrics, setRealTimeMetrics] = useState({});
    const [systemHealth, setSystemHealth] = useState({ status: 'Unknown' });
    
    // WebSocket connection
    const { 
        isConnected, 
        lastMessage, 
        connectionStatus, 
        sendMessage 
    } = useWebSocket('ws://localhost:8000/api/v1/ws/pipeline-monitoring');

    // Handle incoming WebSocket messages
    useEffect(() => {
        if (lastMessage) {
            if (lastMessage.type === 'metrics_update') {
                setRealTimeMetrics(lastMessage.data || {});
                setSystemHealth(lastMessage.data?.system_health || { status: 'Unknown' });
            }
        }
    }, [lastMessage]);

    // Send ping every 30 seconds to keep connection alive
    useEffect(() => {
        if (isConnected) {
            const pingInterval = setInterval(() => {
                sendMessage({ type: 'ping' });
            }, 30000);
            
            return () => clearInterval(pingInterval);
        }
    }, [isConnected, sendMessage]);

    const handleNodeSelect = (node) => {
        setSelectedNode(node);
    };

    const clearNodeSelection = () => {
        setSelectedNode(null);
    };

    const getConnectionStatusColor = () => {
        if (isConnected) return 'text-green-400';
        if (connectionStatus.includes('Reconnecting')) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getConnectionStatusIcon = () => {
        if (isConnected) return 'bg-green-400';
        if (connectionStatus.includes('Reconnecting')) return 'bg-yellow-400 animate-pulse';
        return 'bg-red-400';
    };

    const getSystemHealthIcon = () => {
        if (systemHealth.status === 'error') return <AlertTriangle className="w-4 h-4 text-red-400" />;
        if (systemHealth.status === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
        if (systemHealth.status === 'healthy') return <CheckCircle className="w-4 h-4 text-green-400" />;
        return <RefreshCw className="w-4 h-4 text-gray-400" />;
    };

    return (
        <div className="pipeline-monitoring-dashboard h-screen bg-gray-900 text-white flex flex-col">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shrink-0">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Activity className="w-6 h-6 text-blue-400" />
                        <h1 className="text-xl font-bold text-white">RAG Pipeline Monitor</h1>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <span>Real-time Monitoring</span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    {/* System Health Indicator */}
                    <div className="flex items-center space-x-2">
                        {getSystemHealthIcon()}
                        <span className="text-sm">
                            System {systemHealth.status || 'Unknown'}
                        </span>
                    </div>
                    
                    {/* Connection Status */}
                    <div className={`flex items-center space-x-2 ${getConnectionStatusColor()}`}>
                        <div className={`w-2 h-2 rounded-full ${getConnectionStatusIcon()}`}></div>
                        <span className="text-sm">{connectionStatus}</span>
                    </div>

                    {/* Debug Mode Toggle */}
                    <button
                        onClick={() => setDebugMode(!debugMode)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                            debugMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                    >
                        Debug
                    </button>

                    {/* Quick Stats */}
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                            <span className="text-green-400">
                                {realTimeMetrics.pipeline_status?.queries_per_minute || 0}/min
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <span className="text-blue-400">
                                {realTimeMetrics.pipeline_status?.avg_response_time || 0}ms
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <span className="text-green-400">
                                {realTimeMetrics.system_health?.cpu_percent || 0}% CPU
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Metrics Panel */}
                <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
                    <RealTimeMetricsPanel metrics={realTimeMetrics} />
                </div>

                {/* Main Canvas */}
                <div className="flex-1 relative">
                    <PipelineFlowCanvas
                        realTimeMetrics={realTimeMetrics}
                        onNodeSelect={handleNodeSelect}
                        debugMode={debugMode}
                        isConnected={isConnected}
                    />
                </div>

                {/* Right Panel - Node Details */}
                {selectedNode && (
                    <div className="w-96 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
                        <NodeDetailsPanel
                            node={selectedNode}
                            onClose={clearNodeSelection}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Real-time Metrics Panel Component
const RealTimeMetricsPanel = ({ metrics }) => {
    const systemHealth = metrics.system_health || {};
    const gpuPerformance = metrics.gpu_performance || [];
    const pipelineStatus = metrics.pipeline_status || {};
    const connectionStatus = metrics.connection_status || {};

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Live Metrics
            </h2>
            
            {/* System Health */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-semibold text-white mb-3">System Health</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">CPU Usage</span>
                        <span className="text-green-400">{systemHealth.cpu_percent || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Memory</span>
                        <span className="text-blue-400">{systemHealth.memory_percent || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                            className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${systemHealth.cpu_percent || 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* GPU Performance */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-semibold text-white mb-3">GPU Performance (RTX 5090)</h3>
                {gpuPerformance.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Utilization</span>
                            <span className="text-yellow-400">{gpuPerformance[0].utilization || 0}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Memory</span>
                            <span className="text-purple-400">
                                {gpuPerformance[0].memory_used || 0}MB / {gpuPerformance[0].memory_total || 0}MB
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Temperature</span>
                            <span className="text-orange-400">{gpuPerformance[0].temperature || 0}°C</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-400 text-sm">No GPU data available</div>
                )}
            </div>

            {/* Pipeline Status */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-semibold text-white mb-3">Query Performance</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Queries/Min</span>
                        <span className="text-green-400">{pipelineStatus.queries_per_minute || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Avg Response</span>
                        <span className="text-blue-400">{pipelineStatus.avg_response_time || 0}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Active Queries</span>
                        <span className="text-purple-400">{pipelineStatus.active_queries || 0}</span>
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-semibold text-white mb-3">Connection Status</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">WebSocket</span>
                        <span className="text-green-400">{connectionStatus.websocket_connections || 0} clients</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Backend</span>
                        <span className="text-green-400">{connectionStatus.backend_status || 'unknown'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Database</span>
                        <span className="text-green-400">{connectionStatus.database_status || 'unknown'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Vector DB</span>
                        <span className="text-green-400">{connectionStatus.vector_db_status || 'unknown'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Pipeline Flow Canvas Component
const PipelineFlowCanvas = ({ realTimeMetrics, onNodeSelect, debugMode, isConnected }) => {
    return (
        <div className="relative w-full h-full bg-gray-900 overflow-hidden flex items-center justify-center">
            {/* Grid Background */}
            <div 
                className="absolute inset-0 opacity-10"
                style={{ 
                    backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }}
            />
            
            {/* Connection Status Overlay */}
            {!isConnected && (
                <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h3 className="text-xl font-semibold text-red-400 mb-2">Disconnected</h3>
                        <p className="text-gray-400">Attempting to reconnect to pipeline monitoring...</p>
                    </div>
                </div>
            )}
            
            {/* Connected State */}
            {isConnected && (
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-green-400 mb-2">Loading pipeline state...</h3>
                    <p className="text-gray-400">Real-time monitoring active</p>
                </div>
            )}
        </div>
    );
};

// Node Details Panel Component
const NodeDetailsPanel = ({ node, onClose }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{node?.name || 'Node Details'}</h2>
                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="text-gray-400">
                Select a pipeline node to view detailed information.
            </div>
        </div>
    );
};

export default PipelineMonitoringDashboard;