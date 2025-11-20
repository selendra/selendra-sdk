//! EVM Client Implementation
//!
//! EVM client using ethers-rs for interacting with EVM-compatible chains.

use crate::types::{Result, SDKError};
use ethers::providers::{Middleware, Http, Provider, Ws};
use ethers::signers::{Signer, Wallet};
use ethers::types::{Address, U256, BlockId, BlockNumber, TransactionRequest, H256, Bytes, Transaction, TransactionReceipt, Log, Filter};
use ethers::utils::{keccak256, to_checksum};
use std::sync::Arc;
use std::str::FromStr;
use std::time::Duration;
use tokio::time::timeout;
use url::Url;

/// EVM client configuration
#[derive(Debug, Clone)]
pub struct EVMConfig {
    /// RPC endpoint URL
    pub endpoint: String,
    /// Chain ID for transaction signing
    pub chain_id: Option<u64>,
    /// Request timeout in seconds
    pub timeout: u64,
    /// Maximum retry attempts for failed requests
    pub max_retries: u32,
    /// Private key for signed transactions (optional)
    pub private_key: Option<String>,
    /// WebSocket endpoint for real-time updates (optional)
    pub ws_endpoint: Option<String>,
}

impl Default for EVMConfig {
    fn default() -> Self {
        Self {
            endpoint: crate::DEFAULT_SELENDRA_EVM_ENDPOINT.to_string(),
            chain_id: None,
            timeout: crate::DEFAULT_TIMEOUT,
            max_retries: 3,
            private_key: None,
            ws_endpoint: None,
        }
    }
}

impl EVMConfig {
    /// Create a new EVM configuration
    pub fn new(endpoint: &str) -> Self {
        Self {
            endpoint: endpoint.to_string(),
            ..Default::default()
        }
    }

    /// Set the chain ID
    pub fn chain_id(mut self, chain_id: u64) -> Self {
        self.chain_id = Some(chain_id);
        self
    }

    /// Set the request timeout
    pub fn timeout(mut self, timeout: u64) -> Self {
        self.timeout = timeout;
        self
    }

    /// Set the maximum retry attempts
    pub fn max_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = max_retries;
        self
    }

    /// Set the private key for signed transactions
    pub fn private_key(mut self, private_key: &str) -> Self {
        self.private_key = Some(private_key.to_string());
        self
    }

    /// Set the WebSocket endpoint
    pub fn ws_endpoint(mut self, ws_endpoint: &str) -> Self {
        self.ws_endpoint = Some(ws_endpoint.to_string());
        self
    }
}

/// EVM client for interacting with EVM-compatible chains
#[derive(Clone)]
pub struct EVMClient {
    /// HTTP provider for RPC calls
    provider: Arc<Provider<Http>>,
    /// WebSocket provider for real-time updates (optional)
    ws_provider: Option<Arc<Provider<Ws>>>,
    /// Wallet for signed transactions (optional)
    wallet: Option<Arc<Wallet<ethers::core::k256::ecdsa::SigningKey>>>,
    /// Configuration
    config: EVMConfig,
}

impl EVMClient {
    /// Create a new EVM client from configuration
    pub async fn new(config: EVMConfig) -> Result<Self> {
        // Validate endpoint URL
        let _url: Url = config.endpoint.parse()
            .map_err(|e| SDKError::InvalidEndpoint(format!("Invalid endpoint URL: {}", e)))?;

        // Create HTTP provider
        let provider = Provider::<Http>::try_from(&config.endpoint)
            .map_err(|e| SDKError::ConnectionError(format!("Failed to create provider: {}", e)))?;

        let provider = Arc::new(provider.interval(Duration::from_millis(1000)));

        // Create WebSocket provider if endpoint provided
        let ws_provider = if let Some(ws_endpoint) = &config.ws_endpoint {
            let ws_url: Url = ws_endpoint.parse()
                .map_err(|e| SDKError::InvalidEndpoint(format!("Invalid WebSocket endpoint: {}", e)))?;

            let ws_provider = Provider::<Ws>::connect(ws_endpoint)
                .await
                .map_err(|e| SDKError::ConnectionError(format!("Failed to create WebSocket provider: {}", e)))?;

            Some(Arc::new(ws_provider))
        } else {
            None
        };

        // Create wallet if private key provided
        let wallet = if let Some(private_key) = &config.private_key {
            let wallet = private_key.parse::<Wallet<ethers::core::k256::ecdsa::SigningKey>>()
                .map_err(|e| SDKError::InvalidKey(format!("Invalid private key: {}", e)))?;

            // Set chain ID if provided
            let wallet = if let Some(chain_id) = config.chain_id {
                wallet.with_chain_id(chain_id)
            } else {
                wallet
            };

            Some(Arc::new(wallet))
        } else {
            None
        };

        Ok(Self {
            provider,
            ws_provider,
            wallet,
            config,
        })
    }

    /// Create a new EVM client with default configuration
    pub async fn default() -> Result<Self> {
        Self::new(EVMConfig::default()).await
    }

    /// Get the chain ID
    pub async fn get_chain_id(&self) -> Result<u64> {
        self.execute_with_timeout(|| async {
            self.provider.get_chainid().await
                .map_err(|e| SDKError::RPCError(format!("Failed to get chain ID: {}", e)))
        }).await
    }

    /// Get the latest block number
    pub async fn get_block_number(&self) -> Result<u64> {
        self.execute_with_timeout(|| async {
            self.provider.get_block_number().await
                .map_err(|e| SDKError::RPCError(format!("Failed to get block number: {}", e)))
        }).await
    }

    /// Get block by number
    pub async fn get_block_by_number(&self, block_number: BlockNumber) -> Result<Option<Transaction>> {
        self.execute_with_timeout(|| async {
            self.provider.get_block(block_number).await
                .map_err(|e| SDKError::RPCError(format!("Failed to get block: {}", e)))
        }).await
    }

    /// Get balance for an address
    pub async fn get_balance(&self, address: Address, block: Option<BlockId>) -> Result<U256> {
        let block_id = block.unwrap_or(BlockId::Number(BlockNumber::Latest));

        self.execute_with_timeout(|| async {
            self.provider.get_balance(address, block_id).await
                .map_err(|e| SDKError::RPCError(format!("Failed to get balance: {}", e)))
        }).await
    }

    /// Get transaction count (nonce) for an address
    pub async fn get_transaction_count(&self, address: Address, block: Option<BlockId>) -> Result<u64> {
        let block_id = block.unwrap_or(BlockId::Number(BlockNumber::Latest));

        self.execute_with_timeout(|| async {
            self.provider.get_transaction_count(address, block_id).await
                .map_err(|e| SDKError::RPCError(format!("Failed to get transaction count: {}", e)))
        }).await
    }

    /// Get transaction by hash
    pub async fn get_transaction(&self, tx_hash: H256) -> Result<Option<Transaction>> {
        self.execute_with_timeout(|| async {
            self.provider.get_transaction(tx_hash).await
                .map_err(|e| SDKError::RPCError(format!("Failed to get transaction: {}", e)))
        }).await
    }

    /// Get transaction receipt
    pub async fn get_transaction_receipt(&self, tx_hash: H256) -> Result<Option<TransactionReceipt>> {
        self.execute_with_timeout(|| async {
            self.provider.get_transaction_receipt(tx_hash).await
                .map_err(|e| SDKError::RPCError(format!("Failed to get transaction receipt: {}", e)))
        }).await
    }

    /// Send a raw transaction
    pub async fn send_raw_transaction(&self, tx_bytes: Bytes) -> Result<H256> {
        self.execute_with_timeout(|| async {
            self.provider.send_raw_transaction(&tx_bytes).await
                .map_err(|e| SDKError::TransactionError(format!("Failed to send raw transaction: {}", e)))
        }).await
    }

    /// Send a transaction (requires wallet)
    pub async fn send_transaction(&self, tx: TransactionRequest) -> Result<H256> {
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| SDKError::NoWallet("No wallet configured for signed transactions".to_string()))?;

        self.execute_with_timeout(|| async {
            wallet.send_transaction(tx, None).await
                .map_err(|e| SDKError::TransactionError(format!("Failed to send transaction: {}", e)))
        }).await
    }

    /// Estimate gas for a transaction
    pub async fn estimate_gas(&self, tx: &TransactionRequest) -> Result<U256> {
        self.execute_with_timeout(|| async {
            self.provider.estimate_gas(tx, None).await
                .map_err(|e| SDKError::RPCError(format!("Failed to estimate gas: {}", e)))
        }).await
    }

    /// Get gas price
    pub async fn get_gas_price(&self) -> Result<U256> {
        self.execute_with_timeout(|| async {
            self.provider.get_gas_price().await
                .map_err(|e| SDKError::RPCError(format!("Failed to get gas price: {}", e)))
        }).await
    }

    /// Call a smart contract function (read-only)
    pub async fn call(&self, tx: &TransactionRequest, block: Option<BlockId>) -> Result<Bytes> {
        let block_id = block.unwrap_or(BlockId::Number(BlockNumber::Latest));

        self.execute_with_timeout(|| async {
            self.provider.call(tx, block_id).await
                .map_err(|e| SDKError::RPCError(format!("Failed to call contract: {}", e)))
        }).await
    }

    /// Get logs using a filter
    pub async fn get_logs(&self, filter: &Filter) -> Result<Vec<Log>> {
        self.execute_with_timeout(|| async {
            self.provider.get_logs(filter).await
                .map_err(|e| SDKError::RPCError(format!("Failed to get logs: {}", e)))
        }).await
    }

    /// Get code at an address
    pub async fn get_code(&self, address: Address, block: Option<BlockId>) -> Result<Bytes> {
        let block_id = block.unwrap_or(BlockId::Number(BlockNumber::Latest));

        self.execute_with_timeout(|| async {
            self.provider.get_code(address, block_id).await
                .map_err(|e| SDKError::RPCError(format!("Failed to get code: {}", e)))
        }).await
    }

    /// Get storage value at an address and position
    pub async fn get_storage_at(&self, address: Address, position: U256, block: Option<BlockId>) -> Result<U256> {
        let block_id = block.unwrap_or(BlockId::Number(BlockNumber::Latest));

        self.execute_with_timeout(|| async {
            self.provider.get_storage_at(address, position, block_id).await
                .map_err(|e| SDKError::RPCError(format!("Failed to get storage: {}", e)))
        }).await
    }

    /// Check if an address is a contract
    pub async fn is_contract(&self, address: Address, block: Option<BlockId>) -> Result<bool> {
        let code = self.get_code(address, block).await?;
        Ok(!code.is_empty())
    }

    /// Get the wallet address (if configured)
    pub fn get_wallet_address(&self) -> Option<Address> {
        self.wallet.as_ref().map(|w| w.address())
    }

    /// Execute a function with timeout and retry logic
    async fn execute_with_timeout<F, T>(&self, f: F) -> Result<T>
    where
        F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T>> + Send>>,
    {
        let mut last_error = None;

        for attempt in 1..=self.config.max_retries {
            let timeout_future = timeout(Duration::from_secs(self.config.timeout), f());

            match timeout_future.await {
                Ok(result) => return result,
                Err(_) => {
                    last_error = Some(SDKError::Timeout(format!(
                        "Operation timed out after {} seconds (attempt {}/{})",
                        self.config.timeout, attempt, self.config.max_retries
                    )));

                    // If not the last attempt, wait before retrying
                    if attempt < self.config.max_retries {
                        tokio::time::sleep(Duration::from_millis(1000 * attempt as u64)).await;
                    }
                }
            }
        }

        Err(last_error.unwrap_or_else(|| SDKError::Unknown("Operation failed after all retries".to_string())))
    }

    /// Get the HTTP provider (for advanced usage)
    pub fn provider(&self) -> Arc<Provider<Http>> {
        self.provider.clone()
    }

    /// Get the WebSocket provider (for advanced usage)
    pub fn ws_provider(&self) -> Option<Arc<Provider<Ws>>> {
        self.ws_provider.clone()
    }

    /// Get the wallet (for advanced usage)
    pub fn wallet(&self) -> Option<Arc<Wallet<ethers::core::k256::ecdsa::SigningKey>>> {
        self.wallet.clone()
    }

    /// Get the configuration
    pub fn config(&self) -> &EVMConfig {
        &self.config
    }
}

/// Utility functions for EVM operations
pub mod utils {
    use super::*;
    use ethers::utils::parse_ether;

    /// Convert ether to wei
    pub fn ether_to_wei(ether: &str) -> Result<U256> {
        parse_ether(ether)
            .map_err(|e| SDKError::ConversionError(format!("Failed to convert ether to wei: {}", e)))
    }

    /// Convert wei to ether (returns string)
    pub fn wei_to_ether(wei: U256) -> String {
        format!("{:.6}", ethers::utils::format_ether(wei))
    }

    /// Convert an address to checksum format
    pub fn to_checksum_address(address: &Address) -> String {
        to_checksum(address, None)
    }

    /// Parse an address from string
    pub fn parse_address(address: &str) -> Result<Address> {
        Address::from_str(address)
            .map_err(|e| SDKError::InvalidAddress(format!("Invalid address format: {}", e)))
    }

    /// Generate a random address (for testing only)
    #[cfg(test)]
    pub fn generate_random_address() -> Address {
        use ethers::core::rand::thread_rng;
        use ethers::signers::Signer;

        let wallet = Wallet::new(&mut thread_rng());
        wallet.address()
    }

    /// Calculate function selector
    pub fn calculate_function_selector(function_signature: &str) -> [u8; 4] {
        let hash = keccak256(function_signature.as_bytes());
        [hash[0], hash[1], hash[2], hash[3]]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_evm_config_default() {
        let config = EVMConfig::default();
        assert_eq!(config.endpoint, crate::DEFAULT_SELENDRA_EVM_ENDPOINT);
        assert_eq!(config.timeout, crate::DEFAULT_TIMEOUT);
        assert_eq!(config.max_retries, 3);
    }

    #[test]
    fn test_evm_config_builder() {
        let config = EVMConfig::new("https://example.com")
            .chain_id(12345)
            .timeout(60)
            .max_retries(5)
            .private_key("0123456789abcdef")
            .ws_endpoint("wss://example.com");

        assert_eq!(config.endpoint, "https://example.com");
        assert_eq!(config.chain_id, Some(12345));
        assert_eq!(config.timeout, 60);
        assert_eq!(config.max_retries, 5);
        assert_eq!(config.private_key, Some("0123456789abcdef".to_string()));
        assert_eq!(config.ws_endpoint, Some("wss://example.com".to_string()));
    }

    #[test]
    fn test_ether_to_wei() {
        let wei = utils::ether_to_wei("1.0").unwrap();
        assert_eq!(wei, U256::from(10u64.pow(18)));
    }

    #[test]
    fn test_wei_to_ether() {
        let wei = U256::from(10u64.pow(18));
        let ether = utils::wei_to_ether(wei);
        assert_eq!(ether, "1.000000");
    }

    #[test]
    fn test_parse_address() {
        let address = "0x1234567890123456789012345678901234567890";
        let parsed = utils::parse_address(address).unwrap();
        assert_eq!(parsed.to_string(), address.to_lowercase());
    }

    #[test]
    fn test_to_checksum_address() {
        let address = "0x1234567890123456789012345678901234567890";
        let checksum = utils::to_checksum_address(&utils::parse_address(address).unwrap());
        // Checksum address should contain some uppercase letters
        assert!(!checksum.eq_ignore_ascii_case(address));
    }

    #[test]
    fn test_calculate_function_selector() {
        let selector = utils::calculate_function_selector("transfer(address,uint256)");
        // Function selector should be 4 bytes
        assert_eq!(selector.len(), 4);
    }
}