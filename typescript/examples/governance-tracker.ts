/**
 * Governance Tracker Example
 *
 * Demonstrates democracy/governance functionality:
 * - Viewing active referenda
 * - Checking public proposals
 * - Voting on referenda
 * - Proposal submission
 * - Vote delegation
 *
 * @example
 * ```bash
 * ts-node examples/governance-tracker.ts
 * ```
 */

import { createSDK } from '../src/sdk';
import { DemocracyClient, Conviction } from '../src/substrate/democracy';

async function main() {
  console.log('🏛️  Selendra Governance Tracker\n');

  // Initialize SDK
  const sdk = await createSDK({
    network: 'mainnet' as any,
    endpoint: 'wss://rpc.selendra.org',
  });

  await sdk.connect();
  console.log('✅ Connected to Selendra mainnet\n');

  const democracy = (sdk as any).substrate.democracy as DemocracyClient;

  // ========== Governance Overview ==========
  console.log('📊 Governance Overview:');
  console.log('━'.repeat(60));

  const [referendumCount, minimumDeposit, votingPeriod, enactmentPeriod] = await Promise.all([
    democracy.getReferendumCount(),
    democracy.getMinimumDeposit(),
    democracy.getVotingPeriod(),
    democracy.getEnactmentPeriod(),
  ]);

  console.log(`Total Referenda: ${referendumCount}`);
  console.log(`Minimum Deposit: ${minimumDeposit} SEL`);
  console.log(
    `Voting Period: ${votingPeriod} blocks (~${Math.floor((votingPeriod * 6) / 3600)} hours)`,
  );
  console.log(
    `Enactment Delay: ${enactmentPeriod} blocks (~${Math.floor((enactmentPeriod * 6) / 3600)} hours)`,
  );
  console.log('');

  // ========== Active Referenda ==========
  console.log('🗳️  Active Referenda:');
  console.log('━'.repeat(60));

  const activeReferenda = await democracy.getActiveReferenda();

  if (activeReferenda.length === 0) {
    console.log('No active referenda at the moment.\n');
  } else {
    console.log(`Found ${activeReferenda.length} active referendum(a)\n`);

    for (const refIndex of activeReferenda) {
      const referendum = await democracy.getReferendum(refIndex);

      console.log(`Referendum #${referendum.index}:`);
      console.log(`  Status: ${referendum.status}`);
      console.log(`  Proposal Hash: ${referendum.proposalHash?.slice(0, 20)}...`);
      console.log(`  End Block: ${referendum.end}`);

      if (referendum.ayes && referendum.nays) {
        const ayesNum = BigInt(referendum.ayes);
        const naysNum = BigInt(referendum.nays);
        const total = ayesNum + naysNum;

        if (total > 0n) {
          const ayePercent = Number((ayesNum * 10000n) / total) / 100;
          console.log(`  Votes:`);
          console.log(`    👍 Ayes: ${referendum.ayes} SEL (${ayePercent.toFixed(2)}%)`);
          console.log(`    👎 Nays: ${referendum.nays} SEL (${(100 - ayePercent).toFixed(2)}%)`);
        } else {
          console.log(`  Votes: No votes yet`);
        }
      }

      console.log(`  Threshold: ${referendum.threshold}`);
      console.log('');
    }
  }

  // ========== Public Proposals ==========
  console.log('📜 Public Proposals:');
  console.log('━'.repeat(60));

  const publicProposals = await democracy.getPublicProposals();

  if (publicProposals.length === 0) {
    console.log('No public proposals waiting to become referenda.\n');
  } else {
    console.log(`Found ${publicProposals.length} public proposal(s)\n`);

    publicProposals.forEach((proposal) => {
      console.log(`Proposal #${proposal.index}:`);
      console.log(`  Proposer: ${proposal.proposer.slice(0, 10)}...${proposal.proposer.slice(-8)}`);
      console.log(`  Proposal Hash: ${proposal.proposalHash.slice(0, 20)}...`);
      console.log('');
    });
  }

  // ========== Conviction Levels ==========
  console.log('🔒 Vote Conviction Levels:');
  console.log('━'.repeat(60));
  console.log(`
Conviction determines vote weight and lock period:

• None (0x):      No lock period, 0.1x vote weight
• Locked1x (1x):  Lock for 1 enactment period, 1x vote weight
• Locked2x (2x):  Lock for 2 enactment periods, 2x vote weight
• Locked3x (3x):  Lock for 4 enactment periods, 3x vote weight
• Locked4x (4x):  Lock for 8 enactment periods, 4x vote weight
• Locked5x (5x):  Lock for 16 enactment periods, 5x vote weight
• Locked6x (6x):  Lock for 32 enactment periods, 6x vote weight

Example: With Locked3x conviction, 100 SEL = 300 SEL voting power
         Tokens locked for ${enactmentPeriod * 4} blocks (~${Math.floor((enactmentPeriod * 4 * 6) / 3600)} hours)
  `);

  // ========== Example Voting Operations ==========
  console.log('📝 Example Governance Operations:');
  console.log('━'.repeat(60));
  console.log(`
// 1. Submit a proposal
const proposalHash = '0x1234...'; // Hash of proposal call
const deposit = '${minimumDeposit}'; // Minimum deposit

const proposeResult = await democracy.propose(
  signer,
  proposalHash,
  deposit
);
console.log('Proposal submitted:', proposeResult.proposalIndex);

// 2. Second a proposal (support it to become referendum)
const secondResult = await democracy.second(signer, 0); // Proposal #0
console.log('Proposal seconded:', secondResult.blockHash);

// 3. Vote on a referendum with conviction
const voteResult = await democracy.vote(
  signer,
  0,                    // Referendum #0
  true,                 // Aye vote
  '1000000000000000',   // 1 SEL
  Conviction.Locked2x   // 2x weight, 2 periods lock
);
console.log('Voted:', voteResult.blockHash);

// 4. Remove your vote (before referendum ends)
const removeResult = await democracy.removeVote(signer, 0);
console.log('Vote removed:', removeResult.blockHash);

// 5. Delegate voting power to another account
const delegateResult = await democracy.delegate(
  signer,
  'delegate_address',
  Conviction.Locked1x,
  '5000000000000000'    // 5 SEL
);
console.log('Delegated:', delegateResult.blockHash);

// 6. Remove delegation
const undelegateResult = await democracy.undelegate(signer);
console.log('Undelegated:', undelegateResult.blockHash);
  `);

  // ========== Check Voting Record ==========
  console.log('🔍 Check Voting Record:');
  console.log('━'.repeat(60));

  const exampleAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

  if (activeReferenda.length > 0) {
    console.log(`\nChecking votes for ${exampleAddress.slice(0, 10)}...\n`);

    for (const refIndex of activeReferenda.slice(0, 3)) {
      try {
        const vote = await democracy.getVotingOf(refIndex, exampleAddress);

        if (vote) {
          console.log(`Referendum #${refIndex}:`);
          console.log(`  Vote: ${vote.vote.aye ? '👍 Aye' : '👎 Nay'}`);
          console.log(`  Balance: ${vote.balance} SEL`);
          console.log(`  Conviction: ${vote.vote.conviction}x`);
        } else {
          console.log(`Referendum #${refIndex}: No vote recorded`);
        }
      } catch (error) {
        console.log(`Referendum #${refIndex}: Could not fetch vote`);
      }
    }
  } else {
    console.log('No active referenda to check votes for.');
  }
  console.log('');

  await sdk.disconnect();
  console.log('✅ Disconnected from network');
}

// Run the example
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { main as governanceTracker };
