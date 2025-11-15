/**
 * Metrics Dashboard Page
 * 
 * Comprehensive development tool for validating all metrics and data points.
 * Displays real, calculated, placeholder, and mock data with validation capabilities.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  Search,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Filter,
  Database,
  Cpu,
  HardDrive,
  Network,
  Zap,
  TrendingUp,
  Layers,
  FileText,
  Activity,
  Server,
  Eye,
  EyeOff,
  Play,
  Pause,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Slider } from '../components/ui/slider';

const MetricsDashboardPage = () => {
  // State management
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [numberFormat, setNumberFormat] = useState('raw'); // raw, formatted, compact
  const [showUnits, setShowUnits] = useState(true);
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxItemsPerPage, setMaxItemsPerPage] = useState(50);
  
  // Service availability
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [qdrantAvailable, setQdrantAvailable] = useState(false);
  const [postgresAvailable, setPostgresAvailable] = useState(false);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  
  // Metrics data
  const [comprehensiveMetrics, setComprehensiveMetrics] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  
  // Auto-refresh state per metric
  const [metricAutoRefresh, setMetricAutoRefresh] = useState({});
  
  // Base URLs
  const backendBaseUrl = 'http://localhost:8000/api/v1';
  const qdrantBaseUrl = 'http://localhost:6333';
  
  // WebSocket connection
  const [ws, setWs] = useState(null);

  // Check service availability
  const checkServiceAvailability = useCallback(async () => {
    // Check backend
    try {
      const response = await fetch('http://localhost:8000/health', { method: 'GET' });
      setBackendAvailable(response.ok);
    } catch (error) {
      setBackendAvailable(false);
    }
    
    // Check Qdrant (use backend's connection status from comprehensive metrics)
    try {
      const response = await fetch(`${backendBaseUrl}/metrics/comprehensive`);
      if (response.ok) {
        const data = await response.json();
        const qdrantStatus = data.connection_metrics?.vector_db_status;
        setQdrantAvailable(qdrantStatus === 'connected');
      } else {
        // Fallback to direct health check if comprehensive endpoint fails
        try {
          const healthResponse = await fetch(`${qdrantBaseUrl}/health`, { method: 'GET' });
          setQdrantAvailable(healthResponse.ok);
        } catch (error) {
          setQdrantAvailable(false);
        }
      }
    } catch (error) {
      setQdrantAvailable(false);
    }
    
    // Check PostgreSQL (via backend)
    try {
      const response = await fetch(`${backendBaseUrl}/metrics/comprehensive`);
      if (response.ok) {
        const data = await response.json();
        setPostgresAvailable(data.connection_metrics?.database_status === 'connected');
      } else {
        setPostgresAvailable(false);
      }
    } catch (error) {
      setPostgresAvailable(false);
    }
  }, [backendBaseUrl, qdrantBaseUrl]);

  // Fetch comprehensive metrics
  const fetchComprehensiveMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/metrics/comprehensive`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setComprehensiveMetrics(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching comprehensive metrics:', error);
      setError(`Failed to fetch metrics: ${error.message}`);
    }
  }, [backendBaseUrl]);

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      const endpoints = [
        'ws://localhost:8000/api/v1/ws/pipeline-monitoring',
        'ws://backend-07:8000/api/v1/ws/pipeline-monitoring'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const websocket = new WebSocket(endpoint);
          
          websocket.onopen = () => {
            console.log('WebSocket connected:', endpoint);
            setWebsocketConnected(true);
            setWs(websocket);
          };
          
          websocket.onmessage = (event) => {
            try {
              const rawData = JSON.parse(event.data);
              
              // Handle different WebSocket message formats
              let processedData = rawData;
              
              // If data is wrapped in a 'data' property (from metrics_update type)
              if (rawData.type === 'metrics_update' && rawData.data) {
                processedData = rawData.data;
              }
              
              // Transform backend format to frontend format
              const transformedData = {
                // System metrics
                cpu: {
                  usage: processedData.system?.cpu_percent || processedData.cpu?.usage || null
                },
                memory: {
                  usage: processedData.system?.memory?.percent || processedData.memory?.usage || null,
                  available: processedData.system?.memory?.available || processedData.memory?.available || null
                },
                // GPU metrics - handle both array and object formats
                gpu: (() => {
                  const gpuData = processedData.gpu || processedData.gpu_performance;
                  if (Array.isArray(gpuData?.gpus) && gpuData.gpus.length > 0) {
                    // Backend format: { gpu: { gpus: [{ load: ... }] } }
                    return {
                      utilization: gpuData.gpus[0].load || null,
                      memory_used: gpuData.gpus[0].memory_used || null,
                      memory_total: gpuData.gpus[0].memory_total || null,
                      temperature: gpuData.gpus[0].temperature || null
                    };
                  } else if (gpuData && typeof gpuData === 'object' && !Array.isArray(gpuData)) {
                    // Direct object format
                    return {
                      utilization: gpuData.utilization || gpuData.load || null,
                      memory_used: gpuData.memory_used || null,
                      memory_total: gpuData.memory_total || null,
                      temperature: gpuData.temperature || null
                    };
                  }
                  return null;
                })(),
                // Raw data for debugging
                _raw: processedData
              };
              
              setRealTimeData(transformedData);
            } catch (error) {
              console.error('Error parsing WebSocket data:', error);
            }
          };
          
          websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setWebsocketConnected(false);
          };
          
          websocket.onclose = () => {
            console.log('WebSocket disconnected');
            setWebsocketConnected(false);
            // Attempt reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
          };
          
          return; // Successfully connected
        } catch (error) {
          console.warn(`Failed to connect to ${endpoint}:`, error);
        }
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Calculate max items per page based on viewport size
  useEffect(() => {
    const calculateMaxItems = () => {
      // Check if window is available (client-side only)
      if (typeof window === 'undefined') return;
      
      // Estimate items that can fit based on viewport height
      // Each accordion item is approximately 80-100px when collapsed
      // Account for header, settings panel, tabs, and pagination controls (~400px)
      const viewportHeight = window.innerHeight || 800; // Fallback to 800 if not available
      const availableHeight = Math.max(200, viewportHeight - 400); // Reserve space for UI elements, min 200
      const itemHeight = 90; // Approximate height per collapsed accordion item
      const calculatedMax = Math.max(10, Math.floor(availableHeight / itemHeight));
      const newMax = Math.min(calculatedMax, 100); // Cap at 100
      
      setMaxItemsPerPage(newMax);
      
      // Adjust current itemsPerPage if it exceeds new max
      setItemsPerPage(prev => {
        if (prev > newMax) {
          return Math.max(5, newMax);
        }
        return prev;
      });
    };
    
    // Calculate on mount
    calculateMaxItems();
    
    // Recalculate on resize
    window.addEventListener('resize', calculateMaxItems);
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', calculateMaxItems);
      }
    };
  }, []); // Empty dependency array - only run on mount
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, itemsPerPage]);
  
  // Initial load and service checks
  useEffect(() => {
    checkServiceAvailability();
    fetchComprehensiveMetrics();
    setIsLoading(false);
  }, [checkServiceAvailability, fetchComprehensiveMetrics]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      checkServiceAvailability();
      fetchComprehensiveMetrics();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, checkServiceAvailability, fetchComprehensiveMetrics]);

  // Format number based on setting
  const formatNumber = (value, unit = '') => {
    if (value === null || value === undefined) return 'N/A';
    
    let formattedValue = value;
    
    if (numberFormat === 'formatted' && typeof value === 'number') {
      formattedValue = value.toLocaleString();
    } else if (numberFormat === 'compact' && typeof value === 'number') {
      if (value >= 1000000) {
        formattedValue = (value / 1000000).toFixed(2) + 'M';
      } else if (value >= 1000) {
        formattedValue = (value / 1000).toFixed(2) + 'K';
      }
    }
    
    return showUnits && unit ? `${formattedValue} ${unit}` : formattedValue;
  };

  // Get status indicator
  const getStatusIndicator = (dataSource, isReal) => {
    if (!isReal) {
      return { color: 'text-yellow-400', icon: AlertCircle, label: 'Placeholder' };
    }
    
    switch (dataSource) {
      case 'backend':
        return backendAvailable 
          ? { color: 'text-green-400', icon: CheckCircle, label: 'Connected' }
          : { color: 'text-red-400', icon: XCircle, label: 'Disconnected' };
      case 'qdrant':
        return qdrantAvailable 
          ? { color: 'text-green-400', icon: CheckCircle, label: 'Connected' }
          : { color: 'text-red-400', icon: XCircle, label: 'Disconnected' };
      case 'postgres':
        return postgresAvailable 
          ? { color: 'text-green-400', icon: CheckCircle, label: 'Connected' }
          : { color: 'text-red-400', icon: XCircle, label: 'Disconnected' };
      case 'websocket':
        return websocketConnected 
          ? { color: 'text-green-400', icon: CheckCircle, label: 'Connected' }
          : { color: 'text-red-400', icon: XCircle, label: 'Disconnected' };
      case 'calculated':
        return { color: 'text-blue-400', icon: TrendingUp, label: 'Calculated' };
      default:
        return { color: 'text-gray-400', icon: Activity, label: 'Unknown' };
    }
  };

  // Define all metrics based on comprehensive analysis
  const allMetrics = useMemo(() => {
    const metrics = [];
    
    // System Metrics (Real)
    if (comprehensiveMetrics?.system_metrics) {
      const sm = comprehensiveMetrics.system_metrics;
      metrics.push(
        { 
          id: 'cpu_usage', 
          label: 'CPU Usage', 
          value: sm.cpu_usage || (showPlaceholders ? 45 : null), 
          unit: '%', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: !!sm.cpu_usage,
          description: 'CPU utilization percentage collected via psutil.cpu_percent() from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'memory_usage', 
          label: 'Memory Usage', 
          value: sm.memory_usage || (showPlaceholders ? 62 : null), 
          unit: '%', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: !!sm.memory_usage,
          description: 'RAM utilization percentage collected via psutil.virtual_memory() from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'memory_available', 
          label: 'Memory Available', 
          value: sm.memory_available || (showPlaceholders ? 23010185216 : null), 
          unit: 'bytes', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: !!sm.memory_available,
          description: 'Available RAM in bytes collected via psutil.virtual_memory() from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'disk_usage', 
          label: 'Disk Usage', 
          value: sm.disk_usage || (showPlaceholders ? 38 : null), 
          unit: '%', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: !!sm.disk_usage,
          description: 'Disk space utilization collected via psutil.disk_usage() from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'network_bytes_sent', 
          label: 'Network Bytes Sent', 
          value: sm.network_bytes_sent || (showPlaceholders ? 21471168 : null), 
          unit: 'bytes', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: !!sm.network_bytes_sent,
          description: 'Network bytes sent collected via psutil.net_io_counters() from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'network_bytes_recv', 
          label: 'Network Bytes Received', 
          value: sm.network_bytes_recv || (showPlaceholders ? 30883088 : null), 
          unit: 'bytes', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: !!sm.network_bytes_recv,
          description: 'Network bytes received collected via psutil.net_io_counters() from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        }
      );
    }
    
    // GPU Metrics (Real)
    const gpuMetrics = comprehensiveMetrics?.system_metrics?.gpu_metrics;
    if (gpuMetrics && gpuMetrics !== null) {
      // GPU metrics exist - use real data (even if 0 is a valid value)
      const gm = gpuMetrics;
      metrics.push(
        { 
          id: 'gpu_utilization', 
          label: 'GPU Utilization', 
          value: typeof gm.utilization === 'number' ? gm.utilization : null, 
          unit: '%', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: typeof gm.utilization === 'number',
          description: 'GPU compute utilization percentage collected via nvidia-smi and GPUtil from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'gpu_memory_used', 
          label: 'GPU Memory Used', 
          value: typeof gm.memory_used === 'number' ? gm.memory_used : null, 
          unit: 'MiB', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: typeof gm.memory_used === 'number',
          description: 'GPU memory used in MiB collected via nvidia-smi from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'gpu_memory_total', 
          label: 'GPU Memory Total', 
          value: typeof gm.memory_total === 'number' ? gm.memory_total : null, 
          unit: 'MiB', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: typeof gm.memory_total === 'number',
          description: 'Total GPU memory in MiB collected via nvidia-smi from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'gpu_temperature', 
          label: 'GPU Temperature', 
          value: typeof gm.temperature === 'number' ? gm.temperature : null, 
          unit: '°C', 
          category: 'real', 
          dataSource: 'backend', 
          isReal: typeof gm.temperature === 'number',
          description: 'GPU temperature in Celsius collected via nvidia-smi from /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        }
      );
    } else if (showPlaceholders) {
      // GPU metrics not available - show placeholder only if enabled
      metrics.push(
        { 
          id: 'gpu_utilization', 
          label: 'GPU Utilization (Placeholder)', 
          value: 85, 
          unit: '%', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Placeholder value (85%) used when GPU metrics are not available. Real data requires GPUtil library and NVIDIA GPU with nvidia-smi.',
          collectionMethod: 'Placeholder',
          recommendation: 'Ensure GPUtil is installed (pip install gputil) and NVIDIA GPU drivers are properly configured. Check backend logs for GPU detection errors.'
        },
        { 
          id: 'gpu_memory_used', 
          label: 'GPU Memory Used (Placeholder)', 
          value: 16541, 
          unit: 'MiB', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Placeholder value used when GPU metrics are not available.',
          collectionMethod: 'Placeholder',
          recommendation: 'Ensure GPUtil is installed and NVIDIA GPU is accessible.'
        },
        { 
          id: 'gpu_memory_total', 
          label: 'GPU Memory Total (Placeholder)', 
          value: 32607, 
          unit: 'MiB', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Placeholder value used when GPU metrics are not available.',
          collectionMethod: 'Placeholder',
          recommendation: 'Ensure GPUtil is installed and NVIDIA GPU is accessible.'
        }
      );
    }
    
    // PostgreSQL Metrics (Real)
    if (comprehensiveMetrics?.postgres_metrics) {
      const pm = comprehensiveMetrics.postgres_metrics;
      metrics.push(
        { 
          id: 'postgres_active_connections', 
          label: 'PostgreSQL Active Connections', 
          value: pm.active_connections || (showPlaceholders ? 8 : null), 
          unit: '', 
          category: 'real', 
          dataSource: 'postgres', 
          isReal: !!pm.active_connections,
          description: 'Active database connections from pg_stat_activity via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'postgres_total_connections', 
          label: 'PostgreSQL Total Connections', 
          value: pm.total_connections || (showPlaceholders ? 12 : null), 
          unit: '', 
          category: 'real', 
          dataSource: 'postgres', 
          isReal: !!pm.total_connections,
          description: 'Total database connections from pg_stat_activity via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'postgres_database_size', 
          label: 'PostgreSQL Database Size', 
          value: pm.database_size || (showPlaceholders ? 245 : null), 
          unit: 'bytes', 
          category: 'real', 
          dataSource: 'postgres', 
          isReal: !!pm.database_size,
          description: 'Database size in bytes from pg_database_size() via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'postgres_cache_hit_ratio', 
          label: 'PostgreSQL Cache Hit Ratio', 
          value: pm.cache_hit_ratio || (showPlaceholders ? 92 : null), 
          unit: '%', 
          category: 'real', 
          dataSource: 'postgres', 
          isReal: !!pm.cache_hit_ratio,
          description: 'Database cache hit percentage from pg_stat_database via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'postgres_query_performance', 
          label: 'PostgreSQL Query Performance', 
          value: pm.query_performance || (showPlaceholders ? 45 : null), 
          unit: 'ms', 
          category: 'real', 
          dataSource: 'postgres', 
          isReal: !!pm.query_performance,
          description: 'Average query response time in milliseconds from query execution timing via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        }
      );
    }
    
    // Qdrant Metrics (Real)
    const qdrantMetrics = comprehensiveMetrics?.qdrant_metrics;
    if (qdrantMetrics && qdrantMetrics !== null) {
      // Qdrant metrics exist - use real data (even if 0 is a valid value)
      const qm = qdrantMetrics;
      const isConnected = qm.connection_status === 'connected' || comprehensiveMetrics?.connection_metrics?.vector_db_status === 'connected';
      
      metrics.push(
        { 
          id: 'qdrant_collections_count', 
          label: 'Qdrant Collections Count', 
          value: typeof qm.collections_count === 'number' ? qm.collections_count : null, 
          unit: '', 
          category: 'real', 
          dataSource: 'qdrant', 
          isReal: typeof qm.collections_count === 'number',
          description: 'Number of active collections from GET /collections via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'qdrant_total_points', 
          label: 'Qdrant Total Points', 
          value: typeof qm.total_points === 'number' ? qm.total_points : null, 
          unit: '', 
          category: 'real', 
          dataSource: 'qdrant', 
          isReal: typeof qm.total_points === 'number',
          description: 'Total number of vectors in all collections from GET /collections/{name} via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'qdrant_indexed_vectors_count', 
          label: 'Qdrant Indexed Vectors Count', 
          value: typeof qm.total_points === 'number' ? qm.total_points : null, 
          unit: '', 
          category: 'real', 
          dataSource: 'qdrant', 
          isReal: typeof qm.total_points === 'number',
          description: 'Number of indexed vectors in Qdrant collections. Same as total_points as all points are indexed via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'qdrant_embeddings_generated', 
          label: 'Embeddings Generated', 
          value: typeof qm.total_points === 'number' ? qm.total_points : null, 
          unit: '', 
          category: 'real', 
          dataSource: 'qdrant', 
          isReal: typeof qm.total_points === 'number',
          description: 'Total number of embeddings generated, represented by Qdrant total_points count via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        },
        { 
          id: 'qdrant_search_latency', 
          label: 'Qdrant Search Latency', 
          value: typeof qm.search_latency === 'number' ? qm.search_latency : null, 
          unit: 'ms', 
          category: 'real', 
          dataSource: 'qdrant', 
          isReal: typeof qm.search_latency === 'number',
          description: 'Average search response time in milliseconds from test search timing via /metrics/comprehensive API. Measured by performing a test search query.',
          collectionMethod: 'API Polling (Test Search)',
          recommendation: qm.search_latency === 0 ? 'Search latency test may have failed or search was too fast to measure. Verify test search is working: POST /collections/{name}/points/search with test vector. Check backend logs for search errors.' : null
        },
        { 
          id: 'qdrant_memory_usage', 
          label: 'Qdrant Memory Usage', 
          value: typeof qm.memory_usage === 'number' ? qm.memory_usage : null, 
          unit: 'bytes', 
          category: 'real', 
          dataSource: 'qdrant', 
          isReal: typeof qm.memory_usage === 'number',
          description: 'Qdrant memory usage in bytes collected from collection stats, cluster info, or estimated from collection data via /metrics/comprehensive API.',
          collectionMethod: 'API Polling',
          recommendation: qm.memory_usage === 0 ? 'Memory usage not available from Qdrant API endpoints. For single-node Qdrant, memory metrics may not be exposed via REST API. Options: 1) Use Qdrant metrics API (if enabled), 2) Use Prometheus exporter, 3) Monitor Qdrant process memory via system metrics (psutil).' : null
        },
        { 
          id: 'qdrant_disk_usage', 
          label: 'Qdrant Disk Usage', 
          value: typeof qm.disk_usage === 'number' ? qm.disk_usage : null, 
          unit: 'bytes', 
          category: 'real', 
          dataSource: 'qdrant', 
          isReal: typeof qm.disk_usage === 'number',
          description: 'Qdrant disk usage in bytes from collection stats or estimated from points count and vector size via /metrics/comprehensive API.',
          collectionMethod: 'API Polling (Estimated if stats unavailable)',
          recommendation: qm.disk_usage === 0 ? 'Disk usage not available from /collections/{name}/stats endpoint. Current implementation estimates from points_count * vector_size * 4 * 2. For accurate disk usage: 1) Enable Qdrant metrics API, 2) Use Prometheus exporter, 3) Monitor Qdrant data directory size via filesystem.' : null
        },
        { 
          id: 'qdrant_connection_status', 
          label: 'Qdrant Connection Status', 
          value: qm.connection_status || comprehensiveMetrics?.connection_metrics?.vector_db_status || 'unknown', 
          unit: '', 
          category: 'real', 
          dataSource: 'qdrant', 
          isReal: isConnected,
          description: 'Qdrant service connection status (connected/disconnected/error) from health checks via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        }
      );
    } else if (showPlaceholders) {
      // Qdrant metrics not available - show placeholder only if enabled
      metrics.push(
        { 
          id: 'qdrant_collections_count', 
          label: 'Qdrant Collections Count (Placeholder)', 
          value: 1, 
          unit: '', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Placeholder value (1) used when Qdrant metrics are not available.',
          collectionMethod: 'Placeholder',
          recommendation: 'Ensure Qdrant service is running and accessible. Check QDRANT_URL configuration and verify the service is reachable from the backend.'
        },
        { 
          id: 'qdrant_total_points', 
          label: 'Qdrant Total Points (Placeholder)', 
          value: 13122, 
          unit: '', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Placeholder value (13122) used when Qdrant metrics are not available.',
          collectionMethod: 'Placeholder',
          recommendation: 'Ensure Qdrant service is running and collections are accessible. Check backend logs for connection errors.'
        }
      );
    }
    
    // Pipeline Metrics (Real/Calculated)
    if (comprehensiveMetrics?.pipeline_metrics) {
      const plm = comprehensiveMetrics.pipeline_metrics;
      metrics.push(
        { 
          id: 'pipeline_document_processing_rate', 
          label: 'Document Processing Rate', 
          value: plm.document_processing_rate || (showPlaceholders ? null : null), 
          unit: 'docs/min', 
          category: 'calculated', 
          dataSource: 'calculated', 
          isReal: !!plm.document_processing_rate,
          description: 'Documents processed per minute calculated from document timestamps via /metrics/comprehensive API',
          collectionMethod: 'Calculated'
        },
        { 
          id: 'pipeline_query_processing_rate', 
          label: 'Query Processing Rate', 
          value: plm.query_processing_rate || (showPlaceholders ? 45 : null), 
          unit: 'queries/min', 
          category: 'calculated', 
          dataSource: 'calculated', 
          isReal: !!plm.query_processing_rate,
          description: 'Queries processed per minute calculated from query timestamps via /metrics/comprehensive API',
          collectionMethod: 'Calculated'
        },
        { 
          id: 'pipeline_avg_document_processing_time', 
          label: 'Avg Document Processing Time', 
          value: plm.avg_document_processing_time || (showPlaceholders ? null : null), 
          unit: 's', 
          category: 'calculated', 
          dataSource: 'calculated', 
          isReal: !!plm.avg_document_processing_time,
          description: 'Average document processing time in seconds calculated from processing logs via /metrics/comprehensive API',
          collectionMethod: 'Calculated'
        },
        { 
          id: 'pipeline_avg_query_processing_time', 
          label: 'Avg Query Processing Time', 
          value: plm.avg_query_processing_time || (showPlaceholders ? 23 : null), 
          unit: 'ms', 
          category: 'calculated', 
          dataSource: 'calculated', 
          isReal: !!plm.avg_query_processing_time,
          description: 'Average query processing time in milliseconds calculated from query history via /metrics/comprehensive API',
          collectionMethod: 'Calculated'
        },
        { 
          id: 'pipeline_success_rate', 
          label: 'Pipeline Success Rate', 
          value: plm.success_rate || (showPlaceholders ? 98.5 : null), 
          unit: '%', 
          category: 'calculated', 
          dataSource: 'calculated', 
          isReal: !!plm.success_rate,
          description: 'Pipeline success rate percentage calculated from success/failure counts via /metrics/comprehensive API',
          collectionMethod: 'Calculated'
        },
        { 
          id: 'pipeline_error_rate', 
          label: 'Pipeline Error Rate', 
          value: plm.error_rate || (showPlaceholders ? 0.2 : null), 
          unit: '%', 
          category: 'calculated', 
          dataSource: 'calculated', 
          isReal: !!plm.error_rate,
          description: 'Pipeline error rate percentage calculated from error counts via /metrics/comprehensive API',
          collectionMethod: 'Calculated'
        },
        { 
          id: 'pipeline_active_documents', 
          label: 'Documents Processed', 
          value: typeof plm.active_documents === 'number' ? plm.active_documents : null, 
          unit: '', 
          category: 'real', 
          dataSource: 'postgres', 
          isReal: typeof plm.active_documents === 'number',
          description: 'Total number of processed documents from documents table via /metrics/comprehensive API',
          collectionMethod: 'API Polling'
        }
      );
    }
    
    // WebSocket Real-time Metrics (if available)
    if (realTimeData && (realTimeData.cpu || realTimeData.memory || realTimeData.gpu)) {
      // CPU Usage
      if (realTimeData.cpu && typeof realTimeData.cpu.usage === 'number') {
        metrics.push(
          { 
            id: 'realtime_cpu', 
            label: 'Real-time CPU Usage', 
            value: realTimeData.cpu.usage, 
            unit: '%', 
            category: 'real', 
            dataSource: 'websocket', 
            isReal: true,
            description: 'Real-time CPU usage from WebSocket pipeline monitoring connection. Updated every 1-2 seconds.',
            collectionMethod: 'WebSocket'
          }
        );
      }
      
      // Memory Usage
      if (realTimeData.memory && typeof realTimeData.memory.usage === 'number') {
        metrics.push(
          { 
            id: 'realtime_memory', 
            label: 'Real-time Memory Usage', 
            value: realTimeData.memory.usage, 
            unit: '%', 
            category: 'real', 
            dataSource: 'websocket', 
            isReal: true,
            description: 'Real-time memory usage from WebSocket pipeline monitoring connection. Updated every 1-2 seconds.',
            collectionMethod: 'WebSocket'
          }
        );
      }
      
      // GPU Utilization
      if (realTimeData.gpu && typeof realTimeData.gpu.utilization === 'number') {
        metrics.push(
          { 
            id: 'realtime_gpu', 
            label: 'Real-time GPU Utilization', 
            value: realTimeData.gpu.utilization, 
            unit: '%', 
            category: 'real', 
            dataSource: 'websocket', 
            isReal: true,
            description: 'Real-time GPU utilization from WebSocket pipeline monitoring connection. Updated every 1-2 seconds.',
            collectionMethod: 'WebSocket'
          }
        );
      }
    } else if (showPlaceholders && websocketConnected) {
      // WebSocket is connected but no data received yet
      metrics.push(
        { 
          id: 'realtime_cpu', 
          label: 'Real-time CPU Usage (Waiting for Data)', 
          value: null, 
          unit: '%', 
          category: 'real', 
          dataSource: 'websocket', 
          isReal: false,
          description: 'WebSocket connected but waiting for first data update. Check backend WebSocket endpoint.',
          collectionMethod: 'WebSocket',
          recommendation: 'Verify WebSocket endpoint is broadcasting metrics. Check backend logs for WebSocket monitoring loop.'
        },
        { 
          id: 'realtime_memory', 
          label: 'Real-time Memory Usage (Waiting for Data)', 
          value: null, 
          unit: '%', 
          category: 'real', 
          dataSource: 'websocket', 
          isReal: false,
          description: 'WebSocket connected but waiting for first data update.',
          collectionMethod: 'WebSocket',
          recommendation: 'Verify WebSocket endpoint is broadcasting metrics.'
        },
        { 
          id: 'realtime_gpu', 
          label: 'Real-time GPU Utilization (Waiting for Data)', 
          value: null, 
          unit: '%', 
          category: 'real', 
          dataSource: 'websocket', 
          isReal: false,
          description: 'WebSocket connected but waiting for first data update. GPU metrics require GPUtil library.',
          collectionMethod: 'WebSocket',
          recommendation: 'Verify WebSocket endpoint is broadcasting metrics and GPUtil is installed for GPU data.'
        }
      );
    }
    
    // Placeholder/Mock Metrics (from hardcoded values)
    // Phase 1: Removed placeholders that have real equivalents:
    // - placeholder_points_count → Use qdrant_total_points
    // - placeholder_indexed_vectors → Use qdrant_indexed_vectors_count
    if (showPlaceholders) {
      metrics.push(
        { 
          id: 'placeholder_search_latency', 
          label: 'Search Latency (Placeholder)', 
          value: 23, 
          unit: 'ms', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Hardcoded placeholder value (23ms) used when Qdrant service unavailable. Replace with actual search timing measurement.',
          collectionMethod: 'Placeholder',
          recommendation: 'Perform test search and measure response time: POST /collections/{name}/points/search with timing'
        },
        // Phase 1: Removed placeholder_cache_hit_ratio → Use postgres_cache_hit_ratio (real metric)
        { 
          id: 'placeholder_compression_ratio', 
          label: 'Compression Ratio (Placeholder)', 
          value: 15, 
          unit: '', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Hardcoded placeholder value (15) used when Qdrant service unavailable. Replace with actual compression metrics.',
          collectionMethod: 'Placeholder',
          recommendation: 'Calculate from Qdrant collection stats: (raw_size / compressed_size) or query Prometheus metrics'
        },
        { 
          id: 'placeholder_queries_per_minute', 
          label: 'Queries Per Minute (Placeholder)', 
          value: 45, 
          unit: 'queries/min', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Hardcoded placeholder value (45) used when backend unavailable. Replace with calculated value from query history.',
          collectionMethod: 'Placeholder',
          recommendation: 'Calculate from query_history table: COUNT(queries) WHERE timestamp > NOW() - INTERVAL 1 minute'
        },
        // Phase 1: Removed placeholders that have real equivalents:
        // - placeholder_avg_response_time → Use pipeline_avg_query_processing_time
        // - placeholder_success_rate → Use pipeline_success_rate
        // - placeholder_documents_processed → Use pipeline_active_documents
        // - placeholder_embeddings_generated → Use qdrant_embeddings_generated
        { 
          id: 'placeholder_chunks_generated', 
          label: 'Chunks Generated (Placeholder)', 
          value: 1500, 
          unit: '', 
          category: 'placeholder', 
          dataSource: 'placeholder', 
          isReal: false,
          description: 'Hardcoded placeholder value (1500) used when backend unavailable. Replace with COUNT from document_chunks table.',
          collectionMethod: 'Placeholder',
          recommendation: 'Query document_chunks table: SELECT COUNT(*) FROM document_chunks (if table exists) or track during processing'
        }
      );
    }
    
    // Mock Metrics (from random generation)
    if (showPlaceholders) {
      metrics.push(
        { 
          id: 'mock_similarity_score', 
          label: 'Similarity Score (Mock)', 
          value: Math.random() * 0.4 + 0.6, 
          unit: '', 
          category: 'mock', 
          dataSource: 'mock', 
          isReal: false,
          description: 'Randomly generated value (Math.random() * 0.4 + 0.6) for similarity visualization. Replace with actual Qdrant similarity search results.',
          collectionMethod: 'Mock (Random)',
          recommendation: 'Use Qdrant similarity search: POST /collections/{name}/points/search with query vector to get real similarity scores'
        },
        { 
          id: 'mock_connection_count', 
          label: 'Connection Count (Mock)', 
          value: Math.floor(Math.random() * 20) + 5, 
          unit: '', 
          category: 'mock', 
          dataSource: 'mock', 
          isReal: false,
          description: 'Randomly generated value (Math.floor(Math.random() * 20) + 5) for graph visualization. Replace with actual vector relationship analysis.',
          collectionMethod: 'Mock (Random)',
          recommendation: 'Analyze vector relationships: Use Qdrant scroll/search to find connected vectors based on similarity thresholds'
        },
        { 
          id: 'mock_cluster_size', 
          label: 'Cluster Size (Mock)', 
          value: Math.floor(Math.random() * 50) + 10, 
          unit: '', 
          category: 'mock', 
          dataSource: 'mock', 
          isReal: false,
          description: 'Randomly generated value (Math.floor(Math.random() * 50) + 10) for cluster visualization. Replace with actual clustering analysis.',
          collectionMethod: 'Mock (Random)',
          recommendation: 'Implement clustering algorithm on Qdrant vectors or use Qdrant clustering features to identify actual clusters'
        },
        { 
          id: 'mock_processing_time', 
          label: 'Processing Time (Mock)', 
          value: Math.random() * 50 + 10, 
          unit: 'ms', 
          category: 'mock', 
          dataSource: 'mock', 
          isReal: false,
          description: 'Randomly generated value (Math.random() * 50 + 10) for similarity processing. Replace with actual processing time measurements.',
          collectionMethod: 'Mock (Random)',
          recommendation: 'Measure actual processing time: Use performance.now() or Date.now() to track similarity calculation duration'
        },
        { 
          id: 'mock_historical_latency', 
          label: 'Historical Latency (Mock)', 
          value: Math.random() * 100 + 200, 
          unit: 'ms', 
          category: 'mock', 
          dataSource: 'mock', 
          isReal: false,
          description: 'Randomly generated value (Math.random() * 100 + 200) for historical performance chart. Replace with stored historical metrics.',
          collectionMethod: 'Mock (Random)',
          recommendation: 'Store historical metrics in time-series database or PostgreSQL with timestamps, query historical data for trends'
        },
        { 
          id: 'mock_historical_throughput', 
          label: 'Historical Throughput (Mock)', 
          value: Math.random() * 50 + 30, 
          unit: 'queries/min', 
          category: 'mock', 
          dataSource: 'mock', 
          isReal: false,
          description: 'Randomly generated value (Math.random() * 50 + 30) for historical throughput chart. Replace with stored historical metrics.',
          collectionMethod: 'Mock (Random)',
          recommendation: 'Store query timestamps in database, calculate throughput per time window, store aggregated metrics for historical analysis'
        }
      );
    }
    
    return metrics;
  }, [comprehensiveMetrics, realTimeData, showPlaceholders]);

  // Filter metrics based on category and search
  const filteredMetrics = useMemo(() => {
    let filtered = allMetrics;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(m => m.category === activeCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.label.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.collectionMethod.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allMetrics, activeCategory, searchQuery]);
  
  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil((filteredMetrics.length || 0) / (itemsPerPage || 10)));
  const startIndex = Math.max(0, (currentPage - 1) * itemsPerPage);
  const endIndex = startIndex + itemsPerPage;
  const paginatedMetrics = (filteredMetrics || []).slice(startIndex, endIndex);
  
  // Navigation functions
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  // Export metrics
  const exportMetrics = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      serviceStatus: {
        backend: backendAvailable,
        qdrant: qdrantAvailable,
        postgres: postgresAvailable,
        websocket: websocketConnected
      },
      metrics: filteredMetrics.map(m => ({
        id: m.id,
        label: m.label,
        value: m.value,
        unit: m.unit,
        category: m.category,
        dataSource: m.dataSource,
        isReal: m.isReal,
        description: m.description,
        collectionMethod: m.collectionMethod,
        recommendation: m.recommendation || null
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle auto-refresh for specific metric
  const toggleMetricAutoRefresh = (metricId) => {
    setMetricAutoRefresh(prev => ({
      ...prev,
      [metricId]: !prev[metricId]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              Metrics Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Development tool for validating all metrics and data points</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Service Status Indicators */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={`w-3 h-3 rounded-full ${backendAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                  </TooltipTrigger>
                  <TooltipContent>Backend: {backendAvailable ? 'Connected' : 'Disconnected'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={`w-3 h-3 rounded-full ${qdrantAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                  </TooltipTrigger>
                  <TooltipContent>Qdrant: {qdrantAvailable ? 'Connected' : 'Disconnected'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={`w-3 h-3 rounded-full ${postgresAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                  </TooltipTrigger>
                  <TooltipContent>PostgreSQL: {postgresAvailable ? 'Connected' : 'Disconnected'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={`w-3 h-3 rounded-full ${websocketConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  </TooltipTrigger>
                  <TooltipContent>WebSocket: {websocketConnected ? 'Connected' : 'Disconnected'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-400">Auto-refresh:</Label>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              {autoRefresh && (
                <Select value={refreshInterval.toString()} onValueChange={(v) => setRefreshInterval(parseInt(v))}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5000">5s</SelectItem>
                    <SelectItem value="10000">10s</SelectItem>
                    <SelectItem value="30000">30s</SelectItem>
                    <SelectItem value="60000">1m</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <Button onClick={fetchComprehensiveMetrics} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button onClick={exportMetrics} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-400">Show Placeholders:</Label>
            <Switch checked={showPlaceholders} onCheckedChange={setShowPlaceholders} />
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-400">Number Format:</Label>
            <Select value={numberFormat} onValueChange={setNumberFormat}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="formatted">Formatted</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-400">Show Units:</Label>
            <Switch checked={showUnits} onCheckedChange={setShowUnits} />
          </div>
          
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search metrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Pagination Controls Panel */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <Label className="text-sm text-gray-400 whitespace-nowrap">
              Items per page: <span className="text-white font-medium">{itemsPerPage}</span>
            </Label>
            <div className="flex-1 max-w-xs">
              <Slider
                value={[itemsPerPage]}
                onValueChange={(values) => {
                  const newValue = Math.max(5, Math.min(values[0], maxItemsPerPage || 50));
                  setItemsPerPage(newValue);
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
                min={5}
                max={Math.max(10, maxItemsPerPage || 50)}
                step={5}
                className="w-full"
              />
            </div>
            <div className="text-xs text-gray-400">
              Max: {maxItemsPerPage || 50} (based on viewport)
            </div>
          </div>
          
          {/* Pagination Info and Controls */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Showing <span className="text-white font-medium">{startIndex + 1}</span> - <span className="text-white font-medium">{Math.min(endIndex, filteredMetrics.length)}</span> of <span className="text-white font-medium">{filteredMetrics.length}</span> metrics
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="bg-gray-700 border-gray-600 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400">Page</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (!isNaN(page) && page >= 1 && page <= totalPages) {
                      goToPage(page);
                    }
                  }}
                  className="w-16 h-8 text-center bg-gray-700 border-gray-600"
                />
                <span className="text-sm text-gray-400">of {totalPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="bg-gray-700 border-gray-600 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="all">All Metrics</TabsTrigger>
            <TabsTrigger value="real">Real Data</TabsTrigger>
            <TabsTrigger value="calculated">Calculated</TabsTrigger>
            <TabsTrigger value="placeholder">Placeholder</TabsTrigger>
            <TabsTrigger value="mock">Mock Data</TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading metrics...</p>
                </div>
              ) : error ? (
                <Card className="bg-red-900/20 border-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <p>{error}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredMetrics.length === 0 ? (
                <Card className="bg-gray-800">
                  <CardContent className="pt-6 text-center text-gray-400">
                    No metrics found matching your criteria.
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {paginatedMetrics.map((metric) => {
                    const status = getStatusIndicator(metric.dataSource, metric.isReal);
                    const StatusIcon = status.icon;
                    
                    return (
                      <AccordionItem 
                        key={metric.id} 
                        value={metric.id}
                        className="border-gray-700 bg-gray-800 rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:bg-gray-700/50">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-4 flex-1">
                              {/* Auto-refresh checkbox */}
                              <input
                                type="checkbox"
                                checked={metricAutoRefresh[metric.id] || false}
                                onChange={() => toggleMetricAutoRefresh(metric.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                              />
                              
                              {/* Status indicator */}
                              <StatusIcon className={`w-5 h-5 ${status.color}`} />
                              
                              {/* Label */}
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{metric.label}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      metric.category === 'real' ? 'border-green-500 text-green-400' :
                                      metric.category === 'calculated' ? 'border-blue-500 text-blue-400' :
                                      metric.category === 'placeholder' ? 'border-yellow-500 text-yellow-400' :
                                      'border-red-500 text-red-400'
                                    }`}
                                  >
                                    {metric.category}
                                  </Badge>
                                  {!metric.isReal && (
                                    <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">
                                      {metric.category === 'placeholder' ? 'Placeholder' : 'Mock'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {/* Value */}
                              <div className="text-right">
                                <div className="font-mono text-lg">
                                  {formatNumber(metric.value, metric.unit)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {status.label}
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3 pt-2">
                            {/* Description */}
                            <div>
                              <Label className="text-xs text-gray-400">Description</Label>
                              <p className="text-sm text-gray-300 mt-1">{metric.description}</p>
                            </div>
                            
                            {/* Collection Method */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-gray-400">Collection Method</Label>
                                <p className="text-sm text-gray-300 mt-1">{metric.collectionMethod}</p>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-gray-400">Data Source</Label>
                                <p className="text-sm text-gray-300 mt-1 capitalize">{metric.dataSource}</p>
                              </div>
                            </div>
                            
                            {/* Recommendation (for placeholder/mock) */}
                            {metric.recommendation && (
                              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <Info className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <Label className="text-xs text-yellow-400">Recommendation</Label>
                                    <p className="text-sm text-yellow-300 mt-1">{metric.recommendation}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(String(metric.value))}
                                className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy Value
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(metric, null, 2))}
                                className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy JSON
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MetricsDashboardPage;

