# Selendra CLI

Command-line interface for Selendra blockchain development.

## Installation

### From npm (Coming Soon)
```bash
npm install -g @selendrajs/cli
```

### From Source
```bash
cd cli
npm install
npm run build
npm link
```

## Usage

### Initialize Project
```bash
# Create new EVM project
selendra init my-dapp

# Create WASM project
selendra init my-contract --template wasm
```

### Compile Contracts
```bash
# Auto-detect and compile
selendra compile

# Compile EVM contracts
selendra compile --target evm

# Compile WASM contracts
selendra compile --target wasm
```

### Deploy Contracts
```bash
# Interactive deployment
selendra deploy MyToken

# Deploy to specific network
selendra deploy MyToken --network testnet
```

### Check Network Status
```bash
# Mainnet
selendra status

# Testnet
selendra status --network testnet
```

Shows:
- Network name and chain ID
- Current block height
- Gas prices
- Last updated time

### Manage Accounts
```bash
# Create new account
selendra account new

# List accounts (coming soon)
selendra account list
```

Creates a new Ethereum-compatible wallet with:
- EVM address
- Private key
- Mnemonic seed phrase

### Request Testnet Tokens
```bash
selendra faucet <address>
```

Example:
```bash
selendra faucet 0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- status

# Build
npm run build

# Test the built version
npm start -- status
```

## Commands Reference

| Command | Description | Example |
|---------|-------------|---------|  
| `init <name>` | Initialize new project | `selendra init my-dapp --template evm` |
| `compile` | Compile smart contracts | `selendra compile` |
| `deploy <contract>` | Deploy contract | `selendra deploy MyToken --network testnet` |
| `status` | Show network statistics | `selendra status --network testnet` |
| `account new` | Create new wallet | `selendra account new` |
| `account list` | List all accounts | `selendra account list` |
| `faucet <address>` | Request testnet tokens | `selendra faucet 0x...` |

## Project Templates

### EVM Template
Creates a Hardhat project with:
- Sample ERC20 token contract
- TypeScript configuration
- Deploy scripts
- Hardhat config for Selendra networks

### WASM Template
Creates an ink! project with:
- Sample flipper contract
- Cargo.toml configuration
- Build scripts



## Network Configuration

**Mainnet:**
- RPC: `https://rpc.selendra.org`
- Chain ID: 1961

**Testnet:**
- RPC: `https://rpc-testnet.selendra.org`
- Chain ID: 1953

## License

MIT
