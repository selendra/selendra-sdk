import { SelendraSDK } from '../src';

async function multiChainExample() {
  // Initialize SDKs for both mainnet and testnet
  const mainnetSDK = new SelendraSDK({
    network: 'mainnet'
  });

  const testnetSDK = new SelendraSDK({
    network: 'testnet'
  });

  try {
    // Initialize both SDKs
    await Promise.all([
      mainnetSDK.initialize(),
      testnetSDK.initialize()
    ]);

    console.log('✅ Both networks initialized');

    // Compare network status
    const [mainnetStatus, testnetStatus] = await Promise.all([
      mainnetSDK.getNetworkStatus(),
      testnetSDK.getNetworkStatus()
    ]);

    console.log('\n📊 === Network Comparison ===');
    console.log('Mainnet:', {
      chainId: mainnetStatus.chainId,
      blockNumber: mainnetStatus.blockNumber,
      validators: mainnetStatus.networkStats.validators
    });

    console.log('Testnet:', {
      chainId: testnetStatus.chainId,
      blockNumber: testnetStatus.blockNumber,
      validators: testnetStatus.networkStats.validators
    });

    // Example: Cross-chain balance check
    await crossChainBalanceCheck(mainnetSDK, testnetSDK);

    // Example: Monitor both networks simultaneously
    await monitorBothNetworks(mainnetSDK, testnetSDK);

  } catch (error) {
    console.error('Multi-chain example failed:', error);
  } finally {
    await Promise.all([
      mainnetSDK.disconnect(),
      testnetSDK.disconnect()
    ]);
  }
}

async function crossChainBalanceCheck(mainnetSDK: SelendraSDK, testnetSDK: SelendraSDK) {
  console.log('\n💰 === Cross-Chain Balance Check ===');
  
  const address = '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe';

  try {
    const [mainnetInfo, testnetInfo] = await Promise.all([
      mainnetSDK.getAccountInfo(address),
      testnetSDK.getAccountInfo(address)
    ]);

    console.log(`Address: ${address}`);
    console.log('Mainnet Balance:', mainnetInfo.evm.balance || 'N/A');
    console.log('Testnet Balance:', testnetInfo.evm.balance || 'N/A');

    // Calculate total balance across networks
    const mainnetBalance = parseFloat(mainnetInfo.evm.balance || '0');
    const testnetBalance = parseFloat(testnetInfo.evm.balance || '0');
    const totalBalance = mainnetBalance + testnetBalance;

    console.log(`Total Balance Across Networks: ${totalBalance.toFixed(4)} SEL`);

  } catch (error) {
    console.error('Cross-chain balance check failed:', error);
  }
}

async function monitorBothNetworks(mainnetSDK: SelendraSDK, testnetSDK: SelendraSDK) {
  console.log('\n🔍 === Monitoring Both Networks ===');
  
  try {
    // Subscribe to blocks on both networks
    const mainnetSubscribe = await mainnetSDK.subscribe();
    const testnetSubscribe = await testnetSDK.subscribe();

    const mainnetBlockSub = await mainnetSubscribe.blocks((block) => {
      console.log('🟢 Mainnet Block:', block.number, 'Hash:', block.hash?.slice(0, 10) + '...');
    });

    const testnetBlockSub = await testnetSubscribe.blocks((block) => {
      console.log('🟡 Testnet Block:', block.number, 'Hash:', block.hash?.slice(0, 10) + '...');
    });

    // Monitor gas prices on both networks
    const mainnetGasSub = await mainnetSubscribe.gasPrices((gasData) => {
      const gasPrice = mainnetSDK.utils.format.formatUnits(gasData.gasPrice, 9);
      console.log('🟢 Mainnet Gas:', gasPrice, 'gwei');
    });

    const testnetGasSub = await testnetSubscribe.gasPrices((gasData) => {
      const gasPrice = testnetSDK.utils.format.formatUnits(gasData.gasPrice, 9);
      console.log('🟡 Testnet Gas:', gasPrice, 'gwei');
    });

    console.log('📡 Monitoring both networks for 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Cleanup subscriptions
    mainnetBlockSub.unsubscribe();
    testnetBlockSub.unsubscribe();
    mainnetGasSub.unsubscribe();
    testnetGasSub.unsubscribe();

    console.log('✅ Monitoring stopped');

  } catch (error) {
    console.error('Network monitoring failed:', error);
  }
}

// Cross-chain bridge example (conceptual)
async function bridgeExample(fromSDK: SelendraSDK, toSDK: SelendraSDK) {
  console.log('\n🌉 === Cross-Chain Bridge Example ===');
  
  // This is a conceptual example - actual bridge implementation would depend on
  // the specific bridge protocol being used (e.g., Polkadot bridges, custom bridge)
  
  const bridgeContractAddress = '0xBridgeContract...';
  const bridgeABI = [
    'function lockTokens(uint256 amount, uint256 targetChainId, address recipient) external',
    'function unlockTokens(bytes32 lockHash, uint256 amount, address recipient) external'
  ];

  try {
    const bridge = fromSDK.evm.contract(bridgeContractAddress, bridgeABI);
    
    const amount = fromSDK.utils.format.parseEther('10');
    const targetChainId = toSDK.getNetworkConfig().chainId;
    const recipient = '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe';

    console.log(`Bridging 10 SEL from chain ${fromSDK.getNetworkConfig().chainId} to ${targetChainId}`);

    // Lock tokens on source chain
    const lockTx = await bridge.write('lockTokens', [amount, targetChainId, recipient]);
    console.log('Lock transaction:', lockTx);
    
    const lockReceipt = await fromSDK.evm.waitForTransaction(lockTx);
    console.log('✅ Tokens locked on source chain');

    // In a real bridge, you would:
    // 1. Wait for confirmations
    // 2. Submit proof to target chain
    // 3. Unlock tokens on target chain

    console.log('🔄 Bridge transfer initiated (proof submission would happen here)');

  } catch (error) {
    console.error('Bridge example failed:', error);
  }
}

multiChainExample().catch(console.error);