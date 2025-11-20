/**
 * Validator Monitor Example
 *
 * Demonstrates monitoring validator performance using:
 * - Aleph consensus metrics
 * - Session tracking
 * - Validator performance history
 * - Elections and committee management
 *
 * @example
 * ```bash
 * ts-node examples/validator-monitor.ts
 * ```
 */

import { createSDK } from '../src/sdk';
import { AlephClient } from '../src/substrate/aleph';
import { ElectionsClient } from '../src/substrate/elections';

async function main() {
  console.log('🔍 Selendra Validator Monitor\n');

  // Initialize SDK
  const sdk = await createSDK({
    network: 'mainnet' as any,
    endpoint: 'wss://rpc.selendra.org',
  });

  await sdk.connect();
  console.log('✅ Connected to Selendra mainnet\n');

  const aleph = (sdk as any).substrate.aleph as AlephClient;
  const elections = (sdk as any).substrate.elections as ElectionsClient;

  // ========== Session Information ==========
  console.log('📅 Current Session Information:');
  console.log('━'.repeat(60));

  const [currentSession, sessionLength, sessionProgress, activeValidators] = await Promise.all([
    aleph.getCurrentSession(),
    aleph.getSessionLength(),
    aleph.getSessionProgress(),
    aleph.getActiveValidators(),
  ]);

  console.log(`Session Index: ${currentSession}`);
  console.log(`Session Length: ${sessionLength} blocks`);
  console.log(`Session Progress: ${sessionProgress.current}/${sessionProgress.total} blocks`);
  console.log(`Remaining: ${sessionProgress.remaining} blocks`);
  console.log(`Active Validators: ${activeValidators.length}`);
  console.log('');

  // ========== Committee Information ==========
  console.log('👥 Committee Information:');
  console.log('━'.repeat(60));

  const committee = await aleph.getSessionCommittee(currentSession);
  console.log(`Committee Size: ${committee.size}`);
  console.log(`\nCommittee Members (first 5):`);
  committee.validators.slice(0, 5).forEach((validator, i) => {
    console.log(`  ${i + 1}. ${validator.slice(0, 10)}...${validator.slice(-8)}`);
  });
  if (committee.size > 5) {
    console.log(`  ... and ${committee.size - 5} more`);
  }
  console.log('');

  // ========== Elections Information ==========
  console.log('🗳️  Elections Information:');
  console.log('━'.repeat(60));

  const [committeeSeats, nextEraValidators, electionOpenness, stats] = await Promise.all([
    elections.getCommitteeSeats(),
    elections.getNextEraValidators(),
    elections.getElectionOpenness(),
    elections.getValidatorStats(),
  ]);

  console.log(`Committee Seats:`);
  console.log(`  Reserved: ${committeeSeats.reserved}`);
  console.log(`  Non-Reserved: ${committeeSeats.nonReserved}`);
  console.log(`  Non-Reserved Finality: ${committeeSeats.nonReservedFinality}`);
  console.log(`\nElection Mode: ${electionOpenness}`);
  console.log(`\nNext Era Validators:`);
  console.log(`  Reserved: ${nextEraValidators.reserved.length}`);
  console.log(`  Non-Reserved: ${nextEraValidators.nonReserved.length}`);
  console.log(`  Total: ${stats.total}`);
  console.log('');

  // ========== Validator Performance ==========
  console.log('📊 Validator Performance:');
  console.log('━'.repeat(60));

  // Check performance for first few validators
  const validatorsToCheck = activeValidators.slice(0, 3);

  for (const validator of validatorsToCheck) {
    console.log(`\nValidator: ${validator.slice(0, 10)}...${validator.slice(-8)}`);
    console.log('─'.repeat(50));

    try {
      const performance = await aleph.getValidatorPerformance(validator);
      console.log(`  Blocks Produced: ${performance.blocksProduced}`);
      console.log(`  Blocks Expected: ${performance.blocksExpected}`);
      console.log(`  Uptime: ${performance.uptime.toFixed(2)}%`);
      console.log(`  Sessions: ${performance.sessions}`);

      // Check if banned
      const isBanned = await aleph.isValidatorBanned(validator);
      if (isBanned) {
        console.log(`  Status: ⛔ BANNED`);
      } else {
        console.log(`  Status: ✅ Active`);
      }

      // Get recent history
      const history = await aleph.getValidatorHistory(validator, 5);
      if (history.length > 0) {
        console.log(`  Recent Session Scores:`);
        history.forEach((score) => {
          console.log(`    Session ${score.session}: ${score.score} points`);
        });
      }
    } catch (error) {
      console.log(`  ⚠️  Could not fetch performance data`);
    }
  }
  console.log('');

  // ========== Aleph Protocol Info ==========
  console.log('⚙️  Aleph Protocol Information:');
  console.log('━'.repeat(60));

  try {
    const [version, inflationParams, emergencyFinalizer] = await Promise.all([
      aleph.getFinalityVersion(),
      aleph.getInflationParameters(),
      aleph.getEmergencyFinalizer(),
    ]);

    console.log(`Finality Version: ${version.version}`);
    console.log(`SEL Cap: ${inflationParams.selCap} SEL`);
    console.log(`Inflation Horizon: ${inflationParams.horizonMillisecs}ms`);

    if (emergencyFinalizer) {
      console.log(`Emergency Finalizer: ${emergencyFinalizer.slice(0, 10)}...`);
    } else {
      console.log(`Emergency Finalizer: None`);
    }
  } catch (error) {
    console.log(`⚠️  Could not fetch protocol info`);
  }
  console.log('');

  // ========== Monitoring Tips ==========
  console.log('💡 Monitoring Tips:');
  console.log('━'.repeat(60));
  console.log(`
1. Session Progress: Track ${sessionProgress.remaining} blocks until next session
2. Validator Rotation: Next era validators are already selected
3. Performance Tracking: Monitor uptime and block production rates
4. Committee Changes: Watch for committee size adjustments

Example Monitoring Loop:
\`\`\`typescript
setInterval(async () => {
  const progress = await aleph.getSessionProgress();
  const validators = await aleph.getActiveValidators();
  
  console.log(\`Session: \${progress.current}/\${progress.total}\`);
  console.log(\`Active Validators: \${validators.length}\`);
  
  // Check specific validator
  const perf = await aleph.getValidatorPerformance(validatorAddress);
  if (perf.uptime < 95) {
    console.warn('⚠️  Validator uptime below 95%!');
  }
}, 60000); // Every minute
\`\`\`
  `);

  await sdk.disconnect();
  console.log('\n✅ Disconnected from network');
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

export { main as validatorMonitor };
