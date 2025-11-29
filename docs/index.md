---
layout: home

hero:
  name: Selendra SDK
  text: Build on Selendra with TypeScript
  tagline: A powerful SDK for interacting with the Selendra blockchain - EVM smart contracts and Substrate pallets in one unified experience.
  image:
    src: /logo.png
    alt: Selendra Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/selendra/selendra-sdk

features:
  - icon: ⚡
    title: EVM Compatible
    details: Deploy and interact with Solidity smart contracts using familiar tools like viem and wagmi.
  - icon: 🔗
    title: Substrate Integration
    details: Access native Substrate pallets including staking, governance, and unified accounts.
  - icon: 🛠️
    title: Powerful CLI
    details: Initialize projects, deploy contracts, and manage your dApp from the command line.
  - icon: 📦
    title: TypeScript First
    details: Full TypeScript support with comprehensive type definitions and IntelliSense.
  - icon: 🔐
    title: Unified Accounts
    details: One account for both EVM and Substrate - seamless experience across all features.
  - icon: 🚀
    title: Production Ready
    details: Battle-tested SDK used in production applications on Selendra mainnet.
---

## Quick Install

```bash
# Install the SDK
npm install @selendrajs/sdk

# Or install the CLI globally
npm install -g @selendrajs/cli
```

## Quick Example

```typescript
import { createEVMProvider, formatSEL } from '@selendrajs/sdk';

// Connect to Selendra
const provider = createEVMProvider('mainnet');

// Check balance
const balance = await provider.getBalance('0x...');
console.log(`Balance: ${formatSEL(balance)} SEL`);

// Deploy a contract
const hash = await provider.deployContract(
  abi,
  bytecode,
  privateKey,
  [constructorArg1, constructorArg2]
);
```

## CLI Quick Start

```bash
# Initialize a new project
selendra init my-project --template evm

# Deploy a contract
selendra deploy MyContract --network testnet

# Check network status
selendra status --network mainnet
```
