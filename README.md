# Selendra SDK

SDK for building applications on Selendra blockchain.

[![npm version](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Overview

TypeScript and Rust SDK for Selendra blockchain. Wraps Substrate pallets, provides React hooks.

**What Works:**
- ✅ Substrate features (staking, council, democracy, treasury, elections)
- ✅ React hooks (15 production hooks)
- ✅ Account conversion (Substrate ↔ EVM)
- 🚧 EVM support (beta - basic queries only)

**Status:**
- **TypeScript:** ✅ Production ready (129 tests, 70 passing)
- **Rust:** ⚠️ In development (not ready for production)

**📚 Full Documentation:** [selendra.org/docs/sdk](https://selendra.org/docs/sdk)

## Installation

### TypeScript/JavaScript

```bash
npm install @selendrajs/sdk
```

### Rust

```toml
[dependencies]
selendra-sdk = "1.0.0"
tokio = { version = "1.0", features = ["full"] }
```

> **Note:** Crates.io publication coming soon. For now, use path dependency or git.

## Quick Start

### Rust

```rust
use selendra_sdk::substrate::{Connection, keypair_from_string};
use sp_runtime::AccountId32;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to network
    let conn = Connection::new("wss://rpc-testnet.selendra.org").await?;
    let keypair = keypair_from_string("//Alice");
    let signed = conn.sign(&keypair)?;

    // Query balance
    let balance = signed.get_balance().await?;
    println!("Balance: {}", balance);

    // Get full account info
    let account_info = signed.get_account_info().await?;
    println!("Nonce: {}, Free: {}", account_info.nonce, account_info.data.free);

    // Transfer tokens
    let recipient = AccountId32::from([0u8; 32]);
    let tx_hash = signed.transfer(recipient, 1_000_000_000_000u128).await?;
    println!("Transfer: {}", tx_hash);

    Ok(())
}
```

**Staking operations:**

```rust
// Bond tokens
let tx = signed.stake_bond(1_000_000_000_000u128).await?;

// Nominate validators
let validators = vec![/* validator addresses */];
let tx = signed.stake_nominate(validators).await?;

// Register as validator
let tx = signed.stake_validate(10 /* commission % */).await?;

// Stop staking
let tx = signed.stake_chill().await?;
```

**Governance operations:**

```rust
// Query treasury
let proposals_count = conn.get_treasury_proposals_count().await?;
let approvals = conn.get_treasury_approvals().await?;

// Propose treasury spend
let tx = signed.treasury_propose_spend(100_000u128, beneficiary).await?;

// Query validators
let current_validators = conn.get_current_era_validators().await?;
```

### TypeScript

```typescript
import { SelendraSDK, ChainType } from "@selendrajs/sdk";

async function main() {
  // Connect to network
  const sdk = new SelendraSDK({
    endpoint: "wss://rpc-testnet.selendra.org",
    chainType: ChainType.Substrate,
  });
  await sdk.connect();

  // Query account
  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
  const account = await sdk.getAccount(address);
  console.log("Balance:", account.balance);

  // Transfer tokens
  const tx = await sdk.submitTransaction({
    signer: "//Alice",
    to: address,
    amount: "1000000000000",
  });
  console.log("Transaction:", tx.hash);

  await sdk.disconnect();
}

main().catch(console.error);
```

**Staking with StakingClient:**

```typescript
import { StakingClient } from "@selendrajs/sdk";

const staking = new StakingClient(api);

// Bond tokens
await staking.bond("1000000000000", controller, signer);

// Nominate validators
await staking.nominate([validator1, validator2], signer);

// Query staking info
const info = await staking.getStakingInfo(address);
console.log("Bonded:", info.bonded);
```

### React

```tsx
import { SelendraProvider, useSelendra } from "@selendrajs/sdk/react";

function App() {
  return (
    <SelendraProvider endpoint="wss://rpc.selendra.org">
      <WalletComponent />
    </SelendraProvider>
  );
}

function WalletComponent() {
  const { isConnected, getBalance } = useSelendra();
  const [balance, setBalance] = React.useState<string>();

  React.useEffect(() => {
    if (isConnected) {
      getBalance("5GrwvaEF...").then(setBalance);
    }
  }, [isConnected]);

  return <div>Balance: {balance}</div>;
}
```

## API Overview

### Rust SDK

**Substrate Module (`selendra_sdk::substrate`)**

- `Connection::new(url)` - Connect to Substrate node
- `Connection::sign(keypair)` - Create signed connection
- `SignedConnection::get_balance()` - Query balance
- `SignedConnection::get_account_info()` - Get full account info
- `SignedConnection::transfer(to, amount)` - Transfer tokens
- `SignedConnection::stake_bond(amount)` - Bond for staking
- `SignedConnection::stake_nominate(validators)` - Nominate validators
- `SignedConnection::stake_validate(commission)` - Register as validator
- `SignedConnection::stake_chill()` - Stop staking
- `Connection::get_treasury_proposals_count()` - Query treasury
- `SignedConnection::treasury_propose_spend(value, beneficiary)` - Propose spend

### TypeScript SDK

**Core Classes**

- `SelendraSDK` - Main SDK class
- `StakingClient` - Staking operations
- `AlephClient` - Aleph consensus queries
- `ElectionsClient` - Elections and voting
- `DemocracyClient` - Democracy governance
- `UnifiedAccountManager` - Address conversion

**React Hooks**

- `useSelendra()` - SDK instance and connection state
- `useStaking()` - Staking operations
- `useBalance()` - Balance queries
- `useAccount()` - Account management

## Examples

### Rust Examples

Located in `rust/examples/`:

```bash
cd rust

# Basic connection and transfers
cargo run --example substrate_connection --features substrate

# Staking operations
cargo run --example substrate_staking --features substrate

# Governance queries
cargo run --example substrate_governance --features substrate

# Smart contracts
cargo run --example substrate_contracts --features substrate
```

### TypeScript Examples

Located in `typescript/examples/`:

```bash
cd typescript

# Basic operations
npx ts-node examples/substrate-basic.ts

# Staking
npx ts-node examples/substrate-staking.ts
```

## Network Endpoints

**Mainnet:**

- WebSocket: `wss://rpc.selendra.org`
- HTTP: `https://rpc.selendra.org`
- HTTP: `https://rpcx.selendra.org`

**Testnet:**

- WebSocket: `wss://rpc-testnet.selendra.org`

## Development

### Setup

```bash
git clone https://github.com/selendra/selendra-sdk.git
cd selendra-sdk

# Install dependencies
make install

# Run tests
make test

# Build
make build
```

### Testing

```bash
# All tests
make test

# Rust tests only
cd rust && cargo test --features substrate

# TypeScript tests only
cd typescript && npm test
```

### Development Commands

```bash
# Format code
make format

# Lint
make lint

# Generate docs
make docs

# Development build
make build-dev
```

## Project Structure

```
selendra-sdk/
├── rust/           # Rust SDK
│   ├── src/
│   │   ├── substrate/  # Substrate client
│   │   ├── evm/        # EVM client
│   │   ├── unified/    # Unified API
│   │   └── types/      # Type definitions
│   └── examples/
├── typescript/     # TypeScript SDK
│   ├── src/
│   │   ├── substrate/  # Substrate client
│   │   ├── evm/        # EVM client
│   │   ├── unified/    # Unified API
│   │   ├── react/      # React hooks
│   │   └── types/      # Type definitions
│   └── examples/
└── docs/          # Documentation
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

Apache License 2.0 - see [LICENSE](./LICENSE) file.

## Links

- [Documentation](https://selendra.org/docs/sdk)
- [Discord](https://discord.gg/selendra)
- [GitHub Issues](https://github.com/selendra/selendra-sdk/issues)
- [Selendra Blockchain](https://selendra.org)

## Acknowledgments

Built with [Substrate](https://substrate.io), [Polkadot.js](https://polkadot.js.org), and [Ethers.js](https://ethers.org).
