# Selendra SDK - Development Tasks

> **Vibes-based development** - No timelines, no budgets, just code.
> **Last Updated:** November 25, 2025

---

## ✅ Completed Implementations

### ✅ Balances Pallet

**Location:** `src/pallets/balances/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #1](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `transfer(dest, value)` - Transfer balance
- [x] `transfer_keep_alive(dest, value)` - Transfer, keep above ED
- [x] `transfer_all(dest, keep_alive)` - Transfer all free balance
- [x] `force_transfer(source, dest, value)` - Root-only forced transfer
- [x] `force_unreserve(who, amount)` - Root-only unreserve
- [x] `set_balance(who, new_free, new_reserved)` - Root-only set balance
- [x] Storage queries: `totalIssuance`, `account`, `locks`, `reserves`
- [x] Helper functions: `getBalance`, `getLockedBalance`, `getReservedBalance`, etc.
- [x] Event types: `Transfer`, `BalanceSet`, `Reserved`, `Unreserved`
- [x] Examples: `examples/balance/`

---

### ✅ Unified Accounts Pallet

**Location:** `src/unified/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #22](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `claim_evm_address(evm_address, signature)` - Claim EVM address with signature
- [x] `claim_default_evm_address()` - Claim deterministic EVM address
- [x] Storage queries: `evmToNative`, `nativeToEvm`
- [x] Helper functions: `getMappingInfo`, `getDefaultEvmAddress`, `getDefaultSubstrateAddress`
- [x] Signature generation: `generateClaimSignature` (EIP-712)
- [x] Examples: `examples/unified/`

---

### ✅ Staking Pallet

**Location:** `src/pallets/staking/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #2](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `bond(value, payee)` - Bond funds for staking
- [x] `bond_extra(max_additional)` - Bond additional funds
- [x] `unbond(value)` - Schedule unbonding
- [x] `withdraw_unbonded(num_slashing_spans)` - Withdraw unbonded
- [x] `nominate(targets)` - Nominate validators
- [x] `chill()` - Stop nominating/validating
- [x] `set_payee(payee)` - Set reward destination
- [x] `set_controller(controller)` - Change controller
- [x] `validate(prefs)` - Declare validator intent
- [x] `payout_stakers(validator_stash, era)` - Payout rewards
- [x] `rebond(value)` - Rebond unbonding funds
- [x] `chill_other(controller)` - Force chill account
- [x] `force_unstake(stash, num_slashing_spans)` - Root-only unstake
- [x] Storage queries: `bonded`, `ledger`, `validators`, `nominators`, `activeEra`, etc.
- [x] Helper functions: `getStakingInfo`, `getRewards`, `isNominating`, `isValidating`

---

### ✅ Democracy Pallet

**Location:** `src/pallets/democracy/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #4](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `propose(proposal, value)` - Submit a proposal
- [x] `second(proposal)` - Second a proposal
- [x] `vote(ref_index, vote)` - Vote on referendum
- [x] `delegate(to, conviction, balance)` - Delegate voting power
- [x] `undelegate()` - Remove delegation
- [x] `remove_vote(index)` - Remove vote from referendum
- [x] `emergency_cancel(ref_index)` - Cancel referendum (sudo)
- [x] `external_propose(proposal)` - External proposal (council)
- [x] `fast_track(proposal_hash, voting_period, delay)` - Fast track (tech committee)
- [x] Storage queries: `publicProps`, `referendumCount`, `referendumInfoOf`, `votingOf`, etc.
- [x] Helper functions: `getActiveReferenda`, `getProposalDetails`, `canVote`
- [x] Conviction enum exported

---

### ✅ Council Pallet (Collective Instance 1)

**Location:** `src/pallets/council/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #11](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `execute(proposal, length_bound)` - Execute proposal directly
- [x] `propose(threshold, proposal, length_bound)` - Submit proposal
- [x] `vote(proposal_hash, index, approve)` - Vote on proposal
- [x] `close(proposal_hash, index, weight_bound, length_bound)` - Close proposal
- [x] `disapprove_proposal(proposal_hash)` - Disapprove proposal
- [x] `set_members(new_members, prime, old_count)` - Set council members (root)
- [x] Storage queries: `members`, `proposals`, `proposalOf`, `voting`, `proposalCount`

---

### ✅ Treasury Pallet

**Location:** `src/pallets/treasury/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #5](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `propose_spend(value, beneficiary)` - Propose treasury spend
- [x] `reject_proposal(proposal_id)` - Reject proposal (council)
- [x] `approve_proposal(proposal_id)` - Approve proposal (council)
- [x] `spend_local(amount, beneficiary)` - Spend from treasury (root)
- [x] `remove_approval(proposal_id)` - Remove approval (root)
- [x] `payout(index)` - Payout approved spend
- [x] `check_status(index)` - Check spend status
- [x] `void_spend(index)` - Void spend (root)
- [x] Storage queries: `proposalCount`, `proposals`, `approvals`, `getPot`
- [x] Helper functions: `getAllProposals`, `getPendingApprovals`

---

### ✅ Council Elections (Phragmen)

**Location:** `src/pallets/elections-phragmen/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #12](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `vote(votes, value)` - Vote for candidates
- [x] `remove_voter()` - Remove vote
- [x] `submit_candidacy(candidate_count)` - Submit candidacy
- [x] `renounce_candidacy(renouncing)` - Renounce candidacy
- [x] `remove_member(who, slash_bond, rerun_election)` - Remove member (root)
- [x] `clean_defunct_voters(num_voters, num_defunct)` - Clean defunct voters
- [x] Storage queries: `members`, `candidates`, `voting`, `runnersUp`
- [x] Helper functions: `getElectionInfo`, `getVoterInfo`

---

## ✅ Priority 0: Critical (EVM Support) - COMPLETE

### ✅ EVM Pallet

**Location:** `src/pallets/evm/`
**Status:** ✅ Complete
**Priority:** 🔴 CRITICAL - Required for EVM compatibility
**Reference:** [SELENDRA_PALLETS.md #20](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `call(source, target, input, value, gas_limit, max_fee_per_gas, max_priority_fee_per_gas, nonce, access_list)` - Execute contract call
- [x] `create(source, init, value, gas_limit, max_fee_per_gas, max_priority_fee_per_gas, nonce, access_list)` - Deploy contract (CREATE)
- [x] `create2(source, init, salt, value, gas_limit, max_fee_per_gas, max_priority_fee_per_gas, nonce, access_list)` - Deploy contract (CREATE2)
- [x] `withdraw(address, value)` - Withdraw from EVM to Substrate
- [x] Storage queries: `accountCodes(address)`, `accountStorages(address, index)`
- [x] Helper functions: `callContract`, `deployContract`, `staticCall`, `transfer`
- [x] RPC helpers: `estimateGas`, `getEvmBalance`, `getTransactionCount`, `ethCall`, `getGasPrice`, `getBlockNumber`, `getChainId`
- [x] Type definitions: `H160`, `H256`, `U256`, `EvmCallParams`, `EvmCreateParams`, `EvmCreate2Params`, `AccessListItem`, `EvmLog`, `ExitReason`
- [x] Event types: `LogEvent`, `CreatedEvent`, `ExecutedEvent`

---

### ✅ Ethereum Pallet

**Location:** `src/pallets/ethereum/`
**Status:** ✅ Complete
**Priority:** 🔴 CRITICAL - Required for Ethereum transaction compatibility
**Reference:** [SELENDRA_PALLETS.md #21](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `transact(transaction)` - Submit signed Ethereum transaction
- [x] Storage queries: `currentBlock`, `currentReceipts`, `currentTransactionStatuses`, `pending`
- [x] RPC helpers: `getBlockByHash`, `getBlockByNumber`, `getTransactionByHash`, `getTransactionReceipt`, `getLogs`
- [x] Helper functions: `sendSignedTransaction`, `sendRawTransaction`, `waitForReceipt`
- [x] EVM-related helpers: `getBalance`, `getTransactionCount`, `call`, `estimateGas`, `getCode`, `getStorageAt`, `getChainId`, `getGasPrice`, `blockNumber`
- [x] Type definitions: `LegacyTransaction`, `EIP2930Transaction`, `EIP1559Transaction`, `EIP4844Transaction`, `EthereumBlock`, `EthereumBlockHeader`, `EthereumReceipt`
- [x] Event types: `EthereumExecutedEvent`, `ExitReason`

---

## ✅ Priority 1: High (Consensus & Pools) - COMPLETE

### ✅ P1-01: Session Pallet

**Location:** `src/pallets/session/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #3](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `index.ts`
- [x] `client.ts` - SessionManager class
- [x] `queries.ts` - SessionQueries class
- [x] `types.ts` - SessionKeys, SessionInfo, etc.

**Methods:**

```typescript
// Extrinsics
setKeys(keys, proof);
purgeKeys();
rotateSession(); // Helper to set and rotate keys

// Queries
validators();
currentIndex();
nextKeys(accountId);
queuedKeys();
disabledValidators();
getSessionInfo();
getKeysForValidator(accountId);
isValidatorInSession(accountId);
```

---

### ✅ P1-02: Nomination Pools

**Location:** `src/pallets/nomination-pools/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #14](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `index.ts`
- [x] `client.ts` - NominationPoolsManager class
- [x] `queries.ts` - NominationPoolsQueries class
- [x] `types.ts` - PoolInfo, PoolMember, PoolState, etc.

**Methods:**

```typescript
// Pool Operations
create(amount, root, nominator, bouncer);
join(amount, poolId);
bondExtra(extra);
claimPayout();
unbond(memberAccount, unbondingPoints);
withdrawUnbonded(memberAccount, numSlashingSpans);

// Pool Management
setMetadata(poolId, metadata);
setConfigs(configs);
nominate(poolId, validators);
setState(poolId, state);
chill(poolId);
claimCommission(poolId);

// Queries
bondedPool(poolId);
poolMembers(poolId, accountId);
rewardPools(poolId);
getPoolInfo(poolId);
getMemberInfo(accountId);
calculatePendingRewards(accountId);
getAllPools();
```

---

### ✅ P1-03: Aleph Pallet (Consensus)

**Location:** `src/pallets/aleph/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #23](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `index.ts`
- [x] `client.ts` - AlephManager class
- [x] `queries.ts` - AlephQueries class
- [x] `types.ts` - AuthorityInfo, SessionInfo, FinalityState, etc.

**Methods:**

```typescript
// Queries
finalityVersion();
sessionForBlock(block);
authorities();
nextAuthorities();
millisPerBlock();
sessionPeriod();
emergencyFinalizer();
getAlephSessionInfo();
getFinalityState();
getBlockTimingInfo();
getConstants();

// Helpers
getCurrentSession();
getSessionValidators(sessionIndex);
getAuthorityIndex(accountId);
isAuthority(accountId);

// Subscriptions
subscribeToSessionChange(callback);
subscribeToEraChange(callback);
subscribeToFinality(callback);
subscribeToNewBlocks(callback);
waitForFinalization(blockNumber);
```

---

### ✅ P1-04: Elections Pallet (Custom Selendra)

**Location:** `src/pallets/elections/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #24](./SELENDRA_PALLETS.md)

**Note:** This is the custom Selendra elections pallet, different from phragmen.

**Implemented:**

- [x] `index.ts`
- [x] `client.ts` - ElectionsManager class
- [x] `queries.ts` - ElectionsQueries class
- [x] `types.ts` - CommitteeSeats, EraValidators, ElectionOpenness, etc.

**Methods:**

```typescript
// Extrinsics (Admin/Root only)
changeValidators(reservedValidators, nonReservedValidators, committeeSize);
setElectionsOpenness(openness);

// Queries
committeeSize();
nextEraCommitteeSize();
currentEraValidators();
nextEraReservedValidators();
nextEraNonReservedValidators();
openness();
getValidatorSetInfo();
getElectionsConfig();
checkValidatorEligibility(accountId);

// Helpers
isCurrentValidator(accountId);
isReservedValidator(accountId);
validateConfiguration(reserved, nonReserved, committeeSize);
```

---

### ✅ P1-05: Committee Management Pallet

**Location:** `src/pallets/committee-management/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #25](./SELENDRA_PALLETS.md)

**Implemented:**

- [x] `index.ts`
- [x] `client.ts` - CommitteeManagementManager class
- [x] `queries.ts` - CommitteeManagementQueries class
- [x] `types.ts` - BanInfo, BanReason, ProductionBanConfig, FinalityBanConfig, etc.

**Methods:**

```typescript
// Extrinsics (Admin/Root only)
setProductionBanConfig(minPerformance, threshold, delay, banPeriod);
setFinalityBanConfig(minPerformance, threshold, banPeriod, delay);
banFromCommittee(banned, banReason);
cancelBan(banned);
setLenientThreshold(thresholdPercent);

// Queries
lenientThreshold();
productionBanConfig();
finalityBanConfig();
sessionValidatorBlockCount(accountId);
underperformedValidatorSessionCount(accountId);
underperformedFinalizerSessionCount(accountId);
banned(accountId);
currentAndNextSessionValidators();
validatorEraTotalReward();

// Helpers
isBanned(accountId);
getAllBannedValidators();
getValidatorPerformance(accountId);
getBanExpiryEras(accountId);
getConfig();
```

---

## ✅ Priority 2: Medium (Account Management) - COMPLETE

### ✅ P2-01: Identity Pallet

**Location:** `src/pallets/identity/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #6](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (IdentityManager)
setIdentity(info, signer, signerAddress);
clearIdentity(signer, signerAddress);
setSubs(subs, signer, signerAddress);
addSub(sub, data, signer, signerAddress);
renameSub(sub, data, signer, signerAddress);
removeSub(sub, signer, signerAddress);
quitSub(signer, signerAddress);
requestJudgement(registrarIndex, maxFee, signer, signerAddress);
cancelRequest(registrarIndex, signer, signerAddress);
provideJudgement(
  registrarIndex,
  target,
  judgement,
  identity,
  signer,
  signerAddress
);
setFee(index, fee, signer, signerAddress);
setAccountId(index, newAccount, signer, signerAddress);
setFields(index, fields, signer, signerAddress);
addRegistrar(account, signer, signerAddress); // Root only
killIdentity(target, signer, signerAddress); // Root only

// Queries (IdentityQueries)
identityOf(account);
superOf(account);
subsOf(account);
registrars();
pendingUsernames();
authorityOf(username);
usernameInfoOf(username);
getFullIdentity(account);
getAllIdentities(limit);
getSubAccounts(account);
getActiveRegistrars();
getRegistrarInfo(index);
hasIdentity(account);
isVerified(account);
getJudgements(account);
getDisplayName(account);
lookupByName(name);
getConstants();
```

---

### ✅ P2-02: Multisig Pallet

**Location:** `src/pallets/multisig/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #7](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (MultisigManager)
asMulti(
  threshold,
  otherSignatories,
  maybeTimepoint,
  call,
  maxWeight,
  signer,
  signerAddress
);
asMultiThreshold1(otherSignatories, call, signer, signerAddress);
approveAsMulti(
  threshold,
  otherSignatories,
  maybeTimepoint,
  callHash,
  maxWeight,
  signer,
  signerAddress
);
cancelAsMulti(
  threshold,
  otherSignatories,
  timepoint,
  callHash,
  signer,
  signerAddress
);
initiateMultisig(account, call, maxWeight, signer, signerAddress);
approveMultisig(account, timepoint, callHash, maxWeight, signer, signerAddress);
executeMultisig(account, timepoint, call, maxWeight, signer, signerAddress);
cancelMultisig(account, timepoint, callHash, signer, signerAddress);

// Queries (MultisigQueries)
multisigs(multisigAddress, callHash);
getConstants();
deriveMultisigAddress(signatories, threshold, ss58Prefix);
createMultisigAccount(signatories, threshold);
calculateDeposit(callLength);
getCallHash(callData);
getPendingMultisigs(multisigAddress, threshold);
hasApproved(multisigAddress, callHash, account);
getApprovalStatuses(multisigAddress, callHash, signatories);
getOperationDetails(account, callHash, callerAddress);
getRemainingSignatories(multisigAddress, callHash, signatories);
decodeCall(callData);
validateConfig(signatories, threshold);
```

---

### ✅ P2-03: Proxy Pallet

**Location:** `src/pallets/proxy/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #8](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (ProxyManager)
proxy(real, forceProxyType, call, signer, signerAddress);
addProxy(delegate, proxyType, delay, signer, signerAddress);
removeProxy(delegate, proxyType, delay, signer, signerAddress);
removeProxies(signer, signerAddress);
createPure(proxyType, delay, index, signer, signerAddress);
killPure(spawner, proxyType, index, height, extIndex, signer, signerAddress);
announce(real, callHash, signer, signerAddress);
removeAnnouncement(real, callHash, signer, signerAddress);
rejectAnnouncement(delegate, callHash, signer, signerAddress);
proxyAnnounced(delegate, real, forceProxyType, call, signer, signerAddress);
addProxies(proxies, signer, signerAddress);
nestedProxy(realAccount, proxies, call, signer, signerAddress);

// Queries (ProxyQueries)
proxies(account);
announcements(account);
getConstants();
isProxy(delegator, delegate, proxyType);
getProxiedAccounts(delegate);
getProxySummary(account);
getProxiesByType(account, proxyType);
hasAnnouncement(delegate, real, callHash);
getAnnouncementsFor(delegate, real);
calculateProxyDeposit(numProxies);
calculateAnnouncementDeposit(numAnnouncements);
getAllProxyAccounts(limit);
canProxyTypeExecute(hasType, needsType);
validateProxyConfig(delegates);
```

---

### ✅ P2-04: Vesting Pallet

**Location:** `src/pallets/vesting/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #10](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (VestingManager)
vest(signer, signerAddress);
vestOther(target, signer, signerAddress);
vestedTransfer(target, schedule, signer, signerAddress);
forceVestedTransfer(source, target, schedule, signer, signerAddress);
mergeSchedules(schedule1Index, schedule2Index, signer, signerAddress);
forceRemoveVestingSchedule(target, scheduleIndex, signer, signerAddress);
createVestedTransfer(params, signer, signerAddress);
createVestedTransferWithDuration(
  target,
  totalAmount,
  durationBlocks,
  signer,
  signerAddress
);
createVestedTransferWithTime(
  target,
  totalAmount,
  durationSeconds,
  blockTime,
  signer,
  signerAddress
);
vestAndGetUnlocked(signer, signerAddress);
mergeAllSchedules(signer, signerAddress);
createLinearSchedule(totalAmount, durationBlocks, startingBlock);
createCliffSchedule(totalAmount, cliffBlocks, vestingBlocks);

// Queries (VestingQueries)
vesting(account);
storageVersion();
getConstants();
getVestingInfo(account);
getVestingStatus(account);
getAccountVestingInfo(account);
hasVesting(account);
getTotalLocked(account);
getUnlockableAmount(account);
getScheduleCount(account);
canAddSchedule(account);
getAllVestingAccounts(limit);
getCompletionBlock(account);
getTimeUntilComplete(account, blockTime);
validateSchedule(schedule);
```

---

### ✅ P2-05: Utility Pallet

**Location:** `src/pallets/utility/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #9](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (UtilityManager)
batch(calls, signer, signerAddress);
batchAll(calls, signer, signerAddress);
forceBatch(calls, signer, signerAddress);
asDerivative(index, call, signer, signerAddress);
dispatchAs(asOrigin, call, signer, signerAddress);
withWeight(call, weight, signer, signerAddress);
batchItems(items, signer, signerAddress);
batchAllItems(items, signer, signerAddress);
batchTransfers(transfers, signer, signerAddress);
batchStakingOperations(operations, signer, signerAddress);
nestedBatch(batches, signer, signerAddress);

// Queries (UtilityQueries)
getConstants();
encodeCall(section, method, args);
decodeCall(callData);
getCallHash(callData);
buildCall(item);
buildCalls(items);
getCallInfo(callData);
estimateWeight(callData);
getBatchSummary(items);
validateBatch(items);
isCallAvailable(section, method);
getPalletMethods(section);
getAvailablePallets();
analyzeBatch(items);
```

---

## ✅ Priority 3: Medium-Low (Smart Contracts & Admin) - COMPLETE

### ✅ P3-01: Contracts Pallet (ink!)

**Location:** `src/pallets/contracts/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #13](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (ContractsManager)
uploadCode(signer, code, storageDepositLimit, determinism);
removeCode(signer, codeHash);
setCode(signer, dest, codeHash);
instantiate(signer, value, gasLimit, storageDepositLimit, codeHash, data, salt);
instantiateWithCode(
  signer,
  value,
  gasLimit,
  storageDepositLimit,
  code,
  data,
  salt
);
call(signer, dest, value, gasLimit, storageDepositLimit, data);

// Queries (ContractsQueries)
contractInfoOf(address);
codeStorage(codeHash);
pristineCode(codeHash);
ownerInfoOf(codeHash);
getConstants();

// Dry-run (ContractsQueries)
dryRunCall(origin, dest, value, gasLimit, storageDepositLimit, inputData);
dryRunInstantiate(
  origin,
  value,
  gasLimit,
  storageDepositLimit,
  code,
  data,
  salt
);
```

---

### ✅ P3-02: XVM Pallet (Cross-VM)

**Location:** `src/pallets/xvm/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #29](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (XvmManager)
xvmCall(signer, context, target, input, value, metadata);
callEvm(signer, target, input, value);
callWasm(signer, target, input, value);
callEvmContract(signer, contractAddress, functionSig, args, value);
callInkContract(signer, contractAddress, selector, args, value);

// Queries (XvmQueries)
getConstants();
evmAddressToSubstrate(evmAddress);
substrateAddressToEvm(substrateAddress);
buildEvmInput(functionSig, args);
buildWasmInput(selector, args);
```

---

### ✅ P3-03: Dynamic EVM Base Fee

**Location:** `src/pallets/dynamic-evm-base-fee/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #27](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (DynamicEvmBaseFeeManager)
setBaseFeePerGas(signer, fee); // Root only

// Queries (DynamicEvmBaseFeeQueries)
baseFeePerGas();
getBaseFeeInfo();
getBaseFeeHistory(blocks);
getConstants();

// Helpers
estimateGasCost(gasUnits);
convertFromWei(weiValue);
convertToWei(value);
formatBaseFee(fee);
```

---

### ✅ P3-04: Ethereum Checked

**Location:** `src/pallets/ethereum-checked/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #28](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (EthereumCheckedManager)
transact(signer, tx);
transactWithValidation(signer, tx);

// Queries (EthereumCheckedQueries)
pendingTransactions();
transactionStatus(hash);
validateTransaction(tx, sourceAccount);
buildLegacyTransaction(params);
buildEip1559Transaction(params);
getGasPrice();
getMaxPriorityFee();
getNonce(address);
estimateGas(tx);
```

---

### ✅ P3-05: Scheduler Pallet

**Location:** `src/pallets/scheduler/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #15](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (SchedulerManager)
schedule(signer, when, maybePeriodic, priority, call);
cancel(signer, when, index);
scheduleNamed(signer, id, when, maybePeriodic, priority, call);
cancelNamed(signer, id);
scheduleAfter(signer, after, maybePeriodic, priority, call);
scheduleNamedAfter(signer, id, after, maybePeriodic, priority, call);

// Queries (SchedulerQueries)
agenda(blockNumber);
lookup(id);
getScheduledCalls(blockNumber);
getAllScheduled(fromBlock, toBlock);
getConstants();

// Helpers
buildScheduleId(name);
validateSchedule(when, period);
getNextExecutionBlock(schedule);
```

---

### ✅ P3-06: Preimage Pallet

**Location:** `src/pallets/preimage/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #16](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (PreimageManager)
notePreimage(signer, bytes);
unnotePreimage(signer, hash);
requestPreimage(signer, hash);
unrequestPreimage(signer, hash);
ensurePreimage(signer, bytes);
notePreimageFromCall(signer, call);

// Queries (PreimageQueries)
preimageFor(hash, len?);
statusFor(hash);
hasPreimage(hash);
getAllPreimages(limit);
getConstants();
calculateDeposit(bytes);
hashPreimage(data);
```

---

### ✅ P3-07: Operations Pallet (Custom Selendra)

**Location:** `src/pallets/operations/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #26](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (OperationsManager)
fixAccountsConsumersCounter(signer, account);
fixWithValidation(signer, account);
batchFix(signer, accounts, options);

// Queries (OperationsQueries)
getConsumers(account);
getBalanceDetails(account);
isContractAccount(account);
isBonded(account);
hasSessionKeys(account);
validateAccount(account);
findMismatchedAccounts(accounts);
getNonce(account);

// Helpers
estimateFee(signer, account);
findAccountsNeedingFix(accounts);
buildBatchFix(accounts);
buildBatchAllFix(accounts);
```

---

## ✅ Priority 4: Admin & Emergency - COMPLETE

### ✅ P4-01: Sudo Pallet

**Location:** `src/pallets/sudo/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #19](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (SudoManager)
sudo(signer, call);
sudoUncheckedWeight(signer, call, weight);
setKey(signer, newKey);
sudoAs(signer, who, call);

// Queries (SudoQueries)
key();
isSudoKey(accountId);
getSudoKeyInfo();
```

---

### ✅ P4-02: Safe Mode Pallet

**Location:** `src/pallets/safe-mode/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #17](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (SafeModeManager)
enter(signer);
forceEnter(signer);
extend(signer);
forceExtend(signer);
forceExit(signer);
forceSlashDeposit(signer, account, block);
releaseDeposit(signer, account, block);
forceReleaseDeposit(signer, account, block);

// Queries (SafeModeQueries)
enteredUntil();
isActive();
getStatus();
getRemainingBlocks();
canEnter();
getConfig();
```

---

### ✅ P4-03: Tx Pause Pallet

**Location:** `src/pallets/tx-pause/`
**Status:** ✅ Complete
**Reference:** [SELENDRA_PALLETS.md #18](./SELENDRA_PALLETS.md)

**Implemented:**

```typescript
// Extrinsics (TxPauseManager)
pause(signer, palletName, callName);
unpause(signer, palletName, callName);
pauseMultiple(signer, transactions);
unpauseMultiple(signer, transactions);

// Queries (TxPauseQueries)
pausedTransactions(palletName, callName);
isPaused(palletName, callName);
getAllPausedTransactions();
getConstants();
```

---

## 🎨 Priority 5: Developer Experience

### ✅ P5-01: Technical Committee (Collective Instance 2)

**Location:** `src/pallets/technical-committee/`
**Status:** ✅ Complete

**Implemented:**

```typescript
// Extrinsics (TechCommitteeManager)
propose(signer, threshold, proposal, lengthBound);
vote(signer, proposalHash, index, approve);
close(signer, proposalHash, index, weightBound, lengthBound);
disapproveProposal(signer, proposalHash);
setMembers(signer, newMembers, prime, oldCount);

// Queries (TechCommitteeQueries)
members();
prime();
proposalCount();
proposals();
proposalOf(proposalHash);
voting(proposalHash);
isMember(account);
getInfo();
getAllProposalStatuses();
hasVoted(account, proposalHash);
getVote(account, proposalHash);
```

---

### ✅ P5-02: React Hooks Package

**Location:** `src/react/`
**Status:** ✅ Complete

**Implemented:**

```typescript
// Provider Component
SelendraProvider({
  config,
  autoConnect,
  children,
  onConnected,
  onDisconnected,
  onError,
});
SelendraContext; // React context

// Core Hooks
useSelendra(); // SDK access, connection state
useBalance(address, options); // Balance queries with subscription
useStaking(address, options); // Staking operations
useTransaction(); // Transaction management
useTransactions(); // Batch transaction management
useGovernance(options); // Democracy, Council, Treasury
useNominationPools(address, options); // Pool operations
```

**Types:**

- `SelendraContextValue` - Provider context type
- `SelendraProviderProps` - Provider props
- `BalanceState` - Formatted balance data
- `StakingState` - Staking info with operations
- `GovernanceState` - Governance overview
- `PoolsState` - Nomination pools state
- `TransactionState` - Transaction status tracking
- `TransactionStatus` - "idle" | "pending" | "success" | "error"

---

### ✅ P5-03: Testing Infrastructure

**Status:** ✅ Complete
**Location:** `tests/`

**Implemented:**

- [x] Jest configuration (`jest.config.js`)
- [x] Test setup with custom matchers (`tests/setup.ts`)
- [x] Mock providers (`tests/mocks/index.ts`)
  - `createMockApi()` - Mock Polkadot API
  - `createMockSigner()` - Mock transaction signer
  - `createMockEvmProvider()` - Mock EVM provider
- [x] Sample unit tests (`tests/core/`, `tests/pallets/`)
- [x] Package.json test scripts

**Test Commands:**

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # With coverage report
```

---

### ✅ P5-04: Documentation

**Status:** ✅ Complete

**Implemented:**

- [x] Set up TypeDoc for API generation (`typedoc.json`)
- [x] TypeDoc scripts in package.json (`npm run docs`)
- [x] README badges (npm, license, TypeScript, Node.js)
- [ ] Write getting started guide (deferred to future release)
- [ ] Write migration guide from old SDK (deferred to future release)
- [ ] Create tutorial: "Build a Wallet" (deferred to future release)
- [ ] Create tutorial: "Build a Staking Dashboard" (deferred to future release)
- [ ] Create tutorial: "Build a Governance dApp" (deferred to future release)

**Note:** TypeDoc generates comprehensive API documentation. Additional guides and tutorials can be added incrementally.

---

### ✅ P5-05: Package Publishing

**Status:** ✅ Complete

**Implemented:**

- [x] Finalize package.json exports (added unified, pallets/*)
- [x] Create CHANGELOG.md with version history
- [x] Set up npm publishing workflow (`.github/workflows/publish.yml`)
- [x] GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- [x] Add badges to README

**Publishing:**

```bash
# Manual publish (requires NPM_TOKEN secret)
npm publish --access public -w @selendrajs/sdk

# Or trigger via GitHub Actions:
# 1. Create a GitHub Release
# 2. Workflow automatically publishes to npm
```

---

### ✅ P5-06: Examples

**Status:** ✅ Complete
**Location:** `examples/`

**Implemented:**

- [x] `examples/balance/` - Balance operations
- [x] `examples/unified/` - Unified accounts
- [x] `examples/transfer/` - Token transfers
- [x] `examples/connect/` - Connection examples
- [x] `examples/block/` - Block queries
- [x] `examples/governance/` - Democracy, Council, Treasury
- [x] `examples/staking/` - Staking operations (bonding, nominating, rewards)
- [x] `examples/pools/` - Nomination pools (join, create, claim)
- [x] `examples/evm/` - EVM interactions (contracts, transactions)
- [x] `examples/contracts/` - ink! smart contracts

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

| Priority | Description     | Total | Done | Progress       |
| -------- | --------------- | ----- | ---- | -------------- |
| ✅       | Completed       | 7     | 7    | ✅✅✅✅✅✅✅ |
| 🔴 P0    | EVM Critical    | 2     | 2    | ✅✅           |
| 🟠 P1    | Consensus/Pools | 5     | 5    | ✅✅✅✅✅     |
| 🟡 P2    | Account Mgmt    | 5     | 5    | ✅✅✅✅✅     |
| 🟢 P3    | Contracts/Admin | 7     | 7    | ✅✅✅✅✅✅✅ |
| ⚪ P4    | Emergency       | 3     | 3    | ✅✅✅         |
| 🎨 P5    | Dev Experience  | 6     | 6    | ✅✅✅✅✅✅   |

**Overall:** 35/35 tasks complete (100%) 🎉

### Completed Pallets Summary

| Pallet              | Location                            | Status      |
| ------------------- | ----------------------------------- | ----------- |
| Balances            | `src/pallets/balances/`             | ✅ Complete |
| Unified Accounts    | `src/unified/`                      | ✅ Complete |
| Staking             | `src/pallets/staking/`              | ✅ Complete |
| Democracy           | `src/pallets/democracy/`            | ✅ Complete |
| Council             | `src/pallets/council/`              | ✅ Complete |
| Treasury            | `src/pallets/treasury/`             | ✅ Complete |
| Elections Phragmen  | `src/pallets/elections-phragmen/`   | ✅ Complete |
| EVM                 | `src/pallets/evm/`                  | ✅ Complete |
| Ethereum            | `src/pallets/ethereum/`             | ✅ Complete |
| Session             | `src/pallets/session/`              | ✅ Complete |
| Nomination Pools    | `src/pallets/nomination-pools/`     | ✅ Complete |
| Aleph               | `src/pallets/aleph/`                | ✅ Complete |
| Elections           | `src/pallets/elections/`            | ✅ Complete |
| Committee Mgmt      | `src/pallets/committee-management/` | ✅ Complete |
| Identity            | `src/pallets/identity/`             | ✅ Complete |
| Multisig            | `src/pallets/multisig/`             | ✅ Complete |
| Proxy               | `src/pallets/proxy/`                | ✅ Complete |
| Vesting             | `src/pallets/vesting/`              | ✅ Complete |
| Utility             | `src/pallets/utility/`              | ✅ Complete |
| Contracts           | `src/pallets/contracts/`            | ✅ Complete |
| XVM                 | `src/pallets/xvm/`                  | ✅ Complete |
| Dynamic EVM Fee     | `src/pallets/dynamic-evm-base-fee/` | ✅ Complete |
| Ethereum Checked    | `src/pallets/ethereum-checked/`     | ✅ Complete |
| Scheduler           | `src/pallets/scheduler/`            | ✅ Complete |
| Preimage            | `src/pallets/preimage/`             | ✅ Complete |
| Operations          | `src/pallets/operations/`           | ✅ Complete |
| Sudo                | `src/pallets/sudo/`                 | ✅ Complete |
| Safe Mode           | `src/pallets/safe-mode/`            | ✅ Complete |
| Tx Pause            | `src/pallets/tx-pause/`             | ✅ Complete |
| Technical Committee | `src/pallets/technical-committee/`  | ✅ Complete |

---

_Let's vibe and code._ 🚀
