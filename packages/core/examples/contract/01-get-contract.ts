/**
 * Example 01: Get Contract Instance
 * 
 * This example demonstrates how to get a contract instance using custom ABI.
 * 
 * Run: npm run contract:get
 */

import 'dotenv/config';
import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';

// ERC20 ABI for demonstration
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

async function main() {
  console.log('=== Get Contract Instance Example ===\n');

  // Get contract address from environment
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
  const ACCOUNT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  try {
    // Create and connect to Selendra EVM
    const sdk = createSDK({
      chainType: ChainType.EVM,
      endpoint: 'https://rpc-testnet.selendra.org',
      network: 'selendra-testnet',
      debug: true
    });

    await sdk.connect();
    console.log('✅ Connected to Selendra EVM\n');
    console.log('Contract Address:', CONTRACT_ADDRESS, '\n');

    // Get contract instance with full ABI
    console.log('Getting contract instance...');
    const contract = await sdk.getContract(CONTRACT_ADDRESS, ERC20_ABI);
    console.log('✅ Contract instance created\n');

    // Read contract information
    console.log('--- Contract Information ---');
    
    try {
      const name = await contract.name();
      console.log('Name:', name);
    } catch (e) {
      console.log('Name: Not available (contract may not exist or not implement ERC20)');
    }

    try {
      const symbol = await contract.symbol();
      console.log('Symbol:', symbol);
    } catch (e) {
      console.log('Symbol: Not available');
    }

    try {
      const decimals = await contract.decimals();
      console.log('Decimals:', decimals.toString());
    } catch (e) {
      console.log('Decimals: Not available');
    }

    try {
      const totalSupply = await contract.totalSupply();
      console.log('Total Supply:', totalSupply.toString());
    } catch (e) {
      console.log('Total Supply: Not available');
    }

    // Check balance of an account
    console.log('\n--- Account Balance ---');
    console.log('Account:', ACCOUNT_ADDRESS);
    
    try {
      const balance = await contract.balanceOf(ACCOUNT_ADDRESS);
      console.log('Balance:', balance.toString());
    } catch (e) {
      console.log('Balance: Not available');
    }

    // Example: Check allowance
    console.log('\n--- Allowance Example ---');
    const SPENDER_ADDRESS = '0x0000000000000000000000000000000000000001';
    
    try {
      const allowance = await contract.allowance(ACCOUNT_ADDRESS, SPENDER_ADDRESS);
      console.log(`Allowance for ${SPENDER_ADDRESS}:`, allowance.toString());
    } catch (e) {
      console.log('Allowance: Not available');
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
