import React, { useEffect, useRef, useState } from 'react';

/**
 * Advanced Data Flow Animations Component
 * 
 * Provides sophisticated animations for data flow visualization including:
 * - Particle systems for data movement
 * - Processing indicators with different states
 * - Connection strength visualization
 * - Real-time throughput indicators
 */

// Particle System for Data Flow
export const DataFlowParticles = ({ 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  isActive, 
  throughput = 0,
  particleCount = 5,
  speed = 1
}) => {
  const [particles, setParticles] = useState([]);
  const animationRef = useRef();

  useEffect(() => {
    if (!isActive || throughput === 0) {
      setParticles([]);
      return;
    }

    const createParticle = (index) => ({
      id: `particle-${index}`,
      progress: 0,
      delay: index * (1000 / particleCount),
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.5 + 0.5
    });

    const initialParticles = Array.from({ length: particleCount }, (_, i) => createParticle(i));
    setParticles(initialParticles);

    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          const newProgress = particle.progress + (0.02 * speed);
          return {
            ...particle,
            progress: newProgress >= 1 ? 0 : newProgress
          };
        })
      );
    };

    animationRef.current = setInterval(animate, 16);
    return () => clearInterval(animationRef.current);
  }, [isActive, throughput, particleCount, speed]);

  if (!isActive || particles.length === 0) return null;

  return (
    <g>
      {particles.map(particle => {
        const progress = particle.progress;
        const x = sourceX + (targetX - sourceX) * progress;
        const y = sourceY + (targetY - sourceY) * progress;
        
        // Add some curve to the particle path
        const curveOffset = Math.sin(progress * Math.PI) * 20;
        const finalY = y + curveOffset;

        return (
          <circle
            key={particle.id}
            cx={x}
            cy={finalY}
            r={particle.size}
            fill="#00D4AA"
            opacity={particle.opacity * (1 - progress)}
            style={{
              filter: 'drop-shadow(0 0 4px #00D4AA)',
              animation: `particle-glow 2s infinite`
            }}
          />
        );
      })}
    </g>
  );
};

// Processing Indicator with Different States
export const ProcessingIndicator = ({ 
  status, 
  intensity = 1, 
  size = 20,
  color = '#00D4AA'
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const animationRef = useRef();

  useEffect(() => {
    if (status !== 'processing' && status !== 'active') {
      setAnimationPhase(0);
      return;
    }

    const animate = () => {
      setAnimationPhase(prev => (prev + 0.1) % (Math.PI * 2));
    };

    animationRef.current = setInterval(animate, 50);
    return () => clearInterval(animationRef.current);
  }, [status]);

  const getIndicatorStyle = () => {
    const baseStyle = {
      width: size,
      height: size,
      borderRadius: '50%',
      position: 'relative',
      overflow: 'hidden'
    };

    switch (status) {
      case 'processing':
        return {
          ...baseStyle,
          background: `conic-gradient(from ${animationPhase}rad, ${color}, transparent)`,
          animation: 'spin 1s linear infinite'
        };
      case 'active':
        return {
          ...baseStyle,
          background: color,
          boxShadow: `0 0 ${size * 0.5}px ${color}`,
          animation: 'pulse 1.5s ease-in-out infinite'
        };
      case 'success':
        return {
          ...baseStyle,
          background: '#10B981',
          boxShadow: `0 0 ${size * 0.3}px #10B981`
        };
      case 'error':
        return {
          ...baseStyle,
          background: '#EF4444',
          boxShadow: `0 0 ${size * 0.3}px #EF4444`,
          animation: 'shake 0.5s ease-in-out infinite'
        };
      default:
        return {
          ...baseStyle,
          background: '#6B7280',
          opacity: 0.5
        };
    }
  };

  return (
    <div style={getIndicatorStyle()}>
      {status === 'processing' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.6,
          height: size * 0.6,
          background: 'white',
          borderRadius: '50%'
        }} />
      )}
    </div>
  );
};

// Connection Strength Visualization
export const ConnectionStrengthIndicator = ({ 
  strength, 
  maxStrength = 100,
  width = 200,
  height = 4
}) => {
  const strengthPercentage = Math.min((strength / maxStrength) * 100, 100);
  
  const getStrengthColor = (percentage) => {
    if (percentage < 30) return '#EF4444';
    if (percentage < 60) return '#F59E0B';
    if (percentage < 80) return '#3B82F6';
    return '#10B981';
  };

  return (
    <div style={{
      width,
      height,
      background: '#E5E7EB',
      borderRadius: height / 2,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div
        style={{
          width: `${strengthPercentage}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${getStrengthColor(strengthPercentage)}, ${getStrengthColor(strengthPercentage)}dd)`,
          borderRadius: height / 2,
          transition: 'width 0.3s ease',
          boxShadow: `0 0 8px ${getStrengthColor(strengthPercentage)}40`
        }}
      />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '10px',
        fontWeight: 'bold',
        color: strengthPercentage > 50 ? 'white' : '#374151'
      }}>
        {Math.round(strengthPercentage)}%
      </div>
    </div>
  );
};

// Real-time Throughput Indicator
export const ThroughputIndicator = ({ 
  throughput, 
  maxThroughput = 100,
  size = 60,
  showLabel = true
}) => {
  const [currentThroughput, setCurrentThroughput] = useState(0);
  const animationRef = useRef();

  useEffect(() => {
    const animate = () => {
      setCurrentThroughput(prev => {
        const diff = throughput - prev;
        return prev + diff * 0.1; // Smooth transition
      });
    };

    animationRef.current = setInterval(animate, 16);
    return () => clearInterval(animationRef.current);
  }, [throughput]);

  const percentage = Math.min((currentThroughput / maxThroughput) * 100, 100);
  const circumference = 2 * Math.PI * (size / 2 - 5);
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 5}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 5}
          fill="none"
          stroke="#00D4AA"
          strokeWidth="4"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dasharray 0.3s ease',
            filter: 'drop-shadow(0 0 4px #00D4AA)'
          }}
        />
      </svg>
      
      {/* Center text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#374151'
      }}>
        {Math.round(currentThroughput)}
        {showLabel && <div style={{ fontSize: '8px', color: '#6B7280' }}>req/min</div>}
      </div>
    </div>
  );
};

// Data Processing Wave Animation
export const DataProcessingWave = ({ 
  isActive, 
  intensity = 1,
  color = '#00D4AA',
  width = 100,
  height = 20
}) => {
  const [wavePhase, setWavePhase] = useState(0);
  const animationRef = useRef();

  useEffect(() => {
    if (!isActive) {
      setWavePhase(0);
      return;
    }

    const animate = () => {
      setWavePhase(prev => (prev + 0.1) % (Math.PI * 2));
    };

    animationRef.current = setInterval(animate, 50);
    return () => clearInterval(animationRef.current);
  }, [isActive]);

  if (!isActive) return null;

  const wavePath = `M 0 ${height / 2} ${Array.from({ length: 20 }, (_, i) => {
    const x = (i / 19) * width;
    const y = height / 2 + Math.sin(wavePhase + i * 0.5) * intensity * 5;
    return `L ${x} ${y}`;
  }).join(' ')} L ${width} ${height / 2}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <path
        d={wavePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        opacity="0.8"
        style={{
          filter: `drop-shadow(0 0 4px ${color})`
        }}
      />
    </svg>
  );
};

// Memory Usage Visualization
export const MemoryUsageVisualization = ({ 
  used, 
  total, 
  width = 200,
  height = 100
}) => {
  const percentage = (used / total) * 100;
  
  return (
    <div style={{
      width,
      height,
      background: 'linear-gradient(135deg, #1F2937, #374151)',
      borderRadius: '8px',
      padding: '8px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Memory bars */}
      <div style={{
        display: 'flex',
        height: '100%',
        gap: '2px'
      }}>
        {Array.from({ length: 20 }, (_, i) => {
          const barHeight = Math.random() * 100;
          const isUsed = (i / 20) * 100 < percentage;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: isUsed 
                  ? `linear-gradient(to top, #00D4AA, #00D4AAdd)` 
                  : '#374151',
                height: `${barHeight}%`,
                borderRadius: '1px',
                transition: 'all 0.3s ease',
                boxShadow: isUsed ? '0 0 4px #00D4AA40' : 'none'
              }}
            />
          );
        })}
      </div>
      
      {/* Usage text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        textShadow: '0 0 4px rgba(0,0,0,0.8)'
      }}>
        {Math.round(percentage)}%
      </div>
    </div>
  );
};

// CSS Animations
export const AnimationStyles = () => (
  <style jsx>{`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }
    
    @keyframes particle-glow {
      0%, 100% { opacity: 0.8; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
  `}</style>
);

export default {
  DataFlowParticles,
  ProcessingIndicator,
  ConnectionStrengthIndicator,
  ThroughputIndicator,
  DataProcessingWave,
  MemoryUsageVisualization,
  AnimationStyles
};
