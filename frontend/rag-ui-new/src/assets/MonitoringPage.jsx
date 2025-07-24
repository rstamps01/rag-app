/**
 * Monitoring Page Component
 * Main page that integrates all monitoring components with theme toggle
 */

import React, { useState, useEffect } from 'react';
import { 
    Sun, 
    Moon, 
    Settings, 
    Maximize2, 
    Minimize2,
    RefreshCw,
    Play,
    Pause
} from 'lucide-react';

import PipelineMonitoringDashboard from './PipelineMonitoringDashboard';
import RealTimeMetricsPanel from './panels/RealTimeMetricsPanel';
import NodeDetailsPanel from './panels/NodeDetailsPanel';
import SystemHealthPanel from './panels/SystemHealthPanel';
import useTheme from './hooks/useTheme';
import usePipelineMonitoring from './hooks/usePipelineMonitoring';

const MonitoringPage = () => {
    const { 
        theme, 
        isDark, 
        toggleTheme, 
        getThemeClasses 
    } = useTheme();
    
    const {
        pipelineData,
        metrics,
        health,
        connectionStatus,
        isConnected,
        isAutoRefresh,
        toggleAutoRefresh,
        refreshData
    } = usePipelineMonitoring();
    
    const themeClasses = getThemeClasses();
    
    const [selectedNode, setSelectedNode] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Handle node selection
    const handleNodeClick = (node) => {
        setSelectedNode(node);
    };

    // Handle node double-click for detailed view
    const handleNodeDoubleClick = (node) => {
        setSelectedNode(node);
        // Could open a modal or navigate to detailed view
    };

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        refreshData();
                        break;
                    case 'd':
                        e.preventDefault();
                        setDebugMode(!debugMode);
                        break;
                    case 'f':
                        e.preventDefault();
                        toggleFullscreen();
                        break;
                    case 't':
                        e.preventDefault();
                        toggleTheme();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                setSelectedNode(null);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [debugMode, refreshData, toggleTheme]);

    return (
        <div className={`min-h-screen ${themeClasses.bgPrimary} transition-colors duration-300`}>
            {/* Header */}
            <header className={`${themeClasses.bgSecondary} ${themeClasses.border} border-b px-6 py-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                            RAG Pipeline Monitor
                        </h1>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isConnected 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                        }`}>
                            {connectionStatus}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        {/* Auto-refresh toggle */}
                        <button
                            onClick={toggleAutoRefresh}
                            className={`p-2 rounded-lg transition-colors ${
                                isAutoRefresh 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : `${themeClasses.hover} ${themeClasses.textMuted}`
                            }`}
                            title={`Auto-refresh: ${isAutoRefresh ? 'ON' : 'OFF'}`}
                        >
                            {isAutoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        
                        {/* Manual refresh */}
                        <button
                            onClick={refreshData}
                            className={`p-2 rounded-lg ${themeClasses.hover} ${themeClasses.textMuted} transition-colors`}
                            title="Refresh data (Ctrl+R)"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        
                        {/* Debug mode toggle */}
                        <button
                            onClick={() => setDebugMode(!debugMode)}
                            className={`p-2 rounded-lg transition-colors ${
                                debugMode 
                                    ? 'bg-yellow-500/20 text-yellow-400' 
                                    : `${themeClasses.hover} ${themeClasses.textMuted}`
                            }`}
                            title={`Debug mode: ${debugMode ? 'ON' : 'OFF'} (Ctrl+D)`}
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        
                        {/* Fullscreen toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className={`p-2 rounded-lg ${themeClasses.hover} ${themeClasses.textMuted} transition-colors`}
                            title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen (Ctrl+F)`}
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg ${themeClasses.hover} ${themeClasses.textMuted} transition-colors`}
                            title={`Switch to ${isDark ? 'light' : 'dark'} theme (Ctrl+T)`}
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        
                        {/* Sidebar toggle */}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className={`p-2 rounded-lg ${themeClasses.hover} ${themeClasses.textMuted} transition-colors`}
                            title={`${sidebarCollapsed ? 'Show' : 'Hide'} sidebar`}
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* Debug info bar */}
                {debugMode && (
                    <div className={`mt-3 p-2 ${themeClasses.bgTertiary} rounded text-xs ${themeClasses.textMuted} font-mono`}>
                        Theme: {theme} | Connected: {isConnected ? 'Yes' : 'No'} | 
                        Auto-refresh: {isAutoRefresh ? 'ON' : 'OFF'} | 
                        Selected: {selectedNode?.name || 'None'} |
                        Last update: {metrics.lastUpdate ? new Date(metrics.lastUpdate).toLocaleTimeString() : 'Never'}
                    </div>
                )}
            </header>

            {/* Main content */}
            <div className="flex h-[calc(100vh-80px)]">
                {/* Main pipeline view */}
                <div className={`flex-1 ${sidebarCollapsed ? 'mr-0' : 'mr-80'} transition-all duration-300`}>
                    <PipelineMonitoringDashboard
                        pipelineData={pipelineData}
                        onNodeClick={handleNodeClick}
                        onNodeDoubleClick={handleNodeDoubleClick}
                        debugMode={debugMode}
                        isConnected={isConnected}
                    />
                </div>

                {/* Right sidebar */}
                <div className={`fixed right-0 top-20 bottom-0 w-80 ${themeClasses.bgSecondary} ${themeClasses.border} border-l transition-transform duration-300 ${
                    sidebarCollapsed ? 'translate-x-full' : 'translate-x-0'
                } overflow-y-auto`}>
                    <div className="p-4 space-y-6">
                        {/* System Health */}
                        <div>
                            <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-3`}>
                                System Health
                            </h3>
                            <SystemHealthPanel
                                health={health}
                                connectionStatus={connectionStatus}
                                isConnected={isConnected}
                            />
                        </div>

                        {/* Real-time Metrics */}
                        <div>
                            <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-3`}>
                                Live Metrics
                            </h3>
                            <RealTimeMetricsPanel metrics={metrics} />
                        </div>

                        {/* Node Details */}
                        {selectedNode && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
                                        Node Details
                                    </h3>
                                    <button
                                        onClick={() => setSelectedNode(null)}
                                        className={`p-1 rounded ${themeClasses.hover} ${themeClasses.textMuted}`}
                                        title="Close details (Esc)"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className={`${themeClasses.bgPrimary} rounded-lg`}>
                                    <NodeDetailsPanel
                                        node={selectedNode}
                                        onClose={() => setSelectedNode(null)}
                                        debugMode={debugMode}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Keyboard shortcuts help */}
            {debugMode && (
                <div className={`fixed bottom-4 left-4 ${themeClasses.bgSecondary} ${themeClasses.border} border rounded-lg p-3 text-xs ${themeClasses.textMuted}`}>
                    <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
                    <div>Ctrl+R: Refresh | Ctrl+D: Debug | Ctrl+F: Fullscreen | Ctrl+T: Theme | Esc: Close</div>
                </div>
            )}
        </div>
    );
};

export default MonitoringPage;

