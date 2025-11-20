/**
 * Substrate Basic Operations Example
 * Demonstrates account queries, balance checks, and transfers
 */

import { SelendraSDK, ChainType } from '../src';

async function main() {
  // Initialize SDK for Substrate
  const sdk = new SelendraSDK({
    endpoint: 'wss://rpc-testnet.selendra.org',
    chainType: ChainType.Substrate,
    network: 'testnet',
  });

  console.log('🔗 Connecting to Selendra...');
  await sdk.connect();
  console.log('✅ Connected');

  // Example address (Alice on testnet)
  const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

  // Query account information
  console.log('\n📊 Account Information:');
  const account = await sdk.getAccount(address);
  console.log('  Address:', account.address);
  console.log('  Balance:', account.balance);
  console.log('  Nonce:', account.nonce);
  console.log('  Type:', account.type);
  console.log('  Active:', account.isActive);

  // Query balance details
  console.log('\n💰 Balance Details:');
  const balance = await sdk.getBalance(address);
  console.log('  Total:', balance.total);
  console.log('  Free:', balance.free);
  console.log('  Reserved:', balance.reserved);
  console.log('  Symbol:', balance.symbol);
  console.log('  Decimals:', balance.decimals);

  // Example: Submit transaction (COMMENTED OUT - requires signing)
  /*
  const transaction = {
    signer: '//Alice', // Seed phrase or private key
    to: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    amount: '1000000000000000000', // 1 SEL in planck units
  };

  console.log('\n📤 Submitting transaction...');
  const txInfo = await sdk.submitTransaction(transaction, {
    waitForFinality: true,
  });
  console.log('✅ Transaction finalized');
  console.log('  Hash:', txInfo.hash);
  console.log('  Block:', txInfo.blockHash);
  */

  // Disconnect
  await sdk.disconnect();
  console.log('\n👋 Disconnected');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
