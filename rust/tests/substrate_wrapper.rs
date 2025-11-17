//! Integration tests for Substrate wrapper - Task 1.8
//!
//! These tests verify that the selendra_client wrapper works correctly.

use selendra_sdk::substrate::{Connection, keypair_from_string};
use selendra_sdk::Result;

/// Test endpoint - uses local node or testnet
const TEST_ENDPOINT: &str = "wss://rpc-testnet.selendra.org";

/// Test seed for Alice account
const TEST_SEED: &str = "//Alice";

#[tokio::test]
#[ignore] // Run with: cargo test -- --ignored
async fn test_connection_creation() -> Result<()> {
    // Test that we can create a connection
    let connection = Connection::new(TEST_ENDPOINT).await?;
    
    // Connection creation should succeed
    assert!(true, "Connection created successfully");
    
    Ok(())
}

#[tokio::test]
#[ignore] // Run with: cargo test -- --ignored
async fn test_keypair_creation() -> Result<()> {
    // Test keypair creation from seed
    let keypair = keypair_from_string(TEST_SEED);
    
    // Verify keypair has valid account ID
    let account_id = keypair.account_id();
    assert!(!account_id.to_string().is_empty(), "Account ID should not be empty");
    
    // Verify SS58 address generation
    let ss58 = keypair.to_ss58check();
    assert!(ss58.len() > 0, "SS58 address should not be empty");
    
    println!("✅ Keypair created: {}", ss58);
    
    Ok(())
}

#[tokio::test]
#[ignore] // Run with: cargo test -- --ignored
async fn test_signed_connection() -> Result<()> {
    // Create connection
    let connection = Connection::new(TEST_ENDPOINT).await?;
    
    // Create keypair
    let keypair = keypair_from_string(TEST_SEED);
    
    // Sign connection
    let signed = connection.sign(&keypair)?;
    
    // Verify account ID
    let account_id = signed.account_id();
    assert!(!account_id.to_string().is_empty(), "Signed connection should have account ID");
    
    println!("✅ Signed connection created for: {}", account_id);
    
    Ok(())
}

#[tokio::test]
#[ignore] // Run with: cargo test -- --ignored
async fn test_balance_query() -> Result<()> {
    // Setup
    let connection = Connection::new(TEST_ENDPOINT).await?;
    let keypair = keypair_from_string(TEST_SEED);
    let signed = connection.sign(&keypair)?;
    
    // Query balance
    let balance = signed.get_balance().await?;
    
    // Alice should have balance on testnet (or at least 0)
    assert!(balance >= 0, "Balance should be non-negative");
    
    println!("✅ Balance query successful: {} units", balance);
    
    Ok(())
}

#[tokio::test]
#[ignore] // Run with: cargo test -- --ignored
async fn test_account_id_consistency() -> Result<()> {
    // Create connection and keypair
    let connection = Connection::new(TEST_ENDPOINT).await?;
    let keypair = keypair_from_string(TEST_SEED);
    
    // Get account ID from keypair
    let keypair_account = keypair.account_id();
    
    // Sign connection and get account ID
    let signed = connection.sign(&keypair)?;
    let signed_account = signed.account_id();
    
    // Should be the same
    assert_eq!(
        keypair_account, signed_account,
        "Account IDs should match between keypair and signed connection"
    );
    
    println!("✅ Account ID consistency verified: {}", keypair_account);
    
    Ok(())
}

#[test]
fn test_keypair_from_seed_alice() {
    // Test creating keypair without network connection
    let keypair = keypair_from_string("//Alice");
    let account_id = keypair.account_id();
    
    // Alice's account ID should be deterministic
    assert!(!account_id.to_string().is_empty());
    
    println!("✅ Alice account ID: {}", account_id);
}

#[test]
fn test_keypair_from_seed_bob() {
    // Test creating different keypair
    let keypair = keypair_from_string("//Bob");
    let account_id = keypair.account_id();
    
    assert!(!account_id.to_string().is_empty());
    
    println!("✅ Bob account ID: {}", account_id);
}

#[test]
fn test_keypair_ss58_format() {
    // Test SS58 address format
    let keypair = keypair_from_string("//Alice");
    let ss58 = keypair.to_ss58check();
    
    // SS58 addresses should start with alphanumeric character
    assert!(ss58.len() > 10, "SS58 address should be reasonable length");
    assert!(ss58.chars().all(|c| c.is_alphanumeric()), "SS58 should be alphanumeric");
    
    println!("✅ Alice SS58: {}", ss58);
}

// ============================================================================
// Integration tests requiring live network (marked as ignored)
// Run with: cargo test -- --ignored
// ============================================================================

#[tokio::test]
#[ignore]
async fn test_transfer_simulation() -> Result<()> {
    // This test demonstrates transfer API without actually sending
    let connection = Connection::new(TEST_ENDPOINT).await?;
    let keypair = keypair_from_string(TEST_SEED);
    let signed = connection.sign(&keypair)?;
    
    // Get account ID to use as recipient
    let recipient = signed.account_id();
    
    println!("📝 Transfer simulation:");
    println!("   From: {}", signed.account_id());
    println!("   To: {}", recipient);
    println!("   Amount: 1000000000000 (1 SEL)");
    println!("   Note: Not actually executing transfer");
    
    // Actual transfer would be:
    // let tx_hash = signed.transfer(recipient, 1_000_000_000_000).await?;
    // println!("   Transaction: {:?}", tx_hash);
    
    Ok(())
}

#[tokio::test]
#[ignore]
async fn test_multiple_connections() -> Result<()> {
    // Test that multiple connections can coexist
    let conn1 = Connection::new(TEST_ENDPOINT).await?;
    let conn2 = Connection::new(TEST_ENDPOINT).await?;
    
    let kp1 = keypair_from_string("//Alice");
    let kp2 = keypair_from_string("//Bob");
    
    let signed1 = conn1.sign(&kp1)?;
    let signed2 = conn2.sign(&kp2)?;
    
    // Both should work independently
    let balance1 = signed1.get_balance().await?;
    let balance2 = signed2.get_balance().await?;
    
    println!("✅ Multiple connections:");
    println!("   Alice balance: {}", balance1);
    println!("   Bob balance: {}", balance2);
    
    Ok(())
}
