/**
 * DeFi Dashboard Template
 *
 * A comprehensive DeFi dashboard template that showcases portfolio tracking,
 * trading interface, liquidity management, and staking features on Selendra.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  SelendraProvider,
  ThemeProvider,
  WalletConnector,
  BalanceDisplay,
  ConnectionStatus,
  TransactionButton,
  LoadingSkeleton,
  ErrorBoundary
} from '../components';
import {
  useSelendraSDK,
  useBalance,
  useAccount,
  useEvents,
  useBlockSubscription
} from '../hooks';
import {
  formatBalance,
  formatTimestamp,
  formatAddress,
  getChainDisplayName,
  calculateTransactionFee,
  truncateString
} from '../utils';
import { DeFiDashboardTemplateProps } from '../types';

interface TokenInfo {
  symbol: string;
  balance: string;
  usdValue: number;
  decimals: number;
  priceChange24h: number;
}

interface PoolInfo {
  id: string;
  token0: string;
  token1: string;
  tvl: number;
  apr: number;
  yourLiquidity?: number;
}

interface StakingInfo {
  totalStaked: string;
  rewards: string;
  apr: number;
  unlockTime?: number;
}

/**
 * Portfolio Section Component
 */
function PortfolioSection({ account }: { account: any }) {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setIsLoading(true);

        // Mock portfolio data - in real app, this would come from your backend or API calls
        const mockTokens: TokenInfo[] = [
          {
            symbol: 'SEL',
            balance: '1500000000000000000000',
            usdValue: 1500,
            decimals: 18,
            priceChange24h: 2.5
          },
          {
            symbol: 'USDT',
            balance: '500000000',
            usdValue: 500,
            decimals: 6,
            priceChange24h: 0.1
          },
          {
            symbol: 'USDC',
            balance: '750000000',
            usdValue: 750,
            decimals: 6,
            priceChange24h: -0.2
          }
        ];

        setTokens(mockTokens);
        setTotalValue(mockTokens.reduce((sum, token) => sum + token.usdValue, 0));
      } catch (error) {
        console.error('Failed to load portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolio();
  }, [account]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="list" lines={3} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Portfolio</h2>

      <div className="mb-6">
        <div className="text-3xl font-bold text-green-600">
          ${totalValue.toLocaleString()}
        </div>
        <div className="text-gray-500">Total Portfolio Value</div>
      </div>

      <div className="space-y-4">
        {tokens.map((token, index) => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">{token.symbol[0]}</span>
              </div>
              <div>
                <div className="font-semibold">{token.symbol}</div>
                <div className="text-sm text-gray-500">
                  {formatBalance({ balance: token.balance, symbol: token.symbol, decimals: token.decimals } as any)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">${token.usdValue.toLocaleString()}</div>
              <div className={`text-sm ${token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Trading Section Component
 */
function TradingSection() {
  const [fromToken, setFromToken] = useState('SEL');
  const [toToken, setToToken] = useState('USDT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tokens = ['SEL', 'USDT', 'USDC', 'ETH', 'WBTC'];

  const handleSwap = async () => {
    try {
      setIsLoading(true);
      // Implement swap logic here
      console.log('Swapping', fromAmount, fromToken, 'to', toToken, toAmount);
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Swap</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="flex space-x-2">
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="flex-shrink-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tokens.map(token => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button className="p-2 bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="flex space-x-2">
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="flex-shrink-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tokens.map(token => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
            <input
              type="number"
              value={toAmount}
              onChange={(e) => setToAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={isLoading || !fromAmount}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </div>
  );
}

/**
 * Liquidity Section Component
 */
function LiquiditySection() {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPools = async () => {
      try {
        setIsLoading(true);

        // Mock pool data
        const mockPools: PoolInfo[] = [
          {
            id: '1',
            token0: 'SEL',
            token1: 'USDT',
            tvl: 2500000,
            apr: 12.5,
            yourLiquidity: 50000
          },
          {
            id: '2',
            token0: 'SEL',
            token1: 'USDC',
            tvl: 1800000,
            apr: 11.8,
            yourLiquidity: 25000
          }
        ];

        setPools(mockPools);
      } catch (error) {
        console.error('Failed to load pools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPools();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton variant="list" lines={3} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Liquidity Pools</h2>

      <div className="space-y-4">
        {pools.map((pool) => (
          <div key={pool.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{pool.token0}/{pool.token1}</span>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {pool.apr}% APR
                </span>
              </div>
              <div className="text-sm text-gray-500">
                TVL: ${(pool.tvl / 1000000).toFixed(2)}M
              </div>
            </div>

            {pool.yourLiquidity && (
              <div className="text-sm text-gray-600">
                Your Position: ${pool.yourLiquidity.toLocaleString()}
              </div>
            )}

            <div className="flex space-x-2 mt-3">
              <button className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                Add Liquidity
              </button>
              <button className="flex-1 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50">
                Remove Liquidity
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Staking Section Component
 */
function StakingSection() {
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStakingInfo = async () => {
      try {
        setIsLoading(true);

        // Mock staking data
        const mockStakingInfo: StakingInfo = {
          totalStaked: '500000000000000000000',
          rewards: '25000000000000000000',
          apr: 15.5,
          unlockTime: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days from now
        };

        setStakingInfo(mockStakingInfo);
      } catch (error) {
        console.error('Failed to load staking info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStakingInfo();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton variant="card" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Staking</h2>

      {stakingInfo && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatBalance({ balance: stakingInfo.totalStaked, decimals: 18, symbol: 'SEL' } as any)}
              </div>
              <div className="text-sm text-gray-600">Total Staked</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatBalance({ balance: stakingInfo.rewards, decimals: 18, symbol: 'SEL' } as any)}
              </div>
              <div className="text-sm text-gray-600">Rewards</div>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-lg font-semibold text-green-600">
              {stakingInfo.apr}% APR
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stake Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0 SEL"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                Stake
              </button>
              <button className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
                Unstake
              </button>
            </div>
          </div>

          {stakingInfo.unlockTime && (
            <div className="text-sm text-gray-500 text-center">
              Next unlock: {formatTimestamp(stakingInfo.unlockTime, { relative: true })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Activity Feed Component
 */
function ActivityFeed() {
  const { events } = useEvents({
    realTime: true,
    maxEvents: 10
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>

      {events.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No recent activity
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-sm">{event.name}</div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(event.timestamp, { relative: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main DeFi Dashboard Component
 */
export function DeFiDashboard({
  defaultAddress,
  showPortfolio = true,
  showTrading = true,
  showLiquidity = true,
  showStaking = true,
  className,
  style
}: DeFiDashboardTemplateProps): JSX.Element {
  const { isConnected, chainType, account } = useSelendraSDK();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Selendra DeFi Dashboard</h1>
          <p className="text-center text-gray-600 mb-8">
            Connect your wallet to access DeFi features on Selendra
          </p>
          <div className="flex justify-center">
            <WalletConnector
              buttonLabel="Connect Wallet"
              variant="primary"
              size="lg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className || ''}`} style={style}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Selendra DeFi</h1>
              <span className="text-sm text-gray-500">
                {getChainDisplayName(chainType!)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectionStatus compact />
              <div className="text-sm text-gray-600">
                {formatAddress(account?.address || '')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {showPortfolio && account && <PortfolioSection account={account} />}

            {showTrading && <TradingSection />}

            {showLiquidity && <LiquiditySection />}

            {showStaking && <StakingSection />}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ActivityFeed />

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">24h Volume</span>
                  <span className="font-semibold">$5.2M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total TVL</span>
                  <span className="font-semibold">$125.8M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Pools</span>
                  <span className="font-semibold">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">24h Trades</span>
                  <span className="font-semibold">8,432</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Complete DeFi Dashboard with Providers
 */
export function DeFiDashboardApp(props: DeFiDashboardTemplateProps): JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SelendraProvider
          initialConfig={{
            chainType: 'substrate',
            endpoint: 'wss://rpc.selendra.org'
          }}
          autoConnect={false}
        >
          <DeFiDashboard {...props} />
        </SelendraProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default DeFiDashboardApp;