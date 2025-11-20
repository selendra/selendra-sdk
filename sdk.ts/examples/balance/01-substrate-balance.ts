/**
 * Example: Check Balance - Substrate
 * 
 * Demonstrates how to check account balance on Selendra Substrate chain
 */

import { SelendraSDK, ChainType } from '@selendrajs/sdk-core';

async function checkSubstrateBalance() {
  console.log('📝 Check Substrate Balance Example\n');

  const sdk = new SelendraSDK({
    endpoint: 'wss://rpc.selendra.org',
    chainType: ChainType.Substrate,
  });

  try {
    await sdk.connect();
    console.log('✅ Connected to Selendra Substrate\n');

    // Example addresses (replace with actual addresses)
    const addresses = [
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',  // Alice
      '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',  // Bob
    ];

    for (const address of addresses) {
      console.log(`Address: ${address}`);
      
      try {
        // Get raw balance (in planck - smallest unit)
        const rawBalance = await sdk.getBalance(address);
        console.log('  Raw Balance:', rawBalance.toString(), 'planck');
        
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

checkSubstrateBalance();
