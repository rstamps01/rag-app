import React, { useRef, useEffect, CSSProperties } from 'react';
import './MagnetLines.css';

interface MagnetLinesProps {
  targetNode?: any;
  connections?: any[];
  intensity?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

const MagnetLines: React.FC<MagnetLinesProps> = ({
  targetNode,
  connections = [],
  intensity = 0.8,
  color = '#8b5cf6',
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !targetNode) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawLines = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!targetNode || connections.length === 0) return;

      // Get target node position (center of container)
      const targetX = canvas.width / 2;
      const targetY = canvas.height / 2;

      connections.forEach((connection, index) => {
        // Calculate connection position
        const angle = (index / connections.length) * Math.PI * 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        const connectionX = targetX + Math.cos(angle) * radius;
        const connectionY = targetY + Math.sin(angle) * radius;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(connectionX, connectionY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = intensity;
        ctx.stroke();

        // Draw connection point
        ctx.beginPath();
        ctx.arc(connectionX, connectionY, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = intensity;
        ctx.fill();
      });
    };

    drawLines();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [targetNode, connections, intensity, color]);

  if (!targetNode) return null;

  return (
    <div
      ref={containerRef}
      className={`magnet-lines-container ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default MagnetLines;