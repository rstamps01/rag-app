// RAG Pipeline Monitoring - Prototype Components
// These components demonstrate the visual interface design inspired by n8n.io


import React, { useState, useEffect } from 'react';
import { 
    Cpu, Database, Zap, MessageSquare, FileText, BarChart3, 
    Archive, CheckCircle, AlertTriangle, Activity, Clock,
    TrendingUp, Users, Server, Gauge
} from 'lucide-react';

// ============================================================================
// Main Dashboard Component
// ============================================================================
const TestPage = () => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [debugMode, setDebugMode] = useState(false);
    const [isConnected, setIsConnected] = useState(true);


    // Mock pipeline state data
    const [pipelineState] = useState({
        stages: [
            {
                id: 'query_input',
                name: 'Query Input',
                status: 'active',
                metrics: { active_queries: 3, queue_depth: 1, avg_time_ms: 50 }
            },
            {
                id: 'embedding',
                name: 'Embedding Generation',
                status: 'processing',
                metrics: { gpu_usage: 85, avg_time_ms: 120, success_rate: 98.5 }
            },
            {
                id: 'vector_search',
                name: 'Vector Search',
                status: 'success',
                metrics: { search_time_ms: 45, results_found: 5, accuracy: 92.3 }
            },
            {
                id: 'document_retrieval',
                name: 'Document Retrieval',
                status: 'success',
                metrics: { docs_retrieved: 5, relevance_score: 0.87, time_ms: 30 }
            },
            {
                id: 'context_prep',
                name: 'Context Preparation',
                status: 'processing',
                metrics: { context_length: 2048, compression_ratio: 0.75, time_ms: 25 }
            },
            {
                id: 'llm_processing',
                name: 'LLM Processing',
                status: 'processing',
                metrics: { model_load: 92, tokens_generated: 150, time_ms: 3200 }
            },
            {
                id: 'response',
                name: 'Response Delivery',
                status: 'pending',
                metrics: { response_length: 0, delivery_time_ms: 0 }
            },
            {
                id: 'history_log',
                name: 'History Logging',
                status: 'idle',
                metrics: { records_saved: 1247, db_latency_ms: 15 }
            }
        ],
        connections: [
            { from: 'query_input', to: 'embedding', active: true },
            { from: 'embedding', to: 'vector_search', active: true },
            { from: 'vector_search', to: 'document_retrieval', active: true },
            { from: 'document_retrieval', to: 'context_prep', active: true },
            { from: 'context_prep', to: 'llm_processing', active: true },
            { from: 'llm_processing', to: 'response', active: false },
            { from: 'response', to: 'history_log', active: false }
        ]
    });

    const [realTimeMetrics] = useState({
        queries_per_minute: 45,
        avg_response_time: 4200,
        success_rate: 98.2,
        gpu_utilization: 85,
        memory_usage: 12.5,
        active_connections: 23,
        error_count_24h: 3,
        uptime_hours: 72
    });

    return (
        <div className="pipeline-monitoring-dashboard h-screen bg-gray-900 text-white flex flex-col">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shrink-0">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-white">RAG Pipeline Monitor</h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Activity className="w-4 h-4" />
                        <span>Real-time Monitoring</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Connection Status */}
                    <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>

                    {/* Debug Mode Toggle */}
                    <button
                        onClick={() => setDebugMode(!debugMode)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${debugMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                        Debug Mode
                    </button>

                    {/* Quick Stats */}
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span>{realTimeMetrics.queries_per_minute}/min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span>{realTimeMetrics.avg_response_time}ms</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>{realTimeMetrics.success_rate}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Metrics Panel */}
                <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
                    <RealTimeMetricsPanel metrics={realTimeMetrics} />
                </div>

                {/* Main Canvas */}
                <div className="flex-1 relative">
                    <PipelineFlowCanvas
                        pipelineState={pipelineState}
                        onNodeSelect={setSelectedNode}
                        debugMode={debugMode} />
                </div>

                {/* Right Panel - Node Details */}
                {selectedNode && (
                    <div className="w-96 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
                        <NodeDetailsPanel
                            node={selectedNode}
                            onClose={() => setSelectedNode(null)} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Pipeline Flow Canvas Component
// ============================================================================
export const PipelineFlowCanvas = ({ pipelineState, onNodeSelect, debugMode }) => {
    const nodePositions = {
        query_input: { x: 150, y: 200 },
        embedding: { x: 350, y: 200 },
        vector_search: { x: 550, y: 200 },
        document_retrieval: { x: 750, y: 200 },
        context_prep: { x: 750, y: 400 },
        llm_processing: { x: 550, y: 400 },
        response: { x: 350, y: 400 },
        history_log: { x: 150, y: 400 }
    };
    
    return (
        <div 
            className="relative w-full h-full bg-gray-900 overflow-hidden"
            style={{ 
                backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}
        >
            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#4B5563" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
            
            {/* Render Connections */}
            {pipelineState?.connections?.map((connection, index) => (
                <FlowConnection
                    key={index}
                    from={nodePositions[connection.from]}
                    to={nodePositions[connection.to]}
                    active={connection.active}
                    debugMode={debugMode}
                />
            ))}
            
            {/* Render Pipeline Nodes */}
            {pipelineState?.stages?.map((stage) => (
                <PipelineNode
                    key={stage.id}
                    stage={stage}
                    position={nodePositions[stage.id]}
                    onClick={() => onNodeSelect(stage)}
                    debugMode={debugMode}
                />
            ))}
            
            {/* Canvas Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button className="p-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
                <button className="p-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// Pipeline Node Component
// ============================================================================
const nodeIcons = {
    query_input: MessageSquare,
    embedding: Cpu,
    vector_search: Database,
    document_retrieval: FileText,
    context_prep: BarChart3,
    llm_processing: Zap,
    response: CheckCircle,
    history_log: Archive
};

const statusColors = {
    idle: 'bg-gray-600 border-gray-500 shadow-gray-500/20',
    active: 'bg-blue-600 border-blue-400 shadow-blue-500/30',
    processing: 'bg-yellow-600 border-yellow-400 shadow-yellow-500/30',
    success: 'bg-green-600 border-green-400 shadow-green-500/30',
    error: 'bg-red-600 border-red-400 shadow-red-500/30',
    pending: 'bg-purple-600 border-purple-400 shadow-purple-500/30'
};

export const PipelineNode = ({ stage, position, onClick, debugMode }) => {
    const [isHovered, setIsHovered] = useState(false);
    const Icon = nodeIcons[stage.id] || Cpu;
    
    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: position.x, top: position.y }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Main Node Circle */}
            <div className={`
                w-20 h-20 rounded-full border-3 flex items-center justify-center
                transition-all duration-300 hover:scale-110 shadow-lg
                ${statusColors[stage.status]}
                ${isHovered ? 'shadow-xl' : ''}
            `}>
                <Icon className="w-8 h-8 text-white" />
            </div>
            
            {/* Node Label */}
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-sm text-gray-300 text-center whitespace-nowrap font-medium">
                {stage.name}
            </div>
            
            {/* Status Indicator Ring */}
            {stage.status === 'processing' && (
                <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-75"></div>
            )}
            
            {/* Activity Pulse for Active Nodes */}
            {stage.status === 'active' && (
                <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse"></div>
            )}
            
            {/* Hover Tooltip */}
            {isHovered && (
                <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg p-4 text-sm whitespace-nowrap z-20 shadow-xl">
                    <div className="font-semibold text-white mb-2 text-center">{stage.name}</div>
                    <div className="text-gray-300 mb-2">
                        Status: <span className={`font-medium ${
                            stage.status === 'success' ? 'text-green-400' :
                            stage.status === 'processing' ? 'text-yellow-400' :
                            stage.status === 'error' ? 'text-red-400' :
                            stage.status === 'active' ? 'text-blue-400' :
                            'text-gray-400'
                        }`}>{stage.status}</span>
                    </div>
                    {stage.metrics && (
                        <div className="space-y-1 border-t border-gray-600 pt-2">
                            {Object.entries(stage.metrics).slice(0, 3).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-gray-400">
                                    <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-white font-medium ml-2">
                                        {typeof value === 'number' ? 
                                            (key.includes('rate') || key.includes('score') ? `${value}%` : 
                                             key.includes('time') || key.includes('ms') ? `${value}ms` : 
                                             value) : value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Debug Mode Overlay */}
            {debugMode && (
                <div className="absolute -top-3 -right-3 bg-purple-600 text-white text-xs px-2 py-1 rounded-full border border-purple-400">
                    {stage.id}
                </div>
            )}
            
            {/* Performance Indicator */}
            {stage.metrics?.avg_time_ms && (
                <div className={`absolute -bottom-2 -right-2 w-4 h-4 rounded-full border-2 border-gray-900 ${
                    stage.metrics.avg_time_ms < 100 ? 'bg-green-500' :
                    stage.metrics.avg_time_ms < 1000 ? 'bg-yellow-500' :
                    'bg-red-500'
                }`}></div>
            )}
        </div>
    );
};

// ============================================================================
// Flow Connection Component
// ============================================================================
export const FlowConnection = ({ from, to, active, debugMode }) => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    // Calculate control points for curved connection
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const controlOffset = Math.abs(dx) * 0.3;
    
    const pathData = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;
    
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {/* Connection Path */}
            <path
                d={pathData}
                stroke={active ? '#3B82F6' : '#6B7280'}
                strokeWidth={active ? 3 : 2}
                fill="none"
                strokeDasharray={active ? '0' : '5,5'}
                className={active ? 'animate-pulse' : ''}
                opacity={active ? 1 : 0.5}
            />
            
            {/* Data Flow Animation */}
            {active && (
                <circle r="4" fill="#3B82F6" opacity="0.8">
                    <animateMotion dur="2s" repeatCount="indefinite" path={pathData} />
                </circle>
            )}
            
            {/* Connection Label */}
            {debugMode && (
                <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    className="text-xs fill-gray-400"
                    dy="-5"
                >
                    {active ? 'active' : 'idle'}
                </text>
            )}
        </svg>
    );
};

// ============================================================================
// Real-time Metrics Panel Component
// ============================================================================
export const RealTimeMetricsPanel = ({ metrics }) => {
    const metricCards = [
        {
            title: 'Queries/Min',
            value: metrics.queries_per_minute,
            icon: TrendingUp,
            color: 'text-green-400',
            bgColor: 'bg-green-400/10'
        },
        {
            title: 'Avg Response',
            value: `${metrics.avg_response_time}ms`,
            icon: Clock,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10'
        },
        {
            title: 'Success Rate',
            value: `${metrics.success_rate}%`,
            icon: CheckCircle,
            color: 'text-green-400',
            bgColor: 'bg-green-400/10'
        },
        {
            title: 'GPU Usage',
            value: `${metrics.gpu_utilization}%`,
            icon: Gauge,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-400/10'
        },
        {
            title: 'Memory',
            value: `${metrics.memory_usage}GB`,
            icon: Server,
            color: 'text-purple-400',
            bgColor: 'bg-purple-400/10'
        },
        {
            title: 'Active Users',
            value: metrics.active_connections,
            icon: Users,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10'
        }
    ];
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Real-time Metrics
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
                {metricCards.map((metric, index) => (
                    <div key={index} className={`p-3 rounded-lg border border-gray-600 ${metric.bgColor}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{metric.title}</p>
                                <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                            </div>
                            <metric.icon className={`w-6 h-6 ${metric.color}`} />
                        </div>
                    </div>
                ))}
            </div>
            
            {/* System Health Indicator */}
            <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    System Health
                </h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Uptime</span>
                        <span className="text-green-400">{metrics.uptime_hours}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Errors (24h)</span>
                        <span className={metrics.error_count_24h > 5 ? 'text-red-400' : 'text-green-400'}>
                            {metrics.error_count_24h}
                        </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                        <div 
                            className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${metrics.success_rate}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Node Details Panel Component
// ============================================================================
export const NodeDetailsPanel = ({ node, onClose }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{node.name}</h2>
                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                node.status === 'success' ? 'bg-green-400/20 text-green-400' :
                node.status === 'processing' ? 'bg-yellow-400/20 text-yellow-400' :
                node.status === 'error' ? 'bg-red-400/20 text-red-400' :
                node.status === 'active' ? 'bg-blue-400/20 text-blue-400' :
                'bg-gray-400/20 text-gray-400'
            }`}>
                {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
            </div>
            
            {/* Metrics */}
            {node.metrics && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-300">Performance Metrics</h3>
                    <div className="space-y-2">
                        {Object.entries(node.metrics).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                                <span className="text-sm text-gray-400 capitalize">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm font-medium text-white">
                                    {typeof value === 'number' ? 
                                        (key.includes('rate') || key.includes('score') ? `${value}%` : 
                                         key.includes('time') || key.includes('ms') ? `${value}ms` : 
                                         key.includes('usage') ? `${value}%` :
                                         value) : value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300">Actions</h3>
                <div className="space-y-2">
                    <button className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                        View Detailed Logs
                    </button>
                    <button className="w-full p-2 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors">
                        Performance History
                    </button>
                    {node.status === 'error' && (
                        <button className="w-full p-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors">
                            Retry Operation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};export default TestPage;
