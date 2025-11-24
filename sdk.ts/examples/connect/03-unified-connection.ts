/**
 * Example: Unified SDK Usage
 * 
 * Demonstrates how to use a single SDK instance for both Substrate and EVM chains
 */

import 'dotenv/config';
import { SelendraSDK, ChainType } from '@selendrajs/sdk-core';

console.log('🚀 Unified SDK Example\n');

// =============================================================================
// Example 1: Connect to Substrate Chain
// =============================================================================
async function connectToSubstrate() {
  console.log('📦 Example 1: Substrate Chain');
  console.log('─'.repeat(50));

  const endpoint = process.env.SELENDRA_WS_URL || 'wss://rpc-testnet.selendra.org';
  const sdk = new SelendraSDK({
    endpoint: endpoint,
    chainType: ChainType.Substrate,  // ← Automatically uses SubstrateProvider
  });

  await sdk.connect();
  console.log('✅ Connected to Substrate Testnet');
  console.log('   Endpoint:', endpoint);

  const info = sdk.getConnectionInfo();
  console.log('Chain Type:', info.chainType);
  console.log('Endpoint:', info.endpoint);

  // Get Substrate API
  const api = sdk.getApi();
  if (api) {
    const chain = await api.rpc.system.chain();
    console.log('Chain:', chain.toString());
  }

  await sdk.destroy();  // Use destroy() instead of disconnect()
  console.log('');
}

// =============================================================================
// Example 2: Connect to EVM Chain
// =============================================================================
async function connectToEvm() {
  console.log('📦 Example 2: EVM Chain');
  console.log('─'.repeat(50));

  const endpoint = process.env.SELENDRA_RPC_URL || 'https://rpc-testnet.selendra.org';
  const sdk = new SelendraSDK({
    endpoint: endpoint,
    chainType: ChainType.EVM,  // ← Automatically uses EvmProvider
  });

  await sdk.connect();
  console.log('✅ Connected to EVM Testnet');
  console.log('   Endpoint:', endpoint);

  const info = sdk.getConnectionInfo();
  console.log('Chain Type:', info.chainType);
  console.log('Endpoint:', info.endpoint);

  // Get EVM provider
  const provider = sdk.getEvmProvider();
  if (provider) {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    console.log('Network:', network.name, '(Chain ID:', network.chainId.toString() + ')');
    console.log('Block Number:', blockNumber);
  }

  await sdk.destroy();  // Use destroy() instead of disconnect()
  console.log('');
}

// =============================================================================
// Example 3: Switch Between Chains
// =============================================================================
async function switchBetweenChains() {
  console.log('📦 Example 3: Dynamic Chain Switching');
  console.log('─'.repeat(50));

  // Connect to Substrate first
  const sdk = new SelendraSDK({
    endpoint: 'wss://rpc-testnet.selendra.org',
    chainType: ChainType.Substrate,
  });

  await sdk.connect();
  console.log('✅ Connected to Substrate');
  await sdk.disconnect();

  // Reconfigure for EVM and connect again
  sdk.withEndpoint('https://rpc-testnet.selendra.org')
     .withChainType(ChainType.EVM);

  await sdk.connect();
  console.log('✅ Switched to EVM');
  await sdk.destroy();  // Use destroy() for final cleanup
  console.log('');
}

// =============================================================================
// Example 4: Helper Function (Your Use Case)
// =============================================================================
async function connectToChain(endpoint: string, type: 'evm' | 'substrate') {
  console.log('📦 Example 4: Helper Function');
  console.log('─'.repeat(50));

  const chainType = type === 'evm' ? ChainType.EVM : ChainType.Substrate;

  const sdk = new SelendraSDK({
    endpoint,
    chainType,  // ← SDK automatically selects the right provider
  });

  await sdk.connect();
  console.log(`✅ Connected to ${type.toUpperCase()} chain`);
  console.log('Endpoint:', endpoint);

  await sdk.destroy();  // Use destroy() instead of disconnect()
  console.log('');
}

// =============================================================================
// Run Examples
// =============================================================================
async function runExamples() {
  try {
    await connectToSubstrate();
    await connectToEvm();
    await switchBetweenChains();
    
    // Your desired usage pattern
    await connectToChain('wss://rpc-testnet.selendra.org', 'substrate');
    await connectToChain('https://rpc-testnet.selendra.org', 'evm');

    console.log('✅ All examples completed successfully!');
    process.exit(0);  // Force exit
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runExamples();
