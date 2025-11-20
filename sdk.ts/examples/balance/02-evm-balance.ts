/**
 * Example: Check Balance - EVM
 * 
 * Demonstrates how to check account balance on Selendra EVM chain
 */

import { SelendraSDK, ChainType } from '@selendrajs/sdk-core';

async function checkEvmBalance() {
  console.log('📝 Check EVM Balance Example\n');

  const sdk = new SelendraSDK({
    endpoint: 'https://rpc.selendra.org',
    chainType: ChainType.EVM,
  });

  try {
    await sdk.connect();
    console.log('✅ Connected to Selendra EVM\n');

    // Example addresses (replace with actual addresses)
    const addresses = [
      '0x9E07F5AD05A5D2D4657d2f741C1bEd46dc2EA628',  // Example 1
      '0xdc755dBB3BD4AcF914cE1646B06FeF6f854f1756',  // Example 2
    ];

    for (const address of addresses) {
      console.log(`Address: ${address}`);
      
      try {
        // Get raw balance (in wei - smallest unit)
        const rawBalance = await sdk.getBalance(address);
        console.log('  Raw Balance:', rawBalance.toString(), 'wei');
        
        // Get formatted balance (in SEL)
        const formattedBalance = await sdk.getFormattedBalance(address);
        console.log('  Formatted Balance:', formattedBalance.toFixed(4), 'SEL');
      } catch (error) {
        console.log('  Error:', error instanceof Error ? error.message : String(error));
      }
      
      console.log('');
    }

    await sdk.destroy();
    console.log('✅ Example completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEvmBalance();
