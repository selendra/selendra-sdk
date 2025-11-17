//! Type definitions for Substrate interactions

use sp_core::{crypto::AccountId32, H256};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Balance type (u128)
pub type Balance = u128;

/// Account information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountInfo {
    pub nonce: u32,
    pub consumers: u32,
    pub providers: u32,
    pub sufficients: u32,
    pub data: AccountData,
}

/// Account data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountData {
    pub free: Balance,
    pub reserved: Balance,
    pub free_frozen: Balance,
    pub reserved_frozen: Balance,
    pub flags: u128,
}

/// Block information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockInfo {
    pub hash: H256,
    pub number: u64,
    pub parent_hash: H256,
    pub state_root: H256,
    pub extrinsics_root: H256,
}

/// Chain information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainInfo {
    pub chain_name: String,
    pub version: u32,
    pub properties: HashMap<String, String>,
}

/// Staking information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingInfo {
    pub bonded: Option<AccountId32>,
    pub minimum_validator_count: u32,
    pub sessions_per_era: u32,
}

/// Transaction status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionStatus {
    Pending,
    InBlock { block_hash: H256 },
    Finalized { block_hash: H256 },
    Error(String),
}

/// Metadata version information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetadataVersion {
    pub spec_version: u32,
    pub transaction_version: u32,
    pub metadata_version: u32,
}
// ============================================================================
// Task 1.5: Type Conversions (Helper functions instead of orphan trait implementations)
// ============================================================================

// Note: Direct trait implementations for external types (sp_core::crypto::AccountId32,
// selendra_client types) are orphan implementations and not allowed.
// Use conversion helper functions in the substrate client module instead.
