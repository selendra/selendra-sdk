# API Overview

The Selendra SDK provides an API for interacting with the Selendra blockchain. The SDK is type-safe and handles connection management automatically.

## Core Concepts

### Unified API

The SDK provides a unified interface for both Substrate and EVM chains within the Selendra ecosystem.

### Connection Management

The SDK handles connection details automatically:

- WebSocket and HTTP connections
- Automatic reconnection
- Connection pooling
- Rate limiting
- Error handling

### Account Management

Account management features:

- Account creation and import
- Private key management
- Address derivation
- Balance queries
- Transaction signing

### Type Safety

Both Rust and TypeScript implementations provide type safety:

- Compile-time type checking
- Runtime validation
- Auto-generated types from chain metadata
- Error handling

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
