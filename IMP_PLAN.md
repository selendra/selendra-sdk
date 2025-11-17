# Selendra SDK Implementation Plan

**Status:** READY FOR EXECUTION  
**Goal:** Add complete Substrate support to SDK by wrapping existing `selendra-client`  
**Strategy:** Thin wrapper pattern (NOT reimplementation)

---

## Quick Reference

### The Discovery

**Problem:** SDK has placeholder Substrate code (30% complete)

**Solution:** `vendors/selendra-client` v3.16.0 already has everything we need

**Approach:**

- **Rust SDK:** Wrap selendra-client (300 lines of adapter code)
- **TypeScript SDK:** Implement with @polkadot/api (no alternative exists)

### What Exists vs What's Needed

| Component  | selendra-client | Rust SDK       | TypeScript SDK | Action           |
| ---------- | --------------- | -------------- | -------------- | ---------------- |
| Connection | ✅ Production   | ⚠️ Placeholder | ❌ Missing     | Wrap / Implement |
| Accounts   | ✅ Production   | ⚠️ Placeholder | ❌ Missing     | Wrap / Implement |
| Balances   | ✅ Production   | ⚠️ Placeholder | ❌ Missing     | Wrap / Implement |
| Transfers  | ✅ Production   | ⚠️ Placeholder | ❌ Missing     | Wrap / Implement |
| Staking    | ✅ Production   | ❌ Missing     | ❌ Missing     | Wrap / Implement |
| Governance | ✅ Production   | ❌ Missing     | ❌ Missing     | Optional         |
| Contracts  | ✅ Production   | ❌ Missing     | ❌ Missing     | Optional         |

---

## Priority 1: Rust SDK Core Wrapper (MVP)

### Goal

Replace placeholder Substrate code with working wrapper over selendra-client.

### Prerequisites

- ✅ selendra-client exists at `vendors/selendra-client/`
- ✅ selendra-client is production-ready (v3.16.0)
- ✅ Uses subxt 0.30.1 (stable)

### Task 1.1: Add Dependency

**Priority:** P0 (Critical)

```toml
# File: selendra-sdk/rust/Cargo.toml
# Action: Add this dependency

[dependencies]
selendra_client = { path = "../../../vendors/selendra-client", version = "3.16" }

# REMOVE these (redundant with selendra_client):
# subxt = "0.32.0"  ❌ CONFLICTS with selendra_client's 0.30.1
```

**Verification:**

```bash
cd selendra-sdk/rust
cargo check
# Should compile without errors
```

### Task 1.2: Create Connection Wrapper

**Priority:** P0 (Critical)

```rust
// File: selendra-sdk/rust/src/substrate/client.rs
// Action: REPLACE entire file with this

use selendra_client::{
    Connection as SelendraConnection,
    SignedConnection as SelendraSignedConnection,
};
use crate::types::{Result, SDKError};

/// Wrapper around selendra_client::Connection
pub struct Connection {
    inner: SelendraConnection,
}

impl Connection {
    /// Connect to Substrate node
    pub async fn new(url: &str) -> Result<Self> {
        let inner = SelendraConnection::new_with_url(url)
            .await
            .map_err(|e| SDKError::Connection(e.to_string()))?;
        Ok(Self { inner })
    }

    /// Sign connection with keypair
    pub fn sign(&self, keypair: &KeyPair) -> Result<SignedConnection> {
        let selendra_keypair = selendra_client::KeyPair::from_string(&keypair.seed)
            .map_err(|e| SDKError::InvalidKeyPair(e.to_string()))?;
        let signed = self.inner.clone().sign(selendra_keypair);
        Ok(SignedConnection { inner: signed })
    }
}

/// Wrapper around selendra_client::SignedConnection
pub struct SignedConnection {
    inner: SelendraSignedConnection,
}
```

**Verification:**

```bash
cargo check --features substrate
# Should compile
```

### Task 1.3: Implement Account Operations

**Priority:** P0 (Critical)

```rust
// File: selendra-sdk/rust/src/substrate/client.rs
// Action: Add these methods to SignedConnection impl block

impl SignedConnection {
    /// Get account information
    pub async fn get_account_info(&self) -> Result<AccountInfo> {
        let account_id = self.inner.account_id();

        // Use selendra_client's system pallet API
        let storage_addr = selendra_client::api::storage()
            .system()
            .account(account_id.clone());

        let account_data = self.inner.connection
            .get_storage_entry(&storage_addr, None)
            .await
            .map_err(|e| SDKError::StorageQuery(e.to_string()))?;

        Ok(AccountInfo {
            nonce: account_data.nonce,
            data: AccountData {
                free: account_data.data.free,
                reserved: account_data.data.reserved,
                frozen: account_data.data.frozen,
            }
        })
    }

    /// Get account balance
    pub async fn get_balance(&self) -> Result<BalanceInfo> {
        let account_info = self.get_account_info().await?;

        Ok(BalanceInfo {
            free: account_info.data.free,
            reserved: account_info.data.reserved,
            frozen: account_info.data.frozen,
            total: account_info.data.free + account_info.data.reserved,
        })
    }
}
```

**Verification:**

```bash
cargo test test_account_info
cargo test test_balance
```

### Task 1.4: Implement Transfer Operation

**Priority:** P0 (Critical)

```rust
// File: selendra-sdk/rust/src/substrate/client.rs
// Action: Add to SignedConnection impl block

use selendra_client::pallets::BalanceUserApi;
use selendra_client::TxStatus;

impl SignedConnection {
    /// Transfer tokens to another account
    pub async fn transfer(
        &self,
        to: AccountId32,
        amount: u128
    ) -> Result<TransactionInfo> {
        // Use selendra_client's balance pallet
        let tx_info = self.inner
            .transfer_keep_alive(to, amount, TxStatus::Finalized)
            .await
            .map_err(|e| SDKError::TransactionFailed(e.to_string()))?;

        Ok(TransactionInfo {
            hash: format!("{:?}", tx_info.tx_hash),
            block_hash: format!("{:?}", tx_info.block_hash),
            status: TransactionStatus::Finalized,
        })
    }

    /// Submit generic transaction
    pub async fn submit_transaction<Call>(
        &self,
        call: Call,
        wait_for_finality: bool,
    ) -> Result<TransactionInfo>
    where
        Call: selendra_client::subxt::tx::Payload,
    {
        let status = if wait_for_finality {
            TxStatus::Finalized
        } else {
            TxStatus::InBlock
        };

        let tx_info = self.inner
            .send_tx(call, status)
            .await
            .map_err(|e| SDKError::TransactionFailed(e.to_string()))?;

        Ok(TransactionInfo {
            hash: format!("{:?}", tx_info.tx_hash),
            block_hash: format!("{:?}", tx_info.block_hash),
            status: if wait_for_finality {
                TransactionStatus::Finalized
            } else {
                TransactionStatus::InBlock
            },
        })
    }
}
```

**Verification:**

```bash
cargo test test_transfer
cargo run --example substrate_connection
```

### Task 1.5: Type Conversions

**Priority:** P1 (High)

```rust
// File: selendra-sdk/rust/src/substrate/types.rs
// Action: Create type conversion helpers

use selendra_client;
use crate::types::*;

/// Convert SDK types to selendra_client types
impl From<&KeyPair> for selendra_client::KeyPair {
    fn from(kp: &KeyPair) -> Self {
        selendra_client::KeyPair::from_string(&kp.seed)
            .expect("Invalid keypair seed")
    }
}

/// Convert selendra_client TxInfo to SDK TransactionInfo
impl From<selendra_client::TxInfo> for TransactionInfo {
    fn from(info: selendra_client::TxInfo) -> Self {
        TransactionInfo {
            hash: format!("{:?}", info.tx_hash),
            block_hash: format!("{:?}", info.block_hash),
            status: TransactionStatus::Finalized,
        }
    }
}

/// Error mapping
impl From<selendra_client::Error> for SDKError {
    fn from(err: selendra_client::Error) -> Self {
        SDKError::SubstrateClient(err.to_string())
    }
}
```

### Task 1.6: Delete Redundant Files

**Priority:** P1 (High)

```bash
# Action: Delete these placeholder files

rm selendra-sdk/rust/src/substrate/storage.rs
rm selendra-sdk/rust/src/substrate/extrinsics.rs
rm selendra-sdk/rust/src/substrate/metadata.rs

# Update mod.rs to remove references
# File: selendra-sdk/rust/src/substrate/mod.rs
```

```rust
// File: selendra-sdk/rust/src/substrate/mod.rs
// Action: Update to only export working modules

pub mod client;
pub mod account;
pub mod types;

pub use client::{Connection, SignedConnection};
pub use account::KeyPair;
pub use types::*;

// REMOVED: storage, extrinsics, metadata (redundant)
```

### Task 1.7: Update Examples

**Priority:** P1 (High)

```rust
// File: selendra-sdk/rust/examples/substrate_connection.rs
// Action: Update to use wrapper API

use selendra_sdk::substrate::{Connection, KeyPair};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to testnet
    let conn = Connection::new("wss://rpc-testnet.selendra.org").await?;
    println!("✅ Connected to Selendra testnet");

    // Create signed connection
    let keypair = KeyPair::from_seed("//Alice");
    let signed = conn.sign(&keypair)?;
    println!("✅ Signed connection created");

    // Query account
    let account_info = signed.get_account_info().await?;
    println!("📊 Account nonce: {}", account_info.nonce);
    println!("💰 Free balance: {}", account_info.data.free);

    // Query balance
    let balance = signed.get_balance().await?;
    println!("💵 Total balance: {}", balance.total);

    Ok(())
}
```

**Verification:**

```bash
cargo run --example substrate_connection
# Should connect and print account info
```

### Task 1.8: Integration Tests

**Priority:** P1 (High)

```rust
// File: selendra-sdk/rust/tests/substrate_wrapper.rs
// Action: Create integration tests

use selendra_sdk::substrate::{Connection, KeyPair};

#[tokio::test]
async fn test_connection_wrapper() {
    let conn = Connection::new("wss://rpc-testnet.selendra.org")
        .await
        .expect("Failed to connect");
    // Success if no panic
}

#[tokio::test]
async fn test_account_query() {
    let conn = Connection::new("wss://rpc-testnet.selendra.org")
        .await
        .unwrap();
    let keypair = KeyPair::from_seed("//Alice");
    let signed = conn.sign(&keypair).unwrap();

    let account_info = signed.get_account_info().await.unwrap();
    assert!(account_info.nonce >= 0);
}

#[tokio::test]
async fn test_balance_query() {
    let conn = Connection::new("wss://rpc-testnet.selendra.org")
        .await
        .unwrap();
    let keypair = KeyPair::from_seed("//Alice");
    let signed = conn.sign(&keypair).unwrap();

    let balance = signed.get_balance().await.unwrap();
    assert!(balance.total > 0);
}
```

**Verification:**

```bash
cargo test --features substrate --workspace
# All tests should pass
```

---

## Priority 2: Rust SDK Advanced Features (Optional)

### Goal

Expose advanced selendra-client features for staking, governance, and contracts.

### Task 2.1: Staking Wrapper

**Priority:** P2 (Medium - Optional for MVP)

```rust
// File: selendra-sdk/rust/src/substrate/staking.rs
// Action: Create staking operations wrapper

use selendra_client::pallets::{StakingApi, StakingUserApi};
use crate::substrate::SignedConnection;
use crate::types::*;

impl SignedConnection {
    /// Bond tokens for staking
    pub async fn stake_bond(&self, amount: u128) -> Result<TransactionInfo> {
        let tx_info = self.inner
            .bond(amount, TxStatus::Finalized)
            .await?;
        Ok(TransactionInfo::from(tx_info))
    }

    /// Nominate validators
    pub async fn stake_nominate(&self, validators: Vec<AccountId32>) -> Result<TransactionInfo> {
        let tx_info = self.inner
            .nominate(validators, TxStatus::Finalized)
            .await?;
        Ok(TransactionInfo::from(tx_info))
    }

    /// Start validating
    pub async fn stake_validate(&self, commission: u32) -> Result<TransactionInfo> {
        let tx_info = self.inner
            .validate(commission, TxStatus::Finalized)
            .await?;
        Ok(TransactionInfo::from(tx_info))
    }

    /// Get staking info for account
    pub async fn get_staking_info(&self) -> Result<StakingInfo> {
        let account_id = self.inner.account_id();

        // Get current era
        let active_era = self.inner.get_active_era(None).await?;

        // Get bonded amount
        let bonded_opt = self.inner.get_bonded(account_id.clone(), None).await;

        if let Some(controller) = bonded_opt {
            let ledger = self.inner.get_ledger(controller, None).await?;

            return Ok(StakingInfo {
                bonded: ledger.total,
                active: ledger.active,
                unlocking: ledger.unlocking.into_iter()
                    .map(|u| UnlockChunk {
                        value: u.value,
                        era: u.era,
                    })
                    .collect(),
            });
        }

        Ok(StakingInfo::default())
    }
}
```

### Task 2.2: Governance Wrapper

**Priority:** P3 (Low - Optional)

```rust
// File: selendra-sdk/rust/src/substrate/governance.rs
// Action: Create governance operations wrapper

use selendra_client::pallets::{DemocracyApi, TreasuryApi, ElectionsApi};

impl SignedConnection {
    // Democracy operations
    pub async fn democracy_propose(&self, proposal: Vec<u8>, value: u128) -> Result<TransactionInfo> {
        let tx_info = self.inner.propose(proposal, value, TxStatus::Finalized).await?;
        Ok(tx_info.into())
    }

    pub async fn democracy_vote(&self, ref_index: u32, aye: bool) -> Result<TransactionInfo> {
        let tx_info = self.inner.vote(ref_index, aye, TxStatus::Finalized).await?;
        Ok(tx_info.into())
    }

    // Treasury operations
    pub async fn treasury_propose_spend(&self, value: u128, beneficiary: AccountId32) -> Result<TransactionInfo> {
        let tx_info = self.inner.propose_spend(value, beneficiary, TxStatus::Finalized).await?;
        Ok(tx_info.into())
    }

    // Elections operations
    pub async fn elections_vote(&self, votes: Vec<AccountId32>) -> Result<TransactionInfo> {
        let tx_info = self.inner.vote(votes, TxStatus::Finalized).await?;
        Ok(tx_info.into())
    }
}
```

### Task 2.3: Contracts Wrapper

**Priority:** P3 (Low - Optional)

```rust
// File: selendra-sdk/rust/src/substrate/contracts.rs
// Action: Create ink! contract wrapper

use selendra_client::contract::{ContractInstance, ContractMetadata};

pub struct Contract {
    inner: ContractInstance,
}

impl Contract {
    /// Load contract from address
    pub async fn at(address: AccountId32, metadata: ContractMetadata) -> Result<Self> {
        // Wrap selendra_client's contract functionality
        todo!("Implement contract loading")
    }

    /// Call contract method
    pub async fn call(&self, method: &str, args: Vec<u8>) -> Result<Vec<u8>> {
        // Wrap contract call
        todo!("Implement contract call")
    }

    /// Deploy new contract
    pub async fn deploy(wasm: Vec<u8>, metadata: ContractMetadata) -> Result<Self> {
        // Wrap contract deployment
        todo!("Implement contract deployment")
    }
}
```

---

## Priority 3: TypeScript SDK Implementation

### Goal

Implement Substrate support in TypeScript using @polkadot/api (no wrapper option exists).

### Task 3.1: Add Dependencies

**Priority:** P0 (Critical for TypeScript)

### Task 3.1: Add Dependencies

**Priority:** P0 (Critical for TypeScript)

```json
// File: selendra-sdk/typescript/package.json
// Action: Add these dependencies

{
  "dependencies": {
    "@polkadot/api": "^10.11.2",
    "@polkadot/util": "^12.6.2",
    "@polkadot/util-crypto": "^12.6.2",
    "@polkadot/types": "^10.11.2",
    "@polkadot/keyring": "^12.6.2",
    "@polkadot/api-contract": "^10.11.2",
    "ethers": "^6.9.0"
  }
}
```

**Verification:**

```bash
cd selendra-sdk/typescript
npm install
```

### Task 3.2: Create SubstrateClient Class

**Priority:** P0 (Critical for TypeScript)

```typescript
// File: selendra-sdk/typescript/src/substrate/client.ts
// Action: Create new file with Substrate client

import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import type { AccountInfo, BalanceInfo, TransactionInfo } from "../types";

export class SubstrateClient {
  private api!: ApiPromise;
  private provider: WsProvider;
  private keyring?: Keyring;

  constructor(private endpoint: string) {
    this.provider = new WsProvider(endpoint);
  }

  async connect(): Promise<void> {
    await cryptoWaitReady();
    this.api = await ApiPromise.create({ provider: this.provider });
    await this.api.isReady;
    this.keyring = new Keyring({ type: "sr25519" });
  }

  async getAccount(address: string): Promise<AccountInfo> {
    const { nonce, data } = await this.api.query.system.account(address);

    return {
      address,
      nonce: nonce.toNumber(),
      data: {
        free: data.free.toString(),
        reserved: data.reserved.toString(),
        frozen: data.frozen?.toString() || "0",
      },
    };
  }

  async getBalance(address: string): Promise<BalanceInfo> {
    const { data } = await this.api.query.system.account(address);

    return {
      free: data.free.toString(),
      reserved: data.reserved.toString(),
      total: data.free.add(data.reserved).toString(),
    };
  }

  async transfer(
    from: string,
    to: string,
    amount: string
  ): Promise<TransactionInfo> {
    const sender = this.keyring!.addFromUri(from);

    return new Promise((resolve, reject) => {
      this.api.tx.balances
        .transferKeepAlive(to, amount)
        .signAndSend(sender, ({ status, txHash, events }) => {
          if (status.isFinalized) {
            resolve({
              hash: txHash.toString(),
              blockHash: status.asFinalized.toString(),
              status: "finalized",
            });
          }
        })
        .catch(reject);
    });
  }

  async disconnect(): Promise<void> {
    await this.api.disconnect();
  }
}
```

### Task 3.3: Integrate with Main SDK

**Priority:** P0 (Critical for TypeScript)

```typescript
// File: selendra-sdk/typescript/src/sdk.ts
// Action: Update methods to support Substrate

import { SubstrateClient } from "./substrate/client";

export class SelendraSDK {
  private substrateClient?: SubstrateClient;
  // ... existing EVM client

  async connect(): Promise<void> {
    if (this.config.chainType === ChainType.SUBSTRATE) {
      this.substrateClient = new SubstrateClient(this.config.rpcUrl);
      await this.substrateClient.connect();
    } else if (this.config.chainType === ChainType.EVM) {
      // ... existing EVM connection
    }
  }

  async getAccount(address?: string): Promise<AccountInfo> {
    if (this.config.chainType === ChainType.SUBSTRATE && this.substrateClient) {
      if (!address) throw new Error("Address required for Substrate");
      return await this.substrateClient.getAccount(address);
    }

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      // ... existing EVM logic
    }

    throw new Error("No client available");
  }

  async getBalance(address: string): Promise<BalanceInfo> {
    if (this.config.chainType === ChainType.SUBSTRATE && this.substrateClient) {
      return await this.substrateClient.getBalance(address);
    }

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      // ... existing EVM logic
    }

    throw new Error("No client available");
  }

  async submitTransaction(/* ... */): Promise<TransactionInfo> {
    if (this.config.chainType === ChainType.SUBSTRATE && this.substrateClient) {
      // Route to Substrate client
      return await this.substrateClient.transfer(from, to, amount);
    }

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      // ... existing EVM logic
    }

    throw new Error("No client available");
  }
}
```

### Task 3.4: TypeScript Staking Support

**Priority:** P2 (Medium - Optional for MVP)

```typescript
// File: selendra-sdk/typescript/src/substrate/staking.ts
// Action: Create staking operations

export class StakingClient {
  constructor(private api: ApiPromise) {}

  async bond(amount: string, controller: string): Promise<TransactionInfo> {
    // Implement staking bond
  }

  async nominate(targets: string[]): Promise<TransactionInfo> {
    // Implement validator nomination
  }

  async getStakingInfo(address: string): Promise<StakingInfo> {
    const ledger = await this.api.query.staking.ledger(address);
    // Parse and return staking info
  }
}
```

### Task 3.5: TypeScript Tests

**Priority:** P1 (High)

```typescript
// File: selendra-sdk/typescript/tests/substrate.test.ts
// Action: Create integration tests

import { SubstrateClient } from "../src/substrate/client";

describe("SubstrateClient", () => {
  let client: SubstrateClient;

  beforeAll(async () => {
    client = new SubstrateClient("wss://rpc-testnet.selendra.org");
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it("should query account info", async () => {
    const account = await client.getAccount(
      "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    );
    expect(account.nonce).toBeGreaterThanOrEqual(0);
  });

  it("should query balance", async () => {
    const balance = await client.getBalance(
      "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    );
    expect(balance.total).toBeDefined();
  });
});
```

**Verification:**

```bash
npm test
```

---

## Priority 4: Documentation & Examples

### Goal

Provide clear documentation for AI agents and human developers.

### Task 4.1: Update README

**Priority:** P1 (High)

```markdown
// File: selendra-sdk/README.md
// Action: Update with Substrate examples

## Substrate Support

### Rust

\`\`\`rust
use selendra_sdk::substrate::{Connection, KeyPair};

let conn = Connection::new("wss://rpc-testnet.selendra.org").await?;
let keypair = KeyPair::from_seed("//Alice");
let signed = conn.sign(&keypair)?;

// Query
let balance = signed.get_balance().await?;

// Transfer
let tx = signed.transfer(recipient, amount).await?;
\`\`\`

### TypeScript

\`\`\`typescript
import { SelendraSDK, ChainType } from '@selendra/sdk';

const sdk = new SelendraSDK({
chainType: ChainType.SUBSTRATE,
rpcUrl: 'wss://rpc-testnet.selendra.org'
});

await sdk.connect();
const balance = await sdk.getBalance(address);
```
