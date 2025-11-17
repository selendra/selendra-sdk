// Substrate Governance Example
// Demonstrates treasury and elections queries using the Selendra SDK

use selendra_sdk::substrate::{Connection, keypair_from_string};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to Selendra testnet
    let conn = Connection::new("wss://rpc-testnet.selendra.org").await?;
    println!("✅ Connected to Selendra");

    // Create keypair from seed phrase
    let keypair = keypair_from_string("//Alice");
    println!("📝 Account: {}", keypair.to_ss58check());

    // Sign connection for transactions
    let signed = conn.sign(&keypair)?;
    println!("✅ Signed connection ready");

    // Query treasury information
    println!("\n🏛️  Treasury Information:");
    
    let proposals_count = conn.get_treasury_proposals_count().await?;
    println!("  - Proposals count: {:?}", proposals_count);
    
    let approvals = conn.get_treasury_approvals().await?;
    println!("  - Approved proposals: {:?}", approvals);

    // Query elections/validators
    println!("\n🗳️  Elections Information:");
    
    let validators = conn.get_current_era_validators().await?;
    println!("  - Current validators count: {}", validators.len());
    
    let reserved_validators = conn.get_next_era_reserved_validators().await?;
    println!("  - Next era reserved validators: {}", reserved_validators.len());

    // Example: Propose treasury spend
    // UNCOMMENT to execute (requires council/sudo)
    // use sp_runtime::AccountId32;
    // let beneficiary = AccountId32::from([0u8; 32]);
    // let amount = 1_000_000_000_000_000_000u128; // 1 SEL
    // let tx_hash = signed.treasury_propose_spend(amount, beneficiary).await?;
    // println!("✅ Treasury proposal: {}", tx_hash);

    Ok(())
}
