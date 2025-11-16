# API Overview

The Selendra SDK provides a comprehensive API for interacting with the Selendra blockchain. The SDK is designed to be intuitive, type-safe, and feature-rich while maintaining excellent performance.

## Core Concepts

### Unified API

The SDK provides a unified interface that works with both Substrate and EVM chains within the Selendra ecosystem. This means you can write code once and it will work regardless of the underlying chain type.

### Connection Management

The SDK handles all connection details automatically, including:
- WebSocket and HTTP connections
- Automatic reconnection
- Connection pooling
- Rate limiting
- Error handling

### Account Management

The SDK provides comprehensive account management features:
- Account creation and import
- Private key management
- Address derivation
- Balance queries
- Transaction signing

### Type Safety

Both Rust and TypeScript implementations provide full type safety:
- Compile-time type checking
- Runtime validation
- Auto-generated types from chain metadata
- Comprehensive error handling

## Architecture

The SDK is organized into several key modules:

- **Connection**: Manages network connections and transport
- **Substrate**: Substrate-specific functionality
- **EVM**: EVM-specific functionality
- **Unified**: Cross-chain unified interface
- **Types**: Common types and interfaces
- **Utils**: Utility functions and helpers

## Getting Started

1. **Install the SDK**: Follow the installation guide for your preferred language
2. **Initialize the SDK**: Create a new SDK instance with your desired configuration
3. **Connect to the network**: Specify your endpoint and network
4. **Start building**: Use the unified API to interact with the blockchain

## Supported Networks

The SDK supports all Selendra ecosystem networks:
- Selendra Mainnet
- Selendra Testnet
- Custom Substrate chains
- EVM-compatible chains

For detailed API reference, see the language-specific documentation:
- [Rust API](../rust/)
- [TypeScript API](../typescript/)