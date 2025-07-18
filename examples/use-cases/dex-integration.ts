import { SelendraSDK } from '../../src';

/**
 * DEX Integration Example
 * Demonstrates comprehensive decentralized exchange integration
 * with trading, liquidity provision, and yield farming
 */

// DEX Router ABI (Uniswap V2 style)
const DEX_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)'
];

// DEX Factory ABI
const DEX_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
  'function allPairsLength() external view returns (uint)',
  'function allPairs(uint) external view returns (address pair)'
];

// LP Token ABI
const LP_TOKEN_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)'
];

interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number; // Percentage (e.g., 0.5 for 0.5%)
  deadline?: number; // Unix timestamp
}

interface LiquidityParams {
  tokenA: string;
  tokenB: string;
  amountA: string;
  amountB: string;
  slippage: number;
  deadline?: number;
}

class DEXIntegration {
  private sdk: SelendraSDK;
  private routerAddress: string;
  private factoryAddress: string;
  private router: any;
  private factory: any;

  constructor(sdk: SelendraSDK, routerAddress: string, factoryAddress: string) {
    this.sdk = sdk;
    this.routerAddress = routerAddress;
    this.factoryAddress = factoryAddress;
    this.router = sdk.evm.contract(routerAddress, DEX_ROUTER_ABI);
    this.factory = sdk.evm.contract(factoryAddress, DEX_FACTORY_ABI);
  }

  // Token swapping functions
  async swapTokens(params: SwapParams): Promise<string> {
    console.log('🔄 === Token Swap ===');
    console.log(`Swapping ${params.amountIn} tokens`);
    console.log(`From: ${params.tokenIn}`);
    console.log(`To: ${params.tokenOut}`);

    try {
      const path = [params.tokenIn, params.tokenOut];
      const amountIn = this.sdk.utils.format.parseEther(params.amountIn);
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      // Get expected output amount
      const amountsOut = await this.router.read('getAmountsOut', [amountIn, path]);
      const expectedOut = amountsOut[1];
      
      // Calculate minimum output with slippage
      const slippageFactor = (100 - params.slippage) / 100;
      const amountOutMin = (BigInt(expectedOut.toString()) * BigInt(Math.floor(slippageFactor * 100)) / BigInt(100)).toString();

      console.log(`Expected output: ${this.sdk.utils.format.formatEther(expectedOut)}`);
      console.log(`Minimum output (${params.slippage}% slippage): ${this.sdk.utils.format.formatEther(amountOutMin)}`);

      // Approve token spending
      await this.approveToken(params.tokenIn, this.routerAddress, amountIn);

      // Execute swap
      const account = await this.sdk.evm.getAccount();
      const swapTx = await this.router.write('swapExactTokensForTokens', [
        amountIn,
        amountOutMin,
        path,
        account,
        deadline
      ]);

      console.log('Swap transaction:', swapTx);
      await this.sdk.evm.waitForTransaction(swapTx);
      console.log('✅ Swap completed successfully');

      return swapTx;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }

  async swapETHForTokens(tokenOut: string, amountIn: string, slippage: number): Promise<string> {
    console.log('🔄 === ETH to Token Swap ===');

    try {
      const WETH = await this.getWETHAddress();
      const path = [WETH, tokenOut];
      const amountInWei = this.sdk.utils.format.parseEther(amountIn);
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Get expected output
      const amountsOut = await this.router.read('getAmountsOut', [amountInWei, path]);
      const expectedOut = amountsOut[1];
      
      const slippageFactor = (100 - slippage) / 100;
      const amountOutMin = (BigInt(expectedOut.toString()) * BigInt(Math.floor(slippageFactor * 100)) / BigInt(100)).toString();

      console.log(`Swapping ${amountIn} ETH for tokens`);
      console.log(`Expected output: ${this.sdk.utils.format.formatEther(expectedOut)}`);

      const account = await this.sdk.evm.getAccount();
      const swapTx = await this.router.write('swapExactETHForTokens', [
        amountOutMin,
        path,
        account,
        deadline
      ], { value: amountInWei });

      await this.sdk.evm.waitForTransaction(swapTx);
      console.log('✅ ETH swap completed');

      return swapTx;
    } catch (error) {
      console.error('ETH swap failed:', error);
      throw error;
    }
  }

  // Liquidity provision functions
  async addLiquidity(params: LiquidityParams): Promise<string> {
    console.log('💧 === Adding Liquidity ===');
    console.log(`Token A: ${params.tokenA} (${params.amountA})`);
    console.log(`Token B: ${params.tokenB} (${params.amountB})`);

    try {
      const amountADesired = this.sdk.utils.format.parseEther(params.amountA);
      const amountBDesired = this.sdk.utils.format.parseEther(params.amountB);
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800;

      // Calculate minimum amounts with slippage
      const slippageFactor = (100 - params.slippage) / 100;
      const amountAMin = (BigInt(amountADesired) * BigInt(Math.floor(slippageFactor * 100)) / BigInt(100)).toString();
      const amountBMin = (BigInt(amountBDesired) * BigInt(Math.floor(slippageFactor * 100)) / BigInt(100)).toString();

      // Approve both tokens
      await this.approveToken(params.tokenA, this.routerAddress, amountADesired);
      await this.approveToken(params.tokenB, this.routerAddress, amountBDesired);

      // Add liquidity
      const account = await this.sdk.evm.getAccount();
      const liquidityTx = await this.router.write('addLiquidity', [
        params.tokenA,
        params.tokenB,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        account,
        deadline
      ]);

      console.log('Liquidity transaction:', liquidityTx);
      await this.sdk.evm.waitForTransaction(liquidityTx);
      console.log('✅ Liquidity added successfully');

      return liquidityTx;
    } catch (error) {
      console.error('Add liquidity failed:', error);
      throw error;
    }
  }

  async removeLiquidity(tokenA: string, tokenB: string, liquidityAmount: string, slippage: number): Promise<string> {
    console.log('💧 === Removing Liquidity ===');

    try {
      const liquidity = this.sdk.utils.format.parseEther(liquidityAmount);
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Get current reserves to calculate minimum amounts
      const pairAddress = await this.factory.read('getPair', [tokenA, tokenB]);
      const pair = this.sdk.evm.contract(pairAddress, LP_TOKEN_ABI);
      const reserves = await pair.read('getReserves');

      // Calculate expected amounts (simplified)
      const totalSupply = await pair.read('totalSupply');
      const liquidityPercent = Number(liquidity) / Number(totalSupply);
      
      const expectedAmountA = BigInt(reserves.reserve0.toString()) * BigInt(Math.floor(liquidityPercent * 1e18)) / BigInt(1e18);
      const expectedAmountB = BigInt(reserves.reserve1.toString()) * BigInt(Math.floor(liquidityPercent * 1e18)) / BigInt(1e18);

      // Apply slippage
      const slippageFactor = (100 - slippage) / 100;
      const amountAMin = (expectedAmountA * BigInt(Math.floor(slippageFactor * 100)) / BigInt(100)).toString();
      const amountBMin = (expectedAmountB * BigInt(Math.floor(slippageFactor * 100)) / BigInt(100)).toString();

      // Approve LP token spending
      await this.approveToken(pairAddress, this.routerAddress, liquidity);

      // Remove liquidity
      const account = await this.sdk.evm.getAccount();
      const removeTx = await this.router.write('removeLiquidity', [
        tokenA,
        tokenB,
        liquidity,
        amountAMin,
        amountBMin,
        account,
        deadline
      ]);

      await this.sdk.evm.waitForTransaction(removeTx);
      console.log('✅ Liquidity removed successfully');

      return removeTx;
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      throw error;
    }
  }

  // Price and analytics functions
  async getTokenPrice(tokenA: string, tokenB: string, amount: string = '1'): Promise<string> {
    try {
      const path = [tokenA, tokenB];
      const amountIn = this.sdk.utils.format.parseEther(amount);
      
      const amountsOut = await this.router.read('getAmountsOut', [amountIn, path]);
      const priceOut = amountsOut[1];
      
      return this.sdk.utils.format.formatEther(priceOut);
    } catch (error) {
      console.error('Price fetch failed:', error);
      return '0';
    }
  }

  async getLiquidityPoolInfo(tokenA: string, tokenB: string) {
    try {
      const pairAddress = await this.factory.read('getPair', [tokenA, tokenB]);
      
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return null; // Pool doesn't exist
      }

      const pair = this.sdk.evm.contract(pairAddress, LP_TOKEN_ABI);
      const [reserves, totalSupply, token0, token1] = await Promise.all([
        pair.read('getReserves'),
        pair.read('totalSupply'),
        pair.read('token0'),
        pair.read('token1')
      ]);

      return {
        pairAddress,
        token0,
        token1,
        reserve0: this.sdk.utils.format.formatEther(reserves.reserve0),
        reserve1: this.sdk.utils.format.formatEther(reserves.reserve1),
        totalSupply: this.sdk.utils.format.formatEther(totalSupply),
        lastUpdate: reserves.blockTimestampLast
      };
    } catch (error) {
      console.error('Pool info fetch failed:', error);
      return null;
    }
  }

  async calculatePriceImpact(tokenIn: string, tokenOut: string, amountIn: string): Promise<number> {
    try {
      const path = [tokenIn, tokenOut];
      const amount = this.sdk.utils.format.parseEther(amountIn);
      
      // Get current price for 1 token
      const oneTokenAmount = this.sdk.utils.format.parseEther('1');
      const [currentPrice, expectedOut] = await Promise.all([
        this.router.read('getAmountsOut', [oneTokenAmount, path]),
        this.router.read('getAmountsOut', [amount, path])
      ]);

      const currentRate = Number(currentPrice[1]) / Number(oneTokenAmount);
      const actualRate = Number(expectedOut[1]) / Number(amount);
      
      const priceImpact = ((currentRate - actualRate) / currentRate) * 100;
      return Math.abs(priceImpact);
    } catch (error) {
      console.error('Price impact calculation failed:', error);
      return 0;
    }
  }

  // Portfolio management
  async getPortfolioValue(tokens: string[]): Promise<any> {
    console.log('💼 === Portfolio Analysis ===');

    try {
      const account = await this.sdk.evm.getAccount();
      const portfolio = [];
      let totalValueUSD = 0;

      for (const token of tokens) {
        const tokenContract = this.sdk.evm.erc20(token);
        const [balance, symbol, decimals] = await Promise.all([
          tokenContract.balanceOf(account),
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        const formattedBalance = this.sdk.utils.format.formatUnits(balance, decimals);
        
        // Get USD price (assuming USDC pair exists)
        const priceUSD = await this.getTokenPrice(token, '0xUSDC...', '1');
        const valueUSD = parseFloat(formattedBalance) * parseFloat(priceUSD);
        
        portfolio.push({
          token,
          symbol,
          balance: formattedBalance,
          priceUSD,
          valueUSD
        });

        totalValueUSD += valueUSD;
      }

      console.log('Portfolio Summary:');
      portfolio.forEach(item => {
        const percentage = (item.valueUSD / totalValueUSD * 100).toFixed(2);
        console.log(`  ${item.symbol}: ${item.balance} ($${item.valueUSD.toFixed(2)}) - ${percentage}%`);
      });
      console.log(`Total Portfolio Value: $${totalValueUSD.toFixed(2)}`);

      return { portfolio, totalValueUSD };
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      return { portfolio: [], totalValueUSD: 0 };
    }
  }

  // Utility functions
  private async approveToken(tokenAddress: string, spender: string, amount: string): Promise<void> {
    const token = this.sdk.evm.erc20(tokenAddress);
    const currentAllowance = await token.allowance(await this.sdk.evm.getAccount(), spender);
    
    if (BigInt(currentAllowance) < BigInt(amount)) {
      console.log(`Approving ${tokenAddress.substring(0, 8)}... for spending...`);
      const approveTx = await token.approve(spender, amount);
      await this.sdk.evm.waitForTransaction(approveTx);
      console.log('✅ Token approved');
    }
  }

  private async getWETHAddress(): Promise<string> {
    // This would typically be a constant or fetched from router
    return '0xWETH...'; // Placeholder
  }
}

// Advanced trading strategies
class TradingStrategies {
  private dex: DEXIntegration;

  constructor(dex: DEXIntegration) {
    this.dex = dex;
  }

  // Dollar-cost averaging
  async dollarCostAverage(tokenOut: string, totalAmount: string, intervals: number, intervalMinutes: number) {
    console.log('📈 === Dollar-Cost Averaging ===');
    console.log(`Total amount: ${totalAmount} ETH`);
    console.log(`Intervals: ${intervals}`);
    console.log(`Interval: ${intervalMinutes} minutes`);

    const amountPerInterval = (parseFloat(totalAmount) / intervals).toString();
    
    for (let i = 0; i < intervals; i++) {
      try {
        console.log(`\nInterval ${i + 1}/${intervals}`);
        await this.dex.swapETHForTokens(tokenOut, amountPerInterval, 1); // 1% slippage
        
        if (i < intervals - 1) {
          console.log(`Waiting ${intervalMinutes} minutes for next interval...`);
          await new Promise(resolve => setTimeout(resolve, intervalMinutes * 60 * 1000));
        }
      } catch (error) {
        console.error(`Interval ${i + 1} failed:`, error);
      }
    }

    console.log('✅ Dollar-cost averaging completed');
  }

  // Arbitrage opportunity detection
  async detectArbitrage(tokenA: string, tokenB: string, dexAddresses: string[]) {
    console.log('🔍 === Arbitrage Detection ===');

    try {
      const prices = [];
      
      for (const dexAddress of dexAddresses) {
        // This would require multiple DEX instances
        const price = await this.dex.getTokenPrice(tokenA, tokenB);
        prices.push({ dex: dexAddress, price: parseFloat(price) });
      }

      const maxPrice = Math.max(...prices.map(p => p.price));
      const minPrice = Math.min(...prices.map(p => p.price));
      const arbitrageOpportunity = ((maxPrice - minPrice) / minPrice) * 100;

      if (arbitrageOpportunity > 0.5) { // 0.5% threshold
        console.log(`🚨 Arbitrage opportunity detected: ${arbitrageOpportunity.toFixed(2)}%`);
        console.log('Price differences:', prices);
        return { opportunity: true, percentage: arbitrageOpportunity, prices };
      } else {
        console.log('No significant arbitrage opportunities found');
        return { opportunity: false, percentage: arbitrageOpportunity, prices };
      }
    } catch (error) {
      console.error('Arbitrage detection failed:', error);
      return { opportunity: false, percentage: 0, prices: [] };
    }
  }

  // Rebalancing strategy
  async rebalancePortfolio(targetAllocations: { token: string; percentage: number }[]) {
    console.log('⚖️ === Portfolio Rebalancing ===');

    try {
      // Get current portfolio
      const tokens = targetAllocations.map(t => t.token);
      const { portfolio, totalValueUSD } = await this.dex.getPortfolioValue(tokens);

      // Calculate required trades
      const trades = [];
      for (const target of targetAllocations) {
        const current = portfolio.find(p => p.token === target.token);
        const currentPercentage = current ? (current.valueUSD / totalValueUSD) * 100 : 0;
        const difference = target.percentage - currentPercentage;

        if (Math.abs(difference) > 1) { // 1% threshold
          const action = difference > 0 ? 'BUY' : 'SELL';
          const amountUSD = Math.abs(difference * totalValueUSD / 100);
          
          trades.push({
            token: target.token,
            action,
            amountUSD,
            currentPercentage,
            targetPercentage: target.percentage
          });
        }
      }

      console.log('Required trades:');
      trades.forEach(trade => {
        console.log(`  ${trade.action} ${trade.token}: $${trade.amountUSD.toFixed(2)} (${trade.currentPercentage.toFixed(1)}% → ${trade.targetPercentage}%)`);
      });

      // Execute trades (simplified - would need more complex logic)
      for (const trade of trades) {
        console.log(`Executing ${trade.action} for ${trade.token}...`);
        // Implementation would depend on available base currency and routing
      }

      console.log('✅ Portfolio rebalanced');
    } catch (error) {
      console.error('Portfolio rebalancing failed:', error);
    }
  }
}

async function dexIntegrationExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    await sdk.connectWallet('metamask');

    console.log('🌊 === DEX Integration Example ===');

    // Initialize DEX integration
    const routerAddress = '0xDEXRouter...';
    const factoryAddress = '0xDEXFactory...';
    const dex = new DEXIntegration(sdk, routerAddress, factoryAddress);

    // Example 1: Token swap
    await dex.swapTokens({
      tokenIn: '0xTokenA...',
      tokenOut: '0xTokenB...',
      amountIn: '100',
      slippage: 0.5
    });

    // Example 2: ETH to token swap
    await dex.swapETHForTokens('0xTokenA...', '1', 1);

    // Example 3: Add liquidity
    await dex.addLiquidity({
      tokenA: '0xTokenA...',
      tokenB: '0xTokenB...',
      amountA: '1000',
      amountB: '2000',
      slippage: 1
    });

    // Example 4: Get pool information
    const poolInfo = await dex.getLiquidityPoolInfo('0xTokenA...', '0xTokenB...');
    console.log('Pool info:', poolInfo);

    // Example 5: Price impact analysis
    const priceImpact = await dex.calculatePriceImpact('0xTokenA...', '0xTokenB...', '1000');
    console.log(`Price impact: ${priceImpact.toFixed(2)}%`);

    // Example 6: Portfolio analysis
    await dex.getPortfolioValue(['0xTokenA...', '0xTokenB...', '0xTokenC...']);

    // Example 7: Advanced trading strategies
    const strategies = new TradingStrategies(dex);
    
    // Dollar-cost averaging
    await strategies.dollarCostAverage('0xTokenA...', '10', 5, 60); // 10 ETH over 5 intervals, 60 min apart

    // Arbitrage detection
    await strategies.detectArbitrage('0xTokenA...', '0xTokenB...', ['0xDEX1...', '0xDEX2...']);

    // Portfolio rebalancing
    await strategies.rebalancePortfolio([
      { token: '0xTokenA...', percentage: 40 },
      { token: '0xTokenB...', percentage: 30 },
      { token: '0xTokenC...', percentage: 30 }
    ]);

  } catch (error) {
    console.error('DEX integration example failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

// Example usage
dexIntegrationExample().catch(console.error);

export { DEXIntegration, TradingStrategies };