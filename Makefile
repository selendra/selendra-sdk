.PHONY: help install clean build test lint format check docs publish docker run-deps

# Default target
.DEFAULT_GOAL := help

# Variables
RUST_DIR = rust
TYPESCRIPT_DIR = typescript
DOCS_DIR = docs
EXAMPLES_DIR = examples

# Colors
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

help: ## Show this help message
	@echo "$(BLUE)Selendra SDK - Development Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@echo "$(YELLOW)Installing Rust dependencies...$(RESET)"
	cd $(RUST_DIR) && cargo fetch
	@echo "$(YELLOW)Installing TypeScript dependencies...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm install
	@echo "$(GREEN)✓ All dependencies installed$(RESET)"

clean: ## Clean all build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	@echo "$(YELLOW)Cleaning Rust...$(RESET)"
	cd $(RUST_DIR) && cargo clean
	@echo "$(YELLOW)Cleaning TypeScript...$(RESET)"
	cd $(TYPESCRIPT_DIR) && rm -rf dist node_modules/.cache
	@echo "$(GREEN)✓ Clean complete$(RESET)"

build: ## Build all projects
	@echo "$(BLUE)Building all projects...$(RESET)"
	$(MAKE) build-rust
	$(MAKE) build-typescript
	@echo "$(GREEN)✓ All builds complete$(RESET)"

build-rust: ## Build Rust project
	@echo "$(YELLOW)Building Rust...$(RESET)"
	cd $(RUST_DIR) && cargo build --release --all-features
	@echo "$(GREEN)✓ Rust build complete$(RESET)"

build-typescript: ## Build TypeScript project
	@echo "$(YELLOW)Building TypeScript...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm run build
	@echo "$(GREEN)✓ TypeScript build complete$(RESET)"

build-dev: ## Build all projects in development mode
	@echo "$(BLUE)Building in development mode...$(RESET)"
	cd $(RUST_DIR) && cargo build --all-features
	cd $(TYPESCRIPT_DIR) && npm run build
	@echo "$(GREEN)✓ Development builds complete$(RESET)"

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(RESET)"
	$(MAKE) test-rust
	$(MAKE) test-typescript
	@echo "$(GREEN)✓ All tests passed$(RESET)"

test-rust: ## Run Rust tests
	@echo "$(YELLOW)Running Rust tests...$(RESET)"
	cd $(RUST_DIR) && cargo test --all-features
	@echo "$(GREEN)✓ Rust tests complete$(RESET)"

test-typescript: ## Run TypeScript tests
	@echo "$(YELLOW)Running TypeScript tests...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm test
	@echo "$(GREEN)✓ TypeScript tests complete$(RESET)"

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm run test:coverage
	cd $(RUST_DIR) && cargo test --all-features --no-run

lint: ## Run all linters
	@echo "$(BLUE)Running all linters...$(RESET)"
	$(MAKE) lint-rust
	$(MAKE) lint-typescript
	@echo "$(GREEN)✓ Linting complete$(RESET)"

lint-rust: ## Run Rust linter
	@echo "$(YELLOW)Running Rust linter...$(RESET)"
	cd $(RUST_DIR) && cargo clippy --all-targets --all-features -- -D warnings
	@echo "$(GREEN)✓ Rust linting complete$(RESET)"

lint-typescript: ## Run TypeScript linter
	@echo "$(YELLOW)Running TypeScript linter...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm run lint
	@echo "$(GREEN)✓ TypeScript linting complete$(RESET)"

format: ## Format all code
	@echo "$(BLUE)Formatting all code...$(RESET)"
	$(MAKE) format-rust
	$(MAKE) format-typescript
	@echo "$(GREEN)✓ Formatting complete$(RESET)"

format-rust: ## Format Rust code
	@echo "$(YELLOW)Formatting Rust code...$(RESET)"
	cd $(RUST_DIR) && cargo fmt
	@echo "$(GREEN)✓ Rust formatting complete$(RESET)"

format-typescript: ## Format TypeScript code
	@echo "$(YELLOW)Formatting TypeScript code...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm run format
	@echo "$(GREEN)✓ TypeScript formatting complete$(RESET)"

check: ## Run all checks (build, test, lint)
	@echo "$(BLUE)Running all checks...$(RESET)"
	$(MAKE) build
	$(MAKE) test
	$(MAKE) lint
	@echo "$(GREEN)✓ All checks passed$(RESET)"

check-format: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(RESET)"
	cd $(RUST_DIR) && cargo fmt --all -- --check
	cd $(TYPESCRIPT_DIR) && npm run format:check
	@echo "$(GREEN)✓ Format check complete$(RESET)"

docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(RESET)"
	$(MAKE) docs-rust
	$(MAKE) docs-typescript
	@echo "$(GREEN)✓ Documentation generated$(RESET)"

docs-rust: ## Generate Rust documentation
	@echo "$(YELLOW)Generating Rust documentation...$(RESET)"
	cd $(RUST_DIR) && cargo doc --all-features --no-deps --open
	@echo "$(GREEN)✓ Rust documentation generated$(RESET)"

docs-typescript: ## Generate TypeScript documentation
	@echo "$(YELLOW)Generating TypeScript documentation...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm run docs
	@echo "$(GREEN)✓ TypeScript documentation generated$(RESET)"

dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(RESET)"
	@echo "$(YELLOW)Starting Rust development server...$(RESET)"
	cd $(RUST_DIR) && cargo watch --x run &
	@echo "$(YELLOW)Starting TypeScript development server...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm run dev &
	@echo "$(GREEN)✓ Development environment started$(RESET)"

run-deps: ## Start required development dependencies
	@echo "$(BLUE)Starting development dependencies...$(RESET)"
	@if command -v docker >/dev/null 2>&1; then \
		docker-compose up -d; \
		echo "$(GREEN)✓ Docker services started$(RESET)"; \
	else \
		echo "$(RED)Docker is not installed$(RESET)"; \
		exit 1; \
	fi

stop-deps: ## Stop development dependencies
	@echo "$(BLUE)Stopping development dependencies...$(RESET)"
	@if command -v docker >/dev/null 2>&1; then \
		docker-compose down; \
		echo "$(GREEN)✓ Docker services stopped$(RESET)"; \
	else \
		echo "$(RED)Docker is not installed$(RESET)"; \
		exit 1; \
	fi

publish: ## Publish all packages
	@echo "$(BLUE)Publishing all packages...$(RESET)"
	$(MAKE) publish-rust
	$(MAKE) publish-typescript
	@echo "$(GREEN)✓ All packages published$(RESET)"

publish-rust: ## Publish Rust package
	@echo "$(YELLOW)Publishing Rust package...$(RESET)"
	cd $(RUST_DIR) && cargo publish --all-features
	@echo "$(GREEN)✓ Rust package published$(RESET)"

publish-typescript: ## Publish TypeScript package
	@echo "$(YELLOW)Publishing TypeScript package...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm publish
	@echo "$(GREEN)✓ TypeScript package published$(RESET)"

security-audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(RESET)"
	$(MAKE) audit-rust
	$(MAKE) audit-typescript
	@echo "$(GREEN)✓ Security audit complete$(RESET)"

audit-rust: ## Run Rust security audit
	@echo "$(YELLOW)Running Rust security audit...$(RESET)"
	cd $(RUST_DIR) && cargo audit
	@echo "$(GREEN)✓ Rust security audit complete$(RESET)"

audit-typescript: ## Run TypeScript security audit
	@echo "$(YELLOW)Running TypeScript security audit...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm audit
	@echo "$(GREEN)✓ TypeScript security audit complete$(RESET)"

examples: ## Run all examples
	@echo "$(BLUE)Running all examples...$(RESET)"
	$(MAKE) example-rust
	$(MAKE) example-typescript
	@echo "$(GREEN)✓ All examples complete$(RESET)"

example-rust: ## Run Rust examples
	@echo "$(YELLOW)Running Rust examples...$(RESET)"
	cd $(RUST_DIR) && cargo run --example substrate_connection
	cd $(RUST_DIR) && cargo run --example evm_connection
	cd $(RUST_DIR) && cargo run --example unified_api
	@echo "$(GREEN)✓ Rust examples complete$(RESET)"

example-typescript: ## Run TypeScript examples
	@echo "$(YELLOW)Running TypeScript examples...$(RESET)"
	cd $(TYPESCRIPT_DIR) && npm run example:substrate
	cd $(TYPESCRIPT_DIR) && npm run example:evm
	cd $(TYPESCRIPT_DIR) && npm run example:unified
	@echo "$(GREEN)✓ TypeScript examples complete$(RESET)"

version: ## Show version information
	@echo "$(BLUE)Selendra SDK Version Information$(RESET)"
	@echo "$(YELLOW)Rust:$(RESET) $$(cd $(RUST_DIR) && cargo metadata --no-deps --format-version 1 | grep -o '"version":"[^"]*"' | cut -d'"' -f4)"
	@echo "$(YELLOW)TypeScript:$(RESET) $$(cd $(TYPESCRIPT_DIR) && node -p "require('./package.json').version")"

clean-all: clean ## Clean everything including dependencies
	@echo "$(YELLOW)Removing node_modules...$(RESET)"
	rm -rf $(TYPESCRIPT_DIR)/node_modules
	@echo "$(GREEN)✓ Deep clean complete$(RESET)"

setup: install check ## Full project setup
	@echo "$(GREEN)✓ Project setup complete$(RESET)"

ci: ## Run CI pipeline locally
	@echo "$(BLUE)Running CI pipeline locally...$(RESET)"
	$(MAKE) check-format
	$(MAKE) lint
	$(MAKE) test-coverage
	$(MAKE) build
	$(MAKE) security-audit
	@echo "$(GREEN)✓ CI pipeline complete$(RESET)"

# Docker commands
docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(RESET)"
	docker build -t selendra-sdk:latest .
	@echo "$(GREEN)✓ Docker image built$(RESET)"

docker-run: ## Run Docker container
	@echo "$(BLUE)Running Docker container...$(RESET)"
	docker run --rm -it selendra-sdk:latest
	@echo "$(GREEN)✓ Docker container stopped$(RESET)"