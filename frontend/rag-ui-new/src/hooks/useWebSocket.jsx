import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Extended WebSocket hook with improved connection management
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
  const connectionAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);

  // Destructure option callbacks with sensible defaults
  const {
    onMessage = () => {},
    onError = () => {},
    reconnectInterval = 5000, // Increased from 3000
    maxReconnectAttempts = 5, // Reduced from 10
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

  // Manage connection and reconnection with exponential backoff
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    // Check if we've exceeded max attempts
    if (connectionAttemptsRef.current >= maxReconnectAttempts) {
      setConnectionStatus('Failed');
      if (debug) console.log('🔌 Max reconnection attempts reached');
      return;
    }
    
    isConnectingRef.current = true;
    setConnectionStatus('Connecting');
    
    try {
      connectionAttemptsRef.current += 1;
      setDebugInfo((prev) => ({
        ...prev,
        connectionAttempts: connectionAttemptsRef.current,
      }));

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        isConnectingRef.current = false;
        connectionAttemptsRef.current = 0; // Reset on successful connection
        setConnectionStatus('Connected');
        if (debug) console.log('🔌 WebSocket connected');
        // Send an initial ping to verify connectivity
        sendJsonMessage({ type: 'ping', timestamp: Date.now() });
      };
      
      ws.current.onmessage = handleMessage;
      
      ws.current.onclose = (event) => {
        isConnectingRef.current = false;
        setConnectionStatus('Disconnected');
        if (debug) console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        
        // Only attempt reconnection if we haven't exceeded max attempts
        if (connectionAttemptsRef.current < maxReconnectAttempts) {
          // Exponential backoff: 2^attempts * baseInterval (max 30 seconds)
          const backoffDelay = Math.min(
            Math.pow(2, connectionAttemptsRef.current) * 1000,
            30000
          );
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, backoffDelay);
        } else {
          setConnectionStatus('Failed');
        }
      };
      
      ws.current.onerror = (err) => {
        isConnectingRef.current = false;
        console.error('❌ WebSocket error:', err);
        setConnectionStatus('Error');
        setDebugInfo((prev) => ({
          ...prev,
          errors: [...prev.errors.slice(-4), { 
            time: new Date().toISOString(), 
            error: 'WebSocket connection error' 
          }],
        }));
        // Forward error to custom handler
        try {
          onError(err);
        } catch (hookErr) {
          console.error('❌ Error in onError handler:', hookErr);
        }
      };
    } catch (error) {
      isConnectingRef.current = false;
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionStatus('Error');
    }
  }, [url, handleMessage, maxReconnectAttempts, debug, sendJsonMessage, onError]);

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

  // Manual reconnect function that resets attempt counter
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (ws.current) {
      ws.current.close();
    }
    connectionAttemptsRef.current = 0;
    isConnectingRef.current = false;
    connect();
  }, [connect]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'Connected',
    lastMessage,
    debugInfo,
    sendJsonMessage,
    reconnect,
  };
};

export default useWebSocket;