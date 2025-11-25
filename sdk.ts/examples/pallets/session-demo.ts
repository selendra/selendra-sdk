/**
 * Session Pallet Demo
 * 
 * Demonstrates all Session pallet functionality
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { SessionManager } from '../../src/pallets/session/index.js';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const ENDPOINT = 'ws://127.0.0.1:9944';

async function main() {
  console.log('='.repeat(80));
  console.log('SESSION PALLET DEMO - Comprehensive Example');
  console.log('='.repeat(80));

  // Initialize API
  console.log('\n📡 Connecting to local node...');
  const provider = new WsProvider(ENDPOINT);
  const api = await ApiPromise.create({ provider });
  console.log('✅ Connected to Selendra node');

  // Initialize Session Manager
  const session = new SessionManager(api);

  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  
  // Test accounts
  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');
  const charlie = keyring.addFromUri('//Charlie');

  console.log('\n👥 Test Accounts:');
  console.log(`   Alice:   ${alice.address}`);
  console.log(`   Bob:     ${bob.address}`);
  console.log(`   Charlie: ${charlie.address}`);

  // ============================================================================
  // 1. CURRENT SESSION INFO
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('1. CURRENT SESSION INFORMATION');
  console.log('='.repeat(80));

  const sessionInfo = await session.getSessionInfo();
  console.log(`\n📊 Session Index: ${sessionInfo.currentIndex}`);
  console.log(`\n👥 Current Validators (${sessionInfo.validators.length}):`);
  sessionInfo.validators.forEach((validator, index) => {
    console.log(`   ${index + 1}. ${validator}`);
  });

  console.log(`\n🔑 Queued Session Keys (${sessionInfo.queuedKeys.length}):`);
  sessionInfo.queuedKeys.forEach((qk, index) => {
    console.log(`   ${index + 1}. Validator: ${qk.validator}`);
    console.log(`      GRANDPA:            ${qk.keys.grandpa}`);
    console.log(`      BABE:               ${qk.keys.babe}`);
    console.log(`      ImOnline:           ${qk.keys.imOnline}`);
    console.log(`      AuthorityDiscovery: ${qk.keys.authorityDiscovery}`);
  });

  // ============================================================================
  // 2. VALIDATOR CHECKS
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('2. VALIDATOR STATUS CHECKS');
  console.log('='.repeat(80));

  const aliceIsValidator = await session.isValidator(alice.address);
  const bobIsValidator = await session.isValidator(bob.address);
  const charlieIsValidator = await session.isValidator(charlie.address);

  console.log(`\n✅ Alice is current validator: ${aliceIsValidator}`);
  console.log(`✅ Bob is current validator: ${bobIsValidator}`);
  console.log(`✅ Charlie is current validator: ${charlieIsValidator}`);

  // ============================================================================
  // 3. SESSION KEYS QUERIES
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('3. SESSION KEYS QUERIES');
  console.log('='.repeat(80));

  for (const account of [alice, bob, charlie]) {
    console.log(`\n🔍 Checking session keys for ${account.address.substring(0, 10)}...`);
    
    const keys = await session.getSessionKeys(account.address);
    const hasQueued = await session.queries.hasQueuedKeys(account.address);
    const isQueued = await session.isQueuedValidator(account.address);
    
    if (keys) {
      console.log(`   ✅ Has session keys set`);
      console.log(`   GRANDPA:            ${keys.grandpa}`);
      console.log(`   BABE:               ${keys.babe}`);
      console.log(`   ImOnline:           ${keys.imOnline}`);
      console.log(`   AuthorityDiscovery: ${keys.authorityDiscovery}`);
    } else {
      console.log(`   ❌ No session keys set`);
    }
    
    console.log(`   Has queued keys: ${hasQueued}`);
    console.log(`   Is queued validator: ${isQueued}`);
  }

  // ============================================================================
  // 4. FEE ESTIMATION
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('4. TRANSACTION FEE ESTIMATION');
  console.log('='.repeat(80));

  // Use sample keys for estimation
  const sampleKeys = '0x' + '0'.repeat(256); // 256 hex chars = 128 bytes
  
  try {
    const setKeysFee = await session.estimateSetKeysFee(sampleKeys, '0x', alice.address);
    console.log(`\n💰 Estimated fee for setKeys: ${setKeysFee} (${Number(setKeysFee) / 1e12} SEL)`);
    
    const purgeKeysFee = await session.estimatePurgeKeysFee(alice.address);
    console.log(`💰 Estimated fee for purgeKeys: ${purgeKeysFee} (${Number(purgeKeysFee) / 1e12} SEL)`);
  } catch (error) {
    console.log(`⚠️  Could not estimate fees: ${error}`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('DEMO SUMMARY');
  console.log('='.repeat(80));

  console.log(`
✅ Session Pallet Demo Complete!

Demonstrated Features:
  1. ✅ Current session info (index, validators, queued keys)
  2. ✅ Validator status checks (isValidator, isQueuedValidator)
  3. ✅ Session keys queries (nextKeys, hasQueuedKeys)
  4. ✅ Fee estimation (setKeys, purgeKeys)

Session Statistics:
  - Current Session: ${sessionInfo.currentIndex}
  - Active Validators: ${sessionInfo.validators.length}
  - Queued Keys: ${sessionInfo.queuedKeys.length}

Available Functions (Not Executed):
  - setKeys(keys, proof) - Set session keys
  - purgeKeys() - Remove session keys
  - rotateKeys() - Generate new keys (RPC)
  - onNewSession() - Event monitoring
  `);

  // Cleanup
  await api.disconnect();
  console.log('\n👋 Disconnected from node\n');
}

main().catch((error) => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
