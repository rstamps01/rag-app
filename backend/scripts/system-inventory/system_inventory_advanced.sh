#!/bin/bash
# Advanced System Inventory Script with Enhanced Reporting
# Ubuntu 22.04.5 LTS System Analysis Tool
# Author: Manus AI
# Version: 2.0.0

set -euo pipefail

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="${SCRIPT_DIR}/system_inventory_${TIMESTAMP}"
REPORTS_DIR="${OUTPUT_DIR}/reports"
EXPORTS_DIR="${OUTPUT_DIR}/exports"
LOGS_DIR="${OUTPUT_DIR}/logs"

# File paths
SUMMARY_FILE="${REPORTS_DIR}/executive_summary.md"
DETAILED_FILE="${REPORTS_DIR}/detailed_inventory.txt"
HTML_FILE="${REPORTS_DIR}/inventory_report.html"
JSON_FILE="${EXPORTS_DIR}/inventory.json"
CSV_FILE="${EXPORTS_DIR}/packages.csv"
XML_FILE="${EXPORTS_DIR}/inventory.xml"
SECURITY_FILE="${REPORTS_DIR}/security_analysis.txt"
PERFORMANCE_FILE="${REPORTS_DIR}/performance_analysis.txt"

# Create directory structure
mkdir -p "$OUTPUT_DIR" "$REPORTS_DIR" "$EXPORTS_DIR" "$LOGS_DIR"

# Logging functions
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${LOGS_DIR}/inventory.log"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log_with_timestamp "INFO: $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log_with_timestamp "SUCCESS: $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log_with_timestamp "WARNING: $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_with_timestamp "ERROR: $1"
}

log_section() {
    echo -e "\n${WHITE}${BOLD}=== $1 ===${NC}"
    log_with_timestamp "SECTION: $1"
}

# Progress indicator
show_progress() {
    local current=$1
    local total=$2
    local description=$3
    local percentage=$((current * 100 / total))
    local bar_length=50
    local filled_length=$((percentage * bar_length / 100))
    
    printf "\r${CYAN}Progress:${NC} ["
    printf "%*s" $filled_length | tr ' ' '='
    printf "%*s" $((bar_length - filled_length)) | tr ' ' '-'
    printf "] %d%% - %s" $percentage "$description"
}

# Enhanced command execution with error handling
execute_command() {
    local cmd="$1"
    local description="$2"
    local output_file="$3"
    local timeout="${4:-30}"
    
    log_with_timestamp "Executing: $cmd"
    
    if command -v ${cmd%% *} >/dev/null 2>&1; then
        echo "=== $description ===" >> "$output_file"
        echo "Command: $cmd" >> "$output_file"
        echo "Timestamp: $(date)" >> "$output_file"
        echo "" >> "$output_file"
        
        if timeout "$timeout" bash -c "$cmd" >> "$output_file" 2>&1; then
            echo "Status: SUCCESS" >> "$output_file"
            log_with_timestamp "SUCCESS: $description"
        else
            echo "Status: FAILED or TIMEOUT" >> "$output_file"
            log_with_timestamp "FAILED: $description"
        fi
        echo "" >> "$output_file"
    else
        echo "=== $description ===" >> "$output_file"
        echo "Status: COMMAND NOT FOUND (${cmd%% *})" >> "$output_file"
        echo "" >> "$output_file"
        log_with_timestamp "NOT FOUND: ${cmd%% *}"
    fi
}

# System health analysis
analyze_system_health() {
    log_section "SYSTEM HEALTH ANALYSIS"
    
    local health_file="${REPORTS_DIR}/system_health.txt"
    
    {
        echo "System Health Analysis Report"
        echo "Generated: $(date)"
        echo "==============================="
        echo ""
        
        # CPU usage
        echo "=== CPU ANALYSIS ==="
        echo "Current CPU usage:"
        top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}'
        echo ""
        echo "Load averages:"
        uptime | awk -F'load average:' '{print $2}'
        echo ""
        
        # Memory analysis
        echo "=== MEMORY ANALYSIS ==="
        free -h
        echo ""
        echo "Memory usage percentage:"
        free | grep Mem | awk '{printf "%.2f%%\n", $3/$2 * 100.0}'
        echo ""
        
        # Disk analysis
        echo "=== DISK ANALYSIS ==="
        df -h | grep -vE '^Filesystem|tmpfs|cdrom'
        echo ""
        echo "Disk usage warnings (>80%):"
        df -h | awk '$5 > 80 {print $0}'
        echo ""
        
        # Process analysis
        echo "=== TOP PROCESSES ==="
        echo "By CPU usage:"
        ps aux --sort=-%cpu | head -10
        echo ""
        echo "By memory usage:"
        ps aux --sort=-%mem | head -10
        echo ""
        
        # Network analysis
        echo "=== NETWORK ANALYSIS ==="
        echo "Active connections:"
        ss -tuln | wc -l
        echo ""
        echo "Listening services:"
        ss -tuln | grep LISTEN
        echo ""
        
    } > "$health_file"
    
    log_success "System health analysis completed: $health_file"
}

# Security analysis
analyze_security() {
    log_section "SECURITY ANALYSIS"
    
    {
        echo "Security Analysis Report"
        echo "Generated: $(date)"
        echo "======================="
        echo ""
        
        # User accounts
        echo "=== USER ACCOUNTS ==="
        echo "Total users: $(cat /etc/passwd | wc -l)"
        echo "Users with shell access:"
        grep -E '/bin/(bash|sh|zsh|fish)$' /etc/passwd | cut -d: -f1
        echo ""
        echo "Users with sudo privileges:"
        grep -E '^sudo:' /etc/group | cut -d: -f4 | tr ',' '\n'
        echo ""
        
        # SSH configuration
        echo "=== SSH CONFIGURATION ==="
        if [ -f /etc/ssh/sshd_config ]; then
            echo "SSH service status:"
            systemctl is-active ssh 2>/dev/null || echo "SSH service not found"
            echo ""
            echo "Key SSH settings:"
            grep -E '^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)' /etc/ssh/sshd_config 2>/dev/null || echo "SSH config not accessible"
        else
            echo "SSH not configured"
        fi
        echo ""
        
        # Firewall status
        echo "=== FIREWALL STATUS ==="
        ufw status 2>/dev/null || echo "UFW not available"
        echo ""
        iptables -L 2>/dev/null | head -20 || echo "iptables not accessible"
        echo ""
        
        # Package updates
        echo "=== PACKAGE UPDATES ==="
        echo "Available updates:"
        apt list --upgradable 2>/dev/null | wc -l
        echo ""
        echo "Security updates:"
        apt list --upgradable 2>/dev/null | grep -i security | wc -l
        echo ""
        
        # File permissions
        echo "=== CRITICAL FILE PERMISSIONS ==="
        echo "/etc/passwd permissions:"
        ls -l /etc/passwd
        echo "/etc/shadow permissions:"
        ls -l /etc/shadow 2>/dev/null || echo "Cannot access /etc/shadow"
        echo ""
        
    } > "$SECURITY_FILE"
    
    log_success "Security analysis completed: $SECURITY_FILE"
}

# Performance analysis
analyze_performance() {
    log_section "PERFORMANCE ANALYSIS"
    
    {
        echo "Performance Analysis Report"
        echo "Generated: $(date)"
        echo "=========================="
        echo ""
        
        # System specifications
        echo "=== SYSTEM SPECIFICATIONS ==="
        echo "CPU cores: $(nproc)"
        echo "CPU model: $(lscpu | grep 'Model name' | cut -d':' -f2 | xargs)"
        echo "CPU frequency: $(lscpu | grep 'CPU MHz' | cut -d':' -f2 | xargs) MHz"
        echo "Total memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
        echo "Available memory: $(free -h | grep '^Mem:' | awk '{print $7}')"
        echo ""
        
        # GPU information
        echo "=== GPU INFORMATION ==="
        if command -v nvidia-smi >/dev/null 2>&1; then
            nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,utilization.memory,temperature.gpu --format=csv
        else
            echo "NVIDIA GPU not detected"
        fi
        echo ""
        
        # Storage performance
        echo "=== STORAGE PERFORMANCE ==="
        echo "Mounted filesystems:"
        mount | grep -E '^/dev/' | awk '{print $1, $3, $5}'
        echo ""
        echo "I/O statistics:"
        iostat 2>/dev/null | head -20 || echo "iostat not available"
        echo ""
        
        # Network performance
        echo "=== NETWORK PERFORMANCE ==="
        echo "Network interfaces:"
        ip link show | grep -E '^[0-9]+:' | awk '{print $2}' | sed 's/://'
        echo ""
        echo "Network statistics:"
        cat /proc/net/dev | head -10
        echo ""
        
        # System load
        echo "=== SYSTEM LOAD ==="
        echo "Current load average:"
        uptime
        echo ""
        echo "CPU usage over time (last 5 samples):"
        for i in {1..5}; do
            echo "Sample $i: $(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')%"
            sleep 1
        done
        echo ""
        
    } > "$PERFORMANCE_FILE"
    
    log_success "Performance analysis completed: $PERFORMANCE_FILE"
}

# Create HTML report
create_html_report() {
    log_section "CREATING HTML REPORT"
    
    cat > "$HTML_FILE" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Inventory Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            border-left: 4px solid #3498db;
            padding-left: 15px;
            margin-top: 30px;
        }
        h3 {
            color: #7f8c8d;
            margin-top: 20px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .info-card {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .info-card h4 {
            margin-top: 0;
            color: #2c3e50;
        }
        .status-good { color: #27ae60; font-weight: bold; }
        .status-warning { color: #f39c12; font-weight: bold; }
        .status-error { color: #e74c3c; font-weight: bold; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #bdc3c7;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .code-block {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
            margin: 10px 0;
        }
        .timestamp {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>System Inventory Report</h1>
        <div class="timestamp">Generated: TIMESTAMP_PLACEHOLDER</div>
        
        <h2>System Overview</h2>
        <div class="info-grid">
            <div class="info-card">
                <h4>Operating System</h4>
                <p>OS_INFO_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>Hardware</h4>
                <p>HARDWARE_INFO_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>Network</h4>
                <p>NETWORK_INFO_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>Storage</h4>
                <p>STORAGE_INFO_PLACEHOLDER</p>
            </div>
        </div>
        
        <h2>Package Summary</h2>
        <table>
            <tr>
                <th>Package Manager</th>
                <th>Installed Packages</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>APT</td>
                <td>APT_COUNT_PLACEHOLDER</td>
                <td><span class="status-good">Active</span></td>
            </tr>
            <tr>
                <td>Snap</td>
                <td>SNAP_COUNT_PLACEHOLDER</td>
                <td>SNAP_STATUS_PLACEHOLDER</td>
            </tr>
            <tr>
                <td>Python (pip)</td>
                <td>PIP_COUNT_PLACEHOLDER</td>
                <td>PIP_STATUS_PLACEHOLDER</td>
            </tr>
            <tr>
                <td>Node.js (npm)</td>
                <td>NPM_COUNT_PLACEHOLDER</td>
                <td>NPM_STATUS_PLACEHOLDER</td>
            </tr>
        </table>
        
        <h2>Key Software Versions</h2>
        <div class="code-block">
SOFTWARE_VERSIONS_PLACEHOLDER
        </div>
        
        <h2>System Health</h2>
        <div class="info-grid">
            <div class="info-card">
                <h4>CPU Usage</h4>
                <p>CPU_USAGE_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>Memory Usage</h4>
                <p>MEMORY_USAGE_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>Disk Usage</h4>
                <p>DISK_USAGE_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>System Load</h4>
                <p>LOAD_AVERAGE_PLACEHOLDER</p>
            </div>
        </div>
        
        <h2>Security Status</h2>
        <div class="info-grid">
            <div class="info-card">
                <h4>Firewall</h4>
                <p>FIREWALL_STATUS_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>SSH</h4>
                <p>SSH_STATUS_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>Updates</h4>
                <p>UPDATES_STATUS_PLACEHOLDER</p>
            </div>
            <div class="info-card">
                <h4>Users</h4>
                <p>USER_COUNT_PLACEHOLDER</p>
            </div>
        </div>
        
        <div class="timestamp">
            Report generated by System Inventory Script v2.0.0<br>
            For detailed information, see the accompanying text files.
        </div>
    </div>
</body>
</html>
EOF

    # Replace placeholders with actual data
    sed -i "s/TIMESTAMP_PLACEHOLDER/$(date)/" "$HTML_FILE"
    sed -i "s/OS_INFO_PLACEHOLDER/$(lsb_release -d | cut -f2)/" "$HTML_FILE"
    sed -i "s/HARDWARE_INFO_PLACEHOLDER/$(lscpu | grep 'Model name' | cut -d':' -f2 | xargs)/" "$HTML_FILE"
    sed -i "s/APT_COUNT_PLACEHOLDER/$(apt list --installed 2>/dev/null | wc -l)/" "$HTML_FILE"
    
    log_success "HTML report created: $HTML_FILE"
}

# Create XML export
create_xml_export() {
    log_section "CREATING XML EXPORT"
    
    cat > "$XML_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<system_inventory>
    <metadata>
        <timestamp>$(date -Iseconds)</timestamp>
        <hostname>$(hostname)</hostname>
        <generator>System Inventory Script v2.0.0</generator>
    </metadata>
    <system>
        <os>$(lsb_release -d | cut -f2)</os>
        <kernel>$(uname -r)</kernel>
        <architecture>$(uname -m)</architecture>
        <uptime>$(uptime -p)</uptime>
    </system>
    <hardware>
        <cpu>$(lscpu | grep 'Model name' | cut -d':' -f2 | xargs)</cpu>
        <cores>$(nproc)</cores>
        <memory>$(free -h | grep '^Mem:' | awk '{print $2}')</memory>
    </hardware>
    <packages>
        <apt_packages>$(apt list --installed 2>/dev/null | wc -l)</apt_packages>
        <snap_packages>$(snap list 2>/dev/null | tail -n +2 | wc -l || echo '0')</snap_packages>
        <python_packages>$(pip3 list 2>/dev/null | wc -l || echo '0')</python_packages>
    </packages>
    <software>
        <python>$(python3 --version 2>/dev/null | cut -d' ' -f2 || echo 'Not installed')</python>
        <nodejs>$(node --version 2>/dev/null | sed 's/v//' || echo 'Not installed')</nodejs>
        <docker>$(docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//' || echo 'Not installed')</docker>
        <git>$(git --version 2>/dev/null | cut -d' ' -f3 || echo 'Not installed')</git>
    </software>
</system_inventory>
EOF

    log_success "XML export created: $XML_FILE"
}

# Enhanced CSV export with categories
create_enhanced_csv_export() {
    log_section "CREATING ENHANCED CSV EXPORT"
    
    {
        echo "Category,Subcategory,Name,Version,Description,Status,Install_Date"
        
        # System information
        echo "System,OS,$(lsb_release -i | cut -f2),$(lsb_release -r | cut -f2),Operating System,Active,$(stat -c %y /etc/os-release | cut -d' ' -f1)"
        echo "System,Kernel,$(uname -s),$(uname -r),Kernel,Active,$(stat -c %y /boot/vmlinuz-$(uname -r) 2>/dev/null | cut -d' ' -f1 || echo 'Unknown')"
        
        # APT packages with install dates
        if command -v apt >/dev/null 2>&1; then
            apt list --installed 2>/dev/null | tail -n +2 | while IFS= read -r line; do
                name=$(echo "$line" | cut -d'/' -f1)
                version=$(echo "$line" | grep -o '\[installed[^]]*\]' | sed 's/\[installed,//g' | sed 's/\]//g' | xargs)
                install_date=$(stat -c %y "/var/lib/dpkg/info/${name}.list" 2>/dev/null | cut -d' ' -f1 || echo 'Unknown')
                echo "Package,APT,$name,$version,Debian Package,Installed,$install_date"
            done
        fi
        
        # Python packages
        if command -v pip3 >/dev/null 2>&1; then
            pip3 list 2>/dev/null | tail -n +3 | while IFS= read -r line; do
                name=$(echo "$line" | awk '{print $1}')
                version=$(echo "$line" | awk '{print $2}')
                echo "Package,Python,$name,$version,Python Package,Installed,Unknown"
            done
        fi
        
        # Snap packages
        if command -v snap >/dev/null 2>&1; then
            snap list 2>/dev/null | tail -n +2 | while IFS= read -r line; do
                name=$(echo "$line" | awk '{print $1}')
                version=$(echo "$line" | awk '{print $2}')
                install_date=$(echo "$line" | awk '{print $4}')
                echo "Package,Snap,$name,$version,Snap Package,Installed,$install_date"
            done
        fi
        
        # Services
        systemctl list-units --type=service --state=active --no-pager --no-legend 2>/dev/null | while read -r line; do
            name=$(echo "$line" | awk '{print $1}' | sed 's/.service$//')
            status=$(echo "$line" | awk '{print $3}')
            echo "Service,System,$name,Unknown,System Service,$status,Unknown"
        done
        
    } > "$CSV_FILE"
    
    log_success "Enhanced CSV export created: $CSV_FILE"
}

# Main execution with progress tracking
main() {
    echo -e "${WHITE}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           Advanced System Inventory Script v2.0.0           ║"
    echo "║                Ubuntu 22.04.5 LTS Analysis                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Starting comprehensive system inventory..."
    log_info "Output directory: $OUTPUT_DIR"
    
    # Initialize progress tracking
    local total_steps=12
    local current_step=0
    
    # Step 1: Basic system information
    ((current_step++))
    show_progress $current_step $total_steps "Collecting system information"
    execute_command "uname -a" "System Information" "$DETAILED_FILE"
    execute_command "lsb_release -a" "Distribution Information" "$DETAILED_FILE"
    execute_command "hostnamectl" "Host Information" "$DETAILED_FILE"
    
    # Step 2: Hardware information
    ((current_step++))
    show_progress $current_step $total_steps "Analyzing hardware"
    execute_command "lscpu" "CPU Information" "$DETAILED_FILE"
    execute_command "lsmem" "Memory Information" "$DETAILED_FILE"
    execute_command "lspci" "PCI Devices" "$DETAILED_FILE"
    execute_command "lsusb" "USB Devices" "$DETAILED_FILE"
    
    # Step 3: GPU and drivers
    ((current_step++))
    show_progress $current_step $total_steps "Checking GPU and drivers"
    execute_command "nvidia-smi" "NVIDIA GPU Information" "$DETAILED_FILE"
    execute_command "lsmod" "Loaded Kernel Modules" "$DETAILED_FILE"
    
    # Step 4: Package managers
    ((current_step++))
    show_progress $current_step $total_steps "Scanning package managers"
    execute_command "apt list --installed" "APT Packages" "$DETAILED_FILE" 60
    execute_command "snap list" "Snap Packages" "$DETAILED_FILE"
    execute_command "flatpak list" "Flatpak Packages" "$DETAILED_FILE"
    
    # Step 5: Programming languages
    ((current_step++))
    show_progress $current_step $total_steps "Checking programming languages"
    execute_command "python3 --version" "Python3 Version" "$DETAILED_FILE"
    execute_command "pip3 list" "Python3 Packages" "$DETAILED_FILE" 60
    execute_command "node --version" "Node.js Version" "$DETAILED_FILE"
    execute_command "npm list -g --depth=0" "Global NPM Packages" "$DETAILED_FILE"
    
    # Step 6: Development tools
    ((current_step++))
    show_progress $current_step $total_steps "Inventorying development tools"
    execute_command "git --version" "Git Version" "$DETAILED_FILE"
    execute_command "docker --version" "Docker Version" "$DETAILED_FILE"
    execute_command "docker images" "Docker Images" "$DETAILED_FILE"
    
    # Step 7: System services
    ((current_step++))
    show_progress $current_step $total_steps "Analyzing system services"
    execute_command "systemctl list-units --type=service --state=active" "Active Services" "$DETAILED_FILE"
    execute_command "systemctl list-units --type=service --state=enabled" "Enabled Services" "$DETAILED_FILE"
    
    # Step 8: System health analysis
    ((current_step++))
    show_progress $current_step $total_steps "Performing health analysis"
    analyze_system_health
    
    # Step 9: Security analysis
    ((current_step++))
    show_progress $current_step $total_steps "Conducting security analysis"
    analyze_security
    
    # Step 10: Performance analysis
    ((current_step++))
    show_progress $current_step $total_steps "Running performance analysis"
    analyze_performance
    
    # Step 11: Create reports
    ((current_step++))
    show_progress $current_step $total_steps "Generating reports"
    create_html_report
    create_xml_export
    
    # Step 12: Create exports
    ((current_step++))
    show_progress $current_step $total_steps "Creating exports"
    create_enhanced_csv_export
    
    echo -e "\n"
    log_success "Comprehensive system inventory completed!"
    
    # Display summary
    echo -e "\n${WHITE}${BOLD}Generated Files:${NC}"
    echo -e "${GREEN}📊 Reports:${NC}"
    echo -e "  • Executive Summary: ${SUMMARY_FILE}"
    echo -e "  • Detailed Inventory: ${DETAILED_FILE}"
    echo -e "  • HTML Report: ${HTML_FILE}"
    echo -e "  • System Health: ${REPORTS_DIR}/system_health.txt"
    echo -e "  • Security Analysis: ${SECURITY_FILE}"
    echo -e "  • Performance Analysis: ${PERFORMANCE_FILE}"
    
    echo -e "\n${GREEN}📁 Exports:${NC}"
    echo -e "  • JSON: ${JSON_FILE}"
    echo -e "  • CSV: ${CSV_FILE}"
    echo -e "  • XML: ${XML_FILE}"
    
    echo -e "\n${GREEN}📝 Logs:${NC}"
    echo -e "  • Execution Log: ${LOGS_DIR}/inventory.log"
    
    echo -e "\n${YELLOW}📈 Statistics:${NC}"
    echo -e "  • Total files generated: $(find "$OUTPUT_DIR" -type f | wc -l)"
    echo -e "  • Output directory size: $(du -sh "$OUTPUT_DIR" | cut -f1)"
    echo -e "  • Execution time: $(date -d@$(($(date +%s) - $(stat -c %Y "$OUTPUT_DIR"))) -u +%H:%M:%S)"
    
    echo -e "\n${CYAN}💡 Next Steps:${NC}"
    echo -e "  • Open ${HTML_FILE} in your browser for interactive report"
    echo -e "  • Import ${CSV_FILE} into spreadsheet for analysis"
    echo -e "  • Review security recommendations in ${SECURITY_FILE}"
    
    log_success "All tasks completed successfully!"
}

# Error handling
trap 'log_error "Script interrupted"; exit 1' INT TERM

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    for cmd in curl wget jq; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_warning "Optional dependencies missing: ${missing_deps[*]}"
        log_info "Install with: sudo apt install ${missing_deps[*]}"
    fi
}

# Run dependency check and main function
check_dependencies
main "$@"

