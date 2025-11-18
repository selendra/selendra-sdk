/**
 * Example: Get Account Information
 * 
 * Demonstrates how to retrieve account information from the Selendra network
 */

import { SelendraSDK } from '@selendrajs/sdk';
import { getEndpoint, config } from '../../config';

async function getAccountExample() {
  console.log('📝 Example: Get Account Information\n');

  const sdk = new SelendraSDK({ 
    endpoint: getEndpoint()
  });

  try {
    // Connect to the network
    console.log('🔌 Connecting to Selendra network...');
    await sdk.connect();
    console.log('✅ Connected\n');

    // Example 1: Get account info for a test address
    console.log('📊 Example 1: Get Account Information');
    console.log('-'.repeat(60));
    const testAddress = config.testAddressSubstrate;
    console.log('Address:', testAddress);
    
    try {
      const accountInfo = await sdk.getAccount(testAddress);
      console.log('\n✅ Account Information:');
      console.log(JSON.stringify(accountInfo, null, 2));
    } catch (error) {
      console.log('⚠️  Method not yet fully implemented');
      console.log('Error:', error instanceof Error ? error.message : String(error));
    }

    // Example 2: Get current connected account (if available)
    console.log('\n📊 Example 2: Get Current Account');
    console.log('-'.repeat(60));
    
    try {
      const currentAccount = await sdk.getAccount();
      console.log('✅ Current Account:');
      console.log(JSON.stringify(currentAccount, null, 2));
    } catch (error) {
      console.log('⚠️  No account connected or method not implemented');
      console.log('Note: This requires a connected wallet/signer');
    }

    console.log('\n💡 Account Information Typically Includes:');
    console.log('  • Address');
    console.log('  • Balance (free, reserved, total)');
    console.log('  • Nonce (transaction count)');
    console.log('  • Account type (substrate/evm)');
    console.log('  • Additional metadata');

    // Clean up
    await sdk.disconnect();

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Run the example
if (require.main === module) {
  getAccountExample()
    .then(() => {
      console.log('\n🎉 Get Account example completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Get Account example failed:', error);
      process.exit(1);
    });
}

export { getAccountExample };
