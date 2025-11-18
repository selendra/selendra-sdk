/**
 * Example: Get Balance
 * 
 * Demonstrates how to query account balances on Selendra network
 */

import { SelendraSDK } from '@selendrajs/sdk';
import { getEndpoint, config } from '../../config';

async function getBalanceExample() {
  console.log('📝 Example: Get Account Balance\n');

  const sdk = new SelendraSDK({ 
    endpoint: getEndpoint()
  });

  try {
    // Connect to the network
    console.log('🔌 Connecting to Selendra network...');
    await sdk.connect();
    console.log('✅ Connected\n');

    // Example 1: Get balance for Substrate address
    console.log('📊 Example 1: Get Substrate Balance');
    console.log('-'.repeat(60));
    const substrateAddress = config.testAddressSubstrate;
    console.log('Substrate Address:', substrateAddress);
    
    try {
      const substrateBalance = await sdk.getBalance(substrateAddress);
      console.log('\n✅ Substrate Balance:');
      console.log('  Free:', substrateBalance.free || 'N/A');
      console.log('  Reserved:', substrateBalance.reserved || 'N/A');
      console.log('  Total:', substrateBalance.total || 'N/A');
      console.log('  Frozen:', substrateBalance.frozen || 'N/A');
    } catch (error) {
      console.log('⚠️  Substrate balance query not fully implemented');
      console.log('Error:', error instanceof Error ? error.message : String(error));
    }

    // Example 2: Get balance for EVM address
    console.log('\n📊 Example 2: Get EVM Balance');
    console.log('-'.repeat(60));
    const evmAddress = config.testAddressEvm;
    console.log('EVM Address:', evmAddress);
    
    try {
      const evmBalance = await sdk.getBalance(evmAddress);
      console.log('\n✅ EVM Balance:');
      console.log('  Wei:', evmBalance);
      
      // Convert to human-readable format if needed
      if (typeof evmBalance === 'string' || typeof evmBalance === 'bigint') {
        const balanceInEther = Number(evmBalance) / 1e18;
        console.log('  Ether:', balanceInEther.toFixed(6), 'SEL');
      }
    } catch (error) {
      console.log('⚠️  EVM balance query not fully implemented');
      console.log('Error:', error instanceof Error ? error.message : String(error));
    }

    // Example 3: Get balance with options
    console.log('\n📊 Example 3: Get Balance with Options');
    console.log('-'.repeat(60));
    console.log('Address:', substrateAddress);
    
    try {
      const balanceWithOptions = await sdk.getBalance(substrateAddress, {
        includeUSD: true,
        includeMetadata: true
      });
      console.log('\n✅ Balance (with options):');
      console.log(JSON.stringify(balanceWithOptions, null, 2));
    } catch (error) {
      console.log('⚠️  Balance options not fully implemented');
      console.log('Error:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n💡 Balance Types:');
    console.log('  Substrate:');
    console.log('    • Free: Available for transfers');
    console.log('    • Reserved: Locked for specific purposes');
    console.log('    • Frozen: Cannot be spent (staking, governance)');
    console.log('    • Total: Free + Reserved');
    console.log('\n  EVM:');
    console.log('    • Wei: Smallest unit (1 ETH = 10^18 Wei)');
    console.log('    • Ether/SEL: Human-readable format');

    // Clean up
    await sdk.disconnect();

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Run the example
if (require.main === module) {
  getBalanceExample()
    .then(() => {
      console.log('\n🎉 Get Balance example completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Get Balance example failed:', error);
      process.exit(1);
    });
}

export { getBalanceExample };
