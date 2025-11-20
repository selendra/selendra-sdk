# Configuration Guide

## Environment Variables

All examples use environment variables for configuration, managed through the `.env` file.

## Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   nano .env  # or use your preferred editor
   ```

## Configuration Options

### Network Endpoints

```env
# Mainnet RPC endpoint
RPC_ENDPOINT=https://rpc.selendra.org

# Testnet RPC endpoint
RPC_ENDPOINT_TESTNET=https://rpc-testnet.selendra.org

# EVM RPC endpoint
EVM_RPC_ENDPOINT=https://evm-rpc.selendra.org
```

### Network Selection

```env
# Choose network: "mainnet" or "testnet"
NETWORK=mainnet
```

Examples will automatically use the appropriate endpoint based on this setting.

### Private Keys

```env
# Substrate private key (for transaction signing)
PRIVATE_KEY=

# EVM private key (for EVM transactions)
EVM_PRIVATE_KEY=
```

**⚠️ SECURITY WARNING:**
- NEVER commit real private keys to version control
- The `.env` file is in `.gitignore` to prevent accidental commits
- Only use test accounts with small amounts for examples
- Consider using test networks for development

### Test Accounts

```env
# Public addresses for read-only examples
TEST_ADDRESS_SUBSTRATE=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
TEST_ADDRESS_EVM=0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

### API Configuration

```env
# Request timeout in milliseconds
TIMEOUT=30000

# Maximum retry attempts for failed requests
MAX_RETRIES=3
```

### Debug Mode

```env
# Enable debug logging
DEBUG=false
```

## Using Configuration in Code

### Import the config

```typescript
import { getEndpoint, config, configManager } from './config';
```

### Get the current endpoint

```typescript
const endpoint = getEndpoint(); // Returns mainnet or testnet based on NETWORK
```

### Access configuration values

```typescript
import { config } from './config';

console.log(config.timeout);
console.log(config.maxRetries);
console.log(config.testAddressSubstrate);
```

### Require private keys (with validation)

```typescript
import { requirePrivateKey, requireEvmPrivateKey } from './config';

// Will throw error if not set
const privateKey = requirePrivateKey();
const evmPrivateKey = requireEvmPrivateKey();
```

### Print current configuration

```typescript
import { configManager } from './config';

configManager.printConfig();
```

## Example Usage

### Basic Example

```typescript
import { SelendraSDK } from '@selendrajs/sdk';
import { getEndpoint } from './config';

const sdk = new SelendraSDK({ 
  endpoint: getEndpoint()
});

await sdk.connect();
```

### With Private Key

```typescript
import { SelendraSDK } from '@selendrajs/sdk';
import { getEndpoint, requirePrivateKey } from './config';

const sdk = new SelendraSDK({ 
  endpoint: getEndpoint()
});

const privateKey = requirePrivateKey();
// Use private key for signing...
```

### Switching Networks

Edit `.env`:
```env
# For mainnet
NETWORK=mainnet

# For testnet
NETWORK=testnet
```

All examples will automatically use the selected network.

## Configuration Files

| File | Description | Version Control |
|------|-------------|----------------|
| `.env.example` | Template with all options | ✅ Committed |
| `.env` | Your actual configuration | ❌ Never commit |

## Quick Commands

```bash
# View current configuration
npm run connect  # Will print config at start

# Test with mainnet
NETWORK=mainnet npm run connect

# Test with testnet
NETWORK=testnet npm run connect

# Enable debug mode
DEBUG=true npm run connect
```

## Troubleshooting

### Missing .env file
```bash
cp .env.example .env
```

### Private key required error
Set `PRIVATE_KEY` or `EVM_PRIVATE_KEY` in `.env` file.

### Wrong network
Check `NETWORK` setting in `.env` file.

### Timeout errors
Increase `TIMEOUT` value in `.env` file.

## Security Best Practices

1. ✅ Use `.env.example` for templates
2. ✅ Keep `.env` in `.gitignore`
3. ✅ Use test accounts for development
4. ✅ Use environment-specific configurations
5. ❌ Never commit private keys
6. ❌ Never share your `.env` file
7. ❌ Don't use production keys in examples
