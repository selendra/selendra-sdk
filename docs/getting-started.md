# Getting Started with Selendra SDK

The Selendra SDK is a comprehensive TypeScript library for interacting with Selendra Network, supporting both EVM and WebAssembly (Substrate) interactions.

## Installation

```bash
npm install @selendra/sdk
```

## Quick Start

### Basic Setup

```typescript
import { SelendraSDK } from '@selendra/sdk';

// Initialize SDK
const sdk = new SelendraSDK({
  network: 'testnet' // or 'mainnet'
});

// Initialize connections
await sdk.initialize();
```

### Connect Wallet

```typescript
// Connect MetaMask
const connection = await sdk.connectWallet('metamask');
console.log('Connected:', connection.address);

// Or auto-connect to available wallet
const autoConnection = await sdk.connectWallet();
```

### Basic Operations

```typescript
// Get account balance
const balance = await sdk.evm.getFormattedBalance();
console.log('Balance:', balance, 'SEL');

// Send transaction
const txHash = await sdk.evm.transfer(
  '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe', 
  '1.0' // 1 SEL
);

// Wait for confirmation
const receipt = await sdk.evm.waitForTransaction(txHash);
console.log('Confirmed in block:', receipt.blockNumber);
```

## Network Configuration

### Mainnet
```typescript
const sdk = new SelendraSDK({
  network: 'mainnet'
});
```

### Testnet
```typescript
const sdk = new SelendraSDK({
  network: 'testnet'
});
```

### Custom Network
```typescript
const sdk = new SelendraSDK({
  network: {
    name: 'Custom Selendra',
    chainId: 12345,
    rpcUrl: 'https://custom-rpc.example.com',
    wsUrl: 'wss://custom-ws.example.com',
    explorerUrl: 'https://custom-explorer.example.com',
    currency: {
      name: 'Custom SEL',
      symbol: 'CSEL',
      decimals: 18
    }
  }
});
```

## Core Modules

### EVM Module
Interact with Ethereum-compatible smart contracts:

```typescript
// Get gas prices
const gasPrices = await sdk.evm.getGasPrices();

// Interact with ERC-20 tokens
const token = sdk.evm.erc20('0x...');
await token.transfer('0x...', '100');
```

### Substrate Module
Interact with Polkadot/Substrate runtime:

```typescript
// Connect to Substrate
await sdk.substrate.connect();

// Get chain information
const chainInfo = await sdk.substrate.getChainInfo();

// Subscribe to new blocks
const unsubscribe = await sdk.substrate.subscribeToBlocks((blockNumber) => {
  console.log('New block:', blockNumber);
});
```

### Wallet Module
Manage wallet connections:

```typescript
// Get available providers
const providers = sdk.wallet.getAvailableProviders();

// Connect to specific wallet
await sdk.wallet.connect('metamask');

// Sign message
const signature = await sdk.wallet.signMessage('Hello Selendra');
```

## Real-time Events

Subscribe to blockchain events using WebSocket:

```typescript
const subscribe = await sdk.subscribe();

// New blocks
await subscribe.blocks((block) => {
  console.log('New block:', block.number);
});

// Pending transactions
await subscribe.transactions((tx) => {
  console.log('Pending tx:', tx.hash);
});

// Address-specific transactions
await subscribe.addressTransactions(['0x...'], (tx) => {
  console.log('Address transaction:', tx);
});
```

## Error Handling

```typescript
try {
  await sdk.initialize();
  const balance = await sdk.evm.getBalance();
} catch (error) {
  console.error('SDK Error:', error.message);
} finally {
  await sdk.disconnect();
}
```

## Best Practices

1. **Always initialize**: Call `sdk.initialize()` before using the SDK
2. **Handle errors**: Wrap SDK calls in try-catch blocks
3. **Disconnect properly**: Call `sdk.disconnect()` when done
4. **Use formatted methods**: Use `getFormattedBalance()` for display purposes
5. **Check connections**: Verify wallet connection before transactions

## Next Steps

- [EVM Development Guide](./evm.md)
- [Substrate Development Guide](./substrate.md)
- [API Reference](./api.md)
- [Examples](../examples/)

## Support

- [Documentation](https://docs.selendra.org)
- [Discord](https://discord.gg/selendra)
- [GitHub Issues](https://github.com/selendra/selendra-sdk/issues)