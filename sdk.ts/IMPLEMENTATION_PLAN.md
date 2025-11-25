# Selendra TypeScript SDK - Implementation Plan

## Executive Summary

This document outlines the development roadmap for the Selendra TypeScript SDK (`@selendrajs/sdk-core`). The SDK provides a modular, type-safe interface for interacting with the Selendra blockchain, supporting both Substrate and EVM chains.

---

## 1. Current State Assessment

### ✅ Completed Modules

| Module | Location | Status | Description |
|--------|----------|--------|-------------|
| **Core SDK** | `src/core/` | 100% | Connection management, event handling |
| **Substrate Provider** | `src/providers/substrate.ts` | 100% | WebSocket connection, transfers |
| **EVM Provider** | `src/providers/evm.ts` | 100% | JSON-RPC, ERC20, contracts |
| **Unified Accounts** | `src/unified/` | 100% | Substrate ↔ EVM address mapping |
| **Balances Pallet** | `src/pallets/balances/` | 100% | Transfers, queries, locks |
| **Staking Pallet** | `src/pallets/staking/` | 100% | Bond, nominate, validate, rewards |
| **Wallet Utilities** | `src/utils/wallet.ts` | 100% | Key management, encryption |
| **Logger** | `src/utils/logger.ts` | 100% | Debug logging, warning suppression |

### 📁 Project Structure

```
sdk.ts/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── core/
│   │   ├── sdk.ts              # SelendraSDK class
│   │   └── factory.ts          # Factory functions
│   ├── providers/
│   │   ├── base.ts             # BaseProvider abstract class
│   │   ├── substrate.ts        # SubstrateProvider
│   │   └── evm.ts              # EvmProvider
│   ├── pallets/
│   │   ├── balances/           # ✅ Complete
│   │   └── staking/            # ✅ Complete
│   ├── unified/                # ✅ Complete
│   ├── types/                  # ✅ Complete
│   └── utils/                  # ✅ Complete
├── examples/                   # Working examples
└── docs/                       # Documentation
```

---

## 2. Gap Analysis: Missing Pallets

Based on Selendra's runtime (`bin/runtime/src/lib.rs`), the following pallets need SDK support:

### High Priority (Governance)

| Pallet | Index | Use Case |
|--------|-------|----------|
| `pallet_democracy` | 32 | Referenda, proposals, voting |
| `pallet_collective` (Council) | 30 | Council proposals, motions |
| `pallet_collective` (TechnicalCommittee) | 31 | Technical governance |
| `pallet_elections_phragmen` | 33 | Council elections |
| `pallet_treasury` | 16 | Spending proposals |

### Medium Priority (Staking Extended)

| Pallet | Index | Use Case |
|--------|-------|----------|
| `pallet_nomination_pools` | 18 | Pool-based staking |
| `pallet_elections` (Aleph) | 14 | Validator elections |
| `pallet_committee_management` | 15 | Committee management |

### Lower Priority (Utilities)

| Pallet | Index | Use Case |
|--------|-------|----------|
| `pallet_identity` | 52 | On-chain identity |
| `pallet_vesting` | 53 | Token vesting |
| `pallet_multisig` | 51 | Multi-signature accounts |
| `pallet_proxy` | 59 | Account proxies |
| `pallet_contracts` | 90 | ink! smart contracts |

### Selendra-Specific

| Pallet | Index | Use Case |
|--------|-------|----------|
| `pallet_aleph` | 2 | AlephBFT consensus |
| `pallet_operations` | 155 | Chain operations |
| `pallet_xvm` | 89 | Cross-VM calls |
| `pallet_ethereum_checked` | 88 | Ethereum compatibility |

---

## 3. Implementation Phases

### Phase 1: Governance Pallets (Weeks 1-3)

**Goal:** Enable full governance participation through the SDK.

#### 1.1 Democracy Pallet (`src/pallets/democracy/`)

```typescript
// File structure
src/pallets/democracy/
├── index.ts
├── client.ts      // DemocracyManager class
├── queries.ts     // DemocracyQueries class
└── types.ts       // Type definitions

// Key methods
class DemocracyManager {
  // Extrinsics
  propose(proposalHash: string, value: bigint): Extrinsic;
  second(proposal: number): Extrinsic;
  vote(refIndex: number, vote: AccountVote): Extrinsic;
  delegate(to: string, conviction: Conviction, balance: bigint): Extrinsic;
  undelegate(): Extrinsic;
  removeVote(index: number): Extrinsic;
  
  // Helpers
  async getActiveReferenda(): Promise<ReferendumInfo[]>;
  async getProposals(): Promise<ProposalInfo[]>;
  async getVotingOf(account: string): Promise<VotingInfo>;
}
```

**Reference:** Port from `old/typescript/src/substrate/democracy.ts` (661 lines)

#### 1.2 Council Pallet (`src/pallets/council/`)

```typescript
class CouncilManager {
  // Extrinsics
  propose(threshold: number, proposal: RuntimeCall, lengthBound: number): Extrinsic;
  vote(proposalHash: string, index: number, approve: boolean): Extrinsic;
  close(proposalHash: string, index: number, weightBound: Weight, lengthBound: number): Extrinsic;
  
  // Queries
  async getMembers(): Promise<string[]>;
  async getProposals(): Promise<CouncilProposal[]>;
  async getProposalOf(hash: string): Promise<RuntimeCall | null>;
}
```

#### 1.3 Treasury Pallet (`src/pallets/treasury/`)

```typescript
class TreasuryManager {
  // Extrinsics
  proposeSpend(value: bigint, beneficiary: string): Extrinsic;
  rejectProposal(proposalId: number): Extrinsic;
  approveProposal(proposalId: number): Extrinsic;
  
  // Queries
  async getProposals(): Promise<TreasuryProposal[]>;
  async getPot(): Promise<bigint>;
}
```

#### 1.4 Elections Phragmen (`src/pallets/elections-phragmen/`)

```typescript
class CouncilElectionsManager {
  // Extrinsics
  vote(votes: string[], value: bigint): Extrinsic;
  removeVoter(): Extrinsic;
  submitCandidacy(candidateCount: number): Extrinsic;
  renounceCandidacy(renouncing: Renouncing): Extrinsic;
  
  // Queries
  async getMembers(): Promise<SeatHolder[]>;
  async getRunnersUp(): Promise<SeatHolder[]>;
  async getCandidates(): Promise<string[]>;
}
```

**Deliverables:**
- [ ] Democracy pallet implementation
- [ ] Council pallet implementation
- [ ] Treasury pallet implementation
- [ ] Elections Phragmen implementation
- [ ] Integration tests
- [ ] Example: `examples/governance/governance-demo.ts`

---

### Phase 2: Extended Staking (Weeks 4-5)

**Goal:** Support nomination pools and Selendra-specific election mechanics.

#### 2.1 Nomination Pools (`src/pallets/nomination-pools/`)

```typescript
class NominationPoolsManager {
  // Pool Operations
  create(amount: bigint, root: string, nominator: string, bouncer: string): Extrinsic;
  join(amount: bigint, poolId: number): Extrinsic;
  bondExtra(extra: BondExtra): Extrinsic;
  claimPayout(): Extrinsic;
  unbond(memberAccount: string, unbondingPoints: bigint): Extrinsic;
  withdrawUnbonded(memberAccount: string, numSlashingSpans: number): Extrinsic;
  
  // Pool Management
  setMetadata(poolId: number, metadata: Uint8Array): Extrinsic;
  setConfigs(configs: PoolConfigs): Extrinsic;
  nominate(poolId: number, validators: string[]): Extrinsic;
  
  // Queries
  async getPools(): Promise<PoolInfo[]>;
  async getPoolMembers(poolId: number): Promise<PoolMember[]>;
  async getPendingRewards(member: string): Promise<bigint>;
}
```

#### 2.2 Aleph Elections (`src/pallets/aleph-elections/`)

```typescript
class AlephElectionsManager {
  // Queries
  async getCurrentEraValidators(): Promise<string[]>;
  async getNextEraValidators(): Promise<string[]>;
  async getReservedValidators(): Promise<string[]>;
  async getNonReservedValidators(): Promise<string[]>;
  
  // Events
  onSessionChanged(callback: (session: number) => void): Unsubscribe;
}
```

**Deliverables:**
- [ ] Nomination pools implementation
- [ ] Aleph elections queries
- [ ] Example: `examples/staking/nomination-pools-demo.ts`

---

### Phase 3: Account Management (Week 6)

**Goal:** Identity, vesting, and multi-account features.

#### 3.1 Identity Pallet (`src/pallets/identity/`)

```typescript
class IdentityManager {
  setIdentity(info: IdentityInfo): Extrinsic;
  setSubs(subs: [string, Data][]): Extrinsic;
  clearIdentity(): Extrinsic;
  requestJudgement(regIndex: number, maxFee: bigint): Extrinsic;
  cancelRequest(regIndex: number): Extrinsic;
  
  // Registrar operations
  provideJudgement(regIndex: number, target: string, judgement: Judgement): Extrinsic;
  
  // Queries
  async getIdentityOf(account: string): Promise<Registration | null>;
  async getRegistrars(): Promise<RegistrarInfo[]>;
}
```

#### 3.2 Vesting Pallet (`src/pallets/vesting/`)

```typescript
class VestingManager {
  vest(): Extrinsic;
  vestOther(target: string): Extrinsic;
  vestedTransfer(target: string, schedule: VestingSchedule): Extrinsic;
  
  async getVesting(account: string): Promise<VestingInfo[]>;
}
```

#### 3.3 Proxy Pallet (`src/pallets/proxy/`)

```typescript
class ProxyManager {
  addProxy(delegate: string, proxyType: ProxyType, delay: number): Extrinsic;
  removeProxy(delegate: string, proxyType: ProxyType, delay: number): Extrinsic;
  proxy(real: string, forceProxyType: ProxyType | null, call: RuntimeCall): Extrinsic;
  
  async getProxies(account: string): Promise<ProxyDefinition[]>;
}
```

#### 3.4 Multisig Pallet (`src/pallets/multisig/`)

```typescript
class MultisigManager {
  asMulti(threshold: number, otherSignatories: string[], maybeTimepoint: Timepoint | null, call: RuntimeCall, maxWeight: Weight): Extrinsic;
  approveAsMulti(threshold: number, otherSignatories: string[], maybeTimepoint: Timepoint | null, callHash: string, maxWeight: Weight): Extrinsic;
  cancelAsMulti(threshold: number, otherSignatories: string[], timepoint: Timepoint, callHash: string): Extrinsic;
  
  async getMultisigs(account: string): Promise<MultisigInfo[]>;
}
```

**Deliverables:**
- [ ] Identity pallet implementation
- [ ] Vesting pallet implementation
- [ ] Proxy pallet implementation
- [ ] Multisig pallet implementation

---

### Phase 4: Smart Contracts (Weeks 7-8)

**Goal:** Full support for ink! smart contracts.

#### 4.1 Contracts Pallet (`src/pallets/contracts/`)

```typescript
class ContractsManager {
  // Deployment
  uploadCode(code: Uint8Array, storageDepositLimit: bigint | null): Extrinsic;
  instantiate(value: bigint, gasLimit: Weight, storageDepositLimit: bigint | null, codeHash: string, data: Uint8Array, salt: Uint8Array): Extrinsic;
  instantiateWithCode(value: bigint, gasLimit: Weight, storageDepositLimit: bigint | null, code: Uint8Array, data: Uint8Array, salt: Uint8Array): Extrinsic;
  
  // Execution
  call(dest: string, value: bigint, gasLimit: Weight, storageDepositLimit: bigint | null, data: Uint8Array): Extrinsic;
  
  // Queries
  async getContractInfo(address: string): Promise<ContractInfo | null>;
  async getCodeStorage(codeHash: string): Promise<Uint8Array | null>;
  
  // Dry-run
  async dryRunCall(origin: string, dest: string, value: bigint, gasLimit: Weight | null, storageDepositLimit: bigint | null, inputData: Uint8Array): Promise<ContractExecResult>;
  async dryRunInstantiate(origin: string, value: bigint, gasLimit: Weight | null, storageDepositLimit: bigint | null, code: Code, data: Uint8Array, salt: Uint8Array): Promise<ContractInstantiateResult>;
}
```

**Deliverables:**
- [ ] Contracts pallet implementation
- [ ] Contract ABI parsing utilities
- [ ] Example: `examples/contracts/ink-contract-demo.ts`

---

### Phase 5: React Integration (Weeks 9-10)

**Goal:** React hooks and components for dApp development.

#### 5.1 Package Structure

```
src/react/
├── index.ts
├── context/
│   └── SelendraContext.tsx
├── providers/
│   └── SelendraProvider.tsx
├── hooks/
│   ├── useSelendra.ts
│   ├── useAccount.ts
│   ├── useBalance.ts
│   ├── useStaking.ts
│   ├── useGovernance.ts
│   ├── useUnifiedAccounts.ts
│   └── useTransaction.ts
└── components/
    ├── ConnectButton.tsx
    ├── AccountSelector.tsx
    ├── BalanceDisplay.tsx
    └── TransactionStatus.tsx
```

#### 5.2 Hook Implementations

```typescript
// useSelendra - Core SDK access
function useSelendra(): {
  sdk: SelendraSDK | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

// useAccount - Account management
function useAccount(): {
  account: Account | null;
  accounts: Account[];
  selectAccount: (address: string) => void;
  balance: bigint;
};

// useBalance - Balance queries with auto-refresh
function useBalance(address?: string): {
  balance: BalanceInfo | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

// useStaking - Staking operations
function useStaking(): {
  stakingInfo: StakingInfo | null;
  bond: (amount: bigint) => Promise<string>;
  unbond: (amount: bigint) => Promise<string>;
  nominate: (validators: string[]) => Promise<string>;
};

// useGovernance - Governance operations
function useGovernance(): {
  referenda: ReferendumInfo[];
  proposals: ProposalInfo[];
  vote: (refIndex: number, vote: AccountVote) => Promise<string>;
};

// useUnifiedAccounts - Cross-chain accounts
function useUnifiedAccounts(): {
  mappingInfo: MappingInfo | null;
  claimDefaultEvmAddress: () => Promise<ClaimResult>;
  claimEvmAddress: (evmPrivateKey: string) => Promise<ClaimResult>;
};

// useTransaction - Transaction management
function useTransaction(): {
  submit: (extrinsic: Extrinsic) => Promise<TransactionResult>;
  status: TransactionStatus;
  isLoading: boolean;
};
```

**Deliverables:**
- [ ] SelendraProvider component
- [ ] All hooks implemented
- [ ] UI components (optional)
- [ ] Example: `examples/react/react-app-demo.tsx`

---

### Phase 6: Testing & Documentation (Weeks 11-12)

#### 6.1 Testing Strategy

```
tests/
├── unit/
│   ├── pallets/
│   │   ├── balances.test.ts
│   │   ├── staking.test.ts
│   │   ├── democracy.test.ts
│   │   └── ...
│   ├── providers/
│   │   ├── substrate.test.ts
│   │   └── evm.test.ts
│   └── utils/
│       └── wallet.test.ts
├── integration/
│   ├── testnet-connection.test.ts
│   ├── transfers.test.ts
│   ├── staking-flow.test.ts
│   └── governance-flow.test.ts
└── e2e/
    └── full-workflow.test.ts
```

**Testing Tools:**
- Jest for unit tests
- Testnet for integration tests
- Mock providers for CI

#### 6.2 Documentation

```
docs/
├── api/
│   ├── sdk.md
│   ├── providers.md
│   └── pallets/
│       ├── balances.md
│       ├── staking.md
│       └── ...
├── guides/
│   ├── getting-started.md
│   ├── connecting-to-selendra.md
│   ├── staking-guide.md
│   ├── governance-guide.md
│   └── unified-accounts.md
├── tutorials/
│   ├── build-a-wallet.md
│   ├── build-a-staking-dapp.md
│   └── build-a-governance-dapp.md
└── migration/
    └── from-old-sdk.md
```

**Deliverables:**
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] TypeDoc generated API docs
- [ ] User guides
- [ ] Tutorial examples

---

## 4. SDK API Design

### Main Entry Point

```typescript
import { 
  SelendraSDK, 
  createSDK, 
  ChainType,
  Network 
} from '@selendrajs/sdk-core';

// Create SDK instance
const sdk = createSDK({
  endpoint: 'wss://rpc.selendra.org',
  chainType: ChainType.Substrate,
  network: Network.Selendra,
});

await sdk.connect();

// Access pallets
const balance = await sdk.balances.getBalance(address);
const stakingInfo = await sdk.staking.getStakingInfo(address);
const referenda = await sdk.democracy.getActiveReferenda();

// Unified accounts
const mapping = await sdk.unifiedAccounts.getMappingInfo(address);

// Disconnect
await sdk.disconnect();
```

### Pallet Access Pattern

```typescript
// Each pallet accessible as sdk.{palletName}
sdk.balances      // BalancesManager
sdk.staking       // StakingManager
sdk.democracy     // DemocracyManager
sdk.council       // CouncilManager
sdk.treasury      // TreasuryManager
sdk.identity      // IdentityManager
sdk.vesting       // VestingManager
sdk.proxy         // ProxyManager
sdk.multisig      // MultisigManager
sdk.contracts     // ContractsManager
sdk.nominationPools // NominationPoolsManager
```

### Transaction Pattern

```typescript
// All extrinsics return SubmittableExtrinsic
const tx = sdk.staking.bond({ value: 1000n, payee: 'Staked' });

// Sign and send with KeyringPair
const hash = await tx.signAndSend(keypair);

// Or use the SDK's transaction helper
const result = await sdk.submitTransaction(tx, keypair, {
  waitForFinalization: true,
});
```

---

## 5. Package Exports

```json
{
  "name": "@selendrajs/sdk-core",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./core": {
      "import": "./dist/core/index.js",
      "types": "./dist/core/index.d.ts"
    },
    "./providers": {
      "import": "./dist/providers/index.js",
      "types": "./dist/providers/index.d.ts"
    },
    "./pallets/balances": {
      "import": "./dist/pallets/balances/index.js",
      "types": "./dist/pallets/balances/index.d.ts"
    },
    "./pallets/staking": {
      "import": "./dist/pallets/staking/index.js",
      "types": "./dist/pallets/staking/index.d.ts"
    },
    "./pallets/democracy": {
      "import": "./dist/pallets/democracy/index.js",
      "types": "./dist/pallets/democracy/index.d.ts"
    },
    "./pallets/governance": {
      "import": "./dist/pallets/governance/index.js",
      "types": "./dist/pallets/governance/index.d.ts"
    },
    "./unified": {
      "import": "./dist/unified/index.js",
      "types": "./dist/unified/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.js",
      "types": "./dist/react/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    }
  }
}
```

---

## 6. Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Governance** | Weeks 1-3 | Democracy, Council, Treasury, Elections |
| **Phase 2: Extended Staking** | Weeks 4-5 | Nomination Pools, Aleph Elections |
| **Phase 3: Account Management** | Week 6 | Identity, Vesting, Proxy, Multisig |
| **Phase 4: Smart Contracts** | Weeks 7-8 | ink! Contracts support |
| **Phase 5: React Integration** | Weeks 9-10 | Hooks, Components, Provider |
| **Phase 6: Testing & Docs** | Weeks 11-12 | Tests, Documentation, Examples |

**Total Estimated Time:** 12 weeks

---

## 7. Success Criteria

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] ESLint/Prettier configured
- [ ] >80% test coverage
- [ ] All exports tree-shakeable

### Documentation
- [ ] API reference for all public methods
- [ ] Getting started guide
- [ ] Migration guide from old SDK
- [ ] At least 3 tutorials

### Examples
- [ ] Connection examples (Substrate, EVM, Unified)
- [ ] Balance/Transfer examples
- [ ] Staking examples
- [ ] Governance examples
- [ ] React app example

### CI/CD
- [ ] Automated testing on PR
- [ ] Automated npm publishing
- [ ] Version management (semantic versioning)

---

## 8. Dependencies

### Current Dependencies
```json
{
  "@polkadot/api": "^16.5.2",
  "@polkadot/keyring": "^13.5.8",
  "@polkadot/types": "^16.5.2",
  "@polkadot/util": "^13.5.8",
  "@polkadot/util-crypto": "^13.5.8",
  "ethers": "^6.13.2",
  "eventemitter3": "^5.0.1"
}
```

### Additional Dependencies (Phase 5)
```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

### Dev Dependencies
```json
{
  "typescript": "^5.0.0",
  "jest": "^29.0.0",
  "@types/jest": "^29.0.0",
  "ts-jest": "^29.0.0",
  "typedoc": "^0.25.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0"
}
```

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Runtime API changes | High | Version pinning, integration tests |
| Polkadot.js breaking changes | Medium | Lock dependency versions |
| Testnet instability | Medium | Mock providers for unit tests |
| Scope creep | High | Strict phase boundaries |

---

## 10. Getting Started (For Contributors)

```bash
# Clone and setup
cd selendra-sdk/sdk.ts
npm install

# Build
npm run build

# Run examples
cd examples
npm install
npm run connect:substrate

# Run tests
npm test

# Generate docs
npm run docs
```

---

## Appendix A: Reference Implementation

The `old/typescript/src/substrate/` directory contains reference implementations:
- `democracy.ts` - 661 lines, full democracy pallet support
- `staking.ts` - 541 lines, comprehensive staking operations
- `elections.ts` - Aleph elections support
- `aleph.ts` - AlephBFT consensus queries

These should be refactored to match the new modular architecture.

---

## Appendix B: Selendra Runtime Pallets

Complete list from `construct_runtime!`:

```rust
System: frame_system = 0,
Aura: pallet_aura = 1,
Aleph: pallet_aleph = 2,
Timestamp: pallet_timestamp = 3,
Balances: pallet_balances = 4,
TransactionPayment: pallet_transaction_payment = 5,
Scheduler: pallet_scheduler = 6,
Authorship: pallet_authorship = 10,
Staking: pallet_staking = 11,
History: pallet_session::historical = 12,
Session: pallet_session = 13,
Elections: pallet_elections = 14,
CommitteeManagement: pallet_committee_management = 15,
Treasury: pallet_treasury = 16,
NominationPools: pallet_nomination_pools = 18,
Council: pallet_collective::<Instance1> = 30,
TechnicalCommittee: pallet_collective::<Instance2> = 31,
Democracy: pallet_democracy = 32,
CouncilElections: pallet_elections_phragmen = 33,
Preimage: pallet_preimage = 34,
Utility: pallet_utility = 50,
Multisig: pallet_multisig = 51,
Identity: pallet_identity = 52,
Vesting: pallet_vesting = 53,
Proxy: pallet_proxy = 59,
Ethereum: pallet_ethereum = 80,
EVM: pallet_evm = 81,
DynamicEvmBaseFee: pallet_dynamic_evm_base_fee = 83,
UnifiedAccounts: pallet_unified_accounts = 87,
EthereumChecked: pallet_ethereum_checked = 88,
Xvm: pallet_xvm = 89,
Contracts: pallet_contracts = 90,
SafeMode: pallet_safe_mode = 100,
TxPause: pallet_tx_pause = 101,
Operations: pallet_operations = 155,
Sudo: pallet_sudo = 200,
```

---

*Last Updated: November 25, 2025*
*Author: Selendra Team*
