# Getting Started

Quick guide to building with Selendra SDK.

** Current Status:** Substrate features are production-ready. EVM features are in beta (50% ). Rust SDK is under development (58% ).

## Installation

### TypeScript

```bash
npm install @selendrajs/sdk
```

### Rust

```bash
# Rust SDK currently under development - use TypeScript for production
cargo add selendra-sdk
```

## First Connection

### TypeScript (Recommended for Production)

```typescript
import { SelendraSDK, Network } from "@selendrajs/sdk";

const sdk = new SelendraSDK()
  .withEndpoint("https://rpc.selendra.org")
  .withNetwork(Network.Selendra);

await sdk.connect();

// Query balance (Substrate -  Production Ready)
const balance = await sdk.getBalance(address);
```

### Rust (Development Only)

```rust
use selendra_sdk::{builder};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut sdk = builder()
        .substrate_endpoint("wss://rpc.selendra.org")
        .build()
        .await?;

    let block = sdk.substrate().get_latest_block().await?;
    Ok(())
}
```

## Core Concepts

### Unified Architecture

- Substrate and EVM in single interface
- Seamless address conversion
- Cross-chain balance queries

### Network Endpoints

- **HTTP**: `https://rpc.selendra.org` or `https://rpcx.selendra.org`
- **WebSocket**: `wss://rpc.selendra.org`

Both HTTP endpoints support Substrate and EVM.

## Next Steps

- [API Reference](../api/typescript.md) -  API documentation
- [Quick Start](./quick-start.md) - Common operations
- [Examples](../../typescript/examples/) - Working code samples

// Testnet - Development and testing
const sdk = new SelendraSDK({ network: 'testnet' });

// Custom network
const sdk = new SelendraSDK({
network: 'custom',
wsEndpoint: 'wss://your-rpc-endpoint',
httpEndpoint: 'https://your-http-endpoint'
});

````

### Account Management

The SDK provides seamless account management for both Substrate and EVM accounts:

```typescript
// Create a new account
const account = await sdk.createAccount();
console.log('New account:', account.address);

// Import from mnemonic
const account = await sdk.importAccountFromMnemonic('your twelve word mnemonic phrase here');

// Import from private key
const account = await sdk.importAccountFromPrivateKey('0x...');

// Get account balance
const balance = await sdk.getBalance(account.address);
console.log('Balance:', balance);
````

##  Setting Up Your Development Environment

### Prerequisites

- **Node.js** 16.0+ (for TypeScript/JavaScript)
- **Rust** 1.70+ (for Rust development)
- **Git** for version control

### Development Tools

#### CLI Installation

```bash
# Install Selendra CLI
npm install -g @selendrajs/cli

# Or using cargo
cargo install selendra-cli
```

#### VS Code Extensions

We recommend these VS Code extensions for the best development experience:

- **Rust Analyzer** - Rust language support
- **TypeScript Importer** - Auto-import TypeScript modules
- **Prettier** - Code formatting
- **ESLint** - Code linting

### Environment Setup

Create a `.env` file in your project root:

```env
# Network endpoints
SELENDRA_RPC_ENDPOINT=wss://rpc.selendra.org
SELENDRA_HTTP_ENDPOINT=https://rpc.selendra.org

# Wallet configuration
DEFAULT_MNEMONIC=your development mnemonic here

# API keys (optional)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

##  Building Your First dApp

Let's build a simple wallet application that demonstrates core SDK features.

### Step 1: Project Setup

```bash
# Create new project
mkdir my-selendra-dapp
cd my-selendra-dapp

# Initialize npm project
npm init -y

# Install dependencies
npm install @selendrajs/sdk react react-dom
npm install -D typescript @types/react @types/react-dom vite
```

### Step 2: Basic Wallet Component

```typescript
// src/components/Wallet.tsx
import React, { useState, useEffect } from "react";
import { SelendraSDK } from "@selendrajs/sdk";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
}

export const Wallet: React.FC = () => {
  const [sdk] = useState(() => new SelendraSDK({ network: "testnet" }));
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: "0",
  });

  useEffect(() => {
    // Check for existing wallet connection
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      await sdk.connect();
      // Try to restore existing account
      const accounts = await sdk.getAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        const balance = await sdk.getBalance(account.address);
        setWalletState({
          isConnected: true,
          address: account.address,
          balance: balance.toString(),
        });
      }
    } catch (error) {
      console.log("No existing connection found");
    }
  };

  const createWallet = async () => {
    try {
      const account = await sdk.createAccount();
      const balance = await sdk.getBalance(account.address);

      setWalletState({
        isConnected: true,
        address: account.address,
        balance: balance.toString(),
      });
    } catch (error) {
      console.error("Failed to create wallet:", error);
    }
  };

  const sendTransaction = async (to: string, amount: string) => {
    try {
      const tx = await sdk.transfer({
        to,
        amount: BigInt(amount),
        from: walletState.address!,
      });

      console.log("Transaction sent:", tx.hash);
      return tx;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  };

  return (
    <div className="wallet">
      <h2>Selendra Wallet</h2>

      {!walletState.isConnected ? (
        <button onClick={createWallet}>Create New Wallet</button>
      ) : (
        <div className="wallet-info">
          <p>
            <strong>Address:</strong> {walletState.address}
          </p>
          <p>
            <strong>Balance:</strong> {walletState.balance} SEL
          </p>

          <TransactionForm
            onSend={sendTransaction}
            balance={walletState.balance}
          />
        </div>
      )}
    </div>
  );
};

interface TransactionFormProps {
  onSend: (to: string, amount: string) => Promise<void>;
  balance: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSend,
  balance,
}) => {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSend(to, amount);
      setTo("");
      setAmount("");
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      <h3>Send SEL</h3>

      <div className="form-group">
        <label>To:</label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Recipient address"
          required
        />
      </div>

      <div className="form-group">
        <label>Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in SEL"
          max={balance}
          step="0.000001"
          required
        />
      </div>

      <button type="submit" disabled={isLoading || !to || !amount}>
        {isLoading ? "Sending..." : "Send"}
      </button>
    </form>
  );
};
```

### Step 3: Main App

```typescript
// src/App.tsx
import React from "react";
import { Wallet } from "./components/Wallet";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Selendra</h1>
        <p>Build  decentralized applications</p>
      </header>

      <main>
        <Wallet />
      </main>
    </div>
  );
}

export default App;
```

## 🔧 Common Pitfalls and Solutions

### 1. Connection Issues

**Problem**: Can't connect to the network
**Solution**: Check your endpoint and network settings

```typescript
// Use the correct endpoint for your network
const endpoints = {
  mainnet: "wss://rpc.selendra.org",
  testnet: "wss://testnet-rpc.selendra.org",
};

const sdk = new SelendraSDK({
  network: "mainnet",
  wsEndpoint: endpoints.mainnet,
  connectionTimeout: 30000, // 30 seconds timeout
});
```

### 2. Transaction Failures

**Problem**: Transactions keep failing
**Solution**: Check gas fees and account balance

```typescript
try {
  // Always check balance before sending
  const balance = await sdk.getBalance(fromAddress);
  const gasEstimate = await sdk.estimateGas(transaction);

  if (balance < gasEstimate + amount) {
    throw new Error("Insufficient balance");
  }

  const tx = await sdk.sendTransaction({
    ...transaction,
    gasLimit: gasEstimate * 1.2, // Add 20% buffer
  });
} catch (error) {
  console.error("Transaction failed:", error.message);
}
```

### 3. Async/Await Patterns

**Problem**: Forgetting to await async operations
**Solution**: Always use proper async/await patterns

```typescript
// ❌ Wrong - forgetting to await
const balance = sdk.getBalance(address);
console.log(balance); // Returns a Promise!

//  Correct - using await
const balance = await sdk.getBalance(address);
console.log(balance); // Returns actual balance
```

### 4. Error Handling

**Problem**: Not handling network errors properly
**Solution**: Implement  error handling

```typescript
const robustOperation = async () => {
  try {
    const result = await sdk.someOperation();
    return result;
  } catch (error) {
    if (error.code === "NETWORK_ERROR") {
      // Retry after delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return robustOperation(); // Recursive retry
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Not enough balance for this operation");
    } else {
      console.error("Unexpected error:", error);
      throw error;
    }
  }
};
```

##  Next Steps

Congratulations! You've built your first Selendra dApp. Here's what to explore next:

1. **Smart Contracts** - Learn to deploy and interact with contracts
2. **DeFi Integration** - Connect to liquidity pools and DEXs
3. **NFTs** - Create and manage non-fungible tokens
4. **Staking** - Participate in network validation
5. **Cross-chain** - Build applications that bridge multiple networks

##  Additional Resources

- [API Documentation](../api/) -  SDK reference
- [Examples](../../examples/) - Ready-to-use example projects
- [Tutorials](../tutorials/) - Step-by-step guides
- [Community Discord](https://discord.gg/selendra) - Get help from the community
- [GitHub Discussions](https://github.com/selendra/selendra-sdk/discussions) - Feature requests and discussions

##  Contributing

We welcome contributions! Check out our [Contributing Guide](../../CONTRIBUTING.md) to learn how you can help improve the SDK.

---

**Happy building!** 

If you get stuck or have questions, don't hesitate to reach out on our [Discord server](https://discord.gg/selendra) or [GitHub Discussions](https://github.com/selendra/selendra-sdk/discussions).
