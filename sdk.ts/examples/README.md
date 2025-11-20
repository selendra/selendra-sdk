# SDK Examples

This directory contains examples and tests for the Selendra SDK.

## Directory Structure

```
examples/
├── connect/            # Connection examples
│   ├── 01-substrate-connection.ts
│   ├── 02-evm-connection.ts
│   ├── 03-unified-connection.ts
└── README.md
```

## Setup

```bash
cd examples
npm install
```

## Running Examples

```bash
# Substrate connection
npm run example:substrate

# EVM connection
npm run example:evm

# Unified connection (both chains)
npm run example:unified
```

## Examples Overview

### 1. Substrate Connection (`01-substrate-connection.ts`)
- Connect to Selendra Substrate chain
- Query chain information
- Get current block number

### 2. EVM Connection (`02-evm-connection.ts`)
- Connect to Selendra EVM chain
- Query network information
- Get gas prices and block number

### 3. Unified Connection (`03-unified-connection.ts`)
- Connect to both Substrate and EVM chains
- Switch between chain types dynamically
- Use helper functions for chain connections

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
