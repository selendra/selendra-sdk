/**
 * Example 02: ERC20 Token Transfer
 * 
 * This example demonstrates how to transfer ERC20 tokens using a custom contract address.
 * You can use this with any ERC20-compliant token on the Selendra network.
 * 
 * Run: npm run example:transfer:erc20
 */

import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';

async function main() {
  console.log('=== ERC20 Token Transfer Example ===\n');

  // Replace with your actual values
  const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
  const TOKEN_CONTRACT = process.env.TOKEN_CONTRACT || '0x0000000000000000000000000000000000000000'; // Replace with actual ERC20 contract
  const RECIPIENT = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const AMOUNT = '10'; // Amount in token units (will be converted based on decimals)

  try {
    // Create and connect to Selendra EVM
    const sdk = await createSDK({
      chainType: ChainType.EVM,
      endpoint: 'https://rpc.selendra.org',
      network: 'selendra',
      debug: true
    });

    console.log('✅ Connected to Selendra EVM\n');

    // Get sender address
    const { ethers } = await import('ethers');
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const senderAddress = wallet.address;

    console.log('Sender:', senderAddress);
    console.log('Recipient:', RECIPIENT);
    console.log('Token Contract:', TOKEN_CONTRACT, '\n');

    // Get token information
    console.log('Fetching token information...');
    const tokenInfo = await sdk.getERC20Info(TOKEN_CONTRACT);
    
    console.log('Token:', tokenInfo.name);
    console.log('Symbol:', tokenInfo.symbol);
    console.log('Decimals:', tokenInfo.decimals);
    console.log('Amount to send:', AMOUNT, tokenInfo.symbol, '\n');

    // Check sender's token balance
    const balanceBefore = await sdk.getERC20Balance(TOKEN_CONTRACT, senderAddress);
    const balanceFormatted = Number(balanceBefore) / Math.pow(10, tokenInfo.decimals);
    
    console.log('Sender token balance:', balanceFormatted, tokenInfo.symbol, '\n');

    if (balanceFormatted < parseFloat(AMOUNT)) {
      console.error('❌ Insufficient token balance');
      await sdk.destroy();
      process.exit(1);
    }

    // Send ERC20 transfer
    console.log('Sending ERC20 transfer...');
    const txHash = await sdk.sendERC20Transfer(
      PRIVATE_KEY,
      TOKEN_CONTRACT,
      RECIPIENT,
      AMOUNT,
      tokenInfo.decimals
    );
    
    console.log('\n✅ Transfer successful!');
    console.log('Transaction hash:', txHash);

    // Check balance after transfer
    const balanceAfter = await sdk.getERC20Balance(TOKEN_CONTRACT, senderAddress);
    const balanceAfterFormatted = Number(balanceAfter) / Math.pow(10, tokenInfo.decimals);
    
    console.log('\nSender balance after:', balanceAfterFormatted, tokenInfo.symbol);
    console.log('Amount sent:', (balanceFormatted - balanceAfterFormatted).toFixed(4), tokenInfo.symbol);

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
