# Selendra SDK & CLI - Development Tasks

> **Last Updated:** November 29, 2025  
> **Branch:** task1  
> **Status:** Active Development

This document tracks planned features, improvements, and bug fixes for the Selendra SDK and CLI tools.

---

## 📊 Task Overview

| Priority  | Total  | Completed | In Progress | Not Started |
| --------- | ------ | --------- | ----------- | ----------- |
| 🔴 High   | 6      | 6         | 0           | 0           |
| 🟡 Medium | 7      | 0         | 0           | 7           |
| 🟢 Low    | 5      | 0         | 0           | 5           |
| **Total** | **18** | **6**     | **0**       | **12**      |

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
const balances = await batchERC20Balances(client, [token1, token2], userAddress);
```

---

## 🟡 Medium Priority Tasks

Important for production-grade development but not blocking basic usage.

### TASK-007: Interactive Contract REPL

**Priority:** 🟡 Medium  
**Effort:** Medium (6-8 hours)  
**Component:** CLI  
**Status:** ⬜ Not Started

**Description:**  
Add `selendra interact <contract-address>` command for interactive contract interaction.

**Acceptance Criteria:**

- [ ] Load contract ABI from artifacts or user input
- [ ] Interactive prompt to select functions
- [ ] Support read and write operations
- [ ] History and tab completion
- [ ] Save interaction history

**Files to Create:**

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
**Status:** ⬜ Not Started

**Description:**  
Support a `selendra.config.ts` file for project-level configuration.

**Acceptance Criteria:**

- [ ] Auto-detect config file in project root
- [ ] Support network configurations
- [ ] Store deployed contract addresses
- [ ] Named accounts support
- [ ] Environment variable interpolation

**Files to Create:**

- `packages/cli/src/utils/config.ts`
- `packages/cli/src/templates/selendra.config.ts`

**Example Config:**

```typescript
// selendra.config.ts
export default {
  defaultNetwork: "testnet",
  networks: {
    testnet: {
      url: "https://rpc-testnet.selendra.org",
      chainId: 1953,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  contracts: {
    MyToken: {
      testnet: "0x123...",
      mainnet: "0x456...",
    },
  },
};
```

---

### TASK-009: ABI Management Commands

**Priority:** 🟡 Medium  
**Effort:** Low (2-3 hours)  
**Component:** CLI  
**Status:** ⬜ Not Started

**Description:**  
Add commands to export and import contract ABIs.

**Acceptance Criteria:**

- [ ] `selendra abi export <contract>` - Export ABI to JSON
- [ ] `selendra abi import <file>` - Import external ABI
- [ ] `selendra abi list` - List available ABIs
- [ ] Support TypeScript type generation

**Files to Create:**

- `packages/cli/src/commands/abi.ts`

---

### TASK-010: Event Logs Query Command

**Priority:** 🟡 Medium  
**Effort:** Medium (3-4 hours)  
**Component:** CLI  
**Status:** ⬜ Not Started

**Description:**  
Add `selendra logs <contract>` command to query and filter event logs.

**Acceptance Criteria:**

- [ ] Query events by contract address
- [ ] Filter by event name
- [ ] Filter by block range
- [ ] Decode event data with ABI
- [ ] Stream live events with `--watch`

**Files to Create:**

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
**Status:** ⬜ Not Started

**Description:**  
Add dry-run/simulation capability before sending transactions.

**Acceptance Criteria:**

- [ ] Simulate transaction without sending
- [ ] Return expected gas, return values, state changes
- [ ] Detect potential reverts before spending gas
- [ ] Support both EVM and Substrate

**Files to Modify:**

- `packages/core/src/providers/evm.ts`
- `packages/core/src/providers/substrate.ts`

---

### TASK-012: SDK Error Handling Improvements

**Priority:** 🟡 Medium  
**Effort:** Low (2-3 hours)  
**Component:** SDK  
**Status:** ⬜ Not Started

**Description:**  
Improve error messages and add error codes for better debugging.

**Acceptance Criteria:**

- [ ] Create `SelendraError` class with error codes
- [ ] Parse and decode revert reasons from contracts
- [ ] Add troubleshooting suggestions in errors
- [ ] Document all error codes

**Files to Create:**

- `packages/core/src/errors/index.ts`

---

### TASK-013: Account Management Improvements

**Priority:** 🟡 Medium  
**Effort:** Medium (4-6 hours)  
**Component:** CLI  
**Status:** ⬜ Not Started

**Description:**  
Enhance account management with encrypted keystore.

**Acceptance Criteria:**

- [ ] `selendra account import` - Import from private key or mnemonic
- [ ] `selendra account list` - List saved accounts
- [ ] `selendra account export` - Export account
- [ ] Encrypted local keystore
- [ ] Hardware wallet support (Ledger)

**Files to Modify:**

- `packages/cli/src/commands/account.ts`

---

## 🟢 Low Priority Tasks

Nice-to-have features for improved developer experience.

### TASK-014: Documentation Site

**Priority:** 🟢 Low  
**Effort:** High (8-16 hours)  
**Component:** Docs  
**Status:** ⬜ Not Started

**Description:**  
Create a documentation website using VitePress or Docusaurus.

**Acceptance Criteria:**

- [ ] API reference (from TypeDoc)
- [ ] Getting started guide
- [ ] Tutorials and examples
- [ ] Search functionality
- [ ] Deploy to GitHub Pages or Vercel

---

### TASK-015: Interactive Tutorials

**Priority:** 🟢 Low  
**Effort:** High (8-12 hours)  
**Component:** CLI  
**Status:** ⬜ Not Started

**Description:**  
Add `selendra learn` command with interactive tutorials.

**Acceptance Criteria:**

- [ ] Step-by-step guided tutorials
- [ ] Progress tracking
- [ ] Topics: First Contract, Tokens, NFTs, DeFi basics

---

### TASK-016: Network Health Dashboard

**Priority:** 🟢 Low  
**Effort:** Medium (4-6 hours)  
**Component:** CLI  
**Status:** ⬜ Not Started

**Description:**  
Enhanced `selendra status` with real-time network health.

**Acceptance Criteria:**

- [ ] TPS (transactions per second)
- [ ] Active validators count
- [ ] Network uptime
- [ ] Average block time
- [ ] Memory pool stats

---

### TASK-017: Plugin System

**Priority:** 🟢 Low  
**Effort:** High (12-20 hours)  
**Component:** CLI  
**Status:** ⬜ Not Started

**Description:**  
Allow third-party CLI plugins for extensibility.

**Acceptance Criteria:**

- [ ] Plugin discovery and installation
- [ ] Plugin API hooks
- [ ] Plugin registry
- [ ] Example plugins

---

### TASK-018: Bash/Zsh Completions

**Priority:** 🟢 Low  
**Effort:** Low (2-3 hours)  
**Component:** CLI  
**Status:** ⬜ Not Started

**Description:**  
Add shell auto-completion for CLI commands.

**Acceptance Criteria:**

- [ ] Bash completion script
- [ ] Zsh completion script
- [ ] Installation instructions
- [ ] Complete all commands and flags

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
[█████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 33% (6/18)
```

**Completed:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006

**Legend:**

- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ❌ Blocked
