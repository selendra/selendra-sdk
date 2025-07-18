import { SelendraSDK } from '../src';
import { mnemonicGenerate } from '@polkadot/util-crypto';

async function substrateExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();

    // Generate a test account
    const mnemonic = mnemonicGenerate();
    console.log('Generated mnemonic:', mnemonic);
    
    const account = sdk.substrate.createAccountFromMnemonic(mnemonic);
    console.log('Account address:', account.address);

    // Get chain information
    const chainInfo = await sdk.substrate.getChainInfo();
    console.log('Chain Info:', chainInfo);

    // Get runtime version
    const runtimeVersion = await sdk.substrate.getRuntimeVersion();
    console.log('Runtime Version:', runtimeVersion);

    // Get current block number
    const blockNumber = await sdk.substrate.getBlockNumber();
    console.log('Current Block Number:', blockNumber);

    // Get account information
    const accountInfo = await sdk.substrate.getAccount(account.address);
    console.log('Account Info:', accountInfo);

    // Get formatted balance
    const balance = await sdk.substrate.getFormattedBalance(account.address);
    console.log('Account Balance:', balance, 'SEL');

    // Example: Subscribe to new blocks
    console.log('Subscribing to new blocks for 30 seconds...');
    const unsubscribeBlocks = await sdk.substrate.subscribeToBlocks((blockNumber) => {
      console.log('New block:', blockNumber);
    });

    // Example: Subscribe to balance changes
    const unsubscribeBalance = await sdk.substrate.subscribeToBalance(
      account.address,
      (balance) => {
        console.log('Balance updated:', balance);
      }
    );

    // Wait for 30 seconds to see some blocks
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Unsubscribe
    unsubscribeBlocks();
    unsubscribeBalance();

    console.log('Unsubscribed from events');

    // Get network properties
    const networkProps = await sdk.substrate.getNetworkProperties();
    console.log('Network Properties:', networkProps);

    // Get validators (if available)
    try {
      const validators = await sdk.substrate.getValidators();
      console.log('Number of validators:', validators.length);
    } catch (error) {
      console.log('Validators info not available:', error.message);
    }

  } catch (error) {
    console.error('Substrate interaction failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

substrateExample().catch(console.error);