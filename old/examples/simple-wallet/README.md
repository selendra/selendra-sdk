# Simple Wallet Example

A complete, production-ready wallet application demonstrating core Selendra SDK functionality.

## Features

- 🔐 **Secure Account Management** - Create, import, and manage multiple accounts
- 💰 **Balance Tracking** - Real-time balance updates with automatic refresh
- 🔄 **Token Transfers** - Send and receive SEL tokens with transaction history
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🔍 **Transaction History** - Complete transaction log with status tracking
- 🌐 **Multi-Network Support** - Switch between mainnet and testnet
- 📋 **Copy & Explorer** - Easy address copying and blockchain explorer integration

## Quick Start

### Prerequisites

- Node.js 16.0+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/selendra/selendra-sdk.git
cd selendra-sdk/examples/simple-wallet

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 to view the application.

## Project Structure

```
simple-wallet/
├── src/
│   ├── components/
│   │   ├── AccountManager.tsx      # Account creation and management
│   │   ├── BalanceDisplay.tsx      # Balance formatting and display
│   │   ├── TransferForm.tsx        # Token transfer interface
│   │   ├── TransactionHistory.tsx  # Transaction list and details
│   │   ├── NetworkSelector.tsx     # Network switching
│   │   └── AddressBook.tsx         # Saved addresses
│   ├── hooks/
│   │   ├── useLocalStorage.ts      # Local storage management
│   │   ├── useTransactionHistory.ts # Transaction tracking
│   │   └── useDebounce.ts          # Input debouncing
│   ├── utils/
│   │   ├── formatters.ts           # Number and address formatting
│   │   ├── validation.ts           # Form validation utilities
│   │   └── constants.ts            # App constants and configs
│   ├── types/
│   │   ├── account.ts              # Account type definitions
│   │   ├── transaction.ts          # Transaction types
│   │   └── storage.ts              # Local storage types
│   ├── App.tsx                     # Main application component
│   ├── index.tsx                   # Application entry point
│   └── styles/
│       └── globals.css             # Global styles
├── public/
│   └── index.html                  # HTML template
├── package.json                    # Dependencies and scripts
├── vite.config.ts                  # Vite configuration
└── README.md                       # This file
```

## Architecture

The wallet is built using React with TypeScript and follows modern best practices:

- **React Hooks** for state management and side effects
- **Context API** for global state (SDK instance)
- **TypeScript** for type safety and developer experience
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling

## Core Components

### AccountManager

Handles wallet account operations including creation, import, and selection.

```typescript
// src/components/AccountManager.tsx
export const AccountManager: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { accounts, createAccount, importAccount } = useAccount();

  const handleCreateAccount = async () => {
    setIsCreating(true);
    try {
      await createAccount({
        name: `Account ${accounts.length + 1}`,
        password: undefined // Optional password encryption
      });
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Component JSX...
};
```

### TransferForm

Provides a complete interface for sending tokens with validation and confirmation.

```typescript
// src/components/TransferForm.tsx
export const TransferForm: React.FC = () => {
  const { send, isLoading } = useTransaction();
  const { balance } = useBalance();
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    memo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTransferForm(formData, balance)) {
      return;
    }

    try {
      const tx = await send({
        to: formData.to,
        amount: parseAmount(formData.amount),
        memo: formData.memo
      });

      // Handle success
      console.log('Transaction sent:', tx.hash);
    } catch (error) {
      // Handle error
      console.error('Transfer failed:', error);
    }
  };

  // Component JSX...
};
```

### TransactionHistory

Displays a comprehensive list of transactions with filtering and search.

```typescript
// src/components/TransactionHistory.tsx
export const TransactionHistory: React.FC = () => {
  const { transactions, loading } = useTransactionHistory();
  const [filter, setFilter] = useState<TransactionFilter>({
    type: 'all',
    status: 'all',
    dateRange: undefined
  });

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filter);
  }, [transactions, filter]);

  // Component JSX...
};
```

## Custom Hooks

### useLocalStorage

Provides type-safe localStorage management with automatic serialization.

```typescript
// src/hooks/useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}
```

### useTransactionHistory

Manages transaction history with local storage caching and automatic updates.

```typescript
// src/hooks/useTransactionHistory.ts
export const useTransactionHistory = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    'transactions',
    []
  );
  const { account } = useAccount();
  const sdk = useSelendra();

  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  }, [setTransactions]);

  const updateTransactionStatus = useCallback((
    hash: string,
    status: TransactionStatus
  ) => {
    setTransactions(prev =>
      prev.map(tx =>
        tx.hash === hash ? { ...tx, status } : tx
      )
    );
  }, [setTransactions]);

  // Auto-update pending transactions
  useEffect(() => {
    const pendingTxs = transactions.filter(tx => tx.status === 'pending');

    pendingTxs.forEach(tx => {
      const updateStatus = async () => {
        try {
          const updatedTx = await sdk.getTransaction(tx.hash);
          if (updatedTx && updatedTx.status !== 'pending') {
            updateTransactionStatus(tx.hash, updatedTx.status);
          }
        } catch (error) {
          console.error('Failed to update transaction status:', error);
        }
      };

      updateStatus();
    });
  }, [transactions, sdk, updateTransactionStatus]);

  return {
    transactions,
    addTransaction,
    updateTransactionStatus,
    clearTransactions: () => setTransactions([])
  };
};
```

## Utilities

### Formatters

Utility functions for displaying numbers, addresses, and other data.

```typescript
// src/utils/formatters.ts
export const formatBalance = (
  balance: bigint,
  decimals: number = 12,
  tokenSymbol: string = 'SEL'
): string => {
  const value = Number(balance) / Math.pow(10, decimals);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(value) + ' ' + tokenSymbol;
};

export const formatAddress = (
  address: string,
  format: 'short' | 'medium' | 'full' = 'medium'
): string => {
  if (format === 'full') return address;

  if (format === 'short') {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return `${address.slice(0, 12)}...${address.slice(-6)}`;
};

export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp * 1000));
};
```

### Validation

Form validation utilities for addresses, amounts, and other inputs.

```typescript
// src/utils/validation.ts
export const validateAddress = (address: string): boolean => {
  // Substrate address validation
  if (address.startsWith('5')) {
    try {
      encode(address, SS58Prefix);
      return true;
    } catch {
      return false;
    }
  }

  // EVM address validation
  if (address.startsWith('0x') && address.length === 42) {
    return isAddress(address);
  }

  return false;
};

export const validateAmount = (
  amount: string,
  balance: bigint,
  decimals: number
): string | null => {
  if (!amount || parseFloat(amount) <= 0) {
    return 'Amount must be greater than 0';
  }

  const amountBigint = parseBalance(amount, decimals);
  if (amountBigint > balance) {
    return 'Insufficient balance';
  }

  return null;
};
```

## Configuration

### App Constants

```typescript
// src/utils/constants.ts
export const NETWORKS = {
  mainnet: {
    id: 'mainnet',
    name: 'Selendra Mainnet',
    rpc: 'wss://rpc.selendra.org',
    explorer: 'https://explorer.selendra.org',
    decimals: 12,
    tokenSymbol: 'SEL'
  },
  testnet: {
    id: 'testnet',
    name: 'Selendra Testnet',
    rpc: 'wss://testnet-rpc.selendra.org',
    explorer: 'https://testnet-explorer.selendra.org',
    decimals: 12,
    tokenSymbol: 'tSEL'
  }
} as const;

export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 1, // Smallest possible amount
  MAX_DECIMALS: 6, // Display decimals
  GAS_LIMIT_BUFFER: 1.2, // 20% buffer
} as const;
```

## Security Considerations

This wallet implements several security best practices:

1. **Mnemonic Storage** - Mnemonics are stored in localStorage with optional password encryption
2. **Transaction Validation** - All transactions are validated before submission
3. **Network Validation** - Ensures connections to legitimate RPC endpoints
4. **Input Sanitization** - All user inputs are validated and sanitized
5. **Secure Defaults** - Conservative gas limits and fee estimates

**⚠️ Important**: This is a demo application. For production use, consider:
- Hardware wallet integration
- Encrypted storage solutions
- Multi-signature support
- Advanced security audits

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Create `.env.production`:

```env
VITE_DEFAULT_NETWORK=mainnet
VITE_DISABLE_DEV_TOOLS=true
VITE_SENTRY_DSN=your_sentry_dsn
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This example is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](../../../docs/)
- 💬 [Discord](https://discord.gg/selendra)
- 🐛 [Issues](https://github.com/selendra/selendra-sdk/issues)
- 📧 [Email](mailto:support@selendra.org)