# Selendra SDK

Official TypeScript SDK for interacting with Selendra Network, supporting both EVM and WebAssembly (Substrate) interactions.

## Features

- 🚀 **Dual VM Support**: Interact with both EVM and WebAssembly smart contracts
- 📦 **TypeScript First**: Full TypeScript support with comprehensive type definitions
- 🔗 **Multi-Chain**: Support for mainnet, testnet, and custom networks
- 💰 **Wallet Integration**: Easy connection with MetaMask, WalletConnect, and Polkadot.js
- 🔧 **Developer Friendly**: Comprehensive utilities and helper functions
- 📊 **Real-time Data**: WebSocket support for live blockchain events
- 🧪 **Testing Support**: Built-in utilities for testing and development

## Installation

```bash
npm install @selendrajs/sdk
```

## Quick Start

### EVM Interactions

```typescript
import { SelendraSDK } from '@selendrajs/sdk';

// Initialize SDK
const sdk = new SelendraSDK({
  network: 'mainnet', // or 'testnet'
  provider: window.ethereum // or custom provider
});

// Connect wallet
await sdk.evm.connect();

// Get account balance
const balance = await sdk.evm.getBalance('0x...');

// Send transaction
const tx = await sdk.evm.sendTransaction({
  to: '0x...',
  value: '1000000000000000000' // 1 SEL
});
```

### Substrate/WASM Interactions

```typescript
// Initialize Substrate connection
await sdk.substrate.connect();

// Get account info
const account = await sdk.substrate.getAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

// Submit extrinsic
const hash = await sdk.substrate.submitExtrinsic(
  api.tx.balances.transfer('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 1000000000000)
);
```

### Smart Contract Interactions

```typescript
// EVM Contract
const contract = sdk.evm.contract({
  address: '0x...',
  abi: contractABI
});

const result = await contract.read('balanceOf', ['0x...']);
await contract.write('transfer', ['0x...', '1000000000000000000']);

// WASM Contract
const wasmContract = sdk.substrate.contract({
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  metadata: contractMetadata
});

const wasmResult = await wasmContract.query('get_balance');
```

## Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [EVM Development](./docs/evm.md)
- [Substrate Development](./docs/substrate.md)
- [API Reference](./docs/api.md)
- [Examples](./examples/)

## Network Configuration

### Mainnet
- **RPC**: https://rpc.selendra.org
- **Chain ID**: 1961
- **WebSocket**: wss://rpc.selendra.org

### Testnet
- **RPC**: https://rpc-testnet.selendra.org
- **Chain ID**: 1953
- **WebSocket**: wss://rpc-testnet.selendra.org

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm run test

# Lint
npm run lint

# Generate docs
npm run docs
```

## Examples

Check out the [examples directory](./examples/) for complete working examples:

- [EVM Token Transfer](./examples/evm-transfer.ts)
- [WASM Contract Interaction](./examples/wasm-contract.ts)
- [Multi-chain Bridge](./examples/bridge.ts)
- [DeFi Integration](./examples/defi.ts)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [Documentation](https://docs.selendra.org)
- [Discord](https://discord.gg/selendra)
- [GitHub Issues](https://github.com/selendra/selendra-sdk/issues)