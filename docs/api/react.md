# React Components Reference

Complete reference for Selendra React components and hooks.

## Table of Contents

- [Provider Components](#provider-components)
- [Core Hooks](#core-hooks)
- [UI Components](#ui-components)
- [Form Components](#form-components)
- [Transaction Components](#transaction-components)
- [Example Usage](#example-usage)
- [TypeScript Types](#typescript-types)

## Provider Components

### SelendraProvider

Context provider that makes the Selendra SDK available to all child components.

#### Props

```typescript
interface SelendraProviderProps {
  children: React.ReactNode;
  sdk: SelendraSDK;
  autoConnect?: boolean;
  onError?: (error: Error) => void;
}
```

#### Example

```typescript
import React from 'react';
import { SelendraProvider, SelendraSDK } from '@selendrajs/sdk/react';

const sdk = new SelendraSDK({
  network: 'mainnet',
  wsEndpoint: 'wss://rpc.selendra.org'
});

function App() {
  return (
    <SelendraProvider sdk={sdk} autoConnect>
      <MyApp />
    </SelendraProvider>
  );
}
```

### NetworkProvider

Provides network-specific configuration and switching capabilities.

#### Props

```typescript
interface NetworkProviderProps {
  children: React.ReactNode;
  networks: NetworkConfig[];
  defaultNetwork?: string;
  onNetworkChange?: (network: string) => void;
}
```

#### Example

```typescript
const networks = [
  { id: 'mainnet', name: 'Selendra Mainnet', rpc: 'wss://rpc.selendra.org' },
  { id: 'testnet', name: 'Selendra Testnet', rpc: 'wss://testnet-rpc.selendra.org' }
];

function App() {
  return (
    <NetworkProvider networks={networks}>
      <MyApp />
    </NetworkProvider>
  );
}
```

## Core Hooks

### useSelendra()

Access the Selendra SDK instance from context.

#### Returns

```typescript
SelendraSDK
```

#### Example

```typescript
import { useSelendra } from '@selendrajs/sdk/react';

function ChainInfo() {
  const sdk = useSelendra();
  const [chainInfo, setChainInfo] = useState(null);

  useEffect(() => {
    sdk.getChainInfo().then(setChainInfo);
  }, [sdk]);

  return chainInfo ? <div>Chain: {chainInfo.chainName}</div> : null;
}
```

### useAccount()

Manages account connection and state.

#### Returns

```typescript
interface UseAccountReturn {
  account: Account | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchAccount: (address: string) => Promise<void>;
  accounts: Account[];
}
```

#### Example

```typescript
function WalletConnect() {
  const {
    account,
    isConnected,
    isConnecting,
    connect,
    disconnect
  } = useAccount();

  if (isConnecting) return <div>Connecting...</div>;

  return isConnected ? (
    <div>
      <p>Connected: {account?.address}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  ) : (
    <button onClick={connect}>Connect Wallet</button>
  );
}
```

### useBalance()

Gets and monitors account balance.

#### Parameters

```typescript
interface UseBalanceOptions {
  address?: string;
  token?: string;
  refreshInterval?: number;
}
```

#### Returns

```typescript
interface UseBalanceReturn {
  balance: Balance | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

#### Example

```typescript
function BalanceDisplay({ address }) {
  const { balance, loading, error } = useBalance({
    address,
    refreshInterval: 5000 // Refresh every 5 seconds
  });

  if (loading) return <div>Loading balance...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      Balance: {balance?.free} {balance?.tokenSymbol}
    </div>
  );
}
```

### useNetwork()

Manages network selection and switching.

#### Returns

```typescript
interface UseNetworkReturn {
  network: NetworkConfig;
  networks: NetworkConfig[];
  isSwitching: boolean;
  switchNetwork: (networkId: string) => Promise<void>;
  addNetwork: (network: NetworkConfig) => void;
}
```

#### Example

```typescript
function NetworkSelector() {
  const { network, networks, switchNetwork } = useNetwork();

  return (
    <select
      value={network.id}
      onChange={(e) => switchNetwork(e.target.value)}
    >
      {networks.map((net) => (
        <option key={net.id} value={net.id}>
          {net.name}
        </option>
      ))}
    </select>
  );
}
```

### useTransaction()

Handles transaction creation and submission.

#### Returns

```typescript
interface UseTransactionReturn {
  send: (options: SendTransactionOptions) => Promise<Transaction>;
  estimateGas: (options: SendTransactionOptions) => Promise<bigint>;
  transaction: Transaction | null;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}
```

#### Example

```typescript
function TransferForm() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const { send, isLoading, error } = useTransaction();

  const handleTransfer = async () => {
    try {
      const tx = await send({
        to: recipient,
        amount: BigInt(amount)
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
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### useContract()

Interacts with smart contracts.

#### Parameters

```typescript
interface UseContractOptions {
  address: string;
  abi: any[];
  autoConnect?: boolean;
}
```

#### Returns

```typescript
interface UseContractReturn {
  contract: Contract | null;
  call: (functionName: string, ...args: any[]) => Promise<any>;
  send: (
    functionName: string,
    options?: ContractSendOptions,
    ...args: any[]
  ) => Promise<Transaction>;
  isLoading: boolean;
  error: Error | null;
}
```

#### Example

```typescript
import erc20Abi from './erc20.json';

function TokenBalance({ tokenAddress, userAddress }) {
  const { contract, call } = useContract({
    address: tokenAddress,
    abi: erc20Abi
  });

  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (contract) {
      call('balanceOf', userAddress).then(setBalance);
    }
  }, [contract, call, userAddress]);

  return balance ? <div>Balance: {balance.toString()}</div> : null;
}
```

### useBlock()

Gets and monitors block information.

#### Parameters

```typescript
interface UseBlockOptions {
  blockNumber?: number;
  blockHash?: string;
  subscribe?: boolean;
}
```

#### Returns

```typescript
interface UseBlockReturn {
  block: Block | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

#### Example

```typescript
function BlockInfo() {
  const { block, loading } = useBlock({ subscribe: true });

  if (loading) return <div>Loading block...</div>;

  return (
    <div>
      <p>Block Number: {block?.number}</p>
      <p>Timestamp: {new Date(block?.timestamp * 1000).toLocaleString()}</p>
      <p>Transactions: {block?.transactions.length}</p>
    </div>
  );
}
```

### useEventListener()

Listens for blockchain events.

#### Parameters

```typescript
interface UseEventListenerOptions {
  contract?: Contract;
  eventName?: string;
  fromBlock?: number;
  filters?: Record<string, any>;
}
```

#### Returns

```typescript
interface UseEventListenerReturn {
  events: Event[];
  isLoading: boolean;
  error: Error | null;
  unsubscribe: () => void;
}
```

#### Example

```typescript
function TransactionHistory() {
  const { events, isLoading } = useEventListener({
    eventName: 'Transfer',
    fromBlock: 'latest'
  });

  if (isLoading) return <div>Loading events...</div>;

  return (
    <div>
      <h3>Recent Transfers</h3>
      {events.map((event, index) => (
        <div key={index}>
          <p>From: {event.returnValues.from}</p>
          <p>To: {event.returnValues.to}</p>
          <p>Amount: {event.returnValues.value}</p>
        </div>
      ))}
    </div>
  );
}
```

## UI Components

### AddressDisplay

Displays an address with formatting and copy functionality.

#### Props

```typescript
interface AddressDisplayProps {
  address: string;
  format?: 'short' | 'full' | 'medium';
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}
```

#### Example

```typescript
<AddressDisplay
  address="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  format="short"
  showCopy
  showExplorer
/>
```

### BalanceDisplay

Displays a formatted balance.

#### Props

```typescript
interface BalanceDisplayProps {
  balance: Balance;
  format?: 'full' | 'compact';
  showSymbol?: boolean;
  decimals?: number;
  className?: string;
}
```

#### Example

```typescript
<BalanceDisplay
  balance={balance}
  format="compact"
  showSymbol
/>
```

### NetworkBadge

Displays the current network as a badge.

#### Props

```typescript
interface NetworkBadgeProps {
  network: NetworkConfig;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}
```

#### Example

```typescript
<NetworkBadge
  network={network}
  size="medium"
  showIcon
/>
```

### TransactionStatus

Displays transaction status with appropriate styling.

#### Props

```typescript
interface TransactionStatusProps {
  transaction: Transaction;
  showHash?: boolean;
  showDetails?: boolean;
  className?: string;
}
```

#### Example

```typescript
<TransactionStatus
  transaction={tx}
  showHash
  showDetails
/>
```

## Form Components

### AddressInput

Input field for addresses with validation.

#### Props

```typescript
interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}
```

#### Example

```typescript
<AddressInput
  value={recipient}
  onChange={setRecipient}
  placeholder="Enter recipient address"
  required
/>
```

### AmountInput

Input field for token amounts with validation.

#### Props

```typescript
interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  token?: string;
  decimals?: number;
  maxAmount?: bigint;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}
```

#### Example

```typescript
<AmountInput
  value={amount}
  onChange={setAmount}
  token="SEL"
  decimals={12}
  maxAmount={balance.free}
  placeholder="Enter amount"
/>
```

### WalletSelector

Dropdown for selecting connected wallets.

#### Props

```typescript
interface WalletSelectorProps {
  selectedWallet?: string;
  onWalletSelect: (wallet: string) => void;
  wallets: Wallet[];
  disabled?: boolean;
  className?: string;
}
```

#### Example

```typescript
<WalletSelector
  selectedWallet={selectedWallet}
  onWalletSelect={handleWalletSelect}
  wallets={availableWallets}
/>
```

## Transaction Components

### TransactionForm

Generic form for creating and submitting transactions.

#### Props

```typescript
interface TransactionFormProps {
  fields: TransactionField[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  initialValues?: Record<string, any>;
  validation?: Record<string, (value: any) => string | undefined>;
  submitText?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}
```

#### Example

```typescript
const fields = [
  {
    name: 'to',
    label: 'Recipient',
    type: 'address',
    required: true
  },
  {
    name: 'amount',
    label: 'Amount',
    type: 'amount',
    required: true
  }
];

<TransactionForm
  fields={fields}
  onSubmit={handleSubmit}
  submitText="Send Tokens"
/>
```

### TransactionConfirmation

Modal for confirming transaction details before submission.

#### Props

```typescript
interface TransactionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  transaction: TransactionDetails;
  loading?: boolean;
  className?: string;
}
```

#### Example

```typescript
<TransactionConfirmation
  isOpen={showConfirmation}
  onClose={() => setShowConfirmation(false)}
  onConfirm={confirmTransaction}
  transaction={pendingTx}
  loading={isLoading}
/>
```

## Example Usage

### Complete Wallet Component

```typescript
import React, { useState } from 'react';
import {
  useAccount,
  useBalance,
  useTransaction,
  AddressDisplay,
  BalanceDisplay,
  AddressInput,
  AmountInput,
  TransactionForm
} from '@selendrajs/sdk/react';

export const Wallet: React.FC = () => {
  const { account, isConnected, connect, disconnect } = useAccount();
  const { balance } = useBalance({ address: account?.address });
  const { send, isLoading } = useTransaction();

  const handleTransfer = async (values) => {
    await send({
      to: values.to,
      amount: BigInt(values.amount)
    });
  };

  const transferFields = [
    {
      name: 'to',
      label: 'Recipient Address',
      type: 'address' as const,
      required: true
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'amount' as const,
      required: true,
      token: 'SEL',
      decimals: 12,
      maxAmount: balance?.free
    }
  ];

  if (!isConnected) {
    return (
      <div className="wallet-connect">
        <h2>Selendra Wallet</h2>
        <button onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="wallet">
      <h2>My Wallet</h2>

      <div className="wallet-info">
        <h3>Account</h3>
        <AddressDisplay
          address={account!.address}
          format="medium"
          showCopy
          showExplorer
        />

        <h3>Balance</h3>
        <BalanceDisplay
          balance={balance!}
          format="full"
          showSymbol
        />
      </div>

      <div className="transfer-section">
        <h3>Send SEL</h3>
        <TransactionForm
          fields={transferFields}
          onSubmit={handleTransfer}
          submitText="Send"
          loading={isLoading}
        />
      </div>

      <button onClick={disconnect} className="disconnect-btn">
        Disconnect
      </button>
    </div>
  );
};
```

### Token Contract Interaction

```typescript
import React, { useState, useEffect } from 'react';
import { useContract, useAccount } from '@selendrajs/sdk/react';
import erc20Abi from './erc20.json';

interface TokenContractProps {
  tokenAddress: string;
}

export const TokenContract: React.FC<TokenContractProps> = ({ tokenAddress }) => {
  const { account } = useAccount();
  const { contract, call, send } = useContract({
    address: tokenAddress,
    abi: erc20Abi
  });

  const [balance, setBalance] = useState('0');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');

  useEffect(() => {
    if (contract && account) {
      call('balanceOf', account.address).then((result) => {
        setBalance(result.toString());
      });
    }
  }, [contract, account, call]);

  const handleTransfer = async () => {
    if (!contract || !account) return;

    await send(
      'transfer',
      { from: account.address },
      transferTo,
      BigInt(transferAmount)
    );

    // Refresh balance after transfer
    const newBalance = await call('balanceOf', account.address);
    setBalance(newBalance.toString());
  };

  return (
    <div className="token-contract">
      <h3>Token Contract</h3>
      <p>Contract: {tokenAddress}</p>
      <p>Your Balance: {balance}</p>

      <div className="transfer-form">
        <input
          placeholder="Recipient address"
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
        />
        <button onClick={handleTransfer}>Transfer</button>
      </div>
    </div>
  );
};
```

## TypeScript Types

### Component Props

```typescript
// AddressDisplay
interface AddressDisplayProps {
  address: string;
  format?: 'short' | 'full' | 'medium';
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}

// BalanceDisplay
interface BalanceDisplayProps {
  balance: Balance;
  format?: 'full' | 'compact';
  showSymbol?: boolean;
  decimals?: number;
  className?: string;
}

// NetworkBadge
interface NetworkBadgeProps {
  network: NetworkConfig;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

// TransactionStatus
interface TransactionStatusProps {
  transaction: Transaction;
  showHash?: boolean;
  showDetails?: boolean;
  className?: string;
}
```

### Hook Return Types

```typescript
// useAccount
interface UseAccountReturn {
  account: Account | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchAccount: (address: string) => Promise<void>;
  accounts: Account[];
}

// useBalance
interface UseBalanceReturn {
  balance: Balance | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// useTransaction
interface UseTransactionReturn {
  send: (options: SendTransactionOptions) => Promise<Transaction>;
  estimateGas: (options: SendTransactionOptions) => Promise<bigint>;
  transaction: Transaction | null;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

// useContract
interface UseContractReturn {
  contract: Contract | null;
  call: (functionName: string, ...args: any[]) => Promise<any>;
  send: (
    functionName: string,
    options?: ContractSendOptions,
    ...args: any[]
  ) => Promise<Transaction>;
  isLoading: boolean;
  error: Error | null;
}
```

### Form Types

```typescript
interface TransactionField {
  name: string;
  label: string;
  type: 'address' | 'amount' | 'text' | 'number' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | undefined;
}

interface TransactionFormProps {
  fields: TransactionField[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  initialValues?: Record<string, any>;
  validation?: Record<string, (value: any) => string | undefined>;
  submitText?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}
```

---

This React components reference covers all the UI components and hooks provided by the Selendra SDK for React. For more examples and best practices, check out our [examples directory](../../examples/react/) and [tutorials](../tutorials/).