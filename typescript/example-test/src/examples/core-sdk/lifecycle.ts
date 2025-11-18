/**
 * All-in-One Example: Connect, Use, Disconnect, and Destroy
 * 
 * Demonstrates the complete lifecycle of SDK usage
 */

import { SelendraSDK } from '@selendrajs/sdk';
import { getEndpoint, configManager } from '../../config';

async function lifecycleExample() {
  console.log('📝 Example: Complete SDK Lifecycle\n');
  console.log('='.repeat(60));

  // Print configuration
  configManager.printConfig();

  // Step 1: Initialize
  console.log('\n1️⃣  INITIALIZE SDK');
  console.log('-'.repeat(60));
  const sdk = new SelendraSDK({ 
    endpoint: getEndpoint()
  });
  console.log('✅ SDK instance created');

  try {
    // Step 2: Connect
    console.log('\n2️⃣  CONNECT TO NETWORK');
    console.log('-'.repeat(60));
    await sdk.connect();
    console.log('✅ Connected to Selendra network');

    // Step 3: Use the SDK
    console.log('\n3️⃣  USE SDK');
    console.log('-'.repeat(60));
    console.log('📊 SDK is ready for operations');
    console.log('Endpoint:', getEndpoint());

    // Step 4: Disconnect (optional - can reconnect later)
    console.log('\n4️⃣  DISCONNECT');
    console.log('-'.repeat(60));
    await sdk.disconnect();
    console.log('✅ Disconnected from network');
    console.log('💡 SDK can be reconnected with sdk.connect()');

    // Optional: Reconnect demonstration
    console.log('\n5️⃣  RECONNECT (OPTIONAL)');
    console.log('-'.repeat(60));
    await sdk.connect();
    console.log('✅ Reconnected successfully');
    
    // Step 5: Final cleanup with destroy
    console.log('\n6️⃣  DESTROY & CLEANUP');
    console.log('-'.repeat(60));
    await sdk.destroy();
    console.log('✅ SDK destroyed and all resources cleaned up');
    console.log('⚠️  SDK instance cannot be used after destroy()');

    console.log('\n' + '='.repeat(60));
    console.log('✅ LIFECYCLE COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error in lifecycle:', error instanceof Error ? error.message : String(error));
    
    // Cleanup even on error
    try {
      await sdk.destroy();
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    throw error;
  }
}

// Run the example
if (require.main === module) {
  lifecycleExample()
    .then(() => {
      console.log('\n🎉 Lifecycle example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Lifecycle example failed:', error);
      process.exit(1);
    });
}

export { lifecycleExample };
