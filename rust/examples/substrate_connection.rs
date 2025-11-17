//! Substrate Connection Example - Task 1.7
//!
//! This example demonstrates the Substrate wrapper functionality using selendra_client.

use selendra_sdk::substrate::{Connection, keypair_from_string};
use selendra_sdk::Result;

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();

    println!("🔗 Substrate Connection Example");
    println!("================================\n");

    // Connect to Selendra testnet
    let endpoint = "wss://rpc-testnet.selendra.org";
    println!("📡 Connecting to: {}", endpoint);

    let connection = Connection::new(endpoint).await?;
    println!("✅ Connected successfully\n");

    // Create keypair from seed
    let seed = "//Alice";
    let keypair = keypair_from_string(seed);
    println!("🔑 Keypair Information:");
    println!("   Account ID: {}", keypair.account_id());
    println!("   SS58 Address: {}\n", keypair.to_ss58check());

    // Create signed connection
    let signed = connection.sign(&keypair)?;
    println!("📝 Created signed connection\n");

    // Query balance
    println!("💰 Querying account balance...");
    match signed.get_balance().await {
        Ok(balance) => {
            println!("   Balance: {} (raw units)", balance);
            println!("   Balance: {:.4} SEL\n", balance as f64 / 1_000_000_000_000.0);
        }
        Err(e) => {
            println!("   ⚠️  Failed to query balance: {}\n", e);
        }
    }

    // Query account ID
    println!("👤 Account Details:");
    println!("   Account ID: {}", signed.account_id());
    println!("   SS58 Address: {}\n", signed.account_id().to_string());

    // Example: Transfer (commented out to avoid actual transactions)
    println!("💸 Transfer Example (commented out):");
    println!("   // Create recipient account ID");
    println!("   // let to = AccountId32::from([0u8; 32]);");
    println!("   // let amount = 1_000_000_000_000u128; // 1 SEL");
    println!("   // let tx_hash = signed.transfer(to, amount).await?;");
    println!("   // println!(\"Transaction submitted: {{}}\", tx_hash);\n");

    println!("✅ Example completed successfully!");
    println!("\n�� Next steps:");
    println!("   - Uncomment transfer code to send tokens");
    println!("   - Run integration tests: cargo test");
    println!("   - Explore Priority 2 features (staking, governance)");

    Ok(())
}
