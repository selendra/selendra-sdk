# Selendra EVM Client

A comprehensive ethers.js v6 compatible EVM client for the Selendra network. This module provides full Ethereum JSON-RPC support, transaction management, contract interaction, and real-time event subscriptions.

## Features

- **🔗 Full Ethereum JSON-RPC Compatibility**: Complete support for all standard Ethereum JSON-RPC methods
- **📦 ethers.js v6 API Compatible**: Drop-in replacement for ethers.js with Selendra-specific optimizations
- **🚀 Multiple Provider Types**: HTTP, WebSocket, and IPC provider support
- **💼 Smart Contract Support**: Full contract deployment, interaction, and event handling
- **🔐 Wallet Management**: Private key, mnemonic, and hardware wallet support
- **⛽ Gas Optimization**: Intelligent gas estimation and EIP-1559 support
- **📡 Real-time Events**: WebSocket subscriptions for live blockchain events
- **🔄 Transaction Tracking**: Advanced transaction monitoring with confirmation tracking
- **🏗️ Type Safety**: Full TypeScript support with comprehensive type definitions
- **🌐 Selendra Optimized**: Pre-configured for Selendra mainnet and testnet

## Quick Start

### Installation

```bash
npm install @selendrajs/sdk
```

### Basic Usage

```typescript
import { createEvmClient, SelendraWallet, etherToWei } from '@selendrajs/sdk/evm';

// Create client
const client = createEvmClient({
  network: 'mainnet',
  debug: true
});

// Create wallet
const wallet = SelendraWallet.createRandom();
const connectedWallet = wallet.connect(client);

// Get balance
const balance = await client.getBalance(wallet.getAddress());
console.log('Balance:', balance, 'wei');

// Send transaction
const tx = await connectedWallet.sendTransaction({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  value: etherToWei('0.1')
});

console.log('Transaction hash:', tx.hash);
const receipt = await tx.wait();
console.log('Transaction confirmed in block:', receipt.blockNumber);
```

### Contract Interaction

```typescript
import { ERC20Contract } from '@selendrajs/sdk/evm';

// ERC20 Token contract
const token = new ERC20Contract('0x...token-address...', client, wallet);

// Read token info
const name = await token.name();
const symbol = await token.symbol();
const decimals = await token.decimals();
const balance = await token.balanceOf(wallet.getAddress());

// Transfer tokens
const tx = await token.transfer('0x...recipient...', etherToWei('100'));
await tx.wait();
```

### WebSocket Provider

```typescript
import { createWebSocketProvider } from '@selendrajs/sdk/evm';

const wsProvider = createWebSocketProvider({
  network: 'mainnet'
});

// Subscribe to new blocks
const blockSubscription = await wsProvider.subscribe('newHeads');
wsProvider.on(blockSubscription, (block) => {
  console.log('New block:', block.number);
});

// Subscribe to contract events
const tokenContract = wsProvider.getContract('0x...', erc20ABI);
const transferSubscription = await tokenContract.subscribe('Transfer');
transferSubscription.on('data', (event) => {
  console.log('Transfer:', event.args);
});
```

## API Reference

### Client Classes

#### SelendraEvmClient

Main EVM client class providing full JSON-RPC interface.

```typescript
const client = new SelendraEvmClient({
  network: 'mainnet',           // Network name or chain ID
  timeout: 30000,              // Request timeout
  maxRetries: 3,               // Retry attempts
  debug: false,                // Debug logging
  enableSubscriptions: true    // Enable WebSocket subscriptions
});
```

**Methods:**

- `getNetwork()`: Get network information
- `getBlockNumber()`: Get current block number
- `getBlock(blockHashOrNumber, includeTransactions?)`: Get block data
- `getTransaction(hash)`: Get transaction by hash
- `getTransactionReceipt(hash)`: Get transaction receipt
- `sendTransaction(signedTx)`: Send signed transaction
- `call(transaction, blockTag?)`: Make read-only call
- `estimateGas(transaction)`: Estimate gas for transaction
- `getBalance(address, blockTag?)`: Get account balance
- `getTransactionCount(address, blockTag?)`: Get transaction nonce
- `getLogs(filter)`: Get logs matching filter

#### WebSocketProvider

WebSocket provider for real-time updates.

```typescript
const wsProvider = new WebSocketProvider({
  network: 'mainnet',
  wsUrl: 'wss://rpc.selendra.org'  // Custom WebSocket URL
});
```

**Methods:**

- `subscribe(type, params?)`: Subscribe to events
- `unsubscribe(subscriptionId)`: Unsubscribe from events
- `on(event, listener)`: Add event listener

### Wallet Classes

#### SelendraWallet

Ethereum-compatible wallet implementation.

```typescript
// Create random wallet
const wallet = SelendraWallet.createRandom();

// From private key
const wallet = new SelendraWallet('0x...private-key...');

// Connect to provider
const connectedWallet = wallet.connect(client);
```

**Methods:**

- `getAddress()`: Get wallet address
- `getPrivateKey()`: Get private key (use carefully!)
- `signTransaction(tx)`: Sign transaction
- `signMessage(message)`: Sign message
- `signTypedData(domain, types, value)`: Sign EIP-712 typed data

### Contract Classes

#### Contract

Generic smart contract interface.

```typescript
const contract = client.getContract('0x...', abi);

// Read-only call
const result = await contract.call('methodName', [param1, param2]);

// Send transaction
const tx = await contract.send('methodName', [param1, param2], {
  value: etherToWei('0.1'),
  gasLimit: 100000
});
```

#### ERC20Contract

ERC20 token contract with built-in methods.

```typescript
const token = new ERC20Contract('0x...', client, wallet);

// Token info
const name = await token.name();
const symbol = await token.symbol();
const decimals = await token.decimals();
const totalSupply = await token.totalSupply();

// Balance and transfers
const balance = await token.balanceOf(address);
const allowance = await token.allowance(owner, spender);
const tx = await token.transfer(to, amount);
const approveTx = await token.approve(spender, amount);
```

#### ERC721Contract

ERC721 NFT contract with built-in methods.

```typescript
const nft = new ERC721Contract('0x...', client, wallet);

// NFT operations
const owner = await nft.ownerOf(tokenId);
const tokenURI = await nft.tokenURI(tokenId);
const balance = await nft.balanceOf(address);
const tx = await nft.transferFrom(from, to, tokenId);
```

### Transaction Management

#### TransactionBuilder

Build transactions with optimized gas settings.

```typescript
const tx = new TransactionBuilder(fromAddress)
  .to(toAddress)
  .value('0.1')                     // 0.1 ETH
  .gasLimit(21000)
  .eip1559('20', '2')              // 20 gwei max fee, 2 gwei priority
  .build();

// Pre-built builders
const transferTx = TransactionBuilder.transfer(from, to, '0.1');
const deployTx = TransactionBuilder.deploy(from, bytecode);
const contractTx = TransactionBuilder.contractInteraction(from, contractAddress, data);
```

#### TransactionManager

Advanced transaction tracking and management.

```typescript
const txManager = client.getTransactionManager();

// Send with tracking
const tracker = await txManager.sendTransaction(request, {
  confirmations: 3,
  timeout: 300000
});

// Wait for confirmation
const receipt = await tracker.waitForConfirmation();

// Monitor status
tracker.on('statusChanged', (status, receipt) => {
  console.log('Transaction status:', status);
});
```

### Event Management

#### EventManager

Subscribe to and query blockchain events.

```typescript
const eventManager = new EventManager(client);

// Query past events
const result = await eventManager.query({
  address: '0x...',
  topics: ['0x...event-signature...'],
  fromBlock: 'earliest',
  toBlock: 'latest'
});

// Subscribe to events
const subscription = await eventManager.subscribe({
  address: '0x...',
  topics: ['0x...transfer-signature...']
});

subscription.on('data', (event) => {
  console.log('Transfer event:', event);
});
```

## Configuration

### Network Configuration

Pre-configured networks:

- **mainnet**: Selendra Mainnet (Chain ID: 1961)
- **testnet**: Selendra Testnet (Chain ID: 1962)

```typescript
// Use predefined network
const client = createEvmClient({ network: 'mainnet' });

// Use custom chain ID
const client = createEvmClient({ network: 1961 });
```

### Custom Configuration

```typescript
const client = createEvmClient({
  network: 'mainnet',
  rpcUrls: {
    http: ['https://custom-rpc.selendra.org'],
    webSocket: ['wss://custom-ws.selendra.org']
  },
  timeout: 60000,
  maxRetries: 5,
  debug: true,
  gasConfig: {
    gasMultiplier: 1.5,
    maxGasLimit: 15000000,
    defaultGasPrice: '20000000000'  // 20 gwei
  },
  confirmations: 3,
  pollingInterval: 1000,
  enableSubscriptions: true
});
```

## Gas Optimization

The client automatically optimizes gas usage:

- **EIP-1559 Support**: Automatically uses EIP-1559 transactions when supported
- **Dynamic Gas Prices**: Real-time gas price estimation
- **Gas Multipliers**: Configurable safety margins for gas estimation
- **Batch Transactions**: Support for transaction batching

```typescript
// Get current gas prices
const gasPrice = await client.getGasPrice();
const maxFeePerGas = await client.getMaxFeePerGas();
const maxPriorityFeePerGas = await client.getMaxPriorityFeePerGas();

// Estimate gas with optimization
const gasEstimate = await client.getTransactionManager().estimateGas(tx);
console.log('Estimated gas:', gasEstimate.gasLimit);
console.log('Estimated cost:', gasEstimate.estimatedCost);
```

## Error Handling

The client provides comprehensive error handling:

```typescript
try {
  const tx = await client.sendTransaction(signedTx);
  const receipt = await tx.wait();
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('Insufficient funds for transaction');
  } else if (error.code === 'NETWORK_ERROR') {
    console.log('Network connection error');
  } else {
    console.log('Transaction failed:', error.message);
  }
}
```

## Examples

See [`examples/usage.ts`](./examples/usage.ts) for comprehensive examples covering:

- Basic client setup
- Wallet operations
- Transaction management
- Contract interaction
- Event subscriptions
- WebSocket provider usage
- Advanced configuration
- Batch operations

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  EvmTransaction,
  EvmTransactionRequest,
  EvmTransactionReceipt,
  EvmLog,
  EvmFilter,
  SelendraEvmConfig,
  EvmClientConfig
} from '@selendrajs/sdk/evm';
```

## Network Information

### Mainnet
- **Chain ID**: 1961
- **RPC URL**: https://rpc.selendra.org
- **WebSocket**: wss://rpc.selendra.org
- **Explorer**: https://explorer.selendra.org

### Testnet
- **Chain ID**: 1962
- **RPC URL**: https://testnet-rpc.selendra.org
- **WebSocket**: wss://testnet-rpc.selendra.org
- **Explorer**: https://testnet-explorer.selendra.org

## Contributing

This EVM client is part of the Selendra SDK. Please refer to the main SDK repository for contribution guidelines.

## License

Licensed under the MIT License. See LICENSE file for details.