#!/bin/bash

# Selendra SDK Build Script
# This script builds both Rust and TypeScript components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ] && [ ! -f "typescript/package.json" ]; then
    print_error "Please run this script from the selendra-sdk root directory"
    exit 1
fi

print_status "Starting Selendra SDK build process..."

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo is not installed. Please install Rust first."
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    print_success "All dependencies are available"
}

# Build Rust component
build_rust() {
    print_status "Building Rust SDK..."

    cd rust

    # Check if Cargo.toml exists
    if [ ! -f "Cargo.toml" ]; then
        print_error "Cargo.toml not found in rust directory"
        exit 1
    fi

    # Build for release
    cargo build --release --all-features

    if [ $? -eq 0 ]; then
        print_success "Rust SDK built successfully"
    else
        print_error "Rust SDK build failed"
        exit 1
    fi

    cd ..
}

# Build TypeScript component
build_typescript() {
    print_status "Building TypeScript SDK..."

    cd typescript

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in typescript directory"
        exit 1
    fi

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing TypeScript dependencies..."
        npm ci
    fi

    # Build the project
    npm run build

    if [ $? -eq 0 ]; then
        print_success "TypeScript SDK built successfully"
    else
        print_error "TypeScript SDK build failed"
        exit 1
    fi

    cd ..
}

# Main build process
main() {
    echo "========================================"
    echo "    Selendra SDK Build Script"
    echo "========================================"
    echo ""

    check_dependencies
    build_rust
    build_typescript

    echo ""
    print_success "Selendra SDK build completed successfully!"
    echo ""
    echo "Build artifacts:"
    echo "  - Rust: rust/target/release/"
    echo "  - TypeScript: typescript/dist/"
    echo ""
}

# Run the script
main "$@"