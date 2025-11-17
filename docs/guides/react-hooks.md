# React Hooks and Components

 React integration for Selendra SDK with 15 production-ready hooks and UI components.

** Status:** 100%  and production-ready

## Installation

```bash
npm install @selendrajs/sdk react
```

## Provider Setup

Wrap your app with `SelendraProvider`:

```tsx
import React from 'react';
import { SelendraProvider } from '@selendrajs/sdk/react';

function App() {
  return (
    <SelendraProvider endpoint="wss://rpc.selendra.org">
      <MyApp />
    </SelendraProvider>
  );
}
```

## Core Hooks

### useSelendra()

Main SDK connection and state management.

```tsx
import { useSelendra } from '@selendrajs/sdk/react';

function MyComponent() {
  const {
    sdk,
    isConnected,
    isConnecting,
    error,
    network,
    connect,
    disconnect
  } = useSelendra();

  if (isConnecting) return <div>Connecting...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Network: {network}</p>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

### useAccount()

Account management and wallet connection.

```tsx
import { useAccount } from '@selendrajs/sdk/react';

function WalletConnect() {
  const {
    account,
    accounts,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    createAccount,
    switchAccount
  } = useAccount();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {account?.address}</p>
          <button onClick={disconnect}>Disconnect</button>
          <button onClick={createAccount}>New Account</button>
        </div>
      ) : (
        <button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}
```

### useBalance(address)

Real-time balance tracking.

```tsx
import { useBalance } from '@selendrajs/sdk/react';

function BalanceDisplay({ address }: { address: string }) {
  const { balance, loading, error, formattedBalance } = useBalance(address);

  if (loading) return <div>Loading balance...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Balance: {formattedBalance} SEL</p>
      <p>Free: {balance?.free}</p>
      <p>Reserved: {balance?.reserved}</p>
    </div>
  );
}
```

### useTransaction()

Transaction preparation and submission.

```tsx
import { useTransaction } from '@selendrajs/sdk/react';

function TransferForm() {
  const { send, transaction, loading, error } = useTransaction();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleTransfer = async () => {
    try {
      const tx = await send({
        to: recipient,
        amount: BigInt(amount),
      });
      console.log('Transaction sent:', tx.hash);
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  return (
    <div>
      <input
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## Contract Interaction Hooks

### useContract(address, abi)

Smart contract interaction.

```tsx
import { useContract } from '@selendrajs/sdk/react';

function TokenContract({ address, abi }: { address: string; abi: any[] }) {
  const { contract, loading, error } = useContract(address, abi);

  const [balance, setBalance] = useState('0');

  const getTokenBalance = async (userAddress: string) => {
    if (!contract) return;

    try {
      const result = await contract.call('balanceOf', userAddress);
      setBalance(result.toString());
    } catch (err) {
      console.error('Failed to get balance:', err);
    }
  };

  return (
    <div>
      <h3>Token Contract</h3>
      <p>Balance: {balance}</p>
      <button onClick={() => getTokenBalance('0x...')}>
        Get Balance
      </button>
    </div>
  );
}
```

## Event and Data Hooks

### useEvents()

Real-time event subscription.

```tsx
import { useEvents } from '@selendrajs/sdk/react';

function EventMonitor() {
  const { events, subscribe, unsubscribe, loading } = useEvents();

  useEffect(() => {
    // Subscribe to transfer events
    const unsub = subscribe('transfer', (event) => {
      console.log('New transfer:', event);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h3>Recent Events</h3>
      {events.map((event, index) => (
        <div key={index}>
          <p>Type: {event.type}</p>
          <p>Data: {JSON.stringify(event.data)}</p>
        </div>
      ))}
    </div>
  );
}
```

### useBlockSubscription()

Real-time block updates.

```tsx
import { useBlockSubscription } from '@selendrajs/sdk/react';

function BlockTracker() {
  const { block, blockNumber, isSubscribed, subscribe, unsubscribe } = useBlockSubscription();

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h3>Latest Block</h3>
      <p>Block Number: {blockNumber}</p>
      <p>Hash: {block?.hash}</p>
      <p>Status: {isSubscribed ? 'Subscribed' : 'Not subscribed'}</p>
    </div>
  );
}
```

## Staking Hooks

### useStaking()

Staking operations and validator information.

```tsx
import { useStaking } from '@selendrajs/sdk/react';

function StakingPanel() {
  const {
    validators,
    nominators,
    stakingInfo,
    bond,
    nominate,
    unbond,
    loading
  } = useStaking();

  const handleBond = async (amount: string) => {
    try {
      await bond(amount, 'controller_address');
    } catch (error) {
      console.error('Bond failed:', error);
    }
  };

  return (
    <div>
      <h3>Staking Information</h3>
      <p>Active Validators: {validators?.length}</p>
      <p>Nominators: {nominators?.length}</p>

      <div>
        <h4>Bond Tokens</h4>
        <input placeholder="Amount" />
        <button onClick={() => handleBond('1000000000000')}>
          Bond
        </button>
      </div>
    </div>
  );
}
```

## UI Components

### WalletConnector

Pre-built wallet connection component.

```tsx
import { WalletConnector } from '@selendrajs/sdk/react';

function App() {
  return (
    <div>
      <WalletConnector
        onConnect={(account) => console.log('Connected:', account)}
        onDisconnect={() => console.log('Disconnected')}
      />
      <YourApp />
    </div>
  );
}
```

### BalanceDisplay

Formatted balance display component.

```tsx
import { BalanceDisplay } from '@selendrajs/sdk/react';

function WalletInfo({ address }: { address: string }) {
  return (
    <div>
      <h3>Wallet Balance</h3>
      <BalanceDisplay
        address={address}
        showDecimals={true}
        format="comma"
      />
    </div>
  );
}
```

### TransactionButton

Transaction submission button with loading states.

```tsx
import { TransactionButton } from '@selendrajs/sdk/react';

function SendButton() {
  return (
    <TransactionButton
      to="0xRecipientAddress"
      amount="1000000000000"
      onSuccess={(tx) => console.log('Success:', tx.hash)}
      onError={(error) => console.error('Error:', error)}
    >
      Send 1 SEL
    </TransactionButton>
  );
}
```

## Advanced Patterns

### Custom Hook Example

Create reusable hooks for your dApp:

```tsx
import { useBalance, useAccount } from '@selendrajs/sdk/react';

export function useWallet() {
  const { account, isConnected } = useAccount();
  const { balance, formattedBalance } = useBalance(account?.address);

  return {
    account,
    isConnected,
    balance,
    formattedBalance,
    hasBalance: balance && balance.free > 0,
  };
}

// Usage
function MyComponent() {
  const wallet = useWallet();

  return (
    <div>
      {wallet.isConnected ? (
        <p>Balance: {wallet.formattedBalance}</p>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </div>
  );
}
```

### Error Handling

Implement proper error boundaries:

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SelendraProvider>
        <MyApp />
      </SelendraProvider>
    </ErrorBoundary>
  );
}
```

## Performance Tips

1. **Memoize expensive operations** with `useMemo`
2. **Debounce user inputs** for balance checks
3. **Use React Query** for caching balance data
4. **Implement virtual scrolling** for large lists

```tsx
import { useMemo, useCallback } from 'react';

function OptimizedComponent({ address }: { address: string }) {
  const { balance } = useBalance(address);

  const formattedBalance = useMemo(() => {
    return balance ? (Number(balance.free) / 1e12).toFixed(4) : '0';
  }, [balance]);

  const handleTransfer = useCallback(async (amount: string) => {
    // Implementation
  }, []);

  return <div>Balance: {formattedBalance} SEL</div>;
}
```

## TypeScript Support

All hooks are fully typed:

```tsx
import { useAccount, Account } from '@selendrajs/sdk/react';

function TypedComponent() {
  const { account } = useAccount();

  // TypeScript knows account is Account | null
  if (account) {
    console.log(account.type); // 'substrate' | 'evm'
    console.log(account.address); // string
  }
}
```

## Examples Repository

 working examples are available at:
- [DeFi Dashboard](../../typescript/examples/defi-dashboard.tsx)
- [NFT Marketplace](../../typescript/examples/nft-marketplace.tsx)
- [Governance dApp](../../typescript/examples/governance-dapp.tsx)
- [Wallet App](../../typescript/examples/wallet-app.tsx)

All examples are production-ready and can be used as templates for your dApps.