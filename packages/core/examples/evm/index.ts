/**
 * EVM Interactions Example
 *
 * This example demonstrates how to interact with Selendra's EVM layer,
 * including deploying contracts, calling functions, and managing accounts.
 *
 * @example
 * ```bash
 * npx ts-node examples/evm/index.ts
 * ```
 */

import { createSDK } from "../../src/index.js";
import { Keyring } from "@polkadot/keyring";

const RPC_URL = process.env.SELENDRA_RPC_URL || "wss://rpc.selendra.org";
const MNEMONIC = process.env.SELENDRA_MNEMONIC || "//Alice";

// Sample ERC20 bytecode (simplified for example)
const SAMPLE_ERC20_BYTECODE = "0x608060405234801561001057600080fd5b50...";

async function main() {
  console.log("🔮 Selendra EVM Example\n");

  // Connect to Selendra
  const sdk = createSDK({ rpcUrl: RPC_URL });
  await sdk.connect();
  console.log("✅ Connected to Selendra\n");

  // Create test account
  const keyring = new Keyring({ type: "sr25519" });
  const account = keyring.addFromUri(MNEMONIC);
  console.log(`📍 Substrate Account: ${account.address}\n`);

  // Get EVM pallet
  const evm = sdk.pallets.evm;
  if (!evm) {
    console.error("❌ EVM pallet not available");
    await sdk.disconnect();
    return;
  }

  // Get Ethereum pallet for transaction handling
  const ethereum = sdk.pallets.ethereum;

  // ============================================
  // 1. Account Mapping
  // ============================================
  console.log("=".repeat(50));
  console.log("🔗 Account Mapping");
  console.log("=".repeat(50));

  // Derive H160 address from Substrate account
  // In production, use unified accounts pallet
  console.log(`
Selendra supports unified accounts:
- Substrate address: ${account.address}
- Corresponding EVM address is derived from public key

To link accounts, use the Unified Accounts pallet:
  await sdk.pallets.unifiedAccounts?.manager.claim(signer, {
    evmAddress: '0x...',
    signature: '0x...'
  });
  `);

  // ============================================
  // 2. Check EVM Account State
  // ============================================
  console.log("=".repeat(50));
  console.log("💼 EVM Account State");
  console.log("=".repeat(50));

  const evmAddress =
    "0x0000000000000000000000000000000000000001" as `0x${string}`;

  try {
    const accountInfo = await evm.queries.accountBasic(evmAddress);
    console.log(`Address: ${evmAddress}`);
    console.log(`Balance: ${accountInfo.balance} wei`);
    console.log(`Nonce: ${accountInfo.nonce}`);
  } catch (error) {
    console.log("Could not fetch EVM account info");
  }

  // ============================================
  // 3. Read Contract Storage
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("📖 Contract Storage");
  console.log("=".repeat(50));

  const contractAddress =
    "0x0000000000000000000000000000000000000802" as `0x${string}`;
  const storageSlot =
    "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

  try {
    const storageValue = await evm.queries.accountStorageAt(
      contractAddress,
      storageSlot
    );
    console.log(`Contract: ${contractAddress}`);
    console.log(`Slot: ${storageSlot}`);
    console.log(`Value: ${storageValue}`);
  } catch (error) {
    console.log("Could not read storage");
  }

  // ============================================
  // 4. Deploy Contract (Dry Run)
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("🚀 Deploy Contract (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To deploy a contract via EVM pallet:

const result = await evm.manager.create(signer, signerAddress, {
  source: '0xYourEvmAddress...',
  init: '${SAMPLE_ERC20_BYTECODE.slice(0, 50)}...',
  value: '0',
  gasLimit: 3000000n,
  maxFeePerGas: 1000000000n,  // 1 Gwei
  maxPriorityFeePerGas: 1000000000n,
  nonce: 0n,
  accessList: [],
});

The contract address will be in the events.
  `);

  // ============================================
  // 5. Call Contract (Read - Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("📞 Call Contract (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To call a contract function (read):

// Encode function call data
const data = '0x70a08231' +  // balanceOf selector
  '000000000000000000000000' +
  'YourAddress'.slice(2).padStart(40, '0');

const result = await evm.manager.call(signer, signerAddress, {
  source: '0xYourEvmAddress...',
  target: '${contractAddress}',
  input: data,
  value: '0',
  gasLimit: 100000n,
  maxFeePerGas: 1000000000n,
  maxPriorityFeePerGas: 1000000000n,
  nonce: null,  // Let chain determine
  accessList: [],
});
  `);

  // ============================================
  // 6. Send Transaction (Write - Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("📤 Send Transaction (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To send a state-changing transaction:

// Transfer ERC20 tokens
const transferData = '0xa9059cbb' +  // transfer selector
  '000000000000000000000000' +
  'RecipientAddress'.slice(2).padStart(40, '0') +
  amount.toString(16).padStart(64, '0');

const result = await evm.manager.call(signer, signerAddress, {
  source: '0xYourEvmAddress...',
  target: '${contractAddress}',
  input: transferData,
  value: '0',
  gasLimit: 100000n,
  maxFeePerGas: 1000000000n,
  maxPriorityFeePerGas: 1000000000n,
  nonce: null,
  accessList: [],
});
  `);

  // ============================================
  // 7. Ethereum Transact (Dry Run)
  // ============================================
  if (ethereum) {
    console.log("=".repeat(50));
    console.log("⛓️ Ethereum Transact (Example - Not Executed)");
    console.log("=".repeat(50));

    console.log(`
Using the Ethereum pallet for EIP-1559 transactions:

const tx: EIP1559Transaction = {
  chainId: 222,  // Selendra chain ID
  nonce: 0,
  maxPriorityFeePerGas: 1000000000n,  // 1 Gwei
  maxFeePerGas: 2000000000n,  // 2 Gwei
  gasLimit: 21000n,
  action: {
    Call: '0xRecipientAddress...'
  },
  value: '1000000000000000000',  // 1 SEL in wei
  input: '0x',
  accessList: [],
  oddYParity: false,
  r: '0x...',
  s: '0x...'
};

await ethereum.manager.transact(signer, signerAddress, tx);
    `);
  }

  // ============================================
  // 8. Dynamic Base Fee
  // ============================================
  console.log("=".repeat(50));
  console.log("⛽ Dynamic Base Fee");
  console.log("=".repeat(50));

  const dynamicFee = sdk.pallets.dynamicEvmBaseFee;
  if (dynamicFee) {
    try {
      const baseFee = await dynamicFee.queries.baseFeePerGas();
      console.log(`Current Base Fee: ${baseFee} wei`);
      console.log(`In Gwei: ${Number(baseFee) / 1e9} Gwei`);
    } catch (error) {
      console.log("Could not fetch base fee");
    }
  }

  // ============================================
  // 9. Precompiles
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("🔧 Available Precompiles");
  console.log("=".repeat(50));

  console.log(`
Selendra includes standard Ethereum precompiles:

Address                                     | Function
-------------------------------------------|------------------------
0x0000...0001                              | ecrecover
0x0000...0002                              | sha256
0x0000...0003                              | ripemd160
0x0000...0004                              | identity
0x0000...0005                              | modexp
0x0000...0006                              | bn128Add
0x0000...0007                              | bn128Mul
0x0000...0008                              | bn128Pairing
0x0000...0009                              | blake2f

Plus Selendra-specific precompiles for:
- Substrate <-> EVM bridging
- Native token operations
- Cross-VM calls (XVM)
  `);

  // Disconnect
  await sdk.disconnect();
  console.log("\n✅ Disconnected from Selendra");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
