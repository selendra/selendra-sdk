/**
 * EVM Client Usage Examples
 * Demonstrates how to use the Selendra EVM client with ethers.js v6 compatibility
 */

import {
  SelendraEvmClient,
  WebSocketProvider,
  SelendraWallet,
  TransactionBuilder,
  Contract,
  ERC20Contract,
  ContractFactory,
  EventManager,
  createEvmClient,
  createWebSocketProvider,
  etherToWei,
  weiToEther,
  formatBalance,
} from '../index';

/**
 * Example 1: Basic Client Setup
 */
export async function basicClientSetup() {
  console.log('=== Basic Client Setup ===');

  // Create client with default configuration (mainnet)
  const client = createEvmClient({
    network: 'mainnet',
    debug: true,
  });

  // Get network information
  const network = await client.getNetwork();
  console.log('Connected to:', network.name, '(Chain ID:', network.chainId, ')');

  // Get current block number
  const blockNumber = await client.getBlockNumber();
  console.log('Current block:', blockNumber);

  // Get latest block
  const latestBlock = await client.getBlock('latest');
  if (latestBlock) {
    console.log('Latest block hash:', latestBlock.hash);
    console.log('Gas limit:', latestBlock.gasLimit);
    console.log('Gas used:', latestBlock.gasUsed);
  }
}

/**
 * Example 2: Wallet Operations
 */
export async function walletOperations() {
  console.log('\n=== Wallet Operations ===');

  // Create a new random wallet
  const wallet = SelendraWallet.createRandom();
  console.log('New wallet address:', wallet.getAddress());

  // Create wallet from private key
  const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const walletFromKey = new SelendraWallet(privateKey);
  console.log('Wallet from private key:', walletFromKey.getAddress());

  // Sign a message
  const message = 'Hello Selendra EVM!';
  const signature = await walletFromKey.signMessage(message);
  console.log('Message signature:', signature);

  // Validate address format
  const isValid = walletFromKey.isAddress(wallet.getAddress());
  console.log('Address is valid:', isValid);
}

/**
 * Example 3: Transaction Management
 */
export async function transactionManagement() {
  console.log('\n=== Transaction Management ===');

  const client = createEvmClient();
  const wallet = SelendraWallet.createRandom();
  const connectedWallet = wallet.connect(client);

  // Build a simple transfer transaction
  const txBuilder = TransactionBuilder.transfer(
    wallet.getAddress(),
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    '0.1',
  );

  const tx = txBuilder.gasLimit(21000).build();
  console.log('Built transaction:', tx);

  // Estimate gas
  const gasEstimate = await client.getTransactionManager().estimateGas(tx);
  console.log('Estimated gas:', gasEstimate.gasLimit);
  console.log('Estimated cost:', weiToEther(gasEstimate.estimatedCost), 'ETH');

  // Transaction status tracking (would normally send real transaction)
  console.log('Transaction builder created with optimal gas settings');
}

/**
 * Example 4: Contract Interaction
 */
export async function contractInteraction() {
  console.log('\n=== Contract Interaction ===');

  const client = createEvmClient();
  const wallet = SelendraWallet.createRandom();
  const connectedWallet = wallet.connect(client);

  // ERC20 Token ABI (simplified)
  const erc20ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address,uint256) returns (bool)',
    'function approve(address,uint256) returns (bool)',
    'event Transfer(address indexed from,address indexed to,uint256 value)',
    'event Approval(address indexed owner,address indexed spender,uint256 value)',
  ];

  // Create ERC20 contract instance
  const tokenAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'; // Example token address
  const tokenContract = client.getContract(tokenAddress, erc20ABI);
  const tokenERC20 = new ERC20Contract(tokenAddress, client, connectedWallet);

  try {
    // Read contract methods
    const name = await tokenContract.call('name');
    const symbol = await tokenContract.call('symbol');
    const decimals = await tokenContract.call('decimals');
    const totalSupply = await tokenContract.call('totalSupply');

    console.log('Token name:', name);
    console.log('Token symbol:', symbol);
    console.log('Token decimals:', decimals);
    console.log(
      'Total supply:',
      formatBalance(totalSupply as string, Number(decimals), symbol as string),
    );

    // Get balance
    const balance = await tokenERC20.balanceOf(wallet.getAddress());
    console.log(
      'Wallet balance:',
      formatBalance(balance as string, Number(decimals), symbol as string),
    );

    // Contract deployment example
    const contractFactory = client.getContractFactory(
      erc20ABI,
      '0x608060405234801561001057600080fd5b50',
    );
    console.log('Contract factory created for deployment');
  } catch (error) {
    console.log('Contract interaction failed (expected for example):', error);
  }
}

/**
 * Example 5: Event Management
 */
export async function eventManagement() {
  console.log('\n=== Event Management ===');

  const client = createEvmClient();
  const eventManager = new EventManager(client);

  // Create event filter for transfer events
  const transferFilter = {
    address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
    ],
  };

  try {
    // Query past events
    const queryResult = await eventManager.query(transferFilter);
    console.log('Found', queryResult.count, 'past transfer events');

    // Subscribe to new events (would work with WebSocket provider)
    if (client instanceof WebSocketProvider) {
      const subscription = await eventManager.subscribe(transferFilter, {
        maxEvents: 10,
      });

      subscription.on('data', (event) => {
        console.log('New transfer event:', event);
      });

      subscription.on('error', (error) => {
        console.error('Event subscription error:', error);
      });

      // Stop subscription after 30 seconds
      setTimeout(async () => {
        await subscription.stop();
        console.log('Event subscription stopped');
      }, 30000);
    } else {
      console.log('Use WebSocketProvider for real-time event subscriptions');
    }
  } catch (error) {
    console.log('Event management failed (expected for example):', error);
  }
}

/**
 * Example 6: WebSocket Provider
 */
export async function webSocketProvider() {
  console.log('\n=== WebSocket Provider ===');

  try {
    // Create WebSocket provider
    const wsProvider = createWebSocketProvider({
      network: 'mainnet',
      debug: true,
    });

    // Setup event listeners
    wsProvider.on('connected', () => {
      console.log('WebSocket connected');
    });

    wsProvider.on('disconnected', () => {
      console.log('WebSocket disconnected');
    });

    wsProvider.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Subscribe to new blocks
    const blockSubscription = await wsProvider.subscribe('newHeads');

    wsProvider.on(blockSubscription, (block) => {
      console.log('New block:', block.number, block.hash);
    });

    // Subscribe to pending transactions
    const txSubscription = await wsProvider.subscribe('pendingTransactions');

    wsProvider.on(txSubscription, (txHash) => {
      console.log('Pending transaction:', txHash);
    });

    // Cleanup after 30 seconds
    setTimeout(async () => {
      await wsProvider.unsubscribe(blockSubscription);
      await wsProvider.unsubscribe(txSubscription);
      wsProvider.destroy();
      console.log('WebSocket provider cleaned up');
    }, 30000);
  } catch (error) {
    console.log('WebSocket provider example failed (expected in this environment):', error);
  }
}

/**
 * Example 7: Advanced Configuration
 */
export async function advancedConfiguration() {
  console.log('\n=== Advanced Configuration ===');

  // Custom client configuration
  const customClient = createEvmClient({
    network: 'mainnet',
    timeout: 60000,
    maxRetries: 5,
    debug: true,
    gasConfig: {
      gasMultiplier: 1.5,
      maxGasLimit: 15000000,
      defaultGasPrice: '20000000000', // 20 gwei
    },
    confirmations: 3,
    pollingInterval: 1000,
    maxPollingDuration: 600000,
  });

  // Test custom configuration
  const network = await customClient.getNetwork();
  console.log('Custom client connected to:', network.name);

  const gasPrice = await customClient.getGasPrice();
  console.log('Current gas price:', weiToEther(gasPrice), 'ETH');

  const maxFeePerGas = await customClient.getMaxFeePerGas();
  console.log('Max fee per gas:', weiToEther(maxFeePerGas), 'ETH');

  const maxPriorityFeePerGas = await customClient.getMaxPriorityFeePerGas();
  console.log('Max priority fee per gas:', weiToEther(maxPriorityFeePerGas), 'ETH');
}

/**
 * Example 8: Batch Operations
 */
export async function batchOperations() {
  console.log('\n=== Batch Operations ===');

  const client = createEvmClient();

  // Prepare batch requests
  const batchRequests = [
    { method: 'eth_blockNumber', params: [] },
    { method: 'eth_chainId', params: [] },
    { method: 'eth_gasPrice', params: [] },
    { method: 'eth_getBalance', params: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'latest'] },
  ];

  try {
    // Send batch request
    const results = await client.sendBatch(batchRequests);

    console.log('Batch results:');
    console.log('Block number:', parseInt(results[0], 16));
    console.log('Chain ID:', parseInt(results[1], 16));
    console.log('Gas price:', weiToEther(results[2]), 'ETH');
    console.log('Balance:', weiToEther(results[3]), 'ETH');
  } catch (error) {
    console.log('Batch operation failed:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await basicClientSetup();
    await walletOperations();
    await transactionManagement();
    await contractInteraction();
    await eventManagement();
    await webSocketProvider();
    await advancedConfiguration();
    await batchOperations();

    console.log('\n=== All examples completed ===');
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Export for use in other files
export default {
  basicClientSetup,
  walletOperations,
  transactionManagement,
  contractInteraction,
  eventManagement,
  webSocketProvider,
  advancedConfiguration,
  batchOperations,
  runAllExamples,
};
