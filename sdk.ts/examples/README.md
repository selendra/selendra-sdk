# SDK Examples

This directory contains examples and tests for the Selendra SDK.

## Directory Structure

```
examples/
├── connect/            # Connection examples
│   ├── 01-substrate-connection.ts
│   ├── 02-evm-connection.ts
│   ├── 03-unified-connection.ts
├── balance/            # Balance checking examples
│   ├── 01-substrate-balance.ts
│   ├── 02-evm-balance.ts
│   ├── 03-unified-balance.ts
├── transfer/           # Transaction examples
│   ├── 01-native-transfer.ts
│   ├── 02-erc20-transfer.ts
│   ├── 03-contract-interaction.ts
└── README.md
```

## Setup

```bash
cd examples
npm install
```

## Running Examples

### Connection Examples
```bash
# Substrate connection
npm run example:substrate

# EVM connection
npm run example:evm

# Unified connection (both chains)
npm run example:unified
```

### Balance Examples
```bash
# Check Substrate balance
npm run balance:substrate

# Check EVM balance
npm run balance:evm

# Check both balances
npm run balance:unified
```

### Transfer Examples
```bash
# Native SEL transfer
npm run transfer:native

# ERC20 token transfer
npm run transfer:erc20

# Custom contract interaction
npm run transfer:contract
```

**⚠️ Important:** Transfer examples require environment variables:
```bash
export PRIVATE_KEY="0x..."           # Required for all transfers
export TOKEN_CONTRACT="0x..."        # Required for ERC20
export CONTRACT_ADDRESS="0x..."      # Required for contract interaction
```

## Examples Overview

### Connection Examples

1. **Substrate Connection** (`connect/01-substrate-connection.ts`)
   - Connect to Selendra Substrate chain
   - Query chain information
   - Get current block number

2. **EVM Connection** (`connect/02-evm-connection.ts`)
   - Connect to Selendra EVM chain
   - Query network information
   - Get gas prices and block number

3. **Unified Connection** (`connect/03-unified-connection.ts`)
   - Connect to both Substrate and EVM chains
   - Switch between chain types dynamically
   - Use helper functions for chain connections

### Balance Examples

1. **Substrate Balance** (`balance/01-substrate-balance.ts`)
   - Check account balance on Substrate chain
   - Get raw balance (planck)
   - Get formatted balance (SEL)

2. **EVM Balance** (`balance/02-evm-balance.ts`)
   - Check account balance on EVM chain
   - Get raw balance (wei)
   - Get formatted balance (SEL)

3. **Unified Balance** (`balance/03-unified-balance.ts`)
   - Check balances on both chains
   - Compare Substrate and EVM balances
   - Unified balance checking

### Transfer Examples

1. **Native Transfer** (`transfer/01-native-transfer.ts`)
   - Send native SEL tokens
   - Check balance before/after transfer
   - Transaction confirmation

2. **ERC20 Transfer** (`transfer/02-erc20-transfer.ts`)
   - Transfer ERC20 tokens
   - Custom contract addresses
   - Token information (name, symbol, decimals)

3. **Contract Interaction** (`transfer/03-contract-interaction.ts`)
   - Call custom contract functions
   - Read-only calls (no gas)
   - Write transactions (state changes)
   - Transactions with native token value

## Expected Output

Each example outputs detailed information:
- Connection status
- Chain/network information
- Queried data
- Success/error messages

## Notes

- Examples use live Selendra RPC endpoints
- Network connectivity required
- Some operations may be slow due to network latency
- All examples use the local `@selendrajs/sdk-core` package
