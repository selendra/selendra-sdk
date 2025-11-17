//! Validation utilities for the Selendra SDK

use crate::types::{Result};
use crate::types::SDKError as Error;
use sp_core::crypto::AccountId32;
use regex::Regex;

#[cfg(feature = "evm")]
use ethers_core::types::{Address as EthAddress, H160};
use std::collections::HashSet;
use std::str::FromStr;
use tiny_keccak::Hasher;

/// Validation utilities
pub struct ValidationUtils;

impl ValidationUtils {
    /// Validate hex string
    pub fn validate_hex_string(hex_str: &str, expected_length: Option<usize>) -> Result<()> {
        let trimmed = hex_str.trim_start_matches("0x");

        // Check if it's valid hex
        if !trimmed.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(Error::Validation("Invalid hex string".to_string()));
        }

        // Check length if specified
        if let Some(expected) = expected_length {
            if trimmed.len() != expected * 2 {
                return Err(Error::Validation(format!(
                    "Expected hex length {} characters, got {}",
                    expected * 2,
                    trimmed.len()
                )));
            }
        }

        Ok(())
    }

    /// Validate Substrate address (AccountId32)
    pub fn validate_substrate_address(address: &str) -> Result<()> {
        // Try SS58 decode
        match AccountId32::from_str(address) {
            Ok(_) => Ok(()),
            Err(_) => {
                // Try hex format
                Self::validate_hex_string(address, Some(32))
            }
        }
    }

    /// Validate Ethereum address
    #[cfg(feature = "evm")]
    pub fn validate_ethereum_address(address: &str) -> Result<()> {
        Self::validate_hex_string(address, Some(20))?;

        // Additional EIP-55 checksum validation
        if address.starts_with("0x") && address.len() == 42 {
            if !Self::is_valid_checksum_address(address) {
                return Err(Error::Validation("Invalid Ethereum address checksum".to_string()));
            }
        }

        Ok(())
    }

    /// Validate EIP-55 checksum
    pub fn is_valid_checksum_address(address: &str) -> bool {
        if !address.starts_with("0x") || address.len() != 42 {
            return false;
        }

        let address_lower = address.to_lowercase();
        let mut hasher = tiny_keccak::Keccak::v256();
        let mut output = [0u8; 32];
        hasher.update(&address_lower.as_bytes()[2..]);
        hasher.finalize(&mut output);
        let hash = hex::encode(output);

        for (i, c) in address[2..].chars().enumerate() {
            let hash_char = hash.chars().nth(i).unwrap();
            let expected = if hash_char >= '8' {
                c.to_uppercase().next().unwrap()
            } else {
                c.to_lowercase().next().unwrap()
            };

            if c != expected {
                return false;
            }
        }

        true
    }

    /// Validate email address
    pub fn validate_email(email: &str) -> Result<()> {
        let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
            .map_err(|e| Error::Validation(format!("Regex error: {e:?}")))?;

        if !email_regex.is_match(email) {
            return Err(Error::Validation("Invalid email address".to_string()));
        }

        if email.len() > 254 {
            return Err(Error::Validation("Email address too long".to_string()));
        }

        Ok(())
    }

    /// Validate URL
    pub fn validate_url(url: &str) -> Result<()> {
        // Basic URL validation
        if !url.starts_with("http://") && !url.starts_with("https://") && !url.starts_with("ws://") && !url.starts_with("wss://") {
            return Err(Error::Validation("Invalid URL protocol".to_string()));
        }

        if url.len() > 2048 {
            return Err(Error::Validation("URL too long".to_string()));
        }

        // Check for valid URL format
        let url_regex = Regex::new(r"^[a-zA-Z][a-zA-Z0-9+.-]*://[^\s/$.?#].[^\s]*$")
            .map_err(|e| Error::Validation(format!("Regex error: {e:?}")))?;

        if !url_regex.is_match(url) {
            return Err(Error::Validation("Invalid URL format".to_string()));
        }

        Ok(())
    }

    /// Validate seed phrase (basic validation)
    pub fn validate_seed_phrase(seed: &str) -> Result<()> {
        let words: Vec<&str> = seed.split_whitespace().collect();

        if words.is_empty() {
            return Err(Error::Validation("Seed phrase cannot be empty".to_string()));
        }

        if words.len() < 12 {
            return Err(Error::Validation("Seed phrase too short (minimum 12 words)".to_string()));
        }

        if words.len() > 24 {
            return Err(Error::Validation("Seed phrase too long (maximum 24 words)".to_string()));
        }

        // Check if all words are alphanumeric
        for word in words {
            if !word.chars().all(|c| c.is_alphabetic()) {
                return Err(Error::Validation("Seed phrase contains invalid characters".to_string()));
            }
        }

        Ok(())
    }

    /// Validate amount (positive number)
    pub fn validate_amount(amount: &str, decimals: u8) -> Result<()> {
        if amount.is_empty() {
            return Err(Error::Validation("Amount cannot be empty".to_string()));
        }

        // Check if it's a valid number
        let decimal_count = if let Some(dot_pos) = amount.find('.') {
            amount.len() - dot_pos - 1
        } else {
            0
        };

        if decimal_count > decimals as usize {
            return Err(Error::Validation(format!(
                "Too many decimal places (maximum {decimals})"
            )));
        }

        amount.parse::<f64>()
            .map_err(|_| Error::Validation("Invalid amount format".to_string()))?;

        if amount.parse::<f64>().unwrap() < 0.0 {
            return Err(Error::Validation("Amount must be positive".to_string()));
        }

        Ok(())
    }

    /// Validate block number
    pub fn validate_block_number(block_number: u64) -> Result<()> {
        if block_number == 0 {
            return Err(Error::Validation("Block number cannot be zero".to_string()));
        }

        // Reasonable upper bound (assuming no blockchain would have more than 1 billion blocks initially)
        if block_number > 1_000_000_000 {
            return Err(Error::Validation("Block number seems unreasonably large".to_string()));
        }

        Ok(())
    }

    /// Validate transaction hash
    pub fn validate_transaction_hash(hash: &str) -> Result<()> {
        Self::validate_hex_string(hash, Some(32))
    }

    /// Validate signature
    pub fn validate_signature(signature: &str) -> Result<()> {
        Self::validate_hex_string(signature, Some(64))
    }

    /// Validate public key
    pub fn validate_public_key(public_key: &str) -> Result<()> {
        Self::validate_hex_string(public_key, Some(32))
    }

    /// Validate private key (basic validation)
    pub fn validate_private_key(private_key: &str) -> Result<()> {
        Self::validate_hex_string(private_key, Some(32))
    }

    /// Validate network name
    pub fn validate_network_name(network: &str) -> Result<()> {
        let valid_networks = HashSet::from([
            "selendra", "selendra-testnet", "polkadot", "kusama",
            "ethereum", "ethereum-testnet", "mainnet", "testnet"
        ]);

        if !valid_networks.contains(&network.to_lowercase().as_str()) {
            return Err(Error::Validation(format!("Unknown network: {network}")));
        }

        Ok(())
    }

    /// Validate gas limit
    pub fn validate_gas_limit(gas_limit: u64) -> Result<()> {
        if gas_limit == 0 {
            return Err(Error::Validation("Gas limit cannot be zero".to_string()));
        }

        if gas_limit > 10_000_000 {
            return Err(Error::Validation("Gas limit seems unreasonably high".to_string()));
        }

        Ok(())
    }

    /// Validate gas price
    pub fn validate_gas_price(gas_price: &str) -> Result<()> {
        Self::validate_amount(gas_price, 18)
    }

    /// Validate nonce
    pub fn validate_nonce(nonce: u64) -> Result<()> {
        // Most chains don't have strict nonce validation, but we can check for reasonable bounds
        if nonce > 1_000_000 {
            return Err(Error::Validation("Nonce seems unreasonably high".to_string()));
        }

        Ok(())
    }

    /// Validate token symbol
    pub fn validate_token_symbol(symbol: &str) -> Result<()> {
        if symbol.len() < 2 || symbol.len() > 10 {
            return Err(Error::Validation("Token symbol must be 2-10 characters".to_string()));
        }

        if !symbol.chars().all(|c| c.is_uppercase() && c.is_alphabetic()) {
            return Err(Error::Validation("Token symbol must contain only uppercase letters".to_string()));
        }

        Ok(())
    }

    /// Validate token name
    pub fn validate_token_name(name: &str) -> Result<()> {
        if name.len() < 3 || name.len() > 100 {
            return Err(Error::Validation("Token name must be 3-100 characters".to_string()));
        }

        if name.chars().any(|c| c.is_control()) {
            return Err(Error::Validation("Token name contains invalid characters".to_string()));
        }

        Ok(())
    }

    /// Validate contract address
    pub fn validate_contract_address(address: &str, chain_type: &str) -> Result<()> {
        match chain_type.to_lowercase().as_str() {
            #[cfg(feature = "evm")]
            "evm" | "ethereum" => Self::validate_ethereum_address(address),
            "substrate" | "polkadot" | "selendra" => Self::validate_substrate_address(address),
            _ => Err(Error::Validation(format!("Unknown chain type: {chain_type}"))),
        }
    }

    /// Validate chain type
    pub fn validate_chain_type(chain_type: &str) -> Result<()> {
        let valid_types = HashSet::from(["substrate", "evm", "polkadot", "ethereum", "selendra"]);

        if !valid_types.contains(&chain_type.to_lowercase().as_str()) {
            return Err(Error::Validation(format!("Invalid chain type: {chain_type}")));
        }

        Ok(())
    }

    /// Validate API key format
    pub fn validate_api_key(api_key: &str) -> Result<()> {
        if api_key.len() < 16 {
            return Err(Error::Validation("API key too short (minimum 16 characters)".to_string()));
        }

        if api_key.len() > 128 {
            return Err(Error::Validation("API key too long (maximum 128 characters)".to_string()));
        }

        if !api_key.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
            return Err(Error::Validation("API key contains invalid characters".to_string()));
        }

        Ok(())
    }

    /// Validate password strength
    pub fn validate_password_strength(password: &str) -> Result<PasswordStrength> {
        let mut score = 0;

        if password.len() >= 8 {
            score += 1;
        }

        if password.len() >= 12 {
            score += 1;
        }

        if password.chars().any(|c| c.is_lowercase()) {
            score += 1;
        }

        if password.chars().any(|c| c.is_uppercase()) {
            score += 1;
        }

        if password.chars().any(|c| c.is_numeric()) {
            score += 1;
        }

        if password.chars().any(|c| !c.is_alphanumeric()) {
            score += 1;
        }

        let strength = match score {
            0..=2 => PasswordStrength::Weak,
            3..=4 => PasswordStrength::Medium,
            5..=6 => PasswordStrength::Strong,
            _ => PasswordStrength::Strong,
        };

        Ok(strength)
    }
}

/// Password strength levels
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PasswordStrength {
    /// Weak password (does not meet basic security criteria)
    Weak,
    /// Medium strength password (meets some security criteria)
    Medium,
    /// Strong password (meets all security criteria)
    Strong,
}

/// Input sanitizer
pub struct InputSanitizer;

impl InputSanitizer {
    /// Sanitize string input
    pub fn sanitize_string(input: &str) -> String {
        input
            .chars()
            .filter(|c| !c.is_control())
            .collect::<String>()
            .trim()
            .to_string()
    }

    /// Sanitize hex input
    pub fn sanitize_hex(input: &str) -> Result<String> {
        let sanitized = input
            .trim()
            .trim_start_matches("0x")
            .to_lowercase();

        if !sanitized.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(Error::Validation("Invalid hex characters".to_string()));
        }

        Ok(format!("0x{sanitized}"))
    }

    /// Sanitize email input
    pub fn sanitize_email(input: &str) -> String {
        input
            .trim()
            .to_lowercase()
    }

    /// Sanitize URL input
    pub fn sanitize_url(input: &str) -> Result<String> {
        let sanitized = input.trim();

        if sanitized.is_empty() {
            return Err(Error::Validation("URL cannot be empty".to_string()));
        }

        // Ensure URL has a protocol
        let url = if sanitized.contains("://") {
            sanitized.to_string()
        } else {
            format!("https://{sanitized}")
        };

        Ok(url)
    }
}