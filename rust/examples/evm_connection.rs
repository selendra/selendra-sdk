//! EVM Connection Example
//!
//! This example demonstrates using the Selendra SDK for EVM operations
//! with comprehensive ethers-rs integration.

use selendra_sdk::evm::{EVMClient, EVMConfig, ERC20Client};
use selendra_sdk::evm::utils::generate_random_address;
use selendra_sdk::evm::transaction::{TransactionBuilder, GasEstimator};
use selendra_sdk::evm::account::{EVMWallet, AccountManager};
use selendra_sdk::evm::events::{EventListener, EventListenerConfig, EventFilterBuilder};
use ethers_core::types::{Address, U256, H256};
use selendra_sdk::{Result, SDKError};

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();

    println!("⚡ EVM Connection Example");
    println!("=========================");

    // Create EVM configuration
    let endpoint = "https://eth-rpc.selendra.org"; // Replace with actual endpoint
    println!("Connecting to: {}", endpoint);

    let config = EVMConfig::new(endpoint)
        .timeout(30)
        .max_retries(3);

    // Create EVM client
    let client = EVMClient::new(config).await?;
    println!("✅ Connected to EVM network");

    // Get chain information
    let chain_id = client.get_chain_id().await?;
    let block_number = client.get_block_number().await?;
    println!("📊 Network Information:");
    println!("   Chain ID: {}", chain_id);
    println!("   Latest Block: {}", block_number);

    // Create wallet for operations
    // IMPORTANT: This is a placeholder private key for example only
    // NEVER use hardcoded private keys in production code
    let private_key = std::env::var("EXAMPLE_PRIVATE_KEY")
        .unwrap_or_else(|_| "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string());
    let wallet = EVMWallet::from_private_key(&private_key, Some(chain_id))?;
    println!("🔑 Created wallet:");
    println!("   Address: {:#x}", wallet.address());
    println!("   Checksum: {}", wallet.checksum_address());

    // Create account manager
    let account_manager = AccountManager::new(client.clone());

    // Get account information
    let account_info = account_manager.get_account_info(wallet.address()).await?;
    println!("💰 Account Information:");
    println!("   Balance: {} wei", account_info.balance.unwrap_or_default());

    if let Some(balance) = account_info.balance {
        let eth_balance = selendra_sdk::evm::utils::wei_to_eth(balance);
        println!("   Balance: {} ETH", eth_balance);
    }

    println!("   Nonce: {}", account_info.nonce.unwrap_or(0));
    println!("   Is Contract: {}", account_info.is_contract.unwrap_or(false));

    // Test address operations
    let random_address = generate_random_address();
    println!("\n🔍 Address Operations:");
    println!("   Random Address: {:#x}", random_address);

    let checksum_address = selendra_sdk::evm::utils::checksum_address(random_address);
    println!("   Checksum: {}", checksum_address);

    // Test gas estimation
    let gas_estimator = GasEstimator::new(client.clone());
    let gas_price = gas_estimator.get_gas_price().await?;
    println!("\n⛽ Gas Information:");
    println!("   Current Gas Price: {} wei", gas_price);

    let gas_gwei = gas_price.as_u128() as f64 / 1_000_000_000.0;
    println!("   Current Gas Price: {:.6} gwei", gas_gwei);

    // Create a simple ETH transfer transaction
    let transfer_amount = selendra_sdk::evm::utils::eth_to_wei("0.01")?; // 0.01 ETH
    let tx_builder = TransactionBuilder::new()
        .to(random_address)
        .value(transfer_amount)
        .gas_limit(21000);

    println!("\n💸 Transaction Example:");
    println!("   Transfer Amount: {} ETH", selendra_sdk::evm::utils::wei_to_eth(transfer_amount));
    println!("   Recipient: {:#x}", random_address);

    // Estimate gas for transaction
    let tx_request = tx_builder.build(&client).await?;
    let estimated_gas = gas_estimator.estimate_gas(&tx_request).await?;
    println!("   Estimated Gas: {}", estimated_gas);

    // Calculate transaction cost
    let gas_cost = selendra_sdk::evm::utils::calculate_gas_cost(estimated_gas, gas_price);
    println!("   Gas Cost: {} wei", gas_cost);
    println!("   Gas Cost: {} ETH", selendra_sdk::evm::utils::wei_to_eth(gas_cost));

    // Test ERC20 operations (using a common token like USDC)
    let usdc_address = "0xA0b86a33E6417b9d3e5e4E9E4A0C2A2A6c4F3eD8"  // Example USDC address
        .parse()
        .map_err(|e| SDKError::InvalidAddress(format!("Invalid USDC address: {}", e)))?;

    println!("\n🪙 ERC20 Operations:");
    println!("   Testing with USDC contract: {:#x}", usdc_address);

    let erc20_client = ERC20Client::new(selendra_sdk::evm::contract::ContractClient::new(client.clone()));

    // Get token information
    match erc20_client.symbol(usdc_address).await {
        Ok(symbol) => println!("   Token Symbol: {}", symbol),
        Err(e) => println!("   Could not get token symbol: {}", e),
    }

    match erc20_client.decimals(usdc_address).await {
        Ok(decimals) => println!("   Token Decimals: {}", decimals),
        Err(e) => println!("   Could not get token decimals: {}", e),
    }

    match erc20_client.total_supply(usdc_address).await {
        Ok(total_supply) => {
            println!("   Total Supply: {} tokens", total_supply);
            let formatted_supply = ethers_core::utils::format_units(total_supply, 6).unwrap_or_default();
            println!("   Total Supply: {} USDC", formatted_supply);
        },
        Err(e) => println!("   Could not get total supply: {}", e),
    }

    // Get balance for our wallet
    match erc20_client.balance_of(usdc_address, wallet.address()).await {
        Ok(balance) => {
            let formatted_balance = ethers_core::utils::format_units(balance, 6).unwrap_or_default();
            println!("   Wallet Balance: {} USDC", formatted_balance);
        },
        Err(e) => println!("   Could not get wallet balance: {}", e),
    }

    // Test event listening
    println!("\n📡 Event Listening Example:");

    // Create event listener configuration
    let event_config = EventListenerConfig {
        addresses: Some(vec![usdc_address]),
        topics: None, // Listen to all events
        from_block: Some(ethers_core::types::BlockNumber::Latest),
        to_block: None,
        poll_interval_ms: 5000,
        batch_size: 100,
        enable_streaming: true,
    };

    let event_listener = EventListener::new(client.clone(), event_config);

    println!("   Created event listener for USDC contract");
    println!("   (Event listening would run in background in real application)");

    // Get recent events (last 10 blocks)
    let current_block = client.get_block_number().await?;
    let from_block = if current_block > 10 { current_block - 10 } else { 0 };

    let filter = EventFilterBuilder::new()
        .add_address(usdc_address)
        .from_block(ethers_core::types::BlockNumber::Number(from_block))
        .to_block(ethers_core::types::BlockNumber::Number(current_block))
        .build();

    match client.get_logs(&filter).await {
        Ok(logs) => {
            println!("   Found {} recent events", logs.len());
            for (i, log) in logs.iter().take(3).enumerate() {
                println!("     Event {}: Block #{}, Tx: {:#x}",
                    i + 1,
                    log.block_number.unwrap_or_default(),
                    log.transaction_hash.unwrap_or_default()
                );
            }
        },
        Err(e) => println!("   Could not fetch events: {}", e),
    }

    // Test contract code verification
    println!("\n🔍 Contract Verification:");

    let is_contract = client.is_contract(usdc_address, None).await?;
    println!("   USDC is a contract: {}", is_contract);

    let contract_code = client.get_code(usdc_address, None).await?;
    println!("   USDC contract code length: {} bytes", contract_code.len());

    // Test multiple account balances
    println!("\n👥 Multiple Account Balances:");
    let addresses = vec![
        wallet.address(),
        generate_random_address(),
        generate_random_address(),
    ];

    for (i, &address) in addresses.iter().enumerate() {
        let balance = client.get_balance(address, None).await?;
        let eth_balance = selendra_sdk::evm::utils::wei_to_eth(balance);
        println!("   Account {}: {:#x} - {} ETH", i + 1, address, eth_balance);
    }

    println!("\n✨ EVM example completed successfully!");
    println!("\n💡 Notes:");
    println!("   - Replace the RPC endpoint with actual Selendra EVM endpoint");
    println!("   - Replace the private key with a real test account");
    println!("   - Transaction operations are commented out to prevent real transfers");
    println!("   - Event listening would run continuously in a real application");

    Ok(())
}