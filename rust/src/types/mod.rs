//! Comprehensive Type Definitions
//!
//! This module contains all the core type definitions used throughout the Selendra SDK,
//! including error types, result types, and common data structures.

use std::fmt;
use std::error::Error;
use serde::{Serialize, Deserialize};

/// Core result type used throughout the SDK
pub type Result<T> = std::result::Result<T, SDKError>;

/// Comprehensive error types for the SDK
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SDKError {
    /// Network connection errors
    ConnectionError(String),
    /// Invalid endpoint URL
    InvalidEndpoint(String),
    /// Invalid address format
    InvalidAddress(String),
    /// Invalid private key or seed phrase
    InvalidKey(String),
    /// Invalid chain identifier
    InvalidChain(String),
    /// Transaction errors
    TransactionError(String),
    /// Contract interaction errors
    ContractError(String),
    /// Signing errors
    SigningError(String),
    /// Serialization/deserialization errors
    SerializationError(String),
    /// Conversion errors
    ConversionError(String),
    /// Invalid format
    InvalidFormat(String),
    /// Operation not implemented
    NotImplemented(String),
    /// Operation not allowed
    InvalidOperation(String),
    /// Resource not found
    NotFound(String),
    /// Permission denied
    PermissionDenied(String),
    /// Operation timed out
    Timeout(String),
    /// Service or resource already running
    AlreadyRunning(String),
    /// No wallet configured
    NoWallet(String),
    /// Bridge-related errors
    BridgeError(String),
    /// Gas estimation errors
    GasError(String),
    /// I/O errors
    IOError(String),
    /// Unknown or unexpected errors
    Unknown(String),
}

impl fmt::Display for SDKError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SDKError::ConnectionError(msg) => write!(f, "Connection error: {}", msg),
            SDKError::InvalidEndpoint(msg) => write!(f, "Invalid endpoint: {}", msg),
            SDKError::InvalidAddress(msg) => write!(f, "Invalid address: {}", msg),
            SDKError::InvalidKey(msg) => write!(f, "Invalid key: {}", msg),
            SDKError::InvalidChain(msg) => write!(f, "Invalid chain: {}", msg),
            SDKError::TransactionError(msg) => write!(f, "Transaction error: {}", msg),
            SDKError::ContractError(msg) => write!(f, "Contract error: {}", msg),
            SDKError::SigningError(msg) => write!(f, "Signing error: {}", msg),
            SDKError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            SDKError::ConversionError(msg) => write!(f, "Conversion error: {}", msg),
            SDKError::InvalidFormat(msg) => write!(f, "Invalid format: {}", msg),
            SDKError::NotImplemented(msg) => write!(f, "Not implemented: {}", msg),
            SDKError::InvalidOperation(msg) => write!(f, "Invalid operation: {}", msg),
            SDKError::NotFound(msg) => write!(f, "Not found: {}", msg),
            SDKError::PermissionDenied(msg) => write!(f, "Permission denied: {}", msg),
            SDKError::Timeout(msg) => write!(f, "Timeout: {}", msg),
            SDKError::AlreadyRunning(msg) => write!(f, "Already running: {}", msg),
            SDKError::NoWallet(msg) => write!(f, "No wallet: {}", msg),
            SDKError::BridgeError(msg) => write!(f, "Bridge error: {}", msg),
            SDKError::GasError(msg) => write!(f, "Gas error: {}", msg),
            SDKError::IOError(msg) => write!(f, "IO error: {}", msg),
            SDKError::Unknown(msg) => write!(f, "Unknown error: {}", msg),
        }
    }
}

impl Error for SDKError {}

impl From<std::io::Error> for SDKError {
    fn from(err: std::io::Error) -> Self {
        SDKError::IOError(err.to_string())
    }
}

impl From<serde_json::Error> for SDKError {
    fn from(err: serde_json::Error) -> Self {
        SDKError::SerializationError(err.to_string())
    }
}

impl From<url::ParseError> for SDKError {
    fn from(err: url::ParseError) -> Self {
        SDKError::InvalidEndpoint(err.to_string())
    }
}

/// Network configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Network name
    pub name: String,
    /// Chain ID
    pub chain_id: u64,
    /// WebSocket endpoint for Substrate
    pub substrate_endpoint: Option<String>,
    /// HTTP/WebSocket endpoint for EVM
    pub evm_endpoint: Option<String>,
    /// Native currency symbol
    pub native_currency: NativeCurrency,
    /// Block explorer URL
    pub block_explorer_url: Option<String>,
    /// Default timeout for operations
    pub default_timeout: u64,
}

/// Native currency information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeCurrency {
    /// Symbol (e.g., "SEL", "ETH")
    pub symbol: String,
    /// Name (e.g., "Selendra", "Ethereum")
    pub name: String,
    /// Number of decimal places
    pub decimals: u8,
}

/// Transaction status enumeration
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransactionStatus {
    /// Transaction is pending
    Pending,
    /// Transaction is included in a block
    Included,
    /// Transaction failed
    Failed,
    /// Transaction was replaced
    Replaced,
    /// Transaction was cancelled
    Cancelled,
}

/// Block information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockInfo {
    /// Block number
    pub number: u64,
    /// Block hash
    pub hash: String,
    /// Parent block hash
    pub parent_hash: String,
    /// Block timestamp
    pub timestamp: u64,
    /// Number of transactions in block
    pub transaction_count: u64,
}

/// Chain information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainInfo {
    /// Chain name
    pub name: String,
    /// Chain ID
    pub chain_id: u64,
    /// Version
    pub version: String,
    /// Whether this is a testnet
    pub is_testnet: bool,
    /// Block time in seconds (if known)
    pub block_time: Option<u64>,
}

/// Balance information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BalanceInfo {
    /// Amount in smallest unit (e.g., wei, planck)
    pub amount: String,
    /// Formatted amount with decimal places
    pub formatted_amount: String,
    /// Currency symbol
    pub symbol: String,
    /// Number of decimal places
    pub decimals: u8,
}

/// Account balance across multiple currencies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountBalances {
    /// Account address
    pub address: String,
    /// List of balances
    pub balances: Vec<BalanceInfo>,
    /// Last updated timestamp
    pub last_updated: u64,
}

/// Token metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenMetadata {
    /// Token contract address
    pub address: String,
    /// Token symbol
    pub symbol: String,
    /// Token name
    pub name: String,
    /// Number of decimal places
    pub decimals: u8,
    /// Token logo URL (optional)
    pub logo_url: Option<String>,
    /// Whether token is verified
    pub is_verified: bool,
}

/// Transaction information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionInfo {
    /// Transaction hash
    pub hash: String,
    /// Transaction status
    pub status: TransactionStatus,
    /// From address
    pub from: String,
    /// To address (None for contract creation)
    pub to: Option<String>,
    /// Value transferred
    pub value: String,
    /// Gas price
    pub gas_price: Option<String>,
    /// Gas used
    pub gas_used: Option<String>,
    /// Gas limit
    pub gas_limit: String,
    /// Transaction fee
    pub fee: String,
    /// Nonce
    pub nonce: u64,
    /// Block number (None if pending)
    pub block_number: Option<u64>,
    /// Block hash (None if pending)
    pub block_hash: Option<String>,
    /// Transaction index in block
    pub transaction_index: Option<u64>,
    /// Transaction data
    pub data: Option<String>,
    /// Timestamp
    pub timestamp: Option<u64>,
}

/// Event log information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventLog {
    /// Contract address that emitted the event
    pub address: String,
    /// Event topics
    pub topics: Vec<String>,
    /// Event data
    pub data: String,
    /// Block number
    pub block_number: u64,
    /// Block hash
    pub block_hash: String,
    /// Transaction hash
    pub transaction_hash: String,
    /// Transaction index
    pub transaction_index: u64,
    /// Log index
    pub log_index: u64,
    /// Whether log was removed
    pub removed: bool,
}

/// Cross-chain transfer information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossChainTransfer {
    /// Transfer ID
    pub transfer_id: String,
    /// Source chain
    pub source_chain: String,
    /// Target chain
    pub target_chain: String,
    /// Source address
    pub source_address: String,
    /// Target address
    pub target_address: String,
    /// Amount being transferred
    pub amount: String,
    /// Token being transferred (None for native currency)
    pub token: Option<String>,
    /// Transfer status
    pub status: CrossChainTransferStatus,
    /// Created timestamp
    pub created_at: u64,
    /// Completed timestamp (if applicable)
    pub completed_at: Option<u64>,
    /// Transaction hashes for each chain
    pub transactions: Vec<String>,
}

/// Cross-chain transfer status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CrossChainTransferStatus {
    /// Transfer is initiated
    Initiated,
    /// Transfer is being processed
    Processing,
    /// Transfer completed successfully
    Completed,
    /// Transfer failed
    Failed,
    /// Transfer was cancelled
    Cancelled,
}

/// Gas estimation information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GasEstimation {
    /// Estimated gas limit
    pub gas_limit: u64,
    /// Gas price
    pub gas_price: String,
    /// Maximum fee per gas (for EIP-1559)
    pub max_fee_per_gas: Option<String>,
    /// Maximum priority fee per gas (for EIP-1559)
    pub max_priority_fee_per_gas: Option<String>,
    /// Estimated total cost
    pub total_cost: String,
    /// Estimated execution time (in seconds)
    pub estimated_time: Option<u64>,
}

/// Configuration for retry logic
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryConfig {
    /// Maximum number of retry attempts
    pub max_attempts: u32,
    /// Initial delay between retries in milliseconds
    pub initial_delay_ms: u64,
    /// Multiplier for exponential backoff
    pub backoff_multiplier: f64,
    /// Maximum delay between retries in milliseconds
    pub max_delay_ms: u64,
    /// Whether to use jitter
    pub use_jitter: bool,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            initial_delay_ms: 1000,
            backoff_multiplier: 2.0,
            max_delay_ms: 30000,
            use_jitter: true,
        }
    }
}

/// SDK configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SDKConfig {
    /// Network configuration
    pub network: NetworkConfig,
    /// Retry configuration
    pub retry: RetryConfig,
    /// Default timeout for operations in seconds
    pub default_timeout: u64,
    /// Maximum concurrent requests
    pub max_concurrent_requests: usize,
    /// Whether to enable metrics collection
    pub enable_metrics: bool,
}

impl Default for SDKConfig {
    fn default() -> Self {
        Self {
            network: NetworkConfig {
                name: "Selendra".to_string(),
                chain_id: 1000,
                substrate_endpoint: Some(crate::DEFAULT_SELENDRA_ENDPOINT.to_string()),
                evm_endpoint: Some(crate::DEFAULT_SELENDRA_EVM_ENDPOINT.to_string()),
                native_currency: NativeCurrency {
                    symbol: "SEL".to_string(),
                    name: "Selendra".to_string(),
                    decimals: 18,
                },
                block_explorer_url: Some("https://explorer.selendra.org".to_string()),
                default_timeout: 30,
            },
            retry: RetryConfig::default(),
            default_timeout: 30,
            max_concurrent_requests: 10,
            enable_metrics: false,
        }
    }
}

/// Utility functions for type conversions and validations
pub mod utils {
    use super::*;

    /// Validate address format (both Substrate and EVM)
    pub fn validate_address(address: &str) -> Result<()> {
        if address.len() < 2 {
            return Err(SDKError::InvalidAddress("Address too short".to_string()));
        }

        // Try Substrate SS58 format
        if sp_core::crypto::AccountId32::from_str(address).is_ok() {
            return Ok(());
        }

        // Try EVM format
        if address.starts_with("0x") && address.len() == 42 {
            return Ok(());
        }

        Err(SDKError::InvalidAddress("Invalid address format".to_string()))
    }

    /// Convert hex string to bytes
    pub fn hex_to_bytes(hex: &str) -> Result<Vec<u8>> {
        hex::decode(hex.trim_start_matches("0x"))
            .map_err(|e| SDKError::ConversionError(format!("Invalid hex: {}", e)))
    }

    /// Convert bytes to hex string
    pub fn bytes_to_hex(bytes: &[u8]) -> String {
        format!("0x{}", hex::encode(bytes))
    }

    /// Parse amount string to smallest unit (wei/planck)
    pub fn parse_amount(amount: &str, decimals: u8) -> Result<String> {
        // This would require the rust_decimal crate for proper decimal handling
        // For now, return a placeholder
        Err(SDKError::NotImplemented("Amount parsing not yet implemented".to_string()))
    }

    /// Format amount from smallest unit to readable format
    pub fn format_amount(amount: &str, decimals: u8) -> Result<String> {
        // This would require the rust_decimal crate for proper decimal handling
        // For now, return a placeholder
        Err(SDKError::NotImplemented("Amount formatting not yet implemented".to_string()))
    }

    /// Calculate transaction fee from gas used and gas price
    pub fn calculate_fee(gas_used: u64, gas_price: &str) -> Result<String> {
        let gas_used_decimal = rust_decimal::Decimal::from(gas_used);
        let gas_price_decimal: rust_decimal::Decimal = gas_price.parse()
            .map_err(|e| SDKError::ConversionError(format!("Invalid gas price: {}", e)))?;

        let fee = gas_used_decimal * gas_price_decimal;
        Ok(fee.to_string())
    }

    /// Validate private key format
    pub fn validate_private_key(private_key: &str) -> Result<()> {
        // Remove 0x prefix if present
        let clean_key = private_key.trim_start_matches("0x");

        // Check length (64 hex characters for 32 bytes)
        if clean_key.len() != 64 {
            return Err(SDKError::InvalidKey(
                "Private key must be 32 bytes (64 hex characters)".to_string()
            ));
        }

        // Check if it's valid hex
        hex::decode(clean_key)
            .map_err(|e| SDKError::InvalidKey(format!("Invalid hex in private key: {}", e)))?;

        Ok(())
    }

    /// Generate a random transaction ID
    pub fn generate_transaction_id() -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
            .hash(&mut hasher);

        format!("tx_{:x}", hasher.finish())
    }

    /// Get current timestamp in seconds
    pub fn current_timestamp() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sdk_error_display() {
        let error = SDKError::ConnectionError("Failed to connect".to_string());
        assert_eq!(error.to_string(), "Connection error: Failed to connect");
    }

    #[test]
    fn test_hex_conversion() {
        let bytes = vec![0x12, 0x34, 0x56, 0x78];
        let hex = utils::bytes_to_hex(&bytes);
        assert_eq!(hex, "0x12345678");

        let converted_back = utils::hex_to_bytes(&hex).unwrap();
        assert_eq!(converted_back, bytes);
    }

    #[test]
    fn test_private_key_validation() {
        assert!(utils::validate_private_key("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef").is_ok());
        assert!(utils::validate_private_key("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef").is_ok());

        assert!(utils::validate_private_key("invalid").is_err());
        assert!(utils::validate_private_key("0x123").is_err()); // Too short
    }

    #[test]
    fn test_transaction_id_generation() {
        let id1 = utils::generate_transaction_id();
        let id2 = utils::generate_transaction_id();
        assert_ne!(id1, id2);
        assert!(id1.starts_with("tx_"));
    }

    #[test]
    fn test_default_configs() {
        let retry_config = RetryConfig::default();
        assert_eq!(retry_config.max_attempts, 3);
        assert_eq!(retry_config.initial_delay_ms, 1000);

        let sdk_config = SDKConfig::default();
        assert_eq!(sdk_config.network.chain_id, 1000);
        assert_eq!(sdk_config.network.native_currency.symbol, "SEL");
    }
}