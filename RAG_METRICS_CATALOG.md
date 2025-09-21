# RAG Application Metrics Catalog

## Overview
This document provides a comprehensive categorized table of all metrics collected and reported within the RAG Application, including their collection methods, reporting locations, and current implementation status.

---

## 📊 **SYSTEM METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **CPU Usage** | CPU utilization percentage | `psutil.cpu_percent()` | Pipeline Monitor Dashboard, System Health Node | ✅ | ✅ | **Real** |
| **Memory Usage** | RAM utilization percentage | `psutil.virtual_memory()` | Pipeline Monitor Dashboard, System Health Node | ✅ | ✅ | **Real** |
| **Memory Available** | Available RAM in GB | `psutil.virtual_memory()` | Pipeline Monitor Dashboard | ✅ | ✅ | **Real** |
| **Disk Usage** | Disk space utilization | `psutil.disk_usage()` | Pipeline Monitor Dashboard | ✅ | ✅ | **Real** |
| **Network I/O** | Network bytes in/out | `psutil.net_io_counters()` | Pipeline Monitor Dashboard | ✅ | ✅ | **Real** |
| **System Uptime** | System uptime in seconds | `psutil.boot_time()` | Pipeline Monitor Dashboard | ✅ | ✅ | **Real** |

---

## 🎮 **GPU METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **GPU Utilization** | GPU compute utilization % | `nvidia-smi` + `GPUtil` | Pipeline Monitor Dashboard, LLM Processing Node | ✅ | ✅ | **Real** |
| **GPU Memory Used** | GPU memory used in MiB | `nvidia-smi` + `GPUtil` | Pipeline Monitor Dashboard, LLM Processing Node | ✅ | ✅ | **Real** |
| **GPU Memory Total** | Total GPU memory in MiB | `nvidia-smi` + `GPUtil` | Pipeline Monitor Dashboard, LLM Processing Node | ✅ | ✅ | **Real** |
| **GPU Temperature** | GPU temperature in °C | `nvidia-smi` + `GPUtil` | Pipeline Monitor Dashboard, LLM Processing Node | ✅ | ✅ | **Real** |
| **GPU Power Draw** | Current power consumption in W | `nvidia-smi` | Pipeline Monitor Dashboard | ✅ | ✅ | **Real** |
| **GPU Power Limit** | Maximum power limit in W | `nvidia-smi` | Pipeline Monitor Dashboard | ✅ | ✅ | **Real** |
| **GPU Name** | GPU model/name | `nvidia-smi` + `GPUtil` | Pipeline Monitor Dashboard | ✅ | ✅ | **Real** |

---

## 🔍 **QUERY PROCESSING METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **Total Queries** | Total number of queries processed | Database query count | Queries Page, Query Input Node | ✅ | ✅ | **Real** |
| **Queries Per Minute** | Query throughput rate | Calculated from query history | Pipeline Monitor Dashboard, Performance Node | ✅ | ✅ | **Real** |
| **Average Response Time** | Average query response time in ms | Calculated from query history | Pipeline Monitor Dashboard, Vector Search Node | ✅ | ✅ | **Real** |
| **Active Queries** | Currently processing queries | Database active query count | Pipeline Monitor Dashboard, Query Input Node | ✅ | ✅ | **Real** |
| **Query Success Rate** | Percentage of successful queries | Calculated from query history | Pipeline Monitor Dashboard, Response Generation Node | ✅ | ✅ | **Real** |
| **Query Queue Length** | Number of queued queries | Database queue count | Pipeline Monitor Dashboard, Query Input Node | ✅ | ✅ | **Real** |
| **Query Processing Time** | Time to process individual queries | Query execution timing | Pipeline Monitor Dashboard, LLM Processing Node | ✅ | ✅ | **Real** |
| **Query Input Rate** | Rate of new query submissions | Query submission tracking | Pipeline Monitor Dashboard, Query Input Node | ✅ | ✅ | **Real** |

---

## 📄 **DOCUMENT PROCESSING METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **Total Documents** | Total number of documents uploaded | Database document count | Documents Page, Document Ingestion Node | ✅ | ✅ | **Real** |
| **Processed Documents** | Number of successfully processed documents | Database processed count | Pipeline Monitor Dashboard, Document Ingestion Node | ✅ | ✅ | **Real** |
| **Processing Queue** | Number of documents in processing queue | Database queue count | Pipeline Monitor Dashboard, Document Ingestion Node | ✅ | ✅ | **Real** |
| **Chunks Generated** | Total text chunks created from documents | Database chunk count | Pipeline Monitor Dashboard, Text Processing Node | ✅ | ✅ | **Real** |
| **Embeddings Generated** | Total embeddings created | Database embedding count | Pipeline Monitor Dashboard, Embedding Generation Node | ✅ | ✅ | **Real** |
| **Vectors Stored** | Total vectors stored in Qdrant | Qdrant collection stats | Pipeline Monitor Dashboard, Vector Storage Node | ✅ | ✅ | **Real** |
| **Average Processing Time** | Average document processing time in seconds | Processing time calculation | Pipeline Monitor Dashboard, Document Ingestion Node | ✅ | ✅ | **Real** |
| **Document Success Rate** | Percentage of successfully processed documents | Success rate calculation | Pipeline Monitor Dashboard, Document Ingestion Node | ✅ | ✅ | **Real** |
| **Document Upload Rate** | Rate of new document uploads | Upload tracking | Pipeline Monitor Dashboard, Document Ingestion Node | ✅ | ✅ | **Real** |

---

## 🗄️ **VECTOR DATABASE METRICS (QDRANT)**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **Total Vectors** | Total number of vectors in collections | `GET /collections/{name}` | Qdrant Dashboards, Vector Storage Node | ✅ | ✅ | **Real** |
| **Collections Count** | Number of active collections | `GET /collections` | Qdrant Dashboards, Vector Storage Node | ✅ | ✅ | **Real** |
| **Search Latency** | Average search response time in ms | `GET /metrics` (Prometheus) | Qdrant Dashboards, Vector Search Node | ✅ | ✅ | **Real** |
| **Index Size** | Size of vector index in bytes | `GET /collections/{name}/stats` | Qdrant Dashboards, Vector Storage Node | ✅ | ✅ | **Real** |
| **Memory Usage** | Qdrant memory usage in bytes | `GET /collections/{name}/stats` | Qdrant Dashboards, Vector Storage Node | ✅ | ✅ | **Real** |
| **Disk Usage** | Qdrant disk usage in bytes | `GET /collections/{name}/stats` | Qdrant Dashboards, Vector Storage Node | ✅ | ✅ | **Real** |
| **Health Status** | Qdrant service health status | `GET /health` | Qdrant Dashboards, System Health Node | ✅ | ✅ | **Real** |
| **Collection Status** | Individual collection status | `GET /collections/{name}` | Qdrant Dashboards, Collection Node | ✅ | ✅ | **Real** |
| **Indexed Vectors** | Number of indexed vectors | `GET /collections/{name}/stats` | Qdrant Dashboards, Vector Metrics Node | ✅ | ✅ | **Real** |
| **Vector Dimensions** | Vector dimension size | `GET /collections/{name}` | Qdrant Dashboards, Collection Node | ✅ | ✅ | **Real** |
| **Distance Metric** | Vector distance metric used | `GET /collections/{name}` | Qdrant Dashboards, Collection Node | ✅ | ✅ | **Real** |
| **Segments Count** | Number of collection segments | `GET /collections/{name}` | Qdrant Dashboards, Collection Node | ✅ | ✅ | **Real** |

---

## 🗃️ **POSTGRESQL DATABASE METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **Database Health** | PostgreSQL connection status | Database connection test | Database Dashboard, System Health Node | ✅ | ✅ | **Real** |
| **Connection Count** | Total database connections | `pg_stat_activity` | Database Dashboard, PostgreSQL Status | ✅ | ✅ | **Real** |
| **Active Connections** | Currently active connections | `pg_stat_activity` | Database Dashboard, PostgreSQL Status | ✅ | ✅ | **Real** |
| **Database Size** | Total database size in MB | `pg_database_size()` | Database Dashboard, PostgreSQL Status | ✅ | ✅ | **Real** |
| **Table Counts** | Number of records per table | `SELECT COUNT(*)` per table | Database Dashboard, PostgreSQL Status | ✅ | ✅ | **Real** |
| **Query Performance** | Average query response time | Query execution timing | Database Dashboard, Performance Tab | ✅ | ✅ | **Real** |
| **Cache Hit Ratio** | Database cache hit percentage | `pg_stat_database` | Database Dashboard, Performance Tab | ✅ | ✅ | **Real** |
| **Index Usage** | Index utilization statistics | `pg_stat_user_indexes` | Database Dashboard, Performance Tab | ✅ | ✅ | **Real** |
| **Deadlocks** | Number of deadlocks detected | `pg_stat_database` | Database Dashboard, Performance Tab | ✅ | ✅ | **Real** |
| **Slow Queries** | Queries exceeding threshold | Query log analysis | Database Dashboard, Performance Tab | ✅ | ✅ | **Real** |

---

## 🔄 **PIPELINE METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **Pipeline Status** | Overall pipeline health status | Pipeline monitoring service | Pipeline Monitor Dashboard, Resource Monitor Node | ✅ | ✅ | **Real** |
| **Active Pipelines** | Number of currently running pipelines | Pipeline tracking | Pipeline Monitor Dashboard, Resource Monitor Node | ✅ | ✅ | **Real** |
| **Total Pipelines** | Total number of pipeline instances | Pipeline tracking | Pipeline Monitor Dashboard, Resource Monitor Node | ✅ | ✅ | **Real** |
| **Pipeline Success Rate** | Percentage of successful pipelines | Success rate calculation | Pipeline Monitor Dashboard, Resource Monitor Node | ✅ | ✅ | **Real** |
| **Pipeline Duration** | Average pipeline execution time | Pipeline timing | Pipeline Monitor Dashboard, Resource Monitor Node | ✅ | ✅ | **Real** |
| **Pipeline Errors** | Number of pipeline errors | Error tracking | Pipeline Monitor Dashboard, Resource Monitor Node | ✅ | ✅ | **Real** |
| **Stage Performance** | Individual stage execution times | Stage timing | Pipeline Monitor Dashboard, Individual Nodes | ✅ | ✅ | **Real** |
| **Queue Depth** | Number of items in processing queues | Queue monitoring | Pipeline Monitor Dashboard, Individual Nodes | ✅ | ✅ | **Real** |

---

## 🌐 **CONNECTION STATUS METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **WebSocket Connections** | Number of active WebSocket connections | WebSocket manager | Pipeline Monitor Dashboard, Header | ✅ | ✅ | **Real** |
| **Backend Status** | Backend service health | Health check endpoint | Pipeline Monitor Dashboard, Header | ✅ | ✅ | **Real** |
| **Database Status** | PostgreSQL connection status | Database health check | Pipeline Monitor Dashboard, Header | ✅ | ✅ | **Real** |
| **Vector DB Status** | Qdrant connection status | Qdrant health check | Pipeline Monitor Dashboard, Header | ✅ | ✅ | **Real** |
| **API Response Time** | Average API response time | API timing | Pipeline Monitor Dashboard, Header | ✅ | ✅ | **Real** |
| **Service Uptime** | Service uptime in seconds | Uptime tracking | Pipeline Monitor Dashboard, Header | ✅ | ✅ | **Real** |

---

## 📈 **PERFORMANCE METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **Throughput** | Overall system throughput | Calculated from multiple sources | Pipeline Monitor Dashboard, Performance Node | ✅ | ✅ | **Real** |
| **Latency** | End-to-end processing latency | Timing measurements | Pipeline Monitor Dashboard, Performance Node | ✅ | ✅ | **Real** |
| **Error Rate** | Overall system error rate | Error counting | Pipeline Monitor Dashboard, Performance Node | ✅ | ✅ | **Real** |
| **Resource Utilization** | Overall resource usage | Resource monitoring | Pipeline Monitor Dashboard, Resource Monitor Node | ✅ | ✅ | **Real** |
| **Cache Performance** | Cache hit/miss ratios | Cache statistics | Database Dashboard, Performance Tab | ✅ | ✅ | **Real** |
| **Network Performance** | Network throughput and latency | Network monitoring | Pipeline Monitor Dashboard, System Health Node | ✅ | ✅ | **Real** |

---

## 🎯 **RAG-SPECIFIC METRICS**

| Metric | Description | Collection Method | Location in RAG App | Currently Captured | Currently Reported | Status |
|--------|-------------|-------------------|-------------------|-------------------|-------------------|---------|
| **Retrieval Accuracy** | Accuracy of document retrieval | Query result analysis | Pipeline Monitor Dashboard, Vector Search Node | ❌ | ❌ | **Planned** |
| **Response Quality** | Quality score of generated responses | Response evaluation | Pipeline Monitor Dashboard, Response Generation Node | ❌ | ❌ | **Planned** |
| **Context Relevance** | Relevance of retrieved context | Context analysis | Pipeline Monitor Dashboard, Vector Search Node | ❌ | ❌ | **Planned** |
| **Token Usage** | LLM token consumption | Token counting | Pipeline Monitor Dashboard, LLM Processing Node | ✅ | ✅ | **Real** |
| **Model Load** | LLM model loading status | Model status tracking | Pipeline Monitor Dashboard, LLM Processing Node | ✅ | ✅ | **Real** |
| **Temperature** | LLM temperature setting | Configuration tracking | Pipeline Monitor Dashboard, LLM Processing Node | ✅ | ✅ | **Real** |
| **Chunk Overlap** | Text chunk overlap percentage | Chunk analysis | Pipeline Monitor Dashboard, Text Processing Node | ❌ | ❌ | **Planned** |
| **Embedding Quality** | Quality of generated embeddings | Embedding analysis | Pipeline Monitor Dashboard, Embedding Generation Node | ❌ | ❌ | **Planned** |

---

## 📍 **REPORTING LOCATIONS**

### **Pipeline Monitor Dashboard**
- **Location**: `/monitoring` route
- **Components**: All pipeline nodes, resource monitor, system health
- **Metrics**: Real-time pipeline metrics, system health, GPU performance

### **Database Dashboard**
- **Location**: `/database-dashboard` route
- **Components**: PostgreSQL status, Qdrant status, performance tabs
- **Metrics**: Database health, performance, storage statistics

### **Qdrant Dashboards**
- **Location**: `/qdrant-dashboard`, `/qdrant-flow`, `/qdrant-advanced`, `/qdrant-professional` routes
- **Components**: Collection nodes, vector metrics, performance nodes
- **Metrics**: Vector database statistics, collection health, search performance

### **Documents Page**
- **Location**: `/documents` route
- **Components**: Document list, upload interface
- **Metrics**: Document counts, processing status, upload statistics

### **Queries Page**
- **Location**: `/queries` route
- **Components**: Query interface, history table
- **Metrics**: Query counts, response times, success rates

---

## 🔧 **COLLECTION METHODS**

### **Real-Time Collection**
- **WebSocket**: System metrics, GPU metrics, pipeline status
- **API Polling**: Database metrics, Qdrant metrics, query statistics
- **Direct Database Queries**: PostgreSQL statistics, query history

### **Batch Collection**
- **Log Analysis**: Pipeline logs, error logs, performance logs
- **File System Monitoring**: Log files, data files, configuration files
- **Scheduled Tasks**: Periodic metric collection and aggregation

### **External Tools**
- **nvidia-smi**: GPU metrics and performance
- **psutil**: System resource monitoring
- **GPUtil**: GPU utilization and memory
- **Qdrant API**: Vector database statistics
- **PostgreSQL**: Database performance metrics

---

## 📊 **CURRENT IMPLEMENTATION STATUS**

### **✅ Fully Implemented (Real Data)**
- System metrics (CPU, Memory, Disk, Network)
- GPU metrics (Utilization, Memory, Temperature, Power)
- Query processing metrics (Count, Response Time, Success Rate)
- Document processing metrics (Count, Processing Time, Success Rate)
- Vector database metrics (Collections, Vectors, Search Latency)
- PostgreSQL database metrics (Health, Performance, Storage)
- Pipeline metrics (Status, Performance, Errors)
- Connection status metrics (WebSocket, Services)

### **🔄 Partially Implemented (Demo Data)**
- Some advanced performance metrics
- Complex error analysis
- Historical trend analysis

### **❌ Planned (Not Yet Implemented)**
- RAG-specific quality metrics
- Advanced performance analytics
- Predictive metrics
- Custom business metrics

---

## 🎯 **NEXT STEPS**

1. **Remove Demo Data Indicators**: As real metrics are implemented, remove asterisks (*) from components
2. **Implement RAG-Specific Metrics**: Add retrieval accuracy, response quality, context relevance
3. **Add Historical Analysis**: Implement trend analysis and historical reporting
4. **Enhance Performance Metrics**: Add more detailed performance analysis
5. **Custom Metrics**: Add business-specific metrics and KPIs

---

*Last Updated: January 2025*
*Version: 1.0*
