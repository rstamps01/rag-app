/**
 * Data Flow Animation Component
 * Animated particles showing data flow between pipeline nodes
 */

import React, { useEffect, useState } from 'react';
import useTheme from '../hooks/useTheme';

const DataFlowAnimation = ({ 
    from, 
    to, 
    speed = 2000, 
    isActive = false,
    particleCount = 3 
}) => {
    const { isDark } = useTheme();
    const [particles, setParticles] = useState([]);

    // Calculate path between nodes
    const calculatePath = () => {
        const startX = from.x;
        const startY = from.y;
        const endX = to.x;
        const endY = to.y;
        
        // Calculate control points for smooth curve
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        const controlPoint1X = startX + deltaX * 0.5;
        const controlPoint1Y = startY;
        const controlPoint2X = endX - deltaX * 0.5;
        const controlPoint2Y = endY;
        
        return `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
    };

    // Generate particles with staggered timing
    useEffect(() => {
        if (!isActive) {
            setParticles([]);
            return;
        }

        const newParticles = [];
        for (let i = 0; i < particleCount; i++) {
            newParticles.push({
                id: i,
                delay: (i * speed) / particleCount,
                size: Math.random() * 2 + 2, // Random size between 2-4
                opacity: Math.random() * 0.5 + 0.5, // Random opacity between 0.5-1
                color: getParticleColor()
            });
        }
        
        setParticles(newParticles);
    }, [isActive, speed, particleCount]);

    // Get particle color based on theme and data type
    const getParticleColor = () => {
        const colors = [
            '#3B82F6', // blue
            '#10B981', // green
            '#F59E0B', // yellow
            '#8B5CF6', // purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    if (!isActive || particles.length === 0) {
        return null;
    }

    const path = calculatePath();

    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            {particles.map((particle) => (
                <circle
                    key={particle.id}
                    r={particle.size}
                    fill={particle.color}
                    opacity={particle.opacity}
                    filter="blur(0.5px)"
                >
                    <animateMotion
                        dur={`${speed}ms`}
                        repeatCount="indefinite"
                        path={path}
                        begin={`${particle.delay}ms`}
                    />
                    
                    {/* Fade in/out animation */}
                    <animate
                        attributeName="opacity"
                        values={`0;${particle.opacity};0`}
                        dur={`${speed}ms`}
                        repeatCount="indefinite"
                        begin={`${particle.delay}ms`}
                    />
                    
                    {/* Size pulsing animation */}
                    <animate
                        attributeName="r"
                        values={`${particle.size};${particle.size * 1.5};${particle.size}`}
                        dur={`${speed / 2}ms`}
                        repeatCount="indefinite"
                        begin={`${particle.delay}ms`}
                    />
                </circle>
            ))}
            
            {/* Trail effect */}
            {particles.map((particle) => (
                <circle
                    key={`trail-${particle.id}`}
                    r={particle.size * 0.5}
                    fill={particle.color}
                    opacity={particle.opacity * 0.3}
                >
                    <animateMotion
                        dur={`${speed * 1.2}ms`}
                        repeatCount="indefinite"
                        path={path}
                        begin={`${particle.delay + 100}ms`}
                    />
                    
                    <animate
                        attributeName="opacity"
                        values={`0;${particle.opacity * 0.3};0`}
                        dur={`${speed * 1.2}ms`}
                        repeatCount="indefinite"
                        begin={`${particle.delay + 100}ms`}
                    />
                </circle>
            ))}
        </svg>
    );
};

export default DataFlowAnimation;

