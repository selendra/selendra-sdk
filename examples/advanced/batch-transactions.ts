import { SelendraSDK } from '../../src';

/**
 * Batch Transactions and Multicall Example
 * Demonstrates efficient batch operations for gas optimization
 */

// Multicall Contract ABI
const MULTICALL_ABI = [
  'function aggregate(tuple(address target, bytes callData)[] calls) external returns (uint256 blockNumber, bytes[] returnData)',
  'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) external returns (tuple(bool success, bytes returnData)[] returnData)',
  'function blockAndAggregate(tuple(address target, bytes callData)[] calls) external returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)'
];

// Token Contract ABI for batch operations
const TOKEN_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)'
];

async function batchTransactionsExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    await sdk.connectWallet('metamask');

    const account = await sdk.evm.getAccount();
    console.log('💼 Connected account:', account);

    // Contract addresses
    const multicallAddress = '0xMulticall...';
    const tokenAddress = '0xToken...';

    // Example 1: Batch token transfers
    await batchTokenTransfers(sdk, tokenAddress, account);

    // Example 2: Multicall for reading data
    await multicallReadOperations(sdk, multicallAddress, tokenAddress, account);

    // Example 3: Batch approvals
    await batchApprovals(sdk, tokenAddress, account);

    // Example 4: Complex batch operations
    await complexBatchOperations(sdk, multicallAddress, tokenAddress, account);

    // Example 5: Atomic swap operations
    await atomicSwapExample(sdk, account);

  } catch (error) {
    console.error('Batch transactions example failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

async function batchTokenTransfers(sdk: SelendraSDK, tokenAddress: string, account: string) {
  console.log('\n📦 === Batch Token Transfers ===');

  const token = sdk.evm.contract(tokenAddress, TOKEN_ABI);

  try {
    // Recipients and amounts for batch transfer
    const transfers = [
      { to: '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe', amount: '100' },
      { to: '0x8ba1f109551bD432803012645Hac136c', amount: '200' },
      { to: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db', amount: '150' },
      { to: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB', amount: '75' }
    ];

    console.log(`Preparing ${transfers.length} token transfers...`);

    // Option 1: Sequential transfers (less efficient)
    console.log('\n🐌 Sequential transfers (for comparison):');
    const startTime = Date.now();
    
    for (const transfer of transfers) {
      const amount = sdk.utils.format.parseEther(transfer.amount);
      console.log(`Transferring ${transfer.amount} tokens to ${transfer.to.substring(0, 8)}...`);
      
      const tx = await token.write('transfer', [transfer.to, amount]);
      await sdk.evm.waitForTransaction(tx);
      console.log(`✅ Transfer completed: ${tx}`);
    }
    
    const sequentialTime = Date.now() - startTime;
    console.log(`Sequential transfers completed in ${sequentialTime}ms`);

    // Option 2: Batch using multicall (more efficient)
    // Note: This would require a custom contract that accepts multiple transfers
    console.log('\n⚡ Batch transfers would be more efficient with a custom contract');

  } catch (error) {
    console.error('Batch token transfers failed:', error);
  }
}

async function multicallReadOperations(
  sdk: SelendraSDK,
  multicallAddress: string,
  tokenAddress: string,
  account: string
) {
  console.log('\n📊 === Multicall Read Operations ===');

  const multicall = sdk.evm.contract(multicallAddress, MULTICALL_ABI);
  const token = sdk.evm.contract(tokenAddress, TOKEN_ABI);

  try {
    // Addresses to check balances for
    const addresses = [
      account,
      '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe',
      '0x8ba1f109551bD432803012645Hac136c',
      '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
      '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB'
    ];

    // Prepare multicall data
    const calls = addresses.map(address => ({
      target: tokenAddress,
      callData: token.encodeFunctionData('balanceOf', [address])
    }));

    console.log(`Fetching balances for ${addresses.length} addresses in a single call...`);

    // Execute multicall
    const result = await multicall.read('aggregate', [calls]);
    const blockNumber = result.blockNumber;
    const returnData = result.returnData;

    console.log(`📦 Multicall executed at block ${blockNumber.toString()}`);

    // Decode results
    for (let i = 0; i < addresses.length; i++) {
      const balance = token.decodeFunctionResult('balanceOf', returnData[i])[0];
      const formattedBalance = sdk.utils.format.formatEther(balance);
      
      console.log(`${addresses[i]}: ${formattedBalance} tokens`);
    }

    // Compare with individual calls
    console.log('\n⏱️ Performance comparison:');
    console.log('Multicall: 1 transaction, 1 block confirmation');
    console.log(`Individual calls: ${addresses.length} transactions, ${addresses.length} block confirmations`);

  } catch (error) {
    console.error('Multicall read operations failed:', error);
  }
}

async function batchApprovals(sdk: SelendraSDK, tokenAddress: string, account: string) {
  console.log('\n✅ === Batch Approvals ===');

  const token = sdk.evm.contract(tokenAddress, TOKEN_ABI);

  try {
    // Multiple contracts to approve
    const approvals = [
      { spender: '0xDEXRouter...', amount: '1000' },
      { spender: '0xStakingContract...', amount: '500' },
      { spender: '0xLendingProtocol...', amount: '2000' },
      { spender: '0xYieldFarm...', amount: '1500' }
    ];

    console.log(`Setting up ${approvals.length} token approvals...`);

    // Note: In a real implementation, you'd want to use a custom contract
    // that can handle multiple approvals in a single transaction
    
    for (const approval of approvals) {
      const amount = sdk.utils.format.parseEther(approval.amount);
      console.log(`Approving ${approval.amount} tokens for ${approval.spender.substring(0, 15)}...`);
      
      const tx = await token.write('approve', [approval.spender, amount]);
      await sdk.evm.waitForTransaction(tx);
      console.log(`✅ Approval set: ${tx}`);
    }

    console.log('💡 Tip: Use a multicall contract for true batch approvals to save gas');

  } catch (error) {
    console.error('Batch approvals failed:', error);
  }
}

async function complexBatchOperations(
  sdk: SelendraSDK,
  multicallAddress: string,
  tokenAddress: string,
  account: string
) {
  console.log('\n🔧 === Complex Batch Operations ===');

  try {
    // Example: DeFi strategy execution in batch
    await defiStrategyBatch(sdk, account);

    // Example: Portfolio rebalancing
    await portfolioRebalancing(sdk, account);

    // Example: Governance batch operations
    await governanceBatch(sdk, account);

  } catch (error) {
    console.error('Complex batch operations failed:', error);
  }
}

async function defiStrategyBatch(sdk: SelendraSDK, account: string) {
  console.log('\n🌊 DeFi Strategy Batch Execution');

  // Example strategy: Deposit tokens, stake, and provide liquidity
  const operations = [
    {
      name: 'Approve DEX Router',
      contract: '0xDEXRouter...',
      method: 'approve',
      params: ['0xDEXRouter...', sdk.utils.format.parseEther('1000')]
    },
    {
      name: 'Add Liquidity',
      contract: '0xDEXRouter...',
      method: 'addLiquidity',
      params: [
        '0xTokenA...',
        '0xTokenB...',
        sdk.utils.format.parseEther('500'),
        sdk.utils.format.parseEther('500'),
        sdk.utils.format.parseEther('475'), // 5% slippage
        sdk.utils.format.parseEther('475'),
        account,
        Math.floor(Date.now() / 1000) + 3600 // 1 hour deadline
      ]
    },
    {
      name: 'Stake LP Tokens',
      contract: '0xStakingContract...',
      method: 'stake',
      params: [sdk.utils.format.parseEther('100')]
    }
  ];

  console.log('🎯 Executing DeFi strategy with the following operations:');
  operations.forEach((op, i) => {
    console.log(`${i + 1}. ${op.name}`);
  });

  // In practice, these would be executed through a multicall contract
  console.log('💡 These operations would be batched in a single transaction for efficiency');
}

async function portfolioRebalancing(sdk: SelendraSDK, account: string) {
  console.log('\n⚖️ Portfolio Rebalancing');

  const portfolio = [
    { token: '0xTokenA...', currentAmount: '1000', targetAmount: '800' },
    { token: '0xTokenB...', currentAmount: '500', targetAmount: '700' },
    { token: '0xTokenC...', currentAmount: '300', targetAmount: '500' }
  ];

  console.log('📊 Current vs Target Portfolio:');
  portfolio.forEach(asset => {
    const diff = parseFloat(asset.targetAmount) - parseFloat(asset.currentAmount);
    const action = diff > 0 ? 'BUY' : 'SELL';
    console.log(`${asset.token.substring(0, 12)}: ${action} ${Math.abs(diff)}`);
  });

  // Batch rebalancing operations
  console.log('🔄 Rebalancing operations would be batched for atomic execution');
}

async function governanceBatch(sdk: SelendraSDK, account: string) {
  console.log('\n🏛️ Governance Batch Operations');

  const governanceActions = [
    'Vote on Proposal #1',
    'Vote on Proposal #2',
    'Delegate voting power',
    'Claim governance rewards'
  ];

  console.log('🗳️ Batch governance actions:');
  governanceActions.forEach((action, i) => {
    console.log(`${i + 1}. ${action}`);
  });

  console.log('⚡ All governance actions executed in a single transaction');
}

async function atomicSwapExample(sdk: SelendraSDK, account: string) {
  console.log('\n🔄 === Atomic Swap Example ===');

  try {
    // Example: Atomic swap between two tokens
    const swapData = {
      tokenA: '0xTokenA...',
      tokenB: '0xTokenB...',
      amountA: sdk.utils.format.parseEther('100'),
      amountB: sdk.utils.format.parseEther('200'),
      deadline: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
    };

    console.log('🔀 Atomic Swap Configuration:');
    console.log(`Token A: ${swapData.tokenA}`);
    console.log(`Token B: ${swapData.tokenB}`);
    console.log(`Amount A: ${sdk.utils.format.formatEther(swapData.amountA)}`);
    console.log(`Amount B: ${sdk.utils.format.formatEther(swapData.amountB)}`);

    // Atomic swap steps (would be executed in a single transaction):
    const swapSteps = [
      'Transfer Token A to escrow',
      'Verify Token B transfer',
      'Execute swap',
      'Distribute tokens to recipients'
    ];

    console.log('\n🎯 Atomic swap steps:');
    swapSteps.forEach((step, i) => {
      console.log(`${i + 1}. ${step}`);
    });

    console.log('⚠️ All steps must succeed or the entire transaction reverts');

  } catch (error) {
    console.error('Atomic swap example failed:', error);
  }
}

// Helper function to estimate gas savings
async function estimateGasSavings(sdk: SelendraSDK, individualOps: number, batchOps: number) {
  try {
    const gasPerIndividualTx = 21000 + 50000; // Base + operation gas
    const gasPerBatchTx = 21000 + (batchOps * 30000); // Base + reduced operation gas

    const individualTotalGas = individualOps * gasPerIndividualTx;
    const batchTotalGas = gasPerBatchTx;
    const savings = individualTotalGas - batchTotalGas;
    const savingsPercentage = (savings / individualTotalGas) * 100;

    console.log('\n⛽ Gas Estimation:');
    console.log(`Individual transactions: ${individualTotalGas.toLocaleString()} gas`);
    console.log(`Batch transaction: ${batchTotalGas.toLocaleString()} gas`);
    console.log(`Savings: ${savings.toLocaleString()} gas (${savingsPercentage.toFixed(1)}%)`);

  } catch (error) {
    console.error('Gas estimation failed:', error);
  }
}

// Custom multicall contract example
const CUSTOM_MULTICALL_ABI = [
  'function batchTransfer(address token, address[] recipients, uint256[] amounts) external',
  'function batchApprove(address token, address[] spenders, uint256[] amounts) external',
  'function batchCall(address[] targets, bytes[] callDatas, uint256[] values) external'
];

async function customMulticallExample(sdk: SelendraSDK) {
  console.log('\n🛠️ === Custom Multicall Contract ===');

  const customMulticall = sdk.evm.contract('0xCustomMulticall...', CUSTOM_MULTICALL_ABI);

  try {
    // Batch token transfers using custom contract
    const recipients = [
      '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe',
      '0x8ba1f109551bD432803012645Hac136c'
    ];
    
    const amounts = [
      sdk.utils.format.parseEther('100'),
      sdk.utils.format.parseEther('200')
    ];

    console.log('Executing batch transfer through custom multicall...');
    const batchTx = await customMulticall.write('batchTransfer', [
      '0xToken...',
      recipients,
      amounts
    ]);

    await sdk.evm.waitForTransaction(batchTx);
    console.log('✅ Batch transfer completed in a single transaction');

  } catch (error) {
    console.error('Custom multicall failed:', error);
  }
}

// Example usage
batchTransactionsExample().catch(console.error);