/**
 * Example: Basic Substrate Connection
 * 
 * Demonstrates the simplest way to connect to Selendra Substrate chain
 */

import 'dotenv/config';
import { SelendraSDK, ChainType } from '@selendrajs/sdk';

async function basicSubstrateExample() {
  console.log('📝 Basic Substrate Connection Example\n');

  // Create SDK instance
  const endpoint = process.env.SELENDRA_WS_URL || 'wss://rpc-testnet.selendra.org';
  const sdk = new SelendraSDK({
    endpoint: endpoint,
    chainType: ChainType.Substrate,
  });

  try {
    // Connect
    console.log('🔌 Connecting to Selendra Substrate Testnet...');
    console.log('   Endpoint:', endpoint);
    await sdk.connect();
    console.log('✅ Connected!\n');

    // Get chain information
    const api = sdk.getApi();
    if (api) {
      const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ]);

      console.log('Chain Information:');
      console.log('  Chain:', chain.toString());
      console.log('  Node:', nodeName.toString());
      console.log('  Version:', nodeVersion.toString());

      const header = await api.rpc.chain.getHeader();
      console.log('  Block Number:', header.number.toNumber());
    }

    // Disconnect
    console.log('\n🔌 Disconnecting...');
    await sdk.destroy();
    console.log('✅ Disconnected!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

basicSubstrateExample();
