/**
 * Example 01: Get Current Block Information
 * 
 * This example demonstrates how to get current block information
 * from both Substrate and EVM chains.
 * 
 * Run: npm run block:current
 */

import 'dotenv/config';
import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';

async function main() {
  console.log('=== Current Block Information Example ===\n');

  try {
    // ========================================
    // EVM Chain Block Info
    // ========================================
    console.log('--- EVM Chain ---');
    const evmSdk = createSDK({
      chainType: ChainType.EVM,
      endpoint: 'https://rpc-testnet.selendra.org',
      network: 'selendra-testnet',
      debug: false
    });

    await evmSdk.connect();
    console.log('✅ Connected to Selendra EVM\n');

    const evmBlock = await evmSdk.getCurrentBlock();
    
    console.log('Block Information:');
    console.log('  Number:', evmBlock.number);
    console.log('  Hash:', evmBlock.hash);
    console.log('  Timestamp:', evmBlock.timestamp, `(${new Date(evmBlock.timestamp * 1000).toISOString()})`);
    console.log('  Parent Hash:', evmBlock.parentHash);
    console.log('  Transactions:', evmBlock.transactions?.length || 0);
    console.log('  Gas Limit:', evmBlock.gasLimit);
    console.log('  Gas Used:', evmBlock.gasUsed);
    console.log('  Miner:', evmBlock.miner);
    console.log('  Chain Type:', evmBlock.chainType);

    if (evmBlock.gasLimit && evmBlock.gasUsed) {
      const gasUsedPercent = (BigInt(evmBlock.gasUsed) * 100n / BigInt(evmBlock.gasLimit));
      console.log('  Gas Usage:', gasUsedPercent.toString() + '%');
    }

    await evmSdk.destroy();

    // ========================================
    // Substrate Chain Block Info
    // ========================================
    console.log('\n--- Substrate Chain ---');
    const substrateSdk = createSDK({
      chainType: ChainType.Substrate,
      endpoint: 'wss://rpc-testnet.selendra.org',
      network: 'selendra-testnet',
      debug: false
    });

    await substrateSdk.connect();
    console.log('✅ Connected to Selendra Substrate\n');

    const substrateBlock = await substrateSdk.getCurrentBlock();
    
    console.log('Block Information:');
    console.log('  Number:', substrateBlock.number);
    console.log('  Hash:', substrateBlock.hash);
    console.log('  Parent Hash:', substrateBlock.parentHash);
    console.log('  State Root:', substrateBlock.stateRoot);
    console.log('  Extrinsics Root:', substrateBlock.extrinsicsRoot);
    console.log('  Chain Type:', substrateBlock.chainType);

    await substrateSdk.destroy();

    // ========================================
    // Comparison
    // ========================================
    console.log('\n--- Block Height Comparison ---');
    console.log('EVM Block Height:', evmBlock.number);
    console.log('Substrate Block Height:', substrateBlock.number);
    
    const difference = Math.abs(evmBlock.number - substrateBlock.number);
    console.log('Height Difference:', difference, 'blocks');

    console.log('\n✅ Example completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
