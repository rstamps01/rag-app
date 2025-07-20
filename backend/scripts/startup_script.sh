#!/bin/bash

# RAG Application Startup Script with Cache Initialization
# Fixes the cache-init reboot cycle and dependency issues

set -e  # Exit on any error

# Configuration
COMPOSE_FILE="docker-compose.yml"
CACHE_MARKER="/home/vastdata/rag-app-07/backend/models_cache/.initialization_complete"
LOG_FILE="/tmp/rag-startup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if a service is healthy
check_service_health() {
    local service_name=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    log "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps "$service_name" | grep -q "healthy"; then
            success "$service_name is healthy"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: $service_name not healthy yet, waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to wait for cache initialization
wait_for_cache_init() {
    local max_attempts=60  # 2 minutes max
    local attempt=1
    
    log "Waiting for cache initialization to complete..."
    
    while [ $attempt -le $max_attempts ]; do
        if [ -f "$CACHE_MARKER" ]; then
            success "Cache initialization completed"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            log "Still waiting for cache initialization... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "Cache initialization did not complete within expected time"
    return 1
}

# Function to cleanup previous deployment
cleanup_previous() {
    log "Cleaning up previous deployment..."
    
    # Stop all services
    docker-compose down 2>/dev/null || true
    
    # Remove the cache marker if it exists (force re-initialization)
    if [ "$1" = "--force-reinit" ]; then
        warning "Forcing cache re-initialization..."
        rm -f "$CACHE_MARKER"
    fi
    
    success "Cleanup completed"
}

# Function to start infrastructure services
start_infrastructure() {
    log "Starting infrastructure services (postgres, qdrant)..."
    
    # Start postgres and qdrant
    docker-compose up -d postgres-07 qdrant-07
    
    # Wait for services to be healthy
    check_service_health "postgres-07" 30
    check_service_health "qdrant-07" 30
    
    success "Infrastructure services are ready"
}

# Function to run cache initialization
run_cache_initialization() {
    log "Running cache initialization..."
    
    # Check if cache is already initialized
    if [ -f "$CACHE_MARKER" ]; then
        warning "Cache already initialized, skipping..."
        return 0
    fi
    
    # Run cache initialization
    log "Starting cache-init-07 container..."
    docker-compose --profile cache-init up cache-init-07
    
    # Check exit code
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        success "Cache initialization container completed successfully"
        
        # Wait for the marker file to appear
        wait_for_cache_init
    else
        error "Cache initialization failed with exit code $exit_code"
        return 1
    fi
}

# Function to start application services
start_application() {
    log "Starting application services (backend, frontend)..."
    
    # Start backend and frontend
    docker-compose up -d backend-07 frontend-07
    
    # Wait for backend to be ready
    log "Waiting for backend service to be ready..."
    local attempt=1
    local max_attempts=30
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8000/health >/dev/null 2>&1; then
            success "Backend service is ready"
            break
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            log "Backend not ready yet... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Backend service failed to start within expected time"
        return 1
    fi
    
    # Check frontend
    log "Checking frontend service..."
    sleep 5  # Give frontend a moment to start
    
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        success "Frontend service is ready"
    else
        warning "Frontend service may not be ready yet (this is often normal)"
    fi
    
    success "Application services started"
}

# Function to display status
show_status() {
    log "=== RAG Application Status ==="
    
    echo ""
    log "Service Status:"
    docker-compose ps
    
    echo ""
    log "Service Health:"
    echo "- PostgreSQL: $(curl -s http://localhost:5432 >/dev/null 2>&1 && echo "✓ Ready" || echo "✗ Not ready")"
    echo "- Qdrant: $(curl -s http://localhost:6333/healthz >/dev/null 2>&1 && echo "✓ Ready" || echo "✗ Not ready")"
    echo "- Backend: $(curl -s http://localhost:8000/health >/dev/null 2>&1 && echo "✓ Ready" || echo "✗ Not ready")"
    echo "- Frontend: $(curl -s http://localhost:3000 >/dev/null 2>&1 && echo "✓ Ready" || echo "✗ Not ready")"
    
    echo ""
    log "Cache Status:"
    if [ -f "$CACHE_MARKER" ]; then
        echo "- Cache Initialization: ✓ Complete"
    else
        echo "- Cache Initialization: ✗ Not complete"
    fi
    
    echo ""
    log "Access URLs:"
    echo "- Backend API: http://localhost:8000"
    echo "- Frontend UI: http://localhost:3000"
    echo "- API Documentation: http://localhost:8000/docs"
    echo "- Qdrant Dashboard: http://localhost:6333/dashboard"
    
    echo ""
    success "RAG Application is ready for use!"
}

# Main execution
main() {
    log "=== RAG Application Startup Script ==="
    log "Fixing cache-init reboot cycle and dependency issues"
    
    # Parse command line arguments
    local force_reinit=false
    local skip_cleanup=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force-reinit)
                force_reinit=true
                shift
                ;;
            --skip-cleanup)
                skip_cleanup=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --force-reinit   Force cache re-initialization"
                echo "  --skip-cleanup   Skip cleanup of previous deployment"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Step 1: Cleanup (unless skipped)
    if [ "$skip_cleanup" = false ]; then
        if [ "$force_reinit" = true ]; then
            cleanup_previous --force-reinit
        else
            cleanup_previous
        fi
    fi
    
    # Step 2: Start infrastructure services
    start_infrastructure
    
    # Step 3: Run cache initialization
    run_cache_initialization
    
    # Step 4: Start application services
    start_application
    
    # Step 5: Show final status
    show_status
    
    success "RAG Application startup completed successfully!"
    log "Log file: $LOG_FILE"
}

# Error handling
trap 'error "Script failed at line $LINENO"' ERR

# Run main function
main "$@"

