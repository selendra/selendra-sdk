/**
 * Example 03: Claim with Derived EVM Key
 * 
 * This example demonstrates how to claim an EVM address using a key
 * derived from your Substrate account (same key material, different path).
 * This requires an EIP-712 signature from the derived key.
 * 
 * Run: npm run unified:claim-derived
 */

import 'dotenv/config';
import { createSDK, ChainType } from '@selendrajs/sdk-core';
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  console.log('=== Claim with Derived EVM Key ===\n');

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

    // Derive EVM key from Substrate account
    console.log('🔐 Deriving EVM key from Substrate account (using //evm path)...');
    const evmAccount = sender.derive('//evm');
    
    // @ts-ignore - secretKey exists at runtime but not in type definitions
    const evmPrivateKey = '0x' + Buffer.from(evmAccount.secretKey || evmAccount.seed).toString('hex');
    console.log(`Derived EVM Address: ${evmAccount.address}\n`);

    // Claim with derived key (same key material, signature required)
    console.log('📤 Claiming EVM address with derived key...');
    console.log('This will:');
    console.log('  1. Generate EIP-712 signature from derived key');
    console.log('  2. Submit claim transaction');
    console.log('  3. Wait for finalization (may take 12-60 seconds)...\n');

    // When calling without evmPrivateKey parameter, it will auto-derive
    const result = await sdk.unifiedAccounts.claimEvmAddress(
      sender,
      undefined, // Let it auto-derive from sender
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
    console.log(`  Key Type: Derived (same key material, //evm path)`);
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
