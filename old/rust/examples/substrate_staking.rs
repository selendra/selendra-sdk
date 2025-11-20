// Substrate Staking Example
// Demonstrates staking operations using the Selendra SDK

use selendra_sdk::substrate::{Connection, keypair_from_string};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to Selendra testnet
    let conn = Connection::new("wss://rpc-testnet.selendra.org").await?;
    println!("✅ Connected to Selendra");

    // Create keypair from seed phrase
    let keypair = keypair_from_string("//Alice");
    println!("📝 Account: {}", keypair.to_ss58check());

    // Sign connection
    let signed = conn.sign(&keypair)?;
    println!("✅ Signed connection ready");

    // Query current balance
    let balance = signed.get_balance().await?;
    println!("💰 Balance: {} units", balance);

    // Query staking info
    let staking_info = conn.get_staking_info(keypair.account_id()).await?;
    println!("🎯 Staking Info:");
    println!("  - Bonded: {:?}", staking_info.bonded);
    println!("  - Min validators: {}", staking_info.minimum_validator_count);
    println!("  - Sessions per era: {}", staking_info.sessions_per_era);

    // Example: Bond tokens for staking
    // UNCOMMENT to execute (requires sufficient balance)
    // let amount = 1_000_000_000_000_000_000u128; // 1 SEL
    // let tx_hash = signed.stake_bond(amount).await?;
    // println!("✅ Bonded tokens: {}", tx_hash);

    // Example: Nominate validators
    // let nominees = vec![/* validator addresses */];
    // let tx_hash = signed.stake_nominate(nominees).await?;
    // println!("✅ Nominated validators: {}", tx_hash);

    // Example: Start validating (requires bonded stake)
    // let commission = 10; // 10% commission
    // let tx_hash = signed.stake_validate(commission).await?;
    // println!("✅ Started validating: {}", tx_hash);

    // Example: Bond extra tokens
    // let extra = 500_000_000_000_000_000u128; // 0.5 SEL
    // let tx_hash = signed.stake_bond_extra(extra).await?;
    // println!("✅ Bonded extra: {}", tx_hash);

    // Example: Stop nominating/validating
    // let tx_hash = signed.stake_chill().await?;
    // println!("✅ Chilled: {}", tx_hash);

    Ok(())
}
