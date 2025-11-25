# Selendra CLI

Command-line interface for Selendra blockchain development.

## Installation

### From npm (Coming Soon)
```bash
npm install -g @selendrajs/cli
```

### From Source
```bash
cd packages/cli
npm install
npm run build
npm link
```

### As part of SDK workspace
```bash
# From selendra-sdk root
npm install
npm run build
```

## Usage

### Project Commands

#### Initialize Project
```bash
# Create new EVM project (Solidity + Hardhat)
selendra init my-dapp

# Create WASM project (ink! + cargo-contract)
selendra init my-contract --template wasm
```

#### Compile Contracts
```bash
# Auto-detect and compile
selendra compile

# Compile EVM contracts
selendra compile --target evm

# Compile WASM contracts  
selendra compile --target wasm
```

#### Deploy Contracts
```bash
# Interactive deployment
selendra deploy MyToken

# Deploy to specific network
selendra deploy MyToken --network testnet

# Deploy with constructor args
selendra deploy MyToken --network testnet --args '["MyToken", "MTK"]'
```

### Network Commands

#### Check Network Status
```bash
# Mainnet status
selendra status

# Testnet status
selendra status --network testnet

# JSON output
selendra status --json
```

#### Chain Information
```bash
# Get chain info
selendra chain

# Get specific block
selendra block 1000

# Latest block
selendra block
```

### Account Commands

#### Create Account
```bash
# Create new EVM account
selendra account new

# Create Substrate account
selendra account new-substrate

# List accounts (coming soon)
selendra account list
```

#### Check Balance
```bash
# Check balance on mainnet
selendra balance 0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A

# Check balance on testnet
selendra balance 0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A --network testnet

# JSON output
selendra balance 0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A --json
```

#### Transfer Tokens
```bash
# Interactive transfer
selendra transfer 0xRecipientAddress

# With amount specified
selendra transfer 0xRecipientAddress --amount 10 --network testnet
```

#### Request Testnet Tokens
```bash
selendra faucet 0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A
```

### Staking Commands

#### Staking Info
```bash
# View staking overview
selendra stake info

# List available pools
selendra stake pools

# Join a pool (coming soon)
selendra stake join --pool 1 --amount 100

# Claim rewards (coming soon)
selendra stake claim

# Unbond from pool (coming soon)
selendra stake unbond
```

## Environment Variables

Set these in your `.env` file or export them:

```bash
# Required for transactions
PRIVATE_KEY=your_private_key
# or
SELENDRA_PRIVATE_KEY=your_private_key
```

## Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| Mainnet | 1961 | https://rpc.selendra.org |
| Testnet | 1953 | https://rpc-testnet.selendra.org |
| Local | 31337 | http://127.0.0.1:9944 |

## Command Reference

```
selendra <command> [options]

Commands:
  init <name>              Initialize a new Selendra project
  compile                  Compile smart contracts
  deploy <contract>        Deploy smart contract
  status                   Show network status
  chain                    Show chain information  
  block [number]           Show block information
  account [action]         Manage accounts (new|new-substrate|list)
  balance <address>        Check account balance
  transfer <to>            Transfer SEL tokens
  faucet <address>         Request testnet tokens
  stake [action]           Staking operations (info|pools|join|claim|unbond)

Global Options:
  -n, --network <network>  Network to use (mainnet|testnet|local)
  --json                   Output as JSON (where supported)
  -h, --help               Display help
  -V, --version            Display version
```

## Integration with Selendra SDK

This CLI is part of the `@selendrajs/sdk` monorepo and uses `@selendrajs/sdk-core` for blockchain interactions.

```typescript
// The CLI uses the SDK internally
import { SelendraClient } from '@selendrajs/sdk-core';
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- status --network testnet

# Build
npm run build

# Run tests
npm test

# Link globally for testing
npm link
selendra --help
```

## License

MIT
