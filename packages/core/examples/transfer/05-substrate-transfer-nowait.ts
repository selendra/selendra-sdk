/**
 * Example 02: Substrate Transfer (No Wait)
 * 
 * This example demonstrates how to send a transfer without waiting for finalization.
 * Useful for batch operations or when you don't need immediate confirmation.
 * 
 * Run: npm run transfer:substrate-nowait
 */

import 'dotenv/config';
import { createSDK } from '@selendrajs/sdk';
import { ChainType } from '@selendrajs/sdk/types';
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  console.log('=== Substrate Transfer (No Wait) Example ===\n');

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
  const AMOUNT = '500000000000000000'; // 0.5 SEL

  try {
    console.log('Sender:', sender.address);
    console.log('Recipient:', RECIPIENT);
    console.log('Amount:', AMOUNT, 'planck (0.5 SEL)\n');

    const endpoint = process.env.SELENDRA_WS_URL || 'wss://rpc-testnet.selendra.org';
    const sdk = createSDK({
      chainType: ChainType.Substrate,
      endpoint: endpoint,
      network: 'selendra-testnet',
      debug: true
    });

    await sdk.connect();
    console.log('✅ Connected to Selendra Substrate\n');

    // Check balance
    const balanceBefore = await sdk.getBalance(sender.address);
    console.log('Sender balance:', (Number(balanceBefore) / 1e18).toFixed(4), 'SEL\n');

    if (BigInt(balanceBefore) < BigInt(AMOUNT)) {
      console.error('❌ Insufficient balance');
      await sdk.destroy();
      process.exit(1);
    }

    // Send transfer without waiting for finalization
    console.log('Sending transfer (no wait)...');
    const txHash = await sdk.sendTransferNoWait(sender, RECIPIENT, AMOUNT);
    
    console.log('\n✅ Transfer submitted!');
    console.log('Transaction hash:', txHash);
    console.log('\nNote: Transaction is submitted but not yet finalized.');
    console.log('It will be included in a block shortly.');

    // You can continue with other operations immediately
    console.log('\nYou can now perform other operations without waiting...');

    // Cleanup
    await sdk.destroy();
    console.log('\n✅ Example completed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
