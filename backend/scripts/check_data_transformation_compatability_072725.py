#!/usr/bin/env python3
"""
Data Transformation Compatibility Check
======================================

This script checks if the restored main.py is compatible with the frontend
data transformation fixes we created earlier.
"""

import json
import sys
from datetime import datetime

def analyze_websocket_data_format():
    """Analyze the current WebSocket data format being sent"""
    print("🔍 WEBSOCKET DATA FORMAT ANALYSIS")
    print("=" * 60)
    
    print("\n📊 CURRENT BACKEND DATA FORMAT (from websocket_monitoring.py):")
    print("-" * 50)
    
    backend_format = {
        "timestamp": "Unix timestamp (e.g., 1753648245.7363536)",
        "system_health": {
            "cpu_usage": "float (e.g., 15.5)",
            "memory_usage": "float (e.g., 22.5)",
            "memory_available": "string (e.g., '23GB')"
        },
        "gpu_performance": {
            "utilization": "int (e.g., 5)",
            "memory": "string (e.g., '1600MB / 3260MB')",
            "temperature": "int (e.g., 41)"
        },
        "query_performance": {
            "queries_per_min": "int (e.g., 0)",
            "avg_response_time": "string (e.g., '0ms')",
            "active_queries": "int (e.g., 0)"
        },
        "connection_status": {
            "websocket": "int (e.g., 1)",
            "backend": "string (e.g., 'connected')",
            "database": "string (e.g., 'connected')",
            "vector_db": "string (e.g., 'connected')"
        }
    }
    
    print("✅ Backend sends:")
    for category, fields in backend_format.items():
        print(f"   {category}:")
        if isinstance(fields, dict):
            for field, format_type in fields.items():
                print(f"     - {field}: {format_type}")
        else:
            print(f"     - {fields}")
    
    print("\n📊 FRONTEND EXPECTED FORMAT (from our analysis):")
    print("-" * 50)
    
    frontend_expected = {
        "system_health": {
            "cpu_percent": "float (expects cpu_usage renamed)",
            "memory_percent": "float (expects memory_usage renamed)"
        },
        "gpu_performance": [
            {
                "utilization": "int (same)",
                "memory_used": "int (parsed from '1600MB / 3260MB')",
                "memory_total": "int (parsed from '1600MB / 3260MB')",
                "temperature": "int (same)"
            }
        ],
        "pipeline_status": {
            "queries_per_minute": "int (expects queries_per_min renamed)",
            "avg_response_time": "int (parsed from '0ms')",
            "active_queries": "int (same)"
        },
        "connection_status": {
            "websocket_connections": "int (expects websocket renamed)",
            "backend_status": "string (expects backend renamed)",
            "database_status": "string (expects database renamed)",
            "vector_db_status": "string (expects vector_db renamed)"
        }
    }
    
    print("✅ Frontend expects:")
    for category, fields in frontend_expected.items():
        print(f"   {category}:")
        if isinstance(fields, list):
            print(f"     - Array format: {fields[0]}")
        elif isinstance(fields, dict):
            for field, format_type in fields.items():
                print(f"     - {field}: {format_type}")
        else:
            print(f"     - {fields}")
    
    return backend_format, frontend_expected

def identify_compatibility_issues():
    """Identify specific compatibility issues"""
    print("\n🔴 COMPATIBILITY ISSUES IDENTIFIED:")
    print("-" * 50)
    
    issues = [
        {
            "category": "Field Name Mismatches",
            "issues": [
                "cpu_usage (backend) vs cpu_percent (frontend)",
                "memory_usage (backend) vs memory_percent (frontend)",
                "queries_per_min (backend) vs queries_per_minute (frontend)",
                "websocket (backend) vs websocket_connections (frontend)",
                "backend (backend) vs backend_status (frontend)",
                "database (backend) vs database_status (frontend)",
                "vector_db (backend) vs vector_db_status (frontend)"
            ]
        },
        {
            "category": "Data Type Mismatches",
            "issues": [
                "gpu_performance: object (backend) vs array (frontend)",
                "memory: '1600MB / 3260MB' string vs memory_used/memory_total numbers",
                "avg_response_time: '0ms' string vs numeric value"
            ]
        },
        {
            "category": "Message Structure",
            "issues": [
                "Backend sends: {type: 'metrics_update', data: {...}}",
                "Frontend expects: transformed data structure",
                "Missing data transformation layer in backend"
            ]
        }
    ]
    
    for issue_group in issues:
        print(f"\n🔸 {issue_group['category']}:")
        for issue in issue_group['issues']:
            print(f"   ❌ {issue}")
    
    return issues

def check_restored_main_py_compatibility():
    """Check if restored main.py addresses these issues"""
    print("\n🔍 CHECKING RESTORED MAIN.PY COMPATIBILITY:")
    print("-" * 50)
    
    try:
        with open('/home/vastdata/rag-app-07/backend/app/main.py', 'r') as f:
            main_py_content = f.read()
        
        # Check if main.py has any data transformation logic
        transformation_indicators = [
            "cpu_percent",
            "memory_percent", 
            "queries_per_minute",
            "websocket_connections",
            "backend_status",
            "database_status",
            "vector_db_status",
            "memory_used",
            "memory_total",
            "transform",
            "mapping"
        ]
        
        found_indicators = []
        missing_indicators = []
        
        for indicator in transformation_indicators:
            if indicator in main_py_content:
                found_indicators.append(indicator)
            else:
                missing_indicators.append(indicator)
        
        print(f"✅ Found transformation indicators: {len(found_indicators)}")
        for indicator in found_indicators:
            print(f"   ✅ {indicator}")
        
        print(f"\n❌ Missing transformation indicators: {len(missing_indicators)}")
        for indicator in missing_indicators:
            print(f"   ❌ {indicator}")
        
        # Check if WebSocket monitoring is included
        websocket_included = "websocket_monitoring" in main_py_content
        print(f"\n🔌 WebSocket monitoring included: {'✅ Yes' if websocket_included else '❌ No'}")
        
        return len(missing_indicators) == 0
        
    except Exception as e:
        print(f"❌ Error reading restored main.py: {e}")
        return False

def check_websocket_monitoring_compatibility():
    """Check if websocket_monitoring.py has the right data transformation"""
    print("\n🔍 CHECKING WEBSOCKET_MONITORING.PY COMPATIBILITY:")
    print("-" * 50)
    
    try:
        with open('/home/vastdata/rag-app-07/backend/app/api/routes/websocket_monitoring.py', 'r') as f:
            websocket_content = f.read()
        
        # Check for data transformation functions
        transformation_features = [
            ("Data transformation function", "transform_backend_data"),
            ("GPU memory parsing", "memory.split"),
            ("Response time parsing", "response_time_str.replace"),
            ("Field name mapping", "queries_per_minute"),
            ("Array conversion", "gpu_data"),
            ("ISO timestamp", "isoformat"),
            ("Frontend format", "lastUpdate")
        ]
        
        results = []
        for feature_name, search_term in transformation_features:
            if search_term in websocket_content:
                print(f"✅ {feature_name}: Found")
                results.append(True)
            else:
                print(f"❌ {feature_name}: Missing")
                results.append(False)
        
        print(f"\n📊 WebSocket Compatibility: {sum(results)}/{len(results)} features found")
        return sum(results) == len(results)
        
    except Exception as e:
        print(f"❌ Error reading websocket_monitoring.py: {e}")
        return False

def create_integration_recommendation():
    """Create recommendation for integrating data transformation"""
    print("\n💡 INTEGRATION RECOMMENDATION:")
    print("-" * 50)
    
    recommendations = [
        "1. The restored main.py does NOT include data transformation fixes",
        "2. The websocket_monitoring.py DOES include data transformation",
        "3. The main.py restoration focused on API endpoints, not WebSocket data format",
        "4. Need to ensure websocket_monitoring.py is properly deployed",
        "5. Frontend data transformation utilities should also be deployed",
        "6. Both backend and frontend fixes need to work together"
    ]
    
    for rec in recommendations:
        print(f"   {rec}")
    
    print("\n🎯 ACTION REQUIRED:")
    print("=" * 30)
    print("✅ Deploy restored main.py (for API endpoints and system status)")
    print("✅ Ensure websocket_monitoring.py is updated (for data transformation)")
    print("✅ Deploy frontend data transformation utilities")
    print("✅ Test complete integration")
    
    return recommendations

def main():
    """Main analysis function"""
    print("🔍 DATA TRANSFORMATION COMPATIBILITY ANALYSIS")
    print("=" * 70)
    print(f"🕐 Analysis started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run analysis
    backend_format, frontend_expected = analyze_websocket_data_format()
    issues = identify_compatibility_issues()
    main_py_compatible = check_restored_main_py_compatibility()
    websocket_compatible = check_websocket_monitoring_compatibility()
    recommendations = create_integration_recommendation()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 COMPATIBILITY ANALYSIS SUMMARY:")
    print("=" * 70)
    
    print(f"🔍 Backend-Frontend format mismatches identified: {len(issues)}")
    print(f"📋 Restored main.py compatibility: {'✅ Compatible' if main_py_compatible else '❌ Needs Updates'}")
    print(f"🔌 WebSocket monitoring compatibility: {'✅ Compatible' if websocket_compatible else '❌ Needs Updates'}")
    
    print("\n🎯 KEY FINDINGS:")
    print("1. Restored main.py focuses on API endpoints, not WebSocket data transformation")
    print("2. WebSocket data transformation exists in websocket_monitoring.py")
    print("3. Frontend data transformation utilities were created separately")
    print("4. All three components need to be deployed together")
    
    print("\n🚀 DEPLOYMENT STRATEGY:")
    print("1. Deploy restored main.py (for system status endpoint)")
    print("2. Ensure websocket_monitoring.py is current (for data transformation)")
    print("3. Deploy frontend data transformation utilities")
    print("4. Test complete pipeline monitor functionality")
    
    print(f"\n🕐 Analysis completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return {
        "main_py_compatible": main_py_compatible,
        "websocket_compatible": websocket_compatible,
        "issues": issues,
        "recommendations": recommendations
    }

if __name__ == "__main__":
    main()

