//! Unified client for both Substrate and EVM chains

use crate::types::{Result, Error, Network, ChainType};
use crate::evm::{EVMClient, EVMConfig};
use crate::substrate::{Connection as SubstrateConnection};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Unified SDK client
pub struct SelendraSDK {
    substrate_client: Option<Arc<RwLock<SubstrateConnection>>>,
    evm_client: Option<Arc<RwLock<EVMClient>>>,
    network: Network,
}

impl SelendraSDK {
    /// Create a new unified SDK client
    pub async fn new(
        substrate_url: Option<String>,
        evm_url: Option<String>,
        network: Network,
    ) -> Result<Self> {
        let mut substrate_client = None;
        let mut evm_client = None;

        if let Some(url) = substrate_url {
            let conn = SubstrateConnection::new(&url).await?;
            substrate_client = Some(Arc::new(RwLock::new(conn)));
        }

        if let Some(url) = evm_url {
            let config = EVMConfig::new(&url);
            let client = EVMClient::new(config).await?;
            evm_client = Some(Arc::new(RwLock::new(client)));
        }

        Ok(Self {
            substrate_client,
            evm_client,
            network,
        })
    }

    /// Get the substrate client
    pub fn substrate(&self) -> Option<&Arc<RwLock<SubstrateConnection>>> {
        self.substrate_client.as_ref()
    }

    /// Get the EVM client
    pub fn evm(&self) -> Option<&Arc<RwLock<EVMClient>>> {
        self.evm_client.as_ref()
    }

    /// Get the network configuration
    pub fn network(&self) -> &Network {
        &self.network
    }

    /// Check if substrate client is available
    pub fn has_substrate(&self) -> bool {
        self.substrate_client.is_some()
    }

    /// Check if EVM client is available
    pub fn has_evm(&self) -> bool {
        self.evm_client.is_some()
    }
}

/// SDK builder
pub struct SDKBuilder {
    substrate_url: Option<String>,
    evm_url: Option<String>,
    network: Network,
}

impl SDKBuilder {
    /// Create a new SDK builder
    pub fn new() -> Self {
        Self {
            substrate_url: None,
            evm_url: None,
            network: Network::Selendra,
        }
    }

    /// Set substrate endpoint
    pub fn substrate_endpoint(mut self, url: &str) -> Self {
        self.substrate_url = Some(url.to_string());
        self
    }

    /// Set EVM endpoint
    pub fn evm_endpoint(mut self, url: &str) -> Self {
        self.evm_url = Some(url.to_string());
        self
    }

    /// Set network
    pub fn network(mut self, network: Network) -> Self {
        self.network = network;
        self
    }

    /// Build the SDK
    pub async fn build(self) -> Result<SelendraSDK> {
        SelendraSDK::new(self.substrate_url, self.evm_url, self.network).await
    }
}

impl Default for SDKBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Cross-chain operations
pub struct CrossChainOperations {
    sdk: Arc<SelendraSDK>,
}

impl CrossChainOperations {
    /// Create new cross-chain operations
    pub fn new(sdk: Arc<SelendraSDK>) -> Self {
        Self { sdk }
    }

    /// Get unified balance across all chains
    pub async fn get_unified_balance(&self, address: &str) -> Result<UnifiedBalance> {
        let mut substrate_balance = None;
        let mut evm_balance = None;

        if self.sdk.has_substrate() {
            // Get substrate balance
            substrate_balance = Some(0u128); // Placeholder
        }

        if self.sdk.has_evm() {
            // Get EVM balance
            evm_balance = Some(0u128); // Placeholder
        }

        Ok(UnifiedBalance {
            address: address.to_string(),
            substrate_balance,
            evm_balance,
            total_balance: substrate_balance.unwrap_or(0) + evm_balance.unwrap_or(0),
        })
    }

    /// Bridge assets from substrate to EVM
    pub async fn bridge_to_evm(
        &self,
        amount: u128,
        to_address: &str,
    ) -> Result<CrossChainTransaction> {
        // Implementation would handle the bridge operation
        Ok(CrossChainTransaction {
            id: format!("bridge_{}", uuid::Uuid::new_v4()),
            from_chain: ChainType::Substrate,
            to_chain: ChainType::EVM,
            amount,
            status: TransactionStatus::Pending,
        })
    }

    /// Bridge assets from EVM to substrate
    pub async fn bridge_to_substrate(
        &self,
        amount: u128,
        to_address: &str,
    ) -> Result<CrossChainTransaction> {
        // Implementation would handle the bridge operation
        Ok(CrossChainTransaction {
            id: format!("bridge_{}", uuid::Uuid::new_v4()),
            from_chain: ChainType::EVM,
            to_chain: ChainType::Substrate,
            amount,
            status: TransactionStatus::Pending,
        })
    }
}

/// Unified balance information
#[derive(Debug, Clone)]
pub struct UnifiedBalance {
    /// Address
    pub address: String,
    /// Substrate balance
    pub substrate_balance: Option<u128>,
    /// EVM balance
    pub evm_balance: Option<u128>,
    /// Total balance (sum of all chains)
    pub total_balance: u128,
}

/// Cross-chain transaction
#[derive(Debug, Clone)]
pub struct CrossChainTransaction {
    /// Transaction ID
    pub id: String,
    /// Source chain
    pub from_chain: ChainType,
    /// Destination chain
    pub to_chain: ChainType,
    /// Amount
    pub amount: u128,
    /// Transaction status
    pub status: TransactionStatus,
}

/// Transaction status for cross-chain operations
#[derive(Debug, Clone)]
pub enum TransactionStatus {
    /// Pending
    Pending,
    /// In progress
    InProgress,
    /// Completed
    Completed,
    /// Failed
    Failed(String),
}