/**
 * Staking Example - Bonding, Nominating, and Rewards
 *
 * This example demonstrates how to interact with Selendra's staking system.
 *
 * @example
 * ```bash
 * npx ts-node examples/staking/index.ts
 * ```
 */

import { createSDK, RewardDestination } from "../../src/index.js";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";

const RPC_URL = process.env.SELENDRA_RPC_URL || "wss://rpc.selendra.org";
const MNEMONIC = process.env.SELENDRA_MNEMONIC || "//Alice";

async function main() {
  console.log("🥩 Selendra Staking Example\n");

  // Connect to Selendra
  const sdk = createSDK({ rpcUrl: RPC_URL });
  await sdk.connect();
  console.log("✅ Connected to Selendra\n");

  // Create test account
  const keyring = new Keyring({ type: "sr25519" });
  const account = keyring.addFromUri(MNEMONIC);
  console.log(`📍 Account: ${account.address}\n`);

  // Get staking pallet
  const staking = sdk.pallets.staking;
  if (!staking) {
    console.error("❌ Staking pallet not available");
    await sdk.disconnect();
    return;
  }

  // ============================================
  // 1. Query Staking Information
  // ============================================
  console.log("=".repeat(50));
  console.log("📊 Staking Overview");
  console.log("=".repeat(50));

  // Active era
  const activeEra = await staking.queries.activeEra();
  console.log(`Active Era: ${activeEra?.index}`);

  // Current era
  const currentEra = await staking.queries.currentEra();
  console.log(`Current Era: ${currentEra}`);

  // Minimum bonds
  const minNominatorBond = await staking.queries.minNominatorBond();
  const minValidatorBond = await staking.queries.minValidatorBond();
  console.log(`Minimum Nominator Bond: ${minNominatorBond} planck`);
  console.log(`Minimum Validator Bond: ${minValidatorBond} planck`);

  // ============================================
  // 2. Check User's Staking Status
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("👤 Your Staking Status");
  console.log("=".repeat(50));

  // Check if bonded
  const bonded = await staking.queries.bonded(account.address);
  console.log(`Controller: ${bonded || "Not bonded"}`);

  // Get ledger
  const ledger = await staking.queries.ledger(account.address);
  if (ledger) {
    console.log(`Stash: ${ledger.stash}`);
    console.log(`Active Stake: ${ledger.active} planck`);
    console.log(`Total Stake: ${ledger.total} planck`);
    console.log(`Unlocking Chunks: ${ledger.unlocking.length}`);
  } else {
    console.log("Not staking");
  }

  // Check nominations
  const nominations = await staking.queries.nominators(account.address);
  if (nominations) {
    console.log(`\nNominating ${nominations.targets.length} validators:`);
    nominations.targets.slice(0, 5).forEach((target, i) => {
      console.log(`  ${i + 1}. ${target}`);
    });
  }

  // ============================================
  // 3. List Active Validators
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("🏛️  Active Validators");
  console.log("=".repeat(50));

  // Get validators from session
  const session = sdk.pallets.session;
  if (session) {
    const validators = await session.queries.validators();
    console.log(`Total Validators: ${validators.length}`);
    validators.slice(0, 5).forEach((validator, i) => {
      console.log(`  ${i + 1}. ${validator}`);
    });
  }

  // ============================================
  // 4. Example: Bond Tokens (Dry Run)
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("🔗 Bond Tokens (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To bond tokens for staking, you would call:

const result = await staking.manager.bond(signer, signerAddress, {
  value: '1000000000000000000000',  // 1000 SEL
  payee: 'Staked',  // Compound rewards
});

Payee Options:
- 'Staked': Compound rewards back into stake
- 'Stash': Send rewards to stash account
- 'Controller': Send rewards to controller account
- { Account: 'address' }: Send rewards to specific account
  `);

  // ============================================
  // 5. Example: Nominate Validators (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("👥 Nominate Validators (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To nominate validators, you would call:

const result = await staking.manager.nominate(signer, signerAddress, {
  targets: [
    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
  ],
});

Tips for choosing validators:
- Check their commission rate
- Look at their uptime history
- Diversify across different validators
- Max 16 nominations allowed
  `);

  // ============================================
  // 6. Example: Unbond and Withdraw (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("🔓 Unbond and Withdraw (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To unbond tokens:

// 1. Unbond (starts the unbonding period)
await staking.manager.unbond(signer, signerAddress, {
  value: '500000000000000000000',  // 500 SEL
});

// 2. After unbonding period (28 eras), withdraw
await staking.manager.withdrawUnbonded(signer, signerAddress, {
  numSlashingSpans: 0,
});

Note: Unbonding period is typically 28 eras (~28 days).
  `);

  // ============================================
  // 7. Example: Claim Rewards (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("💰 Claim Rewards (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To claim staking rewards:

const result = await staking.manager.payoutStakers(signer, signerAddress, {
  validatorStash: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  era: 100,  // Era to claim rewards for
});

Note: You can only claim rewards for the last 84 eras.
Check pending rewards before claiming.
  `);

  // Disconnect
  await sdk.disconnect();
  console.log("\n✅ Disconnected from Selendra");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
