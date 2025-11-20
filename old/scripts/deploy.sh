#!/bin/bash

# Selendra SDK Deploy Script
# This script deploys both Rust and TypeScript packages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RUST_ONLY=false
TYPESCRIPT_ONLY=false
DRY_RUN=false
SKIP_TESTS=false

# Version handling
if [ -n "$VERSION" ]; then
    NEW_VERSION="$VERSION"
else
    # Try to get version from package.json if not set
    if [ -f "typescript/package.json" ]; then
        NEW_VERSION=$(node -p "require('./typescript/package.json').version")
    else
        NEW_VERSION="0.1.0"
    fi
fi

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

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rust-only)
            RUST_ONLY=true
            shift
            ;;
        --ts-only|--typescript-only)
            TYPESCRIPT_ONLY=true
            shift
            ;;
        --version|-v)
            NEW_VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --rust-only          Deploy only Rust package"
            echo "  --ts-only, --typescript-only  Deploy only TypeScript package"
            echo "  --version, -v <version>  Set version for deployment"
            echo "  --dry-run            Show what would be deployed without actually deploying"
            echo "  --skip-tests         Skip running tests before deployment"
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

# Validate configuration
if [ "$RUST_ONLY" = true ] && [ "$TYPESCRIPT_ONLY" = true ]; then
    print_error "Cannot specify both --rust-only and --ts-only"
    exit 1
fi

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if [ "$RUST_ONLY" = false ] && [ "$TYPESCRIPT_ONLY" = false ]; then
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
    elif [ "$RUST_ONLY" = true ]; then
        if ! command -v cargo &> /dev/null; then
            print_error "Rust/Cargo is not installed. Please install Rust first."
            exit 1
        fi
    elif [ "$TYPESCRIPT_ONLY" = true ]; then
        if ! command -v node &> /dev/null; then
            print_error "Node.js is not installed. Please install Node.js first."
            exit 1
        fi

        if ! command -v npm &> /dev/null; then
            print_error "npm is not installed. Please install npm first."
            exit 1
        fi
    fi

    # Check for authentication tokens if not dry run
    if [ "$DRY_RUN" = false ]; then
        if [ "$RUST_ONLY" = false ] || [ "$TYPESCRIPT_ONLY" = false ]; then
            if [ -z "$CRATES_IO_TOKEN" ] && [ "$TYPESCRIPT_ONLY" = false ]; then
                print_warning "CRATES_IO_TOKEN not set. Rust deployment may fail."
            fi

            if [ -z "$NPM_TOKEN" ] && [ "$RUST_ONLY" = false ]; then
                print_warning "NPM_TOKEN not set. TypeScript deployment may fail."
            fi
        fi
    fi

    print_success "All dependencies are available"
}

# Update versions
update_versions() {
    print_status "Updating version to $NEW_VERSION..."

    # Update Rust Cargo.toml
    if [ "$TYPESCRIPT_ONLY" = false ]; then
        if [ -f "rust/Cargo.toml" ]; then
            sed -i.bak "s/^version = .*/version = \"$NEW_VERSION\"/" rust/Cargo.toml
            print_success "Updated Rust version to $NEW_VERSION"
        fi
    fi

    # Update TypeScript package.json
    if [ "$RUST_ONLY" = false ]; then
        if [ -f "typescript/package.json" ]; then
            npm version --no-git-tag-version "$NEW_VERSION" --prefix typescript
            print_success "Updated TypeScript version to $NEW_VERSION"
        fi
    fi
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = false ]; then
        print_status "Running tests before deployment..."

        if [ "$TYPESCRIPT_ONLY" = false ]; then
            cd rust && cargo test --all-features && cd ..
        fi

        if [ "$RUST_ONLY" = false ]; then
            cd typescript && npm test && cd ..
        fi

        print_success "All tests passed"
    else
        print_warning "Skipping tests as requested"
    fi
}

# Deploy Rust package
deploy_rust() {
    print_status "Deploying Rust package..."

    cd rust

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would publish Rust package version $NEW_VERSION"
        print_warning "Run: cargo publish --all-features"
    else
        if [ -n "$CRATES_IO_TOKEN" ]; then
            cargo login "$CRATES_IO_TOKEN"
        fi

        cargo publish --all-features
        print_success "Rust package deployed successfully"
    fi

    cd ..
}

# Deploy TypeScript package
deploy_typescript() {
    print_status "Deploying TypeScript package..."

    cd typescript

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would publish TypeScript package version $NEW_VERSION"
        print_warning "Run: npm publish"
    else
        if [ -n "$NPM_TOKEN" ]; then
            npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"
        fi

        npm publish
        print_success "TypeScript package deployed successfully"
    fi

    cd ..
}

# Create git tag
create_git_tag() {
    if [ "$DRY_RUN" = false ]; then
        print_status "Creating git tag v$NEW_VERSION..."
        git add -A
        git commit -m "Release v$NEW_VERSION" || true
        git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
        git push origin "v$NEW_VERSION"
        print_success "Git tag v$NEW_VERSION created and pushed"
    else
        print_warning "DRY RUN: Would create git tag v$NEW_VERSION"
    fi
}

# Main deployment process
main() {
    echo "========================================"
    echo "    Selendra SDK Deploy Script"
    echo "========================================"
    echo ""

    print_status "Deployment configuration:"
    echo "  Version: $NEW_VERSION"
    echo "  Rust only: $RUST_ONLY"
    echo "  TypeScript only: $TYPESCRIPT_ONLY"
    echo "  Dry run: $DRY_RUN"
    echo "  Skip tests: $SKIP_TESTS"
    echo ""

    check_dependencies
    update_versions

    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi

    if [ "$TYPESCRIPT_ONLY" = false ]; then
        deploy_rust
    fi

    if [ "$RUST_ONLY" = false ]; then
        deploy_typescript
    fi

    create_git_tag

    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    echo "Deployed packages:"

    if [ "$TYPESCRIPT_ONLY" = false ]; then
        echo "  - Rust: selendra-sdk v$NEW_VERSION (crates.io)"
    fi

    if [ "$RUST_ONLY" = false ]; then
        echo "  - TypeScript: @selendrajs/sdk v$NEW_VERSION (npm)"
    fi

    echo ""
}

# Run the script
main "$@"