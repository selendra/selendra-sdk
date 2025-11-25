/**
 * Staking Pallet Demo
 * 
 * Demonstrates all Staking pallet functions using local node
 * Endpoint: ws://127.0.0.1:9944
 * Accounts: Alice, Bob, Charlie, Dave, Eve, Ferdie
 */

import { SelendraSDK } from '../../src/index.js';
import { StakingManager, RewardDestination } from '../../src/pallets/staking/index.js';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

// Test accounts
const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
const CHARLIE = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y';
const DAVE = '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy';
const EVE = '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw';
const FERDIE = '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL';

async function main() {
  console.log('='.repeat(80));
  console.log('STAKING PALLET DEMO - LOCAL NODE');
  console.log('='.repeat(80));

  // Initialize crypto
  await cryptoWaitReady();

  // Initialize SDK with local node
  const sdk = new SelendraSDK({
    endpoint: 'ws://127.0.0.1:9944',
    noInitWarn: true,
  });

  await sdk.connect();
  console.log('✓ Connected to local node\n');

  // Initialize keyring for signing
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');
  const charlie = keyring.addFromUri('//Charlie');
  const eve = keyring.addFromUri('//Eve');

  // Get API instance
  const api = sdk.getApi();
  if (!api) {
    throw new Error('Failed to get API instance');
  }

  // Get staking manager
  const staking = new StakingManager(api);

  try {
    // ========================================================================
    // 1. QUERY NETWORK STAKING INFO
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('1. NETWORK STAKING INFORMATION');
    console.log('='.repeat(80));

    const currentEra = await staking.queries.currentEra();
    const activeEra = await staking.queries.activeEra();
    const historyDepth = await staking.queries.historyDepth();
    const minBond = await staking.queries.minNominatorBond();
    const minValidatorBond = await staking.queries.minValidatorBond();
    const bondingDuration = await staking.queries.bondingDuration();
    const maxValidatorCount = await staking.queries.maxValidatorsCount();

    console.log('Current Era:', currentEra);
    console.log('Active Era:', activeEra);
    console.log('History Depth:', historyDepth);
    console.log('Min Nominator Bond:', minBond?.toString(), 'units');
    console.log('Min Validator Bond:', minValidatorBond?.toString(), 'units');
    console.log('Bonding Duration:', bondingDuration, 'eras');
    console.log('Max Validator Count:', maxValidatorCount);

    // ========================================================================
    // 2. CHECK ACCOUNT STAKING STATUS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('2. ACCOUNT STAKING STATUS');
    console.log('='.repeat(80));

    const accounts = [
      { name: 'Alice', address: ALICE },
      { name: 'Bob', address: BOB },
      { name: 'Charlie', address: CHARLIE },
    ];

    for (const account of accounts) {
      console.log(`\n${account.name} (${account.address.substring(0, 10)}...):`);
      
      const info = await staking.getStakingInfo(account.address);
      console.log('  Bonded:', info.isBonded);
      console.log('  Validating:', info.isValidating);
      console.log('  Nominating:', info.isNominating);
      
      if (info.ledger) {
        console.log('  Total Bonded:', info.ledger.total.toString(), 'units');
        console.log('  Active:', info.ledger.active.toString(), 'units');
        console.log('  Unlocking Chunks:', info.ledger.unlocking.length);
      }
      
      if (info.validatorPrefs) {
        console.log('  Commission:', `${Number(info.validatorPrefs.commission) / 10000000}%`);
        console.log('  Blocks Nominations:', info.validatorPrefs.blocked);
      }
      
      if (info.nominations) {
        console.log('  Nominated Validators:', info.nominations.targets.length);
        console.log('  Suppressed:', info.nominations.suppressed);
      }
    }

    // ========================================================================
    // 3. BONDING OPERATIONS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('3. BONDING OPERATIONS');
    console.log('='.repeat(80));

    // Estimate bond fee
    const bondValue = BigInt(1000000000000); // 1000 units (adjust for decimals)
    const bondFee = await staking.estimateBondFee(
      bondValue,
      RewardDestination.Staked,
      ALICE
    );
    console.log('\nEstimated bond fee:', bondFee.toString(), 'units');

    // Create bond transaction (don't submit)
    const bondTx = staking.bond({
      controller: ALICE,
      value: bondValue,
      payee: RewardDestination.Staked,
    });
    console.log('✓ Created bond transaction (1000 units, payee: Staked)');

    // Bond extra (for already bonded accounts)
    const bondExtraTx = staking.bondExtra({
      maxAdditional: BigInt(500000000000), // 500 units
    });
    console.log('✓ Created bond extra transaction (500 units)');

    // Set payee
    const setPayeeTx = staking.setPayee({
      payee: { Account: CHARLIE },
    });
    console.log('✓ Created set payee transaction (Account: Charlie)');

    // ========================================================================
    // 4. NOMINATING OPERATIONS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('4. NOMINATING OPERATIONS');
    console.log('='.repeat(80));

    // Nominate validators
    const nominateTargets = [BOB, CHARLIE, DAVE];
    const nominateFee = await staking.estimateNominateFee(nominateTargets, ALICE);
    console.log('\nEstimated nominate fee:', nominateFee.toString(), 'units');

    const nominateTx = staking.nominate({
      targets: nominateTargets,
    });
    console.log(`✓ Created nominate transaction (${nominateTargets.length} validators)`);
    console.log('  Targets:', nominateTargets.map(t => t.substring(0, 10) + '...').join(', '));

    // Check nomination status
    const isNominating = await staking.isNominating(ALICE);
    console.log('\nAlice is nominating:', isNominating);

    // ========================================================================
    // 5. VALIDATING OPERATIONS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('5. VALIDATING OPERATIONS');
    console.log('='.repeat(80));

    // Validate with preferences
    const validateTx = staking.validate({
      prefs: {
        commission: BigInt(100000000), // 10% (commission is in parts per billion)
        blocked: false,
      },
    });
    console.log('\n✓ Created validate transaction (10% commission, accepting nominations)');

    // Check validator status
    const isValidating = await staking.isValidating(BOB);
    console.log('Bob is validating:', isValidating);

    const validatorPrefs = await staking.queries.validators(BOB);
    if (validatorPrefs) {
      console.log('Bob commission:', `${Number(validatorPrefs.commission) / 10000000}%`);
      console.log('Bob blocks nominations:', validatorPrefs.blocked);
    }

    // ========================================================================
    // 6. UNBONDING OPERATIONS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('6. UNBONDING OPERATIONS');
    console.log('='.repeat(80));

    // Unbond funds
    const unbondTx = staking.unbond({
      value: BigInt(100000000000), // 100 units
    });
    console.log('\n✓ Created unbond transaction (100 units)');

    // Rebond funds
    const rebondTx = staking.rebond({
      value: BigInt(50000000000), // 50 units
    });
    console.log('✓ Created rebond transaction (50 units)');

    // Withdraw unbonded
    const withdrawTx = staking.withdrawUnbonded({
      numSlashingSpans: 0,
    });
    console.log('✓ Created withdraw unbonded transaction');

    // Check unbonding status
    const unbondingAmount = await staking.getUnbonding(ALICE);
    console.log('\nAlice unbonding amount:', unbondingAmount.toString(), 'units');

    const erasUntilUnbonding = await staking.getErasUntilUnbonding(ALICE);
    if (erasUntilUnbonding !== null) {
      console.log('Eras until next unlock:', erasUntilUnbonding);
    }

    // ========================================================================
    // 7. CHILL OPERATION
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('7. CHILL OPERATION');
    console.log('='.repeat(80));

    const chillTx = staking.chill();
    console.log('\n✓ Created chill transaction (stop validating/nominating)');

    // ========================================================================
    // 8. SET UP NEW VALIDATOR (EVE)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('8. SET UP NEW VALIDATOR (EVE)');
    console.log('='.repeat(80));

    // Session keys for Eve (rotated keys)
    const eveSessionKeys = '0x3415348005e744dc8471931e37a1653c5a169a749791c05774e97926fef11c30ec7be6d045e1a24119dc9fbcf9d1736c98c7cfd6e3a83a8108d56ad863f5b34f';
    
    console.log('\nSetting up Eve as a new validator:');
    console.log('  Address:', EVE);
    console.log('  Session Keys:', eveSessionKeys.substring(0, 20) + '...');

    // Step 1: Check Eve's current status
    const eveInfoBefore = await staking.getStakingInfo(EVE);
    console.log('\nEve status before setup:');
    console.log('  Bonded:', eveInfoBefore.isBonded);
    console.log('  Validating:', eveInfoBefore.isValidating);
    if (eveInfoBefore.ledger) {
      console.log('  Bonded amount:', eveInfoBefore.ledger.total.toString(), 'units');
    }

    // Step 2: Bond funds (if not already bonded)
    const eveMinBond = await staking.queries.minValidatorBond();
    const bondAmount = eveMinBond || BigInt(1000000000000); // Use min or 1000 units
    
    const eveBondTx = staking.bond({
      controller: EVE,
      value: bondAmount,
      payee: RewardDestination.Staked,
    });
    console.log(`\n✓ Created bond transaction for Eve (${bondAmount.toString()} units)`);
    console.log('  Payee: Staked (rewards compound automatically)');

    // Step 3: Set session keys
    // This tells the chain which keys to use for block production
    const setKeysTx = api.tx.session.setKeys(eveSessionKeys, '0x');
    console.log('\n✓ Created setKeys transaction');
    console.log('  Session keys set for block production');
    console.log('  Proof: 0x (empty proof for dev chain)');

    // Step 4: Declare validator intent with preferences
    const eveValidateTx = staking.validate({
      prefs: {
        commission: BigInt(50000000), // 5% commission (commission is in parts per billion)
        blocked: false, // Accept nominations
      },
    });
    console.log('\n✓ Created validate transaction for Eve');
    console.log('  Commission: 5%');
    console.log('  Accepting nominations: Yes');

    // Display the complete workflow
    console.log('\n📝 Complete workflow to set up Eve as validator:');
    console.log('   1. Bond funds (minimum validator bond required)');
    console.log('   2. Set session keys (for block authoring)');
    console.log('   3. Declare validator intent (validate with commission)');
    console.log('   4. Wait for next era to be included in validator set');

    console.log('\n💡 Executing these transactions now...');

    // Execute transactions to set up Eve as validator
    console.log('\n🚀 Setting up Eve as validator...');
    
    // Bond funds
    if (!eveInfoBefore.isBonded) {
      console.log('\n1. Bonding funds...');
      await new Promise<void>((resolve, reject) => {
        eveBondTx.signAndSend(eve, ({ status, events }) => {
          if (status.isInBlock) {
            console.log(`   ✓ Bonded in block: ${status.asInBlock.toHex()}`);
          }
          if (status.isFinalized) {
            console.log(`   ✓ Finalized in block: ${status.asFinalized.toHex()}`);
            resolve();
          }
        }).catch(reject);
      });
    } else {
      console.log('\n1. Eve already bonded, skipping...');
    }

    // Set session keys
    console.log('\n2. Setting session keys...');
    await new Promise<void>((resolve, reject) => {
      setKeysTx.signAndSend(eve, ({ status, events }) => {
        if (status.isInBlock) {
          console.log(`   ✓ Keys set in block: ${status.asInBlock.toHex()}`);
        }
        if (status.isFinalized) {
          console.log(`   ✓ Finalized in block: ${status.asFinalized.toHex()}`);
          resolve();
        }
      }).catch(reject);
    });

    // Declare validator intent
    console.log('\n3. Declaring validator intent...');
    await new Promise<void>((resolve, reject) => {
      eveValidateTx.signAndSend(eve, ({ status, events }) => {
        if (status.isInBlock) {
          console.log(`   ✓ Validated in block: ${status.asInBlock.toHex()}`);
          events.forEach(({ event }) => {
            if (event.section === 'staking' && event.method === 'ValidatorPrefsSet') {
              console.log(`   ✓ Validator preferences set`);
            }
          });
        }
        if (status.isFinalized) {
          console.log(`   ✓ Finalized in block: ${status.asFinalized.toHex()}`);
          resolve();
        }
      }).catch(reject);
    });

    // Verify Eve's new status
    const eveInfoAfter = await staking.getStakingInfo(EVE);
    console.log('\n✅ Eve status after setup:');
    console.log('   Bonded:', eveInfoAfter.isBonded);
    console.log('   Validating:', eveInfoAfter.isValidating);
    if (eveInfoAfter.ledger) {
      console.log('   Bonded amount:', eveInfoAfter.ledger.total.toString(), 'units');
    }
    if (eveInfoAfter.validatorPrefs) {
      console.log('   Commission:', `${Number(eveInfoAfter.validatorPrefs.commission) / 10000000}%`);
    }
    console.log('\n   ✓ Eve is now configured as a validator!');
    console.log('   ⏳ Eve will be included in the active validator set in the next era.');


    // ========================================================================
    // 9. REWARD OPERATIONS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('9. REWARD OPERATIONS');
    console.log('='.repeat(80));

    // Check payee settings
    for (const account of accounts) {
      const payee = await staking.queries.payee(account.address);
      if (payee) {
        console.log(`\n${account.name} reward destination:`, payee);
      }
    }

    // Get pending rewards
    const pendingRewards = await staking.getPendingRewards(ALICE);
    console.log('\nAlice pending rewards:');
    console.log('  Total:', pendingRewards.total.toString(), 'units');
    console.log('  Unclaimed eras:', pendingRewards.eras.length);
    if (pendingRewards.eras.length > 0) {
      pendingRewards.eras.forEach(({ era, amount }) => {
        console.log(`    Era ${era}: ${amount.toString()} units`);
      });
    }

    // Payout stakers
    if (currentEra !== null && currentEra > 0) {
      const payoutTx = staking.payoutStakers({
        validatorStash: BOB,
        era: currentEra - 1,
      });
      console.log(`\n✓ Created payout stakers transaction (Bob, Era ${currentEra - 1})`);
    }

    // ========================================================================
    // 10. ERA INFORMATION
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('10. ERA INFORMATION');
    console.log('='.repeat(80));

    if (currentEra !== null && currentEra > 0) {
      const lastEra = currentEra - 1;
      
      // Era reward points
      const rewardPoints = await staking.queries.erasRewardPoints(lastEra);
      console.log(`\nEra ${lastEra} reward points:`);
      console.log('  Total:', rewardPoints.total.toString());
      console.log('  Validators with points:', rewardPoints.individual.size);

      // Era validator reward
      const validatorReward = await staking.queries.erasValidatorReward(lastEra);
      if (validatorReward) {
        console.log('  Total validator reward:', validatorReward.toString(), 'units');
      }

      // Era stakers (exposure)
      const exposure = await staking.queries.erasStakers(lastEra, BOB);
      if (exposure) {
        console.log(`\nBob's exposure in Era ${lastEra}:`);
        console.log('  Total stake:', exposure.total.toString(), 'units');
        console.log('  Own stake:', exposure.own.toString(), 'units');
        console.log('  Nominators:', exposure.others.length);
      }
    }

    // ========================================================================
    // 11. ADVANCED QUERIES
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('11. ADVANCED QUERIES');
    console.log('='.repeat(80));

    // Get slashing spans
    const slashingSpans = await staking.queries.slashingSpans(ALICE);
    if (slashingSpans) {
      console.log('\nAlice slashing spans:', slashingSpans.prior.length);
    }

    // ========================================================================
    // 12. EVENT LISTENERS (EXAMPLE)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('12. EVENT LISTENERS (EXAMPLE)');
    console.log('='.repeat(80));

    console.log('\nSetting up event listeners...');

    // Listen for Bonded events
    const unsubBonded = await staking.onBonded((event) => {
      console.log('🔗 Bonded:', event.stash.substring(0, 10) + '...', 'Amount:', event.amount.toString());
    });

    // Listen for Unbonded events
    const unsubUnbonded = await staking.onUnbonded((event) => {
      console.log('🔓 Unbonded:', event.stash.substring(0, 10) + '...', 'Amount:', event.amount.toString());
    });

    // Listen for Rewarded events
    const unsubRewarded = await staking.onRewarded((event) => {
      console.log('💰 Rewarded:', event.stash.substring(0, 10) + '...', 'Amount:', event.amount.toString());
    });

    // Listen for Slashed events
    const unsubSlashed = await staking.onSlashed((event) => {
      console.log('⚠️  Slashed:', event.validator.substring(0, 10) + '...', 'Amount:', event.amount.toString());
    });

    console.log('✓ Event listeners active (will show events as they occur)');
    console.log('  Listening for: Bonded, Unbonded, Rewarded, Slashed');

    // ========================================================================
    // 13. SUDO OPERATIONS (EXAMPLES - DON'T RUN ON PRODUCTION)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('13. SUDO OPERATIONS (EXAMPLES ONLY)');
    console.log('='.repeat(80));

    // Force new era (sudo only)
    const forceNewEraTx = staking.forceNewEra();
    console.log('\n✓ Created force new era transaction (sudo only)');

    // Force unstake (sudo only)
    const forceUnstakeTx = staking.forceUnstake({
      stash: FERDIE,
      numSlashingSpans: 0,
    });
    console.log('✓ Created force unstake transaction (sudo only, target: Ferdie)');

    // Chill other (sudo only)
    const chillOtherTx = staking.chillOther({
      controller: EVE,
    });
    console.log('✓ Created chill other transaction (sudo only, target: Eve)');

    // ========================================================================
    // 14. HELPER FUNCTIONS SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('14. HELPER FUNCTIONS SUMMARY');
    console.log('='.repeat(80));

    for (const account of accounts) {
      console.log(`\n${account.name}:`);
      
      const totalBonded = await staking.getTotalBonded(account.address);
      const activeBonded = await staking.getActiveBonded(account.address);
      const unbonding = await staking.getUnbonding(account.address);
      const isBonded = await staking.isBonded(account.address);
      const isValidating = await staking.isValidating(account.address);
      const isNominating = await staking.isNominating(account.address);

      console.log('  Total Bonded:', totalBonded.toString(), 'units');
      console.log('  Active Bonded:', activeBonded.toString(), 'units');
      console.log('  Unbonding:', unbonding.toString(), 'units');
      console.log('  Is Bonded:', isBonded);
      console.log('  Is Validating:', isValidating);
      console.log('  Is Nominating:', isNominating);
    }

    // ========================================================================
    // EXAMPLE: SUBMITTING A TRANSACTION (COMMENTED OUT)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('EXAMPLE: HOW TO SUBMIT TRANSACTIONS');
    console.log('='.repeat(80));

    console.log(`
// To actually submit a transaction, uncomment and use:
/*
const unsub = await bondTx.signAndSend(alice, ({ status, events }) => {
  console.log('Transaction status:', status.type);

  if (status.isInBlock) {
    console.log('Included in block:', status.asInBlock.toHex());
    
    events.forEach(({ event }) => {
      if (event.section === 'staking' && event.method === 'Bonded') {
        console.log('Bonded event:', event.data.toString());
      }
    });
  }

  if (status.isFinalized) {
    console.log('Finalized in block:', status.asFinalized.toHex());
    unsub();
  }
});
*/
    `);

    // Cleanup: Unsubscribe from events after a short delay
    setTimeout(() => {
      unsubBonded();
      unsubUnbonded();
      unsubRewarded();
      unsubSlashed();
      console.log('\n✓ Unsubscribed from all events');
    }, 5000);

    console.log('\n' + '='.repeat(80));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(80));
    console.log('\nNote: No transactions were submitted. All examples show how to:');
    console.log('  1. Query staking state');
    console.log('  2. Create transactions');
    console.log('  3. Estimate fees');
    console.log('  4. Listen to events');
    console.log('\nTo submit transactions, uncomment the signAndSend example above.');

    // Keep alive for event listeners (optional)
    await new Promise(resolve => setTimeout(resolve, 6000));

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await sdk.disconnect();
    console.log('\n✓ Disconnected from node');
    process.exit(0);
  }
}

main().catch(console.error);
