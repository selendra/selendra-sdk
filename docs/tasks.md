# Selendra SDK & CLI - Development Tasks

> **Last Updated:** November 29, 2025  
> **Branch:** task1  
> **Status:** ✅ Completed - Ready for v2.0.0 Release
> **Version:** SDK v2.0.0 | CLI v1.0.0

This document tracks planned features, improvements, and bug fixes for the Selendra SDK and CLI tools.

---

## 🎉 v2.0.0 Release Notes

**Breaking Changes:**

- Migrated EVM stack from ethers.js to viem + wagmi
- `getEvmProvider()` returns viem's `PublicClient` instead of ethers `JsonRpcProvider`
- Contract interactions use viem's `getContract()` API
- Wallet utilities use viem's `PrivateKeyAccount` type
- BigNumber replaced with native JavaScript `bigint`

See [CHANGELOG.md](/packages/core/CHANGELOG.md) for full migration guide.

---

## 📊 Task Overview

| Priority  | Total  | Completed | In Progress | Not Started |
| --------- | ------ | --------- | ----------- | ----------- |
| 🔴 High   | 6      | 6         | 0           | 0           |
| 🟡 Medium | 7      | 7         | 0           | 0           |
| 🟢 Low    | 5      | 5         | 0           | 0           |
| **Total** | **18** | **18**    | **0**       | **0**       |

---

## 🔴 High Priority Tasks

These are critical for developer experience and should be implemented first.

### TASK-001: Working Faucet API Integration

**Priority:** 🔴 High  
**Effort:** Low (2-4 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Currently, `selendra faucet <address>` only displays manual instructions. Need to integrate with the actual faucet API for automatic token distribution.

**Acceptance Criteria:**

- [x] Integrate with Selendra testnet faucet API
- [x] Auto-request tokens with rate limiting awareness
- [x] Show clear success/failure messages with tx hash
- [x] Handle API errors gracefully (rate limit, invalid address)
- [x] Fallback to manual instructions if API unavailable

**Files Modified:**

- `packages/cli/src/commands/faucet.ts`

**API Endpoint:**

```
POST https://faucet-api.selendra.org/drip
Body: { address: "0x..." }
```

**Environment Variable:** `SELENDRA_FAUCET_API` - Override faucet API URL

---

### TASK-002: Transaction Lookup Command

**Priority:** 🔴 High  
**Effort:** Low (2-3 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Add `selendra tx <hash>` command to look up transaction details from the blockchain.

**Acceptance Criteria:**

- [x] Query transaction by hash (EVM and Substrate)
- [x] Display: status, block, from, to, value, gas used, timestamp
- [x] Format output nicely with colors
- [x] Add `--json` flag for programmatic output
- [x] Link to block explorer

**Files to Create:**

- `packages/cli/src/commands/tx.ts`

**Example Usage:**

```bash
selendra tx 0x123... --network testnet
selendra tx 0x123... --json
```

---

### TASK-003: Contract Verification Command

**Priority:** 🔴 High  
**Effort:** Medium (4-8 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Add `selendra verify <address> <contract-name>` command to verify contracts on the Selendra block explorer.

**Acceptance Criteria:**

- [x] Read contract source from artifacts (Hardhat/Foundry)
- [x] Submit to explorer verification API
- [x] Support constructor arguments
- [x] Auto-detect compiler version and optimization settings
- [x] Handle verification status polling
- [x] Fallback to manual instructions if API unavailable

**Files Created:**

- `packages/cli/src/commands/verify.ts`

**Example Usage:**

```bash
selendra verify 0x123... MyToken --network testnet
selendra verify 0x123... MyToken --constructor "0x..." --compiler 0.8.20
```

---

### TASK-004: Gas Estimation Utility

**Priority:** 🔴 High  
**Effort:** Low (2-3 hours)  
**Component:** SDK + CLI  
**Status:** ✅ Completed

**Description:**  
Add gas estimation before sending transactions and a CLI command to check current gas prices.

**Acceptance Criteria:**

- [x] SDK: Add `estimateGas()` method for transactions
- [x] SDK: Add `estimateContractGas()` for contract calls
- [x] CLI: Add `selendra gas` command showing current prices
- [x] Show gas in gwei and estimated cost in SEL

**Files to Modify/Create:**

- `packages/core/src/providers/evm.ts` - Add estimation methods
- `packages/cli/src/commands/gas.ts` - New command

**Example Usage:**

```bash
selendra gas --network testnet
# Output:
# Gas Price: 1.5 gwei
# Base Fee: 1.0 gwei
# Priority Fee: 0.5 gwei
# Estimated transfer cost: 0.000031 SEL
```

---

### TASK-005: Block Explorer Command

**Priority:** 🔴 High  
**Effort:** Low (2-3 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Add `selendra block <number|hash|latest>` command to inspect block details.

**Acceptance Criteria:**

- [x] Query block by number, hash, or "latest"
- [x] Display: number, hash, timestamp, tx count, gas used, miner
- [x] Support both EVM and Substrate blocks
- [x] Add `--json` flag
- [x] Add `--txs` flag to list transactions

**Files to Create:**

- `packages/cli/src/commands/block.ts`

**Example Usage:**

```bash
selendra block latest --network testnet
selendra block 1000000 --txs
```

---

### TASK-006: Multicall Support

**Priority:** 🔴 High  
**Effort:** Medium (4-6 hours)  
**Component:** SDK  
**Status:** ✅ Completed

**Description:**  
Add multicall support to batch multiple read calls into a single RPC request. Essential for dApp performance.

**Acceptance Criteria:**

- [x] Implement `Multicall` class using standard Multicall3 contract
- [x] Support arbitrary contract calls in a batch
- [x] Return typed results
- [x] Handle partial failures gracefully
- [x] Helper functions for common patterns (ERC20 balances, token info)

**Files Created:**

- `packages/core/src/utils/multicall.ts`

**Exports Added:**

- `Multicall` - Main class
- `createMulticall()` - Factory function
- `batchERC20Balances()` - Batch token balance checks
- `batchERC20Info()` - Batch token info (name, symbol, decimals)
- `MULTICALL3_ADDRESS` - Standard Multicall3 address

**Example Usage:**

```typescript
import { createMulticall, batchERC20Balances } from "@selendrajs/sdk";

// Using Multicall class
const multicall = createMulticall(client);
const results = await multicall.call([
  { address: tokenA, abi: erc20Abi, functionName: "balanceOf", args: [user] },
  { address: tokenB, abi: erc20Abi, functionName: "totalSupply" },
]);

// Using helper function
const balances = await batchERC20Balances(
  client,
  [token1, token2],
  userAddress
);
```

---

## 🟡 Medium Priority Tasks

Important for production-grade development but not blocking basic usage.

### TASK-007: Interactive Contract REPL

**Priority:** 🟡 Medium  
**Effort:** Medium (6-8 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Add `selendra interact <contract-address>` command for interactive contract interaction.

**Acceptance Criteria:**

- [x] Load contract ABI from artifacts or user input
- [x] Interactive prompt to select functions
- [x] Support read and write operations
- [x] History and tab completion
- [x] Save interaction history

**Files Created:**

- `packages/cli/src/commands/interact.ts`

**Example Usage:**

```bash
selendra interact 0x123... --abi ./MyToken.json
> balanceOf(0x456...)
> transfer(0x789..., 1000000000000000000)
```

---

### TASK-008: Project Configuration File

**Priority:** 🟡 Medium  
**Effort:** Medium (4-6 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Support a `selendra.config.ts` file for project-level configuration.

**Acceptance Criteria:**

- [x] Auto-detect config file in project root
- [x] Support network configurations
- [x] Store deployed contract addresses
- [x] Named accounts support
- [x] Environment variable interpolation

**Files Created:**

- `packages/cli/src/utils/config.ts`

**Exports Added:**

- `defineConfig()` - Type-safe config helper
- `loadConfig()` - Load config from file
- `SelendraConfig` - Type definition

**Example Config:**

```typescript
// selendra.config.ts
import { defineConfig } from "@selendrajs/cli";

export default defineConfig({
  defaultNetwork: "testnet",
  networks: {
    testnet: {
      rpc: "https://rpc.testnet.selendra.org",
      chainId: 1953,
    },
  },
  solidity: {
    version: "0.8.24",
    optimizer: { enabled: true, runs: 200 },
  },
});
```

---

### TASK-009: ABI Management Commands

**Priority:** 🟡 Medium  
**Effort:** Low (2-3 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Add commands to export and import contract ABIs.

**Acceptance Criteria:**

- [x] `selendra abi export <contract>` - Export ABI to JSON
- [x] `selendra abi import <file>` - Import external ABI
- [x] `selendra abi list` - List available ABIs
- [x] `selendra abi types` - TypeScript type generation

**Files Created:**

- `packages/cli/src/commands/abi.ts`

---

### TASK-010: Event Logs Query Command

**Priority:** 🟡 Medium  
**Effort:** Medium (3-4 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Add `selendra logs <contract>` command to query and filter event logs.

**Acceptance Criteria:**

- [x] Query events by contract address
- [x] Filter by event name
- [x] Filter by block range
- [x] Decode event data with ABI
- [x] Stream live events with `--watch`

**Files Created:**

- `packages/cli/src/commands/logs.ts`

**Example Usage:**

```bash
selendra logs 0x123... --event Transfer --from-block 1000000
selendra logs 0x123... --watch
```

---

### TASK-011: Transaction Simulation

**Priority:** 🟡 Medium  
**Effort:** Medium (4-6 hours)  
**Component:** SDK  
**Status:** ✅ Completed

**Description:**  
Add dry-run/simulation capability before sending transactions.

**Acceptance Criteria:**

- [x] Simulate transaction without sending
- [x] Return expected gas, return values, state changes
- [x] Detect potential reverts before spending gas
- [x] Support EVM transactions

**Files Modified:**

- `packages/core/src/providers/evm.ts`

**Methods Added:**

- `simulateTransaction()` - Simulate raw transaction
- `simulateContractCall()` - Simulate contract function call
- `dryRunBatch()` - Simulate multiple transactions in sequence
- `wouldSucceed()` - Simple success check helper

---

### TASK-012: SDK Error Handling Improvements

**Priority:** 🟡 Medium  
**Effort:** Low (2-3 hours)  
**Component:** SDK  
**Status:** ✅ Completed

**Description:**  
Improve error messages and add error codes for better debugging.

**Acceptance Criteria:**

- [x] Create `SelendraError` class with error codes
- [x] Parse and decode revert reasons from contracts
- [x] Add troubleshooting suggestions in errors
- [x] Document all error codes

**Files Created:**

- `packages/core/src/errors/index.ts`

**Error Classes Added:**

- `SelendraError` - Base error class
- `ConnectionError`, `NetworkUnavailableError`, `RpcError`
- `TransactionError`, `InsufficientFundsError`, `GasEstimationError`
- `TransactionRevertedError`, `TransactionTimeoutError`, `NonceTooLowError`
- `ContractError`, `ContractNotFoundError`, `ContractCallError`, `AbiNotFoundError`
- `AccountError`, `AccountNotFoundError`, `InvalidPrivateKeyError`, `SigningError`
- `ValidationError`, `InvalidAddressError`, `InvalidAmountError`
- `ConfigurationError`, `MissingConfigError`
- `SubstrateError`, `ExtrinsicFailedError`

**Helper Functions:**

- `isSelendraError()`, `hasErrorCode()`, `wrapError()`, `parseRpcError()`

---

### TASK-013: Account Management Improvements

**Priority:** 🟡 Medium  
**Effort:** Medium (4-6 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Enhance account management with encrypted keystore.

**Acceptance Criteria:**

- [x] `selendra account import` - Import from private key or mnemonic
- [x] `selendra account list` - List saved accounts
- [x] `selendra account export` - Export account
- [x] `selendra account show` - Show account details
- [x] `selendra account delete` - Delete saved account
- [x] Encrypted local keystore (AES-256-CBC)

**Files Modified:**

- `packages/cli/src/commands/account.ts`

**Keystore Location:** `~/.selendra/keystore/accounts.json`

---

## 🟢 Low Priority Tasks

Nice-to-have features for improved developer experience.

### TASK-014: Documentation Site

**Priority:** 🟢 Low  
**Effort:** High (8-16 hours)  
**Component:** Docs  
**Status:** ✅ Completed

**Description:**  
Create a documentation website using VitePress or Docusaurus.

**Acceptance Criteria:**

- [x] API reference (from TypeDoc)
- [x] Getting started guide
- [x] Tutorials and examples
- [x] Search functionality
- [x] Deploy to GitHub Pages or Vercel

**Files Created:**

- `docs/package.json` - VitePress dependencies
- `docs/.vitepress/config.ts` - VitePress configuration
- `docs/index.md` - Home page
- `docs/guide/*.md` - Getting started guides
- `docs/cli/*.md` - CLI documentation
- `docs/api/*.md` - API reference
- `docs/examples/*.md` - Code examples

---

### TASK-015: Interactive Tutorials

**Priority:** 🟢 Low  
**Effort:** High (8-12 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Add `selendra learn` command with interactive tutorials.

**Acceptance Criteria:**

- [x] Step-by-step guided tutorials
- [x] Progress tracking
- [x] Topics: First Contract, Tokens, NFTs, DeFi basics

**Files Created:**

- `packages/cli/src/commands/learn.ts`

**Tutorials Implemented:**

- Getting Started with Selendra (beginner, 15 min)
- Your First Smart Contract (beginner, 25 min)
- DeFi Basics on Selendra (intermediate, 30 min)
- Creating NFTs on Selendra (intermediate, 35 min)

**Example Usage:**

```bash
selendra learn              # Interactive menu
selendra learn --list       # List tutorials
selendra learn getting-started  # Start specific tutorial
selendra learn --reset      # Reset progress
```

---

### TASK-016: Network Health Dashboard

**Priority:** 🟢 Low  
**Effort:** Medium (4-6 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Enhanced `selendra status` with real-time network health.

**Acceptance Criteria:**

- [x] TPS (transactions per second)
- [x] RPC latency measurement
- [x] Network uptime
- [x] Average block time
- [x] Sync status and finality info
- [x] `--health` flag for detailed metrics
- [x] `--watch` flag for live updates

**Files Modified:**

- `packages/cli/src/commands/status.ts`

**Example Usage:**

```bash
selendra status --health
selendra status --watch
```

---

### TASK-017: Plugin System

**Priority:** 🟢 Low  
**Effort:** High (12-20 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Allow third-party CLI plugins for extensibility.

**Acceptance Criteria:**

- [x] Plugin discovery and installation
- [x] Plugin API hooks
- [x] Plugin registry
- [x] Example plugins

**Files Created:**

- `packages/cli/src/commands/plugin.ts`

**Plugin Commands:**

- `selendra plugin install <source>` - Install from npm, local, or git
- `selendra plugin uninstall <plugin>` - Remove a plugin
- `selendra plugin list` - List installed plugins
- `selendra plugin list --available` - Show available plugins
- `selendra plugin enable/disable <plugin>` - Toggle plugins
- `selendra plugin update [plugin]` - Update plugins
- `selendra plugin info <plugin>` - Show plugin details
- `selendra plugin create [name]` - Create new plugin project

**Plugin Hooks:**

- `preCompile`, `postCompile`
- `preDeploy`, `postDeploy`
- `preTest`, `postTest`

**Example Usage:**

```bash
# Install from npm
selendra plugin install @selendrajs/plugin-gas-reporter

# Install from local
selendra plugin install ./my-plugin --local

# Create new plugin
selendra plugin create my-awesome-plugin
```

---

### TASK-018: Bash/Zsh Completions

**Priority:** 🟢 Low  
**Effort:** Low (2-3 hours)  
**Component:** CLI  
**Status:** ✅ Completed

**Description:**  
Add shell auto-completion for CLI commands.

**Acceptance Criteria:**

- [x] Bash completion script
- [x] Zsh completion script
- [x] Installation instructions
- [x] Complete all commands and flags

**Files Created:**

- `packages/cli/completions/selendra.bash`
- `packages/cli/completions/_selendra` (zsh)

**Installation:**

```bash
# Bash
source ~/.selendra/completions/selendra.bash

# Zsh
fpath=(~/.selendra/completions $fpath)
autoload -Uz compinit && compinit
```

---

### TASK-019: Documentation

document all inside /home/user0/projects/selendra-biz/selendra/devtools/website-docs/content/docs

---

## 🐛 Bug Fixes & Technical Debt

### BUG-001: Package Lock Sync

**Priority:** 🟡 Medium  
**Status:** ⬜ Not Started

Update all package-lock.json files after viem migration.

### BUG-002: Test Coverage

**Priority:** 🟡 Medium  
**Status:** ⬜ Not Started

Add unit tests for CLI commands. Current coverage is minimal.

### BUG-003: ESLint Configuration

**Priority:** 🟢 Low  
**Status:** ⬜ Not Started

Add ESLint + Prettier configuration for consistent code style.

---

## 📝 Notes

### Dependencies for Tasks

- **TASK-003** (Verify) depends on Selendra Explorer API availability
- **TASK-006** (Multicall) may require deploying Multicall3 contract
- **TASK-001** (Faucet) depends on faucet API endpoint

### Version Planning

| Version | Tasks                                  |
| ------- | -------------------------------------- |
| v1.1.0  | TASK-001, TASK-002, TASK-004, TASK-005 |
| v1.2.0  | TASK-003, TASK-006, TASK-007           |
| v1.3.0  | TASK-008, TASK-009, TASK-010           |
| v2.0.0  | TASK-011, TASK-012, TASK-013, TASK-014 |

---

## 📋 How to Contribute

1. Pick a task from the list above
2. Create a branch: `feat/TASK-XXX-description`
3. Implement with tests
4. Update this document with status
5. Submit PR for review

---

## 📈 Progress Tracking

```
[██████████████████████████████████████████████████] 100% (18/18)
```

**Completed:** All 18 tasks ✅

**Legend:**

- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ❌ Blocked
