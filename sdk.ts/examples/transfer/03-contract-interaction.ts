/**
 * Example 03: Custom Contract Interaction
 * 
 * This example demonstrates how to interact with custom smart contracts
 * by calling contract functions with custom ABI.
 * 
 * Run: npm run example:transfer:contract
 */

import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';

// Example: Simple storage contract ABI
const STORAGE_CONTRACT_ABI = [
  'function set(uint256 value) public',
  'function get() public view returns (uint256)',
  'function increment() public',
  'function owner() public view returns (address)'
];

// Example: DEX swap contract ABI
const DEX_CONTRACT_ABI = [
  'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin) public payable returns (uint256)',
  'function getReserves(address tokenA, address tokenB) public view returns (uint256, uint256)',
  'function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) public view returns (uint256)'
];

async function main() {
  console.log('=== Custom Contract Interaction Example ===\n');

  const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

  try {
    // Create and connect to Selendra EVM
    const sdk = await createSDK({
      chainType: ChainType.EVM,
      endpoint: 'https://rpc.selendra.org',
      network: 'selendra',
      debug: true
    });

    console.log('✅ Connected to Selendra EVM\n');

    // Get wallet address
    const { ethers } = await import('ethers');
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const walletAddress = wallet.address;

    console.log('Wallet:', walletAddress);
    console.log('Contract:', CONTRACT_ADDRESS, '\n');

    // Example 1: Read-only contract call (no gas cost)
    console.log('--- Example 1: Read-Only Call ---');
    console.log('Calling get() function...');
    
    try {
      const currentValue = await sdk.callContractFunction(
        CONTRACT_ADDRESS,
        STORAGE_CONTRACT_ABI,
        'get',
        []
      );
      console.log('Current stored value:', currentValue.toString());
    } catch (error) {
      console.log('Note: Contract must exist and implement get() function');
    }

    // Example 2: Write transaction (costs gas)
    console.log('\n--- Example 2: Write Transaction ---');
    console.log('Calling set(42)...');
    
    try {
      const txHash = await sdk.executeContractTransaction(
        PRIVATE_KEY,
        CONTRACT_ADDRESS,
        STORAGE_CONTRACT_ABI,
        'set',
        [42] // Set value to 42
      );
      console.log('✅ Transaction successful!');
      console.log('Transaction hash:', txHash);

      // Verify the new value
      const newValue = await sdk.callContractFunction(
        CONTRACT_ADDRESS,
        STORAGE_CONTRACT_ABI,
        'get',
        []
      );
      console.log('New stored value:', newValue.toString());
    } catch (error) {
      console.log('Note: Contract must exist and implement set() function');
    }

    // Example 3: Transaction with native token value
    console.log('\n--- Example 3: Transaction with Value ---');
    console.log('Calling swap() with 0.1 SEL...');
    
    try {
      const txHash = await sdk.executeContractTransaction(
        PRIVATE_KEY,
        CONTRACT_ADDRESS,
        DEX_CONTRACT_ABI,
        'swap',
        [
          '0x0000000000000000000000000000000000000000', // tokenIn (SEL)
          '0x1111111111111111111111111111111111111111', // tokenOut (example)
          ethers.parseEther('0.1').toString(), // amountIn
          '0' // amountOutMin
        ],
        '0.1' // Send 0.1 SEL with transaction
      );
      console.log('✅ Swap successful!');
      console.log('Transaction hash:', txHash);
    } catch (error) {
      console.log('Note: DEX contract must exist and have liquidity');
    }

    // Example 4: Reading contract state with parameters
    console.log('\n--- Example 4: Read with Parameters ---');
    console.log('Calling getReserves()...');
    
    try {
      const reserves = await sdk.callContractFunction(
        CONTRACT_ADDRESS,
        DEX_CONTRACT_ABI,
        'getReserves',
        [
          '0x0000000000000000000000000000000000000000',
          '0x1111111111111111111111111111111111111111'
        ]
      );
      console.log('Reserves:', reserves);
    } catch (error) {
      console.log('Note: DEX contract must exist');
    }

    // Cleanup
    await sdk.destroy();
    console.log('\n✅ Example completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
