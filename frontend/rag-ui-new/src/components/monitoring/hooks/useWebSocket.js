import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;
  
  const connect = useCallback(() => {
    try {
      console.log(`🔌 Attempting to connect to WebSocket: ${url}`);
      setConnectionStatus('Connecting');
      setError(null);
      
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setConnectionStatus('Connected');
        setSocket(ws);
        reconnectAttemptsRef.current = 0;
        setError(null);
        
        // Send ping to keep connection alive
        ws.send('ping');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          console.log('📨 WebSocket message received:', data);
        } catch (e) {
          // Handle non-JSON messages (like pong)
          if (event.data === 'pong') {
            console.log('🏓 Received pong from server');
          } else {
            console.log('📨 WebSocket message (raw):', event.data);
            setLastMessage({ type: 'raw', data: event.data });
          }
        }
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        setSocket(null);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
          setConnectionStatus('Failed');
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error');
        setConnectionStatus('Error');
      };
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('Error');
    }
  }, [url, maxReconnectAttempts, reconnectInterval]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }
    
    setSocket(null);
    setConnectionStatus('Disconnected');
    reconnectAttemptsRef.current = 0;
  }, [socket]);
  
  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      socket.send(messageStr);
      console.log('📤 Sent WebSocket message:', messageStr);
      return true;
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
      return false;
    }
  }, [socket]);
  
  useEffect(() => {
    if (url) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);
  
  // Ping interval to keep connection alive
  useEffect(() => {
    if (socket && connectionStatus === 'Connected') {
      const pingInterval = setInterval(() => {
        sendMessage('ping');
      }, 30000); // Ping every 30 seconds
      
      return () => clearInterval(pingInterval);
    }
  }, [socket, connectionStatus, sendMessage]);
  
  return {
    socket,
    lastMessage,
    connectionStatus,
    error,
    sendMessage,
    connect,
    disconnect,
    isConnected: connectionStatus === 'Connected'
  };
};

export default useWebSocket;
