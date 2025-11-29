# CLI Overview

The Selendra CLI (`@selendrajs/cli`) is a powerful command-line tool for Selendra blockchain development.

## Installation

```bash
npm install -g @selendrajs/cli
```

## Basic Usage

```bash
selendra <command> [options]
```

## Command Categories

### Project Commands

Commands for managing your project:

| Command | Description |
|---------|-------------|
| `init` | Initialize a new Selendra project |
| `compile` | Compile smart contracts |
| `deploy` | Deploy smart contract |
| `verify` | Verify contract source on explorer |

### Network Commands

Commands for interacting with the network:

| Command | Description |
|---------|-------------|
| `status` | Show network status and statistics |
| `chain` | Show chain information |
| `block` | Show block information |
| `tx` | Look up transaction details |
| `gas` | Show current gas prices |
| `logs` | Query contract event logs |

### Account Commands

Commands for managing accounts:

| Command | Description |
|---------|-------------|
| `account` | Manage accounts and keys |
| `balance` | Check account balance |
| `transfer` | Transfer SEL tokens |
| `faucet` | Request testnet tokens |

### Contract Commands

Commands for contract interaction:

| Command | Description |
|---------|-------------|
| `interact` | Interactive contract REPL |
| `abi` | Manage contract ABIs |

### Staking Commands

Commands for staking and nomination pools:

| Command | Description |
|---------|-------------|
| `stake` | Staking and nomination pools |

### Learning & Plugins

| Command | Description |
|---------|-------------|
| `learn` | Interactive tutorials |
| `plugin` | Manage CLI plugins |

## Global Options

All commands support these options:

| Option | Description |
|--------|-------------|
| `-V, --version` | Output version number |
| `-h, --help` | Display help for command |
| `-n, --network` | Network to use (mainnet/testnet/local) |
| `--json` | Output as JSON |

## Configuration File

Create a `selendra.config.ts` in your project root:

```typescript
import { defineConfig } from '@selendrajs/cli';

export default defineConfig({
  defaultNetwork: 'testnet',
  networks: {
    testnet: {
      rpc: 'https://rpc.testnet.selendra.org',
      chainId: 1953,
    },
    mainnet: {
      rpc: 'https://rpc.selendra.org',
      chainId: 1961,
    },
  },
  solidity: {
    version: '0.8.24',
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
});
```

## Environment Variables

```bash
# Private key for transactions
PRIVATE_KEY=0x...

# Default network
SELENDRA_NETWORK=testnet

# Faucet API (optional)
SELENDRA_FAUCET_API=https://faucet-api.selendra.org
```

## Quick Examples

```bash
# Check network status
selendra status --network testnet

# Create new account
selendra account new

# Get testnet tokens
selendra faucet 0x...

# Check balance
selendra balance 0x... --network testnet

# Deploy contract
selendra deploy MyToken --network testnet --args 1000000

# Interactive contract REPL
selendra interact 0x... --abi ./MyToken.json
```

## Next Steps

- [Installation](/cli/installation) - Detailed installation guide
- [Configuration](/cli/configuration) - Configuration options
- [Command Reference](/cli/commands/init) - Full command documentation
