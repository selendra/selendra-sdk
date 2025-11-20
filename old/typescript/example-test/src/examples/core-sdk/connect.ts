/**
 * Example: SDK Connect
 * 
 * Demonstrates how to connect to the Selendra network
 */

import { SelendraSDK } from '@selendrajs/sdk';
import { getEndpoint, configManager } from '../../config';

async function connectExample() {
  console.log('📝 Example: Connect to Selendra Network\n');

  // Print current configuration
  configManager.printConfig();

  // Initialize SDK with configuration from .env
  const endpoint = getEndpoint();
  const sdk = new SelendraSDK({ 
    endpoint
  });

  console.log('SDK instance created');
  console.log('Endpoint:', endpoint);
  console.log();

  try {
    // Connect to the network
    console.log('🔌 Connecting to Selendra network...');
    await sdk.connect();
    console.log('✅ Successfully connected!\n');

    // Verify connection
    console.log('📊 Verifying connection...');
    console.log('Connection established to:', endpoint);
    console.log('SDK is ready for operations');

    console.log('\n✅ Connection verified - SDK is ready to use');

    // Clean up
    await sdk.disconnect();

  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Run the example
if (require.main === module) {
  connectExample()
    .then(() => {
      console.log('\n🎉 Connect example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Connect example failed:', error);
      process.exit(1);
    });
}

export { connectExample };
