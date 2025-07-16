#!/bin/bash
# System Comparison Tool
# Compare two system inventory reports to identify differences
# Author: Manus AI
# Version: 1.0.0

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPARISON_DIR="${SCRIPT_DIR}/system_comparison_$(date +%Y%m%d_%H%M%S)"

# Create output directory
mkdir -p "$COMPARISON_DIR"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to extract package information from inventory
extract_packages() {
    local inventory_file="$1"
    local output_file="$2"
    local package_type="$3"
    
    case "$package_type" in
        "apt")
            grep -A 1000 "=== APT Installed Packages ===" "$inventory_file" | \
            grep -B 1000 "=== " | head -n -1 | \
            grep -E "^[a-zA-Z0-9]" | \
            cut -d'/' -f1 | sort > "$output_file"
            ;;
        "pip")
            grep -A 1000 "=== Python3 Packages (pip) ===" "$inventory_file" | \
            grep -B 1000 "=== " | head -n -1 | \
            grep -E "^[a-zA-Z0-9]" | \
            awk '{print $1}' | sort > "$output_file"
            ;;
        "snap")
            grep -A 1000 "=== Snap Installed Packages ===" "$inventory_file" | \
            grep -B 1000 "=== " | head -n -1 | \
            grep -E "^[a-zA-Z0-9]" | \
            awk '{print $1}' | sort > "$output_file"
            ;;
    esac
}

# Function to compare package lists
compare_packages() {
    local file1="$1"
    local file2="$2"
    local package_type="$3"
    local output_file="$4"
    
    {
        echo "=== $package_type PACKAGE COMPARISON ==="
        echo "Generated: $(date)"
        echo ""
        
        echo "Packages only in first system:"
        comm -23 "$file1" "$file2" | while read -r pkg; do
            echo "  - $pkg"
        done
        echo ""
        
        echo "Packages only in second system:"
        comm -13 "$file1" "$file2" | while read -r pkg; do
            echo "  + $pkg"
        done
        echo ""
        
        echo "Common packages:"
        comm -12 "$file1" "$file2" | wc -l
        echo ""
        
        echo "Summary:"
        echo "  First system total: $(wc -l < "$file1")"
        echo "  Second system total: $(wc -l < "$file2")"
        echo "  Common packages: $(comm -12 "$file1" "$file2" | wc -l)"
        echo "  Unique to first: $(comm -23 "$file1" "$file2" | wc -l)"
        echo "  Unique to second: $(comm -13 "$file1" "$file2" | wc -l)"
        echo ""
        
    } >> "$output_file"
}

# Function to compare system information
compare_system_info() {
    local file1="$1"
    local file2="$2"
    local output_file="$3"
    
    {
        echo "=== SYSTEM INFORMATION COMPARISON ==="
        echo "Generated: $(date)"
        echo ""
        
        echo "=== Operating System ==="
        echo "First system:"
        grep -A 5 "=== Distribution Information ===" "$file1" | grep -E "(Description|Release)" || echo "  Not found"
        echo ""
        echo "Second system:"
        grep -A 5 "=== Distribution Information ===" "$file2" | grep -E "(Description|Release)" || echo "  Not found"
        echo ""
        
        echo "=== Kernel Version ==="
        echo "First system:"
        grep -A 2 "=== System Information ===" "$file1" | grep "Linux" | awk '{print $3}' || echo "  Not found"
        echo ""
        echo "Second system:"
        grep -A 2 "=== System Information ===" "$file2" | grep "Linux" | awk '{print $3}' || echo "  Not found"
        echo ""
        
        echo "=== CPU Information ==="
        echo "First system:"
        grep -A 20 "=== CPU Information ===" "$file1" | grep "Model name" || echo "  Not found"
        echo ""
        echo "Second system:"
        grep -A 20 "=== CPU Information ===" "$file2" | grep "Model name" || echo "  Not found"
        echo ""
        
        echo "=== Memory Information ==="
        echo "First system:"
        grep -A 10 "=== Memory Usage ===" "$file1" | grep "Mem:" || echo "  Not found"
        echo ""
        echo "Second system:"
        grep -A 10 "=== Memory Usage ===" "$file2" | grep "Mem:" || echo "  Not found"
        echo ""
        
    } > "$output_file"
}

# Function to compare software versions
compare_software_versions() {
    local file1="$1"
    local file2="$2"
    local output_file="$3"
    
    {
        echo "=== SOFTWARE VERSION COMPARISON ==="
        echo "Generated: $(date)"
        echo ""
        
        # Extract and compare key software versions
        local software_list=("Python3 Version" "Node.js Version" "Docker Version" "Git Version" "NVIDIA GPU Information")
        
        for software in "${software_list[@]}"; do
            echo "=== $software ==="
            echo "First system:"
            grep -A 3 "=== $software ===" "$file1" | tail -n +2 | head -1 || echo "  Not found"
            echo ""
            echo "Second system:"
            grep -A 3 "=== $software ===" "$file2" | tail -n +2 | head -1 || echo "  Not found"
            echo ""
        done
        
    } >> "$output_file"
}

# Function to generate HTML comparison report
generate_html_comparison() {
    local comparison_file="$1"
    local html_file="$2"
    
    cat > "$html_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Comparison Report</title>
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
            border-bottom: 3px solid #e74c3c;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            border-left: 4px solid #e74c3c;
            padding-left: 15px;
            margin-top: 30px;
        }
        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .system-card {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .system-card.system1 {
            border-left-color: #3498db;
        }
        .system-card.system2 {
            border-left-color: #e74c3c;
        }
        .diff-added {
            background-color: #d5f4e6;
            color: #27ae60;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .diff-removed {
            background-color: #ffeaa7;
            color: #e17055;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .diff-common {
            background-color: #e8f4f8;
            color: #2d3436;
            padding: 2px 5px;
            border-radius: 3px;
        }
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
            background-color: #34495e;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
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
        <h1>System Comparison Report</h1>
        <div class="timestamp">Generated: TIMESTAMP_PLACEHOLDER</div>
        
        <h2>Comparison Summary</h2>
        <div class="comparison-grid">
            <div class="system-card system1">
                <h4>System 1</h4>
                <p>SYSTEM1_INFO_PLACEHOLDER</p>
            </div>
            <div class="system-card system2">
                <h4>System 2</h4>
                <p>SYSTEM2_INFO_PLACEHOLDER</p>
            </div>
        </div>
        
        <h2>Package Differences</h2>
        <table>
            <tr>
                <th>Package Type</th>
                <th>System 1 Count</th>
                <th>System 2 Count</th>
                <th>Common</th>
                <th>Unique to System 1</th>
                <th>Unique to System 2</th>
            </tr>
            <tr>
                <td>APT Packages</td>
                <td>APT_COUNT1_PLACEHOLDER</td>
                <td>APT_COUNT2_PLACEHOLDER</td>
                <td>APT_COMMON_PLACEHOLDER</td>
                <td>APT_UNIQUE1_PLACEHOLDER</td>
                <td>APT_UNIQUE2_PLACEHOLDER</td>
            </tr>
            <tr>
                <td>Python Packages</td>
                <td>PIP_COUNT1_PLACEHOLDER</td>
                <td>PIP_COUNT2_PLACEHOLDER</td>
                <td>PIP_COMMON_PLACEHOLDER</td>
                <td>PIP_UNIQUE1_PLACEHOLDER</td>
                <td>PIP_UNIQUE2_PLACEHOLDER</td>
            </tr>
        </table>
        
        <h2>Software Version Differences</h2>
        <div id="version-differences">
            VERSION_DIFF_PLACEHOLDER
        </div>
        
        <div class="timestamp">
            Comparison generated by System Comparison Tool v1.0.0
        </div>
    </div>
</body>
</html>
EOF

    # Replace placeholders with actual data
    sed -i "s/TIMESTAMP_PLACEHOLDER/$(date)/" "$html_file"
    
    log_success "HTML comparison report created: $html_file"
}

# Main comparison function
compare_systems() {
    local file1="$1"
    local file2="$2"
    
    if [[ ! -f "$file1" ]]; then
        log_error "First inventory file not found: $file1"
        return 1
    fi
    
    if [[ ! -f "$file2" ]]; then
        log_error "Second inventory file not found: $file2"
        return 1
    fi
    
    log_info "Comparing system inventories..."
    log_info "First system: $file1"
    log_info "Second system: $file2"
    log_info "Output directory: $COMPARISON_DIR"
    
    # Create temporary files for package lists
    local temp_dir=$(mktemp -d)
    local apt1="$temp_dir/apt1.txt"
    local apt2="$temp_dir/apt2.txt"
    local pip1="$temp_dir/pip1.txt"
    local pip2="$temp_dir/pip2.txt"
    local snap1="$temp_dir/snap1.txt"
    local snap2="$temp_dir/snap2.txt"
    
    # Extract package information
    log_info "Extracting package information..."
    extract_packages "$file1" "$apt1" "apt"
    extract_packages "$file2" "$apt2" "apt"
    extract_packages "$file1" "$pip1" "pip"
    extract_packages "$file2" "$pip2" "pip"
    extract_packages "$file1" "$snap1" "snap"
    extract_packages "$file2" "$snap2" "snap"
    
    # Create comparison reports
    local comparison_report="$COMPARISON_DIR/comparison_report.txt"
    local system_comparison="$COMPARISON_DIR/system_comparison.txt"
    local version_comparison="$COMPARISON_DIR/version_comparison.txt"
    local html_report="$COMPARISON_DIR/comparison_report.html"
    
    # Compare packages
    log_info "Comparing packages..."
    compare_packages "$apt1" "$apt2" "APT" "$comparison_report"
    compare_packages "$pip1" "$pip2" "PYTHON" "$comparison_report"
    compare_packages "$snap1" "$snap2" "SNAP" "$comparison_report"
    
    # Compare system information
    log_info "Comparing system information..."
    compare_system_info "$file1" "$file2" "$system_comparison"
    
    # Compare software versions
    log_info "Comparing software versions..."
    compare_software_versions "$file1" "$file2" "$version_comparison"
    
    # Generate HTML report
    log_info "Generating HTML report..."
    generate_html_comparison "$comparison_report" "$html_report"
    
    # Create summary
    {
        echo "System Comparison Summary"
        echo "========================"
        echo "Generated: $(date)"
        echo ""
        echo "Files compared:"
        echo "  System 1: $file1"
        echo "  System 2: $file2"
        echo ""
        echo "APT Package Differences:"
        echo "  System 1 packages: $(wc -l < "$apt1")"
        echo "  System 2 packages: $(wc -l < "$apt2")"
        echo "  Common packages: $(comm -12 "$apt1" "$apt2" | wc -l)"
        echo "  Unique to System 1: $(comm -23 "$apt1" "$apt2" | wc -l)"
        echo "  Unique to System 2: $(comm -13 "$apt1" "$apt2" | wc -l)"
        echo ""
        echo "Python Package Differences:"
        echo "  System 1 packages: $(wc -l < "$pip1")"
        echo "  System 2 packages: $(wc -l < "$pip2")"
        echo "  Common packages: $(comm -12 "$pip1" "$pip2" | wc -l)"
        echo "  Unique to System 1: $(comm -23 "$pip1" "$pip2" | wc -l)"
        echo "  Unique to System 2: $(comm -13 "$pip1" "$pip2" | wc -l)"
        echo ""
    } > "$COMPARISON_DIR/summary.txt"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "System comparison completed!"
    echo ""
    echo -e "${WHITE}Generated Files:${NC}"
    echo -e "${GREEN}  • Summary: ${COMPARISON_DIR}/summary.txt${NC}"
    echo -e "${GREEN}  • Detailed Report: ${comparison_report}${NC}"
    echo -e "${GREEN}  • System Comparison: ${system_comparison}${NC}"
    echo -e "${GREEN}  • Version Comparison: ${version_comparison}${NC}"
    echo -e "${GREEN}  • HTML Report: ${html_report}${NC}"
}

# Usage function
usage() {
    echo "Usage: $0 <inventory_file_1> <inventory_file_2>"
    echo ""
    echo "Compare two system inventory files generated by system_inventory.sh"
    echo ""
    echo "Arguments:"
    echo "  inventory_file_1    First system inventory file"
    echo "  inventory_file_2    Second system inventory file"
    echo ""
    echo "Example:"
    echo "  $0 system1/detailed_inventory.txt system2/detailed_inventory.txt"
}

# Main execution
if [[ $# -ne 2 ]]; then
    usage
    exit 1
fi

compare_systems "$1" "$2"

