# Rust SDK API Reference

API documentation for the Selendra Rust SDK.

## Table of Contents

- [SelendraSDK](#selendrasdk)
- [Connection](#connection)
- [Account Management](#account-management)
- [Transactions](#transactions)
- [Smart Contracts](#smart-contracts)
- [EVM Compatibility](#evm-compatibility)
- [Substrate Integration](#substrate-integration)
- [Utilities](#utilities)
- [Types](#types)
- [Error Handling](#error-handling)

## SelendraSDK

The main SDK struct that provides access to all Selendra functionality.

### Constructor

```rust
pub fn new(
    network: Network,
    ws_endpoint: &str
) -> Result<Self, SelendraError>
```

#### Parameters

- `network` ([`Network`](#network)) - Network type
- `ws_endpoint` (`&str`) - WebSocket endpoint URL

#### Returns

- `Result<SelendraSDK, SelendraError>` - SDK instance or error

#### Example

```rust
use selendra_sdk::{SelendraSDK, Network};

let sdk = SelendraSDK::new(
    Network::Mainnet,
    "wss://rpc.selendra.org"
)?;
```

### Constructor with Options

```rust
pub fn with_options(options: SelendraSDKOptions) -> Result<Self, SelendraError>
```

#### Parameters

- `options` ([`SelendraSDKOptions`](#selendrasdkoptions)) - Configuration options

#### Example

```rust
use selendra_sdk::{SelendraSDK, SelendraSDKOptions, Network};

let sdk = SelendraSDK::with_options(SelendraSDKOptions {
    network: Network::Testnet,
    ws_endpoint: "wss://testnet-rpc.selendra.org".to_string(),
    http_endpoint: Some("https://testnet-rpc.selendra.org".to_string()),
    default_account: None,
    auto_connect: true,
    connection_timeout: Some(Duration::from_secs(30)),
    retry_attempts: 3,
    retry_delay: Duration::from_secs(1),
})?;
```

### Methods

#### connect()

Establishes connection to the Selendra network.

```rust
pub async fn connect(&mut self) -> Result<(), SelendraError>
```

#### Example

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut sdk = SelendraSDK::new(Network::Mainnet, "wss://rpc.selendra.org")?;
    sdk.connect().await?;
    println!("Connected to Selendra!");
    Ok(())
}
```

#### disconnect()

Disconnects from the network.

```rust
pub async fn disconnect(&mut self) -> Result<(), SelendraError>
```

#### is_connected()

Checks if connected to the network.

```rust
pub fn is_connected(&self) -> bool
```

#### get_chain_info()

Gets information about the current chain.

```rust
pub async fn get_chain_info(&self) -> Result<ChainInfo, SelendraError>
```

#### Returns

```rust
pub struct ChainInfo {
    pub chain_name: String,
    pub chain_id: u64,
    pub version: String,
    pub spec_version: u32,
    pub impl_version: u32,
    pub token_decimals: u8,
    pub token_symbol: String,
}
```

## Connection

### SelendraSDKOptions

Configuration options for the SDK.

```rust
pub struct SelendraSDKOptions {
    pub network: Network,
    pub ws_endpoint: String,
    pub http_endpoint: Option<String>,
    pub default_account: Option<String>,
    pub auto_connect: bool,
    pub connection_timeout: Option<Duration>,
    pub retry_attempts: u32,
    pub retry_delay: Duration,
}
```

### Network

Network configuration.

```rust
pub enum Network {
    Mainnet,
    Testnet,
    Custom {
        chain_id: u64,
        ws_endpoint: String,
        http_endpoint: Option<String>,
    },
}
```

### NetworkConfig

Network-specific configuration.

```rust
pub struct NetworkConfig {
    pub name: String,
    pub chain_id: u64,
    pub ws_endpoint: String,
    pub http_endpoint: Option<String>,
    pub block_time: Duration,
    pub decimals: u8,
    pub token_symbol: String,
}

impl Network {
    pub fn config(&self) -> NetworkConfig;
}
```

## Account Management

### create_account()

Creates a new account with a randomly generated mnemonic.

```rust
pub async fn create_account(
    &mut self,
    options: Option<CreateAccountOptions>
) -> Result<CreatedAccount, SelendraError>
```

#### Parameters

```rust
pub struct CreateAccountOptions {
    pub account_type: AccountType,
    pub name: Option<String>,
    pub password: Option<String>,
    pub derivation_path: Option<String>,
}

pub enum AccountType {
    Substrate,
    Evm,
    Both,
}
```

#### Returns

```rust
pub struct CreatedAccount {
    pub mnemonic: String,
    pub account: Account,
}
```

#### Example

```rust
use selendra_sdk::{CreateAccountOptions, AccountType};

let options = CreateAccountOptions {
    account_type: AccountType::Both,
    name: Some("My Wallet".to_string()),
    password: None,
    derivation_path: Some("//m/44'/354'/0'/0'/0'".to_string()),
};

let created = sdk.create_account(Some(options)).await?;
println!("Mnemonic: {}", created.mnemonic);
println!("Address: {}", created.account.address);
```

### import_account_from_mnemonic()

Imports an account from a mnemonic phrase.

```rust
pub async fn import_account_from_mnemonic(
    &mut self,
    mnemonic: &str,
    options: Option<ImportAccountOptions>
) -> Result<Account, SelendraError>
```

#### Parameters

```rust
pub struct ImportAccountOptions {
    pub account_type: AccountType,
    pub name: Option<String>,
    pub derivation_path: Option<String>,
    pub password: Option<String>,
}
```

#### Example

```rust
let options = ImportAccountOptions {
    account_type: AccountType::Substrate,
    name: Some("Imported Account".to_string()),
    derivation_path: Some("//m/44'/354'/0'/0'/0'".to_string()),
    password: None,
};

let account = sdk.import_account_from_mnemonic(
    "word1 word2 word3 ...",
    Some(options)
).await?;
```

### import_account_from_private_key()

Imports an account from a private key.

```rust
pub async fn import_account_from_private_key(
    &mut self,
    private_key: &str,
    options: Option<ImportAccountOptions>
) -> Result<Account, SelendraError>
```

### get_accounts()

Gets all available accounts.

```rust
pub async fn get_accounts(&self) -> Result<Vec<Account>, SelendraError>
```

### get_balance()

Gets the balance of an account.

```rust
pub async fn get_balance(&self, address: &str) -> Result<Balance, SelendraError>
```

#### Returns

```rust
pub struct Balance {
    pub free: u128,
    pub reserved: u128,
    pub frozen: u128,
    pub total: u128,
    pub token_symbol: String,
    pub decimals: u8,
}
```

#### Example

```rust
let balance = sdk.get_balance("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY").await?;
println!(
    "Free balance: {} {}",
    balance.free as f64 / 10_f64.powi(balance.decimals as i32),
    balance.token_symbol
);
```

## Transactions

### transfer()

Transfers tokens to another address.

```rust
pub async fn transfer(
    &self,
    options: TransferOptions
) -> Result<Transaction, SelendraError>
```

#### Parameters

```rust
pub struct TransferOptions {
    pub to: String,
    pub amount: u128,
    pub from: Option<String>,
    pub memo: Option<String>,
    pub gas_limit: Option<u64>,
    pub max_fee_per_gas: Option<u128>,
    pub max_priority_fee_per_gas: Option<u128>,
}
```

#### Returns

```rust
pub struct Transaction {
    pub hash: String,
    pub from: String,
    pub to: String,
    pub amount: Option<u128>,
    pub data: Option<Vec<u8>>,
    pub gas_limit: Option<u64>,
    pub max_fee_per_gas: Option<u128>,
    pub max_priority_fee_per_gas: Option<u128>,
    pub nonce: Option<u64>,
    pub block_number: Option<u64>,
    pub block_hash: Option<String>,
    pub status: TransactionStatus,
    pub events: Vec<TransactionEvent>,
    pub timestamp: Option<u64>,
}

pub enum TransactionStatus {
    Pending,
    Included,
    Finalized,
    Failed { error: String },
}
```

#### Example

```rust
use selendra_sdk::TransferOptions;

let options = TransferOptions {
    to: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY".to_string(),
    amount: 1_000_000_000_000, // 1 SEL (assuming 12 decimals)
    from: None,
    memo: Some("Payment for services".to_string()),
    gas_limit: None,
    max_fee_per_gas: None,
    max_priority_fee_per_gas: None,
};

let tx = sdk.transfer(options).await?;
println!("Transaction hash: {}", tx.hash);
println!("Status: {:?}", tx.status);
```

### send_transaction()

Sends a custom transaction.

```rust
pub async fn send_transaction(
    &self,
    options: SendTransactionOptions
) -> Result<Transaction, SelendraError>
```

#### Parameters

```rust
pub struct SendTransactionOptions {
    pub from: Option<String>,
    pub to: Option<String>,
    pub data: Option<Vec<u8>>,
    pub value: Option<u128>,
    pub gas_limit: Option<u64>,
    pub max_fee_per_gas: Option<u128>,
    pub max_priority_fee_per_gas: Option<u128>,
    pub nonce: Option<u64>,
}
```

### estimate_gas()

Estimates gas required for a transaction.

```rust
pub async fn estimate_gas(
    &self,
    options: &SendTransactionOptions
) -> Result<u64, SelendraError>
```

### get_transaction()

Gets transaction details by hash.

```rust
pub async fn get_transaction(
    &self,
    hash: &str
) -> Result<Option<Transaction>, SelendraError>
```

### wait_for_transaction()

Waits for a transaction to be included in a block.

```rust
pub async fn wait_for_transaction(
    &self,
    hash: &str,
    timeout: Option<Duration>
) -> Result<Transaction, SelendraError>
```

## Smart Contracts

### Contract

Struct for interacting with smart contracts.

```rust
pub struct Contract<'a> {
    pub address: String,
    pub abi: EthAbi,
    sdk: &'a SelendraSDK,
}
```

#### Constructor

```rust
impl<'a> Contract<'a> {
    pub fn new(address: &str, abi: &[u8], sdk: &'a SelendraSDK) -> Result<Self, SelendraError>
}
```

#### Example

```rust
let abi_bytes = std::fs::read("erc20.json")?;
let contract = Contract::new(
    "0x1234...abcd",
    &abi_bytes,
    &sdk
)?;
```

### contract.call()

Reads data from a contract view function.

```rust
pub async fn call(
    &self,
    function: &str,
    args: &[ethabi::Token]
) -> Result<ethabi::Token, SelendraError>
```

#### Example

```rust
use ethabi::Token;

let args = vec![Token::Address("0xAddress...".parse()?)];
let balance = contract.call("balanceOf", &args).await?;

if let ethabi::Token::Uint(amount) = balance {
    println!("Token balance: {}", amount);
}
```

### contract.send()

Writes data to a contract function.

```rust
pub async fn send(
    &self,
    function: &str,
    options: Option<ContractSendOptions>,
    args: &[ethabi::Token]
) -> Result<Transaction, SelendraError>
```

#### Parameters

```rust
pub struct ContractSendOptions {
    pub from: Option<String>,
    pub value: Option<u128>,
    pub gas_limit: Option<u64>,
    pub max_fee_per_gas: Option<u128>,
}
```

### deploy_contract()

Deploys a new smart contract.

```rust
pub async fn deploy_contract(
    &self,
    options: DeployOptions
) -> Result<DeployedContract, SelendraError>
```

#### Parameters

```rust
pub struct DeployOptions {
    pub bytecode: Vec<u8>,
    pub abi: Vec<u8>,
    pub constructor_args: Option<Vec<ethabi::Token>>,
    pub from: Option<String>,
    pub gas_limit: Option<u64>,
    pub max_fee_per_gas: Option<u128>,
}
```

#### Returns

```rust
pub struct DeployedContract {
    pub address: String,
    pub transaction_hash: String,
    pub block_number: Option<u64>,
}
```

#### Example

```rust
use ethabi::Token;

let bytecode = hex::decode("6080604052348015...")?;
let abi_bytes = std::fs::read("erc20.json")?;

let options = DeployOptions {
    bytecode,
    abi: abi_bytes,
    constructor_args: Some(vec![
        Token::String("My Token".to_string()),
        Token::String("MTK".to_string()),
        Token::Uint(18u128.into()),
    ]),
    from: None,
    gas_limit: None,
    max_fee_per_gas: None,
};

let deployed = sdk.deploy_contract(options).await?;
println!("Contract deployed at: {}", deployed.address);
```

## EVM Compatibility

### get_evm_account()

Gets EVM account information.

```rust
pub async fn get_evm_account(&self, address: &str) -> Result<EvmAccount, SelendraError>
```

#### Returns

```rust
pub struct EvmAccount {
    pub address: String,
    pub nonce: u64,
    pub balance: u128,
    pub code_hash: String,
    pub storage_root: String,
}
```

### get_evm_transaction_count()

Gets the number of transactions sent from an address.

```rust
pub async fn get_evm_transaction_count(&self, address: &str) -> Result<u64, SelendraError>
```

### get_evm_block()

Gets block information.

```rust
pub async fn get_evm_block(&self, block_hash_or_number: BlockId) -> Result<EvmBlock, SelendraError>
```

#### Parameters

```rust
pub enum BlockId {
    Number(u64),
    Hash(String),
    Latest,
    Earliest,
    Pending,
}
```

### send_evm_transaction()

Sends an EVM transaction.

```rust
pub async fn send_evm_transaction(
    &self,
    tx: EvmTransactionRequest
) -> Result<EvmTransaction, SelendraError>
```

#### Parameters

```rust
pub struct EvmTransactionRequest {
    pub from: String,
    pub to: Option<String>,
    pub data: Option<Vec<u8>>,
    pub value: Option<u128>,
    pub gas: Option<u64>,
    pub max_priority_fee_per_gas: Option<u128>,
    pub max_fee_per_gas: Option<u128>,
    pub nonce: Option<u64>,
}
```

## Substrate Integration

### query()

Queries Substrate storage.

```rust
pub async fn query<T: Decode>(
    &self,
    pallet: &str,
    storage: &str,
    args: Vec<u8>
) -> Result<T, SelendraError>
```

#### Example

```rust
use codec::Decode;
use sp_runtime::AccountId32;

let account_id = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    .parse::<AccountId32>()?;

let account_info: SystemAccountInfo = sdk.query(
    "System",
    "Account",
    account_id.encode()
).await?;

println!("Account info: {:?}", account_info);
```

### tx()

Creates a Substrate transaction.

```rust
pub fn tx(&self, pallet: &str, method: &str) -> Result<TransactionBuilder, SelendraError>
```

#### Example

```rust
let tx = sdk.tx("Balances", "transfer")?
    .dest("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY".parse()?)
    .value(1_000_000_000_000u128)
    .sign_and_send("my-mnemonic")
    .await?;

println!("Transaction hash: {}", tx.hash);
```

### get_runtime_version()

Gets the current runtime version.

```rust
pub async fn get_runtime_version(&self) -> Result<RuntimeVersion, SelendraError>
```

#### Returns

```rust
pub struct RuntimeVersion {
    pub spec_version: u32,
    pub impl_version: u32,
    pub authoring_version: u32,
    pub transaction_version: u32,
    pub state_version: u32,
}
```

### subscribe_to_heads()

Subscribes to new block headers.

```rust
pub async fn subscribe_to_heads<F>(
    &self,
    callback: F
) -> Result<(), SelendraError>
where
    F: Fn(BlockHeader) + Send + Sync + 'static,
```

#### Example

```rust
sdk.subscribe_to_heads(|header| {
    println!("New block: {}", header.number);
}).await?;
```

## Utilities

### format_balance()

Formats a balance value to human-readable format.

```rust
pub fn format_balance(
    balance: u128,
    decimals: u8
) -> String
```

#### Example

```rust
let formatted = sdk.format_balance(1_000_000_000_000, 12);
println!("Balance: {}", formatted); // "1.000000000000"
```

### parse_balance()

Parses a human-readable balance to u128.

```rust
pub fn parse_balance(
    balance: &str,
    decimals: u8
) -> Result<u128, SelendraError>
```

### address_to_evm()

Converts Substrate address to EVM address.

```rust
pub fn address_to_evm(substrate_address: &str) -> Result<String, SelendraError>
```

### evm_to_address()

Converts EVM address to Substrate address.

```rust
pub fn evm_to_address(evm_address: &str) -> Result<String, SelendraError>
```

### validate_address()

Validates an address format.

```rust
pub fn validate_address(address: &str) -> AddressType
```

#### Returns

```rust
pub enum AddressType {
    Substrate,
    Evm,
    Invalid,
}
```

### get_fee_estimate()

Gets current fee estimates.

```rust
pub async fn get_fee_estimate(&self) -> Result<FeeEstimate, SelendraError>
```

#### Returns

```rust
pub struct FeeEstimate {
    pub slow: FeeTier,
    pub average: FeeTier,
    pub fast: FeeTier,
}

pub struct FeeTier {
    pub max_fee_per_gas: u128,
    pub max_priority_fee_per_gas: u128,
    pub estimated_time: Duration,
}
```

## Types

### Account

```rust
pub struct Account {
    pub address: String,
    pub name: Option<String>,
    pub account_type: AccountType,
    pub public_key: Vec<u8>,
}
```

### TransactionEvent

```rust
pub struct TransactionEvent {
    pub event_id: String,
    pub data: Vec<u8>,
    pub phase: TransactionPhase,
}

pub enum TransactionPhase {
    ApplyExtrinsic(u32),
    Finalization,
    Initialization,
}
```

### EvmBlock

```rust
pub struct EvmBlock {
    pub number: u64,
    pub hash: String,
    pub parent_hash: String,
    pub timestamp: u64,
    pub transactions: Vec<EvmTransaction>,
    pub gas_used: u64,
    pub gas_limit: u64,
}
```

### ContractABI

```rust
pub struct ContractABI {
    pub functions: HashMap<String, ContractFunction>,
    pub events: HashMap<String, ContractEvent>,
}

pub struct ContractFunction {
    pub name: String,
    pub inputs: Vec<Param>,
    pub outputs: Vec<Param>,
    pub constant: bool,
}

pub struct Param {
    pub name: String,
    pub param_type: String,
}
```

## Error Handling

### SelendraError

Main error enum for the SDK.

```rust
#[derive(Debug, thiserror::Error)]
pub enum SelendraError {
    #[error("Connection error: {0}")]
    Connection(String),

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Insufficient balance: required {required}, available {available}")]
    InsufficientBalance { required: u128, available: u128 },

    #[error("Transaction failed: {0}")]
    TransactionFailed(String),

    #[error("Contract error: {0}")]
    ContractError(String),

    #[error("Timeout: operation took longer than {0:?}")]
    Timeout(Duration),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Hex error: {0}")]
    Hex(#[from] hex::FromHexError),

    #[error("Substrate error: {0}")]
    Substrate(#[from] sp_runtime::RuntimeString),

    #[error("Web3 error: {0}")]
    Web3(#[from] web3::Error),
}
```

### Error Handling Examples

```rust
use selendra_sdk::SelendraError;

match result {
    Ok(data) => println!("Success: {:?}", data),
    Err(SelendraError::InsufficientBalance { required, available }) => {
        eprintln!("Not enough balance! Need {}, have {}", required, available);
    }
    Err(SelendraError::InvalidAddress(address)) => {
        eprintln!("Invalid address format: {}", address);
    }
    Err(SelendraError::Connection(msg)) => {
        eprintln!("Connection failed: {}", msg);
    }
    Err(error) => {
        eprintln!("Unexpected error: {}", error);
    }
}
```

### Result Type

Most SDK functions return `Result<T, SelendraError>` for proper error handling:

```rust
pub type SelendraResult<T> = Result<T, SelendraError>;
```

### Retry Logic

The SDK includes built-in retry logic for network operations:

```rust
impl SelendraSDK {
    async fn with_retry<F, T>(&self, operation: F) -> SelendraResult<T>
    where
        F: Fn() -> Pin<Box<dyn Future<Output = SelendraResult<T>> + Send>>,
    {
        let mut last_error = None;

        for attempt in 0..=self.retry_attempts {
            match operation().await {
                Ok(result) => return Ok(result),
                Err(error) if attempt < self.retry_attempts => {
                    last_error = Some(error);
                    tokio::time::sleep(self.retry_delay).await;
                }
                Err(error) => return Err(error),
            }
        }

        Err(last_error.unwrap())
    }
}
```

## Async Patterns

All async operations use Rust's `async/await` syntax and require a runtime:

```rust
#[tokio::main]
async fn main() -> SelendraResult<()> {
    let mut sdk = SelendraSDK::new(Network::Mainnet, "wss://rpc.selendra.org")?;

    sdk.connect().await?;
    let balance = sdk.get_balance("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY").await?;

    println!("Balance: {}", balance.free);

    Ok(())
}
```

For more advanced patterns, you can use `tokio` primitives:

```rust
use tokio::time::timeout;
use std::time::Duration;

let result = timeout(
    Duration::from_secs(30),
    sdk.get_balance(address)
).await??;
```

---

This API reference covers all major functionality of the Selendra Rust SDK. For more examples and use cases, check out our [examples directory](../../examples/) and [tutorials](../tutorials/).
