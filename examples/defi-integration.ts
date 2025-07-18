import { SelendraSDK } from '../src';

// Example DeFi protocol integration
async function defiExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    await sdk.connectWallet('metamask');

    const account = await sdk.evm.getAccount();
    console.log('Connected account:', account);

    // Example: Liquidity Pool interaction
    await liquidityPoolExample(sdk, account);

    // Example: Staking interaction
    await stakingExample(sdk, account);

    // Example: Yield farming
    await yieldFarmingExample(sdk, account);

  } catch (error) {
    console.error('DeFi example failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

// Liquidity Pool Example
async function liquidityPoolExample(sdk: SelendraSDK, account: string) {
  console.log('\n🌊 === Liquidity Pool Example ===');
  
  // Example DEX router contract
  const routerAddress = '0x1234567890123456789012345678901234567890';
  const routerABI = [
    'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
    'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ];

  const router = sdk.evm.contract(routerAddress, routerABI);

  // Token addresses
  const tokenA = '0xTokenA...';
  const tokenB = '0xTokenB...';
  const amountA = sdk.utils.format.parseEther('100');
  const amountB = sdk.utils.format.parseEther('200');
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  try {
    // Add liquidity
    console.log('Adding liquidity...');
    const addLiquidityTx = await router.write('addLiquidity', [
      tokenA,
      tokenB,
      amountA,
      amountB,
      sdk.utils.format.parseEther('95'), // 5% slippage
      sdk.utils.format.parseEther('190'), // 5% slippage
      account,
      deadline
    ]);

    console.log('Add liquidity transaction:', addLiquidityTx);
    await sdk.evm.waitForTransaction(addLiquidityTx);
    console.log('✅ Liquidity added successfully');

  } catch (error) {
    console.error('Liquidity pool interaction failed:', error);
  }
}

// Staking Example
async function stakingExample(sdk: SelendraSDK, account: string) {
  console.log('\n🥩 === Staking Example ===');
  
  const stakingContractAddress = '0xStakingContract...';
  const stakingABI = [
    'function stake(uint256 amount) external',
    'function unstake(uint256 amount) external',
    'function claimRewards() external',
    'function getStakedAmount(address user) external view returns (uint256)',
    'function getPendingRewards(address user) external view returns (uint256)'
  ];

  const stakingContract = sdk.evm.contract(stakingContractAddress, stakingABI);

  try {
    // Check current staked amount
    const stakedAmount = await stakingContract.read('getStakedAmount', [account]);
    console.log('Current staked amount:', sdk.utils.format.formatEther(stakedAmount));

    // Check pending rewards
    const pendingRewards = await stakingContract.read('getPendingRewards', [account]);
    console.log('Pending rewards:', sdk.utils.format.formatEther(pendingRewards));

    // Stake tokens
    const stakeAmount = sdk.utils.format.parseEther('50');
    console.log('Staking 50 tokens...');
    
    const stakeTx = await stakingContract.write('stake', [stakeAmount]);
    console.log('Stake transaction:', stakeTx);
    await sdk.evm.waitForTransaction(stakeTx);
    console.log('✅ Tokens staked successfully');

    // Claim rewards
    if (pendingRewards > 0) {
      console.log('Claiming rewards...');
      const claimTx = await stakingContract.write('claimRewards', []);
      console.log('Claim transaction:', claimTx);
      await sdk.evm.waitForTransaction(claimTx);
      console.log('✅ Rewards claimed successfully');
    }

  } catch (error) {
    console.error('Staking interaction failed:', error);
  }
}

// Yield Farming Example
async function yieldFarmingExample(sdk: SelendraSDK, account: string) {
  console.log('\n🌾 === Yield Farming Example ===');
  
  const farmContractAddress = '0xFarmContract...';
  const farmABI = [
    'function deposit(uint256 poolId, uint256 amount) external',
    'function withdraw(uint256 poolId, uint256 amount) external',
    'function harvest(uint256 poolId) external',
    'function getUserInfo(uint256 poolId, address user) external view returns (uint256 amount, uint256 rewardDebt)',
    'function pendingReward(uint256 poolId, address user) external view returns (uint256)'
  ];

  const farmContract = sdk.evm.contract(farmContractAddress, farmABI);
  const poolId = 0; // First pool

  try {
    // Check user info
    const userInfo = await farmContract.read('getUserInfo', [poolId, account]);
    console.log('User farm info:', {
      amount: sdk.utils.format.formatEther(userInfo.amount),
      rewardDebt: sdk.utils.format.formatEther(userInfo.rewardDebt)
    });

    // Check pending rewards
    const pendingReward = await farmContract.read('pendingReward', [poolId, account]);
    console.log('Pending farm rewards:', sdk.utils.format.formatEther(pendingReward));

    // Deposit LP tokens
    const depositAmount = sdk.utils.format.parseEther('25');
    console.log('Depositing 25 LP tokens to farm...');
    
    const depositTx = await farmContract.write('deposit', [poolId, depositAmount]);
    console.log('Deposit transaction:', depositTx);
    await sdk.evm.waitForTransaction(depositTx);
    console.log('✅ LP tokens deposited successfully');

    // Harvest rewards
    if (pendingReward > 0) {
      console.log('Harvesting farm rewards...');
      const harvestTx = await farmContract.write('harvest', [poolId]);
      console.log('Harvest transaction:', harvestTx);
      await sdk.evm.waitForTransaction(harvestTx);
      console.log('✅ Farm rewards harvested successfully');
    }

  } catch (error) {
    console.error('Yield farming interaction failed:', error);
  }
}

defiExample().catch(console.error);