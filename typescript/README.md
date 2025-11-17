# @selendrajs/sdk

TypeScript SDK for Selendra blockchain.

[![npm](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Installation

```bash
npm install @selendrajs/sdk
```

## What You Can Build

Staking interfaces · Governance tools · Smart contract dApps · Wallets · Block explorers

## Quick Start

```typescript
import { SelendraSDK } from '@selendrajs/sdk';

const sdk = new SelendraSDK({ endpoint: 'https://rpc.selendra.org' });
await sdk.connect();

// Staking
const validators = await sdk.substrate.staking.getValidators();
await sdk.substrate.staking.bond(amount, destination);

// Smart contracts
const contract = await sdk.evm.contract.deploy(abi, bytecode, args);
await contract.write('transfer', [recipient, amount]);

// Unified accounts
const evmAddr = sdk.unified.accounts.substrateToEvm('5GrwvaEF...');
```

## React

```tsx
import { SelendraProvider, useBalance, useStaking } from '@selendrajs/sdk';

function App() {
  const { balance } = useBalance('5GrwvaEF...');
  const { data: staking } = useStaking('5GrwvaEF...');
  
  return <div>Balance: {balance?.formatted} SEL</div>;
}
```

## API Overview

**Substrate**: `staking` · `democracy` · `elections` · `aleph`

**EVM**: `account` · `contract` · `transaction` · `events`

**Unified**: `accounts.substrateToEvm()` · `accounts.getUnifiedBalance()`

**React**: `useBalance` · `useStaking` · `useContract` · `useTransaction`

## Examples

See [`examples/`](./examples/) and [`src/react/examples/`](./src/react/examples/)

## Endpoints

Mainnet: `https://rpc.selendra.org`

Testnet: `https://rpc-testnet.selendra.org`

## License

Apache 2.0
