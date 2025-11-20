//! Unified balance handling for both Substrate and EVM chains

use crate::types::{Result, Error, ChainType};
use sp_core::crypto::AccountId32;
use ethers_core::types::{Address, U256};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Unified balance manager
pub struct BalanceManager {
    balances: HashMap<String, UnifiedBalance>,
}

impl BalanceManager {
    /// Create a new balance manager
    pub fn new() -> Self {
        Self {
            balances: HashMap::new(),
        }
    }

    /// Add or update a balance
    pub fn update_balance(&mut self, address: String, balance: UnifiedBalance) {
        self.balances.insert(address, balance);
    }

    /// Get balance for an address
    pub fn get_balance(&self, address: &str) -> Option<&UnifiedBalance> {
        self.balances.get(address)
    }

    /// Get all balances
    pub fn get_all_balances(&self) -> &HashMap<String, UnifiedBalance> {
        &self.balances
    }

    /// Remove balance
    pub fn remove_balance(&mut self, address: &str) -> Option<UnifiedBalance> {
        self.balances.remove(address)
    }
}

/// Unified balance information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedBalance {
    /// Address
    pub address: String,
    /// Substrate balance
    pub substrate_balance: Option<ChainBalance>,
    /// EVM balance
    pub evm_balance: Option<ChainBalance>,
    /// Total balance in USD (if available)
    pub total_usd: Option<f64>,
    /// Last updated timestamp
    pub last_updated: u64,
}

impl UnifiedBalance {
    /// Create a new unified balance
    pub fn new(address: String) -> Self {
        Self {
            address,
            substrate_balance: None,
            evm_balance: None,
            total_usd: None,
            last_updated: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    /// Set substrate balance
    pub fn with_substrate_balance(mut self, balance: u128, decimals: u8, symbol: String) -> Self {
        self.substrate_balance = Some(ChainBalance {
            amount: balance,
            decimals,
            symbol,
            usd_value: None,
        });
        self
    }

    /// Set EVM balance
    pub fn with_evm_balance(mut self, balance: U256, decimals: u8, symbol: String) -> Self {
        self.evm_balance = Some(ChainBalance {
            amount: balance.as_u128(),
            decimals,
            symbol,
            usd_value: None,
        });
        self
    }

    /// Get total balance across all chains
    pub fn get_total_balance(&self) -> u128 {
        let mut total = 0u128;
        if let Some(ref sb) = self.substrate_balance {
            total += sb.amount;
        }
        if let Some(ref eb) = self.evm_balance {
            total += eb.amount;
        }
        total
    }

    /// Get balance for specific chain
    pub fn get_chain_balance(&self, chain_type: ChainType) -> Option<&ChainBalance> {
        match chain_type {
            ChainType::Substrate => self.substrate_balance.as_ref(),
            ChainType::EVM => self.evm_balance.as_ref(),
            ChainType::Hybrid => None,
        }
    }
}

/// Chain-specific balance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainBalance {
    /// Amount in the smallest unit
    pub amount: u128,
    /// Number of decimals
    pub decimals: u8,
    /// Token symbol
    pub symbol: String,
    /// USD value (if available)
    pub usd_value: Option<f64>,
}

impl ChainBalance {
    /// Create a new chain balance
    pub fn new(amount: u128, decimals: u8, symbol: String) -> Self {
        Self {
            amount,
            decimals,
            symbol,
            usd_value: None,
        }
    }

    /// Get formatted balance string
    pub fn to_formatted_string(&self) -> String {
        let divisor = 10u128.pow(self.decimals as u32);
        let integer_part = self.amount / divisor;
        let fractional_part = self.amount % divisor;
        format!(
            "{}.{:0width$} {}",
            integer_part,
            fractional_part,
            self.symbol,
            width = self.decimals as usize
        )
    }

    /// Convert to floating point value
    pub fn to_f64(&self) -> f64 {
        let divisor = 10u128.pow(self.decimals as u32) as f64;
        self.amount as f64 / divisor
    }
}

/// Balance query service
pub struct BalanceQueryService {
    substrate_endpoint: Option<String>,
    evm_endpoint: Option<String>,
}

impl BalanceQueryService {
    /// Create a new balance query service
    pub fn new(substrate_endpoint: Option<String>, evm_endpoint: Option<String>) -> Self {
        Self {
            substrate_endpoint,
            evm_endpoint,
        }
    }

    /// Query balance for substrate address
    pub async fn query_substrate_balance(&self, account_id: &AccountId32) -> Result<ChainBalance> {
        // Implementation would query the actual balance from the chain
        Ok(ChainBalance::new(0, 18, "SEL".to_string())) // Placeholder
    }

    /// Query balance for EVM address
    pub async fn query_evm_balance(&self, address: &Address) -> Result<ChainBalance> {
        // Implementation would query the actual balance from the chain
        Ok(ChainBalance::new(0, 18, "ETH".to_string())) // Placeholder
    }

    /// Query unified balance
    pub async fn query_unified_balance(
        &self,
        substrate_address: Option<&AccountId32>,
        evm_address: Option<&Address>,
    ) -> Result<UnifiedBalance> {
        let mut balance = UnifiedBalance::new(
            substrate_address
                .map(|id| id.to_ss58check())
                .or_else(|| evm_address.map(|addr| format!("{:?}", addr)))
                .unwrap_or_default(),
        );

        if let (Some(substrate_addr), Some(_)) = (substrate_address, &self.substrate_endpoint) {
            let sb = self.query_substrate_balance(substrate_addr).await?;
            balance.substrate_balance = Some(sb);
        }

        if let (Some(evm_addr), Some(_)) = (evm_address, &self.evm_endpoint) {
            let eb = self.query_evm_balance(evm_addr).await?;
            balance.evm_balance = Some(eb);
        }

        Ok(balance)
    }
}

/// Balance cache
pub struct BalanceCache {
    cache: HashMap<String, CachedBalance>,
    ttl_seconds: u64,
}

impl BalanceCache {
    /// Create a new balance cache
    pub fn new(ttl_seconds: u64) -> Self {
        Self {
            cache: HashMap::new(),
            ttl_seconds,
        }
    }

    /// Get cached balance
    pub fn get(&self, key: &str) -> Option<&CachedBalance> {
        if let Some(cached) = self.cache.get(key) {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();

            if now - cached.timestamp < self.ttl_seconds {
                return Some(cached);
            }
        }
        None
    }

    /// Set cached balance
    pub fn set(&mut self, key: String, balance: UnifiedBalance) {
        let cached = CachedBalance {
            balance,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        self.cache.insert(key, cached);
    }

    /// Clear expired entries
    pub fn clear_expired(&mut self) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.cache.retain(|_, cached| now - cached.timestamp < self.ttl_seconds);
    }
}

/// Cached balance entry
#[derive(Debug, Clone)]
pub struct CachedBalance {
    pub balance: UnifiedBalance,
    pub timestamp: u64,
}