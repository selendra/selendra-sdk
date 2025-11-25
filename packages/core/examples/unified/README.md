# Unified Accounts Examples

This directory contains examples demonstrating how to use the Selendra SDK's Unified Accounts feature. Unified Accounts allow users to link their Substrate account to an EVM address, enabling seamless cross-chain interactions.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root with your configuration:
```env
# Selendra Network
SELENDRA_WS_URL=wss://rpc-testnet.selendra.org

# Your Substrate Account
SUBSTRATE_ADDRESS=5DjjsNitvw1SYstaW4q4J165UwujptdZgSpACku8kgVFdQ57
SUBSTRATE_PRIVATE_KEY=0x1234567890abcdef...  # 64-char hex (32 bytes)
# OR use a seed/URI
SENDER_URI=//Alice

# Custom EVM Private Key (optional, for custom claiming)
EVM_PRIVATE_KEY=0xabcdef...  # 64-char hex (32 bytes)
EVM_ADDRESS=0x1234567890123456789012345678901234567890
```

## Examples Overview

### 1. Check Mapping (`01-check-mapping.ts`)
Query existing unified account mappings and get mapping information.

```bash
npm run unified:check-mapping
```

**What it demonstrates:**
- Checking if a Substrate address has an EVM mapping
- Checking if an EVM address has a Substrate mapping
- Getting default address calculations
- Querying storage fees

**Use when:**
- You want to see if an account already has a unified mapping
- You need to calculate what the default EVM address would be

---

### 2. Claim Default EVM Address (`02-claim-default.ts`)
Claim the deterministic default EVM address for your Substrate account.

```bash
npm run unified:claim-default
```

**What it demonstrates:**
- Calculating the default EVM address (blake2_256 hash)
- Checking claim eligibility
- Submitting a `claimDefaultEvmAddress` transaction
- Waiting for finalization
- Parsing transaction results and fees

**Use when:**
- You want the simplest claiming method (no signature required)
- You're okay with the deterministically-calculated EVM address
- You don't need a specific EVM key

**Key characteristics:**
- ✅ No EIP-712 signature required
- ✅ Simplest implementation
- ❌ Cannot choose specific EVM address

---

### 3. Claim with Derived Key (`03-claim-derived.ts`)
Claim using an EVM key derived from your Substrate account.

```bash
npm run unified:claim-derived
```

**What it demonstrates:**
- Deriving an EVM key from Substrate account using `//evm` path
- Generating EIP-712 signature
- Submitting a `claimEvmAddress` transaction with derived key
- Same underlying key material, different derivation path

**Use when:**
- You want to use the same key material for both chains
- You need a valid EVM private key (for signing EVM transactions later)
- You want cryptographic linkage between accounts

**Key characteristics:**
- ✅ Same seed/key material as Substrate account
- ✅ Can sign both Substrate and EVM transactions
- ✅ EIP-712 signature required (proving ownership)
- ⚠️ Derived address may differ from default

---

### 4. Claim with Custom Key (`04-claim-custom.ts`)
Claim using a completely separate EVM private key.

```bash
npm run unified:claim-custom
```

**What it demonstrates:**
- Using a user-provided EVM private key
- Generating EIP-712 signature from custom key
- Linking two completely independent accounts

**Use when:**
- You have an existing EVM wallet you want to link
- You want separate keys for Substrate and EVM
- You're migrating from another EVM chain

**Key characteristics:**
- ✅ Full control over EVM address
- ✅ Can use existing EVM wallets (MetaMask, etc.)
- ✅ EIP-712 signature required
- ⚠️ Must securely manage two separate keys

---

### 5. Check Eligibility (`05-check-eligibility.ts`)
Check if an account can claim a unified mapping before attempting.

```bash
npm run unified:check-eligibility
```

**What it demonstrates:**
- Checking claim eligibility
- Estimating transaction costs
- Validating account balance
- Getting storage fee requirements

**Use when:**
- Before attempting any claim transaction
- To validate account has sufficient balance
- To estimate total costs

---

## Understanding the Three Approaches

| Approach | Signature Required | Key Relationship | Use Case |
|----------|-------------------|------------------|----------|
| **Default** | ❌ No | Deterministic hash | Simplest, don't care about specific EVM address |
| **Derived** | ✅ Yes | Same key material (`//evm` path) | Want same key for both chains |
| **Custom** | ✅ Yes | Separate keys | Have existing EVM wallet to link |

### EIP-712 Signature Details

For approaches that require signatures (Derived and Custom), the SDK generates an EIP-712 typed structured data signature:

```typescript
// Domain
{
  name: "Selendra EVM Claim",
  version: "1",
  chainId: 1961,  // Testnet
  salt: genesis_hash
}

// Message
{
  substrateAddress: "5Gjd...",  // Your Substrate address
  evmAddress: "0x1234...",      // EVM address being claimed
}
```

This signature proves you control the EVM private key without revealing it.

---

## Storage Fee

All claiming transactions require a **storage fee** that is **burned** (not sent to treasury). This fee:
- Prevents account reaping (ensures account stays alive)
- Covers on-chain storage costs for the mapping
- Is a one-time fee (only paid when claiming)

Current fee: Query via `sdk.unifiedAccounts.getStorageFee()`

---

## Example Workflows

### First-time User
```bash
# 1. Check if you're eligible
npm run unified:check-eligibility

# 2. Claim default address (simplest)
npm run unified:claim-default

# 3. Verify the mapping was created
npm run unified:check-mapping
```

### User with Existing EVM Wallet
```bash
# 1. Set EVM_PRIVATE_KEY in .env
# 2. Check eligibility
npm run unified:check-eligibility

# 3. Claim with custom key
npm run unified:claim-custom

# 4. Verify mapping
npm run unified:check-mapping
```

### Developer Testing
```bash
# Check current state
npm run unified:check-mapping

# Estimate costs
npm run unified:check-eligibility

# Test derived key approach
npm run unified:claim-derived
```

---

## Error Handling

Common errors and solutions:

### "Address already has a mapping"
- Each Substrate account can only claim once
- Check existing mapping: `npm run unified:check-mapping`
- Solution: Use a different account

### "Insufficient balance"
- Account doesn't have enough tokens for storage fee + transaction fee
- Check estimate: `npm run unified:check-eligibility`
- Solution: Add funds to account

### "Invalid signature"
- EIP-712 signature verification failed
- Check that EVM private key matches the address being claimed
- Solution: Verify EVM_PRIVATE_KEY in .env

### "Cannot connect to endpoint"
- Network connection issue
- Check SELENDRA_WS_URL in .env
- Solution: Verify endpoint is accessible

---

## Additional Resources

- [Unified Accounts Plan](../../UNIFIED_ACCOUNTS_PLAN.md) - Detailed technical specification
- [Selendra Documentation](https://docs.selendra.org) - Network documentation
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712) - Signature standard

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Keys**: Never commit `.env` files or expose private keys
2. **Testnet First**: Test all operations on testnet before mainnet
3. **Verify Addresses**: Always double-check addresses before claiming
4. **Backup Keys**: Securely backup both Substrate and EVM keys
5. **One-Time Claim**: You can only claim once per Substrate account - choose carefully!

---

## Support

If you encounter issues:

1. Check your `.env` configuration
2. Verify you're connected to the correct network
3. Ensure account has sufficient balance
4. Review error messages carefully
5. Check [GitHub Issues](https://github.com/selendra/selendra-sdk/issues)

Happy coding! 🚀
