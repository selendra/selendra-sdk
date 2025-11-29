# Changelog

All notable changes to `@selendrajs/sdk` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-29

### ⚠️ BREAKING CHANGES

This is a major release that migrates the EVM stack from ethers.js to viem + wagmi. If you're using EVM functionality, you'll need to update your code.

#### Migration Required

1. **Provider Changes**
   - `getEvmProvider()` now returns viem's `PublicClient` instead of ethers `JsonRpcProvider`
   - Use `client.getBalance({ address })` instead of `provider.getBalance(address)`
   - Use `client.getBlockNumber()` instead of `provider.getBlockNumber()`

2. **Wallet Changes**
   - Wallet utilities use viem's `PrivateKeyAccount` type
   - Use `privateKeyToAccount()` from `viem/accounts` instead of `new ethers.Wallet()`

3. **Contract Interaction**
   - Use viem's `getContract()` API instead of `new ethers.Contract()`
   - Contract reads: `contract.read.methodName([args])` instead of `contract.methodName(args)`
   - Contract writes: `contract.write.methodName([args])` instead of `contract.methodName(args)`

4. **Transaction Signing**
   - `sendEvmTransaction()` and `writeEvmContract()` now require chain configuration
   - Transactions use `createWalletClient()` with explicit chain

5. **BigNumber → bigint**
   - Replace `ethers.BigNumber` with native JavaScript `bigint`
   - Use `parseEther()` and `formatEther()` from viem

#### Migration Guide

See [Migration from ethers.js to viem](/docs/sdk/migration/ethers-to-viem) for detailed examples.

### Added

- **viem v2 Integration** - Modern, lightweight EVM library (~35kb vs ~120kb)
- **wagmi v2 Integration** - React hooks for Ethereum
- **@tanstack/react-query v5** - Async state management
- **Selendra Chain Definitions** - Pre-configured `selendra` and `selendraTestnet` chains
- **Interactive Tutorials** - `selendra learn` command in CLI
- **Plugin System** - `selendra plugin` command for extensibility
- TypeDoc documentation generation
- GitHub Actions CI/CD workflows
- npm publish workflow with provenance

### Changed

- **Migrated EVM stack from ethers.js to viem + wagmi**
  - Replaced `ethers.js` v6 with `viem` v2 for EVM operations
  - Added `wagmi` v2 and `@wagmi/core` v2 for React hooks
  - Added `@tanstack/react-query` v5 for async state management
  - Improved TypeScript type inference and bundle size
- Updated React peer dependency to `^18.0.0 || ^19.0.0` for Next.js 16+ compatibility
- Improved error messages and type safety throughout

### Removed

- `ethers` dependency removed entirely
- Legacy ethers-based wallet utilities

---

## [1.0.0] - 2025-11-25

### Added

#### Core Features

- **SelendraSDK** - Main SDK class with connection management
- **createSDK** / **createAndConnect** - Factory functions for SDK creation
- **Event System** - Real-time blockchain event subscriptions
- **Auto-Reconnect** - Built-in reconnection logic with configurable retries

#### Pallet Implementations (30 Total)

**Priority 0 - Critical:**

- `BalancesManager` - Token balances, transfers, locks
- `StakingManager` - Validator/nominator operations, rewards
- `DemocracyManager` - Proposals, referendums, voting
- `CouncilManager` - Council proposals and voting
- `TreasuryManager` - Treasury proposals and tips
- `EvmManager` - EVM contract deployment and calls
- `EthereumManager` - Ethereum transaction submission

**Priority 1 - High:**

- `SessionManager` - Session key management
- `NominationPoolsManager` - Nomination pool operations
- `AlephManager` - AlephBFT consensus queries
- `ElectionsManager` - Validator elections
- `CommitteeManagementManager` - Committee operations

**Priority 2 - Medium:**

- `IdentityManager` - On-chain identity management
- `MultisigManager` - Multi-signature operations
- `ProxyManager` - Proxy account management
- `VestingManager` - Token vesting schedules
- `UtilityManager` - Batch calls and utility functions

**Priority 3 - Lower:**

- `ContractsManager` - ink! smart contracts
- `XvmManager` - Cross-VM calls (EVM ↔ Wasm)
- `DynamicEvmBaseFeeManager` - Dynamic gas pricing
- `EthereumCheckedManager` - Validated Ethereum transactions
- `SchedulerManager` - Scheduled calls
- `PreimageManager` - Preimage storage
- `OperationsManager` - Custom Selendra operations

**Priority 4 - Admin:**

- `SudoManager` - Superuser operations
- `SafeModeManager` - Emergency safe mode
- `TxPauseManager` - Transaction pausing
- `ElectionsPhragmenManager` - Phragmén elections
- `TechnicalCommitteeManager` - Technical committee

#### React Integration

- `SelendraProvider` - React context provider
- `useSelendra` - Core SDK hook
- `useBalance` - Balance queries with subscriptions
- `useStaking` - Staking operations hook
- `useTransaction` - Transaction management
- `useGovernance` - Democracy, Council, Treasury
- `useNominationPools` - Pool operations

#### Unified Accounts

- `UnifiedAccountsManager` - Substrate ↔ EVM address mapping
- `claimDefaultAccount` - Claim default EVM address
- `claimAccount` - Claim custom EVM address
- Address derivation and conversion utilities

#### Type System

- Full TypeScript types for all pallets
- Strict mode enabled
- Auto-generated chain metadata types

### Changed

- Package renamed from `@selendrajs/sdk-core` to `@selendrajs/sdk`

### Security

- Zero production vulnerabilities
- Secure key management practices
- Input validation on all user inputs

---

## [0.1.0] - 2025-11-01

### Added

- Initial SDK implementation
- Basic connection management
- Substrate provider support
- EVM provider support

---

[Unreleased]: https://github.com/selendra/selendra-sdk/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/selendra/selendra-sdk/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/selendra/selendra-sdk/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/selendra/selendra-sdk/releases/tag/v0.1.0
