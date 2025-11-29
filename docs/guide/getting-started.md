# Getting Started

Welcome to the Selendra SDK! This guide will help you get started with building applications on the Selendra blockchain.

## What is Selendra?

Selendra is a high-performance blockchain that combines:

- **EVM Compatibility** - Deploy Solidity smart contracts
- **Substrate Runtime** - Access Polkadot ecosystem features
- **Unified Accounts** - One account for both EVM and Substrate

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- Basic knowledge of TypeScript/JavaScript
- (Optional) A code editor with TypeScript support (VS Code recommended)

## Installation

### SDK Installation

Install the SDK in your project:

```bash
npm install @selendrajs/sdk
```

Or with yarn:

```bash
yarn add @selendrajs/sdk
```

### CLI Installation

Install the CLI globally for development tools:

```bash
npm install -g @selendrajs/cli
```

Verify the installation:

```bash
selendra --version
```

## Your First Connection

Let's connect to the Selendra network and check the current block:

```typescript
import { createEVMProvider } from '@selendrajs/sdk';

async function main() {
  // Connect to Selendra mainnet
  const provider = createEVMProvider('mainnet');
  
  // Get the current block number
  const blockNumber = await provider.getBlockNumber();
  console.log(`Current block: ${blockNumber}`);
  
  // Get chain ID
  const chainId = await provider.getChainId();
  console.log(`Chain ID: ${chainId}`);
}

main().catch(console.error);
```

## Networks

Selendra has three networks:

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 1961 | https://rpc.selendra.org |
| Testnet | 1953 | https://rpc.testnet.selendra.org |
| Local | 1337 | http://localhost:8545 |

## Next Steps

Now that you're connected, you can:

1. [Check account balances](/guide/quick-start#checking-balance)
2. [Transfer tokens](/guide/quick-start#transferring-tokens)
3. [Deploy smart contracts](/guide/quick-start#deploying-contracts)
4. [Interact with contracts](/guide/quick-start#contract-interaction)

Continue to the [Quick Start](/guide/quick-start) guide to learn more!
