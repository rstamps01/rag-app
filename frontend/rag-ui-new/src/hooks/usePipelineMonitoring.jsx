import { useState, useEffect, useCallback } from 'react';
import useWebSocket from './improved_useWebSocket.jsx';

/**
 * Revised pipeline monitoring hook
 *
 * This hook connects to the back‑end WebSocket endpoint and keeps the
 * pipeline state and metrics up to date.  It relies on the improved
 * WebSocket hook which exposes `sendJsonMessage` and `isConnected` to
 * request updates from the server.  Consumers can use this hook to
 * render real‑time monitoring dashboards without worrying about low‑level
 * WebSocket details.
 */
const useImprovedPipelineMonitoring = () => {
  const [pipelineState, setPipelineState] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [errorLog, setErrorLog] = useState([]);

  // Connect to the monitoring WebSocket; adjust URL as needed
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
        // Data is already transformed by the server and further by the
        // WebSocket hook; update the local metrics state directly
        setRealTimeMetrics(message.data);
        break;
      case 'stage_details':
        setNodeDetails((prev) => ({ ...prev, [message.stage_id]: message.data }));
        break;
      case 'pong':
        // Ignore heartbeats
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  const handleWebSocketError = useCallback((err) => {
    console.error('WebSocket error:', err);
    setErrorLog((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        type: 'websocket_error',
        message: 'WebSocket connection error',
        details: err,
      },
    ]);
  }, []);

  const {
    connectionStatus,
    isConnected,
    sendJsonMessage,
  } = useWebSocket(wsUrl, {
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    debug: false,
  });

  const handlePipelineEvent = useCallback((eventData) => {
    setPipelineState((prev) => {
      if (!prev) return prev;
      const updatedStages = prev.stages.map((stage) => {
        if (stage.id === eventData.stage) {
          return {
            ...stage,
            status: eventData.data.status || stage.status,
            metrics: { ...stage.metrics, ...eventData.data.metrics },
            lastUpdate: eventData.timestamp,
          };
        }
        return stage;
      });
      const updatedConnections = prev.connections.map((connection) => {
        const fromStage = updatedStages.find((s) => s.id === connection.from);
        const toStage = updatedStages.find((s) => s.id === connection.to);
        return {
          ...connection,
          active:
            fromStage?.status === 'processing' ||
            fromStage?.status === 'active' ||
            toStage?.status === 'processing' ||
            toStage?.status === 'active',
        };
      });
      return {
        ...prev,
        stages: updatedStages,
        connections: updatedConnections,
        lastUpdate: eventData.timestamp,
      };
    });
  }, []);

  // Request initial pipeline state when the connection opens
  useEffect(() => {
    if (isConnected) {
      sendJsonMessage({ type: 'request_pipeline_state' });
    }
  }, [isConnected, sendJsonMessage]);

  // Compute system health summary
  const getSystemHealth = useCallback(() => {
    if (!pipelineState) return { status: 'unknown', issues: [] };
    const issues = [];
    let overallStatus = 'healthy';
    const errorStages = pipelineState.stages.filter((stage) => stage.status === 'error');
    if (errorStages.length > 0) {
      issues.push(`${errorStages.length} stage(s) in error state`);
      overallStatus = 'error';
    }
    if (!isConnected) {
      issues.push('WebSocket connection lost');
      overallStatus = overallStatus === 'error' ? 'error' : 'warning';
    }
    const metricsAge = realTimeMetrics.lastUpdate
      ? Date.now() - new Date(realTimeMetrics.lastUpdate).getTime()
      : Infinity;
    if (metricsAge > 60000) {
      issues.push('Metrics data is stale');
      overallStatus = overallStatus === 'error' ? 'error' : 'warning';
    }
    return {
      status: overallStatus,
      issues,
      lastUpdate: new Date().toISOString(),
    };
  }, [pipelineState, isConnected, realTimeMetrics]);

  // Update system health on an interval
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth(getSystemHealth());
    }, 5000);
    return () => clearInterval(interval);
  }, [getSystemHealth]);

  // Expose API for UI components
  return {
    pipelineState,
    realTimeMetrics,
    selectedNode,
    nodeDetails,
    systemHealth,
    errorLog,
    connectionStatus,
    isConnected,
    sendJsonMessage,
    handleNodeSelect: useCallback((node) => {
      setSelectedNode(node);
      if (node && node.id) {
        sendJsonMessage({ type: 'request_stage_details', stage_id: node.id });
      }
    }, [sendJsonMessage]),
    clearNodeSelection: useCallback(() => setSelectedNode(null), []),
    subscribeToStage: useCallback((stageId) => {
      if (isConnected) {
        sendJsonMessage({ type: 'subscribe_to_stage', stage_id: stageId });
      }
    }, [isConnected, sendJsonMessage]),
    isHealthy: systemHealth.status === 'healthy',
    hasErrors: systemHealth.status === 'error',
    hasWarnings: systemHealth.status === 'warning',
  };
};

export default useImprovedPipelineMonitoring;