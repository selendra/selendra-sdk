//! Conversion utilities for the Selendra SDK

use crate::types::{Result};
use crate::types::SDKError as Error;
use sp_core::{H256, crypto::{AccountId32, Ss58Codec}, U256 as SpU256};
use std::str::FromStr;

#[cfg(feature = "evm")]
use ethers_core::types::{U256 as EthU256, H160 as EthAddress};

/// Conversion utilities
pub struct ConversionUtils;

impl ConversionUtils {
    /// Convert hex string to H256
    pub fn hex_to_h256(hex_str: &str) -> Result<H256> {
        let bytes = hex::decode(hex_str.trim_start_matches("0x"))
            .map_err(|e| Error::Conversion(format!("Invalid hex: {e:?}")))?;

        if bytes.len() != 32 {
            return Err(Error::Conversion("Hex must be 32 bytes".to_string()));
        }

        let mut array = [0u8; 32];
        array.copy_from_slice(&bytes);
        Ok(H256::from(array))
    }

    /// Convert H256 to hex string
    pub fn h256_to_hex(hash: &H256) -> String {
        format!("0x{}", hex::encode(hash.as_bytes()))
    }

    /// Convert hex string to AccountId32
    pub fn hex_to_account_id(hex_str: &str) -> Result<AccountId32> {
        let h256 = Self::hex_to_h256(hex_str)?;
        let mut bytes = [0u8; 32];
        bytes.copy_from_slice(h256.as_bytes());
        Ok(AccountId32::from(bytes))
    }

    /// Convert AccountId32 to hex string
    pub fn account_id_to_hex(account_id: &AccountId32) -> String {
        Self::h256_to_hex(&H256::from(account_id.as_ref()))
    }

    /// Convert AccountId32 to SS58 address
    pub fn account_id_to_ss58(account_id: &AccountId32) -> String {
        account_id.to_ss58check()
    }

    /// Convert SS58 address to AccountId32
    pub fn ss58_to_account_id(ss58: &str) -> Result<AccountId32> {
        let account_id = AccountId32::from_str(ss58)
            .map_err(|e| Error::Conversion(format!("Invalid SS58 address: {e:?}")))?;
        Ok(account_id)
    }

    /// Convert Ethereum address to hex string
    #[cfg(feature = "evm")]
    pub fn eth_address_to_hex(address: &EthAddress) -> String {
        format!("0x{}", hex::encode(address.as_bytes()))
    }

    /// Convert hex string to Ethereum address
    #[cfg(feature = "evm")]
    pub fn hex_to_eth_address(hex_str: &str) -> Result<EthAddress> {
        let bytes = hex::decode(hex_str.trim_start_matches("0x"))
            .map_err(|e| Error::Conversion(format!("Invalid hex: {:?}", e)))?;

        if bytes.len() != 20 {
            return Err(Error::Conversion("Hex must be 20 bytes for address".to_string()));
        }

        let mut array = [0u8; 20];
        array.copy_from_slice(&bytes);
        Ok(EthAddress::from(array))
    }

    /// Convert SpU256 to EthU256
    #[cfg(feature = "evm")]
    pub fn sp_u256_to_eth_u256(value: &SpU256) -> EthU256 {
        EthU256::from_little_endian(value.as_bytes())
    }

    /// Convert EthU256 to SpU256
    #[cfg(feature = "evm")]
    pub fn eth_u256_to_sp_u256(value: &EthU256) -> SpU256 {
        let mut bytes = [0u8; 32];
        value.to_little_endian(&mut bytes);
        SpU256::from_little_endian(&bytes)
    }

    /// Convert string to U256
    pub fn string_to_u256(s: &str) -> Result<SpU256> {
        if let Some(hex_str) = s.strip_prefix("0x") {
            // Hex string
            let bytes = hex::decode(hex_str)
                .map_err(|e| Error::Conversion(format!("Invalid hex: {e:?}")))?;

            let mut padded = vec![0u8; 32];
            let start = if bytes.len() > 32 { bytes.len() - 32 } else { 0 };
            let end = bytes.len();
            let copy_len = std::cmp::min(bytes.len(), 32);
            padded[32 - copy_len..].copy_from_slice(&bytes[start..end]);

            Ok(SpU256::from_little_endian(&padded))
        } else {
            // Decimal string
            s.parse::<u128>()
                .map(SpU256::from)
                .map_err(|e| Error::Conversion(format!("Invalid number: {e:?}")))
        }
    }

    /// Convert U256 to string
    pub fn u256_to_string(value: &SpU256, base: ConversionBase) -> String {
        match base {
            ConversionBase::Decimal => value.to_string(),
            ConversionBase::Hex => {
                let mut bytes = [0u8; 32];
                value.to_little_endian(&mut bytes);
                format!("0x{}", hex::encode(bytes))
            }
        }
    }

    /// Convert bytes to string
    pub fn bytes_to_string(bytes: &[u8], encoding: EncodingFormat) -> String {
        match encoding {
            EncodingFormat::Hex => hex::encode(bytes),
            EncodingFormat::Base58 => bs58::encode(bytes).into_string(),
            EncodingFormat::Utf8 => String::from_utf8_lossy(bytes).into_owned(),
        }
    }

    /// Convert string to bytes
    pub fn string_to_bytes(s: &str, encoding: EncodingFormat) -> Result<Vec<u8>> {
        match encoding {
            EncodingFormat::Hex => {
                hex::decode(s.trim_start_matches("0x"))
                    .map_err(|e| Error::Conversion(format!("Invalid hex: {e:?}")))
            }
            EncodingFormat::Base58 => {
                bs58::decode(s).into_vec()
                    .map_err(|e| Error::Conversion(format!("Invalid base58: {e:?}")))
            }
            EncodingFormat::Utf8 => Ok(s.as_bytes().to_vec()),
        }
    }

    /// Convert balance with decimals
    pub fn balance_with_decimals(amount: u128, decimals: u8) -> Result<String> {
        let divisor = 10u128.pow(decimals as u32);
        let integer_part = amount / divisor;
        let fractional_part = amount % divisor;

        Ok(format!(
            "{}.{:0width$}",
            integer_part,
            fractional_part,
            width = decimals as usize
        ))
    }

    /// Parse balance string with decimals
    pub fn parse_balance_string(balance_str: &str, decimals: u8) -> Result<u128> {
        if let Some(dot_pos) = balance_str.find('.') {
            let integer_part = &balance_str[..dot_pos];
            let fractional_part = &balance_str[dot_pos + 1..];

            let integer = integer_part.parse::<u128>()
                .map_err(|e| Error::Conversion(format!("Invalid integer part: {e:?}")))?;

            let mut fractional = fractional_part.parse::<u128>()
                .map_err(|_| Error::Conversion("Invalid fractional part".to_string()))?;

            // Pad fractional part to correct number of decimals
            let actual_len = fractional_part.len();
            if actual_len > decimals as usize {
                fractional /= 10u128.pow((actual_len - decimals as usize) as u32);
            } else {
                fractional *= 10u128.pow((decimals as usize - actual_len) as u32);
            }

            Ok(integer * 10u128.pow(decimals as u32) + fractional)
        } else {
            let integer = balance_str.parse::<u128>()
                .map_err(|e| Error::Conversion(format!("Invalid number: {e:?}")))?;
            Ok(integer * 10u128.pow(decimals as u32))
        }
    }

    /// Convert timestamp to human-readable string
    pub fn timestamp_to_string(timestamp: u64) -> String {
        let datetime = chrono::DateTime::from_timestamp(timestamp as i64, 0)
            .unwrap_or_else(chrono::Utc::now);
        datetime.format("%Y-%m-%d %H:%M:%S UTC").to_string()
    }

    /// Convert duration to human-readable string
    pub fn duration_to_string(duration_secs: u64) -> String {
        let hours = duration_secs / 3600;
        let minutes = (duration_secs % 3600) / 60;
        let seconds = duration_secs % 60;

        if hours > 0 {
            format!("{hours}h {minutes}m {seconds}s")
        } else if minutes > 0 {
            format!("{minutes}m {seconds}s")
        } else {
            format!("{seconds}s")
        }
    }
}

/// Conversion base for number representation
#[derive(Debug, Clone, Copy)]
pub enum ConversionBase {
    /// Decimal (base 10) representation
    Decimal,
    /// Hexadecimal (base 16) representation
    Hex,
}

/// Encoding format for bytes
#[derive(Debug, Clone, Copy)]
pub enum EncodingFormat {
    /// Hexadecimal encoding
    Hex,
    /// Base58 encoding
    Base58,
    /// UTF-8 encoding
    Utf8,
}

/// Address converter for different address formats
pub struct AddressConverter;

impl AddressConverter {
    /// Convert Substrate AccountId32 to Ethereum address
    #[cfg(feature = "evm")]
    pub fn substrate_to_ethereum(account_id: &AccountId32) -> EthAddress {
        // Take the last 20 bytes of the AccountId32
        let account_bytes = account_id.as_ref();
        let mut address_bytes = [0u8; 20];
        address_bytes.copy_from_slice(&account_bytes[12..32]);
        EthAddress::from_slice(&address_bytes)
    }

    /// Convert Ethereum address to Substrate AccountId32
    #[cfg(feature = "evm")]
    pub fn ethereum_to_substrate(address: &EthAddress) -> AccountId32 {
        let address_bytes = address.as_bytes();
        let mut account_bytes = [0u8; 32];
        account_bytes[12..32].copy_from_slice(address_bytes);
        AccountId32::from(account_bytes)
    }

    /// Check if two addresses represent the same entity
    #[cfg(feature = "evm")]
    pub fn are_equivalent(substrate: &AccountId32, ethereum: &EthAddress) -> bool {
        let converted = Self::substrate_to_ethereum(substrate);
        converted == *ethereum
    }
}

/// Currency converter
pub struct CurrencyConverter;

impl CurrencyConverter {
    /// Convert between different token units
    pub fn convert_token_units(amount: u128, from_decimals: u8, to_decimals: u8) -> Result<u128> {
        if from_decimals == to_decimals {
            return Ok(amount);
        }

        if from_decimals > to_decimals {
            let diff = from_decimals - to_decimals;
            Ok(amount / 10u128.pow(diff as u32))
        } else {
            let diff = to_decimals - from_decimals;
            amount.checked_mul(10u128.pow(diff as u32))
                .ok_or_else(|| Error::Conversion("Conversion overflow".to_string()))
        }
    }

    /// Calculate USD value from token amount
    pub fn token_to_usd(amount: u128, decimals: u8, price: f64) -> Result<f64> {
        let divisor = 10u128.pow(decimals as u32) as f64;
        let token_amount = amount as f64 / divisor;
        Ok(token_amount * price)
    }

    /// Calculate token amount from USD value
    pub fn usd_to_token(usd_amount: f64, decimals: u8, price: f64) -> Result<u128> {
        let token_amount = usd_amount / price;
        let divisor = 10u128.pow(decimals as u32) as f64;
        let result = (token_amount * divisor) as u128;
        Ok(result)
    }
}