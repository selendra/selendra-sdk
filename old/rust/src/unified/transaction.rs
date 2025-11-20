//! Unified transaction handling for both Substrate and EVM

use crate::types::{Result, Error, ChainType};
use sp_core::H256;
use ethers_core::types::Transaction as EvmTransaction;
use serde::{Deserialize, Serialize};

/// Unified transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedTransaction {
    /// Transaction ID
    pub id: String,
    /// Chain type
    pub chain_type: ChainType,
    /// Transaction data
    pub data: TransactionData,
    /// Status
    pub status: TransactionStatus,
    /// Created at
    pub created_at: u64,
    /// Updated at
    pub updated_at: u64,
}

/// Transaction data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionData {
    /// Substrate transaction
    Substrate(SubstrateTransactionData),
    /// EVM transaction
    EVM(EvmTransactionData),
}

/// Substrate transaction data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubstrateTransactionData {
    /// Extrinsic hash
    pub hash: H256,
    /// Block hash
    pub block_hash: Option<H256>,
    /// Call data
    pub call_data: Vec<u8>,
    /// Signature
    pub signature: Option<Vec<u8>>,
    /// Nonce
    pub nonce: u32,
    /// Fee
    pub fee: Option<u128>,
}

/// EVM transaction data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvmTransactionData {
    /// Transaction hash
    pub hash: H256,
    /// Block hash
    pub block_hash: Option<H256>,
    /// Block number
    pub block_number: Option<u64>,
    /// From address
    pub from: String,
    /// To address
    pub to: Option<String>,
    /// Value
    pub value: String,
    /// Gas price
    pub gas_price: Option<String>,
    /// Gas limit
    pub gas_limit: Option<u64>,
    /// Input data
    pub input: String,
    /// Nonce
    pub nonce: u64,
}

/// Transaction status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionStatus {
    /// Pending
    Pending,
    /// Included in block
    Included { block_hash: H256 },
    /// Finalized
    Finalized { block_hash: H256 },
    /// Failed
    Failed { reason: String },
}

/// Transaction builder
pub struct TransactionBuilder {
    chain_type: ChainType,
    data: Option<TransactionData>,
}

impl TransactionBuilder {
    /// Create a new transaction builder
    pub fn new(chain_type: ChainType) -> Self {
        Self {
            chain_type,
            data: None,
        }
    }

    /// Build for Substrate
    pub fn substrate(mut self, hash: H256, call_data: Vec<u8>, nonce: u32) -> Self {
        self.data = Some(TransactionData::Substrate(SubstrateTransactionData {
            hash,
            block_hash: None,
            call_data,
            signature: None,
            nonce,
            fee: None,
        }));
        self
    }

    /// Build for EVM
    pub fn evm(mut self, hash: H256, from: String, to: Option<String>, value: String, nonce: u64) -> Self {
        self.data = Some(TransactionData::EVM(EvmTransactionData {
            hash,
            block_hash: None,
            block_number: None,
            from,
            to,
            value,
            gas_price: None,
            gas_limit: None,
            input: String::new(),
            nonce,
        }));
        self
    }

    /// Build the transaction
    pub fn build(self) -> Result<UnifiedTransaction> {
        let data = self.data.ok_or_else(|| {
            Error::Transaction("Transaction data not set".to_string())
        })?;

        Ok(UnifiedTransaction {
            id: format!("tx_{}", uuid::Uuid::new_v4()),
            chain_type: self.chain_type,
            data,
            status: TransactionStatus::Pending,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            updated_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }
}

/// Transaction manager
pub struct TransactionManager {
    transactions: std::collections::HashMap<String, UnifiedTransaction>,
}

impl TransactionManager {
    /// Create a new transaction manager
    pub fn new() -> Self {
        Self {
            transactions: std::collections::HashMap::new(),
        }
    }

    /// Add a transaction
    pub fn add_transaction(&mut self, transaction: UnifiedTransaction) -> Result<()> {
        self.transactions.insert(transaction.id.clone(), transaction);
        Ok(())
    }

    /// Get a transaction
    pub fn get_transaction(&self, id: &str) -> Option<&UnifiedTransaction> {
        self.transactions.get(id)
    }

    /// Update transaction status
    pub fn update_status(&mut self, id: &str, status: TransactionStatus) -> Result<()> {
        if let Some(tx) = self.transactions.get_mut(id) {
            tx.status = status;
            tx.updated_at = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            Ok(())
        } else {
            Err(Error::Transaction(format!("Transaction {} not found", id)))
        }
    }

    /// List all transactions
    pub fn list_transactions(&self) -> Vec<&UnifiedTransaction> {
        self.transactions.values().collect()
    }

    /// Filter transactions by status
    pub fn filter_by_status(&self, status: &TransactionStatus) -> Vec<&UnifiedTransaction> {
        self.transactions
            .values()
            .filter(|tx| std::mem::discriminant(&tx.status) == std::mem::discriminant(status))
            .collect()
    }

    /// Filter transactions by chain type
    pub fn filter_by_chain_type(&self, chain_type: ChainType) -> Vec<&UnifiedTransaction> {
        self.transactions
            .values()
            .filter(|tx| tx.chain_type == chain_type)
            .collect()
    }
}

/// Transaction executor
pub struct TransactionExecutor {
    manager: TransactionManager,
}

impl TransactionExecutor {
    /// Create a new transaction executor
    pub fn new() -> Self {
        Self {
            manager: TransactionManager::new(),
        }
    }

    /// Execute a substrate transaction
    pub async fn execute_substrate(
        &mut self,
        call_data: Vec<u8>,
        nonce: u32,
    ) -> Result<String> {
        // Implementation would execute the substrate transaction
        let tx = TransactionBuilder::new(ChainType::Substrate)
            .substrate(H256::random(), call_data, nonce)
            .build()?;

        let id = tx.id.clone();
        self.manager.add_transaction(tx)?;
        Ok(id)
    }

    /// Execute an EVM transaction
    pub async fn execute_evm(
        &mut self,
        from: String,
        to: Option<String>,
        value: String,
        nonce: u64,
    ) -> Result<String> {
        // Implementation would execute the EVM transaction
        let tx = TransactionBuilder::new(ChainType::EVM)
            .evm(H256::random(), from, to, value, nonce)
            .build()?;

        let id = tx.id.clone();
        self.manager.add_transaction(tx)?;
        Ok(id)
    }

    /// Get transaction manager
    pub fn manager(&self) -> &TransactionManager {
        &self.manager
    }

    /// Get mutable transaction manager
    pub fn manager_mut(&mut self) -> &mut TransactionManager {
        &mut self.manager
    }
}