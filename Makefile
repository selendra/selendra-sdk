.PHONY: help install clean build test lint

# Default target
.DEFAULT_GOAL := help

# Variables
CORE_DIR = packages/core

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
	npm install
	@echo "$(GREEN)✓ All dependencies installed$(RESET)"

clean: ## Clean all build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	cd $(CORE_DIR) && rm -rf dist node_modules/.cache
	@echo "$(GREEN)✓ Clean complete$(RESET)"

build: ## Build all packages
	@echo "$(BLUE)Building all packages...$(RESET)"
	npm run build
	@echo "$(GREEN)✓ Build complete$(RESET)"

build-core: ## Build core package
	@echo "$(YELLOW)Building core package...$(RESET)"
	cd $(CORE_DIR) && npm run build
	@echo "$(GREEN)✓ Core build complete$(RESET)"

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(RESET)"
	npm test
	@echo "$(GREEN)✓ All tests passed$(RESET)"

test-core: ## Run core package tests
	@echo "$(YELLOW)Running core tests...$(RESET)"
	cd $(CORE_DIR) && npm test
	@echo "$(GREEN)✓ Core tests complete$(RESET)"

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(RESET)"
	cd $(CORE_DIR) && npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(RESET)"
	cd $(CORE_DIR) && npm run test:coverage
	@echo "$(GREEN)✓ Coverage report generated$(RESET)"

lint: ## Run linter
	@echo "$(BLUE)Running linter...$(RESET)"
	npm run lint
	@echo "$(GREEN)✓ Lint complete$(RESET)"

dev: ## Start development mode
	@echo "$(BLUE)Starting development mode...$(RESET)"
	cd $(CORE_DIR) && npm run build:watch

# Example targets
run-example-balance: ## Run balance example
	cd $(CORE_DIR)/examples && npx ts-node balance/index.ts

run-example-staking: ## Run staking example
	cd $(CORE_DIR)/examples && npx ts-node staking/index.ts

run-example-governance: ## Run governance example
	cd $(CORE_DIR)/examples && npx ts-node governance/index.ts
