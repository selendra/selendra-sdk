# Quick Start

This guide walks you through common tasks with the Selendra SDK.

## Connecting to the Network

```typescript
import { createEVMProvider, createSubstrateProvider } from '@selendrajs/sdk';

// EVM Provider (for smart contracts)
const evmProvider = createEVMProvider('testnet');

// Substrate Provider (for pallets)
const substrateProvider = await createSubstrateProvider('testnet');
```

## Checking Balance

### EVM Balance

```typescript
import { createEVMProvider, formatSEL } from '@selendrajs/sdk';

const provider = createEVMProvider('mainnet');
const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE83';

const balance = await provider.getBalance(address);
console.log(`Balance: ${formatSEL(balance)} SEL`);
```

### Substrate Balance

```typescript
import { createSubstrateProvider, formatSEL } from '@selendrajs/sdk';

const provider = await createSubstrateProvider('mainnet');
const address = 'sel1abc...xyz';

const { free, reserved, frozen } = await provider.getBalance(address);
console.log(`Free: ${formatSEL(free)} SEL`);
console.log(`Reserved: ${formatSEL(reserved)} SEL`);
```

## Transferring Tokens

### EVM Transfer

```typescript
import { createEVMProvider, parseSEL } from '@selendrajs/sdk';

const provider = createEVMProvider('testnet');
const privateKey = process.env.PRIVATE_KEY!;

const txHash = await provider.transfer(
  privateKey,
  '0x...recipient',
  parseSEL('10') // 10 SEL
);

console.log(`Transaction: ${txHash}`);
```

### Wait for Confirmation

```typescript
const receipt = await provider.waitForTransaction(txHash);
console.log(`Confirmed in block ${receipt.blockNumber}`);
```

## Deploying Contracts

### Using the SDK

```typescript
import { createEVMProvider } from '@selendrajs/sdk';
import { abi, bytecode } from './MyContract.json';

const provider = createEVMProvider('testnet');
const privateKey = process.env.PRIVATE_KEY!;

// Deploy with constructor arguments
const contractAddress = await provider.deployContract(
  abi,
  bytecode,
  privateKey,
  ['Constructor Arg 1', 1000]
);

console.log(`Deployed at: ${contractAddress}`);
```

### Using the CLI

```bash
# Initialize a project
selendra init my-project --template evm

# Compile contracts
cd my-project
selendra compile

# Deploy
selendra deploy MyContract --network testnet --args '["arg1", 1000]'
```

## Contract Interaction

### Read Functions

```typescript
import { createEVMProvider } from '@selendrajs/sdk';

const provider = createEVMProvider('mainnet');
const contractAddress = '0x...';
const abi = [...]; // Contract ABI

// Read a value
const value = await provider.readContract(
  contractAddress,
  abi,
  'balanceOf',
  ['0x...address']
);

console.log(`Balance: ${value}`);
```

### Write Functions

```typescript
const privateKey = process.env.PRIVATE_KEY!;

// Write to contract
const txHash = await provider.writeContract(
  contractAddress,
  abi,
  privateKey,
  'transfer',
  ['0x...recipient', 1000n]
);

await provider.waitForTransaction(txHash);
console.log('Transfer complete!');
```

## Gas Estimation

```typescript
// Estimate gas for a transfer
const gasEstimate = await provider.estimateGas({
  to: '0x...recipient',
  value: parseSEL('1')
});

console.log(`Estimated gas: ${gasEstimate}`);

// Get current gas prices
const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = 
  await provider.getGasCosts();
```

## Error Handling

```typescript
import { 
  createEVMProvider, 
  TransactionError,
  InsufficientFundsError,
  isSelendraError 
} from '@selendrajs/sdk';

try {
  await provider.transfer(privateKey, to, amount);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    console.log('Not enough balance for this transfer');
  } else if (error instanceof TransactionError) {
    console.log(`Transaction failed: ${error.message}`);
  } else if (isSelendraError(error)) {
    console.log(`Selendra error (${error.code}): ${error.message}`);
  } else {
    throw error;
  }
}
```

## Next Steps

- [Unified Accounts](/guide/unified-accounts) - Learn about Selendra's unified account system
- [Multicall](/guide/multicall) - Batch multiple calls for better performance
- [CLI Reference](/cli/overview) - Full CLI command reference
- [API Reference](/api/overview) - Complete API documentation
