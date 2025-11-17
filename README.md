# Selendra SDK

Software development kit for building applications on Selendra blockchain.

[![npm version](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Tests](https://img.shields.io/badge/tests-70%2F129%20passing-yellow.svg)](https://github.com/selendra/selendra)

## Overview

TypeScript and Rust SDK for Selendra blockchain. Provides APIs for Substrate pallets and EVM interactions.

**Features:**

- Substrate pallet integration (Staking, Governance, Elections, Aleph Consensus)
- Account management with Substrate ↔ EVM conversion
- React hooks for dApp development
- TypeScript types
- 129 tests (70 passing, 54% coverage)

## Documentation

- [TypeScript API Reference](./docs/api/typescript.md)
- [React Hooks Guide](./docs/api/react.md)
- [Rust API Reference](./docs/api/rust.md)
- [Getting Started](./docs/guides/getting-started.md)
- [Examples](./examples/)

## Components

### Rust SDK (v1.0.0)

**Substrate Support:**

- Connection management (WebSocket with signing)
- Account operations (balance queries, transfers)
- Staking (bond, nominate, validate, chill)
- Governance (treasury proposals, elections)
- Smart contracts (ink! read/execute)
- Type conversions
- 4 examples
- Integration tests

**EVM Support:**

- In development

### TypeScript SDK (v1.0.0)

**Substrate Support:**

- Connection management (ApiPromise, WebSocket)
- Account operations (balance queries, transfers, account info)
- StakingClient (bond, nominate, unbond, withdraw, chill)
- AlephClient (session queries, validator tracking)
- ElectionsClient (vote, candidacy, member queries)
- DemocracyClient (propose, vote, delegate, referendums)
- UnifiedAccountManager (Substrate/EVM address conversion)
- React hooks (8 hooks)
- 2 examples
- 129 tests (70 passing)

**EVM Support:**

- In development

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

## Usage

### Rust - Substrate

```rust
use selendra_sdk::substrate::{Connection, keypair_from_string};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let conn = Connection::new("wss://rpc-testnet.selendra.org").await?;
    let keypair = keypair_from_string("//Alice");
    let signed = conn.sign(&keypair)?;

    let balance = signed.get_balance().await?;
    println!("Balance: {}", balance);

    use sp_runtime::AccountId32;
    let recipient = AccountId32::from([0u8; 32]);
    let amount = 1_000_000_000_000_000_000u128;
    let tx_hash = signed.transfer(recipient, amount).await?;
    println!("Transfer: {}", tx_hash);

    Ok(())
}
```

### Rust - EVM

```rust
use selendra_sdk::{SelendraSDK, Network};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let sdk = SelendraSDK::new()
        .with_endpoint("wss://rpc.selendra.org")?
        .with_network(Network::Selendra)
        .await?;

    let chain_info = sdk.chain_info().await?;
    println!("Chain: {}", chain_info.name);

    let account = sdk.create_account()?;
    let balance = sdk.get_balance(&account.address()).await?;
    println!("Balance: {}", balance);

    Ok(())
}
```

### TypeScript - Substrate

```typescript
import { SelendraSDK, ChainType } from "@selendrajs/sdk";

async function main() {
  const sdk = new SelendraSDK({
    endpoint: "wss://rpc-testnet.selendra.org",
    chainType: ChainType.Substrate,
  });

  await sdk.connect();

  const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
  const account = await sdk.getAccount(address);
  console.log("Balance:", account.balance);

  const balance = await sdk.getBalance(address);
  console.log("Free:", balance.free);

  const tx = {
    signer: "//Alice",
    to: address,
    amount: "1000000000000000000",
  };
  const txInfo = await sdk.submitTransaction(tx, {
    waitForFinality: true,
  });
  console.log("Transaction:", txInfo.hash);

  await sdk.disconnect();
}

main().catch(console.error);
```

### TypeScript - EVM

```typescript
import { SelendraSDK, Network } from "@selendrajs/sdk";

async function main() {
  const sdk = new SelendraSDK()
    .withEndpoint("https://rpc.selendra.org")
    .withNetwork(Network.Selendra);

  await sdk.connect();

  const chainInfo = await sdk.chainInfo();
  console.log("Chain:", chainInfo.name);

  const account = sdk.createAccount();
  const balance = await sdk.getBalance(account.address);
  console.log("Balance:", balance.toString());

  await sdk.disconnect();
}

main().catch(console.error);
```

## � Examples

### Rust Examples

All examples are located in `rust/examples/`:

- **[substrate_connection.rs](./rust/examples/substrate_connection.rs)** - Basic connection, balance queries, and transfers
- **[substrate_staking.rs](./rust/examples/substrate_staking.rs)** - Staking operations (bond, nominate, validate, chill)
- **[substrate_governance.rs](./rust/examples/substrate_governance.rs)** - Treasury proposals and elections queries
- **[substrate_contracts.rs](./rust/examples/substrate_contracts.rs)** - Smart contract interactions (ink!)

Run examples:

```bash
cd rust
cargo run --example substrate_connection
cargo run --example substrate_staking
```

### TypeScript Examples

All examples are located in `typescript/examples/`:

- **[substrate-basic.ts](./typescript/examples/substrate-basic.ts)** - Basic operations (account, balance, transfer)
- **[substrate-staking.ts](./typescript/examples/substrate-staking.ts)** - Staking operations using StakingClient

Run examples:

```bash
cd typescript
npx ts-node examples/substrate-basic.ts
npx ts-node examples/substrate-staking.ts
```

## Network Endpoints

**Mainnet:**

- HTTP RPC: `https://rpc.selendra.org` (Substrate & EVM)
- HTTP RPC: `https://rpcx.selendra.org` (Substrate & EVM)
- WebSocket: `wss://rpc.selendra.org` (Substrate)

**Testnet:**

- WebSocket: `wss://rpc-testnet.selendra.org`

Supported RPC methods:

- EVM: eth*\*, web3*_, net\__
- Substrate: state*\*, system*_, chain\__

## React Integration

- EVM JSON-RPC methods (eth*\*, web3*\_, net\_\_)
- Substrate RPC calls (state*\*, system*\_, chain\_\_)

## 🎓 Examples

console.log("Chain:", chainInfo.name);

// Create account
const account = sdk.createAccount();
console.log("Account:", account.address);

// Get balance
const balance = await sdk.getBalance(account.address);
console.log("Balance:", balance.toString());
}

main().catch(console.error);

````

### React

```tsx
import React from "react";
import { SelendraProvider, useSelendra } from "@selendrajs/sdk/react";

function App() {
  return (
    <SelendraProvider endpoint="wss://rpc.selendra.org">
      <WalletComponent />
    </SelendraProvider>
  );
}

function WalletComponent() {
  const { sdk, isConnected, createAccount, getBalance } = useSelendra();
  const [balance, setBalance] = React.useState<string | null>(null);

  const handleCreateWallet = async () => {
    const account = createAccount();
    console.log("New account:", account.address);

    const accountBalance = await getBalance(account.address);
    setBalance(accountBalance.toString());
  };

  return (
    <div>
      <h1>Selendra SDK Demo</h1>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
      {balance && <p>Balance: {balance}</p>}
      <button onClick={handleCreateWallet}>Create Wallet</button>
    </div>
  );
}
````

## Project Structure

```
selendra-sdk/
├── rust/
│   ├── src/
│   │   ├── connection/
│   │   ├── substrate/
│   │   ├── evm/
│   │   ├── unified/
│   │   ├── types/
│   │   └── utils/
│   └── Cargo.toml
├── typescript/
│   ├── src/
│   │   ├── connection/
│   │   ├── substrate/
│   │   ├── evm/
│   │   ├── unified/
│   │   ├── types/
│   │   ├── utils/
│   │   └── react/
│   ├── package.json
│   └── tsconfig.json
├── docs/
├── examples/
└── scripts/
```

## Development

### Prerequisites

- Rust 1.70+
- Node.js 16+
- Docker (optional)

### Setup

```bash
git clone https://github.com/selendra/selendra-sdk.git
cd selendra-sdk

make install
make check
make test
make build
```

### Development Commands

```bash
# Development build
make build-dev

# Run tests in watch mode
make test-watch

# Format code
make format

# Run linter
make lint

# Generate documentation
make docs

# Run examples
make examples

# Start development environment
make dev

# Run CI pipeline locally
make ci
```

### Testing

```bash
make test
make test-coverage
make test-rust
make test-typescript
```

## Configuration

### Environment Variables

```bash
SELENDRA_RPC_ENDPOINT=wss://rpc.selendra.org
SELENDRA_NETWORK=Selendra
SELENDRA_TIMEOUT=30000
SELENDRA_LOG_LEVEL=info
```

### Code Configuration

```typescript
const sdk = new SelendraSDK()
  .withEndpoint("wss://rpc.selendra.org")
  .withNetwork(Network.Selendra)
  .withTimeout(30000)
  .withLogLevel(LogLevel.INFO);
```

## Contributing

See [Contributing Guidelines](./CONTRIBUTING.md).

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/name`)
5. Open Pull Request

## License

Apache License 2.0 - see [LICENSE](./LICENSE) file.

## Support

- [Documentation](https://docs.selendra.org)
- [Discord](https://discord.gg/selendra)
- [GitHub Issues](https://github.com/selendra/selendra-sdk/issues)

## Credits

Built with Substrate, Polkadot.js, and Ethers.js.
