# Selendra SDK - Development Tasks

> **Vibes-based development** - No timelines, no budgets, just code.

---

## 🔴 Priority 1: Critical (Do First)

### P1-01: Democracy Pallet
**Location:** `src/pallets/democracy/`
**Status:** ⬜ Not Started
**Reference:** `old/typescript/src/substrate/democracy.ts` (661 lines)

**Files to create:**
- [ ] `index.ts` - exports
- [ ] `client.ts` - DemocracyManager class
- [ ] `queries.ts` - DemocracyQueries class
- [ ] `types.ts` - TypeScript interfaces

**Methods:**
```typescript
// Extrinsics
propose(proposalHash, value)
second(proposal)
vote(refIndex, vote)
delegate(to, conviction, balance)
undelegate()
removeVote(index)
emergencyCancel(refIndex)

// Queries
getActiveReferenda()
getProposals()
getVotingOf(account)
getDepositOf(proposalIndex)
getReferendumInfo(refIndex)
```

---

### P1-02: Council Pallet (Collective Instance 1)
**Location:** `src/pallets/council/`
**Status:** ⬜ Not Started

**Files to create:**
- [ ] `index.ts`
- [ ] `client.ts` - CouncilManager class
- [ ] `queries.ts`
- [ ] `types.ts`

**Methods:**
```typescript
// Extrinsics
propose(threshold, proposal, lengthBound)
vote(proposalHash, index, approve)
close(proposalHash, index, weightBound, lengthBound)
disapproveProposal(proposalHash)

// Queries
getMembers()
getProposals()
getProposalOf(hash)
getVoting(hash)
getProposalCount()
```

---

### P1-03: Treasury Pallet
**Location:** `src/pallets/treasury/`
**Status:** ⬜ Not Started

**Files to create:**
- [ ] `index.ts`
- [ ] `client.ts` - TreasuryManager class
- [ ] `queries.ts`
- [ ] `types.ts`

**Methods:**
```typescript
// Extrinsics
proposeSpend(value, beneficiary)
rejectProposal(proposalId)
approveProposal(proposalId)

// Queries
getProposals()
getApprovals()
getPot()
getProposalCount()
```

---

### P1-04: Council Elections (Phragmen)
**Location:** `src/pallets/elections-phragmen/`
**Status:** ⬜ Not Started

**Files to create:**
- [ ] `index.ts`
- [ ] `client.ts` - CouncilElectionsManager class
- [ ] `queries.ts`
- [ ] `types.ts`

**Methods:**
```typescript
// Extrinsics
vote(votes, value)
removeVoter()
submitCandidacy(candidateCount)
renounceCandidacy(renouncing)
removeMember(who, slashBond, rerunElection)

// Queries
getMembers()
getRunnersUp()
getCandidates()
getVotingOf(account)
getElectionRounds()
```

---

### P1-05: Wire Up Governance to SDK
**Location:** `src/core/sdk.ts`
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Add lazy-loaded `democracy` property
- [ ] Add lazy-loaded `council` property
- [ ] Add lazy-loaded `treasury` property
- [ ] Add lazy-loaded `councilElections` property
- [ ] Export types from `src/index.ts`

---

## 🟠 Priority 2: High (Do Second)

### P2-01: Nomination Pools
**Location:** `src/pallets/nomination-pools/`
**Status:** ⬜ Not Started

**Files to create:**
- [ ] `index.ts`
- [ ] `client.ts` - NominationPoolsManager class
- [ ] `queries.ts`
- [ ] `types.ts`

**Methods:**
```typescript
// Pool Operations
create(amount, root, nominator, bouncer)
join(amount, poolId)
bondExtra(extra)
claimPayout()
unbond(memberAccount, unbondingPoints)
withdrawUnbonded(memberAccount, numSlashingSpans)
poolWithdrawUnbonded(poolId, numSlashingSpans)

// Pool Management
setMetadata(poolId, metadata)
setConfigs(configs)
nominate(poolId, validators)
setState(poolId, state)
chill(poolId)

// Queries
getPools()
getPoolMembers(poolId)
getBondedPools()
getRewardPools()
getSubPoolsStorage(poolId)
getPendingRewards(member)
getMinJoinBond()
getMinCreateBond()
```

---

### P2-02: Aleph Elections & Committee
**Location:** `src/pallets/aleph/`
**Status:** ⬜ Not Started

**Files to create:**
- [ ] `index.ts`
- [ ] `client.ts` - AlephManager class
- [ ] `queries.ts`
- [ ] `types.ts`

**Methods:**
```typescript
// Queries (mostly read-only for SDK users)
getCurrentEraValidators()
getNextEraValidators()
getReservedValidators()
getNonReservedValidators()
getSessionValidators()
getSessionPeriod()
getMillisecsPerBlock()

// Events
subscribeToSessionChange(callback)
subscribeToEraChange(callback)
```

**Reference:** `old/typescript/src/substrate/aleph.ts`

---

### P2-03: Technical Committee (Collective Instance 2)
**Location:** `src/pallets/technical-committee/`
**Status:** ⬜ Not Started

**Note:** Similar to Council, but different instance. Consider shared base class.

---

### P2-04: Governance Examples
**Location:** `examples/governance/`
**Status:** ⬜ Not Started

**Files to create:**
- [ ] `01-democracy-demo.ts` - Create proposal, vote, check results
- [ ] `02-council-demo.ts` - Council operations
- [ ] `03-treasury-demo.ts` - Treasury proposals
- [ ] `README.md`

---

## 🟡 Priority 3: Medium (Do When P1 & P2 Done)

### P3-01: Identity Pallet
**Location:** `src/pallets/identity/`
**Status:** ⬜ Not Started

**Methods:**
```typescript
// Extrinsics
setIdentity(info)
setSubs(subs)
clearIdentity()
requestJudgement(regIndex, maxFee)
cancelRequest(regIndex)
setFee(index, fee)
setAccountId(index, new)
setFields(index, fields)
provideJudgement(regIndex, target, judgement, identity)
killIdentity(target)
addSub(sub, data)
renameSub(sub, data)
removeSub(sub)
quitSub()

// Queries
getIdentityOf(account)
getSuperOf(account)
getSubsOf(account)
getRegistrars()
```

---

### P3-02: Vesting Pallet
**Location:** `src/pallets/vesting/`
**Status:** ⬜ Not Started

**Methods:**
```typescript
// Extrinsics
vest()
vestOther(target)
vestedTransfer(target, schedule)
forceVestedTransfer(source, target, schedule)
mergeSchedules(schedule1Index, schedule2Index)

// Queries
getVesting(account)
getStorageVersion()
```

---

### P3-03: Proxy Pallet
**Location:** `src/pallets/proxy/`
**Status:** ⬜ Not Started

**Methods:**
```typescript
// Extrinsics
proxy(real, forceProxyType, call)
addProxy(delegate, proxyType, delay)
removeProxy(delegate, proxyType, delay)
removeProxies()
createPure(proxyType, delay, index)
killPure(spawner, proxyType, index, height, extIndex)
announce(real, callHash)
removeAnnouncement(real, callHash)
rejectAnnouncement(delegate, callHash)
proxyAnnounced(delegate, real, forceProxyType, call)

// Queries
getProxies(account)
getAnnouncements(account)
```

---

### P3-04: Multisig Pallet
**Location:** `src/pallets/multisig/`
**Status:** ⬜ Not Started

**Methods:**
```typescript
// Extrinsics
asMultiThreshold1(otherSignatories, call)
asMulti(threshold, otherSignatories, maybeTimepoint, call, maxWeight)
approveAsMulti(threshold, otherSignatories, maybeTimepoint, callHash, maxWeight)
cancelAsMulti(threshold, otherSignatories, timepoint, callHash)

// Queries
getMultisigs(account)

// Helpers
deriveMultisigAddress(signatories, threshold)
```

---

### P3-05: Account Management Examples
**Location:** `examples/accounts/`
**Status:** ⬜ Not Started

**Files to create:**
- [ ] `01-identity-demo.ts`
- [ ] `02-vesting-demo.ts`
- [ ] `03-proxy-demo.ts`
- [ ] `04-multisig-demo.ts`
- [ ] `README.md`

---

## 🟢 Priority 4: Low (Nice to Have)

### P4-01: Contracts Pallet (ink!)
**Location:** `src/pallets/contracts/`
**Status:** ⬜ Not Started

**Methods:**
```typescript
// Extrinsics
uploadCode(code, storageDepositLimit, determinism)
removeCode(codeHash)
setCode(dest, codeHash)
instantiate(value, gasLimit, storageDepositLimit, codeHash, data, salt)
instantiateWithCode(value, gasLimit, storageDepositLimit, code, data, salt)
call(dest, value, gasLimit, storageDepositLimit, data)

// Queries
getContractInfo(address)
getCodeStorage(codeHash)
getPristineCode(codeHash)
getOwnerInfoOf(codeHash)

// Dry-run
dryRunCall(origin, dest, value, gasLimit, storageDepositLimit, inputData)
dryRunInstantiate(origin, value, gasLimit, storageDepositLimit, code, data, salt)
```

---

### P4-02: XVM Pallet (Cross-VM)
**Location:** `src/pallets/xvm/`
**Status:** ⬜ Not Started

**Methods:**
```typescript
// Extrinsics
xvmCall(context, target, input, value, metadata)

// Queries
// TBD based on pallet implementation
```

---

### P4-03: Scheduler Pallet
**Location:** `src/pallets/scheduler/`
**Status:** ⬜ Not Started

**Methods:**
```typescript
// Extrinsics
schedule(when, maybePeriodic, priority, call)
cancel(when, index)
scheduleNamed(id, when, maybePeriodic, priority, call)
cancelNamed(id)
scheduleAfter(after, maybePeriodic, priority, call)
scheduleNamedAfter(id, after, maybePeriodic, priority, call)

// Queries
getAgenda(blockNumber)
getLookup(id)
```

---

### P4-04: React Hooks Package
**Location:** `src/react/`
**Status:** ⬜ Not Started

**Hooks to create:**
- [ ] `useSelendra()` - Core SDK access
- [ ] `useAccount()` - Account management
- [ ] `useBalance(address?)` - Balance with auto-refresh
- [ ] `useStaking()` - Staking operations
- [ ] `useGovernance()` - Governance operations
- [ ] `useUnifiedAccounts()` - Cross-chain accounts
- [ ] `useTransaction()` - Transaction management
- [ ] `useNominationPools()` - Pool operations

**Components:**
- [ ] `SelendraProvider` - Context provider
- [ ] `ConnectButton` - Wallet connection
- [ ] `AccountSelector` - Account picker
- [ ] `BalanceDisplay` - Format balance
- [ ] `TransactionStatus` - Tx progress

---

## ⚪ Priority 5: Maintenance & Polish

### P5-01: Testing Infrastructure
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Set up Jest configuration
- [ ] Create mock providers for unit tests
- [ ] Write unit tests for each pallet (>80% coverage goal)
- [ ] Create integration test suite for testnet
- [ ] Add CI/CD pipeline with GitHub Actions

---

### P5-02: Documentation
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Set up TypeDoc for API generation
- [ ] Write getting started guide
- [ ] Write migration guide from old SDK
- [ ] Create tutorial: "Build a Wallet"
- [ ] Create tutorial: "Build a Staking Dashboard"
- [ ] Create tutorial: "Build a Governance dApp"

---

### P5-03: Package Publishing
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Finalize package.json exports
- [ ] Create CHANGELOG.md
- [ ] Set up npm publishing workflow
- [ ] Create GitHub releases
- [ ] Add badges to README

---

### P5-04: Developer Experience
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Add better error messages
- [ ] Add input validation helpers
- [ ] Create CLI tool for scaffolding
- [ ] Add debug mode with detailed logging
- [ ] Create VS Code snippets

---

## Task Template

When starting a new pallet, copy this structure:

```
src/pallets/{pallet-name}/
├── index.ts       # Re-exports
├── client.ts      # {PalletName}Manager class with extrinsics
├── queries.ts     # {PalletName}Queries class with storage queries
└── types.ts       # TypeScript interfaces and types
```

**client.ts template:**
```typescript
import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import { {PalletName}Queries } from './queries.js';

export class {PalletName}Manager {
  public queries: {PalletName}Queries;

  constructor(private api: ApiPromise) {
    this.queries = new {PalletName}Queries(api);
  }

  // Add extrinsic methods here
}
```

**queries.ts template:**
```typescript
import type { ApiPromise } from '@polkadot/api';

export class {PalletName}Queries {
  constructor(private api: ApiPromise) {}

  // Add query methods here
}
```

---

## Progress Tracker

| Priority | Total | Done | Progress |
|----------|-------|------|----------|
| 🔴 P1 | 5 | 0 | ⬜⬜⬜⬜⬜ |
| 🟠 P2 | 4 | 0 | ⬜⬜⬜⬜ |
| 🟡 P3 | 5 | 0 | ⬜⬜⬜⬜⬜ |
| 🟢 P4 | 4 | 0 | ⬜⬜⬜⬜ |
| ⚪ P5 | 4 | 0 | ⬜⬜⬜⬜ |

**Overall:** 0/22 tasks complete

---

*Let's vibe and code.* 🚀
