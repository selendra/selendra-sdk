/**
 * Example 03: Substrate Transfer All
 * 
 * This example demonstrates how to transfer all available balance
 * while keeping the account alive (leaves existential deposit).
 * 
 * Run: npm run transfer:substrate-all
 */

import 'dotenv/config';
import { createSDK } from '@selendrajs/sdk-core';
import { ChainType } from '@selendrajs/sdk-core/types';
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  console.log('=== Substrate Transfer All Example ===\n');

  await cryptoWaitReady();

  const keyring = new Keyring({ type: 'sr25519' });
  
  // Get private key or seed from environment
  const substrateKey = process.env.SUBSTRATE_PRIVATE_KEY;
  const senderUri = process.env.SENDER_URI || '//Alice';
  
  let sender;
  if (substrateKey && substrateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    const cleanKey = substrateKey.startsWith('0x') ? substrateKey.slice(2) : substrateKey;
    sender = keyring.addFromSeed(Buffer.from(cleanKey, 'hex'));
    console.log('Using private key from SUBSTRATE_PRIVATE_KEY\n');
  } else {
    sender = keyring.addFromUri(senderUri);
    console.log('Using seed/URI from SENDER_URI:', senderUri, '\n');
  }
  
  const RECIPIENT = process.env.SUB_ADDRESS_1 || '5GYpxi1Gq4VP5631a1TbmjtpJ2wmPGAw4PaE83r2Sp9585Qb';

  try {
    console.log('Sender:', sender.address);
    console.log('Recipient:', RECIPIENT);
    console.log('Action: Transfer all available balance\n');

    const endpoint = process.env.SELENDRA_WS_URL || 'wss://rpc-testnet.selendra.org';
    const sdk = createSDK({
      chainType: ChainType.Substrate,
      endpoint: endpoint,
      network: 'selendra-testnet',
      debug: true
    });

    await sdk.connect();
    console.log('✅ Connected to Selendra Substrate\n');

    // Check balance before
    const balanceBefore = await sdk.getBalance(sender.address);
    console.log('Sender balance before:', (Number(balanceBefore) / 1e18).toFixed(6), 'SEL');

    if (BigInt(balanceBefore) === 0n) {
      console.error('❌ No balance to transfer');
      await sdk.destroy();
      process.exit(1);
    }

    // Warning
    console.log('\n⚠️  WARNING: This will transfer ALL available balance!');
    console.log('The account will be left with only the existential deposit.\n');

    // Transfer all
    console.log('Transferring all balance...');
    console.log('This will wait for finalization...\n');
    
    const txHash = await sdk.transferAll(sender, RECIPIENT);
    
    console.log('✅ Transfer all completed!');
    console.log('Transaction hash:', txHash);

    // Check balances after
    const balanceAfter = await sdk.getBalance(sender.address);
    const recipientBalance = await sdk.getBalance(RECIPIENT);
    
    console.log('\nSender balance after:', (Number(balanceAfter) / 1e18).toFixed(6), 'SEL');
    console.log('Recipient balance:', (Number(recipientBalance) / 1e18).toFixed(6), 'SEL');
    
    const transferred = BigInt(balanceBefore) - BigInt(balanceAfter);
    console.log('\nAmount transferred:', (Number(transferred) / 1e18).toFixed(6), 'SEL');

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
