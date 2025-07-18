import { SelendraSDK } from '../src';

async function basicExample() {
  // Initialize SDK
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    // Initialize connections
    await sdk.initialize();
    console.log('SDK initialized successfully');

    // Get network status
    const status = await sdk.getNetworkStatus();
    console.log('Network Status:', status);

    // Connect wallet (MetaMask)
    const connection = await sdk.connectWallet('metamask');
    console.log('Wallet connected:', connection.address);

    // Get account balance (EVM)
    const evmBalance = await sdk.evm.getFormattedBalance();
    console.log('EVM Balance:', evmBalance, 'SEL');

    // Get current block number
    const blockNumber = await sdk.evm.getBlockNumber();
    console.log('Current Block:', blockNumber);

    // Get gas prices
    const gasPrices = await sdk.evm.getGasPrices();
    console.log('Gas Prices:', gasPrices);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Cleanup
    await sdk.disconnect();
  }
}

// Run example
basicExample().catch(console.error);