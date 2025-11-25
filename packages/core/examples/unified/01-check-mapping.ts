/**
 * Example 01: Check Unified Account Mapping
 * 
 * This example demonstrates how to check if an account has a unified mapping
 * and get mapping information.
 * 
 * Run: npm run unified:check-mapping
 */

import 'dotenv/config';
import { createSDK, ChainType } from '@selendrajs/sdk';

async function main() {
  console.log('=== Check Unified Account Mapping ===\n');

  // Create SDK instance (Substrate connection required)
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

    // Test addresses
    const substrateAddress = process.env.SUBSTRATE_ADDRESS || '5DjjsNitvw1SYstaW4q4J165UwujptdZgSpACku8kgVFdQ57';
    const evmAddress = process.env.EVM_ADDRESS || '0x1234567890123456789012345678901234567890';

    // Check Substrate address mapping
    console.log('📋 Checking Substrate Address:');
    console.log(`Address: ${substrateAddress}\n`);

    const subMapping = await sdk.unifiedAccounts.getMappingInfo(substrateAddress);
    console.log('  Type:', subMapping.type);
    console.log('  Has Mapping:', subMapping.isMapped);
    console.log('  Mapped To:', subMapping.mappedTo || 'None');
    console.log('  Default EVM Address:', subMapping.defaultMapping);
    console.log('');

    // Check EVM address mapping
    console.log('📋 Checking EVM Address:');
    console.log(`Address: ${evmAddress}\n`);

    const evmMapping = await sdk.unifiedAccounts.getMappingInfo(evmAddress);
    console.log('  Type:', evmMapping.type);
    console.log('  Has Mapping:', evmMapping.isMapped);
    console.log('  Mapped To:', evmMapping.mappedTo || 'None');
    console.log('  Default Substrate Address:', evmMapping.defaultMapping);
    console.log('');

    // Get storage fee
    const storageFee = await sdk.unifiedAccounts.getStorageFee();
    console.log(`💰 Storage Fee: ${storageFee} planck (${Number(storageFee) / 1e18} SEL)\n`);

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
