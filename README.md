# Selendra SDK

SDK for building applications on Selendra blockchain.

[![npm version](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Overview

TypeScript SDK for Selendra blockchain with full support for:

- ✅ **30 Pallets** - Complete coverage of all Selendra runtime pallets
- ✅ **EVM Support** - Full Ethereum compatibility via Frontier (powered by viem)
- ✅ **React Hooks** - Production-ready hooks for dApp development (wagmi compatible)
- ✅ **Unified Accounts** - Seamless Substrate ↔ EVM account mapping
- ✅ **Type Safety** - Full TypeScript with comprehensive types
- ✅ **Modern Stack** - Built with viem + wagmi for optimal bundle size and performance

## Packages

| Package           | Description               | NPM                                                                                                       |
| ----------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `@selendrajs/sdk` | Core SDK with all pallets | [![npm](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk) |
| `@selendrajs/cli` | Command-line interface    | [![npm](https://img.shields.io/npm/v/@selendrajs/cli.svg)](https://www.npmjs.com/package/@selendrajs/cli) |

## Installation

```bash
# Core SDK
npm install @selendrajs/sdk

# CLI (global)
npm install -g @selendrajs/cli
```

## Quick Start

```typescript
import { createSDK } from "@selendrajs/sdk";

// Connect to Selendra
const sdk = createSDK({ rpcUrl: "wss://rpc.selendra.org" });
await sdk.connect();

// Query balance
const balance = await sdk.pallets.balances.queries.getBalance("5GrwvaEF...");
console.log(`Balance: ${balance.free}`);

// Transfer tokens
const result = await sdk.pallets.balances.manager.transfer(
  signer,
  signerAddress,
  { dest: "5FHneW46...", value: "1000000000000000000" }
);

// Disconnect
await sdk.disconnect();
```

## React Integration

```tsx
import {
  SelendraProvider,
  useSelendra,
  useBalance,
} from "@selendrajs/sdk/react";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SelendraProvider config={{ rpcUrl: "wss://rpc.selendra.org" }}>
          <Wallet />
        </SelendraProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Wallet() {
  const { isConnected } = useSelendra();
  const { balance, isLoading } = useBalance("5GrwvaEF...");

  if (!isConnected) return <div>Connecting...</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Balance: {balance?.free}</div>;
}
```

## Supported Pallets

### Core

- **Balances** - Token transfers and queries
- **Staking** - Validator nomination and rewards
- **Session** - Session key management

### Governance

- **Democracy** - Proposals and referenda
- **Council** - Collective decision-making
- **Technical Committee** - Technical governance
- **Treasury** - Community funding
- **Elections** - Council elections (Phragmen)

### Account Management

- **Identity** - On-chain identity
- **Multisig** - Multi-signature accounts
- **Proxy** - Account delegation
- **Vesting** - Token vesting schedules
- **Utility** - Batch transactions

### Smart Contracts

- **Contracts** - ink! WASM contracts
- **EVM** - Ethereum Virtual Machine
- **Ethereum** - Ethereum transaction compatibility
- **XVM** - Cross-VM calls

### Selendra-Specific

- **Aleph** - Consensus and finality
- **Elections** - Validator elections
- **Committee Management** - Validator performance
- **Operations** - Account maintenance
- **Unified Accounts** - Substrate ↔ EVM mapping

### Administration

- **Sudo** - Privileged operations
- **Safe Mode** - Emergency protection
- **Tx Pause** - Transaction pausing
- **Scheduler** - Scheduled calls
- **Preimage** - Preimage storage

## Project Structure

```
selendra-sdk/
├── packages/
│   ├── core/                  # @selendrajs/sdk
│   │   ├── src/
│   │   │   ├── core/          # SDK core classes
│   │   │   ├── pallets/       # All 30 pallet implementations
│   │   │   ├── providers/     # Connection providers
│   │   │   ├── react/         # React hooks
│   │   │   ├── unified/       # Unified accounts
│   │   │   ├── types/         # TypeScript types
│   │   │   └── utils/         # Utilities
│   │   ├── tests/             # Jest tests
│   │   └── examples/          # Usage examples
│   │
│   └── cli/                   # @selendrajs/cli
│       ├── src/
│       │   ├── commands/      # CLI commands
│       │   ├── utils/         # CLI utilities
│       │   └── templates/     # Project templates
│       └── example/           # Example projects
│
├── package.json               # Workspace root
└── README.md
```

## CLI Usage

```bash
# Create new project
selendra init my-dapp

# Check network status
selendra status --network testnet

# Check balance
selendra balance 0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A

# Create account
selendra account new

# Deploy contract
selendra deploy MyToken --network testnet

# Staking info
selendra stake info
```

See [CLI README](packages/cli/README.md) for full documentation.

## Examples

See the `packages/core/examples/` directory for comprehensive examples:

- `balance/` - Balance queries and transfers
- `staking/` - Staking operations
- `governance/` - Democracy, Council, Treasury
- `pools/` - Nomination pools
- `evm/` - EVM interactions
- `contracts/` - ink! smart contracts
- `unified/` - Unified accounts

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Build specific packages
npm run build:core
npm run build:cli

# Run CLI in development
npm run cli -- status --network testnet
```

## Documentation

- [Quick Start Guide](packages/core/QUICK_START.md)
- [Implementation Plan](packages/core/IMPLEMENTATION_PLAN.md)
- [Pallet Reference](packages/core/SELENDRA_PALLETS.md)
- [CLI Reference](packages/cli/README.md)
- [Task Tracker](packages/core/TASKS.md)

## Legacy Code

The legacy Rust and old TypeScript implementations are preserved in the `legacy` branch:

```bash
git checkout legacy
```

## License

Apache-2.0 - see [LICENSE](LICENSE)

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

## Links

- [Selendra Website](https://selendra.org)
- [Documentation](https://docs.selendra.org)
- [GitHub](https://github.com/selendra/selendra-sdk)
- [Discord](https://discord.gg/selendra)
