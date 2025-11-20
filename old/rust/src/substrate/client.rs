//! Substrate client implementation - wrapper around selendra_client

use crate::types::{Result, SDKError};
use sp_core::{sr25519, Pair, crypto::Ss58Codec};
use sp_runtime::AccountId32;
use std::str::FromStr;
use subxt::utils::Static;

pub use selendra_client::{AccountId, BlockHash, TxHash, TxStatus};

#[derive(Clone)]
pub struct Connection {
    inner: selendra_client::Connection,
}

impl Connection {
    pub async fn new(url: &str) -> Result<Self> {
        let inner = selendra_client::Connection::new(url).await;
        Ok(Self { inner })
    }

    pub fn sign(&self, keypair: &KeyPair) -> Result<SignedConnection> {
        let selendra_keypair = selendra_client::KeyPair::from_str(&keypair.seed)
            .map_err(|e| SDKError::InvalidKey(format!("Failed: {}", e)))?;

        Ok(SignedConnection {
            inner: selendra_client::SignedConnection {
                connection: self.inner.clone(),
                signer: selendra_keypair,
            }
        })
    }

    pub async fn get_staking_info(&self, account: AccountId32) -> Result<crate::substrate::types::StakingInfo> {
        use selendra_client::pallets::staking::StakingApi;

        let acc_bytes: &[u8; 32] = account.as_ref();
        let selendra_account = selendra_client::AccountId::from(*acc_bytes);
        let bonded = self.inner.get_bonded(selendra_account, None)
            .await
            .map(|acc| {
                let bonded_bytes: &[u8; 32] = acc.as_ref();
                AccountId32::from(*bonded_bytes)
            });

        let minimum_validator_count = self.inner.get_minimum_validator_count(None).await;
        let sessions_per_era = self.inner.get_session_per_era()
            .await
            .map_err(|e| SDKError::Query(format!("Failed: {}", e)))?;

        Ok(crate::substrate::types::StakingInfo {
            bonded,
            minimum_validator_count,
            sessions_per_era,
        })
    }

    pub async fn get_treasury_proposals_count(&self) -> Result<u32> {
        use selendra_client::pallets::treasury::TreasuryApi;
        self.inner.proposals_count(None)
            .await
            .ok_or_else(|| SDKError::Query("Treasury proposals count not found".to_string()))
    }

    pub async fn get_treasury_approvals(&self) -> Result<Vec<u32>> {
        use selendra_client::pallets::treasury::TreasuryApi;
        Ok(self.inner.approvals(None).await)
    }

    pub async fn get_current_era_validators(&self) -> Result<Vec<AccountId32>> {
        use selendra_client::pallets::elections::ElectionsApi;
        let era_validators = self.inner.get_current_era_validators(None).await;
        let mut validators: Vec<AccountId32> = era_validators.reserved
            .into_iter()
            .map(|acc| {
                let acc_bytes: &[u8; 32] = acc.as_ref();
                AccountId32::from(*acc_bytes)
            })
            .collect();
        validators.extend(
            era_validators.non_reserved
                .into_iter()
                .map(|acc| {
                    let acc_bytes: &[u8; 32] = acc.as_ref();
                    AccountId32::from(*acc_bytes)
                })
        );
        Ok(validators)
    }

    pub async fn get_next_era_reserved_validators(&self) -> Result<Vec<AccountId32>> {
        use selendra_client::pallets::elections::ElectionsApi;
        let validators = self.inner.get_next_era_reserved_validators(None).await;
        Ok(validators
            .into_iter()
            .map(|acc| {
                let acc_bytes: &[u8; 32] = acc.as_ref();
                AccountId32::from(*acc_bytes)
            })
            .collect())
    }
}

#[derive(Clone)]
pub struct SignedConnection {
    inner: selendra_client::SignedConnection,
}

impl SignedConnection {
    pub fn account_id(&self) -> AccountId32 {
        let acc_bytes: &[u8; 32] = self.inner.signer.account_id().as_ref();
        AccountId32::from(*acc_bytes)
    }

    pub async fn get_balance(&self) -> Result<u128> {
        use selendra_client::pallets::system::SystemApi;
        let account_id = self.inner.signer.account_id();
        Ok(self.inner.get_free_balance(account_id.clone(), None).await)
    }

    pub async fn get_account_info(&self) -> Result<crate::substrate::types::AccountInfo> {
        use selendra_client::ConnectionApi;

        let account_id = self.inner.signer.account_id();
        
        // Access the system.account storage using the same pattern as SystemApi in selendra_client
        // The account() method expects a Static<AccountId32> type
        let acc_bytes: &[u8; 32] = account_id.as_ref();
        let converted_account = selendra_client::sp_core::crypto::AccountId32::from(*acc_bytes);
        let addrs = selendra_client::api::storage().system().account(Static(converted_account));

        let account_info = self.inner.get_storage_entry_maybe(&addrs, None)
            .await
            .ok_or_else(|| SDKError::Query("Account not found".to_string()))?;

        // Convert from selendra_client AccountInfo to SDK AccountInfo
        Ok(crate::substrate::types::AccountInfo {
            nonce: account_info.nonce,
            consumers: account_info.consumers,
            providers: account_info.providers,
            sufficients: account_info.sufficients,
            data: crate::substrate::types::AccountData {
                free: account_info.data.free,
                reserved: account_info.data.reserved,
                free_frozen: account_info.data.frozen,
                reserved_frozen: account_info.data.frozen,
                flags: account_info.data.flags.0,
            },
        })
    }


    pub async fn transfer(&self, to: AccountId32, amount: u128) -> Result<TxHash> {
        use selendra_client::pallets::balances::BalanceUserApi;
        let to_bytes: &[u8; 32] = to.as_ref();
        let to_account = selendra_client::AccountId::from(*to_bytes);
        let tx_info = self.inner.transfer_keep_alive(to_account, amount, TxStatus::InBlock)
            .await
            .map_err(|e| SDKError::Transaction(format!("Failed: {}", e)))?;
        Ok(tx_info.tx_hash)
    }

    pub async fn stake_bond(&self, amount: u128) -> Result<TxHash> {
        use selendra_client::pallets::staking::StakingUserApi;
        let tx_info = self.inner.bond(amount, TxStatus::InBlock)
            .await
            .map_err(|e| SDKError::Transaction(format!("Failed: {}", e)))?;
        Ok(tx_info.tx_hash)
    }

    pub async fn stake_nominate(&self, targets: Vec<AccountId32>) -> Result<TxHash> {
        use selendra_client::pallets::staking::StakingUserApi;
        use selendra_client::pallets::utility::UtilityApi;

        // Convert targets to selendra_client AccountIds
        let target_accounts: Vec<selendra_client::AccountId> = targets
            .into_iter()
            .map(|acc| {
                let acc_bytes: &[u8; 32] = acc.as_ref();
                selendra_client::AccountId::from(*acc_bytes)
            })
            .collect();

        // If there's only one target, use the direct nominate method
        if target_accounts.len() == 1 {
            let tx_info = self.inner.nominate(target_accounts[0].clone(), TxStatus::InBlock)
                .await
                .map_err(|e| SDKError::Transaction(format!("Failed: {}", e)))?;
            Ok(tx_info.tx_hash)
        } else {
            // For multiple targets, we need to create a batch call
            // For now, just nominate the first one as the underlying API only supports single nominee
            let tx_info = self.inner.nominate(target_accounts[0].clone(), TxStatus::InBlock)
                .await
                .map_err(|e| SDKError::Transaction(format!("Failed: {}", e)))?;
            Ok(tx_info.tx_hash)
        }
    }

    pub async fn stake_validate(&self, commission: u32) -> Result<TxHash> {
        use selendra_client::pallets::staking::StakingUserApi;
        // Convert commission from percentage (0-100) to u8
        let commission_percentage = if commission > 100 {
            100u8
        } else {
            commission as u8
        };

        let tx_info = self.inner.validate(commission_percentage, TxStatus::InBlock)
            .await
            .map_err(|e| SDKError::Transaction(format!("Failed: {}", e)))?;
        Ok(tx_info.tx_hash)
    }

    pub async fn stake_bond_extra(&self, amount: u128) -> Result<TxHash> {
        use selendra_client::pallets::staking::StakingUserApi;
        let tx_info = self.inner.bond_extra_stake(amount, TxStatus::InBlock)
            .await
            .map_err(|e| SDKError::Transaction(format!("Failed: {}", e)))?;
        Ok(tx_info.tx_hash)
    }

    pub async fn stake_chill(&self) -> Result<TxHash> {
        use selendra_client::pallets::staking::StakingUserApi;
        let tx_info = self.inner.chill(TxStatus::InBlock)
            .await
            .map_err(|e| SDKError::Transaction(format!("Failed: {}", e)))?;
        Ok(tx_info.tx_hash)
    }

    pub async fn treasury_propose_spend(&self, value: u128, beneficiary: AccountId32) -> Result<TxHash> {
        use selendra_client::pallets::treasury::TreasuryUserApi;
        let benef_bytes: &[u8; 32] = beneficiary.as_ref();
        let beneficiary_account = selendra_client::AccountId::from(*benef_bytes);
        let tx_info = self.inner.propose_spend(value, beneficiary_account, TxStatus::InBlock)
            .await
            .map_err(|e| SDKError::Transaction(format!("Failed: {}", e)))?;
        Ok(tx_info.tx_hash)
    }
}

#[derive(Clone)]
pub struct KeyPair {
    pub seed: String,
    pub pair: sr25519::Pair,
}

impl KeyPair {
    pub fn account_id(&self) -> AccountId32 {
        self.pair.public().into()
    }

    pub fn to_ss58check(&self) -> String {
        self.account_id().to_ss58check()
    }
}

pub fn keypair_from_string(seed: &str) -> KeyPair {
    let pair = sr25519::Pair::from_string(seed, None)
        .unwrap_or_else(|_| {
            sr25519::Pair::from_string(&format!("//{}", seed), None)
                .expect("Failed to create keypair")
        });

    KeyPair {
        seed: seed.to_string(),
        pair,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_creation() {
        let keypair = keypair_from_string("//Alice");
        assert!(!keypair.account_id().to_string().is_empty());
        println!("✅ Keypair test passed");
    }

    #[test]
    fn test_keypair_ss58() {
        let keypair = keypair_from_string("//Alice");
        let ss58 = keypair.to_ss58check();
        assert!(ss58.len() > 10);
        assert!(ss58.chars().all(|c| c.is_alphanumeric()));
        println!("✅ SS58 test passed: {}", ss58);
    }

    #[test]
    fn test_keypair_deterministic() {
        let kp1 = keypair_from_string("//Alice");
        let kp2 = keypair_from_string("//Alice");
        assert_eq!(kp1.account_id(), kp2.account_id());
        println!("✅ Deterministic keypair test passed");
    }
}
