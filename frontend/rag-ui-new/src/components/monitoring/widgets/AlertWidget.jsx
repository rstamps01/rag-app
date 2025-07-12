// File: frontend/rag-ui-new/src/components/monitoring/widgets/AlertWidget.jsx
// AlertWidget - Displays alerts, notifications, and system warnings

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  AlertTriangle, AlertCircle, CheckCircle, Info, X, 
  Clock, User, Settings, Filter, Search, Bell,
  ChevronDown, ChevronUp, ExternalLink, Archive
} from 'lucide-react';

const AlertWidget = ({ 
  alerts = [], 
  onAlertAction,
  onAlertDismiss,
  showFilters = true,
  maxDisplayed = 10,
  autoRefresh = true,
  refreshInterval = 30000 
}) => {
  const [currentAlerts, setCurrentAlerts] = useState(alerts);
  const [filteredAlerts, setFilteredAlerts] = useState(alerts);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [showDismissed, setShowDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Alert severity levels
  const severityLevels = {
    critical: {
      label: 'Critical',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'destructive'
    },
    high: {
      label: 'High',
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'destructive'
    },
    medium: {
      label: 'Medium',
      icon: Info,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'secondary'
    },
    low: {
      label: 'Low',
      icon: Info,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'outline'
    },
    info: {
      label: 'Info',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'default'
    }
  };

  // Alert categories
  const categories = [
    'system', 'performance', 'security', 'database', 
    'api', 'storage', 'network', 'user', 'deployment'
  ];

  // Sample alerts for demonstration
  const sampleAlerts = [
    {
      id: '1',
      title: 'High GPU Memory Usage',
      message: 'GPU memory usage has exceeded 90% for the last 5 minutes. Consider optimizing model loading or scaling resources.',
      severity: 'high',
      category: 'performance',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      source: 'GPU Monitor',
      acknowledged: false,
      dismissed: false,
      actions: [
        { label: 'Scale Resources', action: 'scale_gpu' },
        { label: 'View Details', action: 'view_gpu_details' }
      ],
      metadata: {
        current_usage: '92%',
        threshold: '90%',
        duration: '5 minutes'
      }
    },
    {
      id: '2',
      title: 'Database Connection Pool Exhausted',
      message: 'PostgreSQL connection pool has reached maximum capacity. New connections are being queued.',
      severity: 'critical',
      category: 'database',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      source: 'Database Monitor',
      acknowledged: false,
      dismissed: false,
      actions: [
        { label: 'Increase Pool Size', action: 'increase_pool' },
        { label: 'Kill Idle Connections', action: 'kill_idle' }
      ],
      metadata: {
        active_connections: '100',
        max_connections: '100',
        queued_requests: '15'
      }
    },
    {
      id: '3',
      title: 'Document Processing Backlog',
      message: 'Document processing queue has 50+ pending items. Processing time may be delayed.',
      severity: 'medium',
      category: 'system',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      source: 'Document Processor',
      acknowledged: true,
      dismissed: false,
      actions: [
        { label: 'Scale Workers', action: 'scale_workers' },
        { label: 'View Queue', action: 'view_queue' }
      ],
      metadata: {
        queue_size: '52',
        processing_rate: '5/min',
        estimated_delay: '10 minutes'
      }
    },
    {
      id: '4',
      title: 'API Response Time Degradation',
      message: 'Average API response time has increased by 40% in the last hour.',
      severity: 'medium',
      category: 'api',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      source: 'API Monitor',
      acknowledged: false,
      dismissed: false,
      actions: [
        { label: 'Analyze Bottlenecks', action: 'analyze_performance' },
        { label: 'View Traces', action: 'view_traces' }
      ],
      metadata: {
        current_avg: '850ms',
        baseline_avg: '600ms',
        increase: '41.7%'
      }
    },
    {
      id: '5',
      title: 'Successful Model Update',
      message: 'Mistral model has been successfully updated to version 2.1. All services are running normally.',
      severity: 'info',
      category: 'deployment',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      source: 'Deployment Manager',
      acknowledged: false,
      dismissed: false,
      actions: [
        { label: 'View Changelog', action: 'view_changelog' }
      ],
      metadata: {
        previous_version: '2.0',
        new_version: '2.1',
        deployment_time: '2 minutes'
      }
    }
  ];

  // Initialize with sample data if no alerts provided
  useEffect(() => {
    if (alerts.length === 0) {
      setCurrentAlerts(sampleAlerts);
    } else {
      setCurrentAlerts(alerts);
    }
  }, [alerts]);

  // Fetch alerts from API
  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/monitoring/alerts');
      const data = await response.json();
      setCurrentAlerts(data.alerts || sampleAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setCurrentAlerts(sampleAlerts);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh alerts
  useEffect(() => {
    if (autoRefresh) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Filter alerts
  useEffect(() => {
    let filtered = currentAlerts.filter(alert => {
      if (!showDismissed && alert.dismissed) return false;
      
      if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'all' && alert.category !== selectedCategory) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          alert.title.toLowerCase().includes(searchLower) ||
          alert.message.toLowerCase().includes(searchLower) ||
          alert.source.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });

    // Sort by severity and timestamp
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    filtered.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    setFilteredAlerts(filtered.slice(0, maxDisplayed));
  }, [currentAlerts, selectedSeverity, selectedCategory, searchTerm, showDismissed, maxDisplayed]);

  // Handle alert actions
  const handleAlertAction = (alert, action) => {
    onAlertAction?.(alert, action);
    
    // Update local state
    setCurrentAlerts(prev => 
      prev.map(a => 
        a.id === alert.id 
          ? { ...a, acknowledged: true }
          : a
      )
    );
  };

  // Handle alert dismissal
  const handleAlertDismiss = (alertId) => {
    onAlertDismiss?.(alertId);
    
    setCurrentAlerts(prev => 
      prev.map(a => 
        a.id === alertId 
          ? { ...a, dismissed: true }
          : a
      )
    );
  };

  // Get alert counts by severity
  const getAlertCounts = () => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    currentAlerts.filter(a => !a.dismissed).forEach(alert => {
      counts[alert.severity]++;
    });
    return counts;
  };

  const alertCounts = getAlertCounts();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            System Alerts
            <Badge variant="secondary" className="ml-2">
              {filteredAlerts.filter(a => !a.dismissed).length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDismissed(!showDismissed)}
            >
              <Archive className="h-4 w-4" />
              {showDismissed ? 'Hide' : 'Show'} Dismissed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAlerts}
              disabled={isLoading}
            >
              <Bell className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="flex gap-2 mt-2">
          {Object.entries(alertCounts).map(([severity, count]) => {
            const config = severityLevels[severity];
            if (count === 0) return null;
            
            return (
              <Badge
                key={severity}
                variant={config.badge}
                className="text-xs"
              >
                {count} {config.label}
              </Badge>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        {showFilters && (
          <div className="mb-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Severities</option>
                {Object.entries(severityLevels).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No alerts to display</p>
              <p className="text-sm">All systems are running normally</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const config = severityLevels[alert.severity];
              const AlertIcon = config.icon;
              const isExpanded = expandedAlert === alert.id;
              
              return (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 transition-all ${config.border} ${config.bg} ${
                    alert.dismissed ? 'opacity-60' : ''
                  }`}
                >
                  {/* Alert Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertIcon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <Badge variant={config.badge} className="text-xs">
                            {config.label}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-xs">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {alert.source}
                          </span>
                          <span className="capitalize">{alert.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {!alert.dismissed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAlertDismiss(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Metadata */}
                      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-sm mb-2">Details</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(alert.metadata).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-gray-600">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                </span>
                                <span className="ml-2 font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {alert.actions && alert.actions.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Available Actions</h5>
                          <div className="flex gap-2 flex-wrap">
                            {alert.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAlertAction(alert, action.action)}
                                className="text-xs"
                              >
                                {action.label}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Load More */}
        {currentAlerts.length > maxDisplayed && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaxDisplayed(prev => prev + 10)}
            >
              Load More Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertWidget;
