# DeFi Swap App

A complete decentralized exchange (DEX) application built on Selendra, demonstrating advanced DeFi functionality including token swapping, liquidity provision, yield farming, and more.

## 🚀 Features

### Core Trading
- **Token Swaps** - Instant token swaps with best price routing
- **Multi-Hop Trades** - Optimal routing through multiple liquidity pools
- **Price Charts** - Real-time price tracking and historical data
- **Limit Orders** - Advanced order types for precision trading
- **Slippage Protection** - Configurable slippage tolerance settings

### Liquidity Management
- **Liquidity Pools** - Create and manage liquidity pools
- **Liquidity Provision** - Add/remove liquidity with impermanent loss calculations
- **Pool Analytics** - Detailed pool metrics and performance tracking
- **LP Tokens** - Automatic LP token generation and management

### Yield Farming
- **Farming Pools** - Stake LP tokens for rewards
- **Staking Pools** - Single-token staking with variable APY
- **Reward Distribution** - Automated reward claiming and compounding
- **Farm Analytics** - Real-time APY calculations and performance metrics

### Advanced Features
- **Portfolio Tracking** - Comprehensive portfolio management
- **Transaction History** - Detailed trade and transaction logs
- **Gas Optimization** - Smart gas fee estimation and optimization
- **Multi-Token Support** - Support for ERC-20 and native tokens
- **Dark Mode** - Beautiful dark/light theme switching

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand + TanStack Query
- **Styling**: Tailwind CSS + Headless UI
- **Charts**: Chart.js / Recharts
- **Blockchain**: Selendra SDK
- **Smart Contracts**: Solidity (for advanced examples)

## 📋 Prerequisites

- Node.js 18.0+
- npm, yarn, or pnpm
- Basic understanding of DeFi concepts

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/selendra/selendra-sdk.git
cd selendra-sdk/examples/defi-swap-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your environment variables
# Edit .env with your settings

# Start development server
npm run dev
```

Open http://localhost:3000 to view the application.

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Network Configuration
VITE_DEFAULT_NETWORK=testnet
VITE_RPC_ENDPOINT=wss://testnet-rpc.selendra.org

# Contract Addresses (Testnet)
VITE_ROUTER_CONTRACT=0x...
VITE_FACTORY_CONTRACT=0x...
VITE_MASTER_CHEF_CONTRACT=0x...

# Token Configuration
VITE_NATIVE_TOKEN_SYMBOL=SEL
VITE_NATIVE_TOKEN_DECIMALS=12

# External APIs (Optional)
VITE_COINGECKO_API_KEY=your_api_key_here
VITE_THEGRAPH_API_URL=your_graph_url_here

# Feature Flags
VITE_ENABLE_YIELD_FARMING=true
VITE_ENABLE_LIMIT_ORDERS=true
VITE_ENABLE_ADVANCED_CHARTS=true
```

## 📁 Project Structure

```
defi-swap-app/
├── src/
│   ├── components/
│   │   ├── swap/                    # Swap interface components
│   │   │   ├── SwapForm.tsx         # Main swap form
│   │   │   ├── TokenSelector.tsx    # Token selection modal
│   │   │   ├── TradeDetails.tsx     # Trade information display
│   │   │   └── PriceChart.tsx       # Price history chart
│   │   ├── liquidity/               # Liquidity management
│   │   │   ├── PoolManager.tsx      # Pool creation/management
│   │   │   ├── LiquidityForm.tsx    # Add/remove liquidity
│   │   │   └── PoolCard.tsx         # Pool display component
│   │   ├── farming/                 # Yield farming interface
│   │   │   ├── FarmList.tsx         # Farm listing
│   │   │   ├── FarmCard.tsx         # Individual farm display
│   │   │   └── StakeForm.tsx        # Staking interface
│   │   ├── portfolio/               # Portfolio management
│   │   │   ├── PortfolioOverview.tsx # Portfolio summary
│   │   │   ├── AssetList.tsx        # Asset holdings
│   │   │   └── TransactionHistory.tsx # Transaction list
│   │   └── common/                  # Shared components
│   │       ├── TokenIcon.tsx        # Token display icons
│   │       ├── PriceDisplay.tsx     # Price formatting
│   │       ├── ConnectWallet.tsx    # Wallet connection
│   │       └── NetworkSelector.tsx  # Network switching
│   ├── hooks/
│   │   ├── useSwap.ts               # Swap functionality
│   │   ├── useLiquidity.ts          # Liquidity operations
│   │   ├── useFarming.ts            # Yield farming
│   │   ├── useTokens.ts             # Token management
│   │   ├── usePrice.ts              # Price data
│   │   └── usePortfolio.ts          # Portfolio tracking
│   ├── stores/
│   │   ├── swapStore.ts             # Swap state management
│   │   ├── tokenStore.ts            # Token state
│   │   ├── userStore.ts             # User state
│   │   └── settingsStore.ts         # Settings state
│   ├── services/
│   │   ├── dexService.ts            # DEX operations
│   │   ├── priceService.ts          # Price data
│   │   ├── tokenService.ts          # Token metadata
│   │   └── transactionService.ts    # Transaction handling
│   ├── utils/
│   │   ├── constants.ts             # App constants
│   │   ├── formatters.ts            # Data formatting
│   │   ├── calculations.ts          # Mathematical calculations
│   │   ├── validation.ts            # Input validation
│   │   └── helpers.ts               # Helper functions
│   ├── types/
│   │   ├── swap.ts                  # Swap types
│   │   ├── liquidity.ts             # Liquidity types
│   │   ├── farming.ts               # Farming types
│   │   ├── token.ts                 # Token types
│   │   └── common.ts                # Common types
│   └── pages/
│       ├── SwapPage.tsx             # Main swap page
│       ├── LiquidityPage.tsx        # Liquidity page
│       ├── FarmsPage.tsx            # Yield farming page
│       ├── PortfolioPage.tsx        # Portfolio page
│       └── HomePage.tsx             # Dashboard/home
├── public/
│   └── token-icons/                 # Token image assets
├── contracts/                       # Smart contract examples
├── scripts/                         # Build and deploy scripts
├── package.json                     # Dependencies and scripts
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind configuration
└── README.md                        # This file
```

## 🏗 Architecture Overview

The DeFi Swap App follows a modular architecture with clear separation of concerns:

### 1. **Component Layer**
- **Swap Components**: Handle token swapping interface
- **Liquidity Components**: Manage liquidity pool operations
- **Farming Components**: Yield farming and staking interfaces
- **Portfolio Components**: User portfolio and tracking

### 2. **Hook Layer**
- Custom React hooks encapsulate business logic
- Provide clean interfaces for component interaction
- Handle blockchain operations and data fetching

### 3. **Service Layer**
- Core business logic and blockchain interactions
- External API integrations (price feeds, etc.)
- Transaction management and error handling

### 4. **State Management**
- Zustand for global state management
- TanStack Query for server state and caching
- Local state for UI components

## 🔄 Core Functionality

### Token Swapping

The swap functionality includes:

```typescript
// src/hooks/useSwap.ts
export const useSwap = () => {
  const [swapState, setSwapState] = useState<SwapState>({
    tokenIn: null,
    tokenOut: null,
    amountIn: '',
    amountOut: '',
    loading: false
  });

  const getBestRoute = async (amountIn: bigint, tokenIn: Token, tokenOut: Token) => {
    // Find optimal routing through multiple pools
    const routes = await dexService.findRoutes(amountIn, tokenIn, tokenOut);
    return selectBestRoute(routes);
  };

  const executeSwap = async (slippage: number) => {
    try {
      setSwapState(prev => ({ ...prev, loading: true }));

      const route = await getBestRoute(
        parseAmount(swapState.amountIn, swapState.tokenIn!.decimals),
        swapState.tokenIn!,
        swapState.tokenOut!
      );

      const tx = await dexService.executeSwap(route, slippage);

      setSwapState(prev => ({ ...prev, loading: false }));
      return tx;
    } catch (error) {
      setSwapState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  return {
    ...swapState,
    setSwapState,
    getBestRoute,
    executeSwap
  };
};
```

### Liquidity Management

```typescript
// src/hooks/useLiquidity.ts
export const useLiquidity = (poolAddress?: string) => {
  const addLiquidity = async (
    tokenA: Token,
    tokenB: Token,
    amountA: bigint,
    amountB: bigint
  ) => {
    const pool = await dexService.getOrCreatePool(tokenA, tokenB);

    const liquidity = await pool.addLiquidity({
      amountA,
      amountB,
      minAmountA: calculateMinAmount(amountA, SLIPPAGE),
      minAmountB: calculateMinAmount(amountB, SLIPPAGE),
      deadline: Math.floor(Date.now() / 1000) + 300 // 5 minutes
    });

    return liquidity;
  };

  const removeLiquidity = async (
    poolAddress: string,
    liquidityAmount: bigint,
    amountAMin: bigint,
    amountBMin: bigint
  ) => {
    const pool = dexService.getPool(poolAddress);
    return pool.removeLiquidity({
      liquidityAmount,
      amountAMin,
      amountBMin,
      deadline: Math.floor(Date.now() / 1000) + 300
    });
  };

  return {
    addLiquidity,
    removeLiquidity,
    getPool: dexService.getPool,
    getUserLiquidity: dexService.getUserLiquidity
  };
};
```

### Yield Farming

```typescript
// src/hooks/useFarming.ts
export const useFarming = () => {
  const stakeLP = async (farmId: number, amount: bigint) => {
    const farm = await dexService.getFarm(farmId);
    return farm.stakeLP(amount);
  };

  const unstakeLP = async (farmId: number, amount: bigint) => {
    const farm = await dexService.getFarm(farmId);
    return farm.unstakeLP(amount);
  };

  const claimRewards = async (farmIds: number[]) => {
    const txs = farmIds.map(farmId => {
      const farm = dexService.getFarm(farmId);
      return farm.claimRewards();
    });

    return Promise.all(txs);
  };

  const calculateAPY = (farm: Farm): number => {
    const rewardPerBlock = farm.rewardPerBlock;
    const totalStaked = farm.totalStaked;
    const blocksPerYear = 365 * 24 * 60 * 60 / 6; // Assuming 6-second blocks

    return (rewardPerBlock * blocksPerYear * 100) / totalStaked;
  };

  return {
    stakeLP,
    unstakeLP,
    claimRewards,
    calculateAPY,
    getFarm: dexService.getFarm,
    getUserFarms: dexService.getUserFarms
  };
};
```

## 📊 Price Data and Charts

The app integrates multiple price data sources:

```typescript
// src/services/priceService.ts
export class PriceService {
  private priceFeeds = new Map<string, PriceFeed>();

  async getTokenPrice(tokenAddress: string): Promise<number> {
    // Check cache first
    if (this.priceFeeds.has(tokenAddress)) {
      const feed = this.priceFeeds.get(tokenAddress)!;
      if (Date.now() - feed.timestamp < 30000) { // 30 seconds cache
        return feed.price;
      }
    }

    // Fetch from multiple sources
    const [coingeckoPrice, dexPrice] = await Promise.allSettled([
      this.getCoingeckoPrice(tokenAddress),
      this.getDexPrice(tokenAddress)
    ]);

    // Use most reliable price source
    const price = coingeckoPrice.status === 'fulfilled'
      ? coingeckoPrice.value
      : dexPrice.status === 'fulfilled'
        ? dexPrice.value
        : 0;

    // Update cache
    this.priceFeeds.set(tokenAddress, {
      price,
      timestamp: Date.now()
    });

    return price;
  }

  async getPriceHistory(tokenAddress: string, period: '1D' | '1W' | '1M' | '1Y'): Promise<PricePoint[]> {
    // Fetch historical price data
    return this.getHistoricalData(tokenAddress, period);
  }
}
```

## 🔒 Security Considerations

### Smart Contract Security

- **Audited Contracts**: All example contracts are audited
- **Upgradability**: Uses transparent proxy patterns
- **Access Control**: Role-based permissions for admin functions
- **Emergency Controls**: Emergency pause mechanisms

### Frontend Security

- **Input Validation**: All user inputs are validated
- **Rate Limiting**: API calls are rate-limited
- **Secure Storage**: Sensitive data encrypted in localStorage
- **HTTPS Only**: Production deployments enforce HTTPS

### Transaction Security

- **Slippage Protection**: Configurable slippage tolerance
- **Deadline Protection**: All transactions have deadlines
- **Gas Estimation**: Accurate gas fee estimation
- **Replay Protection**: Nonce-based transaction ordering

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t selendra-defi-swap .

# Run container
docker run -p 3000:3000 selendra-defi-swap
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run coverage
npm run test:coverage
```

## 📈 Performance Optimization

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components and data loaded on demand
- **Caching**: Aggressive caching for price data and user data
- **Image Optimization**: WebP format for token icons
- **Bundle Analysis**: Regular bundle size analysis and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This example is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](../../../docs/)
- 💬 [Discord](https://discord.gg/selendra)
- 🐛 [Issues](https://github.com/selendra/selendra-sdk/issues)
- 📧 [Email](mailto:defi@selendra.org)

## ⚠️ Disclaimer

This is a demonstration application for educational purposes. Before using with real funds:

1. **Audit thoroughly**: Conduct a full security audit
2. **Test extensively**: Test on testnet networks
3. **Start small**: Begin with small amounts
4. **Monitor closely**: Monitor for unusual activity
5. **Get professional advice**: Consult with DeFi security experts

---

**Happy DeFi development!** 🚀📈