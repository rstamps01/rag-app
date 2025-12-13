# Testing Metrics Blocking Fixes

## Test Plan

### **Test 1: Metrics Continue Updating During Processing** ✅

**Objective**: Verify metrics dashboard continues updating during document processing

**Steps**:
1. Open metrics dashboard: `http://localhost:3001/metrics`
2. Start document upload/processing
3. Monitor metrics dashboard during processing
4. Verify metrics continue updating (CPU, GPU, memory, etc.)

**Expected Result**:
- ✅ Metrics continue updating every 0.5 seconds
- ✅ No freezing or "Waiting for Data" messages
- ✅ Real-time monitoring maintained

**Verification**:
```bash
# Monitor metrics endpoint during processing
watch -n 0.5 'curl -s http://localhost:8000/api/v1/metrics/comprehensive | jq .system_metrics.cpu_usage'
```

---

### **Test 2: GPU Utilization Optimization** ✅

**Objective**: Verify GPU utilization increases to 80-95% with batch processing

**Steps**:
1. Start document processing
2. Monitor GPU with `nvidia-smi` in loop
3. Check GPU utilization percentage
4. Verify batch processing is active

**Expected Result**:
- ✅ GPU utilization: 80-95% (up from 14-22%)
- ✅ GPU memory usage: ~16-20GB (efficient use)
- ✅ Processing speed: 5-10x faster

**Verification**:
```bash
# Monitor GPU during processing
watch -n 1 nvidia-smi

# Check for batch processing logs
docker logs backend-07 | grep "batch"
```

---

### **Test 3: Event Loop Non-Blocking** ✅

**Objective**: Verify event loop remains free for other operations

**Steps**:
1. Start document processing
2. Make API requests simultaneously
3. Check WebSocket connections
4. Verify all operations complete

**Expected Result**:
- ✅ API requests respond immediately
- ✅ WebSocket connections remain active
- ✅ Metrics continue updating
- ✅ No blocking or timeouts

**Verification**:
```bash
# Test API during processing
curl http://localhost:8000/api/v1/status

# Check WebSocket connections
curl http://localhost:8000/api/v1/metrics/comprehensive | jq .connection_metrics
```

---

### **Test 4: Thread Pool Execution** ✅

**Objective**: Verify document processing runs in thread pool

**Steps**:
1. Check backend logs for thread pool messages
2. Monitor CPU usage distribution
3. Verify multiple documents can process concurrently

**Expected Result**:
- ✅ Logs show "thread pool" messages
- ✅ CPU usage distributed across cores
- ✅ Multiple documents process concurrently

**Verification**:
```bash
# Check logs for thread pool
docker logs backend-07 | grep -i "thread pool\|doc_processor"

# Monitor CPU usage
top -p $(docker inspect -f '{{.State.Pid}}' backend-07)
```

---

## Monitoring Commands

### **Real-time Metrics Monitoring**
```bash
# Watch metrics endpoint
watch -n 0.5 'curl -s http://localhost:8000/api/v1/metrics/comprehensive | jq "{cpu: .system_metrics.cpu_usage, gpu: .system_metrics.gpu_metrics.utilization, memory: .system_metrics.memory_usage}"'
```

### **GPU Monitoring**
```bash
# Continuous GPU monitoring
watch -n 1 nvidia-smi

# One-time GPU check
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv
```

### **Backend Logs**
```bash
# Follow logs
docker logs -f backend-07

# Check for specific messages
docker logs backend-07 | grep -E "non-blocking|thread pool|batch|metrics"
```

### **System Resource Monitoring**
```bash
# CPU and memory
top -p $(docker inspect -f '{{.State.Pid}}' backend-07)

# Docker stats
docker stats backend-07
```

---

## Success Criteria

### **Metrics Dashboard**
- ✅ Updates every 0.5 seconds during processing
- ✅ No freezing or "Waiting for Data"
- ✅ All metrics show real-time values

### **GPU Utilization**
- ✅ GPU utilization: 80-95% (up from 14-22%)
- ✅ Processing speed: 5-10x faster
- ✅ Batch processing active (logs confirm)

### **Event Loop**
- ✅ API requests respond immediately
- ✅ WebSocket connections active
- ✅ No blocking or timeouts

### **Thread Pool**
- ✅ Document processing in thread pool (logs confirm)
- ✅ CPU usage distributed
- ✅ Concurrent processing possible

---

## Troubleshooting

### **If Metrics Still Stop Updating**:
1. Check backend logs for errors
2. Verify thread pool is initialized
3. Check CPU usage (should be < 99%)
4. Verify non-blocking metrics collection

### **If GPU Utilization Still Low**:
1. Check batch size (should be 32)
2. Verify embedding model is using GPU
3. Check GPU memory allocation
4. Review batch processing logs

### **If Event Loop Still Blocked**:
1. Verify thread pool executor is used
2. Check for synchronous operations
3. Review document processing code
4. Monitor CPU usage distribution

---

## Test Results

**Date**: [To be filled after testing]
**Status**: [Pending/Passed/Failed]

### **Test 1: Metrics Continue Updating**
- Status: [ ]
- Notes: 

### **Test 2: GPU Utilization**
- Status: [ ]
- Notes: 

### **Test 3: Event Loop Non-Blocking**
- Status: [ ]
- Notes: 

### **Test 4: Thread Pool Execution**
- Status: [ ]
- Notes: 

---

**Last Updated**: Test plan ready for execution

