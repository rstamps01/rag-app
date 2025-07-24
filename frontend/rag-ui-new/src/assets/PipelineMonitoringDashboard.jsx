/**
 * Pipeline Monitoring Dashboard
 * Main component for the n8n.io-inspired visual pipeline monitoring interface
 */

import React, { useState } from 'react';
import { Activity, Settings, Maximize2, Minimize2, AlertTriangle, CheckCircle } from 'lucide-react';
import PipelineFlowCanvas from './flow/PipelineFlowCanvas';
import RealTimeMetricsPanel from './panels/RealTimeMetricsPanel';
import NodeDetailsPanel from './panels/NodeDetailsPanel';
import SystemHealthPanel from './panels/SystemHealthPanel';
import usePipelineMonitoring from './hooks/usePipelineMonitoring';

const PipelineMonitoringDashboard = () => {
    const [debugMode, setDebugMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

    const {
        pipelineState,
        realTimeMetrics,
        selectedNode,
        systemHealth,
        connectionStatus,
        isConnected,
        handleNodeSelect,
        clearNodeSelection,
        requestPipelineState,
        simulateEvent,
        isHealthy,
        hasErrors,
        hasWarnings
    } = usePipelineMonitoring();

    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    const handleRefresh = () => {
        requestPipelineState();
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
        if (hasErrors) return <AlertTriangle className="w-4 h-4 text-red-400" />;
        if (hasWarnings) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
        return <CheckCircle className="w-4 h-4 text-green-400" />;
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
                    
                    {/* Quick Stats */}
                    {realTimeMetrics.pipeline && (
                        <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                                <span className="text-gray-400">QPM:</span>
                                <span className="text-green-400 font-medium">
                                    {realTimeMetrics.pipeline.queries_per_minute || 0}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span className="text-gray-400">Avg:</span>
                                <span className="text-blue-400 font-medium">
                                    {Math.round(realTimeMetrics.pipeline.avg_response_time || 0)}ms
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span className="text-gray-400">Success:</span>
                                <span className="text-green-400 font-medium">
                                    {Math.round(realTimeMetrics.pipeline.success_rate || 0)}%
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Control Buttons */}
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleRefresh}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                            title="Refresh Pipeline State"
                        >
                            <Activity className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onClick={toggleDebugMode}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                debugMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                            title="Toggle Debug Mode"
                        >
                            Debug
                        </button>
                        
                        <button 
                            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                            title="Toggle Left Panel"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onClick={toggleFullscreen}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                            title="Toggle Fullscreen"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Metrics Panel */}
                {!leftPanelCollapsed && (
                    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold text-white flex items-center">
                                <Activity className="w-5 h-5 mr-2" />
                                System Metrics
                            </h2>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 space-y-4">
                                <RealTimeMetricsPanel metrics={realTimeMetrics} />
                                <SystemHealthPanel 
                                    health={systemHealth} 
                                    connectionStatus={connectionStatus}
                                    isConnected={isConnected}
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Main Canvas */}
                <div className="flex-1 relative">
                    <PipelineFlowCanvas 
                        pipelineState={pipelineState}
                        onNodeSelect={handleNodeSelect}
                        debugMode={debugMode}
                        isConnected={isConnected}
                        simulateEvent={simulateEvent}
                    />
                    
                    {/* Canvas Overlay - Connection Status */}
                    {!isConnected && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">
                                    {connectionStatus === 'Failed' ? 'Connection Failed' : connectionStatus}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Canvas Overlay - Debug Info */}
                    {debugMode && (
                        <div className="absolute top-4 right-4 bg-purple-800 bg-opacity-90 text-white p-3 rounded-lg text-xs space-y-1">
                            <div>Debug Mode: Active</div>
                            <div>Stages: {pipelineState?.stages?.length || 0}</div>
                            <div>Connections: {pipelineState?.connections?.length || 0}</div>
                            <div>Last Update: {pipelineState?.lastUpdate ? 
                                new Date(pipelineState.lastUpdate).toLocaleTimeString() : 'Never'}</div>
                        </div>
                    )}
                </div>
                
                {/* Right Panel - Node Details */}
                {selectedNode && !rightPanelCollapsed && (
                    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Stage Details</h2>
                            <button 
                                onClick={clearNodeSelection}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                                title="Close Details Panel"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <NodeDetailsPanel 
                                node={selectedNode}
                                onClose={clearNodeSelection}
                                debugMode={debugMode}
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Status Bar */}
            <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span>Pipeline Monitor v1.0</span>
                    <span>•</span>
                    <span>RTX 5090 Optimized</span>
                    {pipelineState?.lastUpdate && (
                        <>
                            <span>•</span>
                            <span>Last Update: {new Date(pipelineState.lastUpdate).toLocaleTimeString()}</span>
                        </>
                    )}
                </div>
                
                <div className="flex items-center space-x-4">
                    {realTimeMetrics.pipeline && (
                        <>
                            <span>Active Connections: {realTimeMetrics.pipeline.active_connections || 0}</span>
                            <span>•</span>
                        </>
                    )}
                    <span className={getConnectionStatusColor()}>
                        WebSocket: {connectionStatus}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PipelineMonitoringDashboard;

