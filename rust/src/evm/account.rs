//! EVM Account Management
//!
//! This module provides comprehensive account management functionality for EVM operations,
//! including wallet creation, signing, and account utilities.

use crate::types::{Result, SDKError};
use ethers_core::{
    types::{
        Address, U256, H256, Bytes, TransactionRequest, Signature,
        hash_message, keccak256,
    },
    utils::{to_checksum, hex},
    rand::thread_rng,
};
use ethers_signers::{
    Signer, Wallet, MnemonicBuilder, coins_bip39::{Mnemonic, English},
    SignerMiddleware, LocalWallet,
};
use ethers_providers::{Provider, Http, Middleware};
use std::convert::TryFrom;
use std::str::FromStr;
use std::path::Path;
use serde::{Serialize, Deserialize};
use std::fs;

/// Account information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountInfo {
    /// Account address
    pub address: Address,
    /// Account nonce
    pub nonce: Option<u64>,
    /// Account balance in wei
    pub balance: Option<U256>,
    /// Account code hash
    pub code_hash: Option<H256>,
    /// Whether the account is a contract
    pub is_contract: Option<bool>,
}

/// Wallet types supported by the SDK
#[derive(Debug, Clone)]
pub enum WalletType {
    /// Private key wallet
    PrivateKey(String),
    /// Mnemonic phrase wallet
    Mnemonic { phrase: String, derivation_path: Option<String> },
    /// JSON keystore wallet
    Keystore { keystore_path: String, password: String },
}

/// Enhanced wallet wrapper
#[derive(Clone)]
pub struct EVMWallet {
    wallet: LocalWallet,
    chain_id: Option<u64>,
}

impl EVMWallet {
    /// Create wallet from private key
    pub fn from_private_key(private_key: &str, chain_id: Option<u64>) -> Result<Self> {
        let mut wallet: LocalWallet = private_key.parse()
            .map_err(|e| SDKError::InvalidKey(format!("Invalid private key: {}", e)))?;

        if let Some(chain_id) = chain_id {
            wallet = wallet.with_chain_id(chain_id);
        }

        Ok(Self { wallet, chain_id })
    }

    /// Create wallet from mnemonic phrase
    pub fn from_mnemonic(
        phrase: &str,
        derivation_path: Option<&str>,
        chain_id: Option<u64>,
    ) -> Result<Self> {
        let builder = MnemonicBuilder::<English>::default()
            .phrase(phrase);

        let builder = if let Some(path) = derivation_path {
            builder.derivation_path(path)
        } else {
            builder.index(0u32) // Default to first account
        };

        let mut wallet = builder.build()
            .map_err(|e| SDKError::InvalidKey(format!("Invalid mnemonic: {}", e)))?;

        if let Some(chain_id) = chain_id {
            wallet = wallet.with_chain_id(chain_id);
        }

        Ok(Self { wallet, chain_id })
    }

    /// Create wallet from JSON keystore
    pub fn from_keystore(
        keystore_path: &str,
        password: &str,
        chain_id: Option<u64>,
    ) -> Result<Self> {
        let keystore = fs::read_to_string(keystore_path)
            .map_err(|e| SDKError::IOError(format!("Failed to read keystore: {}", e)))?;

        let mut wallet = ethers_signers::encryptor::Kdf::keystore(&keystore, password)
            .and_then(|key| LocalWallet::from_key(&key))
            .map_err(|e| SDKError::InvalidKey(format!("Failed to decrypt keystore: {}", e)))?;

        if let Some(chain_id) = chain_id {
            wallet = wallet.with_chain_id(chain_id);
        }

        Ok(Self { wallet, chain_id })
    }

    /// Generate a new random wallet
    pub fn generate(chain_id: Option<u64>) -> Self {
        let mut wallet = LocalWallet::new(&mut thread_rng());

        if let Some(chain_id) = chain_id {
            wallet = wallet.with_chain_id(chain_id);
        }

        Self { wallet, chain_id }
    }

    /// Generate a new wallet from mnemonic
    pub fn generate_from_mnemonic(chain_id: Option<u64>) -> (Self, String) {
        let mnemonic = Mnemonic::new(&mut thread_rng());
        let phrase = mnemonic.to_string();

        let wallet = Self::from_mnemonic(&phrase, None, chain_id).unwrap();
        (wallet, phrase)
    }

    /// Get the wallet address
    pub fn address(&self) -> Address {
        self.wallet.address()
    }

    /// Get the checksum address
    pub fn checksum_address(&self) -> String {
        to_checksum(&self.address(), None)
    }

    /// Get the private key (as hex string)
    pub fn private_key(&self) -> String {
        hex::encode(self.wallet.signer().to_bytes())
    }

    /// Get the chain ID
    pub fn chain_id(&self) -> Option<u64> {
        self.chain_id
    }

    /// Set the chain ID
    pub fn set_chain_id(&mut self, chain_id: u64) {
        self.chain_id = Some(chain_id);
        self.wallet = self.wallet.with_chain_id(chain_id);
    }

    /// Sign a message
    pub fn sign_message(&self, message: &[u8]) -> Result<Signature> {
        self.wallet.sign_message(message)
            .map_err(|e| SDKError::SigningError(format!("Failed to sign message: {}", e)))
    }

    /// Sign a hash
    pub fn sign_hash(&self, hash: H256) -> Result<Signature> {
        self.wallet.sign_hash(hash)
            .map_err(|e| SDKError::SigningError(format!("Failed to sign hash: {}", e)))
    }

    /// Sign a transaction
    pub fn sign_transaction(&self, tx: &mut TransactionRequest) -> Result<()> {
        self.wallet.sign_transaction(tx)
            .map_err(|e| SDKError::SigningError(format!("Failed to sign transaction: {}", e)))
    }

    /// Verify a signature for a message
    pub fn verify_signature(&self, message: &[u8], signature: &Signature) -> bool {
        match self.wallet.recover(message, signature) {
            Ok(address) => address == self.address(),
            Err(_) => false,
        }
    }

    /// Convert to ethers LocalWallet
    pub fn to_ethers_wallet(self) -> LocalWallet {
        self.wallet
    }
}

/// Account manager for EVM operations
pub struct AccountManager {
    client: crate::evm::client::EVMClient,
}

impl AccountManager {
    /// Create a new account manager
    pub fn new(client: crate::evm::client::EVMClient) -> Self {
        Self { client }
    }

    /// Get account information
    pub async fn get_account_info(&self, address: Address) -> Result<AccountInfo> {
        let balance = Some(self.client.get_balance(address, None).await?);
        let nonce = Some(self.client.get_transaction_count(address, None).await?);
        let code_hash = {
            let code = self.client.get_code(address, None).await?;
            if !code.is_empty() {
                Some(H256::from_slice(&keccak256(&code)))
            } else {
                None
            }
        };
        let is_contract = Some(!code_hash.unwrap_or_default().is_zero());

        Ok(AccountInfo {
            address,
            nonce,
            balance,
            code_hash,
            is_contract,
        })
    }

    /// Get account balance
    pub async fn get_balance(&self, address: Address) -> Result<U256> {
        self.client.get_balance(address, None).await
    }

    /// Get account balance in ETH
    pub async fn get_balance_eth(&self, address: Address) -> Result<f64> {
        let balance_wei = self.get_balance(address).await?;
        let balance_eth = ethers_core::utils::format_ether(balance_wei);
        balance_eth.parse::<f64>()
            .map_err(|_| SDKError::ConversionError("Failed to convert balance to ETH".to_string()))
    }

    /// Get account nonce
    pub async fn get_nonce(&self, address: Address) -> Result<u64> {
        self.client.get_transaction_count(address, None).await
    }

    /// Check if account exists
    pub async fn account_exists(&self, address: Address) -> Result<bool> {
        let info = self.get_account_info(address).await?;
        match info.is_contract {
            Some(is_contract) => Ok(true), // Account exists
            None => {
                // Check if account has balance or non-zero nonce
                let has_balance = info.balance.unwrap_or_default() > U256::zero();
                let has_nonce = info.nonce.unwrap_or_default() > 0;
                Ok(has_balance || has_nonce)
            }
        }
    }

    /// Get multiple account balances
    pub async fn get_multiple_balances(&self, addresses: &[Address]) -> Result<Vec<(Address, U256)>> {
        let mut balances = Vec::new();

        for &address in addresses {
            let balance = self.get_balance(address).await?;
            balances.push((address, balance));
        }

        Ok(balances)
    }

    /// Get transaction history for an account
    pub async fn get_transaction_history(
        &self,
        address: Address,
        from_block: Option<u64>,
        to_block: Option<u64>,
    ) -> Result<Vec<TransactionRecord>> {
        // This is a simplified implementation
        // In a real implementation, you would query an Etherscan-like API or use event logs

        let mut transactions = Vec::new();

        // For now, return empty result as this would require additional infrastructure
        Ok(transactions)
    }
}

/// Transaction record for account history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionRecord {
    /// Transaction hash
    pub hash: H256,
    /// Block number (None if pending)
    pub block_number: Option<u64>,
    /// Transaction index in block
    pub transaction_index: Option<u64>,
    /// From address
    pub from: Address,
    /// To address (None for contract creation)
    pub to: Option<Address>,
    /// Value transferred
    pub value: U256,
    /// Gas price
    pub gas_price: Option<U256>,
    /// Gas used
    pub gas_used: Option<U256>,
    /// Gas limit
    pub gas_limit: U256,
    /// Transaction status (None if pending)
    pub status: Option<bool>,
    /// Timestamp
    pub timestamp: Option<u64>,
}

/// Multi-signature wallet support
pub struct MultiSigWallet {
    address: Address,
    required_signatures: u64,
    owners: Vec<Address>,
    client: crate::evm::client::EVMClient,
}

impl MultiSigWallet {
    /// Create a new multi-sig wallet instance
    pub fn new(
        address: Address,
        required_signatures: u64,
        owners: Vec<Address>,
        client: crate::evm::client::EVMClient,
    ) -> Self {
        Self {
            address,
            required_signatures,
            owners,
            client,
        }
    }

    /// Get the required number of signatures
    pub fn required_signatures(&self) -> u64 {
        self.required_signatures
    }

    /// Get the owners
    pub fn owners(&self) -> &[Address] {
        &self.owners
    }

    /// Check if an address is an owner
    pub fn is_owner(&self, address: Address) -> bool {
        self.owners.contains(&address)
    }

    /// Submit a transaction to the multi-sig wallet
    pub async fn submit_transaction(
        &self,
        to: Address,
        value: U256,
        data: Bytes,
    ) -> Result<H256> {
        // This would interact with the multi-sig contract
        // Implementation depends on the specific multi-sig contract ABI
        Err(SDKError::NotImplemented(
            "Multi-sig transaction submission not yet implemented".to_string()
        ))
    }

    /// Confirm a pending transaction
    pub async fn confirm_transaction(&self, transaction_id: U256) -> Result<H256> {
        // This would interact with the multi-sig contract
        Err(SDKError::NotImplemented(
            "Multi-sig transaction confirmation not yet implemented".to_string()
        ))
    }

    /// Execute a confirmed transaction
    pub async fn execute_transaction(&self, transaction_id: U256) -> Result<H256> {
        // This would interact with the multi-sig contract
        Err(SDKError::NotImplemented(
            "Multi-sig transaction execution not yet implemented".to_string()
        ))
    }
}

/// Hardware wallet support (future implementation)
#[cfg(feature = "hardware-wallets")]
pub mod hardware {
    use super::*;

    /// Hardware wallet types
    #[derive(Debug, Clone)]
    pub enum HardwareWalletType {
        Ledger,
        Trezor,
    }

    /// Hardware wallet interface
    pub trait HardwareWallet {
        /// Get the device type
        fn device_type(&self) -> HardwareWalletType;

        /// Get the address at the specified derivation path
        async fn get_address(&self, derivation_path: &str) -> Result<Address>;

        /// Sign a transaction
        async fn sign_transaction(&self, tx: &mut TransactionRequest) -> Result<()>;

        /// Sign a message
        async fn sign_message(&self, message: &[u8]) -> Result<Signature>;
    }
}

/// Utility functions for account operations
pub mod utils {
    use super::*;
    use ethers_core::k256::ecdsa::SigningKey;
    use std::fs::File;
    use std::io::Write;

    /// Validate an address format
    pub fn validate_address(address: &str) -> Result<Address> {
        Address::from_str(address)
            .map_err(|e| SDKError::InvalidAddress(format!("Invalid address format: {}", e)))
    }

    /// Check if two addresses are the same (case-insensitive)
    pub fn address_eq(addr1: Address, addr2: Address) -> bool {
        addr1 == addr2
    }

    /// Convert wei to ETH string
    pub fn wei_to_eth(wei: U256) -> String {
        ethers_core::utils::format_ether(wei)
    }

    /// Convert ETH string to wei
    pub fn eth_to_wei(eth: &str) -> Result<U256> {
        ethers_core::utils::parse_ether(eth)
            .map_err(|e| SDKError::ConversionError(format!("Invalid ETH amount: {}", e)))
    }

    /// Create a checksum address string
    pub fn checksum_address(address: Address) -> String {
        to_checksum(&address, None)
    }

    /// Validate private key format
    pub fn validate_private_key(private_key: &str) -> Result<()> {
        // Try to parse as a valid private key
        let _ = private_key.parse::<LocalWallet>()
            .map_err(|e| SDKError::InvalidKey(format!("Invalid private key: {}", e)))?;
        Ok(())
    }

    /// Generate a secure random private key
    pub fn generate_private_key() -> String {
        let wallet = LocalWallet::new(&mut thread_rng());
        hex::encode(wallet.signer().to_bytes())
    }

    /// Derive address from private key
    pub fn address_from_private_key(private_key: &str) -> Result<Address> {
        let wallet: LocalWallet = private_key.parse()
            .map_err(|e| SDKError::InvalidKey(format!("Invalid private key: {}", e)))?;
        Ok(wallet.address())
    }

    /// Save wallet to encrypted JSON keystore
    pub fn save_wallet_to_keystore(
        wallet: &EVMWallet,
        password: &str,
        path: &str,
    ) -> Result<()> {
        // This is a simplified implementation
        // In a real implementation, you would use proper key derivation and encryption
        let keystore_data = serde_json::json!({
            "address": wallet.checksum_address(),
            "private_key": wallet.private_key(),
            "chain_id": wallet.chain_id(),
            "version": 1
        });

        let file = File::create(path)
            .map_err(|e| SDKError::IOError(format!("Failed to create keystore file: {}", e)))?;

        serde_json::to_writer_pretty(file, &keystore_data)
            .map_err(|e| SDKError::SerializationError(format!("Failed to write keystore: {}", e)))
    }

    /// Load wallet from encrypted JSON keystore
    pub fn load_wallet_from_keystore(
        path: &str,
        password: &str,
        chain_id: Option<u64>,
    ) -> Result<EVMWallet> {
        // This is a simplified implementation
        // In a real implementation, you would properly decrypt the keystore
        let file = File::open(path)
            .map_err(|e| SDKError::IOError(format!("Failed to open keystore file: {}", e)))?;

        let keystore: serde_json::Value = serde_json::from_reader(file)
            .map_err(|e| SDKError::SerializationError(format!("Failed to read keystore: {}", e)))?;

        let private_key = keystore["private_key"].as_str()
            .ok_or_else(|| SDKError::InvalidKey("Private key not found in keystore".to_string()))?;

        EVMWallet::from_private_key(private_key, chain_id)
    }

    /// Calculate optimal gas price based on network conditions
    pub async fn calculate_optimal_gas_price(client: &crate::evm::client::EVMClient) -> Result<U256> {
        // Get current gas price
        let current_gas_price = client.get_gas_price().await?;

        // Add 10% buffer for faster inclusion
        let optimal_gas_price = current_gas_price * U256::from(110) / U256::from(100);

        Ok(optimal_gas_price)
    }

    /// Estimate gas cost for a transaction
    pub fn estimate_gas_cost(gas_limit: u64, gas_price: U256) -> U256 {
        U256::from(gas_limit) * gas_price
    }

    /// Check if an account has sufficient balance for a transaction
    pub fn has_sufficient_balance(
        balance: U256,
        gas_cost: U256,
        value: U256,
    ) -> bool {
        balance >= gas_cost + value
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_wallet() {
        let wallet = EVMWallet::generate(None);
        let address = wallet.address();
        assert_eq!(wallet.address(), address);
        assert!(!wallet.private_key().is_empty());
    }

    #[test]
    fn test_generate_wallet_from_mnemonic() {
        let (wallet, phrase) = EVMWallet::generate_from_mnemonic(None);

        // Wallet should have a valid address
        assert_ne!(wallet.address(), Address::zero());

        // Phrase should be a valid BIP-39 mnemonic (12 words typically)
        let word_count = phrase.split_whitespace().count();
        assert!(word_count == 12 || word_count == 15 || word_count == 18 || word_count == 21 || word_count == 24);

        // Creating wallet from same phrase should give same address
        let wallet2 = EVMWallet::from_mnemonic(&phrase, None, None).unwrap();
        assert_eq!(wallet.address(), wallet2.address());
    }

    #[test]
    fn test_wallet_from_private_key() {
        let private_key = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        let wallet = EVMWallet::from_private_key(private_key, Some(1)).unwrap();

        assert_eq!(wallet.chain_id(), Some(1));
        assert!(!wallet.private_key().is_empty());
    }

    #[test]
    fn test_address_validation() {
        let valid_address = "0x1234567890123456789012345678901234567890";
        let result = utils::validate_address(valid_address);
        assert!(result.is_ok());

        let invalid_address = "0xinvalid";
        let result = utils::validate_address(invalid_address);
        assert!(result.is_err());
    }

    #[test]
    fn test_checksum_address() {
        let address = "0x1234567890123456789012345678901234567890";
        let parsed = utils::validate_address(address).unwrap();
        let checksum = utils::checksum_address(parsed);

        // Checksum should be different from lowercase
        assert_ne!(checksum.to_lowercase(), checksum);
    }

    #[test]
    fn test_wei_eth_conversion() {
        let one_eth = U256::from(10u64.pow(18));
        let eth_str = utils::wei_to_eth(one_eth);
        assert_eq!(eth_str, "1.000000000000000000");

        let wei_back = utils::eth_to_wei("1").unwrap();
        assert_eq!(wei_back, one_eth);
    }

    #[test]
    fn test_private_key_validation() {
        let valid_key = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        assert!(utils::validate_private_key(valid_key).is_ok());

        let invalid_key = "invalid";
        assert!(utils::validate_private_key(invalid_key).is_err());
    }

    #[test]
    fn test_address_from_private_key() {
        let private_key = utils::generate_private_key();
        let address = utils::address_from_private_key(&private_key).unwrap();
        assert_ne!(address, Address::zero());
    }

    #[test]
    fn test_message_signing() {
        let wallet = EVMWallet::generate(None);
        let message = b"Hello, world!";

        let signature = wallet.sign_message(message).unwrap();
        let is_valid = wallet.verify_signature(message, &signature);
        assert!(is_valid);
    }
}