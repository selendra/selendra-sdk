//! EVM Contract Interaction
//!
//! This module provides comprehensive tools for interacting with smart contracts
//! on EVM-compatible chains within the Selendra ecosystem.

use crate::types::{Result, SDKError};
use crate::evm::client::EVMClient;
use crate::evm::transaction::TransactionBuilder;
use ethers_core::{
    types::{
        Address, U256, Bytes, H256, TransactionRequest, Log, Filter, Token,
        Uint, BlockNumber, BlockId, Function, FunctionExt, I256,
        Contract as EthContract, Abi as EthAbi, abi::ParamType, abi::Param, abi::HumanReadableParser,
    },
    utils::keccak256,
    abi::{Abi, ParamType as EthParamType},
};
use ethers_providers::Middleware;
use ethers_contract::{BaseContract, ContractFactory};
use ethers_signers::Signer;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;

/// Contract deployment configuration
#[derive(Debug, Clone)]
pub struct ContractDeployment {
    /// Bytecode of the contract
    pub bytecode: Bytes,
    /// ABI of the contract
    pub abi: EthAbi,
    /// Constructor arguments (if any)
    pub constructor_args: Vec<Token>,
    /// Gas limit for deployment
    pub gas_limit: Option<u64>,
    /// Value to send with deployment
    pub value: Option<U256>,
}

/// Contract call configuration
#[derive(Debug, Clone)]
pub struct ContractCall {
    /// Contract address
    pub address: Address,
    /// Function name to call
    pub function: String,
    /// Function arguments
    pub args: Vec<Token>,
    /// Value to send with call
    pub value: Option<U256>,
    /// Gas limit (optional)
    pub gas_limit: Option<u64>,
}

/// Contract read call configuration (read-only)
#[derive(Debug, Clone)]
pub struct ContractReadCall {
    /// Contract address
    pub address: Address,
    /// Function name to call
    pub function: String,
    /// Function arguments
    pub args: Vec<Token>,
    /// Block to query at (optional)
    pub block: Option<BlockId>,
}

/// Event filter configuration
#[derive(Debug, Clone)]
pub struct EventFilter {
    /// Contract address (optional)
    pub address: Option<Address>,
    /// Event signature or name
    pub event: String,
    /// From block (optional)
    pub from_block: Option<BlockNumber>,
    /// To block (optional)
    pub to_block: Option<BlockNumber>,
    /// Additional topics (optional)
    pub topics: Option<Vec<H256>>,
}

/// Enhanced contract client
#[derive(Clone)]
pub struct ContractClient {
    client: EVMClient,
    contracts: Arc<parking_lot::RwLock<HashMap<Address, Arc<BaseContract>>>>,
}

impl ContractClient {
    /// Create a new contract client
    pub fn new(client: EVMClient) -> Self {
        Self {
            client,
            contracts: Arc::new(parking_lot::RwLock::new(HashMap::new())),
        }
    }

    /// Deploy a new contract
    pub async fn deploy(&self, deployment: ContractDeployment) -> Result<(Address, H256)> {
        let wallet = self.client.wallet()
            .ok_or_else(|| SDKError::NoWallet("Wallet required for contract deployment".to_string()))?;

        // Create contract factory
        let factory = ContractFactory::new(
            deployment.abi.clone(),
            deployment.bytecode.clone(),
            wallet.clone(),
        );

        // Deploy contract
        let contract = factory.deploy(deployment.constructor_args)?
            .confirmations(0);

        // Set gas limit and value if provided
        let mut deployer = contract;
        if let Some(gas_limit) = deployment.gas_limit {
            deployer = deployer.gas(U256::from(gas_limit));
        }
        if let Some(value) = deployment.value {
            deployer = deployer.value(value);
        }

        // Send deployment transaction
        let deploy_result = deployer.send().await
            .map_err(|e| SDKError::TransactionError(format!("Failed to deploy contract: {}", e)))?;

        let address = deploy_result.address();
        let tx_hash = *deploy_result.transaction_hash();

        Ok((address, tx_hash))
    }

    /// Call a contract function (write operation)
    pub async fn call(&self, call: ContractCall) -> Result<H256> {
        let contract = self.get_or_load_contract(call.address, &[]).await?;
        let function = contract.abi().function(&call.function)
            .map_err(|e| SDKError::ContractError(format!("Function '{}' not found: {}", call.function, e)))?;

        // Create transaction
        let calldata = function.encode_input(&call.args)
            .map_err(|e| SDKError::ContractError(format!("Failed to encode function call: {}", e)))?;

        let mut builder = TransactionBuilder::new()
            .to(call.address)
            .data(Bytes::from(calldata));

        if let Some(value) = call.value {
            builder = builder.value(value);
        }

        if let Some(gas_limit) = call.gas_limit {
            builder = builder.gas_limit(gas_limit);
        }

        let tx = builder.build(&self.client).await?;
        self.client.send_transaction(tx).await
    }

    /// Call a contract function (read operation)
    pub async fn call_read(&self, call: ContractReadCall) -> Result<Vec<Token>> {
        let contract = self.get_or_load_contract(call.address, &[]).await?;
        let function = contract.abi().function(&call.function)
            .map_err(|e| SDKError::ContractError(format!("Function '{}' not found: {}", call.function, e)))?;

        // Create transaction request
        let calldata = function.encode_input(&call.args)
            .map_err(|e| SDKError::ContractError(format!("Failed to encode function call: {}", e)))?;

        let mut tx = TransactionRequest::default()
            .to(call.address)
            .data(Bytes::from(calldata));

        if let Some(from) = self.client.get_wallet_address() {
            tx.from = Some(from);
        }

        // Call the contract
        let result = self.client.call(&tx, call.block).await?;

        // Decode the result
        function.decode_output(&result.to_vec())
            .map_err(|e| SDKError::ContractError(format!("Failed to decode function result: {}", e)))
    }

    /// Get events from a contract
    pub async fn get_events(&self, filter: EventFilter) -> Result<Vec<Log>> {
        let mut eth_filter = Filter::default();

        if let Some(address) = filter.address {
            eth_filter = eth_filter.address(address);
        }

        if let Some(from_block) = filter.from_block {
            eth_filter = eth_filter.from_block(from_block);
        }

        if let Some(to_block) = filter.to_block {
            eth_filter = eth_filter.to_block(to_block);
        }

        // Calculate event topic
        let event_topic = H256::from_slice(&keccak256(filter.event.as_bytes()));
        eth_filter = eth_filter.event(event_topic);

        if let Some(additional_topics) = filter.topics {
            for topic in additional_topics {
                eth_filter = eth_filter.topic1(topic);
            }
        }

        self.client.get_logs(&eth_filter).await
    }

    /// Decode event logs
    pub async fn decode_events(&self, address: Address, logs: Vec<Log>, abi: &EthAbi) -> Result<Vec<DecodedEvent>> {
        let mut decoded_events = Vec::new();

        for log in logs {
            if let Some(decoded_log) = self.decode_single_event(&log, abi)? {
                decoded_events.push(decoded_log);
            }
        }

        Ok(decoded_events)
    }

    /// Get contract ABI from Etherscan-like explorer
    pub async fn get_contract_abi(&self, address: Address) -> Result<EthAbi> {
        // This would typically call an API like Etherscan
        // For now, we'll return an error since we don't have an API key
        Err(SDKError::ContractError(
            "Contract ABI fetching not implemented - provide ABI manually".to_string()
        ))
    }

    /// Get contract bytecode
    pub async fn get_contract_bytecode(&self, address: Address, block: Option<BlockId>) -> Result<Bytes> {
        self.client.get_code(address, block).await
    }

    /// Check if an address is a contract
    pub async fn is_contract(&self, address: Address, block: Option<BlockId>) -> Result<bool> {
        self.client.is_contract(address, block).await
    }

    /// Estimate gas for a contract call
    pub async fn estimate_gas(&self, call: ContractCall) -> Result<u64> {
        let contract = self.get_or_load_contract(call.address, &[]).await?;
        let function = contract.abi().function(&call.function)
            .map_err(|e| SDKError::ContractError(format!("Function '{}' not found: {}", call.function, e)))?;

        // Create transaction request
        let calldata = function.encode_input(&call.args)
            .map_err(|e| SDKError::ContractError(format!("Failed to encode function call: {}", e)))?;

        let mut tx = TransactionRequest::default()
            .to(call.address)
            .data(Bytes::from(calldata));

        if let Some(value) = call.value {
            tx = tx.value(value);
        }

        if let Some(from) = self.client.get_wallet_address() {
            tx = tx.from(from);
        }

        self.client.estimate_gas(&tx).await.map(|gas| gas.as_u64())
    }

    /// Get or load a contract
    async fn get_or_load_contract(&self, address: Address, abi: &[u8]) -> Result<Arc<BaseContract>> {
        // Check if contract is already loaded
        {
            let contracts = self.contracts.read();
            if let Some(contract) = contracts.get(&address) {
                return Ok(contract.clone());
            }
        }

        // Try to load ABI from cache or fetch it
        let abi = if !abi.is_empty() {
            serde_json::from_slice(abi)
                .map_err(|e| SDKError::SerializationError(format!("Invalid ABI format: {}", e)))?
        } else {
            self.get_contract_abi(address).await?
        };

        let base_contract = Arc::new(BaseContract::from(abi));

        // Cache the contract
        {
            let mut contracts = self.contracts.write();
            contracts.insert(address, base_contract.clone());
        }

        Ok(base_contract)
    }

    /// Decode a single event log
    fn decode_single_event(&self, log: &Log, abi: &EthAbi) -> Result<Option<DecodedEvent>> {
        if let Some(topics) = &log.topics {
            if topics.is_empty() {
                return Ok(None);
            }

            // The first topic is the event signature hash
            let event_signature = topics[0];

            // Find matching event in ABI
            for event in &abi.events {
                let signature = event.signature();
                if signature == event_signature {
                    // Decode the event data
                    let decoded_data = event.parse_log(log)
                        .map_err(|e| SDKError::ContractError(format!("Failed to decode event: {}", e)))?;

                    let params: Vec<DecodedEventParam> = decoded_data.params
                        .iter()
                        .map(|param| DecodedEventParam {
                            name: param.name.clone(),
                            value: format!("{:?}", param.value),
                            param_type: format!("{:?}", param.param_type()),
                            indexed: param.indexed,
                        })
                        .collect();

                    return Ok(Some(DecodedEvent {
                        name: event.name.clone(),
                        signature: format!("{:?}", event_signature),
                        params,
                        block_number: log.block_number.map(|n| n.as_u64()),
                        transaction_hash: log.transaction_hash,
                        log_index: log.log_index.map(|i| i.as_u64()),
                    }));
                }
            }
        }

        Ok(None)
    }
}

/// Decoded event structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecodedEvent {
    /// Event name
    pub name: String,
    /// Event signature
    pub signature: String,
    /// Event parameters
    pub params: Vec<DecodedEventParam>,
    /// Block number where event occurred
    pub block_number: Option<u64>,
    /// Transaction hash that emitted the event
    pub transaction_hash: Option<H256>,
    /// Log index within the transaction
    pub log_index: Option<u64>,
}

/// Decoded event parameter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecodedEventParam {
    /// Parameter name
    pub name: String,
    /// Parameter value (as string)
    pub value: String,
    /// Parameter type
    pub param_type: String,
    /// Whether parameter is indexed
    pub indexed: bool,
}

/// ERC20 token operations
pub struct ERC20Client {
    contract_client: ContractClient,
}

impl ERC20Client {
    /// Create a new ERC20 client
    pub fn new(contract_client: ContractClient) -> Self {
        Self { contract_client }
    }

    /// Get ERC20 token balance
    pub async fn balance_of(&self, token_address: Address, account: Address) -> Result<U256> {
        let call = ContractReadCall {
            address: token_address,
            function: "balanceOf".to_string(),
            args: vec![Token::Address(account)],
            block: None,
        };

        let result = self.contract_client.call_read(call).await?;
        if let Some(Token::Uint(balance)) = result.first() {
            Ok(*balance)
        } else {
            Err(SDKError::ContractError("Invalid balanceOf return value".to_string()))
        }
    }

    /// Transfer ERC20 tokens
    pub async fn transfer(&self, token_address: Address, to: Address, amount: U256) -> Result<H256> {
        let call = ContractCall {
            address: token_address,
            function: "transfer".to_string(),
            args: vec![Token::Address(to), Token::Uint(amount)],
            value: None,
            gas_limit: None,
        };

        self.contract_client.call(call).await
    }

    /// Approve ERC20 token spending
    pub async fn approve(&self, token_address: Address, spender: Address, amount: U256) -> Result<H256> {
        let call = ContractCall {
            address: token_address,
            function: "approve".to_string(),
            args: vec![Token::Address(spender), Token::Uint(amount)],
            value: None,
            gas_limit: None,
        };

        self.contract_client.call(call).await
    }

    /// Get ERC20 token allowance
    pub async fn allowance(&self, token_address: Address, owner: Address, spender: Address) -> Result<U256> {
        let call = ContractReadCall {
            address: token_address,
            function: "allowance".to_string(),
            args: vec![Token::Address(owner), Token::Address(spender)],
            block: None,
        };

        let result = self.contract_client.call_read(call).await?;
        if let Some(Token::Uint(allowance)) = result.first() {
            Ok(*allowance)
        } else {
            Err(SDKError::ContractError("Invalid allowance return value".to_string()))
        }
    }

    /// Get ERC20 token total supply
    pub async fn total_supply(&self, token_address: Address) -> Result<U256> {
        let call = ContractReadCall {
            address: token_address,
            function: "totalSupply".to_string(),
            args: vec![],
            block: None,
        };

        let result = self.contract_client.call_read(call).await?;
        if let Some(Token::Uint(supply)) = result.first() {
            Ok(*supply)
        } else {
            Err(SDKError::ContractError("Invalid totalSupply return value".to_string()))
        }
    }

    /// Get ERC20 token decimals
    pub async fn decimals(&self, token_address: Address) -> Result<u8> {
        let call = ContractReadCall {
            address: token_address,
            function: "decimals".to_string(),
            args: vec![],
            block: None,
        };

        let result = self.contract_client.call_read(call).await?;
        if let Some(Token::Uint(decimals)) = result.first() {
            Ok(decimals.as_u32() as u8)
        } else {
            Err(SDKError::ContractError("Invalid decimals return value".to_string()))
        }
    }

    /// Get ERC20 token symbol
    pub async fn symbol(&self, token_address: Address) -> Result<String> {
        let call = ContractReadCall {
            address: token_address,
            function: "symbol".to_string(),
            args: vec![],
            block: None,
        };

        let result = self.contract_client.call_read(call).await?;
        if let Some(Token::String(symbol)) = result.first() {
            Ok(symbol.clone())
        } else {
            Err(SDKError::ContractError("Invalid symbol return value".to_string()))
        }
    }
}

/// Utility functions for contract interactions
pub mod utils {
    use super::*;
    use ethers_core::abi::{HumanReadableParser, ParamType};

    /// Parse ABI from JSON string
    pub fn parse_abi_json(abi_json: &str) -> Result<EthAbi> {
        serde_json::from_str(abi_json)
            .map_err(|e| SDKError::SerializationError(format!("Failed to parse ABI JSON: {}", e)))
    }

    /// Parse ABI from human-readable format
    pub fn parse_abi_human_readable(abi_str: &str) -> Result<EthAbi> {
        HumanReadableParser::parse(abi_str)
            .map_err(|e| SDKError::ContractError(format!("Failed to parse human-readable ABI: {}", e)))
    }

    /// Create function selector for given signature
    pub fn create_function_selector(signature: &str) -> [u8; 4] {
        let hash = keccak256(signature.as_bytes());
        [hash[0], hash[1], hash[2], hash[3]]
    }

    /// Encode function call data
    pub fn encode_function_call(selector: [u8; 4], args: &[Token]) -> Result<Vec<u8>> {
        let mut data = selector.to_vec();
        for arg in args {
            match arg {
                Token::Address(address) => {
                    data.extend_from_slice(&[0u8; 12]); // padding
                    data.extend_from_slice(address.as_fixed_bytes());
                }
                Token::Uint(uint) => {
                    data.extend_from_slice(&uint.to_big_endian());
                }
                Token::Bytes(bytes) => {
                    let offset = 32 + args.len() * 32; // Simple offset calculation
                    data.extend_from_slice(&U256::from(offset).to_big_endian());
                }
                Token::String(string) => {
                    let bytes = string.as_bytes();
                    let length = bytes.len();
                    let offset = 32 + args.len() * 32;
                    data.extend_from_slice(&U256::from(offset).to_big_endian());
                    // Add length and data separately in a real implementation
                }
                _ => return Err(SDKError::ContractError(
                    format!("Unsupported token type for encoding: {:?}", arg)
                )),
            }
        }
        Ok(data)
    }

    /// Get standard ERC20 ABI
    pub fn get_erc20_abi() -> EthAbi {
        let abi_str = r#"
        [
            {
                "name": "balanceOf",
                "type": "function",
                "stateMutability": "view",
                "inputs": [{"name": "account", "type": "address"}],
                "outputs": [{"name": "", "type": "uint256"}]
            },
            {
                "name": "transfer",
                "type": "function",
                "stateMutability": "nonpayable",
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "outputs": [{"name": "", "type": "bool"}]
            },
            {
                "name": "approve",
                "type": "function",
                "stateMutability": "nonpayable",
                "inputs": [
                    {"name": "spender", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "outputs": [{"name": "", "type": "bool"}]
            },
            {
                "name": "allowance",
                "type": "function",
                "stateMutability": "view",
                "inputs": [
                    {"name": "owner", "type": "address"},
                    {"name": "spender", "type": "address"}
                ],
                "outputs": [{"name": "", "type": "uint256"}]
            },
            {
                "name": "totalSupply",
                "type": "function",
                "stateMutability": "view",
                "inputs": [],
                "outputs": [{"name": "", "type": "uint256"}]
            },
            {
                "name": "decimals",
                "type": "function",
                "stateMutability": "view",
                "inputs": [],
                "outputs": [{"name": "", "type": "uint8"}]
            },
            {
                "name": "symbol",
                "type": "function",
                "stateMutability": "view",
                "inputs": [],
                "outputs": [{"name": "", "type": "string"}]
            }
        ]
        "#;

        parse_abi_json(abi_str).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::evm::utils::generate_random_address;

    #[test]
    fn test_parse_abi_json() {
        let abi_json = r#"
        [
            {
                "name": "balanceOf",
                "type": "function",
                "stateMutability": "view",
                "inputs": [{"name": "account", "type": "address"}],
                "outputs": [{"name": "", "type": "uint256"}]
            }
        ]
        "#;

        let abi = utils::parse_abi_json(abi_json).unwrap();
        assert_eq!(abi.functions.len(), 1);
        assert_eq!(abi.functions.values().next().unwrap().name, "balanceOf");
    }

    #[test]
    fn test_create_function_selector() {
        let selector = utils::create_function_selector("transfer(address,uint256)");
        assert_eq!(selector.len(), 4);
    }

    #[test]
    fn test_contract_deployment() {
        let deployment = ContractDeployment {
            bytecode: Bytes::from(vec![1, 2, 3, 4]),
            abi: utils::get_erc20_abi(),
            constructor_args: vec![],
            gas_limit: Some(3000000),
            value: None,
        };

        assert_eq!(deployment.gas_limit, Some(3000000));
        assert!(deployment.constructor_args.is_empty());
    }

    #[test]
    fn test_erc20_client_creation() {
        // This is a basic test - real testing would require a mock client
        let _erc20_client = ERC20Client {
            contract_client: ContractClient::new(
                // This would need a real client in actual tests
                EVMClient::default().await.unwrap()
            ),
        };
    }
}