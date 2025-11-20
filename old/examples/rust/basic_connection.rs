//! Basic connection example for the Selendra SDK
//!
//! This example demonstrates how to connect to the Selendra network
//! and perform basic operations like getting chain info.

use selendra_sdk::{SelendraSDK, Network};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the SDK
    println!("Initializing Selendra SDK...");

    let sdk = SelendraSDK::new()
        .with_endpoint("wss://rpc.selendra.org")?
        .with_network(Network::Selendra)
        .await?;

    println!("✓ Connected to Selendra network");

    // Get chain information
    let chain_info = sdk.chain_info().await?;
    println!("Chain Information:");
    println!("  Name: {}", chain_info.name);
    println!("  Version: {}", chain_info.version);
    println!("  Chain ID: {}", chain_info.chain_id);

    // Get current block number
    let block_number = sdk.get_block_number().await?;
    println!("Current block number: {}", block_number);

    // Create a new account
    let account = sdk.create_account()?;
    println!("Created account: {}", account.address());

    // Get account balance
    let balance = sdk.get_balance(&account.address()).await?;
    println!("Account balance: {}", balance);

    println!("✓ Basic operations completed successfully");

    Ok(())
}