const { SelendraSDK } = require('@selendrajs/sdk');

async function main() {
  console.log('🚀 Selendra SDK Basic Usage Example');
  console.log('===================================');
  
  // Initialize SDK
  const sdk = new SelendraSDK({
    network: 'testnet',
    rpcUrl: 'https://rpc-testnet.selendra.org',
    wsUrl: 'wss://rpc-testnet.selendra.org:9944'
  });
  
  console.log('✅ SDK initialized successfully');
  console.log('Network:', sdk.config.network);
  console.log('RPC URL:', sdk.config.rpcUrl);
  
  // Utility functions
  console.log('\n📐 Utility Functions');
  console.log('-------------------');
  
  const etherAmount = '1.5';
  const weiAmount = sdk.utils.parseEther(etherAmount);
  console.log(`${etherAmount} ETH = ${weiAmount.toString()} wei`);
  
  const formattedAmount = sdk.utils.formatEther(weiAmount);
  console.log(`${weiAmount.toString()} wei = ${formattedAmount} ETH`);
  
  const testAddress = '0x742d35Cc6634C0532925a3b8D42C25F93c68c46f';
  console.log(`Is "${testAddress}" a valid address?`, sdk.utils.isAddress(testAddress));
  
  const message = 'Hello, Selendra!';
  const hash = sdk.utils.keccak256(message);
  console.log(`Keccak256 of "${message}":`, hash);
  
  // Wallet detection
  console.log('\n👛 Wallet Detection');
  console.log('------------------');
  
  const availableWallets = sdk.wallet.detectWallets();
  console.log('Available wallets:', availableWallets);
  
  // EVM examples (mock data since we don't have real connections)
  console.log('\n⚡ EVM Examples');
  console.log('---------------');
  
  try {
    // This would work with a real connection
    // const balance = await sdk.evm.getBalance(testAddress);
    // console.log(`Balance of ${testAddress}:`, balance, 'SEL');
    
    console.log('EVM client initialized and ready for use');
    console.log('- Get balance: sdk.evm.getBalance(address)');
    console.log('- Send transaction: sdk.evm.sendTransaction(tx)');
    console.log('- Create contract: sdk.evm.contract(address, abi)');
    
  } catch (error) {
    console.log('Note: EVM operations require active network connection');
  }
  
  // WASM examples
  console.log('\n🕸️  WASM Examples');
  console.log('----------------');
  
  try {
    // This would work with a real connection
    // await sdk.wasm.connect();
    // const wasmBalance = await sdk.wasm.getBalance(testAddress);
    // console.log(`WASM balance of ${testAddress}:`, wasmBalance, 'SEL');
    
    console.log('WASM client initialized and ready for use');
    console.log('- Connect: await sdk.wasm.connect()');
    console.log('- Get balance: sdk.wasm.getBalance(address)');
    console.log('- Transfer: sdk.wasm.transfer(from, to, amount)');
    console.log('- Create contract: sdk.wasm.contract(address, abi)');
    
  } catch (error) {
    console.log('Note: WASM operations require active WebSocket connection');
  }
  
  // Network configuration
  console.log('\n🌐 Network Configuration');
  console.log('------------------------');
  
  const testnetConfig = sdk.getNetworkConfig('testnet');
  console.log('Testnet config:', testnetConfig);
  
  const mainnetConfig = sdk.getNetworkConfig('mainnet');
  console.log('Mainnet config:', mainnetConfig);
  
  // Cross-VM compatibility
  console.log('\n🔗 Cross-VM Compatibility');
  console.log('-------------------------');
  
  console.log('The SDK supports both EVM and WASM smart contracts');
  console.log('- EVM: Compatible with Ethereum tooling (MetaMask, ethers.js)');
  console.log('- WASM: Native Substrate contracts with ink! framework');
  console.log('- Unified API for seamless multi-VM development');
  
  console.log('\n✨ Example completed successfully!');
  console.log('Visit https://docs.selendra.org for more examples and documentation.');
}

main().catch(console.error);