/**
 * Pipeline Monitoring Hook
 * Manages pipeline state, metrics, and real-time updates via WebSocket
 */

import { useState, useEffect, useCallback } from 'react';
import useWebSocket from './useWebSocket';

const usePipelineMonitoring = () => {
    const [pipelineState, setPipelineState] = useState(null);
    const [realTimeMetrics, setRealTimeMetrics] = useState({});
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodeDetails, setNodeDetails] = useState({});
    const [systemHealth, setSystemHealth] = useState({});
    const [errorLog, setErrorLog] = useState([]);

    // WebSocket connection for real-time updates
    // const wsUrl = `ws://localhost:8000/api/v1/monitoring/ws/pipeline-monitoring`;
    const wsUrl = `ws://localhost:8000/api/v1/ws/pipeline-monitoring`;
    
    const handleWebSocketMessage = useCallback((message) => {
        switch (message.type) {
            case 'initial_state':
            case 'pipeline_state':
                setPipelineState(message.data);
                break;
                
            case 'pipeline_event':
                handlePipelineEvent(message.data);
                break;
                
            case 'metrics_update':
                handleMetricsUpdate(message.data);
                break;
                
            case 'stage_details':
                setNodeDetails(prev => ({
                    ...prev,
                    [message.stage_id]: message.data
                }));
                break;
                
            case 'pong':
                // Handle heartbeat response
                console.log('Heartbeat response received');
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
    }, []);

    const handleWebSocketError = useCallback((error) => {
        console.error('WebSocket error:', error);
        setErrorLog(prev => [...prev, {
            timestamp: new Date().toISOString(),
            type: 'websocket_error',
            message: 'WebSocket connection error',
            details: error
        }]);
    }, []);

    const {
        connectionStatus,
        sendJsonMessage,
        isConnected
    } = useWebSocket(wsUrl, {
        onMessage: handleWebSocketMessage,
        onError: handleWebSocketError,
        reconnectAttempts: 10,
        reconnectInterval: 3000,
        heartbeatInterval: 30000
    });

    const handlePipelineEvent = useCallback((eventData) => {
        // Update pipeline state based on events
        setPipelineState(prevState => {
            if (!prevState) return prevState;

            const updatedStages = prevState.stages.map(stage => {
                if (stage.id === eventData.stage) {
                    return {
                        ...stage,
                        status: eventData.data.status || stage.status,
                        metrics: { 
                            ...stage.metrics, 
                            ...eventData.data.metrics 
                        },
                        lastUpdate: eventData.timestamp
                    };
                }
                return stage;
            });

            // Update connections based on stage activity
            const updatedConnections = prevState.connections.map(connection => {
                const fromStage = updatedStages.find(s => s.id === connection.from);
                const toStage = updatedStages.find(s => s.id === connection.to);
                
                return {
                    ...connection,
                    active: (fromStage?.status === 'processing' || 
                            fromStage?.status === 'active' ||
                            toStage?.status === 'processing' ||
                            toStage?.status === 'active')
                };
            });

            return {
                ...prevState,
                stages: updatedStages,
                connections: updatedConnections,
                lastUpdate: eventData.timestamp
            };
        });
    }, []);

    const handleMetricsUpdate = useCallback((metricsData) => {
        if (metricsData.type === 'gpu_metrics') {
            setRealTimeMetrics(prev => ({
                ...prev,
                gpu: metricsData.data,
                lastUpdate: metricsData.data.timestamp
            }));
        } else if (metricsData.type === 'query_metrics') {
            setRealTimeMetrics(prev => ({
                ...prev,
                queries: metricsData.data,
                lastUpdate: metricsData.data.timestamp
            }));
        } else if (metricsData.stage_metrics) {
            setRealTimeMetrics(prev => ({
                ...prev,
                stages: metricsData.stage_metrics,
                pipeline: metricsData.pipeline_state?.system_metrics,
                lastUpdate: metricsData.timestamp
            }));
        }
    }, []);

    // Request pipeline state
    const requestPipelineState = useCallback(() => {
        if (isConnected) {
            sendJsonMessage({
                type: 'request_pipeline_state'
            });
        }
    }, [isConnected, sendJsonMessage]);

    // Request stage details
    const requestStageDetails = useCallback((stageId) => {
        if (isConnected) {
            sendJsonMessage({
                type: 'request_stage_details',
                stage_id: stageId
            });
        }
    }, [isConnected, sendJsonMessage]);

    // Subscribe to stage updates
    const subscribeToStage = useCallback((stageId) => {
        if (isConnected) {
            sendJsonMessage({
                type: 'subscribe_to_stage',
                stage_id: stageId
            });
        }
    }, [isConnected, sendJsonMessage]);

    // Handle node selection
    const handleNodeSelect = useCallback((node) => {
        setSelectedNode(node);
        if (node && node.id) {
            requestStageDetails(node.id);
        }
    }, [requestStageDetails]);

    // Clear node selection
    const clearNodeSelection = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // Get system health status
    const getSystemHealth = useCallback(() => {
        if (!pipelineState) return { status: 'unknown', issues: [] };

        const issues = [];
        let overallStatus = 'healthy';

        // Check for error stages
        const errorStages = pipelineState.stages.filter(stage => stage.status === 'error');
        if (errorStages.length > 0) {
            issues.push(`${errorStages.length} stage(s) in error state`);
            overallStatus = 'error';
        }

        // Check connection status
        if (!isConnected) {
            issues.push('WebSocket connection lost');
            overallStatus = overallStatus === 'error' ? 'error' : 'warning';
        }

        // Check metrics freshness
        const metricsAge = realTimeMetrics.lastUpdate ? 
            Date.now() - new Date(realTimeMetrics.lastUpdate).getTime() : 
            Infinity;
        
        if (metricsAge > 60000) { // 1 minute
            issues.push('Metrics data is stale');
            overallStatus = overallStatus === 'error' ? 'error' : 'warning';
        }

        return {
            status: overallStatus,
            issues,
            lastUpdate: new Date().toISOString()
        };
    }, [pipelineState, isConnected, realTimeMetrics]);

    // Update system health periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemHealth(getSystemHealth());
        }, 5000);

        return () => clearInterval(interval);
    }, [getSystemHealth]);

    // Request initial data when connected
    useEffect(() => {
        if (isConnected) {
            requestPipelineState();
        }
    }, [isConnected, requestPipelineState]);

    // Simulate pipeline events for development
    const simulateEvent = useCallback((eventData) => {
        if (process.env.NODE_ENV === 'development') {
            fetch('/api/v1/monitoring/pipeline/simulate-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            }).catch(error => {
                console.error('Failed to simulate event:', error);
            });
        }
    }, []);

    return {
        // State
        pipelineState,
        realTimeMetrics,
        selectedNode,
        nodeDetails,
        systemHealth,
        errorLog,
        
        // Connection status
        connectionStatus,
        isConnected,
        
        // Actions
        handleNodeSelect,
        clearNodeSelection,
        requestPipelineState,
        requestStageDetails,
        subscribeToStage,
        simulateEvent,
        
        // Computed values
        isHealthy: systemHealth.status === 'healthy',
        hasErrors: systemHealth.status === 'error',
        hasWarnings: systemHealth.status === 'warning',
        
        // Utilities
        getStageById: (stageId) => pipelineState?.stages.find(s => s.id === stageId),
        getConnectionsForStage: (stageId) => pipelineState?.connections.filter(
            c => c.from === stageId || c.to === stageId
        ) || [],
        getActiveStages: () => pipelineState?.stages.filter(
            s => s.status === 'processing' || s.status === 'active'
        ) || []
    };
};

export default usePipelineMonitoring;
