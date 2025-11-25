# Changelog

All notable changes to `@selendrajs/sdk` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- TypeDoc documentation generation
- GitHub Actions CI/CD workflows
- npm publish workflow with provenance

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

[Unreleased]: https://github.com/selendra/selendra-sdk/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/selendra/selendra-sdk/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/selendra/selendra-sdk/releases/tag/v0.1.0
