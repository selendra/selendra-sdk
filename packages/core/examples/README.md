# SDK Examples

This directory contains examples and tests for the Selendra SDK.

## 🌐 Using Testnet

**All examples are configured to use Selendra Testnet by default.**

See [TESTNET.md](./TESTNET.md) for complete testnet setup guide.

### Quick Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your testnet accounts
# Substrate: Set SUBSTRATE_PRIVATE_KEY or SENDER_URI
# EVM: Set EVM_PRIVATE_KEY

# 3. Run examples
npm run transfer:substrate
npm run balance:substrate
```

**Testnet Endpoints:**
- Substrate: `wss://rpc-testnet.selendra.org`
- EVM: `https://rpc-testnet.selendra.org`

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
# EVM transfers
npm run transfer:native       # Native SEL transfer (EVM)
npm run transfer:erc20        # ERC20 token transfer
npm run transfer:contract     # Custom contract interaction

# Substrate transfers
npm run transfer:substrate         # Native SEL transfer (Substrate, wait for finalization)
npm run transfer:substrate-nowait  # Transfer without waiting
npm run transfer:substrate-all     # Transfer all available balance
```

**⚠️ Important:** Transfer examples require environment variables:
```bash
# For EVM transfers
export PRIVATE_KEY="0x..."           # Required for all EVM transfers
export TOKEN_CONTRACT="0x..."        # Required for ERC20
export CONTRACT_ADDRESS="0x..."      # Required for contract interaction

# For Substrate transfers
export SENDER_URI="//Alice"                    # Sender seed/mnemonic
export RECIPIENT="5FHneW46xGXgs5m..."          # Recipient address
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

1. **Native Transfer (EVM)** (`transfer/01-native-transfer.ts`)
   - Send native SEL tokens on EVM chain
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

4. **Substrate Transfer** (`transfer/04-substrate-transfer.ts`)
   - Send native SEL tokens on Substrate chain
   - Uses Polkadot Keyring for signing
   - Waits for transaction finalization
   - Amount in planck (1 SEL = 10^18 planck)

5. **Substrate Transfer (No Wait)** (`transfer/05-substrate-transfer-nowait.ts`)
   - Submit transaction without waiting
   - Returns immediately with tx hash
   - Useful for batch operations

6. **Substrate Transfer All** (`transfer/06-substrate-transfer-all.ts`)
   - Transfer all available balance
   - Keeps existential deposit
   - Account remains active

### Contract Examples

1. **Get Contract** (`contract/01-get-contract.ts`)
   - Get contract instance with custom ABI
   - Read contract information
   - Check token balances
   - Query allowances

2. **Get Contract Instance** (`contract/02-get-contract-instance.ts`)
   - Get contract with minimal ABI
   - Basic ERC20 interactions
   - Contract verification

### Block Examples

1. **Current Block** (`block/01-current-block.ts`)
   - Get current block information
   - Works on both EVM and Substrate
   - Compare block heights

2. **Block Monitoring** (`block/02-block-monitoring.ts`)
   - Monitor new blocks in real-time
   - Configurable duration
   - Both chain types supported

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
- All examples use the local `@selendrajs/sdk` package
