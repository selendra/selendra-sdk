/**
 * Example 02: Block Monitoring
 * 
 * This example demonstrates how to monitor new blocks in real-time.
 * 
 * Run: npm run block:monitor
 */

import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';

async function monitorEvmBlocks(duration: number = 30000) {
  console.log('=== EVM Block Monitoring ===\n');

  const sdk = createSDK({
    chainType: ChainType.EVM,
    endpoint: 'https://rpc.selendra.org',
    network: 'selendra',
    debug: false
  });

  await sdk.connect();
  console.log('✅ Connected to Selendra EVM');
  console.log(`Monitoring blocks for ${duration / 1000} seconds...\n`);

  let blockCount = 0;
  let lastBlockNumber = 0;

  const interval = setInterval(async () => {
    try {
      const block = await sdk.getCurrentBlock();
      
      if (block.number > lastBlockNumber) {
        blockCount++;
        lastBlockNumber = block.number;
        
        console.log(`Block #${block.number}`);
        console.log(`  Hash: ${block.hash}`);
        console.log(`  Timestamp: ${new Date(block.timestamp * 1000).toLocaleTimeString()}`);
        console.log(`  Transactions: ${block.transactions?.length || 0}`);
        console.log(`  Gas Used: ${block.gasUsed} / ${block.gasLimit}`);
        console.log('');
      }
    } catch (error) {
      console.error('Error fetching block:', error instanceof Error ? error.message : error);
    }
  }, 3000); // Check every 3 seconds

  // Stop after duration
  setTimeout(async () => {
    clearInterval(interval);
    console.log(`\nMonitoring stopped. Saw ${blockCount} new blocks.`);
    await sdk.destroy();
    process.exit(0);
  }, duration);
}

async function monitorSubstrateBlocks(duration: number = 30000) {
  console.log('=== Substrate Block Monitoring ===\n');

  const sdk = createSDK({
    chainType: ChainType.Substrate,
    endpoint: 'wss://rpc.selendra.org',
    network: 'selendra',
    debug: false
  });

  await sdk.connect();
  console.log('✅ Connected to Selendra Substrate');
  console.log(`Monitoring blocks for ${duration / 1000} seconds...\n`);

  let blockCount = 0;
  let lastBlockNumber = 0;

  const interval = setInterval(async () => {
    try {
      const block = await sdk.getCurrentBlock();
      
      if (block.number > lastBlockNumber) {
        blockCount++;
        lastBlockNumber = block.number;
        
        console.log(`Block #${block.number}`);
        console.log(`  Hash: ${block.hash}`);
        console.log(`  Parent: ${block.parentHash}`);
        console.log('');
      }
    } catch (error) {
      console.error('Error fetching block:', error instanceof Error ? error.message : error);
    }
  }, 6000); // Check every 6 seconds (Substrate blocks are typically slower)

  // Stop after duration
  setTimeout(async () => {
    clearInterval(interval);
    console.log(`\nMonitoring stopped. Saw ${blockCount} new blocks.`);
    await sdk.destroy();
    process.exit(0);
  }, duration);
}

async function main() {
  const chainType = process.env.CHAIN_TYPE || 'evm';
  const duration = parseInt(process.env.DURATION || '30000');

  if (chainType.toLowerCase() === 'substrate') {
    await monitorSubstrateBlocks(duration);
  } else {
    await monitorEvmBlocks(duration);
  }
}

main();
