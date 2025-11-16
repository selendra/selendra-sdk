# Selendra SDK - Rust

A comprehensive, production-ready Rust SDK for interacting with the Selendra blockchain ecosystem.

## Overview

The Selendra SDK provides a unified interface for interacting with both Substrate and EVM chains within the Selendra ecosystem. It's built as an enhancement to the existing `selendra_client`, adding comprehensive EVM support while maintaining full backward compatibility.

## Features

### ✨ **Enhanced Substrate Client** (Fully Compatible with selendra_client)

- Complete compatibility with existing `selendra_client` API
- All existing pallets and transactions supported
- Enhanced error handling and retry logic
- Connection pooling and health monitoring
- Comprehensive account management

### ⚡ **Comprehensive EVM Client** (Built with ethers-rs)

- Full EVM compatibility using ethers-rs
- Smart contract interaction (ERC20, ERC721, custom contracts)
- Transaction building and gas estimation
- Event monitoring and filtering
- Wallet management (mnemonic, private key, keystore)
- EIP-1559 transaction support

### 🌉 **Unified Account System**

- Seamless address conversion between Substrate and EVM
- Cross-chain account mapping
- Unified balance queries
- Multi-signature wallet support
- Address format validation and conversion

### 🔗 **Enhanced Connection Management**

- Unified connection manager for both chains
- Health monitoring and auto-reconnection
- Connection pooling for scalability
- Performance metrics and latency tracking
- Robust error handling and retry logic

### 🏗️ **Production-Ready Architecture**

- Type-safe abstractions throughout
- Comprehensive error handling
- Async/await support for all operations
- Extensive logging and monitoring
- Thread-safe and concurrent operations

## Quick Start

### Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
selendra-sdk = { version = "0.2.0", features = ["std", "evm-full"] }
tokio = { version = "1.0", features = ["full"] }
```

### Substrate-only (selendra_client compatible)

```rust
use selendra_sdk::substrate::{Connection, keypair_from_string};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let connection = Connection::new("wss://rpc.selendra.org").await?;
    let keypair = keypair_from_string("your seed phrase here");

    let signed_connection = connection.sign(&keypair)?;
    let account_info = signed_connection.get_account_info().await?;

    println!("Account balance: {} SEL", account_info.data.free);
    Ok(())
}
```

### EVM-only

```rust
use selendra_sdk::evm::{EVMClient, EVMConfig};
use ethers_core::types::Address;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = EVMConfig::new("https://rpc.selendra.org");
    let client = EVMClient::new(config).await?;

    let balance = client.get_balance(Address::zero()).await?;
    println!("Zero address balance: {} wei", balance);
    Ok(())
}
```

### Unified API (Both Substrate and EVM)

```rust
use selendra_sdk::{builder};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut sdk = builder()
        .substrate_endpoint("wss://rpc.selendra.org")
        .evm_endpoint("https://rpc.selendra.org")
        .build()
        .await?;

    // Substrate operations
    let substrate_block = sdk.substrate().get_latest_block().await?;
    println!("Substrate block: {}", substrate_block.number);

    // EVM operations
    let evm_block = sdk.evm().get_block_number().await?;
    println!("EVM block: {}", evm_block);

    Ok(())
}
```

## Architecture

### Core Components

1. **Enhanced Connection Layer** - Unified management of Substrate and EVM connections
2. **EVM Module** - Full ethers-rs integration with additional utilities
3. **Unified Account System** - Cross-chain address and account management
4. **Type System** - Comprehensive type definitions for all operations
5. **Substrate Compatibility** - Full re-export of existing selendra_client

### Module Structure

```
rust/
├── Cargo.toml            # Package manifest with dependencies
├── README.md             # This file
├── src/
│   ├── lib.rs            # Main library entry point with re-exports
│   ├── connection/       # Enhanced connection management
│   ├── evm/             # EVM client and utilities
│   │   ├── mod.rs       # Module exports
│   │   ├── client.rs    # Core EVM client implementation
│   │   ├── transaction.rs # Transaction building and management
│   │   ├── contract.rs  # Smart contract interaction
│   │   ├── account.rs   # Account and wallet management
│   │   ├── events.rs    # Event monitoring and filtering
│   │   └── types.rs     # EVM-specific types
│   ├── substrate/       # Enhanced selendra_client
│   ├── unified/         # Cross-chain unified API
│   ├── types/           # Comprehensive type definitions
│   └── utils/           # Utility functions
└── examples/            # Usage examples
    ├── evm_connection.rs       # EVM API usage
    ├── substrate_connection.rs # Substrate API usage
    └── unified_api.rs          # Unified API usage
```

## Configuration

### Feature Flags

- `default`: Enables standard library, tokio, and rustls support
- `std`: Standard library support
- `evm-full`: Full EVM functionality
- `evm-legacy`: Legacy EVM transaction support
- `substrate-full`: Full Substrate functionality
- `bridge`: Cross-chain bridge functionality
- `contracts`: Smart contract support
- `dev`: Development features (all of the above)

### Default Endpoints

- **Mainnet RPC**: `https://rpc.selendra.org` (supports both Substrate and EVM)
- **Mainnet RPC (Alternative)**: `https://rpcx.selendra.org` (supports both Substrate and EVM)
- **WebSocket**: `wss://rpc.selendra.org` (Substrate)

## Compatibility

### selendra_client Compatibility

The SDK maintains **100% backward compatibility** with the existing `selendra_client`:

```rust
// Existing code continues to work unchanged
use selendra_client::Connection;
use selendra_sdk::substrate::Connection; // Same functionality

// All existing types are re-exported
use selendra_sdk::{
    Connection, SignedConnection, KeyPair, TxStatus,
    // ... all other selendra_client types
};
```

### Migration Guide

Existing users can migrate by simply changing imports:

```rust
// Before
use selendra_client::{Connection, SignedConnection};

// After
use selendra_sdk::substrate::{Connection, SignedConnection};
```

## Examples

The SDK includes comprehensive examples:

- `substrate_connection.rs` - Substrate-only operations
- `evm_connection.rs` - EVM-only operations
- `unified_api.rs` - Cross-chain unified operations
- `contract_interaction.rs` - Smart contract examples
- `cross_chain_bridge.rs` - Bridge operations

## Documentation

- **API Documentation**: [docs.rs/selendra-sdk](https://docs.rs/selendra-sdk)
- **Examples**: Check the `examples/` directory
- **Guides**: Comprehensive guides for common use cases

## License

This project is licensed under the Apache License 2.0.

## Support

- **Issues**: [GitHub Issues](https://github.com/selendra/selendra-sdk/issues)
- **Discord**: [Selendra Discord](https://discord.gg/selendra)
- **Documentation**: [Selendra Docs](https://docs.selendra.org)

---

**Built with ❤️ for the Selendra ecosystem**
