# Unified Accounts Pallet - SDK Implementation Plan

## Executive Summary

This document outlines the implementation plan for integrating Selendra's `pallet-unified-accounts` functionality into the TypeScript SDK. The unified accounts feature allows users to create bidirectional mappings between Substrate (native) and EVM addresses, providing a seamless cross-VM experience.

---

## 1. Pallet Analysis

### 1.1 Core Functionality

The `pallet-unified-accounts` provides:

1. **Bidirectional Address Mapping**: Links Substrate AccountId ↔ EVM Address (H160)
2. **Two Claiming Methods**:
   - `claim_evm_address`: Connect a specific EVM address with signature proof
   - `claim_default_evm_address`: Connect to a deterministically generated default EVM address
3. **Storage Mappings**:
   - `EvmToNative`: `H160 → AccountId` 
   - `NativeToEvm`: `AccountId → H160`
4. **Account Lifecycle**: Automatically removes mappings when accounts are killed

### 1.2 Key Features

#### Three Claiming Approaches

The SDK will support three different ways to claim a unified account:

**Approach 1: Default EVM Address (Deterministic)**
- Uses `claim_default_evm_address()` extrinsic
- Automatically generates EVM address from Substrate AccountId hash
- No signature required
- Simplest option, but EVM address is not human-readable

**Approach 2: Same Key for Both Chains (Derived)**
- Uses `claim_evm_address()` extrinsic
- Derives EVM private key from Substrate account seed
- Both chains controlled by same underlying key material
- Requires EIP-712 signature
- Convenient for users who want unified key management

**Approach 3: Separate EVM Private Key (Custom)**
- Uses `claim_evm_address()` extrinsic
- User provides specific EVM private key
- Complete flexibility for existing EVM wallets
- Requires EIP-712 signature
- Best for users with existing MetaMask/EVM accounts

#### claim_evm_address(evm_address, signature)
- **Purpose**: Connect a Substrate account to a custom EVM address
- **SDK Options**:
  - **Option A**: Provide specific EVM private key (for separate keys)
  - **Option B**: Derive EVM key from Substrate account (same key both chains)
  - **Option C**: Use `claimDefaultEvmAddress()` instead for deterministic address
- **Requirements**:
  - Valid EIP-712 signature proving ownership of EVM address
  - No prior mapping exists for either address
  - Sufficient balance to pay storage fee
- **Process**:
  1. Verify signature matches claimed EVM address
  2. Charge storage fee (burned)
  3. Transfer balance from default account if it exists
  4. Create bidirectional mappings
  5. Emit `AccountClaimed` event

#### claim_default_evm_address()
- **Purpose**: Connect to a deterministically generated EVM address
- **Requirements**:
  - No prior mapping exists for the Substrate account
  - Sufficient balance to pay storage fee
- **Process**:
  1. Calculate default EVM address from Substrate AccountId
  2. Charge storage fee (burned)
  3. Create bidirectional mappings
  4. Emit `AccountClaimed` event

### 1.3 EIP-712 Signature Scheme

The pallet uses EIP-712 typed structured data signing:

```typescript
// Domain Separator Components
{
  name: "Selendra EVM Claim",
  version: "1",
  chainId: 1961,
  salt: genesis_block_hash
}

// Message Type
{
  Claim: {
    substrateAddress: "bytes"
  }
}
```

**Signing Payload Construction**:
```
payload = keccak256(
  "\x19\x01" + 
  domain_separator + 
  keccak256("Claim(bytes substrateAddress)") +
  keccak256(encoded_substrate_account_id)
)
```

### 1.4 Storage Fee

- Configurable via runtime constant `AccountMappingStorageFee`
- Fee is **burned** (not sent to treasury)
- Must be paid before creating mapping
- Preserves account from being reaped

### 1.5 Important Warnings

⚠️ **CRITICAL USER WARNINGS**:
1. **Permanent Mappings**: Once created, mappings CANNOT be changed
2. **Asset Transfer Required**: Only native balance is auto-transferred from default account
3. **Lost Funds Risk**: XC20 tokens, DApp staking rewards, etc. must be manually transferred first
4. **One-Time Operation**: Each account can only claim once

---

## 2. SDK Architecture Plan

### 2.1 Module Structure

```
src/
├── unified/
│   ├── index.ts                    # Main exports
│   ├── UnifiedAccountsManager.ts   # Core class
│   ├── signature.ts                # EIP-712 signing utilities
│   ├── types.ts                    # TypeScript types
│   └── utils.ts                    # Helper functions
├── types/
│   └── unified.ts                  # Shared types
└── sdk.ts                          # Add unified methods to SDK
```

### 2.2 Class Design: UnifiedAccountsManager

```typescript
class UnifiedAccountsManager {
  // Constructor
  constructor(
    substrateProvider: SubstrateProvider,
    evmProvider: EvmProvider,
    chainId: number
  )
  
  // Query Methods (Read-Only)
  async getEvmAddressForSubstrate(accountId: string): Promise<EvmMappingResult>
  async getSubstrateAddressForEvm(evmAddress: string): Promise<SubstrateMappingResult>
  async getDefaultEvmAddress(accountId: string): Promise<string>
  async getDefaultSubstrateAddress(evmAddress: string): Promise<string>
  async isMapped(address: string): Promise<boolean>
  async getMappingInfo(address: string): Promise<MappingInfo>
  
  // Transaction Methods (Write)
  async claimEvmAddress(
    substrateAccount: KeyringPair,
    evmPrivateKey?: string, // Optional: if not provided, derives from substrate key
    options?: TransactionOptions
  ): Promise<ClaimResult>
  
  async claimDefaultEvmAddress(
    substrateAccount: KeyringPair,
    options?: TransactionOptions
  ): Promise<ClaimResult>
  
  // Signature Generation
  async generateClaimSignature(
    substrateAccountId: string,
    evmPrivateKey: string
  ): Promise<string>
  
  // Utility Methods
  async getStorageFee(): Promise<bigint>
  async checkClaimEligibility(address: string): Promise<EligibilityCheck>
  async estimateClaimCost(): Promise<CostEstimate>
}
```

### 2.3 Type Definitions

```typescript
// Mapping Results
interface EvmMappingResult {
  evmAddress: string | null;
  isMapped: boolean;
  isDefault: boolean;
  defaultAddress: string;
}

interface SubstrateMappingResult {
  substrateAddress: string | null;
  isMapped: boolean;
  isDefault: boolean;
  defaultAddress: string;
}

interface MappingInfo {
  address: string;
  mappedTo: string | null;
  isMapped: boolean;
  defaultMapping: string;
  type: 'substrate' | 'evm';
}

// Transaction Options
interface TransactionOptions {
  waitForFinalization?: boolean;
  tip?: bigint;
  nonce?: number;
}

// Claim Results
interface ClaimResult {
  success: boolean;
  txHash: string;
  blockHash?: string;
  events: ClaimEvent[];
  mapping: {
    substrate: string;
    evm: string;
  };
  fee: {
    storageFee: bigint;
    transactionFee: bigint;
    total: bigint;
  };
}

interface ClaimEvent {
  type: 'AccountClaimed';
  accountId: string;
  evmAddress: string;
}

// Eligibility Check
interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
  requirements: {
    hasMapping: boolean;
    sufficientBalance: boolean;
    storageFeeRequired: bigint;
    currentBalance: bigint;
  };
}

// Cost Estimate
interface CostEstimate {
  storageFee: bigint;
  estimatedTxFee: bigint;
  estimatedTotal: bigint;
  balanceTransfer?: bigint; // If default account has balance
}

// EIP-712 Types
interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  salt: string; // genesis hash
}

interface ClaimMessage {
  substrateAddress: Uint8Array;
}
```

---

## 3. Implementation Details

### 3.1 Phase 1: Query/Read Functions

**Priority: HIGH** - These allow users to check mapping status without transactions

#### 3.1.1 Storage Queries

```typescript
// Query storage: NativeToEvm
async getEvmAddressForSubstrate(accountId: string): Promise<EvmMappingResult> {
  const mapped = await this.substrateProvider.api.query.unifiedAccounts.nativeToEvm(accountId);
  const defaultAddress = this.calculateDefaultEvmAddress(accountId);
  
  return {
    evmAddress: mapped.isSome ? mapped.unwrap().toHex() : null,
    isMapped: mapped.isSome,
    isDefault: false,
    defaultAddress
  };
}

// Query storage: EvmToNative
async getSubstrateAddressForEvm(evmAddress: string): Promise<SubstrateMappingResult> {
  const mapped = await this.substrateProvider.api.query.unifiedAccounts.evmToNative(evmAddress);
  const defaultAddress = this.calculateDefaultSubstrateAddress(evmAddress);
  
  return {
    substrateAddress: mapped.isSome ? mapped.unwrap().toString() : null,
    isMapped: mapped.isSome,
    isDefault: false,
    defaultAddress
  };
}
```

#### 3.1.2 Default Address Calculation

```typescript
// Calculate default EVM address from Substrate AccountId
private calculateDefaultEvmAddress(accountId: string): string {
  // Implementation based on HashedDefaultMappings::to_default_h160
  // payload = ("evm:", accountId)
  // hash = blake2_256(encode(payload))
  // evm_address = hash[0..20]
  
  const payload = new Uint8Array([
    ...new TextEncoder().encode('evm:'),
    ...decodeAddress(accountId)
  ]);
  const hash = blake2AsU8a(payload, 256);
  return '0x' + Buffer.from(hash.slice(0, 20)).toString('hex');
}

// Calculate default Substrate address from EVM address
private calculateDefaultSubstrateAddress(evmAddress: string): string {
  // Implementation based on HashedAddressMapping::into_account_id
  // Uses blake2_256 hash of the EVM address
  
  const hash = blake2AsU8a(
    new Uint8Array([...Buffer.from(evmAddress.slice(2), 'hex')]),
    256
  );
  return encodeAddress(hash, this.ss58Prefix);
}
```

#### 3.1.3 Storage Fee Query

```typescript
async getStorageFee(): Promise<bigint> {
  const fee = await this.substrateProvider.api.consts.unifiedAccounts.accountMappingStorageFee;
  return BigInt(fee.toString());
}
```

### 3.2 Phase 2: EIP-712 Signature Generation

**Priority: HIGH** - Required for claim_evm_address transactions

#### 3.2.1 Signature Utilities

```typescript
// signature.ts
import { ethers } from 'ethers';
import { keccak256 } from '@ethersproject/keccak256';
import { Keyring } from '@polkadot/api';

export class UnifiedAccountSignature {
  private domain: EIP712Domain;
  
  constructor(chainId: number, genesisHash: string) {
    this.domain = {
      name: 'Selendra EVM Claim',
      version: '1',
      chainId,
      salt: genesisHash
    };
  }
  
  // Build EIP-712 domain separator
  private buildDomainSeparator(): string {
    const domainTypeHash = keccak256(
      Buffer.from('EIP712Domain(string name,string version,uint256 chainId,bytes32 salt)')
    );
    const nameHash = keccak256(Buffer.from('Selendra EVM Claim'));
    const versionHash = keccak256(Buffer.from('1'));
    
    const chainIdBytes = ethers.utils.zeroPad(
      ethers.BigNumber.from(this.domain.chainId).toHexString(),
      32
    );
    
    const encoded = ethers.utils.concat([
      domainTypeHash,
      nameHash,
      versionHash,
      chainIdBytes,
      this.domain.salt
    ]);
    
    return keccak256(encoded);
  }
  
  // Build args hash for the claim
  private buildArgsHash(substrateAccountId: Uint8Array): string {
    const claimTypeHash = keccak256(
      Buffer.from('Claim(bytes substrateAddress)')
    );
    const accountHash = keccak256(substrateAccountId);
    
    return keccak256(ethers.utils.concat([claimTypeHash, accountHash]));
  }
  
  // Build the final signing payload
  buildSigningPayload(substrateAccountId: string | Uint8Array): string {
    const accountBytes = typeof substrateAccountId === 'string'
      ? decodeAddress(substrateAccountId)
      : substrateAccountId;
    
    const domainSeparator = this.buildDomainSeparator();
    const argsHash = this.buildArgsHash(accountBytes);
    
    const payload = ethers.utils.concat([
      '0x1901',
      domainSeparator,
      argsHash
    ]);
    
    return keccak256(payload);
  }
  
  // Generate signature using EVM private key
  async signClaim(
    substrateAccountId: string,
    evmPrivateKey: string
  ): Promise<string> {
    const payload = this.buildSigningPayload(substrateAccountId);
    const wallet = new ethers.Wallet(evmPrivateKey);
    
    // Sign the pre-hashed payload
    const signature = await wallet.signMessage(
      ethers.utils.arrayify(payload)
    );
    
    return signature; // Returns 65-byte signature with recovery byte
  }
}
```

### 3.3 Phase 3: Claim Transactions

**Priority: MEDIUM** - Main user-facing functionality

#### 3.3.1 Claim EVM Address

```typescript
async claimEvmAddress(
  substrateAccount: KeyringPair,
  evmPrivateKey?: string, // Optional: if not provided, derives from substrate key
  options: TransactionOptions = {}
): Promise<ClaimResult> {
  // 1. Pre-flight checks
  const eligibility = await this.checkClaimEligibility(
    substrateAccount.address
  );
  
  if (!eligibility.eligible) {
    throw new Error(`Cannot claim: ${eligibility.reasons.join(', ')}`);
  }
  
  // 2. Determine EVM private key
  let actualEvmPrivateKey: string;
  
  if (evmPrivateKey) {
    // User provided specific EVM private key
    actualEvmPrivateKey = evmPrivateKey;
  } else {
    // Derive EVM private key from Substrate account
    // Use the same seed/private key for both chains
    actualEvmPrivateKey = this.deriveEvmKeyFromSubstrate(substrateAccount);
  }
  
  // 3. Get EVM address from private key
  const evmWallet = new ethers.Wallet(actualEvmPrivateKey);
  const evmAddress = evmWallet.address;
  
  // 4. Generate EIP-712 signature
  const signature = await this.signatureHelper.signClaim(
    substrateAccount.address,
    actualEvmPrivateKey
  );
  
  // 5. Build extrinsic
  const tx = this.substrateProvider.api.tx.unifiedAccounts.claimEvmAddress(
    evmAddress,
    signature
  );
  
  // 6. Sign and send
  return new Promise((resolve, reject) => {
    tx.signAndSend(
      substrateAccount,
      { tip: options.tip, nonce: options.nonce },
      async ({ status, events, dispatchError }) => {
        if (dispatchError) {
          reject(this.parseError(dispatchError));
        }
        
        const finalized = options.waitForFinalization !== false;
        if ((finalized && status.isFinalized) || (!finalized && status.isInBlock)) {
          const result = this.parseClaimResult(events, status);
          resolve(result);
        }
      }
    );
  });
}
```

#### 3.3.2 Claim Default EVM Address

```typescript
async claimDefaultEvmAddress(
  substrateAccount: KeyringPair,
  options: TransactionOptions = {}
): Promise<ClaimResult> {
  // 1. Pre-flight checks
  const eligibility = await this.checkClaimEligibility(
    substrateAccount.address
  );
  
  if (!eligibility.eligible) {
    throw new Error(`Cannot claim: ${eligibility.reasons.join(', ')}`);
  }
  
  // 2. Build extrinsic
  const tx = this.substrateProvider.api.tx.unifiedAccounts.claimDefaultEvmAddress();
  
  // 3. Sign and send
  return new Promise((resolve, reject) => {
    tx.signAndSend(
      substrateAccount,
      { tip: options.tip, nonce: options.nonce },
      async ({ status, events, dispatchError }) => {
        if (dispatchError) {
          reject(this.parseError(dispatchError));
        }
        
        const finalized = options.waitForFinalization !== false;
        if ((finalized && status.isFinalized) || (!finalized && status.isInBlock)) {
          const result = this.parseClaimResult(events, status);
          resolve(result);
        }
      }
    );
  });
}
```

### 3.4 Phase 4: Helper & Utility Functions

**Priority: MEDIUM** - Enhance developer experience

#### 3.4.1 Eligibility Check

```typescript
async checkClaimEligibility(address: string): Promise<EligibilityCheck> {
  const isSubstrate = address.startsWith('5');
  const reasons: string[] = [];
  
  // Check if already mapped
  const hasMapping = isSubstrate
    ? (await this.getEvmAddressForSubstrate(address)).isMapped
    : (await this.getSubstrateAddressForEvm(address)).isMapped;
  
  if (hasMapping) {
    reasons.push('Address already has a mapping');
  }
  
  // Check balance
  let currentBalance = 0n;
  let storageFeeRequired = 0n;
  
  if (isSubstrate) {
    const accountData = await this.substrateProvider.api.query.system.account(address);
    currentBalance = BigInt(accountData.data.free.toString());
    storageFeeRequired = await this.getStorageFee();
    
    if (currentBalance < storageFeeRequired) {
      reasons.push(
        `Insufficient balance: has ${currentBalance}, needs ${storageFeeRequired}`
      );
    }
  }
  
  return {
    eligible: reasons.length === 0,
    reasons,
    requirements: {
      hasMapping,
      sufficientBalance: currentBalance >= storageFeeRequired,
      storageFeeRequired,
      currentBalance
    }
  };
}
```

#### 3.4.2 Derive EVM Key from Substrate Account

```typescript
/**
 * Derive an EVM-compatible private key from a Substrate account
 * This allows users to use the same underlying key for both chains
 */
private deriveEvmKeyFromSubstrate(account: KeyringPair): string {
  // Get the raw seed/private key from the Substrate account
  // For sr25519/ed25519 keypairs, we can use the seed
  const seed = account.derive('//evm').secretKey;
  
  // Ensure it's 32 bytes (256 bits) for EVM compatibility
  if (seed.length !== 32) {
    throw new Error('Invalid seed length for EVM key derivation');
  }
  
  // Return as hex string with 0x prefix
  return '0x' + Buffer.from(seed).toString('hex');
}
```

#### 3.4.3 Cost Estimation

```typescript
async estimateClaimCost(): Promise<CostEstimate> {
  const storageFee = await this.getStorageFee();
  
  // Get payment info for the extrinsic
  const dummyAccount = new Keyring({ type: 'sr25519' }).addFromUri('//Alice');
  const tx = this.substrateProvider.api.tx.unifiedAccounts.claimDefaultEvmAddress();
  const paymentInfo = await tx.paymentInfo(dummyAccount);
  
  return {
    storageFee,
    estimatedTxFee: BigInt(paymentInfo.partialFee.toString()),
    estimatedTotal: storageFee + BigInt(paymentInfo.partialFee.toString())
  };
}
```

### 3.5 Phase 5: SDK Integration

**Priority: HIGH** - Make accessible through main SDK class

```typescript
// src/sdk.ts
export class SelendraSDK {
  public unifiedAccounts?: UnifiedAccountsManager;
  
  async connect() {
    // ... existing connection logic
    
    // Initialize unified accounts if both providers available
    if (this.substrateProvider && this.evmProvider) {
      const genesisHash = await this.substrateProvider.api.genesisHash.toHex();
      this.unifiedAccounts = new UnifiedAccountsManager(
        this.substrateProvider,
        this.evmProvider,
        this.config.chainId || 1961
      );
    }
  }
  
  // Convenience methods
  async getUnifiedMapping(address: string): Promise<MappingInfo> {
    if (!this.unifiedAccounts) {
      throw new Error('Unified accounts not available');
    }
    return this.unifiedAccounts.getMappingInfo(address);
  }
  
  async claimUnifiedAccount(
    substrateAccount: KeyringPair,
    evmPrivateKey?: string,
    options?: TransactionOptions
  ): Promise<ClaimResult> {
    if (!this.unifiedAccounts) {
      throw new Error('Unified accounts not available');
    }
    
    if (evmPrivateKey) {
      return this.unifiedAccounts.claimEvmAddress(
        substrateAccount,
        evmPrivateKey,
        options
      );
    } else {
      return this.unifiedAccounts.claimDefaultEvmAddress(
        substrateAccount,
        options
      );
    }
  }
}
```

---

## 4. Testing Strategy

### 4.1 Unit Tests

```typescript
describe('UnifiedAccountsManager', () => {
  describe('Address Calculations', () => {
    it('should calculate default EVM address from Substrate address');
    it('should calculate default Substrate address from EVM address');
    it('should produce deterministic results');
  });
  
  describe('EIP-712 Signatures', () => {
    it('should build correct domain separator');
    it('should build correct args hash');
    it('should generate valid signature');
    it('should match on-chain verification');
  });
  
  describe('Storage Queries', () => {
    it('should query existing mappings');
    it('should return null for non-existent mappings');
    it('should get storage fee from constants');
  });
});
```

### 4.2 Integration Tests

```typescript
describe('Unified Accounts Integration', () => {
  it('should claim default EVM address');
  it('should claim custom EVM address with signature');
  it('should reject already mapped accounts');
  it('should reject insufficient balance');
  it('should transfer balance from default account');
  it('should emit AccountClaimed event');
  it('should create bidirectional mappings');
});
```

### 4.3 Example Usage Tests

```typescript
// examples/unified/01-check-mapping.ts
// examples/unified/02-claim-default.ts
// examples/unified/03-claim-custom.ts
// examples/unified/04-mapping-info.ts
```

---

## 5. Documentation Plan

### 5.1 API Documentation

- JSDoc comments for all public methods
- Type definitions with descriptions
- Parameter validation details
- Return value specifications

### 5.2 User Guides

1. **Getting Started with Unified Accounts**
   - What are unified accounts?
   - Benefits and use cases
   - Important warnings

2. **Claiming Your Unified Account**
   - Step-by-step guide for default claiming (deterministic address)
   - Step-by-step guide for same-key claiming (derive EVM from Substrate)
   - Step-by-step guide for custom EVM claiming (separate private key)
   - Signature generation tutorial

3. **Checking Mappings**
   - Query existing mappings
   - Understanding default vs mapped addresses
   - Eligibility checks

4. **Advanced Topics**
   - EIP-712 signature details
   - Cost estimation
   - Asset migration before claiming

### 5.3 Code Examples

```typescript
// Example 1: Check if address has mapping
const mapping = await sdk.unifiedAccounts.getMappingInfo(address);
console.log(`Mapped: ${mapping.isMapped}`);
console.log(`Mapped to: ${mapping.mappedTo}`);

// Example 2: Claim default EVM address (deterministically generated)
const result = await sdk.claimUnifiedAccount(
  substrateAccount,
  undefined, // no custom EVM key = use default address
  { waitForFinalization: true }
);

// Example 3: Claim with same key for both Substrate and EVM
// This derives the EVM key from the Substrate account
const result = await sdk.unifiedAccounts.claimEvmAddress(
  substrateAccount,
  undefined, // no separate EVM key = derive from substrate key
  { waitForFinalization: true }
);

// Example 4: Claim custom EVM address (specific private key)
const result = await sdk.unifiedAccounts.claimEvmAddress(
  substrateAccount,
  '0x1234...', // specific EVM private key
  { waitForFinalization: true }
);

// Example 5: Check eligibility before claiming
const check = await sdk.unifiedAccounts.checkClaimEligibility(address);
if (!check.eligible) {
  console.error('Cannot claim:', check.reasons);
}
```

---

## 6. Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create module structure
- [ ] Define TypeScript types
- [ ] Implement address calculation utilities
- [ ] Setup unit test framework

### Phase 2: Query Functions (Week 1)
- [ ] Implement storage query methods
- [ ] Implement default address calculations
- [ ] Add eligibility checks
- [ ] Write unit tests

### Phase 3: EIP-712 Signatures (Week 2)
- [ ] Implement domain separator builder
- [ ] Implement args hash builder
- [ ] Implement signature generation
- [ ] Verify against on-chain logic
- [ ] Write signature tests

### Phase 4: Transaction Methods (Week 2)
- [ ] Implement claimEvmAddress
- [ ] Implement claimDefaultEvmAddress
- [ ] Add error handling
- [ ] Add event parsing
- [ ] Write integration tests

### Phase 5: SDK Integration (Week 3)
- [ ] Integrate into main SDK class
- [ ] Add convenience methods
- [ ] Update SDK configuration
- [ ] Test end-to-end flows

### Phase 6: Documentation & Examples (Week 3)
- [ ] Write API documentation
- [ ] Create user guides
- [ ] Build example scripts
- [ ] Add troubleshooting guide

### Phase 7: Testing & Refinement (Week 4)
- [ ] Comprehensive testing on testnet
- [ ] Performance optimization
- [ ] Security review
- [ ] Final documentation polish

---

## 7. Security Considerations

### 7.1 Private Key Handling

- **Never log private keys**
- Store EVM private keys in environment variables
- Use secure key derivation for Substrate accounts
- Clear sensitive data from memory after use

### 7.2 Signature Verification

- Verify EIP-712 signature locally before sending
- Match signature format exactly with on-chain verification
- Validate EVM address derived from signature

### 7.3 Transaction Safety

- Always check eligibility before claiming
- Verify balance sufficiency
- Implement proper error handling
- Provide clear user warnings about permanence

### 7.4 User Protection

- Display clear warnings about:
  - Permanent mappings (cannot be changed)
  - Asset transfer requirements
  - Risk of lost funds if assets not migrated
- Implement confirmation flows for UI integrations

---

## 8. Dependencies

### 8.1 Required Packages

```json
{
  "dependencies": {
    "@polkadot/api": "^16.5.2",
    "@polkadot/util": "^14.2.3",
    "@polkadot/util-crypto": "^14.2.3",
    "ethers": "^6.13.2"
  }
}
```

### 8.2 Runtime Requirements

- Selendra runtime with `pallet-unified-accounts` v0.1.0+
- Chain ID: 1961 (testnet) or production chain ID
- Access to genesis block hash for EIP-712 salt

---

## 9. Error Handling

### 9.1 Common Errors

```typescript
enum UnifiedAccountError {
  ALREADY_MAPPED = 'Address already has a mapping',
  INVALID_SIGNATURE = 'EIP-712 signature verification failed',
  INSUFFICIENT_BALANCE = 'Insufficient balance for storage fee',
  UNEXPECTED_SIGNATURE_FORMAT = 'Malformed signature',
  NETWORK_ERROR = 'Failed to communicate with chain',
  BOTH_PROVIDERS_REQUIRED = 'Both Substrate and EVM providers required'
}
```

### 9.2 Error Messages

Provide actionable error messages:
- "Your account already has a unified mapping. Mappings are permanent and cannot be changed."
- "Insufficient balance: You need at least X SEL to pay the storage fee."
- "Invalid signature: The EVM private key doesn't match the claimed address."

---

## 10. Future Enhancements

### 10.1 Potential Features

1. **Batch Operations**: Support checking multiple addresses at once
2. **Event Monitoring**: Subscribe to AccountClaimed events
3. **Migration Helpers**: Tools to transfer assets before claiming
4. **UI Components**: React hooks for unified account management
5. **Multi-Chain Support**: Extend to other parachains with unified accounts
6. **Analytics**: Track unified account adoption

### 10.2 Advanced Features

1. **Smart Claiming**: Automatically detect and migrate assets
2. **Account Abstraction**: Higher-level APIs for seamless cross-VM operations
3. **Batch Transfers**: Combined claim + asset migration transactions
4. **Gasless Claims**: Meta-transaction support for claiming

---

## 11. Success Metrics

### 11.1 Technical Metrics

- 100% test coverage for core functionality
- < 100ms query response time
- < 3 second transaction confirmation time
- Zero security vulnerabilities

### 11.2 User Metrics

- Clear documentation (< 5 min to understand)
- Simple API (< 10 lines of code for basic claim)
- Comprehensive error messages
- No reported fund losses

---

## 12. References

### 12.1 Source Code

- Pallet: `/home/msi/Project/selendra/pallets/unified-accounts/src/lib.rs`
- Tests: `/home/msi/Project/selendra/pallets/unified-accounts/src/tests.rs`
- Primitives: `/home/msi/Project/selendra/primitives/src/evm.rs`

### 12.2 Standards

- [EIP-712: Typed Structured Data Hashing and Signing](https://eips.ethereum.org/EIPS/eip-712)
- [Polkadot.js API Documentation](https://polkadot.js.org/docs/)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)

### 12.3 Inspiration

- [Astar Network EVM Accounts Pallet](https://github.com/AcalaNetwork/Acala/tree/master/modules/evm-accounts)
- Similar implementations in other Substrate-EVM chains

---

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating Selendra's unified accounts functionality into the TypeScript SDK. The phased approach ensures systematic development with proper testing and documentation at each stage.

**Key Success Factors**:
1. **Security First**: Proper signature handling and user warnings
2. **Developer Experience**: Simple, intuitive API
3. **Comprehensive Testing**: Both unit and integration tests
4. **Clear Documentation**: Easy to understand and use
5. **Future-Proof**: Extensible architecture for enhancements

The unified accounts feature will enable seamless cross-VM operations, enhancing the Selendra ecosystem's usability and developer experience.
