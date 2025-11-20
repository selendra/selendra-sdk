/**
 * Example: Check Balance - Unified
 * 
 * Demonstrates how to check balances on both chains
 */

import { SelendraSDK, ChainType } from '@selendrajs/sdk-core';

async function checkUnifiedBalance() {
  console.log('📝 Unified Balance Check Example\n');

  // Substrate Balance
  console.log('🔷 Substrate Balance:');
  console.log('─'.repeat(50));
  
  const substrateSDK = new SelendraSDK({
    endpoint: 'wss://rpc.selendra.org',
    chainType: ChainType.Substrate,
  });

  await substrateSDK.connect();
  
  const substrateAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  console.log('Address:', substrateAddress);
  
  try {
    const balance = await substrateSDK.getFormattedBalance(substrateAddress);
    console.log('Balance:', balance.toFixed(4), 'SEL');
  } catch (error) {
    console.log('Error:', error instanceof Error ? error.message : String(error));
  }
  
  await substrateSDK.destroy();
  console.log('');

  // EVM Balance
  console.log('🔶 EVM Balance:');
  console.log('─'.repeat(50));
  
  const evmSDK = new SelendraSDK({
    endpoint: 'https://rpc.selendra.org',
    chainType: ChainType.EVM,
  });

  await evmSDK.connect();
  
  const evmAddress = '0x9E07F5AD05A5D2D4657d2f741C1bEd46dc2EA628';
  console.log('Address:', evmAddress);
  
  try {
    const balance = await evmSDK.getFormattedBalance(evmAddress);
    console.log('Balance:', balance.toFixed(4), 'SEL');
  } catch (error) {
    console.log('Error:', error instanceof Error ? error.message : String(error));
  }
  
  await evmSDK.destroy();
  console.log('\n✅ Example completed!\n');
  
  process.exit(0);
}

checkUnifiedBalance();
