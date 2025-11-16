# Quick Start

Get up and running with Selendra SDK in minutes.

## Prerequisites

- Node.js >= 16 (TypeScript) or Rust >= 1.70

## Installation

### TypeScript

```bash
npm install @selendrajs/sdk
```

### Rust

```toml
[dependencies]
selendra-sdk = "0.1.0"
tokio = { version = "1.0", features = ["full"] }
```

## Basic Usage

### TypeScript

```typescript
import { SelendraSDK, Network } from "@selendrajs/sdk";

const sdk = new SelendraSDK()
  .withEndpoint("https://rpc.selendra.org")
  .withNetwork(Network.Selendra);

await sdk.connect();

// Get balance
const balance = await sdk.getBalance(address);

// Transfer
await sdk.transfer(signer, recipient, amount);
```

### Rust

```rust
use selendra_sdk::{builder};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let sdk = builder()
        .substrate_endpoint("wss://rpc.selendra.org")
        .build()
        .await?;

    let block = sdk.substrate().get_latest_block().await?;
    println!("Block: {}", block.number);

    Ok(())
}
```

## Common Operations

### Query Chain Info

```typescript
const info = await sdk.chainInfo();
console.log(info.name, info.version);
```

### Staking

```typescript
import { StakingClient } from "@selendrajs/sdk";

const staking = new StakingClient(sdk.getApi());
await staking.bond(signer, amount, controller);
await staking.nominate(signer, [validator1, validator2]);
```

### Unified Accounts

```typescript
import { UnifiedAccountManager } from "@selendrajs/sdk";

const accounts = new UnifiedAccountManager(sdk.getApi());
const evmAddr = accounts.substrateToEvm(substrateAddr);
const subAddr = accounts.evmToSubstrate(evmAddr);
```

## Next Steps

- [Getting Started Guide](./getting-started.md) - Detailed introduction
- [API Reference](../api/typescript.md) - Complete API docs
- [Examples](../../typescript/examples/) - Working code samples

      // Get chain info
      let chain_info = sdk.chain_info().await?;
      println!("Chain: {}", chain_info.name);

      // Create an account
      let account = sdk.create_account()?;
      println!("Account: {}", account.address());

      // Get balance
      let balance = sdk.get_balance(&account.address()).await?;
      println!("Balance: {}", balance);

      Ok(())

  }

````

### TypeScript Example

```typescript
import { SelendraSDK, Network } from '@selendrajs/sdk';

async function main() {
  // Initialize the SDK
  const sdk = new SelendraSDK()
    .withEndpoint('wss://rpc.selendra.org')
    .withNetwork(Network.Selendra);

  // Get chain info
  const chainInfo = await sdk.chainInfo();
  console.log('Chain:', chainInfo.name);

  // Create an account
  const account = sdk.createAccount();
  console.log('Account:', account.address);

  // Get balance
  const balance = await sdk.getBalance(account.address);
  console.log('Balance:', balance.toString());
}

main().catch(console.error);
````

## React Integration

### Setup

```tsx
import { SelendraProvider } from "@selendrajs/sdk/react";

function App() {
  return (
    <SelendraProvider endpoint="wss://rpc.selendra.org">
      <MyComponent />
    </SelendraProvider>
  );
}
```

### Using the SDK in Components

```tsx
import { useSelendra } from "@selendrajs/sdk/react";

function WalletComponent() {
  const { sdk, isConnected, createAccount } = useSelendra();

  const handleCreateWallet = () => {
    const account = createAccount();
    console.log("New account:", account.address);
  };

  return (
    <div>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <button onClick={handleCreateWallet}>Create Wallet</button>
    </div>
  );
}
```

## Configuration

### Environment Variables

You can configure the SDK using environment variables:

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

## Networks

The SDK supports multiple networks:

### Mainnet

```typescript
.withNetwork(Network.Selendra)
```

### Testnet

```typescript
.withNetwork(Network.SelendraTestnet)
```

### Custom Network

```typescript
.withNetwork(Network.Custom {
  name: "My Network",
  chainId: "my-chain",
  endpoint: "wss://my-rpc.endpoint"
})
```

## Next Steps

- Read the [API Overview](../api/overview.md) for detailed API information
- Check out the [Examples](../../examples/) for more comprehensive usage patterns
- Learn about [Advanced Usage](./advanced-usage.md) for production-ready applications
- Explore the [Architecture Guide](./architecture.md) for deep understanding of the SDK

## Getting Help

- [Documentation](https://docs.selendra.org)
- [Discord Community](https://discord.gg/selendra)
- [GitHub Issues](https://github.com/selendra/selendra-sdk/issues)
- [Examples Repository](https://github.com/selendra/selendra-examples)
