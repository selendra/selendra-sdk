# Unified Accounts Feature - SDK Documentation

This document provides comprehensive documentation for the Unified Accounts feature in the Selendra SDK.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Unified Accounts feature enables seamless linking between Substrate accounts and EVM addresses on the Selendra network. This allows users to:

- **Cross-chain Identity**: Maintain a single identity across both Substrate and EVM ecosystems
- **Simplified UX**: Users don't need to manage separate accounts for different VMs
- **Flexible Claiming**: Three different methods to suit various use cases
- **Secure Mapping**: Cryptographically proven ownership via EIP-712 signatures

### Key Features

✅ Bidirectional account mapping (Substrate ↔ EVM)  
✅ Three claiming approaches (default, derived, custom)  
✅ EIP-712 signature verification  
✅ Storage fee management (burned, not treasuried)  
✅ On-chain storage of mappings  
✅ Query existing mappings  

---

## Getting Started

### Installation

```bash
npm install @selendrajs/sdk-core
```

### Basic Usage

```typescript
import { createSDK, ChainType } from '@selendrajs/sdk-core';

// Create SDK instance
const sdk = createSDK({
  endpoint: 'wss://rpc-testnet.selendra.org',
  chainType: ChainType.Substrate,
});

// Connect to network
await sdk.connect();

// Unified accounts manager is automatically initialized
const unifiedAccounts = sdk.unifiedAccounts;

// Check if address has a mapping
const mapping = await unifiedAccounts.getMappingInfo(address);
console.log('Has mapping:', mapping.isMapped);
console.log('Mapped to:', mapping.mappedTo);
```

---

## Core Concepts

### Account Mapping

A **unified account mapping** links a Substrate account (32-byte AccountId) to an EVM address (20-byte H160). Once created:

- Mapping is **permanent** and **immutable**
- Each account can only claim **once**
- Stored on-chain in bidirectional storage maps
- Requires a **storage fee** (burned)

### Three Claiming Approaches

| Approach | Signature? | Use Case |
|----------|-----------|----------|
| **Default** | No | Simplest - deterministic EVM address from hash |
| **Derived** | Yes | Same key material for both chains |
| **Custom** | Yes | Link existing EVM wallet |

#### 1. Default Address Claim

The **default EVM address** is deterministically calculated using:

```
default_evm_address = blake2_256("evm:" + substrate_account_id)[0..20]
```

**Characteristics:**
- No signature required
- Anyone can calculate it
- No control over specific address
- Simplest implementation

**Example:**
```typescript
const account = keyring.addFromUri('//Alice');
await unifiedAccounts.claimDefaultEvmAddress(account);
```

#### 2. Derived Key Claim

Uses an EVM key **derived** from your Substrate account via the `//evm` derivation path.

**Characteristics:**
- Same underlying key material
- Can sign both Substrate and EVM transactions
- Requires EIP-712 signature
- Cryptographic linkage between accounts

**Example:**
```typescript
const account = keyring.addFromUri('//Alice');
// Auto-derives EVM key using //evm path
await unifiedAccounts.claimEvmAddress(account);
```

#### 3. Custom Key Claim

Links your Substrate account to a **completely separate** EVM private key.

**Characteristics:**
- Full control over EVM address
- Use existing wallets (MetaMask, etc.)
- Requires EIP-712 signature
- Independent key management

**Example:**
```typescript
const account = keyring.addFromUri('//Alice');
const evmPrivateKey = '0xabcdef...';
await unifiedAccounts.claimEvmAddress(account, evmPrivateKey);
```

### EIP-712 Signatures

For derived and custom claims, an **EIP-712 typed structured data signature** is required:

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
  substrateAddress: "5Gjd...",
  evmAddress: "0x1234..."
}
```

This proves ownership of the EVM private key without revealing it.

### Storage Fee

All claiming transactions require a **one-time storage fee**:

- Fee is **burned** (not sent to treasury)
- Prevents account reaping
- Covers on-chain storage costs
- Query current fee: `await unifiedAccounts.getStorageFee()`

---

## API Reference

### UnifiedAccountsManager

The main class for interacting with unified accounts. Automatically initialized when SDK connects to a Substrate chain.

#### Query Methods

##### `getEvmAddressForSubstrate(substrateAddress: string): Promise<EvmMappingResult>`

Get the EVM address mapped to a Substrate account.

```typescript
const result = await unifiedAccounts.getEvmAddressForSubstrate('5Gjd...');
if (result.hasMappedAddress) {
  console.log('Mapped EVM:', result.mappedAddress);
}
```

**Returns:**
```typescript
{
  substrateAddress: string;    // Original Substrate address
  mappedAddress: string | null; // EVM address (if exists)
  hasMappedAddress: boolean;   // Whether mapping exists
}
```

---

##### `getSubstrateAddressForEvm(evmAddress: string): Promise<SubstrateMappingResult>`

Get the Substrate account mapped to an EVM address.

```typescript
const result = await unifiedAccounts.getSubstrateAddressForEvm('0x1234...');
if (result.hasMappedAddress) {
  console.log('Mapped Substrate:', result.mappedAddress);
}
```

**Returns:**
```typescript
{
  evmAddress: string;           // Original EVM address
  mappedAddress: string | null; // Substrate address (if exists)
  hasMappedAddress: boolean;    // Whether mapping exists
}
```

---

##### `getMappingInfo(address: string): Promise<MappingInfo>`

Get comprehensive mapping information for any address (auto-detects type).

```typescript
const info = await unifiedAccounts.getMappingInfo(address);
console.log('Type:', info.type);              // 'substrate' or 'evm'
console.log('Has mapping:', info.isMapped);
console.log('Mapped to:', info.mappedTo);
console.log('Default mapping:', info.defaultMapping);
```

**Returns:**
```typescript
{
  address: string;            // Original address
  mappedTo: string | null;    // Mapped address (if exists)
  isMapped: boolean;          // Whether mapping exists
  defaultMapping: string;     // Default address that would be used
  type: 'substrate' | 'evm';  // Address type
}
```

---

##### `isMapped(address: string): Promise<boolean>`

Quick check if an address has a mapping.

```typescript
const hasMappingSep = await unifiedAccounts.isMapped('5Gjd...');
```

---

##### `getStorageFee(): Promise<bigint>`

Get the current storage fee (in planck).

```typescript
const fee = await unifiedAccounts.getStorageFee();
console.log(`Fee: ${fee} planck (${Number(fee) / 1e18} SEL)`);
```

---

##### `getDefaultEvmAddress(substrateAddress: string): string`

Calculate the default EVM address for a Substrate account (doesn't require chain query).

```typescript
const defaultEvm = unifiedAccounts.getDefaultEvmAddress('5Gjd...');
console.log('Default EVM:', defaultEvm);
```

---

##### `getDefaultSubstrateAddress(evmAddress: string): string`

Calculate the default Substrate address for an EVM address (doesn't require chain query).

```typescript
const defaultSub = unifiedAccounts.getDefaultSubstrateAddress('0x1234...');
console.log('Default Substrate:', defaultSub);
```

---

#### Transaction Methods

##### `claimDefaultEvmAddress(account: KeyringPair, options?: TransactionOptions): Promise<ClaimResult>`

Claim the deterministic default EVM address (no signature required).

```typescript
const keyring = new Keyring({ type: 'sr25519' });
const account = keyring.addFromUri('//Alice');

const result = await unifiedAccounts.claimDefaultEvmAddress(
  account,
  { waitForFinalization: true }
);

console.log('TX Hash:', result.txHash);
console.log('Substrate:', result.mapping.substrate);
console.log('EVM:', result.mapping.evm);
console.log('Storage Fee:', result.fee.storageFee);
```

**Parameters:**
- `account`: KeyringPair - Substrate account (must be unlocked)
- `options`: TransactionOptions - Transaction options

**Options:**
```typescript
{
  waitForFinalization?: boolean; // Wait for finalization (default: true)
  tip?: bigint;                  // Optional tip
  nonce?: number;                // Optional nonce override
}
```

**Returns:** `ClaimResult`

---

##### `claimEvmAddress(account: KeyringPair, evmPrivateKey?: string, options?: TransactionOptions): Promise<ClaimResult>`

Claim an EVM address with signature verification.

**Behavior:**
- If `evmPrivateKey` provided: Use custom key (separate from Substrate)
- If `evmPrivateKey` omitted: Auto-derive from Substrate account (same key material)

```typescript
// Option 1: Auto-derive (same key)
const result1 = await unifiedAccounts.claimEvmAddress(account);

// Option 2: Custom key
const result2 = await unifiedAccounts.claimEvmAddress(
  account,
  '0xabcdef...'
);
```

**Parameters:**
- `account`: KeyringPair - Substrate account
- `evmPrivateKey`: string (optional) - EVM private key (if omitted, derives from account)
- `options`: TransactionOptions - Transaction options

**Returns:** `ClaimResult`

---

#### Helper Methods

##### `checkClaimEligibility(substrateAddress: string): Promise<EligibilityCheck>`

Check if an account can claim a mapping.

```typescript
const check = await unifiedAccounts.checkClaimEligibility('5Gjd...');

if (check.eligible) {
  console.log('Ready to claim!');
} else {
  console.log('Cannot claim:', check.reasons.join(', '));
}

console.log('Has mapping:', check.requirements.hasMapping);
console.log('Balance:', check.requirements.currentBalance);
console.log('Fee required:', check.requirements.storageFeeRequired);
console.log('Sufficient balance:', check.requirements.sufficientBalance);
```

**Returns:**
```typescript
{
  eligible: boolean;        // Overall eligibility
  reasons: string[];        // Reasons if not eligible
  requirements: {
    hasMapping: boolean;            // Already has mapping?
    sufficientBalance: boolean;     // Enough balance?
    storageFeeRequired: bigint;     // Fee required
    currentBalance: bigint;         // Current balance
  };
}
```

---

##### `estimateClaimCost(): Promise<CostEstimate>`

Estimate the total cost of claiming.

```typescript
const estimate = await unifiedAccounts.estimateClaimCost();

console.log('Storage fee:', estimate.storageFee);
console.log('TX fee:', estimate.estimatedTxFee);
console.log('Total:', estimate.estimatedTotal);
```

**Returns:**
```typescript
{
  storageFee: bigint;         // Storage fee (burned)
  estimatedTxFee: bigint;     // Transaction fee estimate
  estimatedTotal: bigint;     // Total cost
  balanceTransfer?: bigint;   // Balance transfer (if applicable)
}
```

---

##### `generateClaimSignature(substrateAddress: string, evmPrivateKey: string): Promise<string>`

Generate an EIP-712 signature for claiming (useful for pre-signing).

```typescript
const signature = await unifiedAccounts.generateClaimSignature(
  '5Gjd...',
  '0xabcdef...'
);
console.log('Signature:', signature);
```

---

### Types

#### ClaimResult

```typescript
interface ClaimResult {
  success: boolean;           // Whether claim succeeded
  txHash: string;             // Transaction hash
  blockHash?: string;         // Block hash (if finalized)
  events: ClaimEvent[];       // Events emitted
  mapping: {
    substrate: string;        // Substrate address
    evm: string;              // EVM address
  };
  fee: {
    storageFee: bigint;       // Storage fee burned
    transactionFee: bigint;   // Transaction fee
    total: bigint;            // Total cost
  };
}
```

---

## Examples

See the [examples/unified/](./examples/unified/) directory for complete examples:

1. **01-check-mapping.ts** - Query existing mappings
2. **02-claim-default.ts** - Claim default EVM address
3. **03-claim-derived.ts** - Claim with derived key
4. **04-claim-custom.ts** - Claim with custom EVM key
5. **05-check-eligibility.ts** - Check eligibility before claiming

Run examples:
```bash
npm run unified:check-mapping
npm run unified:claim-default
npm run unified:claim-derived
npm run unified:claim-custom
npm run unified:check-eligibility
```

---

## Security Considerations

### Private Key Management

🔐 **Critical Security Rules:**

1. **Never commit private keys** - Use `.env` files (add to `.gitignore`)
2. **Test on testnet first** - Always test with testnet before mainnet
3. **Secure backups** - Backup both Substrate and EVM keys securely
4. **Verify addresses** - Double-check addresses before claiming
5. **One-time claim** - You can only claim once per account - choose carefully!

### EIP-712 Signature Security

The EIP-712 signature ensures:
- ✅ Proof of EVM private key ownership
- ✅ Protection against replay attacks (chain-specific genesis hash)
- ✅ Domain separation from other EIP-712 signatures
- ✅ Human-readable signing message

### Storage Fee

The storage fee is **burned**, not sent to treasury. This:
- Prevents account reaping (keeps account alive)
- Reduces circulating supply slightly
- Is a one-time cost (only when claiming)

---

## Troubleshooting

### Common Errors

#### "Address already has a mapping"

**Cause:** Account has already claimed a unified mapping  
**Solution:** Each account can only claim once. Check existing mapping:

```typescript
const info = await unifiedAccounts.getMappingInfo(address);
console.log('Existing mapping:', info.mappedTo);
```

---

#### "Insufficient balance"

**Cause:** Account doesn't have enough tokens for storage fee + transaction fee  
**Solution:** Add funds or check estimate:

```typescript
const estimate = await unifiedAccounts.estimateClaimCost();
const check = await unifiedAccounts.checkClaimEligibility(address);
console.log('Required:', estimate.estimatedTotal);
console.log('Current:', check.requirements.currentBalance);
```

---

#### "Invalid signature"

**Cause:** EIP-712 signature verification failed  
**Solution:** Ensure EVM private key matches the address being claimed

```typescript
import { ethers } from 'ethers';
const wallet = new ethers.Wallet(evmPrivateKey);
console.log('EVM address from key:', wallet.address);
```

---

#### "Cannot connect to endpoint"

**Cause:** Network connection issue  
**Solution:** Verify endpoint is accessible:

```typescript
const sdk = createSDK({
  endpoint: 'wss://rpc-testnet.selendra.org',
  chainType: ChainType.Substrate,
  debug: true, // Enable debug logging
});
```

---

#### "unifiedAccounts is undefined"

**Cause:** Unified accounts not initialized (wrong chain type or connection failed)  
**Solution:** Ensure connected to Substrate chain:

```typescript
await sdk.connect();

if (!sdk.unifiedAccounts) {
  console.log('Unified accounts not available');
  console.log('Chain type:', sdk.chainType);
  console.log('Connected:', sdk.isConnected);
}
```

---

## Advanced Usage

### Pre-signing Transactions

Generate signature ahead of time:

```typescript
const signature = await unifiedAccounts.generateClaimSignature(
  substrateAddress,
  evmPrivateKey
);

// Later, use in transaction...
```

### Event Monitoring

Listen for claim events:

```typescript
const result = await unifiedAccounts.claimEvmAddress(account);

result.events.forEach(event => {
  if (event.type === 'AccountClaimed') {
    console.log('Claimed!');
    console.log('Substrate:', event.accountId);
    console.log('EVM:', event.evmAddress);
  }
});
```

### Batch Queries

Query multiple addresses:

```typescript
const addresses = ['5Gjd...', '5Dfe...', '5Abc...'];

const results = await Promise.all(
  addresses.map(addr => unifiedAccounts.getMappingInfo(addr))
);

results.forEach((info, i) => {
  console.log(`${addresses[i]}: ${info.isMapped ? 'Mapped' : 'Not mapped'}`);
});
```

---

## Additional Resources

- [Unified Accounts Implementation Plan](../../UNIFIED_ACCOUNTS_PLAN.md)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Selendra Documentation](https://docs.selendra.org)
- [Polkadot.js API](https://polkadot.js.org/docs/api)
- [ethers.js Documentation](https://docs.ethers.org/)

---

## Support

For issues or questions:

- GitHub Issues: https://github.com/selendra/selendra-sdk/issues
- Documentation: https://docs.selendra.org
- Community: Join our Discord/Telegram

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**License:** Apache-2.0
