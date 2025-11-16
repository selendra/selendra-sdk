//! EVM Transaction Management
//!
//! This module provides utilities for creating, signing, and managing EVM transactions
//! with enhanced features for the Selendra ecosystem.

use crate::types::{Result, SDKError};
use crate::evm::client::EVMClient;
use ethers_core::{
    types::{
        Address, U256, Bytes, H256, TransactionRequest, TransactionReceipt,
        Eip1559TransactionRequest, Transaction, BlockNumber, BlockId,
        BigNumber, TxHash, AccessList
    },
    utils::keccak256,
};
use ethers_signers::{Signer, Wallet};
use ethers_providers::Middleware;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Serialize, Deserialize};

/// Transaction status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransactionStatus {
    /// Transaction is pending
    Pending,
    /// Transaction was included in a block
    Included {
        /// Block number
        block_number: u64,
        /// Block hash
        block_hash: H256,
        /// Transaction index in block
        transaction_index: u64,
    },
    /// Transaction failed
    Failed {
        /// Block number
        block_number: u64,
        /// Block hash
        block_hash: H256,
        /// Transaction index in block
        transaction_index: u64,
        /// Error message if available
        error: Option<String>,
    },
    /// Transaction was replaced
    Replaced {
        /// New transaction hash
        new_hash: H256,
    },
    /// Transaction was cancelled
    Cancelled,
}

/// Enhanced transaction builder
#[derive(Debug, Clone)]
pub struct TransactionBuilder {
    /// Transaction request
    request: TransactionRequest,
    /// Gas limit (optional)
    gas_limit: Option<u64>,
    /// Max fee per gas (for EIP-1559)
    max_fee_per_gas: Option<U256>,
    /// Max priority fee per gas (for EIP-1559)
    max_priority_fee_per_gas: Option<U256>,
    /// Gas price (for legacy transactions)
    gas_price: Option<U256>,
    /// Nonce (optional, will be fetched if not provided)
    nonce: Option<u64>,
    /// Chain ID (optional)
    chain_id: Option<u64>,
}

impl Default for TransactionBuilder {
    fn default() -> Self {
        Self {
            request: TransactionRequest::default(),
            gas_limit: None,
            max_fee_per_gas: None,
            max_priority_fee_per_gas: None,
            gas_price: None,
            nonce: None,
            chain_id: None,
        }
    }
}

impl TransactionBuilder {
    /// Create a new transaction builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the recipient address
    pub fn to(mut self, address: Address) -> Self {
        self.request.to = Some(address.into());
        self
    }

    /// Set the transaction value in wei
    pub fn value(mut self, value: U256) -> Self {
        self.request.value = Some(value);
        self
    }

    /// Set the transaction data
    pub fn data(mut self, data: Bytes) -> Self {
        self.request.data = Some(data);
        self
    }

    /// Set the gas limit
    pub fn gas_limit(mut self, gas_limit: u64) -> Self {
        self.gas_limit = Some(gas_limit);
        self
    }

    /// Set the gas price (for legacy transactions)
    pub fn gas_price(mut self, gas_price: U256) -> Self {
        self.gas_price = Some(gas_price);
        self
    }

    /// Set max fee per gas (for EIP-1559 transactions)
    pub fn max_fee_per_gas(mut self, max_fee: U256) -> Self {
        self.max_fee_per_gas = Some(max_fee);
        self
    }

    /// Set max priority fee per gas (for EIP-1559 transactions)
    pub fn max_priority_fee_per_gas(mut self, priority_fee: U256) -> Self {
        self.max_priority_fee_per_gas = Some(priority_fee);
        self
    }

    /// Set the nonce
    pub fn nonce(mut self, nonce: u64) -> Self {
        self.nonce = Some(nonce);
        self
    }

    /// Set the chain ID
    pub fn chain_id(mut self, chain_id: u64) -> Self {
        self.chain_id = Some(chain_id);
        self
    }

    /// Set access list (for EIP-2930)
    pub fn access_list(mut self, access_list: AccessList) -> Self {
        self.request.access_list = Some(access_list);
        self
    }

    /// Build the transaction request
    pub async fn build(self, client: &EVMClient) -> Result<TransactionRequest> {
        let mut request = self.request;

        // Set gas limit if not provided
        if self.gas_limit.is_some() {
            request.gas = Some(U256::from(self.gas_limit.unwrap()));
        }

        // Set gas price or EIP-1559 fees
        if self.gas_price.is_some() {
            request.gas_price = Some(self.gas_price.unwrap());
        } else if self.max_fee_per_gas.is_some() || self.max_priority_fee_per_gas.is_some() {
            // Use EIP-1559 transaction
            let eip1559_tx = Eip1559TransactionRequest {
                to: request.to.clone(),
                value: request.value,
                data: request.data.clone(),
                max_fee_per_gas: self.max_fee_per_gas,
                max_priority_fee_per_gas: self.max_priority_fee_per_gas,
                gas_limit: request.gas,
                access_list: request.access_list.clone(),
                ..Default::default()
            };

            // Convert back to TransactionRequest
            request = TransactionRequest {
                to: eip1559_tx.to,
                value: eip1559_tx.value,
                data: eip1559_tx.data,
                gas: eip1559_tx.gas_limit,
                gas_price: None,
                max_fee_per_gas: eip1559_tx.max_fee_per_gas,
                max_priority_fee_per_gas: eip1559_tx.max_priority_fee_per_gas,
                access_list: eip1559_tx.access_list,
                ..Default::default()
            };
        }

        // Fetch nonce if not provided
        let nonce = if let Some(nonce) = self.nonce {
            nonce
        } else if let Some(from) = request.from {
            client.get_transaction_count(from, None).await?
        } else if let Some(wallet) = client.wallet() {
            client.get_transaction_count(wallet.address(), None).await?
        } else {
            return Err(SDKError::TransactionError(
                "Cannot determine nonce: no from address or wallet configured".to_string()
            ));
        };
        request.nonce = Some(nonce.into());

        Ok(request)
    }
}

/// Transaction monitoring and management
pub struct TransactionManager {
    client: EVMClient,
}

impl TransactionManager {
    /// Create a new transaction manager
    pub fn new(client: EVMClient) -> Self {
        Self { client }
    }

    /// Send a transaction and wait for confirmation
    pub async fn send_and_wait(
        &self,
        tx: TransactionRequest,
        confirmations: usize,
        timeout: Option<u64>,
    ) -> Result<(TxHash, TransactionReceipt)> {
        let timeout_seconds = timeout.unwrap_or(self.client.config().timeout);
        let tx_hash = self.client.send_transaction(tx).await?;

        // Wait for transaction receipt
        let receipt = self.wait_for_transaction(tx_hash, confirmations, timeout_seconds).await?;
        Ok((tx_hash, receipt))
    }

    /// Wait for a transaction to be confirmed
    pub async fn wait_for_transaction(
        &self,
        tx_hash: TxHash,
        confirmations: usize,
        timeout_seconds: u64,
    ) -> Result<TransactionReceipt> {
        let start_time = SystemTime::now();
        let timeout_duration = std::time::Duration::from_secs(timeout_seconds);

        loop {
            // Check timeout
            if start_time.elapsed().unwrap_or_default() > timeout_duration {
                return Err(SDKError::Timeout(format!(
                    "Transaction {} not confirmed after {} seconds",
                    tx_hash, timeout_seconds
                )));
            }

            // Get transaction receipt
            if let Some(receipt) = self.client.get_transaction_receipt(tx_hash).await? {
                if let Some(block_number) = receipt.block_number {
                    let current_block = self.client.get_block_number().await?;
                    let confirmations_count = current_block.saturating_sub(block_number.as_u64());

                    if confirmations_count >= confirmations as u64 {
                        return Ok(receipt);
                    }
                }
            }

            // Wait before retrying
            tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        }
    }

    /// Get transaction status
    pub async fn get_transaction_status(&self, tx_hash: TxHash) -> Result<TransactionStatus> {
        let receipt = self.client.get_transaction_receipt(tx_hash).await?;

        if let Some(receipt) = receipt {
            if let Some(block_number) = receipt.block_number {
                let block_hash = receipt.block_hash.unwrap_or_default();
                let tx_index = receipt.transaction_index.unwrap_or_default().as_u64();

                if receipt.status.unwrap_or_default() == ethers_core::types::U64::from(1u64) {
                    Ok(TransactionStatus::Included {
                        block_number: block_number.as_u64(),
                        block_hash,
                        transaction_index: tx_index,
                    })
                } else {
                    Ok(TransactionStatus::Failed {
                        block_number: block_number.as_u64(),
                        block_hash,
                        transaction_index: tx_index,
                        error: None,
                    })
                }
            } else {
                Ok(TransactionStatus::Pending)
            }
        } else {
            // Check if transaction exists but doesn't have receipt yet
            let tx = self.client.get_transaction(tx_hash).await?;
            if tx.is_some() {
                Ok(TransactionStatus::Pending)
            } else {
                Err(SDKError::TransactionError(
                    "Transaction not found".to_string()
                ))
            }
        }
    }

    /// Replace a pending transaction with higher gas
    pub async fn replace_transaction(
        &self,
        original_tx_hash: TxHash,
        new_gas_price: U256,
        new_value: Option<U256>,
    ) -> Result<TxHash> {
        // Get original transaction
        let original_tx = self.client.get_transaction(original_tx_hash).await?
            .ok_or_else(|| SDKError::TransactionError("Original transaction not found".to_string()))?;

        // Check if transaction is still pending
        if self.client.get_transaction_receipt(original_tx_hash).await?.is_some() {
            return Err(SDKError::TransactionError(
                "Cannot replace confirmed transaction".to_string()
            ));
        }

        // Create replacement transaction
        let mut builder = TransactionBuilder::new()
            .to(original_tx.to.unwrap_or_default())
            .nonce(original_tx.nonce.unwrap_or_default().as_u64());

        // Set new value or keep original
        if let Some(value) = new_value {
            builder = builder.value(value);
        } else {
            builder = builder.value(original_tx.value.unwrap_or_default());
        }

        // Set new gas price
        builder = builder.gas_price(new_gas_price);

        // Keep original data
        if let Some(data) = original_tx.input {
            builder = builder.data(data);
        }

        let tx = builder.build(&self.client).await?;
        self.client.send_transaction(tx).await
    }

    /// Cancel a pending transaction
    pub async fn cancel_transaction(&self, original_tx_hash: TxHash, new_gas_price: U256) -> Result<TxHash> {
        // Get original transaction
        let original_tx = self.client.get_transaction(original_tx_hash).await?
            .ok_or_else(|| SDKError::TransactionError("Original transaction not found".to_string()))?;

        // Check if transaction is still pending
        if self.client.get_transaction_receipt(original_tx_hash).await?.is_some() {
            return Err(SDKError::TransactionError(
                "Cannot cancel confirmed transaction".to_string()
            ));
        }

        // Create cancellation transaction (same nonce, zero value to self)
        let from = if let Some(wallet) = self.client.wallet() {
            wallet.address()
        } else {
            return Err(SDKError::NoWallet("Wallet required for transaction cancellation".to_string()));
        };

        let tx = TransactionBuilder::new()
            .to(from) // Send to self
            .value(U256::zero())
            .nonce(original_tx.nonce.unwrap_or_default().as_u64())
            .gas_price(new_gas_price)
            .build(&self.client)
            .await?;

        self.client.send_transaction(tx).await
    }
}

/// Gas estimation utilities
pub struct GasEstimator {
    client: EVMClient,
}

impl GasEstimator {
    /// Create a new gas estimator
    pub fn new(client: EVMClient) -> Self {
        Self { client }
    }

    /// Estimate gas for a transaction
    pub async fn estimate_gas(&self, tx: &TransactionRequest) -> Result<u64> {
        let gas_limit = self.client.estimate_gas(tx).await?;
        Ok(gas_limit.as_u64())
    }

    /// Estimate gas with safety margin
    pub async fn estimate_gas_with_margin(
        &self,
        tx: &TransactionRequest,
        margin_percentage: f64,
    ) -> Result<u64> {
        let base_gas = self.estimate_gas(tx).await?;
        let margin = (base_gas as f64 * margin_percentage / 100.0) as u64;
        Ok(base_gas + margin)
    }

    /// Get current gas price
    pub async fn get_gas_price(&self) -> Result<U256> {
        self.client.get_gas_price().await
    }

    /// Get gas price with safety margin
    pub async fn get_gas_price_with_margin(&self, margin_percentage: f64) -> Result<U256> {
        let base_price = self.get_gas_price().await?;
        let margin = (base_price.as_u128() as f64 * margin_percentage / 100.0) as u128;
        Ok(U256::from(base_price.as_u128() + margin))
    }

    /// Get EIP-1559 gas parameters
    pub async fn get_eip1559_fees(&self) -> Result<EIP1559Fees> {
        let block = self.client.get_block_by_number(BlockNumber::Latest).await?
            .ok_or_else(|| SDKError::RPCError("Failed to get latest block".to_string()))?;

        let base_fee = block.base_fee_per_gas.unwrap_or_default();

        // Use 1 gwei as default priority fee (should be calculated from network)
        let max_priority_fee_per_gas = U256::from(1_000_000_000u64);
        let max_fee_per_gas = base_fee + max_priority_fee_per_gas;

        Ok(EIP1559Fees {
            base_fee,
            max_fee_per_gas,
            max_priority_fee_per_gas,
        })
    }
}

/// EIP-1559 fee parameters
#[derive(Debug, Clone)]
pub struct EIP1559Fees {
    /// Base fee per gas
    pub base_fee: U256,
    /// Maximum fee per gas
    pub max_fee_per_gas: U256,
    /// Maximum priority fee per gas
    pub max_priority_fee_per_gas: U256,
}

/// Utility functions for transaction handling
pub mod utils {
    use super::*;
    use ethers_core::utils::parse_ether;

    /// Create a simple ETH transfer transaction
    pub fn create_eth_transfer(to: Address, amount: &str) -> TransactionBuilder {
        let value = parse_ether(amount)
            .expect("Invalid ETH amount");

        TransactionBuilder::new()
            .to(to)
            .value(value)
    }

    /// Create a contract interaction transaction
    pub fn create_contract_call(
        contract_address: Address,
        data: Bytes,
        value: Option<U256>,
    ) -> TransactionBuilder {
        let mut builder = TransactionBuilder::new()
            .to(contract_address)
            .data(data);

        if let Some(v) = value {
            builder = builder.value(v);
        }

        builder
    }

    /// Calculate transaction fee
    pub fn calculate_transaction_fee(gas_used: U256, gas_price: U256) -> U256 {
        gas_used * gas_price
    }

    /// Format transaction fee for display
    pub fn format_transaction_fee(gas_used: U256, gas_price: U256) -> String {
        let fee_wei = calculate_transaction_fee(gas_used, gas_price);
        ethers_core::utils::format_ether(fee_wei).to_string()
    }

    /// Check if a transaction is EIP-1559
    pub fn is_eip1559_transaction(tx: &TransactionRequest) -> bool {
        tx.max_fee_per_gas.is_some() || tx.max_priority_fee_per_gas.is_some()
    }

    /// Convert transaction to JSON string for debugging
    pub fn transaction_to_debug_string(tx: &TransactionRequest) -> Result<String> {
        serde_json::to_string_pretty(tx)
            .map_err(|e| SDKError::SerializationError(format!("Failed to serialize transaction: {}", e)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::evm::utils::generate_random_address;

    #[test]
    fn test_transaction_builder() {
        let to = generate_random_address();
        let value = U256::from(1000000000000000000u64); // 1 ETH

        let builder = TransactionBuilder::new()
            .to(to)
            .value(value)
            .gas_limit(21000)
            .nonce(42);

        assert_eq!(builder.request.to, Some(to.into()));
        assert_eq!(builder.request.value, Some(value));
        assert_eq!(builder.gas_limit, Some(21000));
        assert_eq!(builder.nonce, Some(42));
    }

    #[test]
    fn test_create_eth_transfer() {
        let to = generate_random_address();
        let builder = utils::create_eth_transfer(to, "1.5");

        assert_eq!(builder.request.to, Some(to.into()));
        // Should be 1.5 ETH in wei
        assert_eq!(builder.request.value.unwrap(), ethers_core::utils::parse_ether("1.5").unwrap());
    }

    #[test]
    fn test_create_contract_call() {
        let contract = generate_random_address();
        let data = Bytes::from(vec![1, 2, 3, 4]);
        let value = U256::from(500000000000000000u64); // 0.5 ETH

        let builder = utils::create_contract_call(contract, data.clone(), Some(value));

        assert_eq!(builder.request.to, Some(contract.into()));
        assert_eq!(builder.request.data, Some(data));
        assert_eq!(builder.request.value, Some(value));
    }

    #[test]
    fn test_calculate_transaction_fee() {
        let gas_used = U256::from(21000u64);
        let gas_price = U256::from(20000000000u64); // 20 gwei

        let fee = utils::calculate_transaction_fee(gas_used, gas_price);
        assert_eq!(fee, U256::from(420000000000000u64)); // 21000 * 20 gwei
    }

    #[test]
    fn test_is_eip1559_transaction() {
        let mut tx = TransactionRequest::default();

        // Legacy transaction
        tx.gas_price = Some(U256::from(20000000000u64));
        assert!(!utils::is_eip1559_transaction(&tx));

        // EIP-1559 transaction
        tx.gas_price = None;
        tx.max_fee_per_gas = Some(U256::from(30000000000u64));
        assert!(utils::is_eip1559_transaction(&tx));
    }
}