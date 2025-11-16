/**
 * Staking Dashboard Example
 *
 * Demonstrates comprehensive staking functionality including:
 * - Viewing current staking state
 * - Bonding and nominating validators
 * - Managing rewards
 * - Monitoring validator performance
 *
 * @example
 * ```bash
 * ts-node examples/staking-dashboard.ts
 * ```
 */

import { createSDK } from '../src/sdk';
import { StakingClient } from '../src/substrate/staking';

async function main() {
  console.log('🚀 Selendra Staking Dashboard\n');

  // Initialize SDK
  const sdk = await createSDK({
    network: 'mainnet' as any,
    endpoint: 'wss://rpc.selendra.org',
  });

  await sdk.connect();
  console.log('✅ Connected to Selendra mainnet\n');

  const staking = (sdk as any).substrate.staking as StakingClient;

  // ========== Staking Overview ==========
  console.log('📊 Staking Overview:');
  console.log('━'.repeat(60));

  const [currentEra, activeEra, validatorCount, minStake] = await Promise.all([
    staking.getCurrentEra(),
    staking.getActiveEra(),
    staking.getValidatorCount(),
    staking.getMinValidatorBond(),
  ]);

  console.log(`Current Era: ${currentEra}`);
  console.log(`Active Era: ${activeEra?.index || 'N/A'}`);
  console.log(`Total Validators: ${validatorCount}`);
  console.log(`Minimum Validator Bond: ${minStake} SEL`);
  console.log('');

  // ========== Example Account Staking Info ==========
  const exampleAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice

  console.log(`👤 Staking Info for ${exampleAddress.slice(0, 10)}...`);
  console.log('━'.repeat(60));

  try {
    const stakingInfo = await staking.getStakingInfo(exampleAddress);

    if (stakingInfo) {
      console.log(`Status: 🟢 Active Staker`);
      console.log(`Total Stake: ${stakingInfo.totalStake} SEL`);
      console.log(`Active Stake: ${stakingInfo.activeStake} SEL`);
      console.log(`Own Stake: ${stakingInfo.ownStake} SEL`);

      if (stakingInfo.nominators && stakingInfo.nominators.length > 0) {
        console.log(`\nNominators (${stakingInfo.nominators.length}):`);
        stakingInfo.nominators.slice(0, 3).forEach((nominator: any, i: number) => {
          console.log(`  ${i + 1}. ${nominator.address.slice(0, 10)}... - ${nominator.stake} SEL`);
        });
        if (stakingInfo.nominators.length > 3) {
          console.log(`  ... and ${stakingInfo.nominators.length - 3} more`);
        }
      }
    } else {
      console.log(`Status: ⚪ Not Staking`);
    }
  } catch (error) {
    console.log(`Status: ⚪ Not Staking`);
  }
  console.log('');

  // ========== Validator List ==========
  console.log('🏛️  Top Validators:');
  console.log('━'.repeat(60));

  const validators = await staking.getValidators();
  console.log(`Total: ${validators.length} validators\n`);

  // Show top 5 validators with their commission
  for (let i = 0; i < Math.min(5, validators.length); i++) {
    const validator = validators[i];
    try {
      const prefs = await staking.getValidatorPrefs(validator);
      console.log(`${i + 1}. ${validator.slice(0, 10)}... (Commission: ${prefs.commission})`);
    } catch {
      console.log(`${i + 1}. ${validator.slice(0, 10)}...`);
    }
  }
  console.log('');

  // ========== Era Rewards ==========
  console.log('💰 Era Rewards:');
  console.log('━'.repeat(60));

  try {
    const eraRewards = await staking.getEraRewardPoints(currentEra);
    console.log(`Total Era Points: ${eraRewards.total}`);
    console.log(`Individual Validators: ${eraRewards.individual.length}`);

    if (eraRewards.individual.length > 0) {
      console.log(`\nTop 3 Point Earners:`);
      const sorted = [...eraRewards.individual].sort((a, b) => b.points - a.points);
      sorted.slice(0, 3).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.validator.slice(0, 10)}... - ${item.points} points`);
      });
    }
  } catch (error) {
    console.log(`Could not fetch era rewards: ${error}`);
  }
  console.log('');

  // ========== Example Staking Operations ==========
  console.log('📝 Example Staking Operations:');
  console.log('━'.repeat(60));
  console.log(`
// 1. Bond tokens
const bondResult = await staking.bond(
  signer,
  '1000000000000000000', // 1 SEL
  'Staked' // Payee
);
console.log('Bonded:', bondResult.hash);

// 2. Nominate validators
const validators = [
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
];
const nominateResult = await staking.nominate(signer, validators);
console.log('Nominated:', nominateResult.hash);

// 3. Claim rewards
const payoutResult = await staking.payoutStakers(
  signer,
  validatorAddress,
  currentEra
);
console.log('Rewards claimed:', payoutResult.hash);

// 4. Unbond tokens
const unbondResult = await staking.unbond(
  signer,
  '500000000000000000' // 0.5 SEL
);
console.log('Unbonded:', unbondResult.hash);

// 5. After unbonding period, withdraw
const withdrawResult = await staking.withdrawUnbonded(signer);
console.log('Withdrawn:', withdrawResult.hash);
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

export { main as stakingDashboard };
