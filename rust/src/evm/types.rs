//! EVM Type Definitions
//!
//! This module contains comprehensive type definitions for EVM operations,
//! including network types, transaction types, and other EVM-specific data structures.

use crate::types::{Result, SDKError};
use ethers_core::{
    types::{
        Address, U256, H256, Bytes, BlockNumber, BlockId, Chain, Transaction, TransactionReceipt,
        Log, Filter, TxHash, EIP1559TransactionRequest, TransactionRequest, AccessList,
        BigNumber, Uint, Signature, I256, H160,
    },
    utils::keccak256,
};
use serde::{Serialize, Deserialize};
use std::str::FromStr;
use std::collections::HashMap;

/// EVM chain types
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum EVMChain {
    /// Ethereum Mainnet
    Ethereum,
    /// Ethereum Sepolia Testnet
    EthereumSepolia,
    /// Ethereum Goerli Testnet (deprecated)
    EthereumGoerli,
    /// Selendra EVM Mainnet
    SelendraEVM,
    /// Selendra EVM Testnet
    SelendraEVMTestnet,
    /// Polygon
    Polygon,
    /// Polygon Mumbai Testnet
    PolygonMumbai,
    /// Binance Smart Chain
    BSC,
    /// BSC Testnet
    BSCTestnet,
    /// Avalanche
    Avalanche,
    /// Avalanche Fuji Testnet
    AvalancheFuji,
    /// Arbitrum
    Arbitrum,
    /// Arbitrum Rinkeby Testnet (deprecated)
    ArbitrumRinkeby,
    /// Optimism
    Optimism,
    /// Optimism Kovan Testnet
    OptimismKovan,
    /// Custom chain with ID and name
    Custom { id: u64, name: String },
}

impl EVMChain {
    /// Get the chain ID
    pub fn chain_id(&self) -> u64 {
        match self {
            EVMChain::Ethereum => 1,
            EVMChain::EthereumSepolia => 11155111,
            EVMChain::EthereumGoerli => 5,
            EVMChain::SelendraEVM => 1000, // Example ID
            EVMChain::SelendraEVMTestnet => 1001, // Example ID
            EVMChain::Polygon => 137,
            EVMChain::PolygonMumbai => 80001,
            EVMChain::BSC => 56,
            EVMChain::BSCTestnet => 97,
            EVMChain::Avalanche => 43114,
            EVMChain::AvalancheFuji => 43113,
            EVMChain::Arbitrum => 42161,
            EVMChain::ArbitrumRinkeby => 421611,
            EVMChain::Optimism => 10,
            EVMChain::OptimismKovan => 69,
            EVMChain::Custom { id, .. } => *id,
        }
    }

    /// Get the chain name
    pub fn name(&self) -> &str {
        match self {
            EVMChain::Ethereum => "Ethereum",
            EVMChain::EthereumSepolia => "Ethereum Sepolia",
            EVMChain::EthereumGoerli => "Ethereum Goerli",
            EVMChain::SelendraEVM => "Selendra EVM",
            EVMChain::SelendraEVMTestnet => "Selendra EVM Testnet",
            EVMChain::Polygon => "Polygon",
            EVMChain::PolygonMumbai => "Polygon Mumbai",
            EVMChain::BSC => "Binance Smart Chain",
            EVMChain::BSCTestnet => "BSC Testnet",
            EVMChain::Avalanche => "Avalanche",
            EVMChain::AvalancheFuji => "Avalanche Fuji",
            EVMChain::Arbitrum => "Arbitrum",
            EVMChain::ArbitrumRinkeby => "Arbitrum Rinkeby",
            EVMChain::Optimism => "Optimism",
            EVMChain::OptimismKovan => "Optimism Kovan",
            EVMChain::Custom { name, .. } => name,
        }
    }

    /// Get default RPC endpoint
    pub fn default_rpc_endpoint(&self) -> Option<&'static str> {
        match self {
            EVMChain::Ethereum => Some("https://eth.llamarpc.com"),
            EVMChain::EthereumSepolia => Some("https://sepolia.infura.io/v3/"),
            EVMChain::EthereumGoerli => Some("https://goerli.infura.io/v3/"),
            EVMChain::SelendraEVM => Some(crate::DEFAULT_SELENDRA_EVM_ENDPOINT),
            EVMChain::SelendraEVMTestnet => Some(crate::DEFAULT_SELENDRA_EVM_TESTNET_ENDPOINT),
            EVMChain::Polygon => Some("https://polygon-rpc.com"),
            EVMChain::PolygonMumbai => Some("https://rpc-mumbai.maticvigil.com"),
            EVMChain::BSC => Some("https://bsc-dataseed.binance.org"),
            EVMChain::BSCTestnet => Some("https://data-seed-prebsc-1-s1.binance.org:8545"),
            EVMChain::Avalanche => Some("https://api.avax.network/ext/bc/C/rpc"),
            EVMChain::AvalancheFuji => Some("https://api.avax-test.network/ext/bc/C/rpc"),
            EVMChain::Arbitrum => Some("https://arb1.arbitrum.io/rpc"),
            EVMChain::ArbitrumRinkeby => Some("https://rinkeby.arbitrum.io/rpc"),
            EVMChain::Optimism => Some("https://mainnet.optimism.io"),
            EVMChain::OptimismKovan => Some("https://kovan.optimism.io"),
            EVMChain::Custom { .. } => None,
        }
    }

    /// Check if this is a testnet
    pub fn is_testnet(&self) -> bool {
        match self {
            EVMChain::EthereumSepolia
            | EVMChain::EthereumGoerli
            | EVMChain::SelendraEVMTestnet
            | EVMChain::PolygonMumbai
            | EVMChain::BSCTestnet
            | EVMChain::AvalancheFuji
            | EVMChain::ArbitrumRinkeby
            | EVMChain::OptimismKovan => true,
            EVMChain::Custom { .. } => false, // You might want to make this configurable
            _ => false,
        }
    }
}

impl FromStr for EVMChain {
    type Err = SDKError;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "ethereum" | "eth" | "mainnet" => Ok(EVMChain::Ethereum),
            "sepolia" | "ethereum-sepolia" => Ok(EVMChain::EthereumSepolia),
            "goerli" | "ethereum-goerli" => Ok(EVMChain::EthereumGoerli),
            "selendra-evm" | "selendra-evm-mainnet" => Ok(EVMChain::SelendraEVM),
            "selendra-evm-testnet" => Ok(EVMChain::SelendraEVMTestnet),
            "polygon" | "matic" => Ok(EVMChain::Polygon),
            "mumbai" | "polygon-mumbai" => Ok(EVMChain::PolygonMumbai),
            "bsc" | "binance-smart-chain" => Ok(EVMChain::BSC),
            "bsc-testnet" => Ok(EVMChain::BSCTestnet),
            "avalanche" | "avax" => Ok(EVMChain::Avalanche),
            "fuji" | "avalanche-fuji" => Ok(EVMChain::AvalancheFuji),
            "arbitrum" | "arb" => Ok(EVMChain::Arbitrum),
            "arbitrum-rinkeby" => Ok(EVMChain::ArbitrumRinkeby),
            "optimism" | "op" => Ok(EVMChain::Optimism),
            "optimism-kovan" => Ok(EVMChain::OptimismKovan),
            _ => Err(SDKError::InvalidChain(format!("Unknown chain: {}", s))),
        }
    }
}

/// Enhanced transaction information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedTransaction {
    /// Transaction hash
    pub hash: TxHash,
    /// Block number (None if pending)
    pub block_number: Option<u64>,
    /// Transaction index in block
    pub transaction_index: Option<u64>,
    /// From address
    pub from: Address,
    /// To address (None for contract creation)
    pub to: Option<Address>,
    /// Value transferred in wei
    pub value: U256,
    /// Gas price (for legacy transactions)
    pub gas_price: Option<U256>,
    /// Max fee per gas (for EIP-1559 transactions)
    pub max_fee_per_gas: Option<U256>,
    /// Max priority fee per gas (for EIP-1559 transactions)
    pub max_priority_fee_per_gas: Option<U256>,
    /// Gas limit
    pub gas_limit: U256,
    /// Gas used (None if pending)
    pub gas_used: Option<U256>,
    /// Transaction data
    pub input: Bytes,
    /// Nonce
    pub nonce: u64,
    /// Chain ID
    pub chain_id: Option<u64>,
    /// Transaction type (0 for legacy, 1 for access list, 2 for EIP-1559)
    pub transaction_type: Option<u8>,
    /// Access list (for EIP-2930)
    pub access_list: Option<AccessList>,
    /// Max priority fee per gas in history
    pub max_priority_fee_per_gas_history: Option<Vec<U256>>,
    /// Transaction status (None if pending)
    pub status: Option<bool>,
}

/// Enhanced block information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedBlock {
    /// Block number
    pub number: U256,
    /// Block hash
    pub hash: H256,
    /// Parent hash
    pub parent_hash: H256,
    /// Uncles hash
    pub uncles_hash: H256,
    /// Coinbase (miner) address
    pub author: Address,
    /// State root hash
    pub state_root: H256,
    /// Transactions root hash
    pub transactions_root: H256,
    /// Receipts root hash
    pub receipts_root: H256,
    /// Logs bloom filter
    pub logs_bloom: Bytes,
    /// Difficulty
    pub difficulty: U256,
    /// Total difficulty of chain until this block
    pub total_difficulty: U256,
    /// Seal fields (PoW specific)
    pub seal_fields: Vec<Bytes>,
    /// Extra data
    pub extra_data: Bytes,
    /// Gas limit
    pub gas_limit: U256,
    /// Gas used
    pub gas_used: U256,
    /// Timestamp
    pub timestamp: U256,
    /// Block transactions
    pub transactions: Vec<EnhancedTransaction>,
    /// Uncles
    pub uncles: Vec<H256>,
    /// Mix hash (for PoW chains)
    pub mix_hash: Option<H256>,
    /// Nonce (for PoW chains)
    pub nonce: Option<u64>,
    /// Base fee per gas (for EIP-1559 chains)
    pub base_fee_per_gas: Option<U256>,
    /// Block size
    pub size: Option<U256>,
}

/// Token information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenInfo {
    /// Token address
    pub address: Address,
    /// Token symbol
    pub symbol: String,
    /// Token name
    pub name: String,
    /// Token decimals
    pub decimals: u8,
    /// Total supply (None if not available)
    pub total_supply: Option<U256>,
    /// Token logo URL (optional)
    pub logo_url: Option<String>,
    /// Whether this is a known token
    pub is_verified: bool,
}

/// Gas price information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GasInfo {
    /// Current gas price in wei
    pub gas_price: U256,
    /// Base fee per gas (for EIP-1559 chains)
    pub base_fee_per_gas: Option<U256>,
    /// Max priority fee per gas
    pub max_priority_fee_per_gas: Option<U256>,
    /// Max fee per gas
    pub max_fee_per_gas: Option<U256>,
    /// Slow gas price (for slower confirmation)
    pub slow_gas_price: U256,
    /// Standard gas price
    pub standard_gas_price: U256,
    /// Fast gas price (for faster confirmation)
    pub fast_gas_price: U256,
    /// Estimated time for slow gas price (in seconds)
    pub slow_wait_time: Option<u64>,
    /// Estimated time for standard gas price (in seconds)
    pub standard_wait_time: Option<u64>,
    /// Estimated time for fast gas price (in seconds)
    pub fast_wait_time: Option<u64>,
}

/// Network status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatus {
    /// Chain ID
    pub chain_id: u64,
    /// Chain name
    pub chain_name: String,
    /// Current block number
    pub block_number: u64,
    /// Gas price information
    pub gas_info: GasInfo,
    /// Network difficulty (for PoW chains)
    pub difficulty: Option<U256>,
    /// Total hash rate (for PoW chains)
    pub hash_rate: Option<u64>,
    /// Block time (in seconds)
    pub block_time: Option<f64>,
    /// Is network currently syncing
    pub is_syncing: bool,
    /// Syncing status details
    pub syncing_status: Option<SyncingStatus>,
}

/// Syncing status details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncingStatus {
    /// Starting block
    pub starting_block: u64,
    /// Current block
    pub current_block: u64,
    /// Highest block
    pub highest_block: u64,
    /// Pulled states (optional)
    pub pulled_states: Option<u64>,
    /// Known states (optional)
    pub known_states: Option<u64>,
}

/// RPC method information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RPCMethodInfo {
    /// Method name
    pub name: String,
    /// Method description
    pub description: String,
    /// Required parameters
    pub parameters: Vec<RPCParameter>,
    /// Return type
    pub return_type: String,
}

/// RPC parameter information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RPCParameter {
    /// Parameter name
    pub name: String,
    /// Parameter type
    pub r#type: String,
    /// Whether parameter is required
    pub required: bool,
    /// Parameter description
    pub description: String,
}

/// Common EVM function signatures
pub mod function_signatures {
    use ethers_core::types::H256;

    /// ERC20 Transfer function signature
    pub const ERC20_TRANSFER: [u8; 4] = [0xa9, 0x05, 0x9c, 0xbb];

    /// ERC20 Approve function signature
    pub const ERC20_APPROVE: [u8; 4] = [0x09, 0x5e, 0xa7, 0xb3];

    /// ERC20 TransferFrom function signature
    pub const ERC20_TRANSFER_FROM: [u8; 4] = [0x23, 0xb8, 0x72, 0xdd];

    /// ERC20 BalanceOf function signature
    pub const ERC20_BALANCE_OF: [u8; 4] = [0x70, 0xa0, 0x82, 0x31];

    /// ERC20 Allowance function signature
    pub const ERC20_ALLOWANCE: [u8; 4] = [0xdd, 0x62, 0xed, 0x3e];

    /// ERC721 TransferFrom function signature
    pub const ERC721_TRANSFER_FROM: [u8; 4] = [0x23, 0xb8, 0x72, 0xdd];

    /// ERC721 SafeTransferFrom function signature
    pub const ERC721_SAFE_TRANSFER_FROM: [u8; 4] = [0x42, 0x84, 0x2e, 0x0e];

    /// ERC721 OwnerOf function signature
    pub const ERC721_OWNER_OF: [u8; 4] = [0x63, 0x51, 0xee, 0x40];

    /// WETH Deposit function signature
    pub const WETH_DEPOSIT: [u8; 4] = [0xd0, 0xe3, 0x0d, 0xb0];

    /// WETH Withdraw function signature
    pub const WETH_WITHDRAW: [u8; 4] = [0x2e, 0x1a, 0x7d, 0x4d];

    /// Get all function signatures as a map
    pub fn get_all_signatures() -> HashMap<String, [u8; 4]> {
        let mut signatures = HashMap::new();

        signatures.insert("transfer".to_string(), ERC20_TRANSFER);
        signatures.insert("approve".to_string(), ERC20_APPROVE);
        signatures.insert("transferFrom".to_string(), ERC20_TRANSFER_FROM);
        signatures.insert("balanceOf".to_string(), ERC20_BALANCE_OF);
        signatures.insert("allowance".to_string(), ERC20_ALLOWANCE);
        signatures.insert("transferFrom".to_string(), ERC721_TRANSFER_FROM);
        signatures.insert("safeTransferFrom".to_string(), ERC721_SAFE_TRANSFER_FROM);
        signatures.insert("ownerOf".to_string(), ERC721_OWNER_OF);
        signatures.insert("deposit".to_string(), WETH_DEPOSIT);
        signatures.insert("withdraw".to_string(), WETH_WITHDRAW);

        signatures
    }

    /// Get function signature by name
    pub fn get_signature(name: &str) -> Option<[u8; 4]> {
        get_all_signatures().get(name).copied()
    }
}

/// Common event signatures
pub mod event_signatures {
    use ethers_core::types::H256;

    /// ERC20 Transfer event signature
    pub const ERC20_TRANSFER: H256 = H256([
        0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68, 0x2c, 0x01, 0x22, 0x7d,
        0xd0, 0x38, 0x06, 0xf3, 0x18, 0x04, 0x6a, 0x16, 0xa9, 0xc6, 0x4f, 0x9c, 0x03, 0xda, 0x36, 0x4d,
    ]);

    /// ERC20 Approval event signature
    pub const ERC20_APPROVAL: H256 = H256([
        0x8c, 0x5b, 0xe1, 0xe5, 0xec, 0xad, 0x59, 0x54, 0xf2, 0x8e, 0x59, 0x20, 0xf0, 0x78, 0xd6, 0x33,
        0x08, 0x23, 0x07, 0x13, 0x25, 0x42, 0x94, 0x18, 0x8b, 0x51, 0x58, 0xe7, 0xb4, 0x81, 0x4d, 0x09,
    ]);

    /// ERC721 Transfer event signature
    pub const ERC721_TRANSFER: H256 = H256([
        0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68, 0x2c, 0x01, 0x22, 0x7d,
        0xd0, 0x38, 0x06, 0xf3, 0x18, 0x04, 0x6a, 0x16, 0xa9, 0xc6, 0x4f, 0x9c, 0x03, 0xda, 0x36, 0x4d,
    ]);

    /// ERC721 Approval event signature
    pub const ERC721_APPROVAL: H256 = H256([
        0x8c, 0x5b, 0xe1, 0xe5, 0xec, 0xad, 0x59, 0x54, 0xf2, 0x8e, 0x59, 0x20, 0xf0, 0x78, 0xd6, 0x33,
        0x08, 0x23, 0x07, 0x13, 0x25, 0x42, 0x94, 0x18, 0x8b, 0x51, 0x58, 0xe7, 0xb4, 0x81, 0x4d, 0x09,
    ]);

    /// ERC721 ApprovalForAll event signature
    pub const ERC721_APPROVAL_FOR_ALL: H256 = H256([
        0x17, 0x3c, 0xe3, 0x22, 0x15, 0x2d, 0x33, 0x81, 0xb3, 0x52, 0xf4, 0xc2, 0x39, 0x72, 0x3a, 0xb8,
        0xa7, 0x66, 0x9b, 0x59, 0x12, 0x3d, 0x22, 0x43, 0x78, 0xe0, 0x82, 0x1c, 0x99, 0x13, 0x1e, 0xa8,
    ]);

    /// WETH Deposit event signature
    pub const WETH_DEPOSIT: H256 = H256([
        0xe1, 0xff, 0xff, 0xbc, 0x9a, 0x75, 0x62, 0x13, 0x96, 0xe1, 0x41, 0x39, 0x42, 0x0a, 0x16, 0x2f,
        0x56, 0xa3, 0x20, 0x5e, 0x4f, 0xc3, 0x38, 0x23, 0x77, 0x3a, 0x2f, 0x5e, 0x8e, 0x3f, 0x50, 0x36,
    ]);

    /// WETH Withdrawal event signature
    pub const WETH_WITHDRAWAL: H256 = H256([
        0x7f, 0x26, 0x63, 0x50, 0x88, 0x2d, 0x88, 0x43, 0x3d, 0x13, 0x84, 0x9d, 0x30, 0xeb, 0xa1, 0x24,
        0x90, 0x5c, 0x7e, 0xf1, 0xa0, 0x24, 0x4d, 0x5c, 0x2b, 0x64, 0x9d, 0x2e, 0x88, 0x8e, 0x9a, 0x60,
    ]);

    /// Get all event signatures as a map
    pub fn get_all_signatures() -> HashMap<String, H256> {
        let mut signatures = HashMap::new();

        signatures.insert("ERC20_Transfer".to_string(), ERC20_TRANSFER);
        signatures.insert("ERC20_Approval".to_string(), ERC20_APPROVAL);
        signatures.insert("ERC721_Transfer".to_string(), ERC721_TRANSFER);
        signatures.insert("ERC721_Approval".to_string(), ERC721_APPROVAL);
        signatures.insert("ERC721_ApprovalForAll".to_string(), ERC721_APPROVAL_FOR_ALL);
        signatures.insert("WETH_Deposit".to_string(), WETH_DEPOSIT);
        signatures.insert("WETH_Withdrawal".to_string(), WETH_WITHDRAWAL);

        signatures
    }

    /// Get event signature by name
    pub fn get_signature(name: &str) -> Option<H256> {
        get_all_signatures().get(name).copied()
    }
}

/// Utility functions for EVM types
pub mod utils {
    use super::*;
    use ethers_core::utils::{to_checksum, parse_ether};

    /// Calculate gas cost
    pub fn calculate_gas_cost(gas_used: U256, gas_price: U256) -> U256 {
        gas_used * gas_price
    }

    /// Format wei as ETH string
    pub fn format_wei_as_eth(wei: U256) -> String {
        ethers_core::utils::format_ether(wei)
    }

    /// Parse ETH amount to wei
    pub fn parse_eth_to_wei(eth_str: &str) -> Result<U256> {
        parse_ether(eth_str)
            .map_err(|e| SDKError::ConversionError(format!("Invalid ETH amount: {}", e)))
    }

    /// Get checksum address
    pub fn checksum_address(address: Address) -> String {
        to_checksum(&address, None)
    }

    /// Validate address checksum
    pub fn validate_checksum_address(address_str: &str) -> Result<Address> {
        address_str.parse()
            .map_err(|e| SDKError::InvalidAddress(format!("Invalid address: {}", e)))
    }

    /// Get chain from chain ID
    pub fn chain_from_id(chain_id: u64) -> Option<EVMChain> {
        match chain_id {
            1 => Some(EVMChain::Ethereum),
            11155111 => Some(EVMChain::EthereumSepolia),
            5 => Some(EVMChain::EthereumGoerli),
            1000 => Some(EVMChain::SelendraEVM),
            1001 => Some(EVMChain::SelendraEVMTestnet),
            137 => Some(EVMChain::Polygon),
            80001 => Some(EVMChain::PolygonMumbai),
            56 => Some(EVMChain::BSC),
            97 => Some(EVMChain::BSCTestnet),
            43114 => Some(EVMChain::Avalanche),
            43113 => Some(EVMChain::AvalancheFuji),
            42161 => Some(EVMChain::Arbitrum),
            421611 => Some(EVMChain::ArbitrumRinkeby),
            10 => Some(EVMChain::Optimism),
            69 => Some(EVMChain::OptimismKovan),
            _ => None,
        }
    }

    /// Calculate EIP-1559 fees
    pub fn calculate_eip1559_fees(
        base_fee: U256,
        priority_fee: U256,
        max_fee_multiplier: f64,
    ) -> (U256, U256) {
        let max_fee_per_gas = base_fee + priority_fee;
        let max_fee_with_multiplier = U256::from(
            (max_fee_per_gas.as_u128() as f64 * max_fee_multiplier) as u128
        );

        (priority_fee, max_fee_with_multiplier)
    }

    /// Estimate transaction time based on gas price
    pub fn estimate_transaction_time(gas_price: U256, median_gas_price: U256) -> Duration {
        let ratio = if median_gas_price.is_zero() {
            1.0
        } else {
            gas_price.as_u128() as f64 / median_gas_price.as_u128() as f64
        };

        let seconds = if ratio < 0.9 {
            300 // 5 minutes for low gas price
        } else if ratio < 1.1 {
            60 // 1 minute for median gas price
        } else if ratio < 1.5 {
            30 // 30 seconds for high gas price
        } else {
            15 // 15 seconds for very high gas price
        };

        Duration::from_secs(seconds)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_evm_chain() {
        let chain = EVMChain::Ethereum;
        assert_eq!(chain.chain_id(), 1);
        assert_eq!(chain.name(), "Ethereum");
        assert!(!chain.is_testnet());
        assert!(chain.default_rpc_endpoint().is_some());

        let testnet = EVMChain::EthereumSepolia;
        assert!(testnet.is_testnet());
    }

    #[test]
    fn test_evm_chain_from_str() {
        let chain = "ethereum".parse::<EVMChain>().unwrap();
        assert_eq!(chain, EVMChain::Ethereum);

        let chain = "sepolia".parse::<EVMChain>().unwrap();
        assert_eq!(chain, EVMChain::EthereumSepolia);

        let chain = "selendra-evm".parse::<EVMChain>().unwrap();
        assert_eq!(chain, EVMChain::SelendraEVM);

        let invalid_chain = "invalid-chain".parse::<EVMChain>();
        assert!(invalid_chain.is_err());
    }

    #[test]
    fn test_function_signatures() {
        let signatures = function_signatures::get_all_signatures();
        assert!(!signatures.is_empty());

        let transfer_sig = function_signatures::get_signature("transfer");
        assert!(transfer_sig.is_some());
        assert_eq!(transfer_sig.unwrap(), function_signatures::ERC20_TRANSFER);
    }

    #[test]
    fn test_event_signatures() {
        let signatures = event_signatures::get_all_signatures();
        assert!(!signatures.is_empty());

        let transfer_sig = event_signatures::get_signature("ERC20_Transfer");
        assert!(transfer_sig.is_some());
        assert_eq!(transfer_sig.unwrap(), event_signatures::ERC20_TRANSFER);
    }

    #[test]
    fn test_chain_from_id() {
        let chain = utils::chain_from_id(1);
        assert_eq!(chain, Some(EVMChain::Ethereum));

        let chain = utils::chain_from_id(11155111);
        assert_eq!(chain, Some(EVMChain::EthereumSepolia));

        let chain = utils::chain_from_id(999999);
        assert_eq!(chain, None);
    }

    #[test]
    fn test_gas_cost_calculation() {
        let gas_used = U256::from(21000);
        let gas_price = U256::from(20000000000u64); // 20 gwei
        let cost = utils::calculate_gas_cost(gas_used, gas_price);

        let expected = U256::from(21000) * U256::from(20000000000u64);
        assert_eq!(cost, expected);
    }

    #[test]
    fn test_eth_wei_conversion() {
        let wei = utils::parse_eth_to_wei("1.5").unwrap();
        let eth_str = utils::format_wei_as_eth(wei);
        assert_eq!(eth_str, "1.500000000000000000");
    }

    #[test]
    fn test_checksum_address() {
        let address = "0x1234567890123456789012345678901234567890"
            .parse()
            .unwrap();
        let checksum = utils::checksum_address(address);

        // Checksum should contain uppercase letters
        assert!(!checksum.to_lowercase().eq(&checksum));
    }

    #[test]
    fn test_eip1559_fee_calculation() {
        let base_fee = U256::from(20000000000u64); // 20 gwei
        let priority_fee = U256::from(2000000000u64); // 2 gwei

        let (priority, max_fee) = utils::calculate_eip1559_fees(base_fee, priority_fee, 1.2);

        assert_eq!(priority, priority_fee);
        assert_eq!(max_fee, U256::from(26400000000u64)); // (20 + 2) * 1.2
    }
}