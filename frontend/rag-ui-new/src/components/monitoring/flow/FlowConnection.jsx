/**
 * Flow Connection Component
 * Renders connections between pipeline nodes with theme support
 */

import React from 'react';
import useTheme from '../hooks/useTheme';

const FlowConnection = ({ 
    from, 
    to, 
    active = false, 
    debugMode = false, 
    isConnected = false 
}) => {
    const { getThemeClasses, isDark } = useTheme();
    const themeClasses = getThemeClasses();

    // Calculate connection path
    const calculatePath = () => {
        const startX = from.x;
        const startY = from.y;
        const endX = to.x;
        const endY = to.y;
        
        // Calculate control points for smooth curve
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Adjust control points based on direction
        const controlPoint1X = startX + deltaX * 0.5;
        const controlPoint1Y = startY;
        const controlPoint2X = endX - deltaX * 0.5;
        const controlPoint2Y = endY;
        
        return `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
    };

    // Get connection styling based on state
    const getConnectionStyles = () => {
        const baseStyles = {
            fill: 'none',
            strokeWidth: active ? 3 : 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
        };

        if (!isConnected) {
            return {
                ...baseStyles,
                stroke: isDark ? '#6B7280' : '#9CA3AF',
                strokeDasharray: '5,5',
                opacity: 0.5
            };
        }

        if (active) {
            return {
                ...baseStyles,
                stroke: '#3B82F6',
                strokeDasharray: '0',
                opacity: 1,
                filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))'
            };
        }

        return {
            ...baseStyles,
            stroke: isDark ? '#4B5563' : '#D1D5DB',
            strokeDasharray: '0',
            opacity: 0.7
        };
    };

    // Get arrow marker styling
    const getArrowStyles = () => {
        if (!isConnected) {
            return {
                fill: isDark ? '#6B7280' : '#9CA3AF',
                opacity: 0.5
            };
        }

        if (active) {
            return {
                fill: '#3B82F6',
                opacity: 1
            };
        }

        return {
            fill: isDark ? '#4B5563' : '#D1D5DB',
            opacity: 0.7
        };
    };

    const path = calculatePath();
    const connectionStyles = getConnectionStyles();
    const arrowStyles = getArrowStyles();
    
    // Generate unique IDs for markers
    const markerId = `arrow-${from.x}-${from.y}-${to.x}-${to.y}`;
    const glowMarkerId = `arrow-glow-${from.x}-${from.y}-${to.x}-${to.y}`;

    return (
        <g className="flow-connection">
            {/* Define arrow markers */}
            <defs>
                {/* Regular arrow marker */}
                <marker
                    id={markerId}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="3"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path
                        d="M0,0 L0,6 L9,3 z"
                        style={arrowStyles}
                    />
                </marker>
                
                {/* Glow effect for active connections */}
                {active && (
                    <marker
                        id={glowMarkerId}
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="3"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path
                            d="M0,0 L0,6 L9,3 z"
                            fill="#3B82F6"
                            opacity="0.3"
                            filter="blur(1px)"
                        />
                    </marker>
                )}
            </defs>
            
            {/* Glow effect for active connections */}
            {active && isConnected && (
                <path
                    d={path}
                    stroke="#3B82F6"
                    strokeWidth="6"
                    fill="none"
                    opacity="0.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd={`url(#${glowMarkerId})`}
                />
            )}
            
            {/* Main connection path */}
            <path
                d={path}
                style={connectionStyles}
                markerEnd={`url(#${markerId})`}
                className={active ? 'animate-pulse' : ''}
            />
            
            {/* Data flow animation for active connections */}
            {active && isConnected && (
                <circle
                    r="3"
                    fill="#3B82F6"
                    opacity="0.8"
                >
                    <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={path}
                    />
                </circle>
            )}
            
            {/* Debug information */}
            {debugMode && (
                <g className="debug-info">
                    {/* Connection midpoint */}
                    <circle
                        cx={(from.x + to.x) / 2}
                        cy={(from.y + to.y) / 2}
                        r="2"
                        fill={active ? '#3B82F6' : '#6B7280'}
                        opacity="0.7"
                    />
                    
                    {/* Connection label */}
                    <text
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 10}
                        textAnchor="middle"
                        className={`text-xs ${themeClasses.textMuted}`}
                        fill="currentColor"
                    >
                        {active ? 'ACTIVE' : 'IDLE'}
                    </text>
                </g>
            )}
            
            {/* Connection hover area for interaction */}
            <path
                d={path}
                stroke="transparent"
                strokeWidth="20"
                fill="none"
                className="cursor-pointer"
                title={`Connection: ${active ? 'Active' : 'Idle'}`}
            />
        </g>
    );
};

export default FlowConnection;
