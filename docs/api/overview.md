# API Overview

The Selendra SDK provides a comprehensive TypeScript API for blockchain development.

## Installation

```bash
npm install @selendrajs/sdk
```

## Core Exports

```typescript
import {
  // Providers
  createEVMProvider,
  createSubstrateProvider,
  createUnifiedProvider,

  // Utilities
  Multicall,
  createMulticall,
  batchERC20Balances,

  // Formatting
  formatSEL,
  parseSEL,

  // Address utilities
  isValidAddress,
  toEVMAddress,
  toSubstrateAddress,

  // Error classes
  SelendraError,
  TransactionError,
  ContractError,
  NetworkError,

  // Types
  type EVMProvider,
  type SubstrateProvider,
  type NetworkConfig,
} from "@selendrajs/sdk";
```

## Providers

### EVMProvider

For EVM/Solidity smart contract interactions:

```typescript
const provider = createEVMProvider("mainnet");

// Read data
const balance = await provider.getBalance(address);
const block = await provider.getBlockNumber();

// Write transactions
const hash = await provider.transfer(privateKey, to, amount);
const receipt = await provider.waitForTransaction(hash);
```

### SubstrateProvider

For native Substrate pallet interactions:

```typescript
const provider = await createSubstrateProvider("mainnet");

// Read data
const balance = await provider.getBalance(address);

// Submit extrinsics
await provider.transfer(mnemonic, to, amount);
```

### UnifiedProvider

Combines both EVM and Substrate:

```typescript
const provider = await createUnifiedProvider("mainnet");

// Access both
const evmBalance = await provider.evm.getBalance(evmAddress);
const substrateBalance = await provider.substrate.getBalance(substrateAddress);

// Unified account
const mapping = await provider.getAccountMapping(address);
```

## Utilities

### Multicall

Batch multiple read calls:

```typescript
const multicall = createMulticall(client);

const results = await multicall.call([
  { address: token, abi: erc20Abi, functionName: "balanceOf", args: [user] },
  { address: token, abi: erc20Abi, functionName: "totalSupply" },
]);
```

### Formatting

```typescript
// Format wei to SEL
formatSEL(1000000000000000000n); // "1.0"

// Parse SEL to wei
parseSEL("1.0"); // 1000000000000000000n
```

## Error Handling

```typescript
import {
  SelendraError,
  TransactionError,
  isSelendraError,
} from "@selendrajs/sdk";

try {
  await provider.transfer(key, to, amount);
} catch (error) {
  if (isSelendraError(error)) {
    console.log(`Error ${error.code}: ${error.message}`);
  }
}
```

## TypeScript Support

Full TypeScript support with:

- Comprehensive type definitions
- IntelliSense support
- Type-safe contract interactions
- Generics for custom types

## Modules

- [EVMProvider](/api/providers/evm) - EVM interactions
- [SubstrateProvider](/api/providers/substrate) - Substrate interactions
- [Multicall](/api/utils/multicall) - Batched calls
- [Errors](/api/errors) - Error handling
- [Types](/api/types) - Type definitions
