/**
 * Example: SDK Destroy
 * 
 * Demonstrates how to clean up SDK resources properly using destroy()
 */

import { SelendraSDK } from '@selendrajs/sdk';
import { getEndpoint } from '../../config';

async function destroyExample() {
  console.log('📝 Example: Destroy SDK and Clean Up Resources\n');

  const sdk = new SelendraSDK({ 
    endpoint: getEndpoint()
  });

  try {
    // Connect and use the SDK
    console.log('🔌 Connecting to network...');
    await sdk.connect();
    console.log('✅ Connected\n');

    // Perform some operations
    console.log('📊 Performing operations...');
    console.log('SDK is connected and ready');
    console.log('Endpoint:', getEndpoint());

    // Simulate more work
    console.log('\n⏳ Processing...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Destroy the SDK - this will:
    // 1. Disconnect from network
    // 2. Clean up all resources
    // 3. Remove event listeners
    // 4. Clear internal state
    console.log('\n🗑️  Destroying SDK instance...');
    await sdk.destroy();
    console.log('✅ SDK destroyed successfully');

    console.log('\n📋 Cleanup Summary:');
    console.log('  ✓ Network connection closed');
    console.log('  ✓ Resources freed');
    console.log('  ✓ Event listeners removed');
    console.log('  ✓ Internal state cleared');
    console.log('\n💡 Tip: Use destroy() when you\'re completely done with the SDK');
    console.log('   Use disconnect() if you plan to reconnect later');

  } catch (error) {
    console.error('❌ Error during destroy:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Run the example
if (require.main === module) {
  destroyExample()
    .then(() => {
      console.log('\n🎉 Destroy example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Destroy example failed:', error);
      process.exit(1);
    });
}

export { destroyExample };
