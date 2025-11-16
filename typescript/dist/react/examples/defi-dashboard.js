"use strict";
/**
 * DeFi Dashboard Template
 *
 * A comprehensive DeFi dashboard template that showcases portfolio tracking,
 * trading interface, liquidity management, and staking features on Selendra.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeFiDashboard = DeFiDashboard;
exports.DeFiDashboardApp = DeFiDashboardApp;
const react_1 = __importStar(require("react"));
const components_1 = require("../components");
const hooks_1 = require("../hooks");
const utils_1 = require("../utils");
/**
 * Portfolio Section Component
 */
function PortfolioSection({ account }) {
    const [tokens, setTokens] = (0, react_1.useState)([]);
    const [totalValue, setTotalValue] = (0, react_1.useState)(0);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const loadPortfolio = async () => {
            try {
                setIsLoading(true);
                // Mock portfolio data - in real app, this would come from your backend or API calls
                const mockTokens = [
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
            }
            catch (error) {
                console.error('Failed to load portfolio:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadPortfolio();
    }, [account]);
    if (isLoading) {
        return (<div className="space-y-4">
        <components_1.LoadingSkeleton variant="card"/>
        <components_1.LoadingSkeleton variant="list" lines={3}/>
      </div>);
    }
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Portfolio</h2>

      <div className="mb-6">
        <div className="text-3xl font-bold text-green-600">
          ${totalValue.toLocaleString()}
        </div>
        <div className="text-gray-500">Total Portfolio Value</div>
      </div>

      <div className="space-y-4">
        {tokens.map((token, index) => (<div key={index} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">{token.symbol[0]}</span>
              </div>
              <div>
                <div className="font-semibold">{token.symbol}</div>
                <div className="text-sm text-gray-500">
                  {(0, utils_1.formatBalance)({ balance: token.balance, symbol: token.symbol, decimals: token.decimals })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">${token.usdValue.toLocaleString()}</div>
              <div className={`text-sm ${token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h}%
              </div>
            </div>
          </div>))}
      </div>
    </div>);
}
/**
 * Trading Section Component
 */
function TradingSection() {
    const [fromToken, setFromToken] = (0, react_1.useState)('SEL');
    const [toToken, setToToken] = (0, react_1.useState)('USDT');
    const [fromAmount, setFromAmount] = (0, react_1.useState)('');
    const [toAmount, setToAmount] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const tokens = ['SEL', 'USDT', 'USDC', 'ETH', 'WBTC'];
    const handleSwap = async () => {
        try {
            setIsLoading(true);
            // Implement swap logic here
            console.log('Swapping', fromAmount, fromToken, 'to', toToken, toAmount);
        }
        catch (error) {
            console.error('Swap failed:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Swap</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="flex space-x-2">
            <select value={fromToken} onChange={(e) => setFromToken(e.target.value)} className="flex-shrink-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {tokens.map(token => (<option key={token} value={token}>{token}</option>))}
            </select>
            <input type="number" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} placeholder="0.0" className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>

        <div className="flex justify-center">
          <button className="p-2 bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="flex space-x-2">
            <select value={toToken} onChange={(e) => setToToken(e.target.value)} className="flex-shrink-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {tokens.map(token => (<option key={token} value={token}>{token}</option>))}
            </select>
            <input type="number" value={toAmount} onChange={(e) => setToAmount(e.target.value)} placeholder="0.0" className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>

        <button onClick={handleSwap} disabled={isLoading || !fromAmount} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
          {isLoading ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </div>);
}
/**
 * Liquidity Section Component
 */
function LiquiditySection() {
    const [pools, setPools] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const loadPools = async () => {
            try {
                setIsLoading(true);
                // Mock pool data
                const mockPools = [
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
            }
            catch (error) {
                console.error('Failed to load pools:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadPools();
    }, []);
    if (isLoading) {
        return <components_1.LoadingSkeleton variant="list" lines={3}/>;
    }
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Liquidity Pools</h2>

      <div className="space-y-4">
        {pools.map((pool) => (<div key={pool.id} className="border rounded-lg p-4">
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

            {pool.yourLiquidity && (<div className="text-sm text-gray-600">
                Your Position: ${pool.yourLiquidity.toLocaleString()}
              </div>)}

            <div className="flex space-x-2 mt-3">
              <button className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                Add Liquidity
              </button>
              <button className="flex-1 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50">
                Remove Liquidity
              </button>
            </div>
          </div>))}
      </div>
    </div>);
}
/**
 * Staking Section Component
 */
function StakingSection() {
    const [stakingInfo, setStakingInfo] = (0, react_1.useState)(null);
    const [amount, setAmount] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const loadStakingInfo = async () => {
            try {
                setIsLoading(true);
                // Mock staking data
                const mockStakingInfo = {
                    totalStaked: '500000000000000000000',
                    rewards: '25000000000000000000',
                    apr: 15.5,
                    unlockTime: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days from now
                };
                setStakingInfo(mockStakingInfo);
            }
            catch (error) {
                console.error('Failed to load staking info:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadStakingInfo();
    }, []);
    if (isLoading) {
        return <components_1.LoadingSkeleton variant="card"/>;
    }
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Staking</h2>

      {stakingInfo && (<div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(0, utils_1.formatBalance)({ balance: stakingInfo.totalStaked, decimals: 18, symbol: 'SEL' })}
              </div>
              <div className="text-sm text-gray-600">Total Staked</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(0, utils_1.formatBalance)({ balance: stakingInfo.rewards, decimals: 18, symbol: 'SEL' })}
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
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0 SEL" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
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

          {stakingInfo.unlockTime && (<div className="text-sm text-gray-500 text-center">
              Next unlock: {(0, utils_1.formatTimestamp)(stakingInfo.unlockTime, { relative: true })}
            </div>)}
        </div>)}
    </div>);
}
/**
 * Activity Feed Component
 */
function ActivityFeed() {
    const { events } = (0, hooks_1.useEvents)({
        realTime: true,
        maxEvents: 10
    });
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>

      {events.length === 0 ? (<div className="text-center text-gray-500 py-8">
          No recent activity
        </div>) : (<div className="space-y-3">
          {events.map((event, index) => (<div key={index} className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-sm">{event.name}</div>
                <div className="text-xs text-gray-500">
                  {(0, utils_1.formatTimestamp)(event.timestamp, { relative: true })}
                </div>
              </div>
            </div>))}
        </div>)}
    </div>);
}
/**
 * Main DeFi Dashboard Component
 */
function DeFiDashboard({ defaultAddress, showPortfolio = true, showTrading = true, showLiquidity = true, showStaking = true, className, style }) {
    const { isConnected, chainType, account } = (0, hooks_1.useSelendraSDK)();
    if (!isConnected) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Selendra DeFi Dashboard</h1>
          <p className="text-center text-gray-600 mb-8">
            Connect your wallet to access DeFi features on Selendra
          </p>
          <div className="flex justify-center">
            <components_1.WalletConnector buttonLabel="Connect Wallet" variant="primary" size="lg"/>
          </div>
        </div>
      </div>);
    }
    return (<div className={`min-h-screen bg-gray-50 ${className || ''}`} style={style}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Selendra DeFi</h1>
              <span className="text-sm text-gray-500">
                {(0, utils_1.getChainDisplayName)(chainType)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <components_1.ConnectionStatus compact/>
              <div className="text-sm text-gray-600">
                {(0, utils_1.formatAddress)(account?.address || '')}
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
            {showPortfolio && account && <PortfolioSection account={account}/>}

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
    </div>);
}
/**
 * Complete DeFi Dashboard with Providers
 */
function DeFiDashboardApp(props) {
    return (<components_1.ErrorBoundary>
      <components_1.ThemeProvider>
        <components_1.SelendraProvider initialConfig={{
            chainType: 'substrate',
            endpoint: 'wss://rpc.selendra.org'
        }} autoConnect={false}>
          <DeFiDashboard {...props}/>
        </components_1.SelendraProvider>
      </components_1.ThemeProvider>
    </components_1.ErrorBoundary>);
}
exports.default = DeFiDashboardApp;
//# sourceMappingURL=defi-dashboard.js.map