/**
 * Example 02: Claim Default EVM Address
 * 
 * This example demonstrates how to claim the default EVM address
 * for a Substrate account. This is the simplest claiming method
 * and doesn't require any signature.
 * 
 * Run: npm run unified:claim-default
 */

import 'dotenv/config';
import { createSDK, ChainType } from '@selendrajs/sdk';
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  console.log('=== Claim Default EVM Address ===\n');

  // Wait for crypto to be ready
  await cryptoWaitReady();

  // Create SDK instance
  const sdk = createSDK({
    endpoint: process.env.SELENDRA_WS_URL || 'wss://rpc-testnet.selendra.org',
    chainType: ChainType.Substrate,
    debug: true,
  });

  try {
    await sdk.connect();
    console.log('✅ Connected to Selendra Substrate\n');

    if (!sdk.unifiedAccounts) {
      console.log('❌ Unified accounts not available');
      await sdk.destroy();
      return;
    }

    // Get Substrate account from environment
    const keyring = new Keyring({ type: 'sr25519' });
    
    // Get private key or seed from environment
    const substrateKey = process.env.SUBSTRATE_PRIVATE_KEY;
    const senderUri = process.env.SENDER_URI || '//Alice';
    
    let sender;
    if (substrateKey && substrateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      const cleanKey = substrateKey.startsWith('0x') ? substrateKey.slice(2) : substrateKey;
      sender = keyring.addFromSeed(Buffer.from(cleanKey, 'hex'));
      console.log('🔑 Using account from SUBSTRATE_PRIVATE_KEY');
    } else {
      sender = keyring.addFromUri(senderUri);
      console.log(`🔑 Using seed from SENDER_URI: ${senderUri}`);
    }
    
    console.log(`Substrate Address: ${sender.address}\n`);

    // Check eligibility
    console.log('🔍 Checking eligibility...');
    const eligibility = await sdk.unifiedAccounts.checkClaimEligibility(sender.address);
    
    if (!eligibility.eligible) {
      console.log('❌ Cannot claim:', eligibility.reasons.join(', '));
      await sdk.destroy();
      return;
    }
    
    console.log('✅ Eligible to claim\n');
    console.log('Requirements:');
    console.log(`  Has Mapping: ${eligibility.requirements.hasMapping}`);
    console.log(`  Current Balance: ${eligibility.requirements.currentBalance} planck`);
    console.log(`  Storage Fee Required: ${eligibility.requirements.storageFeeRequired} planck`);
    console.log('');

    // Calculate default EVM address
    const defaultEvm = sdk.unifiedAccounts.getDefaultEvmAddress(sender.address);
    console.log(`📝 Default EVM Address: ${defaultEvm}\n`);

    // Claim default EVM address
    console.log('📤 Claiming default EVM address...');
    console.log('This will wait for transaction finalization (may take 12-60 seconds)...\n');

    const result = await sdk.unifiedAccounts.claimDefaultEvmAddress(
      sender,
      { waitForFinalization: true }
    );

    console.log('✅ Claim successful!\n');
    console.log('Transaction Details:');
    console.log(`  TX Hash: ${result.txHash}`);
    console.log(`  Block Hash: ${result.blockHash}`);
    console.log('');
    console.log('Mapping Created:');
    console.log(`  Substrate: ${result.mapping.substrate}`);
    console.log(`  EVM: ${result.mapping.evm}`);
    console.log('');
    console.log('Fees:');
    console.log(`  Storage Fee: ${result.fee.storageFee} planck`);
    console.log(`  Transaction Fee: ${result.fee.transactionFee} planck`);
    console.log(`  Total: ${result.fee.total} planck`);
    console.log('');

    await sdk.destroy();
    console.log('✅ Example completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sdk.destroy();
    process.exit(1);
  }
}

main();
