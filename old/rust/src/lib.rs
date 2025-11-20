//! # Selendra SDK - Rust
//!
//! SDK for interacting with the Selendra blockchain.
//!
//! This library provides a unified interface for interacting with both
//! Substrate and EVM-based chains within the Selendra ecosystem.
//!
//! ## Features
//!
//! - **Substrate client** (fully compatible with selendra_client)
//! - **EVM client** using ethers-rs
//! - **Unified API** for both chain types
//! - **Type-safe abstractions** with error handling
//! - **Async/await support**
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
//! # #[cfg(feature = "substrate")]
//! # {
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
//! # }
//! ```
//!
//! ### EVM-only
//! ```rust,no_run
//! # #[cfg(feature = "evm")]
//! # {
//! use selendra_sdk::evm::{EVMClient, EVMConfig};
//! use ethers::types::Address;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = EVMConfig::new("https://eth-rpc.selendra.org");
//!     let client = EVMClient::new(config).await?;
//!
//!     let balance = client.get_balance(Address::zero(), None).await?;
//!     println!("Zero address balance: {} wei", balance);
//!
//!     Ok(())
//! }
//! # }
//! ```
//!
//! ### Unified API (Both Substrate and EVM)
//! ```rust,no_run
//! # #[cfg(all(feature = "evm", feature = "substrate"))]
//! # {
//! use selendra_sdk::unified::{SelendraSDK, SDKBuilder};
//! use selendra_sdk::types::{Network, ChainType};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let mut sdk = SDKBuilder::new()
//!         .substrate_endpoint("wss://rpc.selendra.org")
//!         .evm_endpoint("https://eth-rpc.selendra.org")
//!         .network(Network::Selendra)
//!         .build()
//!         .await?;
//!
//!     // Substrate operations (if substrate feature enabled)
//!     #[cfg(feature = "substrate")]
//!     {
//!         let substrate_block = sdk.substrate().get_latest_block().await?;
//!         println!("Substrate block: {:?}", substrate_block);
//!     }
//!
//!     // EVM operations (if evm feature enabled)
//!     #[cfg(feature = "evm")]
//!     {
//!         let evm_block = sdk.evm().get_block_number().await?;
//!         println!("EVM block: {}", evm_block);
//!     }
//!
//!     Ok(())
//! }
//! # }
//! ```

#![cfg_attr(docsrs, feature(doc_cfg))]
#![warn(missing_docs)]
#![warn(unused_extern_crates)]
#![warn(unused_imports)]

pub mod types;
pub mod utils;
#[cfg(feature = "evm")]
pub mod evm;

#[cfg(feature = "substrate")]
pub mod substrate;

#[cfg(all(feature = "evm", feature = "substrate"))]
pub mod connection;

#[cfg(all(feature = "evm", feature = "substrate"))]
pub mod unified;

// Re-export main types for convenience
pub use types::*;
pub use utils::*;

#[cfg(feature = "evm")]
pub use evm::*;

#[cfg(feature = "substrate")]
pub use substrate::*;

#[cfg(all(feature = "evm", feature = "substrate"))]
pub use connection::*;

#[cfg(all(feature = "evm", feature = "substrate"))]
pub use unified::*;

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
#[cfg(all(feature = "evm", feature = "substrate"))]
pub fn builder() -> crate::unified::SDKBuilder {
    crate::unified::SDKBuilder::new()
}

/// Quick-connect function for common use cases
#[cfg(all(feature = "evm", feature = "substrate"))]
pub async fn quick_connect(substrate_url: Option<&str>, evm_url: Option<&str>) -> crate::types::Result<crate::unified::SelendraSDK> {
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