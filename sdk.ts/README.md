# Selendra SDK - Core (TypeScript)

A modular, extensible TypeScript SDK for connecting to the Selendra blockchain.

## ✨ Features

- 🏗️ **Modular Architecture** - Easy to extend and maintain
- 🔌 **Dual Chain Support** - Substrate and EVM chains
- 📦 **Tree-Shakeable** - Import only what you need
- 🎯 **Type-Safe** - Full TypeScript with strict mode
- 🔄 **Event-Driven** - React to connection changes
- 🔁 **Auto-Reconnect** - Built-in reconnection logic
- 📖 **Well-Documented** - Comprehensive JSDoc comments

## 📁 Project Structure

```
sdk.ts/
├── src/                        # Source code (modular)
│   ├── index.ts               # Main entry point
│   ├── core/                  # Core SDK functionality
│   ├── providers/             # Chain providers
│   ├── types/                 # Type definitions
│   └── utils/                 # Utilities
├── examples-modular.ts        # Usage examples
├── ARCHITECTURE.md            # Architecture guide
└── package.json
```

## Installation

```bash
npm install @selendrajs/sdk-core
# or
yarn add @selendrajs/sdk-core
# or
pnpm add @selendrajs/sdk-core
```

## Quick Start

### Connect to Substrate Chain

```typescript
import { SelendraSDK, ChainType, Network } from '@selendrajs/sdk-core';

const sdk = new SelendraSDK({
  endpoint: 'wss://rpc.selendra.org',
  chainType: ChainType.Substrate,
  network: Network.Selendra
});

// Listen to events
sdk.on('connecting', () => console.log('Connecting...'));
sdk.on('connected', () => console.log('Connected!'));
sdk.on('disconnected', () => console.log('Disconnected'));
sdk.on('error', (error) => console.error('Error:', error));

// Connect
await sdk.connect();

// Get connection info
const info = sdk.getConnectionInfo();
console.log('Connected to:', info.network);

// Disconnect when done
await sdk.disconnect();
```

### Connect to EVM Chain

```typescript
import { SelendraSDK, ChainType } from '@selendrajs/sdk-core';

const sdk = new SelendraSDK({
  endpoint: 'https://rpc-evm.selendra.org',
  chainType: ChainType.EVM
});

await sdk.connect();

// Access the ethers provider
const provider = sdk.getEvmProvider();
const blockNumber = await provider?.getBlockNumber();
console.log('Current block:', blockNumber);

await sdk.disconnect();
```

## API Reference

### Class: `SelendraSDK`

Main SDK class for connecting to Selendra blockchain.

#### Constructor

```typescript
new SelendraSDK(config?: SDKConfig)
```

**Parameters:**
- `config` (optional): SDK configuration object

**Example:**
```typescript
const sdk = new SelendraSDK({
  endpoint: 'wss://rpc.selendra.org',
  network: Network.Selendra,
  chainType: ChainType.Substrate,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  autoReconnect: true,
  debug: false
});
```

#### Methods

##### `connect(): Promise<void>`

Connect to the blockchain network.

**Throws:** Error if connection fails

**Example:**
```typescript
await sdk.connect();
```

##### `disconnect(): Promise<void>`

Disconnect from the blockchain network.

**Example:**
```typescript
await sdk.disconnect();
```

##### `destroy(): Promise<void>`

Destroy SDK instance and cleanup all resources. After calling, the instance should not be reused.

**Example:**
```typescript
await sdk.destroy();
```

##### `getConnectionInfo(): ConnectionInfo`

Get current connection information.

**Returns:** `ConnectionInfo` object with connection details

**Example:**
```typescript
const info = sdk.getConnectionInfo();
console.log('Endpoint:', info.endpoint);
console.log('Network:', info.network);
console.log('Connected:', info.isConnected);
```

##### `getApi(): ApiPromise | null`

Get the Polkadot API instance (Substrate only).

**Returns:** Polkadot `ApiPromise` instance or null

**Throws:** Error if called on EVM chain

**Example:**
```typescript
const api = sdk.getApi();
const chain = await api?.rpc.system.chain();
```

##### `getEvmProvider(): ethers.JsonRpcProvider | null`

Get the ethers provider instance (EVM only).

**Returns:** Ethers `JsonRpcProvider` instance or null

**Throws:** Error if called on Substrate chain

**Example:**
```typescript
const provider = sdk.getEvmProvider();
const balance = await provider?.getBalance(address);
```

#### Builder Pattern Methods

##### `withEndpoint(endpoint: string): SelendraSDK`

Set the endpoint URL.

**Example:**
```typescript
const sdk = new SelendraSDK()
  .withEndpoint('wss://rpc.selendra.org')
  .withNetwork(Network.Selendra)
  .withChainType(ChainType.Substrate);

await sdk.connect();
```

##### `withNetwork(network: Network | string): SelendraSDK`

Set the network.

##### `withChainType(chainType: ChainType): SelendraSDK`

Set the chain type.

##### `withOptions(options: Partial<SDKConfig>): SelendraSDK`

Set multiple configuration options at once.

#### Properties

##### `connected: boolean` (readonly)

Check if SDK is currently connected.

**Example:**
```typescript
if (sdk.connected) {
  console.log('SDK is connected');
}
```

#### Events

The SDK extends `EventEmitter` and emits the following events:

- `connecting` - Emitted when connection starts
- `connected` - Emitted when successfully connected
- `disconnected` - Emitted when disconnected
- `error` - Emitted on errors (receives `Error` object)
- `reconnecting` - Emitted when attempting to reconnect (receives attempt number)

**Example:**
```typescript
sdk.on('connecting', () => console.log('Connecting...'));
sdk.on('connected', () => console.log('Connected!'));
sdk.on('disconnected', () => console.log('Disconnected'));
sdk.on('error', (error) => console.error('Error:', error));
sdk.on('reconnecting', (attempt) => console.log(`Reconnect attempt ${attempt}`));
```

### Types

#### `SDKConfig`

```typescript
interface SDKConfig {
  endpoint?: string;              // WebSocket or HTTP endpoint URL
  network?: Network | string;     // Network to connect to
  chainType?: ChainType;          // Chain type (Substrate or EVM)
  timeout?: number;               // Connection timeout in ms (default: 30000)
  retryAttempts?: number;         // Retry attempts (default: 3)
  retryDelay?: number;            // Delay between retries in ms (default: 1000)
  autoReconnect?: boolean;        // Auto-reconnect on disconnect (default: true)
  debug?: boolean;                // Enable debug logging (default: false)
}
```

#### `ConnectionInfo`

```typescript
interface ConnectionInfo {
  endpoint: string;
  network: Network | string;
  chainType: ChainType;
  isConnected: boolean;
  isConnecting: boolean;
  connectedAt?: number;           // Timestamp of connection
  latency?: number;               // Connection latency in ms
}
```

#### `ChainType`

```typescript
enum ChainType {
  Substrate = 'substrate',
  EVM = 'evm',
}
```

#### `Network`

```typescript
enum Network {
  Selendra = 'selendra',
  SelendraTestnet = 'selendra-testnet',
  SelendraDevnet = 'selendra-devnet',
  Custom = 'custom',
}
```

### Factory Functions

#### `createSDK(config?: SDKConfig): SelendraSDK`

Create a new SDK instance.

**Example:**
```typescript
import { createSDK } from '@selendrajs/sdk-core';

const sdk = createSDK({
  endpoint: 'wss://rpc.selendra.org',
  network: Network.Selendra
});
```

#### `createAndConnect(config?: SDKConfig): Promise<SelendraSDK>`

Create and immediately connect an SDK instance.

**Example:**
```typescript
import { createAndConnect } from '@selendrajs/sdk-core';

const sdk = await createAndConnect({
  endpoint: 'wss://rpc.selendra.org'
});

// SDK is already connected
console.log(sdk.connected); // true
```

## Advanced Usage

### Auto-Reconnect

The SDK supports automatic reconnection when the connection is lost:

```typescript
const sdk = new SelendraSDK({
  endpoint: 'wss://rpc.selendra.org',
  autoReconnect: true,      // Enable auto-reconnect
  retryAttempts: 5,         // Try 5 times
  retryDelay: 2000,         // Wait 2 seconds between attempts
});

sdk.on('reconnecting', (attempt) => {
  console.log(`Reconnection attempt ${attempt}`);
});

await sdk.connect();
```

### Error Handling

```typescript
const sdk = new SelendraSDK();

sdk.on('error', (error) => {
  console.error('SDK Error:', error.message);
  // Handle error appropriately
});

try {
  await sdk.connect();
} catch (error) {
  console.error('Connection failed:', error);
  // Handle connection failure
}
```

### Debug Mode

Enable debug mode to see detailed logs:

```typescript
const sdk = new SelendraSDK({
  debug: true,  // Enable debug logging
});

await sdk.connect();
// Logs will be printed to console
```

### Multiple Connections

You can create multiple SDK instances for different chains:

```typescript
// Substrate connection
const substrateSdk = new SelendraSDK({
  endpoint: 'wss://rpc.selendra.org',
  chainType: ChainType.Substrate
});

// EVM connection
const evmSdk = new SelendraSDK({
  endpoint: 'https://rpc-evm.selendra.org',
  chainType: ChainType.EVM
});

await Promise.all([
  substrateSdk.connect(),
  evmSdk.connect()
]);

// Use both connections...

await Promise.all([
  substrateSdk.disconnect(),
  evmSdk.disconnect()
]);
```

## Development

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run lint
```

### Clean

```bash
npm run clean
```

## Requirements

- Node.js >= 16.0.0
- TypeScript >= 5.0.0

## Dependencies

- `@polkadot/api` - Polkadot.js API for Substrate chains
- `ethers` - Ethereum library for EVM chains
- `eventemitter3` - Event emitter

## License

Apache-2.0

## Support

- GitHub: https://github.com/selendra/selendra-sdk
- Issues: https://github.com/selendra/selendra-sdk/issues

## Roadmap

This is a minimal version focusing on connection management. Future versions will include:

- [ ] Account management
- [ ] Balance queries
- [ ] Transaction submission
- [ ] Contract interactions
- [ ] Staking operations
- [ ] Governance features
- [ ] Event subscriptions
- [ ] React hooks

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
