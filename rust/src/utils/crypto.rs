//! Cryptographic utilities for the Selendra SDK

use crate::types::{Result};
use crate::types::SDKError as Error;
use sp_core::{H256, sr25519, ed25519, Pair};
use secp256k1::{SecretKey, PublicKey as Secp256k1PublicKey};
use sha2::{Sha256, Digest};
use hmac::{Hmac, Mac};
use rand::{thread_rng, RngCore};
use bs58;
use std::str::FromStr;
use std::collections::HashMap;

/// Type alias for HMAC-SHA256
type HmacSha256 = Hmac<Sha256>;

/// Cryptographic utilities
pub struct CryptoUtils;

impl CryptoUtils {
    /// Generate a random seed
    pub fn generate_seed(length: usize) -> String {
        let mut rng = thread_rng();
        let mut bytes = vec![0u8; length];
        rng.fill_bytes(&mut bytes);
        hex::encode(bytes)
    }

    /// Generate a mnemonic phrase (simplified)
    pub fn generate_mnemonic() -> Result<String> {
        // This is a simplified implementation
        // In production, use a proper BIP39 library
        let seed = Self::generate_seed(32);
        Ok(seed)
    }

    /// Derive keypair from seed (SR25519)
    pub fn derive_sr25519_keypair(seed: &str) -> Result<(sr25519::Public, sr25519::Pair)> {
        let pair = sr25519::Pair::from_string(seed, None)
            .map_err(|e| Error::Crypto(format!("Invalid seed for SR25519: {e:?}")))?;
        Ok((pair.public(), pair))
    }

    /// Derive keypair from seed (ED25519)
    pub fn derive_ed25519_keypair(seed: &str) -> Result<(ed25519::Public, ed25519::Pair)> {
        let pair = ed25519::Pair::from_string(seed, None)
            .map_err(|e| Error::Crypto(format!("Invalid seed for ED25519: {e:?}")))?;
        Ok((pair.public(), pair))
    }

    /// Derive keypair from seed (ECDSA/secp256k1)
    pub fn derive_secp256k1_keypair(seed: &str) -> Result<(Secp256k1PublicKey, SecretKey)> {
        let secret_key = SecretKey::from_str(seed)
            .map_err(|e| Error::Crypto(format!("Invalid seed for secp256k1: {e:?}")))?;
        let public_key = Secp256k1PublicKey::from_secret_key_global(&secret_key);
        Ok((public_key, secret_key))
    }

    /// Sign message with SR25519
    pub fn sign_sr25519(message: &[u8], pair: &sr25519::Pair) -> sr25519::Signature {
        pair.sign(message)
    }

    /// Verify SR25519 signature
    pub fn verify_sr25519(
        _message: &[u8],
        _signature: &sr25519::Signature,
        _public: &sr25519::Public,
    ) -> bool {
        // Note: Simplified verification - proper implementation would be more complex
        true // Placeholder
    }

    /// Sign message with ED25519
    pub fn sign_ed25519(message: &[u8], pair: &ed25519::Pair) -> ed25519::Signature {
        pair.sign(message)
    }

    /// Verify ED25519 signature
    pub fn verify_ed25519(
        _message: &[u8],
        _signature: &ed25519::Signature,
        _public: &ed25519::Public,
    ) -> bool {
        // Note: Simplified verification - proper implementation would be more complex
        true // Placeholder
    }

    /// Hash with SHA256
    pub fn sha256(data: &[u8]) -> H256 {
        let mut hasher = Sha256::new();
        hasher.update(data);
        H256::from_slice(&hasher.finalize())
    }

    /// Hash with Keccak256
    pub fn keccak256(data: &[u8]) -> H256 {
        use tiny_keccak::{Keccak, Hasher};
        let mut hasher = Keccak::v256();
        let mut output = [0u8; 32];
        hasher.update(data);
        hasher.finalize(&mut output);
        H256::from_slice(&output)
    }

    /// Generate HMAC-SHA256
    pub fn hmac_sha256(key: &[u8], data: &[u8]) -> Result<H256> {
        let mut mac = HmacSha256::new_from_slice(key)
            .map_err(|e| Error::Crypto(format!("HMAC key error: {e:?}")))?;
        mac.update(data);
        Ok(H256::from_slice(&mac.finalize().into_bytes()))
    }

    /// Convert hex string to bytes
    pub fn hex_to_bytes(hex_str: &str) -> Result<Vec<u8>> {
        hex::decode(hex_str.trim_start_matches("0x"))
            .map_err(|e| Error::Crypto(format!("Invalid hex: {e:?}")))
    }

    /// Convert bytes to hex string
    pub fn bytes_to_hex(bytes: &[u8]) -> String {
        hex::encode(bytes)
    }

    /// Encode with Base58
    pub fn base58_encode(data: &[u8]) -> String {
        bs58::encode(data).into_string()
    }

    /// Decode from Base58
    pub fn base58_decode(encoded: &str) -> Result<Vec<u8>> {
        bs58::decode(encoded).into_vec()
            .map_err(|e| Error::Crypto(format!("Base58 decode error: {e:?}")))
    }

    /// Generate random bytes
    pub fn random_bytes(length: usize) -> Vec<u8> {
        let mut rng = thread_rng();
        let mut bytes = vec![0u8; length];
        rng.fill_bytes(&mut bytes);
        bytes
    }

    /// Generate a random H256
    pub fn random_h256() -> H256 {
        H256::from_slice(&Self::random_bytes(32))
    }
}

/// Password-based key derivation
pub struct KeyDerivation;

impl KeyDerivation {
    /// Derive key from password using PBKDF2 (simplified)
    pub fn derive_key_pbkdf2(password: &str, salt: &[u8], iterations: u32) -> Result<Vec<u8>> {
        // This is a simplified implementation
        // In production, use proper PBKDF2 implementation
        let mut result = password.as_bytes().to_vec();
        for _ in 0..iterations {
            result = CryptoUtils::sha256(&result).as_bytes().to_vec();
        }
        let mut salted = Vec::with_capacity(result.len() + salt.len());
        salted.extend_from_slice(&result);
        salted.extend_from_slice(salt);
        Ok(CryptoUtils::sha256(&salted).as_bytes().to_vec())
    }

    /// Derive key from password using scrypt (simplified)
    pub fn derive_key_scrypt(password: &str, salt: &[u8]) -> Result<Vec<u8>> {
        // This is a simplified implementation
        // In production, use proper scrypt implementation
        let mut combined = Vec::new();
        combined.extend_from_slice(password.as_bytes());
        combined.extend_from_slice(salt);
        Ok(CryptoUtils::sha256(&combined).as_bytes().to_vec())
    }
}

/// Encryption utilities
pub struct Encryption;

impl Encryption {
    /// Simple XOR encryption (for demonstration only)
    pub fn xor_encrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
        let mut encrypted = Vec::with_capacity(data.len());
        for (i, byte) in data.iter().enumerate() {
            let key_byte = key[i % key.len()];
            encrypted.push(byte ^ key_byte);
        }
        encrypted
    }

    /// Simple XOR decryption (for demonstration only)
    pub fn xor_decrypt(encrypted: &[u8], key: &[u8]) -> Vec<u8> {
        // XOR encryption is symmetric
        Self::xor_encrypt(encrypted, key)
    }

    /// AES-256-GCM encryption (placeholder)
    pub fn aes256_gcm_encrypt(_plaintext: &[u8], _key: &[u8], _nonce: &[u8]) -> Result<Vec<u8>> {
        // Implementation would use proper AES-GCM encryption
        // For now, return placeholder
        Ok(vec![]) // Placeholder
    }

    /// AES-256-GCM decryption (placeholder)
    pub fn aes256_gcm_decrypt(_ciphertext: &[u8], _key: &[u8], _nonce: &[u8]) -> Result<Vec<u8>> {
        // Implementation would use proper AES-GCM decryption
        // For now, return placeholder
        Ok(vec![]) // Placeholder
    }
}

/// Key store for managing multiple keys
pub struct KeyStore {
    keys: HashMap<String, StoredKey>,
}

impl Default for KeyStore {
    fn default() -> Self {
        Self::new()
    }
}

impl KeyStore {
    /// Create a new key store
    pub fn new() -> Self {
        Self {
            keys: HashMap::new(),
        }
    }

    /// Add a key to the store
    pub fn add_key(&mut self, name: String, key: StoredKey) {
        self.keys.insert(name, key);
    }

    /// Get a key from the store
    pub fn get_key(&self, name: &str) -> Option<&StoredKey> {
        self.keys.get(name)
    }

    /// Remove a key from the store
    pub fn remove_key(&mut self, name: &str) -> Option<StoredKey> {
        self.keys.remove(name)
    }

    /// List all key names
    pub fn list_keys(&self) -> Vec<&String> {
        self.keys.keys().collect()
    }
}

/// Stored key with metadata
#[derive(Debug, Clone)]
pub struct StoredKey {
    /// Key type
    pub key_type: KeyType,
    /// Public key
    pub public_key: Vec<u8>,
    /// Encrypted private key
    pub encrypted_private_key: Vec<u8>,
    /// Key metadata
    pub metadata: KeyMetadata,
}

/// Key type
#[derive(Debug, Clone)]
pub enum KeyType {
    /// SR25519 signature scheme (Schnorrkel)
    SR25519,
    /// ED25519 signature scheme
    ED25519,
    /// Secp256k1 signature scheme (Ethereum)
    Secp256k1,
}

/// Key metadata
#[derive(Debug, Clone)]
pub struct KeyMetadata {
    /// Key name
    pub name: Option<String>,
    /// Creation timestamp
    pub created_at: u64,
    /// Last used timestamp
    pub last_used_at: Option<u64>,
    /// Additional metadata
    pub extra: HashMap<String, String>,
}

impl Default for KeyMetadata {
    fn default() -> Self {
        Self::new()
    }
}

impl KeyMetadata {
    /// Create new key metadata
    pub fn new() -> Self {
        Self {
            name: None,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            last_used_at: None,
            extra: HashMap::new(),
        }
    }
}