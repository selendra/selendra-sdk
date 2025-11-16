//! # Selendra SDK - Rust
//!
//! A comprehensive SDK for interacting with the Selendra blockchain.
//!
//! This library provides a unified interface for interacting with both
//! Substrate and EVM-based chains within the Selendra ecosystem.
//!
//! ## Features
//!
//! - **Enhanced Substrate client** (fully compatible with selendra_client)
//! - **Comprehensive EVM client** using ethers-rs
//! - **Unified API** for both chain types
//! - **Type-safe abstractions** with comprehensive error handling
//! - **Async/await support** throughout
//! - **Cross-chain bridge functionality**
//! - **Contract interaction support**
//! - **Production-ready** with extensive testing
//!
//! ## Compatibility
//!
//! This SDK maintains **full backward compatibility** with the existing `selendra_client` while adding
//! significant enhancements including EVM support, unified account management, and bridge functionality.
//!
//! ## Quick Start
//!
//! ### Substrate-only (selendra_client compatible)
//! ```rust,no_run
//! use selendra_sdk::substrate::{Connection, keypair_from_string};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let connection = Connection::new("wss://rpc.selendra.org").await?;
//!     let keypair = keypair_from_string("your seed phrase here");
//!
//!     let signed_connection = connection.sign(&keypair)?;
//!     let account_info = signed_connection.get_account_info().await?;
//!
//!     println!("Account balance: {:?}", account_info.data.free);
//!     Ok(())
//! }
//! ```
//!
//! ### EVM-only
//! ```rust,no_run
//! use selendra_sdk::evm::{EVMClient, EVMConfig};
//! use ethers_core::types::Address;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = EVMConfig::new("https://eth-rpc.selendra.org");
//!     let client = EVMClient::new(config).await?;
//!
//!     let balance = client.get_balance(Address::zero()).await?;
//!     println!("Zero address balance: {} wei", balance);
//!
//!     Ok(())
//! }
//! ```
//!
//! ### Unified API (Both Substrate and EVM)
//! ```rust,no_run
//! use selendra_sdk::{SelendraSDK, Network, ChainType};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let mut sdk = SelendraSDK::builder()
//!         .substrate_endpoint("wss://rpc.selendra.org")
//!         .evm_endpoint("https://eth-rpc.selendra.org")
//!         .network(Network::Selendra)
//!         .build()
//!         .await?;
//!
//!     // Substrate operations
//!     let substrate_block = sdk.substrate().get_latest_block().await?;
//!     println!("Substrate block: {}", substrate_block.block_number);
//!
//!     // EVM operations
//!     let evm_block = sdk.evm().get_block_number().await?;
//!     println!("EVM block: {}", evm_block);
//!
//!     // Unified account operations
//!     let unified_balance = sdk.get_unified_balance("your_address").await?;
//!     println!("Unified balance: {:?}", unified_balance);
//!
//!     Ok(())
//! }
//! ```

#![cfg_attr(docsrs, feature(doc_cfg))]
#![warn(missing_docs)]
#![warn(unused_extern_crates)]
#![warn(unused_imports)]

// Re-export selendra_client for full backward compatibility
pub use selendra_client;

// Core SDK modules
pub mod connection;
pub mod evm;
pub mod substrate;
pub mod types;
pub mod unified;
pub mod utils;

// Re-export main types for convenience
pub use connection::*;
pub use evm::*;
pub use substrate::*;
pub use types::*;
pub use unified::*;
pub use utils::*;

/// Current version of the SDK
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Default timeout for network operations (in seconds)
pub const DEFAULT_TIMEOUT: u64 = 30;

/// Default RPC endpoint for Selendra mainnet (Substrate)
pub const DEFAULT_SELENDRA_ENDPOINT: &str = "wss://rpc.selendra.org";

/// Default RPC endpoint for Selendra testnet (Substrate)
pub const DEFAULT_SELENDRA_TESTNET_ENDPOINT: &str = "wss://testnet-rpc.selendra.org";

/// Default RPC endpoint for Selendra EVM mainnet
pub const DEFAULT_SELENDRA_EVM_ENDPOINT: &str = "https://eth-rpc.selendra.org";

/// Default RPC endpoint for Selendra EVM testnet
pub const DEFAULT_SELENDRA_EVM_TESTNET_ENDPOINT: &str = "https://testnet-eth-rpc.selendra.org";

/// Create a new SDK builder instance
pub fn builder() -> crate::unified::SDKBuilder {
    crate::unified::SDKBuilder::new()
}

/// Quick-connect function for common use cases
pub async fn quick_connect(substrate_url: Option<&str>, evm_url: Option<&str>) -> crate::types::Result<SelendraSDK> {
    let mut builder = builder();

    if let Some(url) = substrate_url {
        builder = builder.substrate_endpoint(url);
    } else {
        builder = builder.substrate_endpoint(DEFAULT_SELENDRA_ENDPOINT);
    }

    if let Some(url) = evm_url {
        builder = builder.evm_endpoint(url);
    } else {
        builder = builder.evm_endpoint(DEFAULT_SELENDRA_EVM_ENDPOINT);
    }

    builder.build().await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_is_set() {
        assert!(!VERSION.is_empty());
    }

    #[test]
    fn test_default_endpoints() {
        assert!(!DEFAULT_SELENDRA_ENDPOINT.is_empty());
        assert!(!DEFAULT_SELENDRA_EVM_ENDPOINT.is_empty());
    }
}