/**
 * WebSocket Hook for Real-time Pipeline Monitoring
 * Manages WebSocket connections and handles real-time data updates
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
    const {
        onOpen = () => {},
        onMessage = () => {},
        onError = () => {},
        onClose = () => {},
        reconnectAttempts = 5,
        reconnectInterval = 3000,
        heartbeatInterval = 30000
    } = options;

    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [lastMessage, setLastMessage] = useState(null);
    const [lastJsonMessage, setLastJsonMessage] = useState(null);
    
    const ws = useRef(null);
    const reconnectTimeoutId = useRef(null);
    const heartbeatTimeoutId = useRef(null);
    const reconnectCount = useRef(0);
    const shouldReconnect = useRef(true);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            ws.current = new WebSocket(url);
            
            ws.current.onopen = (event) => {
                console.log('WebSocket connected:', url);
                setConnectionStatus('Connected');
                reconnectCount.current = 0;
                onOpen(event);
                
                // Start heartbeat
                startHeartbeat();
            };

            ws.current.onmessage = (event) => {
                setLastMessage(event.data);
                
                try {
                    const jsonData = JSON.parse(event.data);
                    setLastJsonMessage(jsonData);
                    onMessage(jsonData);
                } catch (error) {
                    console.warn('Received non-JSON message:', event.data);
                    onMessage(event.data);
                }
            };

            ws.current.onerror = (event) => {
                console.error('WebSocket error:', event);
                setConnectionStatus('Error');
                onError(event);
            };

            ws.current.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setConnectionStatus('Disconnected');
                stopHeartbeat();
                onClose(event);
                
                // Attempt to reconnect if enabled
                if (shouldReconnect.current && reconnectCount.current < reconnectAttempts) {
                    reconnectCount.current++;
                    console.log(`Attempting to reconnect... (${reconnectCount.current}/${reconnectAttempts})`);
                    setConnectionStatus(`Reconnecting (${reconnectCount.current}/${reconnectAttempts})`);
                    
                    reconnectTimeoutId.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                } else if (reconnectCount.current >= reconnectAttempts) {
                    setConnectionStatus('Failed');
                    console.error('Max reconnection attempts reached');
                }
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            setConnectionStatus('Error');
            onError(error);
        }
    }, [url, onOpen, onMessage, onError, onClose, reconnectAttempts, reconnectInterval]);

    const disconnect = useCallback(() => {
        shouldReconnect.current = false;
        stopHeartbeat();
        
        if (reconnectTimeoutId.current) {
            clearTimeout(reconnectTimeoutId.current);
        }
        
        if (ws.current) {
            ws.current.close();
        }
    }, []);

    const sendMessage = useCallback((message) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            ws.current.send(messageStr);
            return true;
        } else {
            console.warn('WebSocket is not connected. Message not sent:', message);
            return false;
        }
    }, []);

    const sendJsonMessage = useCallback((message) => {
        return sendMessage(JSON.stringify(message));
    }, [sendMessage]);

    const startHeartbeat = useCallback(() => {
        if (heartbeatInterval > 0) {
            heartbeatTimeoutId.current = setInterval(() => {
                sendJsonMessage({
                    type: 'ping',
                    timestamp: new Date().toISOString()
                });
            }, heartbeatInterval);
        }
    }, [heartbeatInterval, sendJsonMessage]);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatTimeoutId.current) {
            clearInterval(heartbeatTimeoutId.current);
            heartbeatTimeoutId.current = null;
        }
    }, []);

    // Connect on mount
    useEffect(() => {
        connect();
        
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            shouldReconnect.current = false;
            stopHeartbeat();
            
            if (reconnectTimeoutId.current) {
                clearTimeout(reconnectTimeoutId.current);
            }
            
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [stopHeartbeat]);

    return {
        connectionStatus,
        lastMessage,
        lastJsonMessage,
        sendMessage,
        sendJsonMessage,
        connect,
        disconnect,
        isConnected: connectionStatus === 'Connected',
        isConnecting: connectionStatus.includes('Reconnecting'),
        isFailed: connectionStatus === 'Failed'
    };
};

export default useWebSocket;

