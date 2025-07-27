#!/usr/bin/env python3
"""
RAG Application Environment Restoration
Restores postgres-07, qdrant-07, and frontend-07 services
"""

import os
import sys
import subprocess
import time
import json

def log_info(message):
    print(f"✅ {message}")

def log_warning(message):
    print(f"⚠️  {message}")

def log_error(message):
    print(f"❌ {message}")

def log_step(message):
    print(f"🔧 {message}")

def run_cmd(command, description="", timeout=60):
    """Run command and return success status"""
    try:
        if isinstance(command, str):
            command = command.split()
        
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout)
        
        if result.returncode == 0:
            if description:
                log_info(f"{description} - Success")
            return True, result.stdout.strip()
        else:
            if description:
                log_warning(f"{description} - Failed")
            return False, result.stderr.strip()
    except Exception as e:
        if description:
            log_error(f"{description} - Error: {e}")
        return False, str(e)

def check_current_status():
    """Check current status of all services"""
    log_step("Checking current service status...")
    
    services = ["backend-07", "postgres-07", "qdrant-07", "frontend-07"]
    status = {}
    
    for service in services:
        success, output = run_cmd(f"docker ps --filter name={service} --format '{{{{.Names}}}} {{{{.Status}}}}'", f"Check {service}")
        if success and output:
            if "Up" in output:
                status[service] = "running"
                log_info(f"{service}: Running")
            else:
                status[service] = "stopped"
                log_warning(f"{service}: Stopped")
        else:
            status[service] = "missing"
            log_error(f"{service}: Not found")
    
    return status

def check_docker_compose_services():
    """Check which services are defined in docker-compose.yml"""
    log_step("Checking docker-compose services...")
    
    success, output = run_cmd("docker-compose config --services", "List services")
    if success:
        services = output.split('\n')
        log_info(f"Services defined: {', '.join(services)}")
        return services
    else:
        log_error("Failed to read docker-compose services")
        return []

def start_postgres():
    """Start and verify PostgreSQL service"""
    log_step("Starting PostgreSQL service...")
    
    # Start postgres-07
    success, output = run_cmd("docker-compose up -d postgres-07", "Start PostgreSQL")
    if not success:
        log_error("Failed to start PostgreSQL:")
        print(output)
        return False
    
    # Wait for PostgreSQL to be ready
    log_info("Waiting for PostgreSQL to be ready...")
    for i in range(30):  # Wait up to 150 seconds
        time.sleep(5)
        
        # Check health
        success, output = run_cmd("docker exec postgres-07 pg_isready -U rag -d rag", "PostgreSQL health check")
        if success:
            log_info(f"✅ PostgreSQL is ready (after {(i+1)*5} seconds)")
            return True
        else:
            print(f"   Waiting for PostgreSQL... ({(i+1)*5}s)")
    
    log_error("PostgreSQL failed to become ready after 150 seconds")
    return False

def start_qdrant():
    """Start and verify Qdrant service"""
    log_step("Starting Qdrant service...")
    
    # Start qdrant-07
    success, output = run_cmd("docker-compose up -d qdrant-07", "Start Qdrant")
    if not success:
        log_error("Failed to start Qdrant:")
        print(output)
        return False
    
    # Wait for Qdrant to be ready
    log_info("Waiting for Qdrant to be ready...")
    for i in range(20):  # Wait up to 100 seconds
        time.sleep(5)
        
        # Check health via HTTP
        success, code = run_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:6333/", "Qdrant health check")
        if success and code == "200":
            log_info(f"✅ Qdrant is ready (after {(i+1)*5} seconds)")
            return True
        else:
            print(f"   Waiting for Qdrant... ({(i+1)*5}s)")
    
    log_error("Qdrant failed to become ready after 100 seconds")
    return False

def verify_backend_connections():
    """Verify backend can connect to databases"""
    log_step("Verifying backend database connections...")
    
    # Test backend health endpoint
    success, code = run_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health", "Backend health check")
    if success and code == "200":
        log_info("✅ Backend health endpoint responding")
    else:
        log_warning("⚠️  Backend health endpoint not responding")
        return False
    
    # Test database connection from backend
    success, output = run_cmd("docker exec backend-07 python -c \"import psycopg2; conn = psycopg2.connect('postgresql://rag:rag@postgres-07:5432/rag'); print('PostgreSQL connection OK'); conn.close()\"", "Test PostgreSQL connection")
    if success:
        log_info("✅ Backend can connect to PostgreSQL")
    else:
        log_warning("⚠️  Backend cannot connect to PostgreSQL")
        print(f"Error: {output}")
    
    # Test Qdrant connection from backend
    success, output = run_cmd("docker exec backend-07 python -c \"import requests; r = requests.get('http://qdrant-07:6333/'); print('Qdrant connection OK' if r.status_code == 200 else 'Qdrant connection failed')\"", "Test Qdrant connection")
    if success:
        log_info("✅ Backend can connect to Qdrant")
        return True
    else:
        log_warning("⚠️  Backend cannot connect to Qdrant")
        print(f"Error: {output}")
        return False

def start_frontend():
    """Start and verify frontend service"""
    log_step("Starting frontend service...")
    
    # Start frontend-07
    success, output = run_cmd("docker-compose up -d frontend-07", "Start frontend")
    if not success:
        log_error("Failed to start frontend:")
        print(output)
        return False
    
    # Wait for frontend to be ready
    log_info("Waiting for frontend to be ready...")
    for i in range(20):  # Wait up to 100 seconds
        time.sleep(5)
        
        # Check health via HTTP
        success, code = run_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/", "Frontend health check")
        if success and code in ["200", "304"]:
            log_info(f"✅ Frontend is ready (after {(i+1)*5} seconds)")
            return True
        else:
            print(f"   Waiting for frontend... ({(i+1)*5}s)")
    
    log_error("Frontend failed to become ready after 100 seconds")
    return False

def test_full_integration():
    """Test full integration between all services"""
    log_step("Testing full integration...")
    
    endpoints_to_test = [
        ("http://localhost:8000/", "Backend API"),
        ("http://localhost:8000/health", "Backend health"),
        ("http://localhost:3000/", "Frontend UI"),
        ("http://localhost:5432", "PostgreSQL", "nc -z localhost 5432"),
        ("http://localhost:6333/", "Qdrant API")
    ]
    
    working = 0
    total = len(endpoints_to_test)
    
    for item in endpoints_to_test:
        if len(item) == 3 and item[2].startswith("nc"):
            # Special case for PostgreSQL port check
            success, output = run_cmd(item[2], f"Test {item[1]}")
            if success:
                log_info(f"✅ {item[1]}: Port accessible")
                working += 1
            else:
                log_warning(f"⚠️  {item[1]}: Port not accessible")
        else:
            # HTTP endpoint test
            url, description = item[0], item[1]
            success, code = run_cmd(f"curl -s -o /dev/null -w '%{{http_code}}' {url}", f"Test {description}")
            if success and code in ["200", "304", "307"]:
                log_info(f"✅ {description}: HTTP {code}")
                working += 1
            else:
                log_warning(f"⚠️  {description}: HTTP {code if success else 'Failed'}")
    
    return working, total

def test_api_functionality():
    """Test actual API functionality"""
    log_step("Testing API functionality...")
    
    # Test a simple query
    test_query = {
        "query": "Test environment restoration",
        "department": "General"
    }
    
    # Create a temporary JSON file for the test
    import json
    with open("/tmp/test_query.json", "w") as f:
        json.dump(test_query, f)
    
    success, output = run_cmd("curl -X POST http://localhost:8000/api/v1/queries/ask -H 'Content-Type: application/json' -d @/tmp/test_query.json", "Test query API")
    
    if success:
        try:
            response = json.loads(output)
            if "response" in response or "answer" in response:
                log_info("✅ Query API is working correctly")
                return True
            else:
                log_warning("⚠️  Query API responded but format unexpected")
                return False
        except json.JSONDecodeError:
            log_warning("⚠️  Query API responded but not valid JSON")
            return False
    else:
        log_warning("⚠️  Query API not responding")
        return False

def show_service_logs():
    """Show recent logs from all services"""
    log_step("Showing recent service logs...")
    
    services = ["postgres-07", "qdrant-07", "frontend-07"]
    
    for service in services:
        print(f"\n📋 {service} logs (last 10 lines):")
        print("-" * 40)
        success, output = run_cmd(f"docker logs {service} --tail=10", f"Get {service} logs")
        if success:
            print(output)
        else:
            print(f"Could not retrieve logs for {service}")
        print("-" * 40)

def show_network_info():
    """Show Docker network information"""
    log_step("Showing network information...")
    
    # Show network details
    success, output = run_cmd("docker network ls", "List networks")
    if success:
        print("\n🌐 Docker Networks:")
        print(output)
    
    # Show containers in the RAG network
    success, output = run_cmd("docker network inspect network-07", "Inspect RAG network")
    if success:
        try:
            network_info = json.loads(output)
            if network_info and len(network_info) > 0:
                containers = network_info[0].get("Containers", {})
                print(f"\n🔗 Containers in network-07:")
                for container_id, info in containers.items():
                    print(f"   {info.get('Name', 'Unknown')}: {info.get('IPv4Address', 'No IP')}")
        except:
            print("Could not parse network information")

def main():
    """Main restoration function"""
    print("🔄 RAG Application Environment Restoration")
    print("Restoring postgres-07, qdrant-07, and frontend-07")
    print("=" * 60)
    
    if not os.path.exists("docker-compose.yml"):
        log_error("docker-compose.yml not found. Run from project root directory.")
        sys.exit(1)
    
    log_info(f"Working directory: {os.getcwd()}")
    
    # Step 1: Check current status
    current_status = check_current_status()
    
    # Step 2: Check docker-compose services
    available_services = check_docker_compose_services()
    
    # Step 3: Start PostgreSQL
    if current_status.get("postgres-07") != "running":
        if not start_postgres():
            log_error("Failed to start PostgreSQL")
            show_service_logs()
            return
    else:
        log_info("PostgreSQL already running")
    
    # Step 4: Start Qdrant
    if current_status.get("qdrant-07") != "running":
        if not start_qdrant():
            log_error("Failed to start Qdrant")
            show_service_logs()
            return
    else:
        log_info("Qdrant already running")
    
    # Step 5: Verify backend connections
    if not verify_backend_connections():
        log_warning("Backend database connections have issues")
    
    # Step 6: Start frontend
    if current_status.get("frontend-07") != "running":
        if not start_frontend():
            log_error("Failed to start frontend")
            show_service_logs()
            return
    else:
        log_info("Frontend already running")
    
    # Step 7: Test full integration
    working, total = test_full_integration()
    
    # Step 8: Test API functionality
    api_working = test_api_functionality()
    
    # Summary
    print("\n" + "=" * 60)
    print("🎉 ENVIRONMENT RESTORATION SUMMARY")
    print("=" * 60)
    
    final_status = check_current_status()
    
    print("📊 Service Status:")
    for service, status in final_status.items():
        status_icon = "✅" if status == "running" else "❌"
        print(f"   {service}: {status} {status_icon}")
    
    print(f"\n📈 Integration Test Results:")
    print(f"   Endpoints working: {working}/{total}")
    print(f"   API functionality: {'✅ Working' if api_working else '❌ Not working'}")
    
    if working == total and api_working:
        print(f"\n🎉 SUCCESS! Full environment restored!")
        print(f"✅ All services are running and connected")
        print(f"✅ Backend, PostgreSQL, Qdrant, and Frontend are operational")
        
        print(f"\n🔗 Access your application:")
        print(f"   Frontend UI: http://localhost:3000")
        print(f"   Backend API: http://localhost:8000")
        print(f"   API Docs: http://localhost:8000/docs")
        print(f"   Health Check: http://localhost:8000/health")
        
        print(f"\n🧪 Test your RAG application:")
        print(f"1. Open http://localhost:3000 in your browser")
        print(f"2. Submit a test query about VAST storage")
        print(f"3. Verify you get AI responses with document citations")
        print(f"4. Check query history is being saved")
        
    elif working > total // 2:
        print(f"\n⚠️  PARTIAL SUCCESS: Most services restored")
        print(f"✅ Core functionality should work")
        print(f"⚠️  Some features may be limited")
        
        print(f"\n🔧 Next steps:")
        print(f"1. Check service logs for any remaining issues")
        print(f"2. Test individual components")
        print(f"3. Restart any problematic services")
        
    else:
        print(f"\n❌ RESTORATION INCOMPLETE")
        print(f"❌ Multiple services are not responding")
        
        print(f"\n🔧 Troubleshooting steps:")
        print(f"1. Check Docker daemon status")
        print(f"2. Verify docker-compose.yml configuration")
        print(f"3. Check available system resources")
        print(f"4. Review service logs below")
        
        show_service_logs()
    
    # Show network information
    show_network_info()

if __name__ == "__main__":
    main()

