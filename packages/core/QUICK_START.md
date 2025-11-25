# Unified Accounts - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### 1. Install & Setup

```bash
cd sdk.ts
npm install dotenv ts-node
cp .env.example .env
```

Edit `.env`:
```env
SELENDRA_WS_URL=wss://rpc-testnet.selendra.org
SUBSTRATE_ADDRESS=5Gjd...
SENDER_URI=//Alice
EVM_PRIVATE_KEY=0x...  # Optional, for custom claiming
```

### 2. Build SDK

```bash
npm run build
```

### 3. Run Examples

```bash
# Check if address has mapping
npm run unified:check-mapping

# Check eligibility and costs
npm run unified:check-eligibility

# Claim default EVM address (simplest)
npm run unified:claim-default

# Or claim with derived key (same key material)
npm run unified:claim-derived

# Or claim with custom EVM key (separate key)
npm run unified:claim-custom
```

---

## 📝 Basic Usage in Your Code

### Query Existing Mapping

```typescript
import { createSDK, ChainType } from '@selendrajs/sdk';

const sdk = createSDK({
  endpoint: 'wss://rpc-testnet.selendra.org',
  chainType: ChainType.Substrate,
});

await sdk.connect();

// Check if address has mapping
const info = await sdk.unifiedAccounts.getMappingInfo(address);

if (info.isMapped) {
  console.log('Mapped to:', info.mappedTo);
} else {
  console.log('No mapping. Default would be:', info.defaultMapping);
}
```

### Claim Default EVM Address

```typescript
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

await cryptoWaitReady();

const keyring = new Keyring({ type: 'sr25519' });
const account = keyring.addFromUri('//Alice');

// Claim default EVM address (no signature needed)
const result = await sdk.unifiedAccounts.claimDefaultEvmAddress(account);

console.log('Claimed!');
console.log('Substrate:', result.mapping.substrate);
console.log('EVM:', result.mapping.evm);
console.log('Cost:', result.fee.total, 'planck');
```

### Claim with Custom EVM Key

```typescript
const evmPrivateKey = '0xabcdef...';

// Claim with custom EVM key
const result = await sdk.unifiedAccounts.claimEvmAddress(
  account,
  evmPrivateKey,
  { waitForFinalization: true }
);

console.log('Claimed with custom key!');
console.log('EVM address:', result.mapping.evm);
```

### Check Before Claiming

```typescript
// Always check eligibility first
const check = await sdk.unifiedAccounts.checkClaimEligibility(address);

if (!check.eligible) {
  console.log('Cannot claim:', check.reasons.join(', '));
  return;
}

// Estimate costs
const estimate = await sdk.unifiedAccounts.estimateClaimCost();
console.log('Total cost:', estimate.estimatedTotal, 'planck');

// Proceed with claim...
```

---

## 🎯 Choose Your Claiming Approach

### Option 1: Default Address ⭐ Recommended for beginners

**When:** You don't care about the specific EVM address

```typescript
await sdk.unifiedAccounts.claimDefaultEvmAddress(account);
```

**Pros:** Simplest, no signature  
**Cons:** Cannot choose address

---

### Option 2: Derived Key ⭐ Recommended for developers

**When:** You want same key for both chains

```typescript
await sdk.unifiedAccounts.claimEvmAddress(account);
// Automatically derives EVM key via //evm path
```

**Pros:** Same key material, can sign both chains  
**Cons:** EVM address is derived, not chosen

---

### Option 3: Custom Key ⭐ Recommended for existing wallets

**When:** You have an existing EVM wallet to link

```typescript
const evmKey = '0x...'; // Your MetaMask key, etc.
await sdk.unifiedAccounts.claimEvmAddress(account, evmKey);
```

**Pros:** Full control, use existing wallets  
**Cons:** Must manage two keys

---

## 🔍 Common Queries

### Get EVM address for Substrate account
```typescript
const result = await sdk.unifiedAccounts.getEvmAddressForSubstrate('5Gjd...');
```

### Get Substrate address for EVM account
```typescript
const result = await sdk.unifiedAccounts.getSubstrateAddressForEvm('0x1234...');
```

### Calculate default addresses (no chain query needed)
```typescript
const defaultEvm = sdk.unifiedAccounts.getDefaultEvmAddress('5Gjd...');
const defaultSub = sdk.unifiedAccounts.getDefaultSubstrateAddress('0x1234...');
```

### Get storage fee
```typescript
const fee = await sdk.unifiedAccounts.getStorageFee();
console.log(`Fee: ${fee} planck (${Number(fee) / 1e18} SEL)`);
```

---

## ⚠️ Important Notes

1. **One Claim Per Account**
   - Each Substrate account can only claim once
   - Choose your method carefully!
   - Cannot change mapping after claiming

2. **Storage Fee**
   - Fee is burned (not sent to treasury)
   - One-time cost when claiming
   - Check cost: `estimateClaimCost()`

3. **Testnet First!**
   - Always test on testnet before mainnet
   - Testnet: `wss://rpc-testnet.selendra.org`
   - Get test tokens from faucet

4. **Security**
   - Never commit private keys
   - Use `.env` files (in `.gitignore`)
   - Backup both Substrate and EVM keys

---

## 📚 More Information

- **Full API Docs:** [docs/UNIFIED_ACCOUNTS.md](docs/UNIFIED_ACCOUNTS.md)
- **Examples:** [examples/unified/README.md](examples/unified/README.md)
- **Implementation Plan:** [UNIFIED_ACCOUNTS_PLAN.md](UNIFIED_ACCOUNTS_PLAN.md)
- **Completion Summary:** [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)

---

## 🆘 Troubleshooting

### Build fails
```bash
npm run clean
npm install
npm run build
```

### "unifiedAccounts is undefined"
- Make sure you're connected to a Substrate chain
- Check: `sdk.chainType === ChainType.Substrate`

### "Address already has mapping"
- Account already claimed
- Check: `await sdk.unifiedAccounts.isMapped(address)`

### "Insufficient balance"
- Need more tokens for storage fee
- Check: `await sdk.unifiedAccounts.checkClaimEligibility(address)`

---

## ✅ Quick Checklist

Before claiming:
- [ ] Connected to correct network (testnet/mainnet)
- [ ] Have sufficient balance
- [ ] Checked eligibility
- [ ] Estimated costs
- [ ] Chose claiming approach
- [ ] Backed up private keys
- [ ] Verified addresses

---

**Ready to start? Run:**

```bash
npm run unified:check-eligibility
```

Then choose your claiming method! 🚀
