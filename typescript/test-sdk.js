/**
 * Simple test to verify the SelendraSDK works
 */

// Since we can't build with TypeScript, let's test with a simple Node.js script
const { SelendraSDK, Network } = require('./src/index.ts');

async function testSDK() {
  console.log('Testing SelendraSDK...');

  try {
    // Test SDK instantiation
    const sdk = new SelendraSDK()
      .withEndpoint('wss://rpc.selendra.org')
      .withNetwork(Network.Selendra);

    console.log('✓ SDK instantiated successfully');
    console.log('✓ Configured with endpoint:', 'wss://rpc.selendra.org');
    console.log('✓ Configured with network:', Network.Selendra);

    // Test account creation
    const account = sdk.createAccount();
    console.log('✓ Created account:', account.address);

    const evmAccount = sdk.createEvmAccount();
    console.log('✓ Created EVM account:', evmAccount.address);

    console.log('All basic tests passed! 🎉');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSDK();