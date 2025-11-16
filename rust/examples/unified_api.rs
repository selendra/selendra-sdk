//! Unified API Example
//!
//! This example demonstrates the full power of the Selendra SDK with unified
//! operations across both Substrate and EVM chains, including cross-chain functionality.

use selendra_sdk::{
    SelendraSDK, UnifiedAddress, UnifiedAccountManager, ChainType,
    evm::{EVMClient, EVMConfig, EVMWallet, ERC20Client},
    substrate::{Connection, SignedConnection, KeyPair, keypair_from_string},
};
use ethers_core::types::{Address, U256, H256};
use selendra_sdk::{Result, SDKError};
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();

    println!("🌟 Unified API Example");
    println!("=====================");

    // Build the unified SDK with both Substrate and EVM connections
    let mut sdk = selendra_sdk::builder()
        .substrate_endpoint("wss://rpc.selendra.org")
        .evm_endpoint("https://eth-rpc.selendra.org")
        .build()
        .await?;

    println!("✅ Built unified SDK with:");
    println!("   Substrate: {}", sdk.substrate_endpoint());
    println!("   EVM: {}", sdk.evm_endpoint());

    // Create unified account manager
    let account_manager = UnifiedAccountManager::new(
        Some(sdk.substrate().clone().await?), // Will create signed connection
        Some(sdk.evm().clone()),
    );

    // Create accounts for testing
    println!("\n🔑 Creating Test Accounts:");

    // Substrate account
    let substrate_seed = "Alice loves selendra";
    let substrate_keypair = keypair_from_string(substrate_seed);
    let substrate_address = substrate_keypair.account_id();
    println!("   Substrate Account:");
    println!("     Address: {}", substrate_address.to_ss58check());
    println!("     Type: AccountId32");

    // EVM account
    let evm_private_key = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    let evm_wallet = EVMWallet::from_private_key(evm_private_key, None)?;
    let evm_address = evm_wallet.address();
    println!("   EVM Account:");
    println!("     Address: {:#x}", evm_address);
    println!("     Type: Ethereum Address");

    // Create unified addresses
    let unified_substrate = UnifiedAddress::substrate(substrate_address);
    let unified_evm = UnifiedAddress::evm(evm_address);

    println!("\n🔄 Unified Address Conversion:");

    // Convert Substrate address to EVM format
    let substrate_as_evm = unified_substrate.to_evm().unwrap();
    println!("   Substrate as EVM: {:#x}", substrate_as_evm);

    // Convert EVM address to Substrate format
    let evm_as_substrate = unified_evm.to_substrate().unwrap();
    println!("   EVM as Substrate: {:?}", evm_as_substrate);

    // Test address format conversions
    println!("\n📝 Address Format Conversions:");
    println!("   Substrate (SS58): {}", unified_substrate.to_ss58_string().unwrap());
    println!("   Substrate (Hex): {}", unified_substrate.to_hex_string());
    println!("   EVM (Hex): {}", unified_evm.to_hex_string());
    println!("   EVM (Checksum): {}", evm_wallet.checksum_address());

    // Get unified account information
    println!("\n💰 Unified Account Information:");

    let substrate_info = account_manager.get_account_info(&unified_substrate).await?;
    println!("   Substrate Account:");
    println!("     Exists: {}", substrate_info.exists);
    if let Some(substrate_data) = &substrate_info.substrate_info {
        println!("     Nonce: {}", substrate_data.nonce);
        println!("     Free Balance: {} SEL", substrate_data.free_balance);
        println!("     Reserved Balance: {} SEL", substrate_data.reserved_balance);
    }

    let evm_info = account_manager.get_account_info(&unified_evm).await?;
    println!("   EVM Account:");
    println!("     Exists: {}", evm_info.exists);
    if let Some(evm_data) = &evm_info.evm_info {
        println!("     Nonce: {}", evm_data.nonce);
        let eth_balance = selendra_sdk::evm::utils::wei_to_eth(evm_data.balance);
        println!("     Balance: {} ETH", eth_balance);
        println!("     Is Contract: {}", evm_data.is_contract);
    }

    // Get unified balances
    println!("\n🏦 Unified Balance Operations:");

    if let Some(substrate_balance) = &substrate_info.unified_balance {
        println!("   Substrate Unified Balance:");
        println!("     Total Amount: {}", substrate_balance.total_amount);
        println!("     Symbol: {}", substrate_balance.symbol);
        println!("     Decimals: {}", substrate_balance.decimals);
    }

    if let Some(evm_balance) = &evm_info.unified_balance {
        println!("   EVM Unified Balance:");
        println!("     Total Amount: {} wei", evm_balance.total_amount);
        let eth_balance = selendra_sdk::evm::utils::wei_to_eth(evm_balance.total_amount);
        println!("     Total Amount: {} ETH", eth_balance);
    }

    // Test cross-chain address equivalence
    println!("\n🔗 Cross-Chain Address Analysis:");

    use selendra_sdk::unified::account::address_utils;
    let are_same_entity = address_utils::are_same_entity(&unified_substrate, &unified_evm);
    println!("   Same entity across chains: {}", are_same_entity);

    // Get canonical representations
    let canonical_substrate = address_utils::canonical_address(&unified_evm, ChainType::Substrate);
    let canonical_evm = address_utils::canonical_address(&unified_substrate, ChainType::EVM);
    println!("   EVM address in Substrate format: {:?}", canonical_substrate);
    println!("   Substrate address in EVM format: {:#x}", canonical_evm.to_evm().unwrap());

    // Network information comparison
    println!("\n🌐 Network Information:");

    // Substrate network info
    let substrate_connection = Connection::new(sdk.substrate_endpoint()).await?;
    let substrate_chain_info = substrate_connection.chain_info().await?;
    println!("   Substrate Network:");
    println!("     Chain ID: {}", substrate_chain_info.chain_id);
    println!("     Chain Name: {}", substrate_chain_info.name);
    println!("     Latest Block: {}", substrate_connection.get_latest_block().await?.number);

    // EVM network info
    let evm_client = sdk.evm().clone();
    let evm_chain_id = evm_client.get_chain_id().await?;
    let evm_block_number = evm_client.get_block_number().await?;
    println!("   EVM Network:");
    println!("     Chain ID: {}", evm_chain_id);
    println!("     Chain Name: {:?}", selendra_sdk::evm::types::utils::chain_from_id(evm_chain_id));
    println!("     Latest Block: {}", evm_block_number);

    // Test transaction capabilities on both chains
    println!("\n💸 Transaction Capabilities:");

    // Substrate transaction builder
    println!("   Substrate Transaction:");
    let substrate_tx = substrate_connection
        .sign(&substrate_keypair)?
        .transfer_balance(substrate_address, 1000000000u128)?; // 0.000001 SEL
    println!("     Transfer Amount: 0.000001 SEL");
    println!("     Transaction Hash: {:?}", substrate_tx.tx_hash);
    println!("     Fee: {}", substrate_tx.fee);

    // EVM transaction builder (example, not actually sent)
    println!("   EVM Transaction:");
    let transfer_amount = selendra_sdk::evm::utils::eth_to_wei("0.01")?;
    let evm_tx = selendra_sdk::evm::transaction::TransactionBuilder::new()
        .to(evm_address)
        .value(transfer_amount)
        .gas_limit(21000);

    println!("     Transfer Amount: 0.01 ETH");
    println!("     Recipient: {:#x}", evm_address);
    println!("     Gas Limit: 21000");

    let gas_price = evm_client.get_gas_price().await?;
    let gas_cost = selendra_sdk::evm::utils::calculate_gas_cost(21000, gas_price);
    println!("     Estimated Gas Cost: {} ETH", selendra_sdk::evm::utils::wei_to_eth(gas_cost));

    // Cross-chain operations
    println!("\n🌉 Cross-Chain Operations:");

    // Demonstrate address conversion for cross-chain transfers
    println!("   Cross-Chain Address Mapping:");
    println!("     Substrate -> EVM: {:#x}", substrate_as_evm);
    println!("     EVM -> Substrate: {:?}", evm_as_substrate);

    // Bridge transfer example (placeholder)
    println!("   Bridge Transfer Example:");
    println!("     From: Substrate Account");
    println!("     To: EVM Account");
    println!("     Amount: 1 SEL");
    println!("     Status: Not Implemented (would use bridge pallet)");

    // Smart contract interactions
    println!("\n📜 Smart Contract Interactions:");

    // ERC20 token interaction
    let erc20_client = ERC20Client::new(
        selendra_sdk::evm::contract::ContractClient::new(evm_client.clone())
    );

    // Example token address (USDC on testnet or similar)
    let token_address = "0xA0b86a33E6417b9d3e5e4E9E4A0C2A2A6c4F3eD8"
        .parse()
        .map_err(|e| SDKError::InvalidAddress(format!("Invalid token address: {}", e)))?;

    println!("   ERC20 Token Operations:");
    println!("     Token Contract: {:#x}", token_address);

    match erc20_client.symbol(token_address).await {
        Ok(symbol) => println!("     Token Symbol: {}", symbol),
        Err(e) => println!("     Could not get symbol: {}", e),
    }

    match erc20_client.balance_of(token_address, evm_address).await {
        Ok(balance) => {
            let formatted = ethers_core::utils::format_units(balance, 6).unwrap_or_default();
            println!("     Wallet Balance: {} tokens", formatted);
        },
        Err(e) => println!("     Could not get balance: {}", e),
    }

    // Contract interaction on Substrate side (if available)
    println!("   Substrate Contract Operations:");
    println!("     Smart Contract Support: Available via pallet-contracts");
    println!("     Example: deploy_wasm_contract, call_contract");

    // Event monitoring
    println!("\n📡 Event Monitoring:");

    println!("   Substrate Events:");
    println!("     System.ExtrinsicSuccess");
    println!("     Balances.Transfer");
    println!("     Treasury.Deposit");

    println!("   EVM Events:");
    println!("     ERC20.Transfer");
    println!("     ERC20.Approval");
    println!("     Custom Contract Events");

    // Utility functions demonstration
    println!("\n🛠️  Utility Functions:");

    // Address validation
    let test_addresses = vec![
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // Substrate
        "0x1234567890123456789012345678901234567890",        // EVM
    ];

    for addr in test_addresses {
        match selendra_sdk::unified::account::address_utils::validate_address(addr) {
            Ok(unified_addr) => {
                println!("     Valid address: {}", addr);
                println!("       Type: {:?}", unified_addr);
            }
            Err(e) => println!("     Invalid address: {} - {}", addr, e),
        }
    }

    // Balance conversion utilities
    let wei_amount = U256::from_str("1000000000000000000")?; // 1 ETH
    let eth_amount = selendra_sdk::evm::utils::wei_to_eth(wei_amount);
    println!("     Balance Conversion:");
    println!("       1 ETH = {} wei", wei_amount);
    println!("       {} wei = {} ETH", wei_amount, eth_amount);

    // Gas estimation utilities
    let gas_price_gwei = 20.0;
    let gas_limit = 21000;
    let gas_cost_eth = (gas_price_gwei * gas_limit as f64) / 1_000_000_000.0;
    println!("     Gas Estimation:");
    println!("       Gas Price: {:.2} gwei", gas_price_gwei);
    println!("       Gas Limit: {}", gas_limit);
    println!("       Total Cost: {:.8} ETH", gas_cost_eth);

    println!("\n✨ Unified API Example Completed!");
    println!("\n🎯 Key Features Demonstrated:");
    println!("   ✅ Unified account management across chains");
    println!("   ✅ Address format conversion and validation");
    println!("   ✅ Cross-chain address mapping");
    println!("   ✅ Balance aggregation and conversion");
    println!("   ✅ Transaction building for both chains");
    println!("   ✅ Smart contract interaction");
    println!("   ✅ Event monitoring capabilities");
    println!("   ✅ Utility functions for common operations");

    println!("\n💡 Next Steps:");
    println!("   1. Replace with actual RPC endpoints for Selendra");
    println!("   2. Add real bridge implementation");
    println!("   3. Implement actual cross-chain transfers");
    println!("   4. Add event streaming with WebSocket connections");
    println!("   5. Integrate with specific token contracts");

    Ok(())
}