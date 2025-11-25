/**
 * Governance Example - Democracy, Council, Treasury
 *
 * This example demonstrates how to interact with Selendra's governance system.
 *
 * @example
 * ```bash
 * npx ts-node examples/governance/index.ts
 * ```
 */

import { createSDK, Conviction } from "../../src/index.js";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";

const RPC_URL = process.env.SELENDRA_RPC_URL || "wss://rpc.selendra.org";
const MNEMONIC = process.env.SELENDRA_MNEMONIC || "//Alice";

async function main() {
  console.log("🗳️  Selendra Governance Example\n");

  // Connect to Selendra
  const sdk = createSDK({ rpcUrl: RPC_URL });
  await sdk.connect();
  console.log("✅ Connected to Selendra\n");

  // Create test account
  const keyring = new Keyring({ type: "sr25519" });
  const account = keyring.addFromUri(MNEMONIC);
  console.log(`📍 Account: ${account.address}\n`);

  // Get pallet managers
  const democracy = sdk.pallets.democracy;
  const council = sdk.pallets.council;
  const treasury = sdk.pallets.treasury;

  if (!democracy || !council || !treasury) {
    console.error("❌ Governance pallets not available");
    await sdk.disconnect();
    return;
  }

  // ============================================
  // 1. Query Democracy Information
  // ============================================
  console.log("=".repeat(50));
  console.log("📊 Democracy Overview");
  console.log("=".repeat(50));

  const referendumCount = await democracy.queries.referendumCount();
  console.log(`Active Referenda: ${referendumCount}`);

  const publicProps = await democracy.queries.publicProps();
  console.log(`Public Proposals: ${publicProps.length}`);

  const constants = await democracy.queries.getConstants();
  console.log(`Launch Period: ${constants.launchPeriod} blocks`);
  console.log(`Voting Period: ${constants.votingPeriod} blocks`);
  console.log(`Minimum Deposit: ${constants.minimumDeposit}`);

  // ============================================
  // 2. Query Council Information
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("👥 Council Overview");
  console.log("=".repeat(50));

  const members = await council.queries.members();
  console.log(`Council Members: ${members.length}`);
  members.slice(0, 5).forEach((member, i) => {
    console.log(`  ${i + 1}. ${member}`);
  });

  const proposals = await council.queries.proposals();
  console.log(`Active Proposals: ${proposals.length}`);

  // ============================================
  // 3. Query Treasury Information
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("💰 Treasury Overview");
  console.log("=".repeat(50));

  const treasuryBalance = await treasury.queries.getPot();
  console.log(`Treasury Balance: ${treasuryBalance} planck`);

  const allProposals = await treasury.queries.getAllProposals();
  console.log(`Treasury Proposals: ${allProposals.length}`);

  // ============================================
  // 4. Example: Submit a Democracy Proposal (Dry Run)
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("📝 Submit Proposal (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To submit a democracy proposal, you would call:

const result = await democracy.manager.propose(signer, signerAddress, {
  proposalHash: '0x...',  // Hash of the proposal preimage
  value: '1000000000000000000',  // Minimum deposit
});

The proposal would then be visible in the public proposals list.
  `);

  // ============================================
  // 5. Example: Vote on Referendum (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("🗳️  Vote on Referendum (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To vote on a referendum, you would call:

const result = await democracy.manager.vote(signer, signerAddress, {
  refIndex: 0,  // Referendum index
  vote: {
    Standard: {
      vote: {
        aye: true,  // Vote yes
        conviction: 'Locked1x',  // 1x conviction = 1 SEL = 1 vote
      },
      balance: '10000000000000000000',  // 10 SEL
    }
  }
});

Conviction options:
- None: 0.1x vote power, no lock
- Locked1x: 1x vote power, lock for 1 period
- Locked2x: 2x vote power, lock for 2 periods
- Locked3x: 3x vote power, lock for 4 periods
- Locked4x: 4x vote power, lock for 8 periods
- Locked5x: 5x vote power, lock for 16 periods
- Locked6x: 6x vote power, lock for 32 periods
  `);

  // ============================================
  // 6. Example: Propose Treasury Spend (Dry Run)
  // ============================================
  console.log("=".repeat(50));
  console.log("💸 Propose Treasury Spend (Example - Not Executed)");
  console.log("=".repeat(50));

  console.log(`
To propose a treasury spend, you would call:

const result = await treasury.manager.proposeSpend(signer, signerAddress, {
  value: '100000000000000000000',  // 100 SEL
  beneficiary: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
});

The council would then vote to approve or reject the proposal.
  `);

  // Disconnect
  await sdk.disconnect();
  console.log("\n✅ Disconnected from Selendra");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
