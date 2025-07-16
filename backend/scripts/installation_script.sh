#!/bin/bash
# Comprehensive System Inventory Script for Ubuntu 22.04.5 LTS
# Identifies, collects, and summarizes all software, libraries, drivers, and packages
# Author: Manus AI
# Version: 1.0.0

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/system_inventory_$(date +%Y%m%d_%H%M%S)"
SUMMARY_FILE="${OUTPUT_DIR}/system_summary.txt"
DETAILED_FILE="${OUTPUT_DIR}/detailed_inventory.txt"
JSON_FILE="${OUTPUT_DIR}/inventory.json"
CSV_FILE="${OUTPUT_DIR}/packages.csv"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$SUMMARY_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$SUMMARY_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$SUMMARY_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$SUMMARY_FILE"
}

log_section() {
    echo -e "\n${WHITE}=== $1 ===${NC}" | tee -a "$SUMMARY_FILE"
    echo -e "\n=== $1 ===" >> "$DETAILED_FILE"
}

# Function to safely execute commands and capture output
safe_exec() {
    local cmd="$1"
    local description="$2"
    
    if command -v ${cmd%% *} >/dev/null 2>&1; then
        echo "[$description]" >> "$DETAILED_FILE"
        eval "$cmd" >> "$DETAILED_FILE" 2>&1 || echo "Command failed: $cmd" >> "$DETAILED_FILE"
        echo "" >> "$DETAILED_FILE"
    else
        echo "[$description] - Command not found: ${cmd%% *}" >> "$DETAILED_FILE"
    fi
}

# Function to get system information
get_system_info() {
    log_section "SYSTEM INFORMATION"
    
    # Basic system info
    log_info "Collecting basic system information..."
    safe_exec "uname -a" "System Information"
    safe_exec "lsb_release -a" "Distribution Information"
    safe_exec "hostnamectl" "Host Information"
    safe_exec "uptime" "System Uptime"
    safe_exec "whoami" "Current User"
    safe_exec "id" "User ID Information"
    
    # Hardware information
    log_info "Collecting hardware information..."
    safe_exec "lscpu" "CPU Information"
    safe_exec "lsmem" "Memory Information"
    safe_exec "free -h" "Memory Usage"
    safe_exec "df -h" "Disk Usage"
    safe_exec "lsblk" "Block Devices"
    safe_exec "lspci" "PCI Devices"
    safe_exec "lsusb" "USB Devices"
    safe_exec "dmidecode -t system" "System DMI Information"
    safe_exec "dmidecode -t memory" "Memory DMI Information"
    
    # Network information
    log_info "Collecting network information..."
    safe_exec "ip addr show" "Network Interfaces"
    safe_exec "ip route show" "Routing Table"
    safe_exec "ss -tuln" "Network Connections"
    
    log_success "System information collected"
}

# Function to get kernel and driver information
get_kernel_drivers() {
    log_section "KERNEL AND DRIVERS"
    
    log_info "Collecting kernel information..."
    safe_exec "uname -r" "Kernel Version"
    safe_exec "cat /proc/version" "Kernel Build Information"
    safe_exec "lsmod" "Loaded Kernel Modules"
    safe_exec "modinfo nvidia 2>/dev/null || echo 'NVIDIA module not loaded'" "NVIDIA Driver Info"
    safe_exec "dkms status" "DKMS Status"
    
    # GPU drivers
    log_info "Collecting GPU driver information..."
    safe_exec "nvidia-smi" "NVIDIA GPU Information"
    safe_exec "nvidia-settings --version" "NVIDIA Settings Version"
    safe_exec "nvcc --version" "NVIDIA CUDA Compiler"
    safe_exec "cat /proc/driver/nvidia/version" "NVIDIA Driver Version"
    safe_exec "glxinfo | head -20" "OpenGL Information"
    safe_exec "vulkaninfo --summary" "Vulkan Information"
    
    log_success "Kernel and driver information collected"
}

# Function to get package manager information
get_package_managers() {
    log_section "PACKAGE MANAGERS"
    
    # APT packages
    log_info "Collecting APT package information..."
    safe_exec "apt list --installed" "APT Installed Packages"
    safe_exec "apt-cache policy" "APT Repository Information"
    safe_exec "cat /etc/apt/sources.list" "APT Sources List"
    safe_exec "ls -la /etc/apt/sources.list.d/" "APT Additional Sources"
    
    # Snap packages
    log_info "Collecting Snap package information..."
    safe_exec "snap list" "Snap Installed Packages"
    safe_exec "snap version" "Snap Version"
    
    # Flatpak packages
    log_info "Collecting Flatpak package information..."
    safe_exec "flatpak list" "Flatpak Installed Packages"
    safe_exec "flatpak remotes" "Flatpak Remotes"
    
    # AppImage packages
    log_info "Looking for AppImage applications..."
    safe_exec "find /home -name '*.AppImage' 2>/dev/null || echo 'No AppImages found'" "AppImage Applications"
    
    log_success "Package manager information collected"
}

# Function to get programming languages and runtimes
get_programming_languages() {
    log_section "PROGRAMMING LANGUAGES AND RUNTIMES"
    
    # Python
    log_info "Collecting Python information..."
    safe_exec "python3 --version" "Python3 Version"
    safe_exec "python --version" "Python Version"
    safe_exec "pip3 --version" "Pip3 Version"
    safe_exec "pip --version" "Pip Version"
    safe_exec "pip3 list" "Python3 Packages (pip)"
    safe_exec "conda --version" "Conda Version"
    safe_exec "conda list" "Conda Packages"
    safe_exec "pipenv --version" "Pipenv Version"
    safe_exec "poetry --version" "Poetry Version"
    
    # Node.js
    log_info "Collecting Node.js information..."
    safe_exec "node --version" "Node.js Version"
    safe_exec "npm --version" "NPM Version"
    safe_exec "yarn --version" "Yarn Version"
    safe_exec "pnpm --version" "PNPM Version"
    safe_exec "npm list -g --depth=0" "Global NPM Packages"
    safe_exec "yarn global list" "Global Yarn Packages"
    
    # Java
    log_info "Collecting Java information..."
    safe_exec "java --version" "Java Version"
    safe_exec "javac --version" "Java Compiler Version"
    safe_exec "mvn --version" "Maven Version"
    safe_exec "gradle --version" "Gradle Version"
    
    # Go
    log_info "Collecting Go information..."
    safe_exec "go version" "Go Version"
    safe_exec "go env" "Go Environment"
    
    # Rust
    log_info "Collecting Rust information..."
    safe_exec "rustc --version" "Rust Compiler Version"
    safe_exec "cargo --version" "Cargo Version"
    
    # Ruby
    log_info "Collecting Ruby information..."
    safe_exec "ruby --version" "Ruby Version"
    safe_exec "gem --version" "Gem Version"
    safe_exec "bundle --version" "Bundler Version"
    
    # PHP
    log_info "Collecting PHP information..."
    safe_exec "php --version" "PHP Version"
    safe_exec "composer --version" "Composer Version"
    
    # C/C++
    log_info "Collecting C/C++ compiler information..."
    safe_exec "gcc --version" "GCC Version"
    safe_exec "g++ --version" "G++ Version"
    safe_exec "clang --version" "Clang Version"
    safe_exec "make --version" "Make Version"
    safe_exec "cmake --version" "CMake Version"
    
    log_success "Programming language information collected"
}

# Function to get development tools
get_development_tools() {
    log_section "DEVELOPMENT TOOLS"
    
    log_info "Collecting development tool information..."
    safe_exec "git --version" "Git Version"
    safe_exec "docker --version" "Docker Version"
    safe_exec "docker-compose --version" "Docker Compose Version"
    safe_exec "kubectl version --client" "Kubectl Version"
    safe_exec "helm version" "Helm Version"
    safe_exec "terraform --version" "Terraform Version"
    safe_exec "ansible --version" "Ansible Version"
    safe_exec "vagrant --version" "Vagrant Version"
    safe_exec "code --version" "VS Code Version"
    safe_exec "vim --version | head -5" "Vim Version"
    safe_exec "emacs --version" "Emacs Version"
    safe_exec "tmux -V" "Tmux Version"
    safe_exec "screen --version" "Screen Version"
    
    log_success "Development tool information collected"
}

# Function to get database systems
get_databases() {
    log_section "DATABASE SYSTEMS"
    
    log_info "Collecting database information..."
    safe_exec "mysql --version" "MySQL Version"
    safe_exec "psql --version" "PostgreSQL Version"
    safe_exec "mongo --version" "MongoDB Version"
    safe_exec "redis-server --version" "Redis Version"
    safe_exec "sqlite3 --version" "SQLite Version"
    safe_exec "influxd version" "InfluxDB Version"
    safe_exec "elasticsearch --version" "Elasticsearch Version"
    
    log_success "Database information collected"
}

# Function to get web servers and services
get_web_services() {
    log_section "WEB SERVERS AND SERVICES"
    
    log_info "Collecting web server information..."
    safe_exec "apache2 -v" "Apache Version"
    safe_exec "nginx -v" "Nginx Version"
    safe_exec "systemctl list-units --type=service --state=active" "Active Services"
    safe_exec "systemctl list-units --type=service --state=enabled" "Enabled Services"
    
    log_success "Web service information collected"
}

# Function to get system libraries
get_system_libraries() {
    log_section "SYSTEM LIBRARIES"
    
    log_info "Collecting system library information..."
    safe_exec "ldconfig -p | head -50" "System Libraries (first 50)"
    safe_exec "pkg-config --list-all" "PKG-Config Libraries"
    safe_exec "find /usr/lib -name '*.so' | head -50" "Shared Libraries (first 50)"
    safe_exec "ldd --version" "Dynamic Linker Version"
    
    # CUDA libraries
    log_info "Collecting CUDA library information..."
    safe_exec "find /usr/local/cuda* -name '*.so' 2>/dev/null | head -20 || echo 'CUDA libraries not found'" "CUDA Libraries"
    safe_exec "ls -la /usr/local/cuda*/lib64/ 2>/dev/null || echo 'CUDA lib64 not found'" "CUDA lib64 Directory"
    
    log_success "System library information collected"
}

# Function to get container information
get_containers() {
    log_section "CONTAINER INFORMATION"
    
    log_info "Collecting container information..."
    safe_exec "docker images" "Docker Images"
    safe_exec "docker ps -a" "Docker Containers"
    safe_exec "docker volume ls" "Docker Volumes"
    safe_exec "docker network ls" "Docker Networks"
    safe_exec "docker system df" "Docker System Usage"
    safe_exec "podman --version" "Podman Version"
    safe_exec "lxc --version" "LXC Version"
    
    log_success "Container information collected"
}

# Function to get environment variables
get_environment() {
    log_section "ENVIRONMENT VARIABLES"
    
    log_info "Collecting environment information..."
    safe_exec "env | sort" "Environment Variables"
    safe_exec "echo \$PATH | tr ':' '\n'" "PATH Components"
    safe_exec "echo \$LD_LIBRARY_PATH | tr ':' '\n'" "LD_LIBRARY_PATH Components"
    safe_exec "echo \$PYTHONPATH | tr ':' '\n'" "PYTHONPATH Components"
    
    log_success "Environment information collected"
}

# Function to create summary
create_summary() {
    log_section "SYSTEM INVENTORY SUMMARY"
    
    {
        echo "System Inventory Report"
        echo "Generated: $(date)"
        echo "Hostname: $(hostname)"
        echo "User: $(whoami)"
        echo ""
        
        echo "=== SYSTEM OVERVIEW ==="
        echo "OS: $(lsb_release -d | cut -f2)"
        echo "Kernel: $(uname -r)"
        echo "Architecture: $(uname -m)"
        echo "CPU: $(lscpu | grep 'Model name' | cut -d':' -f2 | xargs)"
        echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
        echo ""
        
        echo "=== PACKAGE COUNTS ==="
        echo "APT packages: $(apt list --installed 2>/dev/null | wc -l)"
        echo "Snap packages: $(snap list 2>/dev/null | tail -n +2 | wc -l || echo '0')"
        echo "Flatpak packages: $(flatpak list 2>/dev/null | wc -l || echo '0')"
        echo "Python packages: $(pip3 list 2>/dev/null | wc -l || echo '0')"
        echo "NPM global packages: $(npm list -g --depth=0 2>/dev/null | grep -c '^[├└]' || echo '0')"
        echo ""
        
        echo "=== KEY SOFTWARE VERSIONS ==="
        echo "Python: $(python3 --version 2>/dev/null || echo 'Not installed')"
        echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
        echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
        echo "Git: $(git --version 2>/dev/null || echo 'Not installed')"
        echo "NVIDIA Driver: $(nvidia-smi --query-gpu=driver_version --format=csv,noheader,nounits 2>/dev/null || echo 'Not installed')"
        echo "CUDA: $(nvcc --version 2>/dev/null | grep 'release' | awk '{print $6}' || echo 'Not installed')"
        echo ""
        
        echo "=== GPU INFORMATION ==="
        nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>/dev/null || echo "No NVIDIA GPU detected"
        echo ""
        
        echo "=== ACTIVE SERVICES ==="
        systemctl list-units --type=service --state=active --no-pager | head -10
        echo ""
        
        echo "=== DISK USAGE ==="
        df -h | grep -E '^/dev/'
        echo ""
        
    } >> "$SUMMARY_FILE"
    
    log_success "Summary created"
}

# Function to create CSV export
create_csv_export() {
    log_info "Creating CSV export..."
    
    {
        echo "Category,Name,Version,Description"
        
        # APT packages
        apt list --installed 2>/dev/null | tail -n +2 | while IFS= read -r line; do
            name=$(echo "$line" | cut -d'/' -f1)
            version=$(echo "$line" | grep -o '\[installed[^]]*\]' | sed 's/\[installed,//g' | sed 's/\]//g' | xargs)
            echo "APT,$name,$version,APT Package"
        done
        
        # Python packages
        pip3 list 2>/dev/null | tail -n +3 | while IFS= read -r line; do
            name=$(echo "$line" | awk '{print $1}')
            version=$(echo "$line" | awk '{print $2}')
            echo "Python,$name,$version,Python Package"
        done
        
        # Snap packages
        snap list 2>/dev/null | tail -n +2 | while IFS= read -r line; do
            name=$(echo "$line" | awk '{print $1}')
            version=$(echo "$line" | awk '{print $2}')
            echo "Snap,$name,$version,Snap Package"
        done
        
    } > "$CSV_FILE"
    
    log_success "CSV export created: $CSV_FILE"
}

# Function to create JSON export
create_json_export() {
    log_info "Creating JSON export..."
    
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"hostname\": \"$(hostname)\","
        echo "  \"system\": {"
        echo "    \"os\": \"$(lsb_release -d | cut -f2)\","
        echo "    \"kernel\": \"$(uname -r)\","
        echo "    \"architecture\": \"$(uname -m)\""
        echo "  },"
        echo "  \"hardware\": {"
        echo "    \"cpu\": \"$(lscpu | grep 'Model name' | cut -d':' -f2 | xargs)\","
        echo "    \"memory\": \"$(free -h | grep '^Mem:' | awk '{print $2}')\""
        echo "  },"
        echo "  \"packages\": {"
        echo "    \"apt_count\": $(apt list --installed 2>/dev/null | wc -l),"
        echo "    \"snap_count\": $(snap list 2>/dev/null | tail -n +2 | wc -l || echo '0'),"
        echo "    \"python_count\": $(pip3 list 2>/dev/null | wc -l || echo '0')"
        echo "  },"
        echo "  \"software\": {"
        echo "    \"python\": \"$(python3 --version 2>/dev/null | cut -d' ' -f2 || echo 'Not installed')\","
        echo "    \"nodejs\": \"$(node --version 2>/dev/null | sed 's/v//' || echo 'Not installed')\","
        echo "    \"docker\": \"$(docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//' || echo 'Not installed')\","
        echo "    \"git\": \"$(git --version 2>/dev/null | cut -d' ' -f3 || echo 'Not installed')\""
        echo "  }"
        echo "}"
    } > "$JSON_FILE"
    
    log_success "JSON export created: $JSON_FILE"
}

# Main execution function
main() {
    echo -e "${WHITE}Ubuntu 22.04.5 LTS System Inventory Script${NC}"
    echo -e "${WHITE}===========================================${NC}"
    echo ""
    
    log_info "Starting system inventory collection..."
    log_info "Output directory: $OUTPUT_DIR"
    
    # Initialize files
    echo "System Inventory Report - $(date)" > "$SUMMARY_FILE"
    echo "Detailed System Inventory - $(date)" > "$DETAILED_FILE"
    
    # Collect information
    get_system_info
    get_kernel_drivers
    get_package_managers
    get_programming_languages
    get_development_tools
    get_databases
    get_web_services
    get_system_libraries
    get_containers
    get_environment
    
    # Create reports
    create_summary
    create_csv_export
    create_json_export
    
    echo ""
    log_success "System inventory collection completed!"
    echo ""
    echo -e "${WHITE}Generated files:${NC}"
    echo -e "${GREEN}  Summary:${NC} $SUMMARY_FILE"
    echo -e "${GREEN}  Detailed:${NC} $DETAILED_FILE"
    echo -e "${GREEN}  CSV:${NC} $CSV_FILE"
    echo -e "${GREEN}  JSON:${NC} $JSON_FILE"
    echo ""
    echo -e "${YELLOW}Total files in output directory:${NC} $(ls -1 "$OUTPUT_DIR" | wc -l)"
    echo -e "${YELLOW}Output directory size:${NC} $(du -sh "$OUTPUT_DIR" | cut -f1)"
}

# Check if running as root (optional warning)
if [[ $EUID -eq 0 ]]; then
    log_warning "Running as root. Some user-specific information may not be collected."
fi

# Run main function
main "$@"

