
// Data transformation utilities for Pipeline Monitor
export const transformBackendData = (backendData) => {
    if (!backendData || !backendData.metrics) {
        return {
            system_health: {},
            gpu_performance: [],
            pipeline_status: {},
            connection_status: {}
        };
    }

    const metrics = backendData.metrics;
    
    return {
        system_health: {
            cpu_percent: metrics.system_health?.cpu_usage || 0,
            memory_percent: metrics.system_health?.memory_usage || 0,
            status: metrics.system_health?.status || 'unknown'
        },
        gpu_performance: [
            {
                utilization: metrics.gpu_performance?.utilization || 0,
                memory_used: extractMemoryUsed(metrics.gpu_performance?.memory || "0MB / 0MB"),
                memory_total: extractMemoryTotal(metrics.gpu_performance?.memory || "0MB / 0MB"),
                temperature: metrics.gpu_performance?.temperature || 0
            }
        ],
        pipeline_status: {
            queries_per_minute: metrics.query_performance?.queries_per_min || 0,
            avg_response_time: parseResponseTime(metrics.query_performance?.avg_response_time || "0ms"),
            active_queries: metrics.query_performance?.active_queries || 0
        },
        connection_status: {
            websocket_connections: metrics.connection_status?.websocket || 0,
            backend_status: metrics.connection_status?.backend || 'unknown',
            database_status: metrics.connection_status?.database || 'unknown',
            vector_db_status: metrics.connection_status?.vector_db || 'unknown'
        }
    };
};

// Helper functions
const extractMemoryUsed = (memoryString) => {
    const match = memoryString.match(/(\d+)MB/);
    return match ? parseInt(match[1]) : 0;
};

const extractMemoryTotal = (memoryString) => {
    const match = memoryString.match(/\/ (\d+)MB/);
    return match ? parseInt(match[1]) : 0;
};

const parseResponseTime = (responseTimeString) => {
    const match = responseTimeString.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
};
