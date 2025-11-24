# Using Selendra Testnet

All examples in this directory are configured to use the **Selendra Testnet** by default.

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your testnet accounts:**
   ```bash
   # For Substrate examples - choose one:
   SUBSTRATE_PRIVATE_KEY=0x...your-substrate-private-key...
   # OR
   SENDER_URI=//YourTestAccount
   
   RECIPIENT=5GYpxi1Gq4VP5631a1TbmjtpJ2wmPGAw4PaE83r2Sp9585Qb
   
   # For EVM examples
   EVM_PRIVATE_KEY=0x...your-evm-private-key...
   ```

3. **Run examples:**
   ```bash
   npm run transfer:substrate
   npm run balance:substrate
   npm run block:current
   ```

## Testnet Endpoints

The following testnet endpoints are configured in `.env.example`:

- **Substrate (WebSocket):** `wss://rpc-testnet.selendra.org`
- **EVM (HTTPS):** `https://rpc-testnet.selendra.org`

## Getting Testnet Tokens

### Option 1: Test Accounts (Development Only)

For quick testing, you can use pre-funded development accounts:

```bash
# Substrate
SENDER_URI=//Alice
RECIPIENT=//Bob

# These accounts are publicly known - NEVER use on mainnet!
```

### Option 2: Testnet Faucet

1. Create a new account (Substrate or EVM)
2. Visit the Selendra testnet faucet (check official documentation)
3. Request testnet SEL tokens
4. Add your account to `.env`

### Option 3: Generate New Account

**For Substrate (Private Key):**
```bash
# Using Polkadot.js to get private key
npm install -g @polkadot/api-cli

# Generate account and extract private key
node -e "
const { Keyring } = require('@polkadot/api');
const { mnemonicGenerate } = require('@polkadot/util-crypto');

async function generate() {
  const { cryptoWaitReady } = await import('@polkadot/util-crypto');
  await cryptoWaitReady();
  
  const mnemonic = mnemonicGenerate();
  const keyring = new Keyring({ type: 'sr25519' });
  const pair = keyring.addFromMnemonic(mnemonic);
  
  console.log('Mnemonic:', mnemonic);
  console.log('Address:', pair.address);
  console.log('Public Key:', pair.publicKey.toString('hex'));
  // Note: For private key, export from Polkadot.js wallet UI
}

generate();
"

# Or use subkey
subkey generate --scheme sr25519
# Export JSON and get private key from Polkadot.js wallet
```

**For Substrate (Using Seed/Mnemonic):**
```bash
# Simply use the mnemonic or derivation path
SENDER_URI="word1 word2 word3 ... word12"
# or
SENDER_URI=//Alice  # For testing only
```

**For EVM:**
```javascript
// Using ethers.js
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Mnemonic:', wallet.mnemonic.phrase);
```

## Environment Variables

### Required for All Examples

```bash
# Testnet endpoints (already set in .env.example)
SELENDRA_WS_URL=wss://rpc-testnet.selendra.org
SELENDRA_RPC_URL=https://rpc-testnet.selendra.org
SELENDRA_NETWORK=testnet
```

### Required for Substrate Examples

```bash
# Option 1: Use private key (recommended for production)
SUBSTRATE_PRIVATE_KEY=0x...your-substrate-private-key-hex...

# Option 2: Use seed phrase or derivation path (easier for testing)
SENDER_URI=//Alice  # For testing with dev accounts
# OR
SENDER_URI="word1 word2 word3 ... word12"  # Your mnemonic

# Recipient address
RECIPIENT=5GYpxi1Gq4VP5631a1TbmjtpJ2wmPGAw4PaE83r2Sp9585Qb
SUB_TARGET_ADDRESS_1=5GYpxi1Gq4VP5631a1TbmjtpJ2wmPGAw4PaE83r2Sp9585Qb
```

**Note:** If both `SUBSTRATE_PRIVATE_KEY` and `SENDER_URI` are set, the private key takes priority.

### Required for EVM Examples

```bash
# EVM private key (with 0x prefix)
EVM_PRIVATE_KEY=0x...

# Legacy variable (for backwards compatibility)
PRIVATE_KEY=0x...

# For ERC20 and contract examples
TOKEN_CONTRACT=0x...
CONTRACT_ADDRESS=0x...
```

**Note:** Examples will use `EVM_PRIVATE_KEY` if available, otherwise fall back to `PRIVATE_KEY`.

## Example Usage

### 1. Substrate Transfer

```bash
# Option 1: Using private key
export SUBSTRATE_PRIVATE_KEY="0x..."
export RECIPIENT="5GYpxi1Gq4VP5631a1TbmjtpJ2wmPGAw4PaE83r2Sp9585Qb"

# Option 2: Using seed/mnemonic
export SENDER_URI="//Alice"
export RECIPIENT="5GYpxi1Gq4VP5631a1TbmjtpJ2wmPGAw4PaE83r2Sp9585Qb"

# Run transfer
npm run transfer:substrate
```

### 2. EVM Transfer

```bash
# Set your testnet private key
export EVM_PRIVATE_KEY="0x..."

# Run transfer
npm run transfer:native
```

### 3. Check Balance

```bash
# Substrate
npm run balance:substrate

# EVM
npm run balance:evm

# Both chains
npm run balance:unified
```

## Network Information

### Testnet Specifications

- **Network Name:** Selendra Testnet
- **Chain ID (EVM):** 1961 (same as mainnet for compatibility)
- **Token Symbol:** SEL
- **Token Decimals:** 18
- **Block Time:** ~12 seconds

### Important Notes

⚠️ **Testnet vs Mainnet**
- Testnet tokens have NO real value
- Use testnet for development and testing
- Never use testnet private keys on mainnet
- Never use mainnet private keys on testnet

⚠️ **Development Accounts**
- Test accounts like `//Alice` are publicly known
- ONLY use for local development
- NEVER use on public networks (even testnet)

⚠️ **Private Key Security**
- Never commit `.env` file to git
- `.env` is already in `.gitignore`
- Keep your private keys secure
- Use different keys for testing vs production

## Switching to Mainnet

To use mainnet instead of testnet:

1. **Update `.env`:**
   ```bash
   SELENDRA_WS_URL=wss://rpc.selendra.org
   SELENDRA_RPC_URL=https://rpc.selendra.org
   SELENDRA_NETWORK=mainnet
   ```

2. **Update your accounts with mainnet addresses/keys**

3. **Run examples as usual**

## Troubleshooting

### Connection Issues

```bash
# Test WebSocket connection
wscat -c wss://rpc-testnet.selendra.org

# Test HTTP connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://rpc-testnet.selendra.org
```

### Insufficient Balance

```bash
# Check your balance first
npm run balance:substrate
npm run balance:evm

# If zero, request tokens from faucet or use test accounts
```

### Invalid Private Key

```bash
# Substrate: Ensure private key is 64 hex characters (or 66 with 0x)
SUBSTRATE_PRIVATE_KEY=0x1234...  # Should be 66 chars total

# EVM: Ensure private key starts with 0x
EVM_PRIVATE_KEY=0x1234...  # Should be 66 characters total

# Check key length (should be 66 characters including 0x)
```

### Account Not Found (Substrate)

```bash
# For test accounts, use double slash
SENDER_URI=//Alice

# For mnemonic phrases, use quotes
SENDER_URI="word1 word2 word3 ... word12"

# For private key (hex format)
SUBSTRATE_PRIVATE_KEY=0x1234567890abcdef...
```

## Resources

- **Testnet Explorer:** (Check official documentation)
- **Faucet:** (Check official documentation)
- **Documentation:** https://docs.selendra.org
- **Discord:** (Join for testnet support)

## Common Test Scenarios

### 1. End-to-End Transfer Test

```bash
# Check balance
npm run balance:substrate

# Transfer tokens
npm run transfer:substrate

# Verify balance changed
npm run balance:substrate
```

### 2. Cross-Chain Balance Check

```bash
# Check balances on both chains
npm run balance:unified
```

### 3. Contract Interaction Test

```bash
# Deploy your test contract first
# Then interact with it
export CONTRACT_ADDRESS=0x...
npm run transfer:contract
```

## Support

If you encounter issues with testnet:

1. Check network status
2. Verify your `.env` configuration
3. Ensure you have sufficient testnet tokens
4. Review example code and error messages
5. Join Discord for community support
