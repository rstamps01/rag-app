// Live Data Flow Animation - Real-time data movement visualization
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const LiveDataFlowAnimation = ({ 
  documents = [], 
  nodes = [], 
  connections = [], 
  animationSpeed = 1,
  onSpeedChange 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [particles, setParticles] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Animation settings
  const [settings, setSettings] = useState({
    particleCount: 50,
    particleSize: 3,
    particleSpeed: animationSpeed,
    showTrails: true,
    colorScheme: 'default'
  });

  const colorSchemes = {
    default: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
    warm: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'],
    cool: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
    neon: ['#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#8000ff']
  };

  // Initialize particles
  useEffect(() => {
    const initParticles = () => {
      const newParticles = [];
      for (let i = 0; i < settings.particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 800,
          y: Math.random() * 400,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          color: colorSchemes[settings.colorScheme][i % colorSchemes[settings.colorScheme].length],
          size: settings.particleSize + Math.random() * 2,
          trail: []
        });
      }
      setParticles(newParticles);
    };

    initParticles();
  }, [settings.particleCount, settings.particleSize, settings.colorScheme]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (!isPlaying) return;

      setParticles(prevParticles => 
        prevParticles.map(particle => {
          const newX = particle.x + particle.vx * settings.particleSpeed;
          const newY = particle.y + particle.vy * settings.particleSpeed;

          // Bounce off edges
          let newVx = particle.vx;
          let newVy = particle.vy;
          
          if (newX <= 0 || newX >= 800) newVx = -particle.vx;
          if (newY <= 0 || newY >= 400) newVy = -particle.vy;

          // Update trail
          const newTrail = settings.showTrails 
            ? [...particle.trail, { x: particle.x, y: particle.y }].slice(-10)
            : [];

          return {
            ...particle,
            x: Math.max(0, Math.min(800, newX)),
            y: Math.max(0, Math.min(400, newY)),
            vx: newVx,
            vy: newVy,
            trail: newTrail
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, settings.particleSpeed, settings.showTrails]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles and trails
    particles.forEach(particle => {
      // Draw trail
      if (settings.showTrails && particle.trail.length > 1) {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        particle.trail.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw particle
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [particles, settings.showTrails]);

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };

  const resetAnimation = () => {
    setParticles(prevParticles => 
      prevParticles.map(particle => ({
        ...particle,
        x: Math.random() * 800,
        y: Math.random() * 400,
        trail: []
      }))
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            Live Data Flow Animation
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAnimation}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetAnimation}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Animation Canvas */}
        <div className="relative border rounded-lg overflow-hidden bg-gray-900">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-auto"
          />
          
          {/* Overlay Information */}
          <div className="absolute top-4 left-4 text-white">
            <div className="text-sm">
              <div>Active Particles: {particles.length}</div>
              <div>Speed: {settings.particleSpeed}x</div>
              <div>Status: {isPlaying ? 'Playing' : 'Paused'}</div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Animation Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Particle Count</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.particleCount}
                  onChange={(e) => setSettings(prev => ({ ...prev, particleCount: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-xs text-gray-600">{settings.particleCount}</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Speed</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={settings.particleSpeed}
                  onChange={(e) => setSettings(prev => ({ ...prev, particleSpeed: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-xs text-gray-600">{settings.particleSpeed}x</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color Scheme</label>
                <select
                  value={settings.colorScheme}
                  onChange={(e) => setSettings(prev => ({ ...prev, colorScheme: e.target.value }))}
                  className="w-full px-2 py-1 border rounded"
                >
                  <option value="default">Default</option>
                  <option value="warm">Warm</option>
                  <option value="cool">Cool</option>
                  <option value="neon">Neon</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showTrails}
                    onChange={(e) => setSettings(prev => ({ ...prev, showTrails: e.target.checked }))}
                  />
                  <span className="text-sm">Show Trails</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveDataFlowAnimation;