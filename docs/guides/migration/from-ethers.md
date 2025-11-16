# Migration Guide: From Ethers.js to Selendra SDK

This guide helps developers familiar with Ethers.js transition to the Selendra SDK while leveraging their existing knowledge.

## 🎯 Quick Reference

| Ethers.js Concept | Selendra SDK Equivalent |
|-------------------|------------------------|
| `new ethers.providers.WebSocketProvider()` | `new SelendraSDK()` |
| `provider.getBalance(address)` | `sdk.getBalance(address)` |
| `contract.callStatic.method()` | `contract.call(method)` |
| `contract.method(...args)` | `contract.send(method, options, ...args)` |
| `wallet.sendTransaction(tx)` | `sdk.sendTransaction(options)` |

## 🏗 Core Concepts Comparison

### Provider and Connection

#### Ethers.js
```javascript
import { ethers } from 'ethers';

const provider = new ethers.providers.WebSocketProvider('wss://mainnet.infura.io');
const signer = provider.getSigner();
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

#### Ethers.js
```javascript
// Create wallet from mnemonic
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
console.log(wallet.address);

// Create wallet from private key
const wallet = new ethers.Wallet(privateKey);
```

#### Selendra SDK
```typescript
// Create account (both Substrate and EVM)
const account = await sdk.createAccount({
  type: 'both', // 'substrate', 'evm', or 'both'
  name: 'My Wallet'
});

// Import from mnemonic
const account = await sdk.importAccountFromMnemonic(mnemonic, {
  type: 'both',
  derivationPath: "//m/44'/60'/0'/0/0" // EVM derivation
});

console.log(account.address);
```

## 🔧 Transaction Operations

### Sending Transactions

#### Ethers.js
```javascript
const tx = await signer.sendTransaction({
  to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  value: ethers.utils.parseEther('1.0')
});

console.log('Transaction hash:', tx.hash);
await tx.wait(); // Wait for confirmation
```

#### Selendra SDK
```typescript
const tx = await sdk.transfer({
  to: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  amount: BigInt('1000000000000'), // 1 SEL with 12 decimals
  memo: 'Payment'
});

console.log('Transaction hash:', tx.hash);
console.log('Status:', tx.status); // 'pending', 'included', 'finalized'
```

### Custom Transactions

#### Ethers.js
```javascript
const contract = new ethers.Contract(address, abi, signer);
const tx = await contract.transfer(recipient, amount);
```

#### Selendra SDK
```typescript
const contract = new Contract(address, abi, sdk);
const tx = await contract.send('transfer', {
  from: account.address
}, recipient, BigInt(amount));
```

## 📜 Smart Contract Interaction

### Contract Creation

#### Ethers.js
```javascript
const contract = new ethers.Contract(
  contractAddress,
  abi,
  signer
);
```

#### Selendra SDK
```typescript
const contract = new Contract(
  contractAddress,
  abi,
  sdk
);
```

### Reading from Contracts

#### Ethers.js
```javascript
const balance = await contract.balanceOf(address);
console.log(ethers.utils.formatUnits(balance, 18));
```

#### Selendra SDK
```typescript
const balance = await contract.call('balanceOf', address);
console.log(sdk.formatBalance(balance, 18));
```

### Writing to Contracts

#### Ethers.js
```javascript
const tx = await contract.transfer(recipient, ethers.utils.parseEther('1.0'));
const receipt = await tx.wait();
```

#### Selendra SDK
```typescript
const tx = await contract.send('transfer', {
  gasLimit: BigInt('100000')
}, recipient, BigInt('1000000000000000000'));

console.log('Transaction status:', tx.status);
```

## 🎨 Event Handling

### Event Listening

#### Ethers.js
```javascript
contract.on('Transfer', (from, to, amount, event) => {
  console.log(`Transfer of ${ethers.utils.formatUnits(amount)} from ${from} to ${to}`);
});

// Listen once
contract.once('Transfer', (from, to, amount) => {
  console.log('Transfer detected!');
});
```

#### Selendra SDK
```typescript
import { useEventListener } from '@selendrajs/sdk/react';

const { events } = useEventListener({
  contract,
  eventName: 'Transfer',
  fromBlock: 'latest'
});

// Programmatic listening
const unsubscribe = await contract.on('Transfer', (from, to, amount) => {
  console.log(`Transfer of ${amount.toString()} from ${from} to ${to}`);
});

// Later: unsubscribe();
```

### Querying Past Events

#### Ethers.js
```javascript
const filter = contract.filters.Transfer(from, to);
const events = await contract.queryFilter(filter, fromBlock, toBlock);
```

#### Selendra SDK
```typescript
const events = await contract.getEvents('Transfer', {
  fromBlock: 12345,
  toBlock: 'latest',
  filters: { from: '0x...', to: '0x...' }
});
```

## 🔄 Utility Functions

### Unit Conversion

#### Ethers.js
```javascript
// Ether to wei
const weiAmount = ethers.utils.parseEther('1.5');

// Wei to ether
const ethAmount = ethers.utils.formatEther(weiAmount);

// Format units
const formatted = ethers.utils.formatUnits(amount, decimals);
```

#### Selendra SDK
```typescript
// String to bigint
const amount = sdk.parseBalance('1.5', 12); // for SEL tokens

// Bigint to formatted string
const formatted = sdk.formatBalance(amount, 12);

// Custom formatting
const formatted = sdk.formatBalance(BigInt('1500000000000'), 12);
// Returns: "1.500000000000"
```

### Address Validation

#### Ethers.js
```javascript
const isValid = ethers.utils.isAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
```

#### Selendra SDK
```typescript
const addressType = sdk.validateAddress('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
// Returns: 'substrate' | 'evm' | 'invalid'

const isValid = addressType !== 'invalid';
```

## 🚀 Advanced Patterns

### Gas Estimation

#### Ethers.js
```javascript
const gasEstimate = await contract.estimateGas.transfer(recipient, amount);
const gasPrice = await provider.getGasPrice();

const tx = await contract.transfer(recipient, amount, {
  gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
  gasPrice
});
```

#### Selendra SDK
```typescript
const gasEstimate = await sdk.estimateGas({
  to: contractAddress,
  data: contract.encodeFunctionData('transfer', [recipient, amount])
});

const feeEstimate = await sdk.getFeeEstimate();

const tx = await contract.send('transfer', {
  gasLimit: gasEstimate * BigInt(120) / BigInt(100), // 20% buffer
  maxFeePerGas: feeEstimate.fast.maxFeePerGas
}, recipient, amount);
```

### Batch Transactions

#### Ethers.js
```javascript
// Using Multicall contract
const multicall = new ethers.Contract(multicallAddress, multicallAbi, signer);

const calls = [
  [contract1Address, contract1.interface.encodeFunctionData('balanceOf', [address1])],
  [contract2Address, contract2.interface.encodeFunctionData('balanceOf', [address2])]
];

const [, results] = await multicall.aggregate(calls);
```

#### Selendra SDK
```typescript
// Built-in batch support
const results = await Promise.all([
  contract1.call('balanceOf', address1),
  contract2.call('balanceOf', address2)
]);

// Or use batch utility
const batch = sdk.createBatch();
batch.add(contract1.call('balanceOf', address1));
batch.add(contract2.call('balanceOf', address2));
const results = await batch.execute();
```

### Contract Deployment

#### Ethers.js
```javascript
const factory = new ethers.ContractFactory(abi, bytecode, signer);
const contract = await factory.deploy(constructorArg1, constructorArg2);
await contract.deployed();
```

#### Selendra SDK
```typescript
const deployed = await sdk.deployContract({
  bytecode,
  abi,
  constructorArgs: [constructorArg1, constructorArg2],
  from: account.address,
  gasLimit: BigInt('2000000')
});

console.log('Contract deployed at:', deployed.address);
```

## 🎯 React Integration

### Ethers.js with React

```javascript
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

function useBalance(address) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const getBalance = async () => {
      const bal = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(bal));
    };

    getBalance();
  }, [address]);

  return balance;
}
```

### Selendra SDK with React

```typescript
import { useBalance } from '@selendrajs/sdk/react';

function BalanceDisplay({ address }) {
  const { balance, loading, error } = useBalance({ address });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      Balance: {balance?.free} {balance?.tokenSymbol}
    </div>
  );
}
```

## 🔄 Migration Checklist

### ✅ Easy Replacements

- [ ] Replace `ethers.providers` with `SelendraSDK`
- [ ] Replace `ethers.Contract` with `Contract` from SDK
- [ ] Replace `ethers.utils.parseEther()` with `sdk.parseBalance()`
- [ ] Replace `ethers.utils.formatEther()` with `sdk.formatBalance()`
- [ ] Replace manual event listeners with `useEventListener` hook

### 🔧 Adaptation Required

- [ ] Update transaction handling to use Selendra transaction format
- [ ] Adapt contract interaction patterns
- [ ] Update gas estimation logic
- [ ] Replace Web3 provider connections with SDK connections
- [ ] Update error handling for Selendra-specific errors

### 🆕 New Opportunities

- [ ] Explore unified Substrate + EVM account management
- [ ] Leverage built-in caching and state management
- [ ] Use React hooks for common blockchain operations
- [ ] Implement cross-chain functionality
- [ ] Utilize built-in transaction history tracking

## 🛠 Code Migration Example

### Before (Ethers.js)

```javascript
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

function TokenTransfer() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const init = async () => {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        TOKEN_ABI,
        web3Signer
      );

      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(tokenContract);

      const bal = await tokenContract.balanceOf(await web3Signer.getAddress());
      setBalance(ethers.utils.formatUnits(bal, 18));
    };

    init();
  }, []);

  const handleTransfer = async (to, amount) => {
    const tx = await contract.transfer(to, ethers.utils.parseUnits(amount, 18));
    await tx.wait();

    // Update balance
    const bal = await contract.balanceOf(await signer.getAddress());
    setBalance(ethers.utils.formatUnits(bal, 18));
  };

  return (
    <div>
      <p>Balance: {balance}</p>
      <TransferForm onTransfer={handleTransfer} />
    </div>
  );
}
```

### After (Selendra SDK)

```typescript
import { useAccount, useBalance, useContract } from '@selendrajs/sdk/react';
import { useState } from 'react';

function TokenTransfer() {
  const { account } = useAccount();
  const { balance, refetch: refetchBalance } = useBalance();
  const { contract, send } = useContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI
  });

  const handleTransfer = async (to: string, amount: string) => {
    await send('transfer', {
      from: account?.address
    }, to, BigInt(amount));

    // Balance automatically updates via hook
    await refetchBalance();
  };

  return (
    <div>
      <p>Balance: {balance?.free} {balance?.tokenSymbol}</p>
      <TransferForm onTransfer={handleTransfer} />
    </div>
  );
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