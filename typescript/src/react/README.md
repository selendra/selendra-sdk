# Selendra SDK React Integration 🚀

The official React integration for the Selendra blockchain SDK. Build amazing dApps on Selendra with premium React hooks, components, utilities, and production-ready templates.

## ✨ Features

- 🚀 **Comprehensive React Hooks** - Automatic reactivity, real-time updates, and error handling
- 🎨 **Beautiful UI Components** - Wallet connectors, transaction buttons, balance displays, and more
- 🔧 **Developer Utilities** - Formatters, validators, error handlers, and helper functions
- 📱 **Production-Ready Templates** - DeFi dashboard, NFT marketplace, wallet app, and governance dApp
- 🛡️ **Full TypeScript Support** - Complete type safety with IntelliSense
- ♿ **Accessibility & Performance** - Optimized for all users and devices
- 🌙 **Theme System** - Built-in dark/light mode support
- 🔄 **Real-time Subscriptions** - Live blockchain events and state updates

## 📦 Installation

```bash
npm install @selendrajs/sdk react
# or
yarn add @selendrajs/sdk react
```

## 🚀 Quick Start

### 1. Basic Setup

```tsx
import { SelendraProvider, useSelendraSDK, useBalance } from '@selendrajs/sdk/react';

function App() {
  return (
    <SelendraProvider
      initialConfig={{
        chainType: 'substrate',
        endpoint: 'wss://rpc.selendra.org'
      }}
      autoConnect={false}
    >
      <MyDApp />
    </SelendraProvider>
  );
}

function MyDApp() {
  const { isConnected, connect, account } = useSelendraSDK();
  const { balance, formatted, isLoading } = useBalance();

  if (!isConnected) {
    return <button onClick={() => connect()}>Connect Wallet</button>;
  }

  return (
    <div>
      <h1>Welcome, {formatAddress(account.address, 6)}!</h1>
      {isLoading ? (
        <div>Loading balance...</div>
      ) : (
        <div>Balance: {formatted.native}</div>
      )}
    </div>
  );
}
```

### 2. Using Components

```tsx
import {
  WalletConnector,
  BalanceDisplay,
  TransactionButton,
  ConnectionStatus
} from '@selendrajs/sdk/react';

function MyComponent() {
  const myTransaction = {
    to: '0x1234567890abcdef...',
    value: '1000000000000000000'
  };

  return (
    <div>
      <WalletConnector
        wallets={['metamask', 'subwallet', 'talisman']}
        onConnect={(account) => console.log('Connected:', account)}
      />

      <BalanceDisplay
        showUSD
        showSymbol
        decimals={4}
      />

      <ConnectionStatus
        showChain
        showAddress
        compact
      />

      <TransactionButton
        transaction={myTransaction}
        label="Send 1 SEL"
        onSuccess={(tx) => console.log('Success!', tx)}
        onError={(error) => console.error('Error:', error)}
      />
    </div>
  );
}
```

### 3. Advanced Hook Usage

```tsx
import {
  useSelendraSDK,
  useAccount,
  useEvents,
  useContract,
  useBlockSubscription
} from '@selendrajs/sdk/react';

function AdvancedComponent() {
  const { sdk, chainType } = useSelendraSDK();
  const { account, transactions, refresh } = useAccount({
    includeHistory: true,
    historyLimit: 50
  });

  const { events, subscribe, count } = useEvents({
    realTime: true,
    maxEvents: 100,
    filters: { contract: '0x123...' }
  });

  const { blockNumber, timestamp } = useBlockSubscription({
    autoSubscribe: true
  });

  const { contract, read, write, isLoading } = useContract(
    '0x1234567890abcdef...',
    {
      abi: contractABI,
      autoLoad: true
    }
  );

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      console.log('New event:', event);
      // Handle new event (e.g., show notification)
    });

    return unsubscribe;
  }, [subscribe]);

  const handleContractRead = async () => {
    const balance = await read('getBalance', account.address);
    console.log('Contract balance:', balance);
  };

  const handleContractWrite = async () => {
    const tx = await write('transfer', '0x456...', '1000000000000000000');
    console.log('Transaction:', tx);
  };

  return (
    <div>
      <div>Current Block: {blockNumber}</div>
      <div>Total Events: {count}</div>
      <button onClick={handleContractRead} disabled={isLoading}>
        Read Contract
      </button>
      <button onClick={handleContractWrite} disabled={isLoading}>
        Send Transaction
      </button>
    </div>
  );
}
```

## 🎯 Production Templates

### DeFi Dashboard

```tsx
import { DeFiDashboard } from '@selendrajs/sdk/react';

function MyDeFiApp() {
  return (
    <DeFiDashboard
      showPortfolio={true}
      showTrading={true}
      showLiquidity={true}
      showStaking={true}
    />
  );
}
```

### NFT Marketplace

```tsx
import { NFTMarketplace } from '@selendrajs/sdk/react';

function MyNFTMarketplace() {
  return (
    <NFTMarketplace
      collectionAddress="0x1234567890abcdef..."
      showGallery={true}
      showList={true}
      enableFilters={true}
      itemsPerPage={20}
    />
  );
}
```

### Wallet Application

```tsx
import { WalletApp } from '@selendrajs/sdk/react';

function MyWallet() {
  return (
    <WalletApp
      showSend={true}
      showReceive={true}
      showHistory={true}
      showSettings={true}
    />
  );
}
```

### Governance dApp

```tsx
import { GovernanceDApp } from '@selendrajs/sdk/react';

function MyGovernance() {
  return (
    <GovernanceDApp
      showProposals={true}
      showVoting={true}
      showTreasury={true}
      showCouncil={true}
    />
  );
}
```

## 🛠️ Utility Functions

```tsx
import {
  formatBalance,
  formatAddress,
  validateAddress,
  copyToClipboard,
  formatTimestamp,
  getExplorerUrl
} from '@selendrajs/sdk/react';

// Format balance for display
const formatted = formatBalance(balance, {
  decimals: 4,
  showCommas: true,
  includeUSD: true
});

// Validate addresses
const validation = validateAddress('0x123...', 'substrate');
if (validation.isValid) {
  console.log('Address is valid');
} else {
  console.log('Errors:', validation.errors);
}

// Copy to clipboard
await copyToClipboard(address);

// Format timestamps
const timeAgo = formatTimestamp(Date.now() - 3600000, { relative: true }); // "1 hour ago"

// Get explorer URLs
const explorerLink = getExplorerUrl('substrate', '0x123...');
```

## 🎨 Theming

```tsx
import { ThemeProvider } from '@selendrajs/sdk/react';

const customTheme = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    foreground: '#111827'
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif'
  }
};

function App() {
  return (
    <ThemeProvider
      theme={customTheme}
      defaultMode="light"
      enableSystem={true}
    >
      <YourApp />
    </ThemeProvider>
  );
}
```

## 🔧 Configuration Options

### SelendraProvider

```tsx
<SelendraProvider
  initialConfig={{
    chainType: 'substrate', // 'substrate' | 'evm' | 'unified'
    endpoint: 'wss://rpc.selendra.org',
    walletType: 'auto' // or specific wallet type
  }}
  autoConnect={true} // Auto-connect on mount
  errorFallback={({ error, retry }) => (
    <ErrorDisplay error={error} onRetry={retry} />
  )}
  loadingFallback={() => <LoadingSpinner />}
/>
```

### Hook Options

```tsx
// Balance hook with custom options
const { balance, formatted } = useBalance(address, {
  refreshInterval: 10000, // 10 seconds
  includeUSD: true,
  includeMetadata: true,
  realTime: true
});

// Account hook with history
const { account, transactions } = useAccount({
  includeBalance: true,
  includeHistory: true,
  historyLimit: 100,
  refreshInterval: 15000
});

// Event subscription with filters
const { events, subscribe } = useEvents({
  filters: {
    contract: '0x123...',
    name: 'Transfer',
    fromBlock: 12345,
    address: '0x456...'
  },
  realTime: true,
  maxEvents: 1000,
  autoPurge: true
});
```

## 🔄 Next.js Integration

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { SelendraProvider, ThemeProvider } from '@selendrajs/sdk/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <SelendraProvider
        initialConfig={{
          chainType: 'substrate',
          endpoint: process.env.NEXT_PUBLIC_SELENDRA_RPC || 'wss://rpc.selendra.org'
        }}
        autoConnect={false}
      >
        <Component {...pageProps} />
      </SelendraProvider>
    </ThemeProvider>
  );
}

// pages/index.tsx
import { DeFiDashboard } from '@selendrajs/sdk/react';

export default function HomePage() {
  return <DeFiDashboard />;
}
```

## 🎯 Best Practices

### 1. Error Handling

```tsx
function MyComponent() {
  const { isConnected, error } = useSelendraSDK();

  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Rest of component
}
```

### 2. Loading States

```tsx
function BalanceComponent() {
  const { balance, isLoading, error } = useBalance();

  if (isLoading) {
    return <LoadingSkeleton variant="text" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return <div>{formatBalance(balance)}</div>;
}
```

### 3. Performance Optimization

```tsx
// Use specific refresh intervals to balance real-time updates and performance
const { balance } = useBalance(address, {
  refreshInterval: 30000 // 30 seconds for less critical data
});

// Cleanup subscriptions
useEffect(() => {
  const unsubscribe = subscribe(callback);
  return () => unsubscribe();
}, [subscribe]);
```

### 4. TypeScript Usage

```tsx
interface MyComponentProps {
  contractAddress: `0x${string}`;
}

function MyComponent({ contractAddress }: MyComponentProps) {
  const { contract, read } = useContract(contractAddress);

  const getBalance = async () => {
    const balance: string = await read('balanceOf', address);
    return balance;
  };
}
```

## 📚 API Reference

### Hooks

- **useSelendraSDK()** - Main SDK hook with connection management
- **useBalance(address?, options?)** - Real-time balance tracking
- **useAccount(options?)** - Account management and transaction history
- **useTransaction(options?)** - Transaction submission and tracking
- **useContract(address, options?)** - Smart contract interaction
- **useEvents(options?)** - Real-time event subscriptions
- **useBlockSubscription(options?)** - Latest block tracking
- **useTheme()** - Theme system access

### Components

- **SelendraProvider** - Context provider for SDK access
- **WalletConnector** - Multi-wallet connection interface
- **BalanceDisplay** - Formatted balance display
- **TransactionButton** - One-click transaction execution
- **ConnectionStatus** - Visual connection status indicator
- **EventList** - Real-time event display
- **ThemeProvider** - Theme context provider
- **ErrorBoundary** - React error boundary
- **LoadingSkeleton** - Loading state components

### Utilities

- **formatBalance(balance, options?)** - Balance formatting
- **formatAddress(address, length?)** - Address truncation
- **formatTimestamp(timestamp, options?)** - Date/time formatting
- **validateAddress(address, chainType)** - Address validation
- **validateAmount(amount, balance)** - Amount validation
- **copyToClipboard(text)** - Clipboard utility
- **getExplorerUrl(chainType, hash)** - Explorer URL generation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://docs.selendra.org/sdk/react)
- 💬 [Discord Community](https://discord.gg/selendra)
- 🐛 [Issue Tracker](https://github.com/selendra/selendra-sdk/issues)
- 📧 [Email Support](mailto:dev-support@selendra.org)

---

**Built with ❤️ by the Selendra Development Team**

Happy building on Selendra! 🚀