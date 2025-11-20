/**
 * Substrate Staking Example
 * Demonstrates staking operations using StakingClient
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { StakingClient } from '../src/substrate/staking';

async function main() {
  console.log('🔗 Connecting to Selendra...');

  // Connect to Selendra
  const provider = new WsProvider('wss://rpc-testnet.selendra.org');
  const api = await ApiPromise.create({ provider });
  await api.isReady;
  console.log('✅ Connected');

  // Initialize staking client
  const stakingClient = new StakingClient(api);

  // Create keyring
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  console.log('\n📝 Staking Account:', alice.address);

  // Query staking information
  console.log('\n🎯 Querying Staking Information...');
  try {
    const stakingInfo = await stakingClient.getStakingInfo(alice.address);
    if (stakingInfo) {
      console.log('  Total Stake:', stakingInfo.totalStake);
      console.log('  Active Stake:', stakingInfo.activeStake);
      console.log('  Own Stake:', stakingInfo.ownStake);
      console.log('  Era:', stakingInfo.era);
      console.log('  Session Index:', stakingInfo.sessionIndex);
    } else {
      console.log('  ⚠️  No staking info (account not staking yet)');
    }
  } catch (error) {
    console.log('  ⚠️  Error querying staking info');
  }

  // Example: Bond tokens (COMMENTED OUT)
  /*
  console.log('\n💎 Bonding tokens...');
  const bondAmount = '1000000000000000000'; // 1 SEL
  const bondResult = await stakingClient.bond(
    alice.address, // controller
    bondAmount,
    { signer: alice, waitForFinalization: true }
  );
  console.log('✅ Bonded:', bondResult.hash);
  */

  // Example: Nominate validators (COMMENTED OUT)
  /*
  console.log('\n🗳️  Nominating validators...');
  const validators = [
    '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  ];
  const nominateResult = await stakingClient.nominate(
    validators,
    { signer: alice, waitForFinalization: true }
  );
  console.log('✅ Nominated:', nominateResult.hash);
  */

  // Example: Become validator (COMMENTED OUT)
  /*
  console.log('\n⚡ Registering as validator...');
  const commission = 10; // 10%
  const validateResult = await stakingClient.validate(
    commission,
    { signer: alice, waitForFinalization: true }
  );
  console.log('✅ Validating:', validateResult.hash);
  */

  // Query validator information
  console.log('\n👥 Querying Validators...');
  const validators = await stakingClient.getValidators();
  console.log(`  Active validators: ${validators.length}`);
  if (validators.length > 0) {
    console.log(`  First validator: ${validators[0]}`);
  }

  // Disconnect
  await api.disconnect();
  console.log('\n👋 Disconnected');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
