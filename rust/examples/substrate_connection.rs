//! Substrate Connection Example
//!
//! This example demonstrates using the Selendra SDK for Substrate operations,
//! maintaining full compatibility with the existing selendra_client.

use selendra_sdk::substrate::{Connection, SignedConnection, KeyPair, TxStatus, keypair_from_string};
use selendra_sdk::{Result, SDKError};

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();

    println!("🔗 Substrate Connection Example");
    println!("================================");

    // Create connection to Selendra network
    let endpoint = "wss://rpc.selendra.org";
    println!("Connecting to: {}", endpoint);

    let connection = Connection::new(endpoint).await?;
    println!("✅ Connected to Selendra network");

    // Create a keypair for signing transactions
    let seed = "Alice loves selendra";
    let keypair = keypair_from_string(seed);
    println!("🔑 Created keypair from seed");
    println!("   Account ID: {}", keypair.account_id());
    println!("   SS58 Address: {}", keypair.account_id().to_ss58check());

    // Create signed connection
    let signed_connection = connection.sign(&keypair)?;
    println!("📝 Created signed connection");

    // Get chain information
    let chain_info = signed_connection.chain_info().await?;
    println!("📊 Chain Information:");
    println!("   Chain ID: {}", chain_info.chain_id);
    println!("   Chain Name: {}", chain_info.name);
    println!("   Runtime Version: {}", chain_info.runtime_version);
    println!("   Version: {}", chain_info.version);

    // Get account information
    let account_info = signed_connection.get_account_info().await?;
    println!("💰 Account Information:");
    println!("   Free Balance: {} SEL", account_info.data.free);
    println!("   Reserved Balance: {} SEL", account_info.data.reserved);
    println!("   Nonce: {}", account_info.nonce);

    // Get latest block
    let latest_block = signed_connection.get_latest_block().await?;
    println!("🧱 Latest Block:");
    println!("   Block Number: {}", latest_block.number);
    println!("   Block Hash: {:?}", latest_block.hash);

    // Transfer tokens example (commented out to avoid actual transactions)
    /*
    println!("💸 Transferring tokens...");
    let recipient = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        .parse()
        .map_err(|e| SDKError::InvalidAddress(format!("Invalid recipient address: {}", e)))?;

    let tx_info = signed_connection.transfer(recipient, 1000000000000u128).await?;
    println!("   Transaction Hash: {:?}", tx_info.tx_hash);
    println!("   Transaction Fee: {}", tx_info.fee);

    // Wait for transaction to be included
    let block_hash = signed_connection.wait_for_transaction(tx_info.tx_hash, TxStatus::InBlock).await?;
    println!("   Transaction included in block: {:?}", block_hash);

    // Get final transaction status
    let final_info = signed_connection.get_transaction_info(tx_info.tx_hash).await?;
    println!("   Final Status: {:?}", final_info.status);
    */

    // Get staking information
    match signed_connection.get_staking_info().await {
        Ok(staking_info) => {
            println!("🏛️  Staking Information:");
            println!("   Stash Account: {:?}", staking_info.stash);
            println!("   Controller Account: {:?}", staking_info.controller);
            println!("   Total Stake: {}", staking_info.total);
            println!("   Active Stake: {}", staking_info.active);
        }
        Err(e) => {
            println!("ℹ️  Staking info not available: {}", e);
        }
    }

    // Get treasury information
    match signed_connection.get_treasury_info().await {
        Ok(treasury_info) => {
            println!("🏛️  Treasury Information:");
            println!("   Balance: {}", treasury_info.balance);
            println!("   Proposal Count: {}", treasury_info.proposal_count);
        }
        Err(e) => {
            println!("ℹ️  Treasury info not available: {}", e);
        }
    }

    println!("\n✨ Example completed successfully!");

    Ok(())
}