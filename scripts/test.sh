#!/bin/bash

# Selendra SDK Test Script
# This script runs tests for both Rust and TypeScript components

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

# Test options
RUN_RUST=true
RUN_TYPESCRIPT=true
COVERAGE=false
INTEGRATION=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rust-only)
            RUN_TYPESCRIPT=false
            shift
            ;;
        --ts-only|--typescript-only)
            RUN_RUST=false
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --integration)
            INTEGRATION=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --rust-only          Run only Rust tests"
            echo "  --ts-only, --typescript-only  Run only TypeScript tests"
            echo "  --coverage           Run tests with coverage"
            echo "  --integration        Run integration tests"
            echo "  --help, -h           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ] && [ ! -f "typescript/package.json" ]; then
    print_error "Please run this script from the selendra-sdk root directory"
    exit 1
fi

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if [ "$RUN_RUST" = true ] && ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo is not installed. Please install Rust first."
        exit 1
    fi

    if [ "$RUN_TYPESCRIPT" = true ] && ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    if [ "$RUN_TYPESCRIPT" = true ] && ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    print_success "All dependencies are available"
}

# Run Rust tests
test_rust() {
    print_status "Running Rust tests..."

    cd rust

    if [ ! -f "Cargo.toml" ]; then
        print_error "Cargo.toml not found in rust directory"
        exit 1
    fi

    local rust_test_args=""
    if [ "$INTEGRATION" = true ]; then
        rust_test_args="--test integration"
    fi

    if [ "$COVERAGE" = true ]; then
        # Install cargo-tarpaulin if not already installed
        if ! command -v cargo-tarpaulin &> /dev/null; then
            print_status "Installing cargo-tarpaulin for coverage..."
            cargo install cargo-tarpaulin
        fi

        print_status "Running Rust tests with coverage..."
        cargo tarpaulin --out Html --output-dir ../coverage/rust $rust_test_args
    else
        print_status "Running Rust tests..."
        cargo test --all-features $rust_test_args
    fi

    if [ $? -eq 0 ]; then
        print_success "Rust tests passed"
    else
        print_error "Rust tests failed"
        exit 1
    fi

    cd ..
}

# Run TypeScript tests
test_typescript() {
    print_status "Running TypeScript tests..."

    cd typescript

    if [ ! -f "package.json" ]; then
        print_error "package.json not found in typescript directory"
        exit 1
    fi

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing TypeScript dependencies..."
        npm ci
    fi

    local test_command="test"
    if [ "$COVERAGE" = true ]; then
        test_command="test:coverage"
    fi

    if [ "$INTEGRATION" = true ]; then
        print_status "Running integration tests..."
        npm run test:integration
    else
        print_status "Running TypeScript tests..."
        npm run $test_command
    fi

    if [ $? -eq 0 ]; then
        print_success "TypeScript tests passed"
    else
        print_error "TypeScript tests failed"
        exit 1
    fi

    cd ..
}

# Main test process
main() {
    echo "========================================"
    echo "    Selendra SDK Test Script"
    echo "========================================"
    echo ""

    print_status "Test configuration:"
    echo "  Rust tests: $RUN_RUST"
    echo "  TypeScript tests: $RUN_TYPESCRIPT"
    echo "  Coverage: $COVERAGE"
    echo "  Integration: $INTEGRATION"
    echo ""

    check_dependencies

    if [ "$RUN_RUST" = true ]; then
        test_rust
    fi

    if [ "$RUN_TYPESCRIPT" = true ]; then
        test_typescript
    fi

    echo ""
    print_success "All tests completed successfully!"
    echo ""

    if [ "$COVERAGE" = true ]; then
        print_status "Coverage reports generated:"
        echo "  - Rust: coverage/rust/tarpaulin-report.html"
        echo "  - TypeScript: typescript/coverage/lcov-report/index.html"
        echo ""
    fi
}

# Run the script
main "$@"