// Substrate Contracts Example
// Demonstrates smart contract interaction using the Selendra SDK

use selendra_sdk::substrate::{Connection, keypair_from_string, Contract};
use sp_runtime::AccountId32;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to Selendra testnet
    let conn = Connection::new("wss://rpc-testnet.selendra.org").await?;
    println!("✅ Connected to Selendra");

    // Create keypair
    let keypair = keypair_from_string("//Alice");
    println!("📝 Account: {}", keypair.to_ss58check());

    // Sign connection
    let signed = conn.sign(&keypair)?;
    println!("✅ Signed connection ready");

    // Load contract (requires contract address and metadata file)
    // EXAMPLE - Replace with actual contract address
    let contract_address = AccountId32::from([0u8; 32]);
    
    // Load contract with metadata file
    // let contract = Contract::new(contract_address, "./metadata.json")?;
    // println!("📄 Contract loaded: {:?}", contract.address());

    // Example: Read contract state (no gas, no transaction)
    // let args = vec!["param1".to_string(), "param2".to_string()];
    // let result = contract.read(&conn.inner, "get_value", &args).await?;
    // println!("📖 Contract read result: {:?}", result);

    // Example: Execute contract call (submits transaction)
    // let value = 0u128; // SEL to send with call
    // let tx_hash = contract.exec(&signed.inner, "set_value", &args, value).await?;
    // println!("✅ Contract executed: {}", tx_hash);

    println!("\n⚠️  Note: This example requires:");
    println!("  1. A deployed ink! smart contract");
    println!("  2. Contract metadata.json file");
    println!("  3. Valid contract address");
    println!("  Uncomment the code above after setting up your contract");

    Ok(())
}
