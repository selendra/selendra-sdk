# Examples Overview

Learn by example with these practical code samples.

## Categories

### Basic Examples

- [Connect to Network](/examples/connect) - Establish connections
- [Check Balance](/examples/balance) - Query account balances
- [Transfer Tokens](/examples/transfer) - Send SEL tokens

### Contract Examples

- [Deploy Contract](/examples/deploy-contract) - Deploy smart contracts
- [Contract Interaction](/examples/contract-interaction) - Call contract functions
- [ERC-20 Token](/examples/erc20) - Work with ERC-20 tokens
- [NFT (ERC-721)](/examples/nft) - Create and manage NFTs

### Advanced Examples

- [Unified Accounts](/examples/unified-accounts) - Cross-runtime accounts
- [Multicall Batching](/examples/multicall) - Optimize RPC calls
- [Event Listening](/examples/events) - Subscribe to events

## Quick Code Samples

### Connect and Read

```typescript
import { createEVMProvider, formatSEL } from '@selendrajs/sdk';

const provider = createEVMProvider('mainnet');
const balance = await provider.getBalance('0x...');
console.log(`Balance: ${formatSEL(balance)} SEL`);
```

### Transfer Tokens

```typescript
import { createEVMProvider, parseSEL } from '@selendrajs/sdk';

const provider = createEVMProvider('testnet');
const hash = await provider.transfer(
  process.env.PRIVATE_KEY!,
  '0x...recipient',
  parseSEL('10')
);
```

### Deploy Contract

```typescript
import { createEVMProvider } from '@selendrajs/sdk';
import contractJson from './MyContract.json';

const provider = createEVMProvider('testnet');
const address = await provider.deployContract(
  contractJson.abi,
  contractJson.bytecode,
  process.env.PRIVATE_KEY!,
  ['Constructor Arg']
);
```

### Read Contract

```typescript
const result = await provider.readContract(
  contractAddress,
  abi,
  'balanceOf',
  [userAddress]
);
```

### Write Contract

```typescript
const hash = await provider.writeContract(
  contractAddress,
  abi,
  privateKey,
  'transfer',
  [recipient, amount]
);
```

## Running Examples

Clone the repository and run examples:

```bash
git clone https://github.com/selendra/selendra-sdk
cd selendra-sdk/packages/core/examples

# Install dependencies
npm install

# Run an example
npx ts-node balance/01-substrate-balance.ts
```
