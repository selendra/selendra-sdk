/**
 * Example: Basic EVM Connection
 * 
 * Demonstrates the simplest way to connect to Selendra EVM chain
 */

import { SelendraSDK, ChainType } from '@selendrajs/sdk-core';

async function basicEvmExample() {
  console.log('📝 Basic EVM Connection Example\n');

  // Create SDK instance
  const sdk = new SelendraSDK({
    endpoint: 'https://rpc.selendra.org',
    chainType: ChainType.EVM,
  });

  try {
    // Connect
    console.log('🔌 Connecting to Selendra EVM...');
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
