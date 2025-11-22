/**
 * Example 01: Native SEL Token Transfer
 * 
 * This example demonstrates how to send native SEL tokens from one address to another
 * on the Selendra EVM chain.
 * 
 * Run: npm run example:transfer:native
 */

import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';

async function main() {
  console.log('=== Native SEL Transfer Example ===\n');

  // Replace with your actual private key (NEVER commit this!)
  const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  // Recipient address
  const RECIPIENT = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  // Amount to send (in SEL)
  const AMOUNT = '0.001';

  try {
    // Create and connect to Selendra EVM
    const sdk = await createSDK({
      chainType: ChainType.EVM,
      endpoint: 'https://rpc.selendra.org',
      network: 'selendra',
      debug: true
    });

    console.log('✅ Connected to Selendra EVM\n');

    // Get sender address from private key
    const { ethers } = await import('ethers');
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const senderAddress = wallet.address;

    console.log('Sender:', senderAddress);
    console.log('Recipient:', RECIPIENT);
    console.log('Amount:', AMOUNT, 'SEL\n');

    // Check sender balance before transfer
    const balanceBefore = await sdk.getFormattedBalance(senderAddress);
    console.log('Sender balance before:', balanceBefore.toFixed(4), 'SEL\n');

    if (balanceBefore < parseFloat(AMOUNT)) {
      console.error('❌ Insufficient balance for transfer');
      await sdk.destroy();
      process.exit(1);
    }

    // Send transfer
    console.log('Sending transfer...');
    const txHash = await sdk.sendTransfer(PRIVATE_KEY, RECIPIENT, AMOUNT);
    
    console.log('\n✅ Transfer successful!');
    console.log('Transaction hash:', txHash);

    // Check balance after transfer
    const balanceAfter = await sdk.getFormattedBalance(senderAddress);
    console.log('\nSender balance after:', balanceAfter.toFixed(4), 'SEL');
    console.log('Amount sent:', (balanceBefore - balanceAfter).toFixed(4), 'SEL (including gas)');

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
