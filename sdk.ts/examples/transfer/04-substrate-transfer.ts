/**
 * Example 01: Substrate Native Transfer
 * 
 * This example demonstrates how to transfer native SEL tokens on the Substrate chain.
 * 
 * Run: npm run transfer:substrate
 */

import 'dotenv/config';
import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  console.log('=== Substrate Native Transfer Example ===\n');

  // Wait for crypto to be ready
  await cryptoWaitReady();

  // Create keyring
  const keyring = new Keyring({ type: 'sr25519' });
  
  // Get private key or seed from environment
  // Priority: SUBSTRATE_PRIVATE_KEY > SENDER_URI
  const substrateKey = process.env.SUBSTRATE_PRIVATE_KEY;
  const senderUri = process.env.SENDER_URI || '//Alice';
  
  let sender;
  if (substrateKey && substrateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    // Use private key (remove 0x prefix if present)
    const cleanKey = substrateKey.startsWith('0x') ? substrateKey.slice(2) : substrateKey;
    sender = keyring.addFromSeed(Buffer.from(cleanKey, 'hex'));
    console.log('Using private key from SUBSTRATE_PRIVATE_KEY\n');
  } else {
    // Use seed phrase or derivation path
    sender = keyring.addFromUri(senderUri);
    console.log('Using seed/URI from SENDER_URI:', senderUri, '\n');
  }
  
  const RECIPIENT = process.env.SUB_ADDRESS_1 || '5GYpxi1Gq4VP5631a1TbmjtpJ2wmPGAw4PaE83r2Sp9585Qb';
  
  // Amount in planck (1 SEL = 10^18 planck)
  const AMOUNT = '1000000000000000000'; // 1 SEL

  try {
    // Display transaction details
    console.log('Sender:', sender.address);
    console.log('Recipient:', RECIPIENT);
    console.log('Amount:', AMOUNT, 'planck (1 SEL)\n');

    // Create and connect to Selendra Substrate
    const endpoint = process.env.SELENDRA_WS_URL || 'wss://rpc-testnet.selendra.org';
    const sdk = createSDK({
      chainType: ChainType.Substrate,
      endpoint: endpoint,
      network: 'selendra-testnet',
      debug: true
    });

    await sdk.connect();
    console.log('✅ Connected to Selendra Substrate\n');

    // Check sender balance before transfer
    const balanceBefore = await sdk.getBalance(sender.address);
    console.log('Sender balance before:', balanceBefore.toString(), 'planck');
    console.log('                      ', (Number(balanceBefore) / 1e18).toFixed(4), 'SEL\n');

    if (BigInt(balanceBefore) < BigInt(AMOUNT)) {
      console.error('❌ Insufficient balance for transfer');
      await sdk.destroy();
      process.exit(1);
    }

    // Send transfer (waits for finalization)
    console.log('Sending transfer...');
    console.log('This will wait for transaction finalization (may take 12-60 seconds)...\n');
    
    const txHash = await sdk.sendTransfer(sender, RECIPIENT, AMOUNT);
    
    console.log('✅ Transfer finalized!');
    console.log('Transaction hash:', txHash);

    // Check balances after transfer
    const balanceAfter = await sdk.getBalance(sender.address);
    const recipientBalance = await sdk.getBalance(RECIPIENT);
    
    console.log('\nSender balance after:', balanceAfter.toString(), 'planck');
    console.log('                     ', (Number(balanceAfter) / 1e18).toFixed(4), 'SEL');
    console.log('Recipient balance:', recipientBalance.toString(), 'planck');
    console.log('                 ', (Number(recipientBalance) / 1e18).toFixed(4), 'SEL');
    
    const spent = BigInt(balanceBefore) - BigInt(balanceAfter);
    console.log('\nTotal spent:', spent.toString(), 'planck (including fees)');
    console.log('           ', (Number(spent) / 1e18).toFixed(6), 'SEL');

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
