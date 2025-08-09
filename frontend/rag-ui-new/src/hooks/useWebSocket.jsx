import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Extended WebSocket hook
 *
 * This version of the hook exposes additional helpers used by the
 * pipeline‑monitoring UI.  Consumers can send JSON messages back to
 * the server and supply custom `onMessage` and `onError` handlers via
 * the options parameter.  It also computes a boolean `isConnected` flag
 * from the current connectionStatus.
 *
 * Example usage:
 * const { connectionStatus, isConnected, sendJsonMessage } =
 *   useWebSocket(url, { onMessage: handleMsg, onError: handleErr });
 */
const useWebSocket = (url, options = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    messagesReceived: 0,
    lastMessageTime: null,
    connectionAttempts: 0,
    errors: [],
  });

  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Destructure option callbacks with sensible defaults
  const {
    onMessage = () => {},
    onError = () => {},
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
    debug = false,
  } = options;

  /**
   * Send a JSON‑serialisable object to the server.  If the connection
   * is not currently open, the message will be dropped silently.
   */
  const sendJsonMessage = useCallback((obj) => {
    try {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(obj));
      }
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
    }
  }, []);

  /**
   * Handle raw WebSocket messages.  Messages are parsed and forwarded
   * to any custom onMessage handler.  The hook also updates internal
   * debug information.
   */
  const handleMessage = useCallback(
    (event) => {
      setDebugInfo((prev) => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
        lastMessageTime: new Date().toISOString(),
      }));

      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (err) {
        console.error('❌ Error parsing WebSocket message:', err);
        setDebugInfo((prev) => ({
          ...prev,
          errors: [...prev.errors.slice(-4), { time: new Date().toISOString(), error: err.message }],
        }));
        return;
      }

      setLastMessage(parsed);
      // Invoke user provided handler
      try {
        onMessage(parsed);
      } catch (err) {
        console.error('❌ Error in onMessage handler:', err);
      }
    },
    [onMessage],
  );

  // Manage connection and reconnection
  const connect = useCallback(() => {
    // Avoid creating multiple connections
    if (ws.current?.readyState === WebSocket.OPEN) return;
    try {
      setDebugInfo((prev) => ({
        ...prev,
        connectionAttempts: prev.connectionAttempts + 1,
      }));

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setConnectionStatus('Connected');
        if (debug) console.log('🔌 WebSocket connected');
        // Send an initial ping to verify connectivity
        sendJsonMessage({ type: 'ping', timestamp: Date.now() });
      };
      ws.current.onmessage = handleMessage;
      ws.current.onclose = (event) => {
        if (debug) console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        // Attempt reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (debugInfo.connectionAttempts < maxReconnectAttempts) {
            connect();
          }
        }, reconnectInterval);
      };
      ws.current.onerror = (err) => {
        console.error('❌ WebSocket error:', err);
        setConnectionStatus('Error');
        setDebugInfo((prev) => ({
          ...prev,
          errors: [...prev.errors.slice(-4), { time: new Date().toISOString(), error: 'WebSocket connection error' }],
        }));
        // Forward error to custom handler
        try {
          onError(err);
        } catch (hookErr) {
          console.error('❌ Error in onError handler:', hookErr);
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionStatus('Error');
    }
  }, [url, handleMessage, reconnectInterval, maxReconnectAttempts, debugInfo.connectionAttempts, debug, sendJsonMessage, onError]);

  // Setup connection on mount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  // Heartbeat ping to keep connection alive
  useEffect(() => {
    if (!heartbeatInterval) return;
    const interval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        sendJsonMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, heartbeatInterval);
    return () => clearInterval(interval);
  }, [heartbeatInterval, sendJsonMessage]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'Connected',
    lastMessage,
    debugInfo,
    sendJsonMessage,
    reconnect: connect,
  };
};

export default useWebSocket;