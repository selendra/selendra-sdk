/**
 * Nomination Pools Example
 *
 * This example demonstrates how to interact with Selendra's nomination pools.
 * Pools allow smaller token holders to participate in staking together.
 *
 * @example
 * ```bash
 * npx ts-node examples/pools/index.ts
 * ```
 */

import { createSDK } from "../../src/index.js";
import { Keyring } from "@polkadot/keyring";

const RPC_URL = process.env.SELENDRA_RPC_URL || "wss://rpc.selendra.org";
const MNEMONIC = process.env.SELENDRA_MNEMONIC || "//Alice";

async function main() {
  console.log("🏊 Selendra Nomination Pools Example\n");

  // Connect to Selendra
  const sdk = createSDK({ rpcUrl: RPC_URL });
  await sdk.connect();
  console.log("✅ Connected to Selendra\n");

  // Create test account
  const keyring = new Keyring({ type: "sr25519" });
  const account = keyring.addFromUri(MNEMONIC);
  console.log(`📍 Account: ${account.address}\n`);

  // Get nomination pools pallet
  const pools = sdk.pallets.nominationPools;
  if (!pools) {
    console.error("❌ Nomination Pools pallet not available");
    await sdk.disconnect();
    return;
  }

  // ============================================
  // 1. Query Pools Overview
  // ============================================
  console.log("=".repeat(50));
  console.log("📊 Pools Overview");
  console.log("=".repeat(50));

  const lastPoolId = await pools.queries.lastPoolId();
  console.log(`Total Pools: ${lastPoolId}`);

  const minJoinBond = await pools.queries.minJoinBond();
  const minCreateBond = await pools.queries.minCreateBond();
  console.log(`Minimum Join Bond: ${minJoinBond} planck`);
  console.log(`Minimum Create Bond: ${minCreateBond} planck`);

  // ============================================
  // 2. List Active Pools
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("🏊 Active Pools");
  console.log("=".repeat(50));

  const allPools = await pools.queries.getAllPools();
  console.log(`Active Pools: ${allPools.length}\n`);

  allPools.slice(0, 5).forEach((pool, i) => {
    console.log(`Pool #${i + 1}:`);
    console.log(`  State: ${pool.state}`);
    console.log(`  Member Count: ${pool.memberCounter}`);
    console.log(`  Points: ${pool.points}`);
    console.log("");
  });

  // ============================================
  // 3. Check Your Pool Membership
  // ============================================
  console.log("=".repeat(50));
  console.log("👤 Your Pool Membership");
  console.log("=".repeat(50));

  const memberInfo = await pools.queries.poolMembers(account.address);
  if (memberInfo) {
    console.log(`Pool ID: ${memberInfo.poolId}`);
    console.log(`Points: ${memberInfo.points}`);
    console.log(`Unbonding Eras: ${memberInfo.unbondingEras?.size || 0}`);

    // Get pool metadata
    const metadata = await pools.queries.metadata(memberInfo.poolId);
    if (metadata) {
      console.log(`Pool Name: ${metadata}`);
    }

    // Check pending rewards
    const pendingRewards = await pools.queries.pendingRewards(account.address);
    console.log(`Pending Rewards: ${pendingRewards} planck`);
  } else {
    console.log("Not a member of any pool");
  }

  // ============================================
  // 4. Example: Join a Pool (Dry Run)
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("➕ Join a Pool (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To join an existing pool:

const result = await pools.manager.join(signer, signerAddress, {
  amount: '10000000000000000000',  // 10 SEL
  poolId: 1,  // Pool ID to join
});

Before joining, check:
- Pool state is 'Open'
- Your balance is above minimum join bond
- Pool has not reached member cap
  `);

  // ============================================
  // 5. Example: Create a Pool (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("🆕 Create a Pool (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To create a new pool:

const result = await pools.manager.create(signer, signerAddress, {
  amount: '100000000000000000000',  // 100 SEL initial deposit
  root: account.address,      // Can change pool state
  nominator: account.address, // Can select validators
  bouncer: account.address,   // Can remove members
});

After creation:
1. Set pool metadata for discoverability
2. Nominate validators for the pool
3. Invite members to join
  `);

  // ============================================
  // 6. Example: Bond Extra (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("📈 Bond Extra (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To add more funds to your pool membership:

// Option 1: Bond from free balance
await pools.manager.bondExtra(signer, signerAddress, {
  extra: { FreeBalance: '10000000000000000000' },  // 10 SEL
});

// Option 2: Bond from pending rewards
await pools.manager.bondExtra(signer, signerAddress, {
  extra: 'Rewards',  // Compound your rewards
});
  `);

  // ============================================
  // 7. Example: Claim Rewards (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("💰 Claim Rewards (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To claim your pool rewards:

const result = await pools.manager.claimPayout(signer, signerAddress);

Rewards are distributed based on your share of pool points.
You can check pending rewards before claiming.
  `);

  // ============================================
  // 8. Example: Unbond and Withdraw (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("🔓 Unbond and Withdraw (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To leave a pool:

// 1. Start unbonding
await pools.manager.unbond(signer, signerAddress, {
  memberAccount: account.address,
  unbondingPoints: '10000000000000000000',  // Points to unbond
});

// 2. After unbonding period, withdraw
await pools.manager.withdrawUnbonded(signer, signerAddress, {
  memberAccount: account.address,
  numSlashingSpans: 0,
});

Note: Unbonding period is the same as regular staking (28 eras).
  `);

  // Disconnect
  await sdk.disconnect();
  console.log("\n✅ Disconnected from Selendra");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
