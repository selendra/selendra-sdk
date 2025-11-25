/**
 * Contracts Example
 *
 * This example demonstrates how to interact with ink! smart contracts
 * deployed on Selendra's native contracts pallet (pallet-contracts).
 *
 * @example
 * ```bash
 * npx ts-node examples/contracts/index.ts
 * ```
 */

import { createSDK } from "../../src/index.js";
import { Keyring } from "@polkadot/keyring";

const RPC_URL = process.env.SELENDRA_RPC_URL || "wss://rpc.selendra.org";
const MNEMONIC = process.env.SELENDRA_MNEMONIC || "//Alice";

// Sample ink! contract code hash (for example purposes)
const SAMPLE_CODE_HASH =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

async function main() {
  console.log("📝 Selendra Contracts Example\n");

  // Connect to Selendra
  const sdk = createSDK({ rpcUrl: RPC_URL });
  await sdk.connect();
  console.log("✅ Connected to Selendra\n");

  // Create test account
  const keyring = new Keyring({ type: "sr25519" });
  const account = keyring.addFromUri(MNEMONIC);
  console.log(`📍 Account: ${account.address}\n`);

  // Get Contracts pallet
  const contracts = sdk.pallets.contracts;
  if (!contracts) {
    console.error("❌ Contracts pallet not available");
    await sdk.disconnect();
    return;
  }

  // ============================================
  // 1. Query Deposit Constants
  // ============================================
  console.log("=".repeat(50));
  console.log("💰 Contract Deposit Requirements");
  console.log("=".repeat(50));

  const depositPerByte = await contracts.queries.depositPerByte();
  const depositPerItem = await contracts.queries.depositPerItem();

  console.log(`Deposit per Byte: ${depositPerByte} planck`);
  console.log(`Deposit per Item: ${depositPerItem} planck`);
  console.log(`
Note: Deploying contracts requires a deposit based on:
- Code size (bytes)
- Storage items used
  `);

  // ============================================
  // 2. Check Code Existence
  // ============================================
  console.log("=".repeat(50));
  console.log("📦 Code Storage");
  console.log("=".repeat(50));

  try {
    const codeInfo = await contracts.queries.codeInfoOf(SAMPLE_CODE_HASH);
    if (codeInfo) {
      console.log(`Code Hash: ${SAMPLE_CODE_HASH}`);
      console.log("Code exists on chain!");
    } else {
      console.log(`Code hash ${SAMPLE_CODE_HASH.slice(0, 20)}... not found`);
    }
  } catch (error) {
    console.log("Could not query code info");
  }

  // ============================================
  // 3. Query Contract Info
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("📋 Contract Info");
  console.log("=".repeat(50));

  const sampleContractAddress = account.address; // Use account for demo

  try {
    const contractInfo = await contracts.queries.contractInfoOf(
      sampleContractAddress
    );
    if (contractInfo) {
      console.log(`Contract: ${sampleContractAddress}`);
      console.log(`Code Hash: ${contractInfo.codeHash}`);
      console.log(`Trie ID: ${contractInfo.trieId}`);
      console.log(`Storage Items: ${contractInfo.storageItems}`);
      console.log(`Storage Bytes: ${contractInfo.storageBytes}`);
    } else {
      console.log("No contract at this address");
    }
  } catch (error) {
    console.log("Could not query contract info");
  }

  // ============================================
  // 4. Upload Code (Dry Run)
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("📤 Upload Code (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To upload ink! contract code:

// Read the contract WASM
const wasm = fs.readFileSync('my_contract.wasm');

const result = await contracts.manager.uploadCode(signer, signerAddress, {
  code: wasm,
  storageDepositLimit: null,  // No limit
  determinism: 'Enforced',    // Required for on-chain contracts
});

// Code hash will be in the events
console.log('Code hash:', result.codeHash);

The code is now on-chain and can be instantiated multiple times.
  `);

  // ============================================
  // 5. Instantiate Contract (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("🔨 Instantiate Contract (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To instantiate a contract from uploaded code:

const result = await contracts.manager.instantiate(signer, signerAddress, {
  value: '0',                     // Initial balance
  gasLimit: { refTime: 1000000000n, proofSize: 100000n },
  storageDepositLimit: null,      // No limit
  code: { Existing: '${SAMPLE_CODE_HASH}' },
  data: '0x...',                  // Constructor selector + args
  salt: '0x...',                  // For address derivation
});

// Or instantiate with deterministic address:
await contracts.manager.instantiateWithCode(signer, signerAddress, {
  value: '0',
  gasLimit: { refTime: 1000000000n, proofSize: 100000n },
  storageDepositLimit: null,
  code: wasmBytes,
  data: '0x...',
  salt: '0x...',
});
  `);

  // ============================================
  // 6. Call Contract (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("📞 Call Contract (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To call a contract message:

// Encode message call using contract ABI
// e.g., for a PSP22 'balance_of' call
const selector = '0x162df8c2';  // balance_of selector
const encodedArgs = encodeArgs(['5GrwvaEF...']);

const result = await contracts.manager.call(signer, signerAddress, {
  dest: '${sampleContractAddress}',
  value: '0',
  gasLimit: { refTime: 100000000n, proofSize: 10000n },
  storageDepositLimit: null,
  data: selector + encodedArgs,
});

// Decode the response using contract ABI
const balance = decodeResponse(result);
  `);

  // ============================================
  // 7. Dry Run (Free Query)
  // ============================================
  console.log("=".repeat(50));
  console.log("🔍 Dry Run / Free Query");
  console.log("=".repeat(50));

  console.log(`
For read-only queries, use RPC dry run (no transaction needed):

// Using the contracts RPC endpoint
const api = await sdk.getApi();

const result = await api.call.contractsApi.call(
  account.address,           // Origin
  contractAddress,           // Destination
  0,                         // Value
  gasLimit,
  storageDepositLimit,
  inputData
);

if (result.isOk) {
  const output = result.asOk;
  // Decode output
}

This is free and doesn't modify state.
  `);

  // ============================================
  // 8. ink! Best Practices
  // ============================================
  console.log("=".repeat(50));
  console.log("📘 ink! Best Practices");
  console.log("=".repeat(50));

  console.log(`
1. Contract Development:
   - Use ink! framework for Rust contracts
   - Install: cargo install cargo-contract
   - Build: cargo contract build --release
   - Test: cargo contract test

2. Standards:
   - PSP22: Fungible tokens (like ERC20)
   - PSP34: Non-fungible tokens (like ERC721)
   - PSP37: Multi-token (like ERC1155)

3. Tools:
   - Contracts UI: https://contracts-ui.substrate.io
   - Polkadot.js Apps: Upload and instantiate
   - cargo-contract: CLI for development

4. Gas Estimation:
   - Always estimate gas with dry-run before submit
   - Include safety margin (e.g., 10%)

5. Storage Deposits:
   - Contracts pay for storage they use
   - Unused deposits are refunded
  `);

  // ============================================
  // 9. XVM Cross-VM Calls
  // ============================================
  console.log("=".repeat(50));
  console.log("🔀 XVM Cross-VM Calls");
  console.log("=".repeat(50));

  const xvm = sdk.pallets.xvm;
  if (xvm) {
    console.log(`
Selendra supports cross-VM calls between WASM and EVM:

// Call EVM contract from WASM context
await xvm.manager.call(signer, signerAddress, {
  vmId: 'EVM',
  to: '0xEvmContractAddress...',
  input: '0x...',  // ABI encoded call
  value: '0',
  maxGas: 1000000n,
});

This enables:
- EVM contracts calling WASM contracts
- WASM contracts calling EVM contracts
- Unified liquidity and composability
    `);
  } else {
    console.log("XVM pallet not available");
  }

  // Disconnect
  await sdk.disconnect();
  console.log("\n✅ Disconnected from Selendra");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
