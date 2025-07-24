/**
 * System Health Panel
 * Displays overall system health status and connection information
 */

import React from 'react';
import { 
    CheckCircle, 
    AlertTriangle, 
    XCircle, 
    Wifi, 
    WifiOff, 
    Activity 
} from 'lucide-react';
import useTheme from '../hooks/useTheme';

const SystemHealthPanel = ({ 
    health = { status: 'unknown', issues: [] }, 
    connectionStatus = 'Disconnected',
    isConnected = false
}) => {
    const { getThemeClasses } = useTheme();
    const themeClasses = getThemeClasses();

    // Get health status icon and color
    const getHealthStatus = () => {
        switch (health.status) {
            case 'healthy':
                return {
                    icon: <CheckCircle className="w-6 h-6 text-green-400" />,
                    text: 'System Healthy',
                    color: 'text-green-400'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
                    text: 'System Warning',
                    color: 'text-yellow-400'
                };
            case 'error':
                return {
                    icon: <XCircle className="w-6 h-6 text-red-400" />,
                    text: 'System Error',
                    color: 'text-red-400'
                };
            default:
                return {
                    icon: <Activity className="w-6 h-6 text-gray-400" />,
                    text: 'Status Unknown',
                    color: 'text-gray-400'
                };
        }
    };

    // Get connection status icon and color
    const getConnectionStatus = () => {
        if (isConnected) {
            return {
                icon: <Wifi className="w-4 h-4 text-green-400" />,
                text: 'Connected',
                color: 'text-green-400'
            };
        }
        
        if (connectionStatus.includes('Reconnecting')) {
            return {
                icon: <WifiOff className="w-4 h-4 text-yellow-400 animate-pulse" />,
                text: 'Reconnecting',
                color: 'text-yellow-400'
            };
        }
        
        return {
            icon: <WifiOff className="w-4 h-4 text-red-400" />,
            text: 'Disconnected',
            color: 'text-red-400'
        };
    };

    const healthStatus = getHealthStatus();
    const connStatus = getConnectionStatus();

    return (
        <div className={`${themeClasses.panelBackground} ${themeClasses.panelBorder} border rounded-lg p-4`}>
            {/* Main Health Status */}
            <div className="flex items-center space-x-3 mb-4">
                {healthStatus.icon}
                <div>
                    <h3 className={`text-lg font-semibold ${healthStatus.color}`}>
                        {healthStatus.text}
                    </h3>
                    <p className={`text-xs ${themeClasses.textMuted}`}>
                        Last check: {health.lastUpdate ? new Date(health.lastUpdate).toLocaleTimeString() : 'Never'}
                    </p>
                </div>
            </div>

            {/* System Issues */}
            {health.issues && health.issues.length > 0 && (
                <div className="mb-4">
                    <h4 className={`text-sm font-medium ${themeClasses.textPrimary} mb-2`}>
                        Active Issues
                    </h4>
                    <ul className="space-y-2">
                        {health.issues.map((issue, index) => (
                            <li key={index} className="flex items-start space-x-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-1 shrink-0" />
                                <span className={`text-sm ${themeClasses.textSecondary}`}>
                                    {issue}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Connection Status */}
            <div className={`pt-4 border-t ${themeClasses.borderLight}`}>
                <h4 className={`text-sm font-medium ${themeClasses.textPrimary} mb-2`}>
                    Real-time Connection
                </h4>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {connStatus.icon}
                        <span className={`text-sm ${themeClasses.textSecondary}`}>
                            WebSocket Status
                        </span>
                    </div>
                    <span className={`text-sm font-medium ${connStatus.color}`}>
                        {connStatus.text}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthPanel;
