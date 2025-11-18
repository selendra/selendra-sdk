# Environment Configuration Setup ✅

## What Was Created

### 1. Environment Files
- ✅ `.env.example` - Template with all configuration options (committed to git)
- ✅ `.env` - Your actual configuration file (ignored by git)
- ✅ Updated `.gitignore` to protect sensitive data

### 2. Configuration System
- ✅ `src/config/index.ts` - Configuration manager with validation
- ✅ Centralized configuration loading
- ✅ Type-safe configuration access
- ✅ Helper functions for common tasks

### 3. Updated Examples
All core SDK examples now use environment variables:
- ✅ `connect.ts` - Uses `getEndpoint()`
- ✅ `disconnect.ts` - Uses `getEndpoint()`
- ✅ `destroy.ts` - Uses `getEndpoint()`
- ✅ `lifecycle.ts` - Uses `getEndpoint()` + prints config

### 4. Documentation
- ✅ `docs/CONFIGURATION.md` - Complete configuration guide

## Configuration Options

### Available in `.env`:

```env
# Network Endpoints
RPC_ENDPOINT=https://rpc.selendra.org
RPC_ENDPOINT_TESTNET=https://rpc-testnet.selendra.org
EVM_RPC_ENDPOINT=https://evm-rpc.selendra.org

# Private Keys (for transaction examples)
PRIVATE_KEY=
EVM_PRIVATE_KEY=

# Test Accounts
TEST_ADDRESS_SUBSTRATE=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
TEST_ADDRESS_EVM=0x742d35Cc6634C0532925a3b844Bc454e4438f44e

# Network Selection
NETWORK=mainnet  # or testnet

# API Settings
TIMEOUT=30000
MAX_RETRIES=3

# Debug
DEBUG=false
```

## How to Use

### 1. Setup Configuration

```bash
# .env file is already created, edit as needed
nano .env
```

### 2. Switch Networks Easily

```bash
# Edit .env and change:
NETWORK=testnet  # Use testnet
# or
NETWORK=mainnet  # Use mainnet
```

### 3. Run Examples

```bash
# Examples automatically use .env configuration
npm run connect
npm run lifecycle
```

### 4. Override via Command Line

```bash
# Temporarily use testnet
NETWORK=testnet npm run connect

# Enable debug mode
DEBUG=true npm run connect
```

## Code Usage

### Import Configuration

```typescript
import { getEndpoint, config, configManager } from './config';
```

### Get Endpoint (respects NETWORK setting)

```typescript
const endpoint = getEndpoint();
// Returns mainnet or testnet endpoint based on .env
```

### Access Config Values

```typescript
import { config } from './config';

console.log(config.timeout);        // 30000
console.log(config.maxRetries);     // 3
console.log(config.network);        // "mainnet" or "testnet"
```

### Require Private Keys (with validation)

```typescript
import { requirePrivateKey, requireEvmPrivateKey } from './config';

// Throws error if not set in .env
const pk = requirePrivateKey();
const evmPk = requireEvmPrivateKey();
```

### Print Configuration

```typescript
import { configManager } from './config';

configManager.printConfig();
// Outputs:
// 📋 Configuration:
//   Network: mainnet
//   RPC Endpoint: https://rpc.selendra.org
//   ...
```

## Security Features

✅ **Private keys protected**
- `.env` file is in `.gitignore`
- Never committed to version control
- Clear warnings in documentation

✅ **Validation**
- Config manager validates required fields
- Throws errors for missing critical config
- Type-safe TypeScript interfaces

✅ **Flexible**
- Easy network switching
- Environment variable overrides
- Per-example configuration

## File Structure

```
example-test/
├── .env                    # Your config (gitignored)
├── .env.example            # Template (committed)
├── .gitignore             # Protects .env
├── src/
│   ├── config/
│   │   └── index.ts       # Config manager
│   └── examples/
│       └── core-sdk/
│           ├── connect.ts    # ✅ Uses getEndpoint()
│           ├── disconnect.ts # ✅ Uses getEndpoint()
│           ├── destroy.ts    # ✅ Uses getEndpoint()
│           └── lifecycle.ts  # ✅ Uses getEndpoint()
└── docs/
    └── CONFIGURATION.md   # Config guide
```

## Quick Reference

| Task | Command |
|------|---------|
| Edit config | `nano .env` |
| Use testnet | Set `NETWORK=testnet` in .env |
| Use mainnet | Set `NETWORK=mainnet` in .env |
| View config | `npm run lifecycle` (prints config) |
| Debug mode | Set `DEBUG=true` in .env |

## Benefits

✅ **Easy Testing**
- Switch networks with one variable
- No code changes needed
- Consistent across all examples

✅ **Secure**
- Private keys never in code
- Git ignores sensitive files
- Clear security warnings

✅ **Maintainable**
- Single source of truth
- Type-safe configuration
- Validation on load

✅ **Flexible**
- Override per-command
- Environment-specific configs
- Easy to extend

## Next Steps

1. **Edit `.env`** with your endpoints if different
2. **Add private keys** when needed for transaction examples
3. **Run examples** - they automatically use your config!

```bash
npm run connect    # Will use your .env config
npm run lifecycle  # Will print your config
```

## Package Added

- ✅ `dotenv` - For loading environment variables

That's it! Your examples now use centralized, secure configuration. 🎉
