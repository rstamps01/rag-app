import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (url) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = () => {
        try {
            const ws = new WebSocket(url);
            
            ws.onopen = () => {
                setIsConnected(true);
                setConnectionStatus('Connected');
                reconnectAttempts.current = 0;
                console.log('WebSocket connected to:', url);
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            ws.onclose = () => {
                setIsConnected(false);
                setConnectionStatus('Disconnected');
                console.log('WebSocket disconnected');
                
                // Attempt to reconnect
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    setConnectionStatus(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 3000 * reconnectAttempts.current); // Exponential backoff
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionStatus('Error');
            };
            
            setSocket(ws);
            
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            setConnectionStatus('Error');
        }
    };

    useEffect(() => {
        connect();
        
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socket) {
                socket.close();
            }
        };
    }, [url]);

    const sendMessage = (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    };

    return { 
        socket, 
        isConnected, 
        lastMessage, 
        connectionStatus, 
        sendMessage 
    };
};

export default useWebSocket;