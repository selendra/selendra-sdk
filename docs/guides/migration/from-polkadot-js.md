# Migration Guide: From Polkadot.js to Selendra SDK

This guide helps developers familiar with Polkadot.js transition to the Selendra SDK while preserving their Substrate knowledge and leveraging additional EVM capabilities.

##  Quick Reference

| Polkadot.js Concept | Selendra SDK Equivalent |
|---------------------|------------------------|
| `ApiPromise.create()` | `new SelendraSDK()` |
| `api.query.system.account()` | `sdk.query('System', 'Account')` |
| `api.tx.balances.transfer()` | `sdk.tx('Balances', 'transfer')` |
| `keyring.addFromMnemonic()` | `sdk.createAccount()` |
| `formatBalance()` | `sdk.formatBalance()` |

## 🏗 Core Concepts Comparison

### API Connection

#### Polkadot.js
```javascript
import { ApiPromise, WsProvider } from '@polkadot/api';

const wsProvider = new WsProvider('wss://rpc.selendra.org');
const api = await ApiPromise.create({ provider: wsProvider });
```

#### Selendra SDK
```typescript
import { SelendraSDK } from '@selendrajs/sdk';

const sdk = new SelendraSDK({
  network: 'mainnet',
  wsEndpoint: 'wss://rpc.selendra.org',
  autoConnect: true
});

await sdk.connect();
```

### Account Management

#### Polkadot.js
```javascript
import { Keyring } from '@polkadot/keyring';

const keyring = new Keyring({ type: 'sr25519' });
const pair = keyring.addFromMnemonic('phrase words go here');
const address = pair.address;
```

#### Selendra SDK
```typescript
// Create account (both Substrate and EVM)
const account = await sdk.createAccount({
  type: 'both',
  name: 'My Wallet'
});

// Import from mnemonic
const account = await sdk.importAccountFromMnemonic('phrase words go here', {
  type: 'substrate'
});

console.log(account.address);
```

## 🔧 Transaction Operations

### Sending Transactions

#### Polkadot.js
```javascript
const tx = api.tx.balances.transfer(
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  1000000000000
);

const hash = await tx.signAndSend(pair);
console.log('Transaction hash:', hash.toHex());
```

#### Selendra SDK
```typescript
const tx = await sdk.transfer({
  to: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  amount: BigInt('1000000000000')
});

console.log('Transaction hash:', tx.hash);
console.log('Status:', tx.status);
```

### Custom Extrinsics

#### Polkadot.js
```javascript
const tx = api.tx.democracy.propose(
  proposalHash,
  1000000000000
);

const hash = await tx.signAndSend(pair, { tip: 1000000000 });
```

#### Selendra SDK
```typescript
const tx = await sdk.tx('Democracy', 'Propose')
  .proposal(proposalHash)
  .value(BigInt('1000000000000'))
  .tip(BigInt('1000000000'))
  .signAndSend('mnemonic-or-private-key');
```

## 📜 Storage Queries

### Reading Storage

#### Polkadot.js
```javascript
const accountInfo = await api.query.system.account(
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
);

const balance = accountInfo.data.free.toNumber();
```

#### Selendra SDK
```typescript
const accountInfo = await sdk.query(
  'System',
  'Account',
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
);

const balance = accountInfo.free;
```

### Complex Queries

#### Polkadot.js
```javascript
// Map queries
const allValidators = await api.query.staking.validators.entries();

// Multi queries
const balances = await api.query.system.account.multi([
  address1,
  address2,
  address3
]);
```

#### Selendra SDK
```typescript
// Map queries
const allValidators = await sdk.queryMap('Staking', 'Validators');

// Multi queries
const balances = await Promise.all([
  sdk.query('System', 'Account', address1),
  sdk.query('System', 'Account', address2),
  sdk.query('System', 'Account', address3)
]);
```

## 🎨 Events and Subscriptions

### Event Subscription

#### Polkadot.js
```javascript
api.query.system.events((events) => {
  events.forEach((record) => {
    const { event, phase } = record;
    console.log(`${event.section}.${event.method}:`, event.data);
  });
});
```

#### Selendra SDK
```typescript
import { useEventListener } from '@selendrajs/sdk/react';

const { events } = useEventListener({
  eventType: 'system'
});

// Or programmatic
const unsubscribe = await sdk.subscribeToEvents((event) => {
  console.log(`${event.pallet}.${event.method}:`, event.data);
});
```

### Block Subscription

#### Polkadot.js
```javascript
const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
  console.log('New block:', header.number.toHuman());
});
```

#### Selendra SDK
```typescript
const unsubscribe = await sdk.subscribeToHeads((header) => {
  console.log('New block:', header.number);
});
```

## 🔄 Utility Functions

### Balance Formatting

#### Polkadot.js
```javascript
import { formatBalance } from '@polkadot/util';

formatBalance(1234567890000, { decimals: 12, withSi: false });
// Returns: '1.234567890000'
```

#### Selendra SDK
```typescript
sdk.formatBalance(BigInt('1234567890000'), 12);
// Returns: '1.234567890000'

// With automatic symbol detection
const balance = await sdk.getBalance(address);
sdk.formatBalance(balance.free, balance.decimals);
```

### Address Validation

#### Polkadot.js
```javascript
import { isAddress } from '@polkadot/util';

const isValid = isAddress('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
```

#### Selendra SDK
```typescript
const addressType = sdk.validateAddress('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
// Returns: 'substrate' | 'evm' | 'invalid'

const isValid = addressType !== 'invalid';
```

##  Advanced Patterns

### Batch Transactions

#### Polkadot.js
```javascript
import { api } from '@polkadot/api';

const txs = [
  api.tx.balances.transfer(address1, amount1),
  api.tx.balances.transfer(address2, amount2),
  api.tx.staking.bond(validator, amount, 'Staked')
];

const batchTx = api.tx.utility.batch(txs);
const hash = await batchTx.signAndSend(pair);
```

#### Selendra SDK
```typescript
const batch = sdk.createBatch();
batch.addTransfer(address1, amount1);
batch.addTransfer(address2, amount2);
batch.addStakingBond(validator, amount);

const tx = await batch.execute();
console.log('Batch transaction hash:', tx.hash);
```

### Runtime Upgrades

#### Polkadot.js
```javascript
const proposal = api.tx.system.setCode(newCode);
const hash = await proposal.signAndSend(pair);
```

#### Selendra SDK
```typescript
const tx = await sdk.tx('System', 'SetCode')
  .runtimeUpgrade(newCode)
  .signAndSend('mnemonic');
```

### Proxy Operations

#### Polkadot.js
```javascript
const real = keyring.addFromUri('//Alice');
const proxy = keyring.addFromUri('//Bob//stash');

const tx = api.tx.proxy.proxy(real.address, null, api.tx.balances.transfer(target, amount));
const hash = await tx.signAndSend(proxy);
```

#### Selendra SDK
```typescript
const tx = await sdk.tx('Proxy', 'Proxy')
  .real(realAddress)
  .callIndex(null)
  .transfer(targetAddress, amount)
  .signAndSend(proxyMnemonic);
```

##  React Integration

### Polkadot.js with React

```javascript
import { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

function useApi() {
  const [api, setApi] = useState(null);

  useEffect(() => {
    const init = async () => {
      const provider = new WsProvider('wss://rpc.selendra.org');
      const api = await ApiPromise.create({ provider });
      setApi(api);
    };

    init();
  }, []);

  return api;
}
```

### Selendra SDK with React

```typescript
import { useSelendra } from '@selendrajs/sdk/react';

function MyComponent() {
  const sdk = useSelendra();

  const handleTransfer = async () => {
    const tx = await sdk.transfer({
      to: recipient,
      amount: BigInt('1000000000000')
    });

    console.log('Transaction sent:', tx.hash);
  };

  return <button onClick={handleTransfer}>Send</button>;
}
```

## 🔄 Migration Checklist

###  Direct Replacements

- [ ] Replace `ApiPromise.create()` with `new SelendraSDK()`
- [ ] Replace `api.query.*` with `sdk.query()`
- [ ] Replace `api.tx.*` with `sdk.tx()`
- [ ] Replace `formatBalance()` with `sdk.formatBalance()`
- [ ] Replace manual keyring with SDK account management

### 🔧 Adaptation Required

- [ ] Update transaction patterns to use SDK transaction format
- [ ] Adapt subscription patterns to use SDK hooks
- [ ] Update error handling for SDK-specific errors
- [ ] Replace manual storage type encoding/decoding
- [ ] Update balance queries to use useBalance hook

### 🆕 New Opportunities

- [ ] Explore EVM compatibility features
- [ ] Leverage unified account management
- [ ] Use built-in React hooks for common operations
- [ ] Implement cross-chain functionality
- [ ] Utilize built-in caching and state management

##  Code Migration Example

### Before (Polkadot.js)

```javascript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { formatBalance } from '@polkadot/util';
import { useState, useEffect } from 'react';

function BalancesTransfer() {
  const [api, setApi] = useState(null);
  const [pair, setPair] = useState(null);
  const [balance, setBalance] = useState('0');
  const [destAddress, setDestAddress] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const init = async () => {
      const provider = new WsProvider('wss://rpc.selendra.org');
      const api = await ApiPromise.create({ provider });
      const keyring = new Keyring({ type: 'sr25519' });
      const pair = keyring.addFromMnemonic('//Alice');

      setApi(api);
      setPair(pair);

      // Get initial balance
      const accountInfo = await api.query.system.account(pair.address);
      setBalance(formatBalance(accountInfo.data.free));
    };

    init();
  }, []);

  const handleTransfer = async () => {
    const tx = api.tx.balances.transfer(destAddress, parseInt(amount) * 1000000000000);
    const hash = await tx.signAndSend(pair);
    console.log('Transaction hash:', hash.toHex());

    // Update balance
    const accountInfo = await api.query.system.account(pair.address);
    setBalance(formatBalance(accountInfo.data.free));
  };

  return (
    <div>
      <p>Balance: {balance}</p>
      <input
        placeholder="Destination address"
        value={destAddress}
        onChange={(e) => setDestAddress(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer}>Transfer</button>
    </div>
  );
}
```

### After (Selendra SDK)

```typescript
import { useAccount, useBalance, useTransaction } from '@selendrajs/sdk/react';
import { useState } from 'react';

function BalancesTransfer() {
  const { account } = useAccount();
  const { balance, refetch } = useBalance();
  const { send, isLoading } = useTransaction();
  const [destAddress, setDestAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleTransfer = async () => {
    await send({
      to: destAddress,
      amount: BigInt(amount) * BigInt('1000000000000')
    });

    // Balance automatically updates via hook
    await refetch();
  };

  return (
    <div>
      <p>Balance: {balance?.free} {balance?.tokenSymbol}</p>
      <input
        placeholder="Destination address"
        value={destAddress}
        onChange={(e) => setDestAddress(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Transfer'}
      </button>
    </div>
  );
}
```

## 🎓 Enhanced Features

### EVM Compatibility

Selendra SDK provides seamless EVM integration:

```typescript
// Access EVM features
const evmBalance = await sdk.getEvmBalance(evmAddress);
const evmTxCount = await sdk.getEvmTransactionCount(evmAddress);

// Deploy EVM contracts
const deployed = await sdk.deployContract({
  bytecode: evmBytecode,
  abi: evmAbi,
  type: 'evm'
});

// Send EVM transactions
const tx = await sdk.sendEvmTransaction({
  from: account.evmAddress,
  to: contractAddress,
  data: encodedData,
  value: BigInt('1000000000000')
});
```

### Unified Account Management

```typescript
// Create unified account (Substrate + EVM)
const account = await sdk.createAccount({
  type: 'both'
});

// Access both addresses
console.log('Substrate address:', account.substrateAddress);
console.log('EVM address:', account.evmAddress);

// Transfer between account types
await sdk.transferSubstrateToEvm(amount);
await sdk.transferEvmToSubstrate(amount);
```

### Advanced React Hooks

```typescript
// Transaction history
const { transactions, addTransaction } = useTransactionHistory();

// Contract interaction
const { contract, call, send } = useContract({
  address: contractAddress,
  abi: contractAbi
});

// Staking information
const { validators, nominations, rewards } = useStaking();
```

##  Development Tools

### Type Safety

The Selendra SDK provides  TypeScript support:

```typescript
// Fully typed transactions
const tx = await sdk.transfer({
  to: string,
  amount: bigint,
  memo?: string
});

// Typed contract interactions
const result: bigint = await contract.call('balanceOf', [string]);

// Type-safe storage queries
const accountInfo = await sdk.query<SystemAccountInfo>('System', 'Account', address);
```

### Error Handling

```typescript
try {
  const tx = await sdk.transfer({ to, amount });
  console.log('Success:', tx.hash);
} catch (error) {
  if (error instanceof SelendraError) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        console.error('Not enough balance');
        break;
      case 'INVALID_ADDRESS':
        console.error('Invalid address format');
        break;
      case 'NETWORK_ERROR':
        console.error('Connection failed');
        break;
    }
  }
}
```

## 🎓 Learning Resources

### Documentation
- [Selendra SDK Getting Started](../getting-started.md)
- [API Reference](../../api/typescript.md)
- [React Components](../../api/react.md)
- [Examples](../../examples/)

### Community
- [Discord Server](https://discord.gg/selendra)
- [GitHub Discussions](https://github.com/selendra/selendra-sdk/discussions)
- [Developer Forum](https://forum.selendra.org)

### Tools
- [Online Playground](https://playground.selendra.org)
- [Testnet Faucet](https://faucet.selendra.org)
- [Block Explorer](https://explorer.selendra.org)

---

**Need help?** Join our [Discord community](https://discord.gg/selendra) and ask questions in the #developers channel.