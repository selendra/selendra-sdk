/**
 * Example 02: Get Contract Instance (Minimal ABI)
 * 
 * This example demonstrates how to get a contract instance using minimal ABI
 * for basic interactions when you don't have the full contract ABI.
 * 
 * Run: npm run contract:instance
 */

import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';

async function main() {
  console.log('=== Get Contract Instance (Minimal ABI) Example ===\n');

  // Replace with actual contract address
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
  const ACCOUNT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  try {
    // Create and connect to Selendra EVM
    const sdk = createSDK({
      chainType: ChainType.EVM,
      endpoint: 'https://rpc.selendra.org',
      network: 'selendra',
      debug: true
    });

    await sdk.connect();
    console.log('✅ Connected to Selendra EVM\n');
    console.log('Contract Address:', CONTRACT_ADDRESS, '\n');

    // Get contract instance with minimal ABI
    console.log('Getting contract instance with minimal ABI...');
    const contract = await sdk.getContractInstance(CONTRACT_ADDRESS);
    console.log('✅ Contract instance created (minimal ABI)\n');

    // The minimal ABI includes basic ERC20 functions
    console.log('--- Basic Contract Information ---');
    
    try {
      const name = await contract.name();
      console.log('Name:', name);
    } catch (e) {
      console.log('Name: Not available');
    }

    try {
      const symbol = await contract.symbol();
      console.log('Symbol:', symbol);
    } catch (e) {
      console.log('Symbol: Not available');
    }

    try {
      const decimals = await contract.decimals();
      console.log('Decimals:', decimals.toString());
    } catch (e) {
      console.log('Decimals: Not available');
    }

    try {
      const totalSupply = await contract.totalSupply();
      console.log('Total Supply:', totalSupply.toString());
    } catch (e) {
      console.log('Total Supply: Not available');
    }

    try {
      const balance = await contract.balanceOf(ACCOUNT_ADDRESS);
      console.log('Balance of', ACCOUNT_ADDRESS + ':', balance.toString());
    } catch (e) {
      console.log('Balance: Not available');
    }

    // Check if contract exists
    console.log('\n--- Contract Verification ---');
    const provider = sdk.getEvmProvider();
    if (provider) {
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        console.log('⚠️  No contract deployed at this address');
      } else {
        console.log('✅ Contract exists at this address');
        console.log('Contract bytecode length:', code.length - 2, 'bytes'); // -2 for '0x' prefix
      }
    }

    // Cleanup
    await sdk.destroy();
    console.log('\n✅ Example completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
