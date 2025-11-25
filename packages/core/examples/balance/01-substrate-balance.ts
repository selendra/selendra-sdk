/**
 * Example: Check Balance - Substrate
 * 
 * Demonstrates how to check account balance on Selendra Substrate chain
 */

import 'dotenv/config';
import { SelendraSDK, ChainType } from '@selendrajs/sdk';
import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function checkSubstrateBalance() {
  console.log('📝 Check Substrate Balance Example\n');

  const sdk = new SelendraSDK({
    endpoint: 'wss://rpc-testnet.selendra.org',
    chainType: ChainType.Substrate,
  });

  try {
    await sdk.connect();
    console.log('✅ Connected to Selendra Substrate\n');

    // Get addresses to check
    const addresses: string[] = [];
    
    // Check balance for account from SUBSTRATE_PRIVATE_KEY
    const substrateKey = process.env.SUBSTRATE_PRIVATE_KEY;
    if (substrateKey && substrateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      await cryptoWaitReady();
      const keyring = new Keyring({ type: 'sr25519' });
      const cleanKey = substrateKey.startsWith('0x') ? substrateKey.slice(2) : substrateKey;
      const account = keyring.addFromSeed(Buffer.from(cleanKey, 'hex'));
      addresses.push(account.address);
      console.log('🔑 Using account from SUBSTRATE_PRIVATE_KEY');
    }
    
    // Add target addresses from .env if available
    if (process.env.SUB_ADDRESS_1) {
      addresses.push(process.env.SUB_ADDRESS_1);
    }
    if (process.env.SUB_ADDRESS_2) {
      addresses.push(process.env.SUB_ADDRESS_2);
    }
    
    // Fallback to example addresses if no env vars set
    if (addresses.length === 0) {
      addresses.push('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');  // Alice
      addresses.push('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');  // Bob
    }

    for (const address of addresses) {
      console.log(`Address: ${address}`);
      
      try {
        // Get raw balance (in planck - smallest unit)
        const rawBalance = await sdk.getBalance(address);
        console.log('  Raw Balance:', rawBalance.toString(), 'planck');
        
        // Get formatted balance (in SEL)
        const formattedBalance = await sdk.getFormattedBalance(address);
        console.log('  Formatted Balance:', formattedBalance.toFixed(4), 'SEL');
      } catch (error) {
        console.log('  Error:', error instanceof Error ? error.message : String(error));
      }
      
      console.log('');
    }

    await sdk.destroy();
    console.log('✅ Example completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSubstrateBalance();
