/**
 * Example 04: Claim with Custom EVM Key
 * 
 * This example demonstrates how to claim an EVM address using a
 * separate, custom EVM private key. This allows you to use a different
 * key for EVM than for Substrate.
 * 
 * Run: npm run unified:claim-custom
 */

import 'dotenv/config';
import { createSDK, ChainType } from '@selendrajs/sdk-core';
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  console.log('=== Claim with Custom EVM Key ===\n');

  // Wait for crypto to be ready
  await cryptoWaitReady();

  // Get custom EVM private key from environment
  const customEvmKey = process.env.EVM_PRIVATE_KEY;
  
  if (!customEvmKey || customEvmKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.log('❌ Please set EVM_PRIVATE_KEY in .env file with your custom EVM private key');
    process.exit(1);
  }

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
      console.log('🔑 Using Substrate account from SUBSTRATE_PRIVATE_KEY');
    } else {
      sender = keyring.addFromUri(senderUri);
      console.log(`🔑 Using Substrate seed from SENDER_URI: ${senderUri}`);
    }
    
    console.log(`Substrate Address: ${sender.address}\n`);

    // Calculate EVM address from custom key
    const { ethers } = await import('ethers');
    const evmWallet = new ethers.Wallet(customEvmKey);
    console.log(`Custom EVM Address: ${evmWallet.address}\n`);

    // Check eligibility
    console.log('🔍 Checking eligibility...');
    const eligibility = await sdk.unifiedAccounts.checkClaimEligibility(sender.address);
    
    if (!eligibility.eligible) {
      console.log('❌ Cannot claim:', eligibility.reasons.join(', '));
      await sdk.destroy();
      return;
    }
    
    console.log('✅ Eligible to claim\n');

    // Claim with custom EVM key
    console.log('📤 Claiming EVM address with custom key...');
    console.log('This will:');
    console.log('  1. Generate EIP-712 signature from custom EVM key');
    console.log('  2. Submit claim transaction');
    console.log('  3. Wait for finalization (may take 12-60 seconds)...\n');

    const result = await sdk.unifiedAccounts.claimEvmAddress(
      sender,
      customEvmKey,
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
    console.log(`  Key Type: Custom (separate EVM private key)`);
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
