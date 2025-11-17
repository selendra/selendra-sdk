# @selendrajs/sdk

TypeScript SDK for Selendra blockchain with full Substrate and EVM support.

[![npm version](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Tests](https://img.shields.io/badge/tests-70%2F129%20passing-yellow.svg)](https://github.com/selendra/selendra)

## Features

- **Substrate APIs**: Staking, Aleph consensus, Elections, Democracy
- **Unified Accounts**: Seamless Substrate ↔ EVM address conversion
- **React Hooks**: Production-ready hooks for dApp development
- **Type Safety**: Full TypeScript support with zero compilation errors
- **Well Tested**: 129 tests with 54% pass rate (improving)

## ⚠️ Security Notice

**IMPORTANT:** Never commit private keys or sensitive data to version control. Use environment variables for secrets. See `.env.example` for configuration.

## Installation

```bash
npm install @selendrajs/sdk
```

## Quick Start

```typescript
import { SelendraSDK, Network, ChainType } from '@selendrajs/sdk';

const sdk = new SelendraSDK()
  .withEndpoint('https://rpc.selendra.org')
  .withNetwork(Network.Selendra)
  .withChainType(ChainType.Substrate);

await sdk.connect();

// Query staking info
const validators = await sdk.staking.getValidators();

// Convert addresses
const evmAddr = sdk.accounts.substrateToEvm('5GrwvaEF...');
```

## React Integration

```tsx
import { SelendraProvider, useSelendra, useBalance } from '@selendrajs/sdk';

function App() {
  return (
    <SelendraProvider endpoint='https://rpc.selendra.org'>
      <YourComponent />
    </SelendraProvider>
  );
}

function YourComponent() {
  const { isConnected } = useSelendra();
  const { balance, loading } = useBalance('5GrwvaEF...');

  return <div>{isConnected && `Balance: ${balance}`}</div>;
}
```

## Available APIs

- **StakingClient**: Bond, nominate, unbond, validate
- **AlephClient**: Session queries, finality tracking
- **ElectionsClient**: Vote, submit candidacy, query members
- **DemocracyClient**: Propose, vote, delegate
- **UnifiedAccountManager**: Cross-chain address management

## Documentation

- **[API Reference](../docs/api/typescript.md)** - Complete API documentation
- **[React Hooks](../docs/api/react.md)** - React integration guide
- **[Getting Started](../docs/guides/getting-started.md)** - Quick start guide
- **[Examples](./examples/)** - Working code examples

## Network Endpoints

- **Mainnet**: `https://rpc.selendra.org` or `https://rpcx.selendra.org`
- **WebSocket**: `wss://rpc.selendra.org`

Both HTTP endpoints support Substrate and EVM.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## License

Apache License 2.0
