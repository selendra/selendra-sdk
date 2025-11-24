/**
 * Example: Basic EVM Connection
 * 
 * Demonstrates the simplest way to connect to Selendra EVM chain
 */

import 'dotenv/config';
import { SelendraSDK, ChainType } from '@selendrajs/sdk-core';

async function basicEvmExample() {
  console.log('📝 Basic EVM Connection Example\n');

  // Create SDK instance
  const endpoint = process.env.SELENDRA_RPC_URL || 'https://rpc-testnet.selendra.org';
  const sdk = new SelendraSDK({
    endpoint: endpoint,
    chainType: ChainType.EVM,
  });

  try {
    // Connect
    console.log('🔌 Connecting to Selendra EVM Testnet...');
    console.log('   Endpoint:', endpoint);
    await sdk.connect();
    console.log('✅ Connected!\n');

    // Get network information
    const provider = sdk.getEvmProvider();
    if (provider) {
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const feeData = await provider.getFeeData();

      console.log('Network Information:');
      console.log('  Chain ID:', network.chainId.toString());
      console.log('  Block Number:', blockNumber);
      console.log('  Gas Price:', feeData.gasPrice?.toString(), 'wei');
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

basicEvmExample();
