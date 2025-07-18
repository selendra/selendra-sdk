# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Build the SDK for production (outputs to `dist/`)
- `npm run build:dev` - Build in watch mode for development
- `npm run dev` - Alias for development build with watch mode

### Testing
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode with coverage
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests

### Code Quality
- `npm run lint` - Run ESLint on source and test files
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Type check without emitting files
- `npm run prepublishOnly` - Full check (lint + typecheck + test + build) before publishing

### Documentation
- `npm run docs` - Generate TypeDoc documentation

## Architecture Overview

This is the official TypeScript SDK for Selendra Network, supporting both EVM and WebAssembly (Substrate) interactions. The SDK provides a unified interface for interacting with Selendra's dual VM architecture.

### Core Structure

The SDK is organized into several key modules:

- **Main SDK Class** (`src/index.ts`): The `SelendraSDK` class that orchestrates all functionality
- **EVM Module** (`src/evm/`): Ethereum-compatible interactions using ethers.js
- **Substrate Module** (`src/substrate/`): Polkadot/Substrate interactions using @polkadot/api
- **Wallet Management** (`src/wallet/`): Multi-wallet connection and management
- **Network Configuration** (`src/config/networks.ts`): Network-specific configurations for mainnet/testnet
- **Utilities** (`src/utils/`): API client, WebSocket client, and formatting utilities

### Key Dependencies

- **ethers v6**: For EVM interactions
- **@polkadot/api**: For Substrate interactions
- **ws**: For WebSocket connections
- **Jest**: For testing with ts-jest preset
- **Rollup**: For building both CJS and ESM outputs

### Network Support

- **Mainnet**: Chain ID 1961, RPC at https://rpc.selendra.org
- **Testnet**: Chain ID 1953, RPC at https://rpc-testnet.selendra.org
- Both networks support WebSocket connections and have corresponding Substrate endpoints

### Build Configuration

- Uses Rollup to create both CommonJS (`dist/index.js`) and ESM (`dist/index.esm.js`) builds
- TypeScript configuration targets ES2020 with strict type checking
- External dependencies (ethers, @polkadot packages) are not bundled

### Testing Setup

- Jest with ts-jest preset for TypeScript support
- Separate test suites for EVM, Substrate, and integration tests
- Test timeout set to 30 seconds for network operations
- Coverage collection from all source files except type definitions

## SDK Usage Patterns

The SDK is designed to be initialized once with network configuration and then used across both EVM and Substrate operations:

```typescript
const sdk = new SelendraSDK({
  network: 'mainnet', // or 'testnet' or custom config
  provider: window.ethereum // optional EVM provider
});

await sdk.initialize(); // Connect to networks
// Use sdk.evm.* for EVM operations
// Use sdk.substrate.* for Substrate operations
```

The dual VM architecture allows seamless switching between EVM and Substrate operations within the same application.