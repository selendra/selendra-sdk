/**
 * Basic connection example for the Selendra SDK
 *
 * This example demonstrates how to connect to the Selendra network
 * and perform basic operations like getting chain info.
 */

import { SelendraSDK, Network } from '@selendrajs/sdk';

async function main(): Promise<void> {
  try {
    // Initialize the SDK
    console.log('Initializing Selendra SDK...');

    const sdk = new SelendraSDK()
      .withEndpoint('wss://rpc.selendra.org')
      .withNetwork(Network.Selendra);

    console.log('✓ Connected to Selendra network');

    // Get chain information
    const chainInfo = await sdk.chainInfo();
    console.log('Chain Information:');
    console.log(`  Name: ${chainInfo.name}`);
    console.log(`  Version: ${chainInfo.version}`);
    console.log(`  Chain ID: ${chainInfo.chainId}`);

    // Get current block number
    const blockNumber = await sdk.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);

    // Create a new account
    const account = sdk.createAccount();
    console.log(`Created account: ${account.address}`);

    // Get account balance
    const balance = await sdk.getBalance(account.address);
    console.log(`Account balance: ${balance.toString()}`);

    console.log('✓ Basic operations completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
main();