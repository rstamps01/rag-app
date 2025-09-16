import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Performance Monitor Component
 * 
 * Provides real-time performance monitoring with charts and metrics
 * for the RAG pipeline visualization system.
 */
const PerformanceMonitor = ({ 
  pipelineStats, 
  historicalData = [],
  showCharts = true,
  refreshInterval = 1000 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [performanceAlerts, setPerformanceAlerts] = useState([]);
  
  // Update current time for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  // Performance thresholds
  const thresholds = {
    cpu: { warning: 80, critical: 90 },
    memory: { warning: 80, critical: 90 },
    gpu: { warning: 85, critical: 95 },
    temperature: { warning: 80, critical: 85 },
    responseTime: { warning: 2000, critical: 5000 }
  };
  
  // Calculate performance status
  const getPerformanceStatus = (value, type) => {
    const threshold = thresholds[type];
    if (!threshold) return 'normal';
    
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };
  
  // Generate performance alerts
  useEffect(() => {
    if (!pipelineStats) return;
    
    const alerts = [];
    
    // CPU Alert
    const cpuStatus = getPerformanceStatus(pipelineStats.cpuUsage, 'cpu');
    if (cpuStatus !== 'normal') {
      alerts.push({
        id: 'cpu',
        type: 'cpu',
        status: cpuStatus,
        message: `CPU usage is ${pipelineStats.cpuUsage}%`,
        value: pipelineStats.cpuUsage
      });
    }
    
    // Memory Alert
    const memoryStatus = getPerformanceStatus(pipelineStats.memoryUsage, 'memory');
    if (memoryStatus !== 'normal') {
      alerts.push({
        id: 'memory',
        type: 'memory',
        status: memoryStatus,
        message: `Memory usage is ${pipelineStats.memoryUsage}%`,
        value: pipelineStats.memoryUsage
      });
    }
    
    // GPU Alert
    const gpuStatus = getPerformanceStatus(pipelineStats.gpuUtilization, 'gpu');
    if (gpuStatus !== 'normal') {
      alerts.push({
        id: 'gpu',
        type: 'gpu',
        status: gpuStatus,
        message: `GPU utilization is ${pipelineStats.gpuUtilization}%`,
        value: pipelineStats.gpuUtilization
      });
    }
    
    // Temperature Alert
    const tempStatus = getPerformanceStatus(pipelineStats.gpuTemperature, 'temperature');
    if (tempStatus !== 'normal') {
      alerts.push({
        id: 'temperature',
        type: 'temperature',
        status: tempStatus,
        message: `GPU temperature is ${pipelineStats.gpuTemperature}°C`,
        value: pipelineStats.gpuTemperature
      });
    }
    
    // Response Time Alert
    const responseStatus = getPerformanceStatus(pipelineStats.avgResponseTime, 'responseTime');
    if (responseStatus !== 'normal') {
      alerts.push({
        id: 'response',
        type: 'response',
        status: responseStatus,
        message: `Average response time is ${pipelineStats.avgResponseTime}ms`,
        value: pipelineStats.avgResponseTime
      });
    }
    
    setPerformanceAlerts(alerts);
  }, [pipelineStats]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!historicalData.length) {
      // Generate sample data if no historical data
      const sampleData = [];
      for (let i = 0; i < 20; i++) {
        sampleData.push({
          time: new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString(),
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          gpu: Math.random() * 100,
          queries: Math.floor(Math.random() * 50)
        });
      }
      return sampleData;
    }
    
    return historicalData.slice(-20); // Last 20 data points
  }, [historicalData]);
  
  // Performance metrics cards
  const PerformanceCard = ({ title, value, unit, status, icon, color }) => (
    <Card className="performance-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">{title}</div>
            <div className="text-2xl font-bold" style={{ color }}>
              {value}{unit}
            </div>
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
        <div className="mt-2">
          <Progress 
            value={value} 
            className="h-2"
            style={{
              backgroundColor: status === 'critical' ? '#ef4444' : 
                              status === 'warning' ? '#f59e0b' : '#10b981'
            }}
          />
        </div>
        <div className="mt-1">
          <Badge 
            variant={status === 'critical' ? 'destructive' : 
                    status === 'warning' ? 'secondary' : 'default'}
            className="text-xs"
          >
            {status.toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
  
  // Alert component
  const AlertItem = ({ alert }) => (
    <div className={`alert-item p-3 rounded-lg border-l-4 ${
      alert.status === 'critical' ? 'bg-red-50 border-red-400' :
      alert.status === 'warning' ? 'bg-yellow-50 border-yellow-400' :
      'bg-green-50 border-green-400'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">
            {alert.type.toUpperCase()} Alert
          </div>
          <div className="text-sm text-gray-600">{alert.message}</div>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          alert.status === 'critical' ? 'bg-red-500' :
          alert.status === 'warning' ? 'bg-yellow-500' :
          'bg-green-500'
        }`} />
      </div>
    </div>
  );
  
  if (!pipelineStats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">Loading performance data...</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="performance-monitor space-y-6">
      {/* Performance Alerts */}
      {performanceAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceAlerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformanceCard
          title="CPU Usage"
          value={pipelineStats.cpuUsage}
          unit="%"
          status={getPerformanceStatus(pipelineStats.cpuUsage, 'cpu')}
          icon="🖥️"
          color="#3b82f6"
        />
        <PerformanceCard
          title="Memory Usage"
          value={pipelineStats.memoryUsage}
          unit="%"
          status={getPerformanceStatus(pipelineStats.memoryUsage, 'memory')}
          icon="💾"
          color="#8b5cf6"
        />
        <PerformanceCard
          title="GPU Utilization"
          value={pipelineStats.gpuUtilization}
          unit="%"
          status={getPerformanceStatus(pipelineStats.gpuUtilization, 'gpu')}
          icon="🎮"
          color="#10b981"
        />
        <PerformanceCard
          title="GPU Temperature"
          value={pipelineStats.gpuTemperature}
          unit="°C"
          status={getPerformanceStatus(pipelineStats.gpuTemperature, 'temperature')}
          icon="🌡️"
          color={pipelineStats.gpuTemperature > 80 ? "#ef4444" : "#f59e0b"}
        />
      </div>
      
      {/* Pipeline Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PerformanceCard
          title="Queries/min"
          value={pipelineStats.totalQueries}
          unit=""
          status="normal"
          icon="📊"
          color="#06b6d4"
        />
        <PerformanceCard
          title="Response Time"
          value={pipelineStats.avgResponseTime}
          unit="ms"
          status={getPerformanceStatus(pipelineStats.avgResponseTime, 'responseTime')}
          icon="⏱️"
          color="#f59e0b"
        />
        <PerformanceCard
          title="Active Queries"
          value={pipelineStats.activeQueries}
          unit=""
          status="normal"
          icon="🔄"
          color="#8b5cf6"
        />
      </div>
      
      {/* Performance Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resource Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Memory %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gpu" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="GPU %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Query Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Query Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="queries" fill="#06b6d4" name="Queries/min" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600">Connection</div>
              <div className={`font-semibold ${
                pipelineStats.isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {pipelineStats.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Last Update</div>
              <div className="font-semibold">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Alerts</div>
              <div className={`font-semibold ${
                performanceAlerts.length > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {performanceAlerts.length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Status</div>
              <div className={`font-semibold ${
                performanceAlerts.some(a => a.status === 'critical') ? 'text-red-600' :
                performanceAlerts.some(a => a.status === 'warning') ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {performanceAlerts.some(a => a.status === 'critical') ? 'Critical' :
                 performanceAlerts.some(a => a.status === 'warning') ? 'Warning' :
                 'Normal'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;
