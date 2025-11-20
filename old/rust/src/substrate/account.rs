//! Account management for Substrate chains

use crate::types::{Result, SDKError};
use sp_core::{sr25519, Pair};
use sp_runtime::AccountId32;
use std::collections::HashMap;

/// Account manager
pub struct AccountManager {
    accounts: HashMap<AccountId32, AccountData>,
}

impl AccountManager {
    /// Create a new account manager
    pub fn new() -> Self {
        Self {
            accounts: HashMap::new(),
        }
    }

    /// Add an account
    pub fn add_account(&mut self, account_id: AccountId32, data: AccountData) {
        self.accounts.insert(account_id, data);
    }

    /// Get account data
    pub fn get_account(&self, account_id: &AccountId32) -> Option<&AccountData> {
        self.accounts.get(account_id)
    }

    /// Remove an account
    pub fn remove_account(&mut self, account_id: &AccountId32) -> Option<AccountData> {
        self.accounts.remove(account_id)
    }

    /// List all accounts
    pub fn list_accounts(&self) -> Vec<&AccountId32> {
        self.accounts.keys().collect()
    }
}

/// Account data
#[derive(Clone)]
pub struct AccountData {
    /// Account keypair
    pub keypair: sr25519::Pair,
    /// Account nonce
    pub nonce: u32,
    /// Additional metadata
    pub metadata: AccountMetadata,
}

impl std::fmt::Debug for AccountData {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AccountData")
            .field("nonce", &self.nonce)
            .field("metadata", &self.metadata)
            .finish()
    }
}

/// Account metadata
#[derive(Debug, Clone)]
pub struct AccountMetadata {
    /// Account name
    pub name: Option<String>,
    /// Account description
    pub description: Option<String>,
    /// Creation timestamp
    pub created_at: Option<u64>,
}

impl AccountMetadata {
    /// Create new account metadata
    pub fn new() -> Self {
        Self {
            name: None,
            description: None,
            created_at: None,
        }
    }
}

/// Account utility functions
pub struct AccountUtils;

impl AccountUtils {
    /// Generate a new account
    pub fn generate() -> Result<(AccountId32, sr25519::Pair)> {
        let (keypair, _seed) = sr25519::Pair::generate();
        let account_id = keypair.public().into();
        Ok((account_id, keypair))
    }

    /// Create account from seed
    pub fn from_seed(seed: &str) -> Result<(AccountId32, sr25519::Pair)> {
        let keypair = sr25519::Pair::from_string(seed, None)
            .map_err(|e| SDKError::Account(format!("Invalid seed: {:?}", e)))?;
        let account_id = keypair.public().into();
        Ok((account_id, keypair))
    }

    /// Create account from mnemonic
    pub fn from_mnemonic(mnemonic: &str) -> Result<(AccountId32, sr25519::Pair)> {
        // Implementation would handle BIP39 mnemonic
        Self::from_seed(mnemonic) // Simplified
    }

    /// Get account ID from public key
    pub fn account_id_from_public(public: &sr25519::Public) -> AccountId32 {
        (*public).into()
    }

    /// Verify signature
    pub fn verify_signature(
        message: &[u8],
        signature: &sr25519::Signature,
        public: &sr25519::Public,
    ) -> bool {
        sp_core::sr25519::Pair::verify(signature, message, public)
    }

    /// Sign message
    pub fn sign_message(keypair: &sr25519::Pair, message: &[u8]) -> Result<sr25519::Signature> {
        Ok(keypair.sign(message))
    }
}

/// Account balance tracking
pub struct BalanceTracker {
    balances: HashMap<AccountId32, u128>,
}

impl BalanceTracker {
    /// Create a new balance tracker
    pub fn new() -> Self {
        Self {
            balances: HashMap::new(),
        }
    }

    /// Set balance for an account
    pub fn set_balance(&mut self, account_id: AccountId32, balance: u128) {
        self.balances.insert(account_id, balance);
    }

    /// Get balance for an account
    pub fn get_balance(&self, account_id: &AccountId32) -> Option<u128> {
        self.balances.get(account_id).copied()
    }

    /// Update balance
    pub fn update_balance(&mut self, account_id: &AccountId32, change: i128) -> Result<()> {
        let current = self.balances.get(account_id).copied().unwrap_or(0);
        let new_balance = (current as i128 + change) as u128;
        self.balances.insert(account_id.clone(), new_balance);
        Ok(())
    }
}