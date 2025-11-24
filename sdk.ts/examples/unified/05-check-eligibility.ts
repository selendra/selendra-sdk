/**
 * Example 05: Check Claim Eligibility
 * 
 * This example demonstrates how to check if an account is eligible
 * to claim a unified mapping before attempting the transaction.
 * 
 * Run: npm run unified:check-eligibility
 */

import 'dotenv/config';
import { createSDK, ChainType } from '@selendrajs/sdk-core';

async function main() {
  console.log('=== Check Claim Eligibility ===\n');

  // Create SDK instance
  const sdk = createSDK({
    endpoint: process.env.SELENDRA_WS_URL || 'wss://rpc-testnet.selendra.org',
    chainType: ChainType.Substrate,
    debug: false,
  });

  try {
    await sdk.connect();
    console.log('✅ Connected to Selendra Substrate\n');

    if (!sdk.unifiedAccounts) {
      console.log('❌ Unified accounts not available');
      await sdk.destroy();
      return;
    }

    // Test address
    const substrateAddress = process.env.SUBSTRATE_ADDRESS || '5DjjsNitvw1SYstaW4q4J165UwujptdZgSpACku8kgVFdQ57';
    console.log(`📋 Checking eligibility for: ${substrateAddress}\n`);

    // Get storage fee first
    const storageFee = await sdk.unifiedAccounts.getStorageFee();
    console.log(`💰 Storage Fee Required: ${storageFee} planck (${Number(storageFee) / 1e18} SEL)\n`);

    // Check eligibility
    const eligibility = await sdk.unifiedAccounts.checkClaimEligibility(substrateAddress);

    console.log('=== Eligibility Check ===\n');
    console.log(`Status: ${eligibility.eligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}\n`);

    if (!eligibility.eligible) {
      console.log('Reasons:');
      eligibility.reasons.forEach((reason, i) => {
        console.log(`  ${i + 1}. ${reason}`);
      });
      console.log('');
    }

    console.log('Requirements:');
    console.log(`  Has Existing Mapping: ${eligibility.requirements.hasMapping ? '❌ Yes (cannot claim again)' : '✅ No (ready to claim)'}`);
    console.log(`  Current Balance: ${eligibility.requirements.currentBalance} planck`);
    console.log(`  Storage Fee Required: ${eligibility.requirements.storageFeeRequired} planck`);
    console.log(`  Sufficient Balance: ${eligibility.requirements.sufficientBalance ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // Estimate total cost
    const costEstimate = await sdk.unifiedAccounts.estimateClaimCost();
    
    console.log('=== Cost Estimate ===\n');
    console.log('Estimated Fees:');
    console.log(`  Storage Fee: ${costEstimate.storageFee} planck`);
    console.log(`  Transaction Fee: ${costEstimate.estimatedTxFee} planck`);
    console.log(`  Total Estimated: ${costEstimate.estimatedTotal} planck`);
    console.log(`  (≈ ${Number(costEstimate.estimatedTotal) / 1e18} SEL)\n`);

    if (costEstimate.balanceTransfer) {
      console.log('Balance Transfer:');
      console.log(`  From Default Account: ${costEstimate.balanceTransfer} planck\n`);
    }

    // Show next steps
    if (eligibility.eligible) {
      console.log('=== Next Steps ===\n');
      console.log('You can now claim a unified mapping using one of these methods:\n');
      console.log('1. Default EVM Address (simplest):');
      console.log('   npm run unified:claim-default\n');
      console.log('2. Derived EVM Key (same key material):');
      console.log('   npm run unified:claim-derived\n');
      console.log('3. Custom EVM Key (separate key):');
      console.log('   npm run unified:claim-custom\n');
    } else {
      console.log('=== Action Required ===\n');
      eligibility.reasons.forEach((reason, i) => {
        console.log(`${i + 1}. ${reason}`);
      });
      console.log('');
    }

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
