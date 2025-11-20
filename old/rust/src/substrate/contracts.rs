//! Smart contracts module - wrapper around selendra_client contracts

use crate::types::{Result, SDKError};
use sp_core::crypto::AccountId32;
use selendra_client::{AccountId, TxStatus};
use selendra_client::contract::{ContractInstance, ReadonlyCallParams, ExecCallParams};
use selendra_client::ConnectionApi;

pub struct Contract {
    inner: ContractInstance,
}

impl Contract {
    /// Load contract from address with metadata file
    pub fn new(address: AccountId32, metadata_path: &str) -> Result<Self> {
        let addr_bytes: &[u8; 32] = address.as_ref();
        let addr = AccountId::from(*addr_bytes);
        let inner = ContractInstance::new(addr, metadata_path)
            .map_err(|e| SDKError::ContractError(format!("Failed to load contract: {}", e)))?;
        Ok(Self { inner })
    }

    /// Get contract address
    pub fn address(&self) -> AccountId32 {
        let addr_bytes: &[u8; 32] = self.inner.address().as_ref();
        AccountId32::from(*addr_bytes)
    }

    /// Read-only contract call (no gas, no transaction)
    pub async fn read<C: ConnectionApi>(
        &self,
        conn: &C,
        message: &str,
        args: &[String],
    ) -> Result<String> {
        let params = ReadonlyCallParams::new();
        let result: String = self.inner
            .read(conn, message, args, params)
            .await
            .map_err(|e| SDKError::Query(format!("Contract read failed: {}", e)))?;

        Ok(result)
    }

    /// Execute contract call (submits transaction)
    pub async fn exec<C: selendra_client::SignedConnectionApi>(
        &self,
        conn: &C,
        message: &str,
        args: &[String],
        value: u128,
    ) -> Result<selendra_client::TxHash> {
        let params = ExecCallParams::new().value(value);
        let tx_info = self.inner
            .exec(conn, message, args, params)
            .await
            .map_err(|e| SDKError::Transaction(format!("Contract exec failed: {}", e)))?;
        Ok(tx_info.tx_hash)
    }
}
