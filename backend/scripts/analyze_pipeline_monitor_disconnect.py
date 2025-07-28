#!/usr/bin/env python3
"""
Pipeline Monitor Disconnect Analysis
===================================

This script analyzes the disconnect between the working backend API 
(showing real metrics via curl) and the Pipeline Monitor UI (showing zeros).
"""

import json
from datetime import datetime

def analyze_current_ui_state():
    """Analyze the current UI state from the screenshot"""
    print("🖥️  CURRENT UI STATE ANALYSIS")
    print("=" * 60)
    
    ui_state = {
        "connection_status": {
            "websocket": "Connected (green indicator)",
            "pipeline_status": "Pipeline Active",
            "real_time_monitoring": "Active"
        },
        "displayed_metrics": {
            "system_health": {
                "cpu_usage": "0%",
                "memory": "0%"
            },
            "gpu_performance": {
                "status": "No GPU data available",
                "utilization": "Not shown",
                "memory": "Not shown",
                "temperature": "Not shown"
            },
            "query_performance": {
                "queries_per_min": "0",
                "avg_response": "0ms", 
                "active_queries": "0"
            },
            "connection_status": {
                "websocket": "0 clients",
                "backend": "unknown",
                "database": "unknown", 
                "vector_db": "unknown"
            }
        },
        "center_display": {
            "status": "Pipeline Active",
            "message": "Real-time monitoring active",
            "metrics_shown": {
                "cpu": "0%",
                "memory": "0%", 
                "queries_per_min": "0"
            }
        }
    }
    
    print("🔗 Connection Status:")
    for key, value in ui_state["connection_status"].items():
        print(f"   {key}: {value}")
    
    print("\\n📊 Displayed Metrics:")
    for category, metrics in ui_state["displayed_metrics"].items():
        print(f"   {category}:")
        for metric, value in metrics.items():
            print(f"     {metric}: {value}")
    
    print("\\n🎯 Center Display:")
    for key, value in ui_state["center_display"].items():
        print(f"   {key}: {value}")
    
    return ui_state

def compare_backend_vs_ui():
    """Compare backend API data vs UI display"""
    print("\\n🔍 BACKEND API vs UI COMPARISON")
    print("=" * 60)
    
    comparison = {
        "backend_api_data": {
            "source": "curl http://localhost:8000/api/v1/monitoring/status",
            "system_health": {
                "cpu_percent": 0.6,
                "memory_percent": 23.8,
                "memory_available": "23GB"
            },
            "gpu_performance": [
                {
                    "utilization": 10.6,
                    "memory_used": 1606,
                    "memory_total": 3260,
                    "temperature": 41
                }
            ],
            "pipeline_status": {
                "queries_per_minute": 0,
                "avg_response_time": 198,
                "active_queries": 0
            },
            "connection_status": {
                "websocket_connections": 2,
                "backend_status": "connected",
                "database_status": "connected",
                "vector_db_status": "connected"
            }
        },
        "ui_display": {
            "system_health": {
                "cpu_usage": "0%",
                "memory": "0%"
            },
            "gpu_performance": "No GPU data available",
            "query_performance": {
                "queries_per_min": "0",
                "avg_response": "0ms",
                "active_queries": "0"
            },
            "connection_status": {
                "websocket": "0 clients",
                "backend": "unknown",
                "database": "unknown",
                "vector_db": "unknown"
            }
        }
    }
    
    print("📊 Backend API Data (Working):")
    backend_data = comparison["backend_api_data"]
    for category, data in backend_data.items():
        if category != "source":
            print(f"   {category}: {data}")
    
    print("\\n🖥️  UI Display (Not Working):")
    ui_data = comparison["ui_display"]
    for category, data in ui_data.items():
        print(f"   {category}: {data}")
    
    print("\\n❌ MISMATCHES IDENTIFIED:")
    mismatches = [
        "CPU: Backend shows 0.6%, UI shows 0%",
        "Memory: Backend shows 23.8%, UI shows 0%", 
        "GPU: Backend shows 10.6% util, UI shows 'No GPU data available'",
        "Response Time: Backend shows 198ms, UI shows 0ms",
        "WebSocket: Backend shows 2 connections, UI shows 0 clients",
        "Connection Status: Backend shows 'connected', UI shows 'unknown'"
    ]
    
    for mismatch in mismatches:
        print(f"   ❌ {mismatch}")
    
    return comparison

def identify_disconnect_causes():
    """Identify potential causes of the disconnect"""
    print("\\n🔍 DISCONNECT CAUSE ANALYSIS")
    print("=" * 60)
    
    potential_causes = {
        "websocket_message_format": {
            "issue": "Frontend not receiving or parsing WebSocket messages correctly",
            "evidence": "UI shows 'Connected' but no data updates",
            "likelihood": "HIGH"
        },
        "data_transformation_mismatch": {
            "issue": "Frontend expecting different data format than backend sends",
            "evidence": "Backend API works, but WebSocket data not displayed",
            "likelihood": "HIGH"
        },
        "frontend_component_not_updated": {
            "issue": "Frontend components not deployed with latest fixes",
            "evidence": "Still showing old behavior despite backend fixes",
            "likelihood": "MEDIUM"
        },
        "websocket_endpoint_mismatch": {
            "issue": "Frontend connecting to wrong WebSocket endpoint",
            "evidence": "Connection shows but no data flow",
            "likelihood": "MEDIUM"
        },
        "message_type_handling": {
            "issue": "Frontend not handling 'metrics_update' message type",
            "evidence": "Connection active but metrics not updating",
            "likelihood": "HIGH"
        },
        "state_management_issue": {
            "issue": "Frontend receiving data but not updating component state",
            "evidence": "WebSocket connected but UI not reflecting changes",
            "likelihood": "MEDIUM"
        }
    }
    
    print("🎯 Potential Causes (by likelihood):")
    for cause, details in potential_causes.items():
        print(f"\\n   {cause.upper()} ({details['likelihood']} likelihood):")
        print(f"     Issue: {details['issue']}")
        print(f"     Evidence: {details['evidence']}")
    
    return potential_causes

def analyze_websocket_data_flow():
    """Analyze the WebSocket data flow"""
    print("\\n🔌 WEBSOCKET DATA FLOW ANALYSIS")
    print("=" * 60)
    
    data_flow = {
        "backend_websocket": {
            "endpoint": "/api/v1/ws/pipeline-monitoring",
            "message_types": ["initial_state", "metrics_update"],
            "data_format": "Transformed format with proper field names",
            "broadcast_frequency": "Every 2 seconds",
            "active_connections": 2
        },
        "frontend_websocket": {
            "connection_url": "Expected: ws://localhost:8000/api/v1/ws/pipeline-monitoring",
            "message_handling": "useWebSocket.jsx hook",
            "expected_format": "Transformed data with cpu_percent, gpu_performance array, etc.",
            "state_updates": "Should update PipelineMonitoringDashboard state"
        },
        "potential_issues": {
            "url_mismatch": "Frontend might be connecting to wrong URL",
            "message_parsing": "Frontend might not be parsing messages correctly",
            "state_binding": "Data received but not bound to UI components",
            "component_updates": "Components not re-rendering with new data"
        }
    }
    
    print("📡 Backend WebSocket:")
    for key, value in data_flow["backend_websocket"].items():
        print(f"   {key}: {value}")
    
    print("\\n🎨 Frontend WebSocket:")
    for key, value in data_flow["frontend_websocket"].items():
        print(f"   {key}: {value}")
    
    print("\\n⚠️  Potential Issues:")
    for issue, description in data_flow["potential_issues"].items():
        print(f"   {issue}: {description}")
    
    return data_flow

def create_debugging_strategy():
    """Create a debugging strategy to fix the disconnect"""
    print("\\n🔧 DEBUGGING STRATEGY")
    print("=" * 60)
    
    strategy = {
        "immediate_checks": [
            "Verify frontend WebSocket URL matches backend endpoint",
            "Check browser console for WebSocket connection errors",
            "Confirm frontend components are using latest versions",
            "Test WebSocket message reception in browser dev tools"
        ],
        "data_flow_verification": [
            "Monitor WebSocket messages in browser Network tab",
            "Add console.log to frontend WebSocket message handler",
            "Verify data transformation is working in frontend",
            "Check if state updates are triggering component re-renders"
        ],
        "component_analysis": [
            "Verify useWebSocket.jsx is properly handling messages",
            "Check PipelineMonitoringDashboard state management",
            "Confirm dataTransformation.js is being used",
            "Test component prop passing and state binding"
        ],
        "fix_deployment": [
            "Ensure all frontend files are deployed to correct locations",
            "Restart frontend container to pick up changes",
            "Clear browser cache to ensure latest code is loaded",
            "Test end-to-end data flow after fixes"
        ]
    }
    
    print("🔍 Debugging Steps:")
    for category, steps in strategy.items():
        print(f"\\n   {category.upper()}:")
        for i, step in enumerate(steps, 1):
            print(f"     {i}. {step}")
    
    return strategy

def create_fix_recommendations():
    """Create specific fix recommendations"""
    print("\\n💡 FIX RECOMMENDATIONS")
    print("=" * 60)
    
    recommendations = {
        "high_priority": [
            {
                "issue": "Frontend WebSocket message handling",
                "fix": "Update useWebSocket.jsx to properly parse 'metrics_update' messages",
                "file": "useWebSocket.jsx",
                "action": "Add message type handling and state updates"
            },
            {
                "issue": "Component state management", 
                "fix": "Ensure PipelineMonitoringDashboard receives and displays WebSocket data",
                "file": "PipelineMonitoringDashboard.jsx",
                "action": "Verify state binding and component re-rendering"
            },
            {
                "issue": "Data transformation consistency",
                "fix": "Ensure frontend expects same format as backend sends",
                "file": "dataTransformation.js",
                "action": "Align data format expectations"
            }
        ],
        "medium_priority": [
            {
                "issue": "WebSocket URL verification",
                "fix": "Confirm frontend connects to correct WebSocket endpoint",
                "file": "useWebSocket.jsx",
                "action": "Verify WebSocket URL matches backend endpoint"
            },
            {
                "issue": "Browser caching",
                "fix": "Clear browser cache and restart frontend container",
                "file": "N/A",
                "action": "Deployment and cache clearing"
            }
        ]
    }
    
    print("🚨 High Priority Fixes:")
    for fix in recommendations["high_priority"]:
        print(f"\\n   Issue: {fix['issue']}")
        print(f"   Fix: {fix['fix']}")
        print(f"   File: {fix['file']}")
        print(f"   Action: {fix['action']}")
    
    print("\\n⚠️  Medium Priority Fixes:")
    for fix in recommendations["medium_priority"]:
        print(f"\\n   Issue: {fix['issue']}")
        print(f"   Fix: {fix['fix']}")
        print(f"   File: {fix['file']}")
        print(f"   Action: {fix['action']}")
    
    return recommendations

def main():
    """Main analysis function"""
    print("🔍 PIPELINE MONITOR DISCONNECT ANALYSIS")
    print("=" * 80)
    print(f"🕐 Analysis started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all analyses
    ui_state = analyze_current_ui_state()
    comparison = compare_backend_vs_ui()
    causes = identify_disconnect_causes()
    data_flow = analyze_websocket_data_flow()
    strategy = create_debugging_strategy()
    recommendations = create_fix_recommendations()
    
    # Summary
    print("\\n" + "=" * 80)
    print("📊 ANALYSIS SUMMARY")
    print("=" * 80)
    
    print("🎯 KEY FINDINGS:")
    print("1. ✅ WebSocket connection is working (UI shows 'Connected')")
    print("2. ✅ Backend API is working (curl shows real metrics)")
    print("3. ❌ Frontend is not receiving or displaying WebSocket data")
    print("4. ❌ UI shows all zeros despite backend having real data")
    print("5. ❌ Data transformation working in backend but not reaching UI")
    
    print("\\n🔍 ROOT CAUSE:")
    print("Frontend WebSocket message handling is not working correctly.")
    print("The connection is established but data is not being processed or displayed.")
    
    print("\\n🚨 IMMEDIATE ACTION REQUIRED:")
    print("1. Fix frontend WebSocket message parsing")
    print("2. Update component state management")
    print("3. Ensure data transformation consistency")
    print("4. Deploy frontend fixes and test")
    
    print("\\n📁 FILES TO FIX:")
    print("• useWebSocket.jsx - Message handling")
    print("• PipelineMonitoringDashboard.jsx - State management")
    print("• dataTransformation.js - Data format alignment")
    
    print(f"\\n🕐 Analysis completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return {
        "ui_state": ui_state,
        "comparison": comparison,
        "causes": causes,
        "data_flow": data_flow,
        "strategy": strategy,
        "recommendations": recommendations
    }

if __name__ == "__main__":
    main()

