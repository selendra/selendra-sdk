# Selendra SDK Developer Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Error Handling](#error-handling)
4. [Best Practices](#best-practices)
5. [Advanced Usage](#advanced-usage)
6. [Troubleshooting](#troubleshooting)

## Quick Start

### Installation

```bash
npm install @selendrajs/sdk
```

### Basic Setup

```typescript
import { SelendraSDK } from '@selendrajs/sdk';

// Initialize SDK
const sdk = new SelendraSDK({
  network: 'testnet', // or 'mainnet'
  logLevel: 'info' // Optional: 'error', 'warn', 'info', 'debug', 'trace'
});

// Initialize connections
await sdk.initialize();

// Connect wallet
await sdk.connectWallet('metamask');
```

### First Transaction

```typescript
// Get account balance
const balance = await sdk.evm.getFormattedBalance();
console.log(`Balance: ${balance} SEL`);

// Send a transfer
const txHash = await sdk.evm.transfer(
  '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe', // recipient
  '0.1' // amount in SEL
);

// Wait for confirmation
const receipt = await sdk.evm.waitForTransaction(txHash);
console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
```

## Core Concepts

### Network Configuration

The SDK supports multiple networks:

```typescript
// Built-in networks
const sdk = new SelendraSDK({ network: 'mainnet' });
const sdk = new SelendraSDK({ network: 'testnet' });

// Custom network
const sdk = new SelendraSDK({
  network: {
    name: 'Custom Network',
    chainId: 1234,
    rpcUrl: 'https://rpc.custom.network',
    wsUrl: 'wss://ws.custom.network',
    explorerUrl: 'https://explorer.custom.network',
    currency: {
      name: 'Custom Token',
      symbol: 'CTK',
      decimals: 18
    }
  }
});
```

### Dual VM Architecture

Selendra supports both EVM and Substrate VMs:

```typescript
// EVM operations (Ethereum-compatible)
const evmBalance = await sdk.evm.getBalance();
const tokenContract = sdk.evm.erc20('0x...');

// Substrate operations (Polkadot-compatible)
const substrateBalance = await sdk.substrate.getBalance('5GrwvaEF...');
const account = sdk.substrate.createAccountFromMnemonic('word1 word2...');
```

### Wallet Management

```typescript
// Connect specific wallet
await sdk.connectWallet('metamask');
await sdk.connectWallet('walletconnect');
await sdk.connectWallet('polkadotjs');

// Auto-connect to available wallet
const connection = await sdk.connectWallet();

// Check connection status
if (sdk.wallet.isConnected()) {
  const accounts = await sdk.wallet.getAccounts();
}
```

## Error Handling

The SDK provides comprehensive error handling with typed errors:

```typescript
import { SelendraSDKError, ErrorCode, errorUtils } from '@selendrajs/sdk';

try {
  await sdk.evm.transfer('invalid-address', '1');
} catch (error) {
  if (errorUtils.isSDKError(error)) {
    console.log('Error Code:', error.code);
    console.log('Detailed Message:', error.getDetailedMessage());
    console.log('Is Retryable:', error.isRetryable());
    
    // Handle specific error types
    switch (error.code) {
      case ErrorCode.INVALID_ADDRESS:
        console.log('Please enter a valid address');
        break;
      case ErrorCode.INSUFFICIENT_BALANCE:
        console.log('Not enough balance for this transaction');
        break;
      case ErrorCode.NETWORK_ERROR:
        console.log('Network issue, please try again');
        break;
    }
  }
}
```

### Retry Logic

```typescript
import { retryUtils } from '@selendrajs/sdk';

// Automatic retry for network operations
const balance = await retryUtils.network(
  () => sdk.evm.getBalance(),
  'get balance'
);

// Custom retry conditions
const result = await retryUtils.withCondition(
  () => riskyOperation(),
  (error) => error.message.includes('temporary'),
  5 // max attempts
);
```

## Best Practices

### 1. Always Validate Inputs

```typescript
import { validateAddress, validateAmount } from '@selendrajs/sdk';

function transfer(to: string, amount: string) {
  // Validate inputs before use
  const validAddress = validateAddress(to);
  const validAmount = validateAmount(amount);
  
  return sdk.evm.transfer(validAddress, validAmount);
}
```

### 2. Handle Gas Estimation

```typescript
// Estimate gas before sending transaction
const gasEstimate = await sdk.evm.estimateGas({
  to: recipient,
  value: sdk.utils.format.parseEther(amount)
});

// Add buffer for gas limit
const gasLimit = (BigInt(gasEstimate) * BigInt(120) / BigInt(100)).toString();

// Send with custom gas settings
const txHash = await sdk.evm.sendTransaction({
  to: recipient,
  value: sdk.utils.format.parseEther(amount)
}, {
  gasLimit,
  gasPrice: await sdk.evm.getGasPrice()
});
```

### 3. Use Proper Logging

```typescript
import { createLogger, LogLevel } from '@selendrajs/sdk';

const logger = createLogger('MyApp');

// Configure log level for development
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
}

logger.info('Starting transaction', { to: recipient, amount });
```

### 4. Clean Up Resources

```typescript
// Always disconnect when done
try {
  // Your application logic
} finally {
  await sdk.disconnect();
}

// Unsubscribe from events
const subscription = await sdk.subscribe();
const blockSub = await subscription.blocks((block) => {
  console.log('New block:', block.number);
});

// Clean up
await blockSub.unsubscribe();
```

## Advanced Usage

### Contract Interactions

```typescript
// ERC-20 Token Operations
const token = sdk.evm.erc20('0x...');

// Get token info
const info = await sdk.evm.getTokenInfo('0x...');
console.log(`${info.name} (${info.symbol})`);

// Check balance and allowance
const balance = await token.balanceOf(userAddress);
const allowance = await token.allowance(userAddress, spenderAddress);

// Transfer tokens
const txHash = await token.transfer(recipient, amount);

// Approve spending
const approveTx = await token.approve(spender, amount);
```

### Custom Contract Integration

```typescript
const contractABI = [
  'function myMethod(uint256 param) view returns (uint256)',
  'function myWriteMethod(address addr) returns (bool)',
  'event MyEvent(address indexed user, uint256 value)'
];

const contract = sdk.evm.contract('0x...', contractABI);

// Read data
const result = await contract.read('myMethod', [123]);

// Write data
const txHash = await contract.write('myWriteMethod', [userAddress]);

// Listen to events
contract.on('MyEvent', (user, value, event) => {
  console.log(`User ${user} triggered event with value ${value}`);
});
```

### Batch Operations

```typescript
// Batch multiple operations for gas efficiency
const operations = [
  { target: tokenAddress, data: token.encodeFunctionData('transfer', [recipient1, amount1]) },
  { target: tokenAddress, data: token.encodeFunctionData('transfer', [recipient2, amount2]) },
  { target: tokenAddress, data: token.encodeFunctionData('approve', [spender, amount3]) }
];

// Execute batch (requires multicall contract)
const batchTx = await multicall.write('aggregate', [operations]);
```

### Real-time Monitoring

```typescript
// Subscribe to blockchain events
const subscribe = await sdk.subscribe();

// Monitor new blocks
const blockSub = await subscribe.blocks((block) => {
  console.log(`New block #${block.number} with ${block.transactions.length} transactions`);
});

// Monitor specific address transactions
const addressSub = await subscribe.addressTransactions(
  [myAddress],
  (tx) => {
    console.log(`Transaction involving ${myAddress}: ${tx.hash}`);
  }
);

// Monitor contract events
const eventSub = await subscribe.contractEvents(
  contractAddress,
  ['Transfer', 'Approval'],
  (event) => {
    console.log(`Contract event: ${event.event}`);
  }
);
```

## Troubleshooting

### Common Issues

#### 1. "Wallet not connected" Error

```typescript
// Check connection before operations
if (!sdk.wallet.isConnected()) {
  await sdk.connectWallet();
}
```

#### 2. Gas Estimation Failures

```typescript
try {
  const gasEstimate = await sdk.evm.estimateGas(transaction);
} catch (error) {
  // Use fallback gas limit
  const gasLimit = '500000'; // Fallback
}
```

#### 3. Network Connection Issues

```typescript
// Check network status
const status = await sdk.getNetworkStatus();
if (!status.isHealthy) {
  console.log('Network issues detected');
}

// Use retry logic for network operations
const result = await retryUtils.network(() => {
  return sdk.evm.getBalance();
});
```

#### 4. Transaction Stuck/Pending

```typescript
// Set appropriate gas price
const gasPrices = await sdk.evm.getGasPrices();
const tx = await sdk.evm.sendTransaction(transaction, {
  gasPrice: gasPrices.fast // Use fast gas price
});

// Wait with timeout
try {
  const receipt = await asyncUtils.timeout(
    sdk.evm.waitForTransaction(tx),
    300000, // 5 minutes
    'Transaction timeout'
  );
} catch (error) {
  console.log('Transaction may be stuck, check explorer');
}
```

### Debug Mode

```typescript
// Enable debug logging
import { logger, LogLevel } from '@selendrajs/sdk';

logger.setLevel(LogLevel.DEBUG);

// Or configure during SDK initialization
const sdk = new SelendraSDK({
  network: 'testnet',
  logLevel: 'debug'
});
```

### Getting Help

1. **Check the logs**: Enable debug logging to see detailed error information
2. **Validate inputs**: Use the built-in validation functions
3. **Check network status**: Ensure the network is healthy
4. **Review examples**: Check the examples directory for similar use cases
5. **Report issues**: File issues on GitHub with detailed error information

### Performance Optimization

1. **Use batch operations** when possible to reduce gas costs
2. **Cache frequently accessed data** like token information
3. **Use appropriate retry strategies** for different operation types
4. **Clean up subscriptions** to prevent memory leaks
5. **Use appropriate log levels** in production