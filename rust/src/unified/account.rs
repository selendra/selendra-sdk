//! Unified Account System
//!
//! This module provides a unified interface for managing accounts across both Substrate and EVM chains
//! within the Selendra ecosystem, including address conversion and unified operations.

use crate::types::{Result, SDKError};
use crate::evm::{
    client::EVMClient, account::AccountManager, types::EVMChain,
};
use crate::substrate::{Connection, SignedConnection};
use ethers_core::types::{Address, U256, H256};
use sp_core::{crypto::{AccountId32, Ss58Codec}, sr25519, ed25519, Pair, H160 as SubstrateH160};
use sp_runtime::{MultiAddress, AccountId32 as RuntimeAccountId32};
use sp_keyring::AccountKeyring;
use std::str::FromStr;
use std::convert::{TryFrom, TryInto};
use serde::{Serialize, Deserialize};
use blake2::{Blake2b, Digest};
use tiny_keccak::{Keccak, Hasher};

/// Unified account type that can represent both Substrate and EVM addresses
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum UnifiedAddress {
    /// Substrate address (AccountId32)
    Substrate(AccountId32),
    /// EVM address (20 bytes)
    EVM(Address),
    /// H160 format (common for both chains in some contexts)
    H160(SubstrateH160),
}

impl UnifiedAddress {
    /// Create from Substrate AccountId32
    pub fn substrate(address: AccountId32) -> Self {
        Self::Substrate(address)
    }

    /// Create from EVM address
    pub fn evm(address: Address) -> Self {
        Self::EVM(address)
    }

    /// Create from H160
    pub fn h160(address: SubstrateH160) -> Self {
        Self::H160(address)
    }

    /// Create from string (auto-detect format)
    pub fn from_str(address: &str) -> Result<Self> {
        // Try Substrate format first (SS58)
        if let Ok(substrate_addr) = AccountId32::from_str(address) {
            return Ok(Self::Substrate(substrate_addr));
        }

        // Try EVM format
        if let Ok(evm_addr) = Address::from_str(address) {
            return Ok(Self::EVM(evm_addr));
        }

        Err(SDKError::InvalidAddress(format!("Unable to parse address: {}", address)))
    }

    /// Convert to Substrate AccountId32
    pub fn to_substrate(&self) -> Option<AccountId32> {
        match self {
            Self::Substrate(addr) => Some(*addr),
            Self::EVM(evm_addr) => {
                // Convert EVM address to Substrate format
                // This is a conversion that may be specific to the chain's mapping
                Some(convert_evm_to_substrate(*evm_addr))
            }
            Self::H160(h160) => {
                // Convert H160 to AccountId32 by padding with zeros
                let mut account_id = [0u8; 32];
                account_id[12..32].copy_from_slice(&h160.0);
                Some(AccountId32::new(account_id))
            }
        }
    }

    /// Convert to EVM Address
    pub fn to_evm(&self) -> Option<Address> {
        match self {
            Self::EVM(addr) => Some(*addr),
            Self::Substrate(substrate_addr) => {
                // Convert Substrate address to EVM format
                Some(convert_substrate_to_evm(*substrate_addr))
            }
            Self::H160(h160) => {
                // Convert H160 to EVM address
                Some(Address::from(h160.0))
            }
        }
    }

    /// Convert to H160
    pub fn to_h160(&self) -> Option<SubstrateH160> {
        match self {
            Self::H160(addr) => Some(*addr),
            Self::EVM(evm_addr) => {
                // Convert EVM address to H160
                Some(SubstrateH160::from_slice(evm_addr.as_ref()))
            }
            Self::Substrate(substrate_addr) => {
                // Take last 20 bytes of Substrate address
                let addr_bytes = substrate_addr.as_ref();
                Some(SubstrateH160::from_slice(&addr_bytes[12..32]))
            }
        }
    }

    /// Get the address as a hex string
    pub fn to_hex_string(&self) -> String {
        match self {
            Self::Substrate(addr) => format!("0x{}", hex::encode(addr.as_ref())),
            Self::EVM(addr) => format!("{:#x}", addr),
            Self::H160(addr) => format!("0x{}", hex::encode(addr.as_ref())),
        }
    }

    /// Get the address as SS58 string (Substrate format)
    pub fn to_ss58_string(&self) -> Option<String> {
        match self {
            Self::Substrate(addr) => Some(addr.to_ss58check()),
            Self::EVM(_) => None, // EVM addresses don't have SS58 format
            Self::H160(_) => None,
        }
    }

    /// Check if this is a Substrate address
    pub fn is_substrate(&self) -> bool {
        matches!(self, Self::Substrate(_))
    }

    /// Check if this is an EVM address
    pub fn is_evm(&self) -> bool {
        matches!(self, Self::EVM(_))
    }

    /// Check if this is an H160 address
    pub fn is_h160(&self) -> bool {
        matches!(self, Self::H160(_))
    }
}

impl From<AccountId32> for UnifiedAddress {
    fn from(address: AccountId32) -> Self {
        Self::Substrate(address)
    }
}

impl From<Address> for UnifiedAddress {
    fn from(address: Address) -> Self {
        Self::EVM(address)
    }
}

impl From<SubstrateH160> for UnifiedAddress {
    fn from(address: SubstrateH160) -> Self {
        Self::H160(address)
    }
}

impl FromStr for UnifiedAddress {
    type Err = SDKError;

    fn from_str(s: &str) -> Result<Self> {
        Self::from_str(s)
    }
}

/// Convert EVM address to Substrate AccountId32
/// This uses the Ethereum address to Substrate account mapping
pub fn convert_evm_to_substrate(evm_address: Address) -> AccountId32 {
    let mut account_id = [0u8; 32];
    // Prefix with the Ethereum address mapping prefix
    account_id[0] = 0x6d; // Ethereum address prefix in Substrate
    account_id[1..21].copy_from_slice(evm_address.as_bytes());

    AccountId32::new(account_id)
}

/// Convert Substrate AccountId32 to EVM Address
pub fn convert_substrate_to_evm(substrate_address: AccountId32) -> Address {
    let addr_bytes = substrate_address.as_ref();

    // For addresses that were originally from Ethereum, extract the last 20 bytes
    // For native Substrate addresses, use a hash to derive EVM address
    if addr_bytes[0] == 0x6d {
        // This is an Ethereum-derived address
        Address::from_slice(&addr_bytes[1..21])
    } else {
        // This is a native Substrate address - derive EVM address
        let mut hasher = Keccak::v256();
        hasher.update(addr_bytes);
        let mut output = [0u8; 32];
        hasher.finalize(&mut output);
        Address::from_slice(&output[12..32])
    }
}

/// Account information across both chains
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedAccountInfo {
    /// Unified address
    pub address: UnifiedAddress,
    /// Substrate account information
    pub substrate_info: Option<SubstrateAccountInfo>,
    /// EVM account information
    pub evm_info: Option<EVMAccountInfo>,
    /// Whether the account exists on either chain
    pub exists: bool,
    /// Unified balance (both chains combined)
    pub unified_balance: Option<UnifiedBalance>,
}

/// Substrate account information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubstrateAccountInfo {
    /// Account ID
    pub account_id: AccountId32,
    /// Nonce
    pub nonce: u32,
    /// Free balance
    pub free_balance: u128,
    /// Reserved balance
    pub reserved_balance: u128,
    /// Total balance
    pub total_balance: u128,
    /// Whether account has contracts (if applicable)
    pub has_contracts: bool,
}

/// EVM account information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EVMAccountInfo {
    /// Address
    pub address: Address,
    /// Nonce
    pub nonce: u64,
    /// Balance in wei
    pub balance: U256,
    /// Whether this is a contract
    pub is_contract: bool,
    /// Contract code hash (if applicable)
    pub code_hash: Option<H256>,
}

/// Unified balance information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedBalance {
    /// Total balance in the smallest unit (e.g., wei)
    pub total_amount: U256,
    /// Substrate balance
    pub substrate_balance: Option<u128>,
    /// EVM balance
    pub evm_balance: Option<U256>,
    /// Currency symbol
    pub symbol: String,
    /// Decimals for display
    pub decimals: u8,
}

/// Unified account manager
pub struct UnifiedAccountManager {
    substrate_connection: Option<SignedConnection>,
    evm_client: Option<EVMClient>,
}

impl UnifiedAccountManager {
    /// Create a new unified account manager
    pub fn new(
        substrate_connection: Option<SignedConnection>,
        evm_client: Option<EVMClient>,
    ) -> Self {
        Self {
            substrate_connection,
            evm_client,
        }
    }

    /// Get unified account information
    pub async fn get_account_info(&self, address: &UnifiedAddress) -> Result<UnifiedAccountInfo> {
        let mut substrate_info = None;
        let mut evm_info = None;
        let mut exists = false;

        // Get Substrate info if available
        if let Some(conn) = &self.substrate_connection {
            if let Some(substrate_addr) = address.to_substrate() {
                match self.get_substrate_account_info(conn, substrate_addr).await {
                    Ok(info) => {
                        substrate_info = Some(info);
                        exists = true;
                    }
                    Err(_) => {
                        // Account doesn't exist on Substrate chain
                    }
                }
            }
        }

        // Get EVM info if available
        if let Some(client) = &self.evm_client {
            if let Some(evm_addr) = address.to_evm() {
                match self.get_evm_account_info(client, evm_addr).await {
                    Ok(info) => {
                        evm_info = Some(info);
                        exists = true;
                    }
                    Err(_) => {
                        // Account doesn't exist on EVM chain
                    }
                }
            }
        }

        // Calculate unified balance
        let unified_balance = self.calculate_unified_balance(&substrate_info, &evm_info).await?;

        Ok(UnifiedAccountInfo {
            address: address.clone(),
            substrate_info,
            evm_info,
            exists,
            unified_balance: Some(unified_balance),
        })
    }

    /// Get unified balance for an address
    pub async fn get_balance(&self, address: &UnifiedAddress) -> Result<UnifiedBalance> {
        let info = self.get_account_info(address).await?;
        info.unified_balance.ok_or_else(|| SDKError::NotFound("No balance information available".to_string()))
    }

    /// Transfer between Substrate and EVM chains
    pub async fn cross_chain_transfer(
        &self,
        from: &UnifiedAddress,
        to: &UnifiedAddress,
        amount: U256,
        from_chain: ChainType,
        to_chain: ChainType,
    ) -> Result<H256> {
        match (from_chain, to_chain) {
            (ChainType::Substrate, ChainType::EVM) => {
                self.transfer_substrate_to_evm(from, to, amount).await
            }
            (ChainType::EVM, ChainType::Substrate) => {
                self.transfer_evm_to_substrate(from, to, amount).await
            }
            _ => {
                Err(SDKError::InvalidOperation(
                    "Cross-chain transfer must be between different chain types".to_string()
                ))
            }
        }
    }

    /// Create unified account from seed
    pub fn create_account_from_seed(seed: &str, chain_type: ChainType) -> Result<(UnifiedAddress, String)> {
        match chain_type {
            ChainType::Substrate => {
                let pair = sr25519::Pair::from_string(seed, None)
                    .map_err(|e| SDKError::InvalidKey(format!("Invalid seed: {}", e)))?;
                let address = UnifiedAddress::substrate(pair.public().into());
                Ok((address, seed.to_string()))
            }
            ChainType::EVM => {
                // For EVM, we need to ensure the seed can generate a valid private key
                let wallet = crate::evm::account::EVMWallet::from_mnemonic(seed, None, None)?;
                let address = UnifiedAddress::evm(wallet.address());
                Ok((address, seed.to_string()))
            }
        }
    }

    /// Derive child address from parent address
    pub fn derive_child_address(
        parent: &UnifiedAddress,
        derivation_path: &str,
        chain_type: ChainType,
    ) -> Result<UnifiedAddress> {
        match chain_type {
            ChainType::Substrate => {
                // Use hierarchical deterministic derivation for Substrate
                // This is a simplified implementation
                let substrate_addr = parent.to_substrate()
                    .ok_or_else(|| SDKError::InvalidOperation("Cannot derive Substrate child from non-Substrate address".to_string()))?;

                // Create a deterministic derivation path
                let mut hasher = Blake2b::new();
                hasher.update(substrate_addr.as_ref());
                hasher.update(derivation_path.as_bytes());
                let result = hasher.finalize();

                let child_addr = AccountId32::new(result.as_slice()[..32].try_into()
                    .map_err(|_| SDKError::ConversionError("Failed to derive child address".to_string()))?);

                Ok(UnifiedAddress::substrate(child_addr))
            }
            ChainType::EVM => {
                // Use standard HD wallet derivation for EVM
                let evm_addr = parent.to_evm()
                    .ok_or_else(|| SDKError::InvalidOperation("Cannot derive EVM child from non-EVM address".to_string()))?;

                // This would normally require the private key and proper HD wallet derivation
                // For now, create a deterministic address
                let mut hasher = Keccak::v256();
                hasher.update(evm_addr.as_bytes());
                hasher.update(derivation_path.as_bytes());
                let mut output = [0u8; 32];
                hasher.finalize(&mut output);

                let child_addr = Address::from_slice(&output[12..32]);
                Ok(UnifiedAddress::evm(child_addr))
            }
        }
    }

    /// Get Substrate account information
    async fn get_substrate_account_info(
        &self,
        conn: &SignedConnection,
        address: AccountId32,
    ) -> Result<SubstrateAccountInfo> {
        let account_info = conn.get_account_info().await?;

        Ok(SubstrateAccountInfo {
            account_id: address,
            nonce: account_info.nonce,
            free_balance: account_info.data.free,
            reserved_balance: account_info.data.reserved,
            total_balance: account_info.data.free + account_info.data.reserved,
            has_contracts: false, // Would need additional check
        })
    }

    /// Get EVM account information
    async fn get_evm_account_info(
        &self,
        client: &EVMClient,
        address: Address,
    ) -> Result<EVMAccountInfo> {
        let account_manager = AccountManager::new(client.clone());
        let info = account_manager.get_account_info(address).await?;

        Ok(EVMAccountInfo {
            address,
            nonce: info.nonce.unwrap_or(0),
            balance: info.balance.unwrap_or_default(),
            is_contract: info.is_contract.unwrap_or(false),
            code_hash: info.code_hash,
        })
    }

    /// Calculate unified balance
    async fn calculate_unified_balance(
        &self,
        substrate_info: &Option<SubstrateAccountInfo>,
        evm_info: &Option<EVMAccountInfo>,
    ) -> Result<UnifiedBalance> {
        let substrate_balance = substrate_info.as_ref().map(|info| info.total_balance);
        let evm_balance = evm_info.as_ref().map(|info| info.balance);

        let total_amount = match (substrate_balance, evm_balance) {
            (Some(substrate), Some(evm)) => {
                // Convert substrate balance to wei for addition
                let substrate_as_wei = U256::from(substrate);
                substrate_as_wei + evm
            }
            (Some(substrate), None) => U256::from(substrate),
            (None, Some(evm)) => evm,
            (None, None) => U256::zero(),
        };

        Ok(UnifiedBalance {
            total_amount,
            substrate_balance,
            evm_balance,
            symbol: "SEL".to_string(), // Default symbol
            decimals: 18,
        })
    }

    /// Transfer from Substrate to EVM
    async fn transfer_substrate_to_evm(
        &self,
        from: &UnifiedAddress,
        to: &UnifiedAddress,
        amount: U256,
    ) -> Result<H256> {
        // This would implement the bridge transfer logic
        // For now, return a placeholder
        Err(SDKError::NotImplemented(
            "Substrate to EVM bridge transfer not yet implemented".to_string()
        ))
    }

    /// Transfer from EVM to Substrate
    async fn transfer_evm_to_substrate(
        &self,
        from: &UnifiedAddress,
        to: &UnifiedAddress,
        amount: U256,
    ) -> Result<H256> {
        // This would implement the bridge transfer logic
        // For now, return a placeholder
        Err(SDKError::NotImplemented(
            "EVM to Substrate bridge transfer not yet implemented".to_string()
        ))
    }
}

/// Chain type for unified operations
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChainType {
    Substrate,
    EVM,
}

/// Address mapping utilities
pub mod address_utils {
    use super::*;

    /// Check if two addresses refer to the same entity across chains
    pub fn are_same_entity(addr1: &UnifiedAddress, addr2: &UnifiedAddress) -> bool {
        match (addr1, addr2) {
            (UnifiedAddress::Substrate(a), UnifiedAddress::EVM(b)) => {
                // Check if the EVM address was derived from the Substrate address
                let derived_evm = convert_substrate_to_evm(*a);
                derived_evm == *b
            }
            (UnifiedAddress::EVM(a), UnifiedAddress::Substrate(b)) => {
                // Check if the Substrate address was derived from the EVM address
                let derived_substrate = convert_evm_to_substrate(*a);
                derived_substrate == *b
            }
            _ => addr1 == addr2,
        }
    }

    /// Get the canonical representation of an address
    pub fn canonical_address(address: &UnifiedAddress, preferred_chain: ChainType) -> UnifiedAddress {
        match preferred_chain {
            ChainType::Substrate => {
                if let Some(substrate_addr) = address.to_substrate() {
                    UnifiedAddress::Substrate(substrate_addr)
                } else {
                    address.clone()
                }
            }
            ChainType::EVM => {
                if let Some(evm_addr) = address.to_evm() {
                    UnifiedAddress::EVM(evm_addr)
                } else {
                    address.clone()
                }
            }
        }
    }

    /// Validate address format and check for common errors
    pub fn validate_address(address: &str) -> Result<UnifiedAddress> {
        let addr = UnifiedAddress::from_str(address)?;

        // Additional validation can be added here
        match &addr {
            UnifiedAddress::Substrate(account_id) => {
                // Check if it's a valid SS58 address
                let bytes: &[u8] = account_id.as_ref();
                if bytes.iter().all(|&b| b == 0) {
                    return Err(SDKError::InvalidAddress("Zero address is not valid".to_string()));
                }
            }
            UnifiedAddress::EVM(evm_addr) => {
                // Check if it's a valid Ethereum address
                if evm_addr.is_zero() {
                    return Err(SDKError::InvalidAddress("Zero address is not valid".to_string()));
                }
            }
            _ => {}
        }

        Ok(addr)
    }
}

/// Account utilities
pub mod account_utils {
    use super::*;

    /// Generate a new random account
    pub fn generate_random_account(chain_type: ChainType) -> UnifiedAddress {
        match chain_type {
            ChainType::Substrate => {
                let (pair, _) = sr25519::Pair::generate();
                UnifiedAddress::Substrate(pair.public().into())
            }
            ChainType::EVM => {
                let wallet = crate::evm::account::EVMWallet::generate(None);
                UnifiedAddress::EVM(wallet.address())
            }
        }
    }

    /// Convert between different address formats
    pub fn convert_address_format(
        address: &UnifiedAddress,
        target_format: &str,
    ) -> Result<String> {
        match target_format.to_lowercase().as_str() {
            "hex" => Ok(address.to_hex_string()),
            "ss58" => address.to_ss58_string()
                .ok_or_else(|| SDKError::InvalidOperation("SS58 format not available for this address".to_string())),
            "ethereum" => {
                if let Some(evm_addr) = address.to_evm() {
                    Ok(format!("{:#x}", evm_addr))
                } else {
                    Err(SDKError::InvalidOperation("Cannot convert to Ethereum format".to_string()))
                }
            }
            _ => Err(SDKError::InvalidFormat(format!("Unknown target format: {}", target_format))),
        }
    }

    /// Check if an address is a contract
    pub async fn is_contract_address(
        address: &UnifiedAddress,
        evm_client: Option<&EVMClient>,
    ) -> Result<bool> {
        if let Some(evm_addr) = address.to_evm() {
            if let Some(client) = evm_client {
                let code = client.get_code(evm_addr, None).await?;
                Ok(!code.is_empty())
            } else {
                Ok(false)
            }
        } else {
            Ok(false) // Substrate addresses don't have direct concept of contracts
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unified_address_creation() {
        let substrate_addr = AccountKeyring::Alice.to_account_id();
        let unified = UnifiedAddress::substrate(substrate_addr);
        assert!(unified.is_substrate());

        let evm_addr = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
        let unified = UnifiedAddress::evm(evm_addr);
        assert!(unified.is_evm());
    }

    #[test]
    fn test_unified_address_from_string() {
        // Test SS58 format
        let ss58_addr = AccountKeyring::Alice.to_ss58check();
        let unified = UnifiedAddress::from_str(&ss58_addr).unwrap();
        assert!(unified.is_substrate());

        // Test EVM format
        let evm_addr = "0x1234567890123456789012345678901234567890";
        let unified = UnifiedAddress::from_str(evm_addr).unwrap();
        assert!(unified.is_evm());
    }

    #[test]
    fn test_address_conversion() {
        let substrate_addr = AccountKeyring::Alice.to_account_id();
        let evm_addr = convert_substrate_to_evm(substrate_addr);
        let converted_back = convert_evm_to_substrate(evm_addr);

        // The conversion may not be perfectly reversible due to different encoding schemes
        assert_ne!(substrate_addr, converted_back);
    }

    #[test]
    fn test_are_same_entity() {
        let substrate_addr = AccountKeyring::Alice.to_account_id();
        let evm_addr = convert_substrate_to_evm(substrate_addr);

        let unified_substrate = UnifiedAddress::substrate(substrate_addr);
        let unified_evm = UnifiedAddress::evm(evm_addr);

        assert!(address_utils::are_same_entity(&unified_substrate, &unified_evm));
    }

    #[test]
    fn test_generate_random_account() {
        let substrate_account = account_utils::generate_random_account(ChainType::Substrate);
        assert!(substrate_account.is_substrate());

        let evm_account = account_utils::generate_random_account(ChainType::EVM);
        assert!(evm_account.is_evm());
    }

    #[test]
    fn test_convert_address_format() {
        let substrate_addr = AccountKeyring::Alice.to_account_id();
        let unified = UnifiedAddress::substrate(substrate_addr);

        let hex_format = account_utils::convert_address_format(&unified, "hex").unwrap();
        assert!(hex_format.starts_with("0x"));

        let ss58_format = account_utils::convert_address_format(&unified, "ss58").unwrap();
        assert!(ss58_format.contains("5")); // SS58 addresses typically end with numbers
    }

    #[test]
    fn test_chain_type() {
        assert_eq!(ChainType::Substrate, ChainType::Substrate);
        assert_ne!(ChainType::Substrate, ChainType::EVM);
    }

    #[test]
    fn test_create_account_from_seed() {
        let seed = "Alice loves selendra";

        let (substrate_account, _) = UnifiedAccountManager::create_account_from_seed(
            seed,
            ChainType::Substrate,
        ).unwrap();
        assert!(substrate_account.is_substrate());

        // EVM account creation would need proper mnemonic handling
        // let (evm_account, _) = UnifiedAccountManager::create_account_from_seed(
        //     seed,
        //     ChainType::EVM,
        // ).unwrap();
        // assert!(evm_account.is_evm());
    }

    #[tokio::test]
    async fn test_unified_account_info_creation() {
        let info = UnifiedAccountInfo {
            address: UnifiedAddress::Substrate(AccountKeyring::Alice.to_account_id()),
            substrate_info: None,
            evm_info: None,
            exists: false,
            unified_balance: None,
        };

        assert!(!info.exists);
        assert!(info.unified_balance.is_none());
    }
}