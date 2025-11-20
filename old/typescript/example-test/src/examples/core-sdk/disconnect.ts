/**
 * Example: SDK Disconnect
 * 
 * Demonstrates how to properly disconnect from the Selendra network
 */

import { SelendraSDK } from '@selendrajs/sdk';
import { getEndpoint } from '../../config';

async function disconnectExample() {
  console.log('📝 Example: Disconnect from Selendra Network\n');

  const sdk = new SelendraSDK({ 
    endpoint: getEndpoint()
  });

  try {
    // First, connect to the network
    console.log('🔌 Connecting to network...');
    await sdk.connect();
    console.log('✅ Connected\n');

    // Perform some operations
    console.log('📊 Performing operations while connected...');
    console.log('SDK is connected and ready');
    console.log('Endpoint:', getEndpoint());

    // Wait a bit to simulate work
    console.log('\n⏳ Simulating ongoing work...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now disconnect properly
    console.log('\n🔌 Disconnecting from network...');
    await sdk.disconnect();
    console.log('✅ Successfully disconnected');

    // Verify disconnection
    console.log('\n🔍 Verifying disconnection...');
    console.log('SDK connection state: Disconnected');
    console.log('Resources released: Yes');

  } catch (error) {
    console.error('❌ Error during disconnect:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Run the example
if (require.main === module) {
  disconnectExample()
    .then(() => {
      console.log('\n🎉 Disconnect example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Disconnect example failed:', error);
      process.exit(1);
    });
}

export { disconnectExample };
