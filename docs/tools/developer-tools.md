# Developer Tools Guide

Complete guide to development tools, testing strategies, debugging techniques, and performance optimization for Selenda SDK development.

## 🛠 Core Development Tools

### Selendra CLI

The official command-line interface for Selendra development.

#### Installation

```bash
# Global installation
npm install -g @selendrajs/cli

# Local installation
npm install --save-dev @selendrajs/cli
```

#### Basic Commands

```bash
# Initialize new project
selendra init my-project

# Start development server
selendra dev

# Build for production
selendra build

# Deploy to testnet
selendra deploy --network testnet

# Run tests
selendra test

# Generate TypeScript types
selendra types:generate

# Check contract interactions
selendra contract:verify 0x...
```

#### Advanced Commands

```bash
# Generate migration scripts
selendra migration:generate --from=ethereum --to=selendra

# Simulate transactions
selendra tx:simulate --from=0x... --to=0x... --amount=1000

# Analyze gas usage
selendra gas:analyze --contract=MyContract.sol

# Security audit
selendra audit --severity=high

# Generate documentation
selendra docs:generate --format=markdown
```

### VS Code Extensions

#### Recommended Extensions

```json
{
  "recommendations": [
    "selendra.selendra-sdk",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "rust-lang.rust-analyzer",
    "ms-vscode.vscode-solidity",
    "juanblanco.solidity"
  ]
}
```

#### Workspace Configuration

`.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.suggest.autoImports": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.sol": "solidity"
  }
}
```

---

## 🧪 Testing Strategies

### Unit Testing

#### Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

`jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Example Tests

`src/test/components/WalletConnect.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnect } from '../../components/WalletConnect';
import { SelendraProvider } from '@selendrajs/sdk/react';

const mockSdk = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  createAccount: jest.fn(),
  getAccounts: jest.fn()
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SelendraProvider sdk={mockSdk as any}>
      {component}
    </SelendraProvider>
  );
};

describe('WalletConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create wallet button when not connected', () => {
    renderWithProvider(<WalletConnect />);

    expect(screen.getByText('Create New Wallet')).toBeInTheDocument();
  });

  it('calls createAccount when button is clicked', async () => {
    mockSdk.createAccount.mockResolvedValue({
      address: '5TestAddress...',
      mnemonic: 'test mnemonic phrase'
    });

    renderWithProvider(<WalletConnect />);

    fireEvent.click(screen.getByText('Create New Wallet'));

    await waitFor(() => {
      expect(mockSdk.createAccount).toHaveBeenCalled();
    });
  });

  it('handles account creation errors', async () => {
    mockSdk.createAccount.mockRejectedValue(new Error('Failed to create account'));

    renderWithProvider(<WalletConnect />);

    fireEvent.click(screen.getByText('Create New Wallet'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to create wallet/)).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

#### Test Utils

`src/test/utils/testHelpers.ts`:

```tsx
import { render, RenderOptions } from '@testing-library/react';
import { SelendraProvider } from '@selendrajs/sdk/react';

export const renderWithSDK = (
  ui: React.ReactElement,
  options?: RenderOptions & { sdk?: any }
) => {
  const { sdk = mockSDK, ...renderOptions } = options || {};

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SelendraProvider sdk={sdk}>
      {children}
    </SelendraProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export const mockSDK = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  createAccount: jest.fn(),
  getBalance: jest.fn(),
  transfer: jest.fn(),
  sendTransaction: jest.fn(),
  query: jest.fn(),
  tx: jest.fn(),
  is_connected: false,
  network: 'testnet'
};
```

#### Integration Test Example

`src/test/integration/TaskManager.test.tsx`:

```tsx
import { TaskManager } from '../../components/TaskManager';
import { renderWithSDK, mockSDK } from '../utils/testHelpers';

describe('TaskManager Integration', () => {
  beforeEach(() => {
    // Mock successful account connection
    mockSDK.is_connected = true;
    mockSDK.getBalance.mockResolvedValue({
      free: 1000000000000,
      tokenSymbol: 'SEL',
      decimals: 12
    });
  });

  it('allows creating and completing tasks', async () => {
    mockSDK.sendTransaction.mockResolvedValue({
      hash: '0x123...',
      from: '5TestAddress...',
      status: 'included'
    });

    renderWithSDK(<TaskManager />);

    // Test task creation
    fireEvent.change(screen.getByLabelText('Task Title'), {
      target: { value: 'Test Task' }
    });
    fireEvent.change(screen.getByLabelText('Reward (SEL)'), {
      target: { value: '10' }
    });

    fireEvent.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(mockSDK.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.stringContaining('Test Task')
        })
      );
    });
  });
});
```

### End-to-End Testing

#### Playwright Setup

```bash
npm install --save-dev @playwright/test
```

`playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2E Test Example

`e2e/task-management.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create and complete a task', async ({ page }) => {
    // Create wallet
    await page.click('text=Create New Wallet');
    await page.waitForSelector('text=Connected');

    // Create task
    await page.fill('input[placeholder="Enter task title"]', 'Test Task');
    await page.fill('input[placeholder="0.00"]', '10');
    await page.click('text=Create Task');

    // Verify task created
    await expect(page.locator('text=Test Task')).toBeVisible();
    await expect(page.locator('text=Reward: 10.00 SEL')).toBeVisible();

    // Complete task
    await page.click('text=Complete Task');

    // Verify completion
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Task completed successfully!')).toBeVisible();
  });

  test('should handle transaction errors gracefully', async ({ page }) => {
    // Mock transaction failure
    await page.route('**/rpc', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Insufficient balance' })
      });
    });

    await page.click('text=Create New Wallet');
    await page.fill('input[placeholder="Enter task title"]', 'Test Task');
    await page.fill('input[placeholder="0.00"]', '10');
    await page.click('text=Create Task');

    await expect(page.locator('text=Failed to create task')).toBeVisible();
  });
});
```

---

## 🐛 Debugging Techniques

### Browser DevTools

#### Network Tab Debugging

```typescript
// Add request/response logging
const sdk = new SelendraSDK({
  network: 'testnet',
  wsEndpoint: 'wss://testnet-rpc.selendra.org',
  debug: true // Enable debug mode
});

// Custom request interceptor
sdk.on('request', (request) => {
  console.log('🔗 SDK Request:', {
    method: request.method,
    params: request.params,
    timestamp: new Date().toISOString()
  });
});

sdk.on('response', (response) => {
  console.log('✅ SDK Response:', {
    id: response.id,
    result: response.result,
    duration: response.duration
  });
});
```

#### React DevTools Integration

```tsx
// Add DevTools integration
import { DevTools } from '@selendrajs/sdk/dev-tools';

function App() {
  return (
    <>
      <SelendraProvider sdk={sdk}>
        <YourApp />
      </SelendraProvider>
      {process.env.NODE_ENV === 'development' && <DevTools />}
    </>
  );
}
```

### Logging and Monitoring

#### Structured Logging

```typescript
import { logger } from '@selendrajs/sdk/utils';

// Configure logger
logger.configure({
  level: 'debug',
  format: 'json',
  transports: [
    new logger.ConsoleTransport(),
    new logger.FileTransport('selendra-sdk.log')
  ]
});

// Usage in components
const TaskManager = () => {
  const handleTaskCreate = async (task: Task) => {
    logger.info('Creating task', {
      title: task.title,
      reward: task.reward,
      timestamp: Date.now()
    });

    try {
      const result = await sdk.createTask(task);
      logger.info('Task created successfully', {
        taskId: result.id,
        txHash: result.transactionHash
      });
    } catch (error) {
      logger.error('Task creation failed', {
        error: error.message,
        task: task
      });
    }
  };
};
```

#### Performance Monitoring

```typescript
import { performance } from '@selendrajs/sdk/utils';

// Performance tracking
class PerformanceMonitor {
  static trackFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    logger.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });

    return result;
  }

  static async trackAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    logger.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });

    return result;
  }
}

// Usage
const balance = await PerformanceMonitor.trackAsyncFunction(
  'getBalance',
  () => sdk.getBalance(address)
);
```

### Error Analysis

#### Error Boundary Implementation

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error to monitoring service
    logger.error('React Error Boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error && (
              <summary>{this.state.error.toString()}</summary>
            )}
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Transaction Debugging

```typescript
import { TransactionDebugger } from '@selendrajs/sdk/debug';

// Initialize transaction debugger
const debugger = new TransactionDebugger({
  logLevel: 'verbose',
  captureStackTrace: true,
  enableGasAnalysis: true
});

// Debug specific transaction
const tx = await sdk.transfer({
  to: recipient,
  amount: BigInt('1000000000000'),
  debug: true
});

// Analyze transaction
const analysis = debugger.analyze(tx);
console.log('Transaction Analysis:', {
  gasUsed: analysis.gasUsed,
  gasLimit: analysis.gasLimit,
  efficiency: analysis.efficiency,
  optimizations: analysis.suggestions
});
```

---

## ⚡ Performance Optimization

### Code Splitting

#### Lazy Loading Components

```tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const TaskManager = lazy(() => import('./components/TaskManager'));
const Analytics = lazy(() => import('./components/Analytics'));
const Settings = lazy(() => import('./components/Settings'));

const App = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<TaskManager />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

#### Dynamic Imports

```typescript
// Import SDK features on demand
const loadAdvancedFeatures = async () => {
  const { AdvancedSDK } = await import('@selendrajs/sdk/advanced');
  return new AdvancedSDK(sdkConfig);
};

// Import contracts when needed
const loadContract = async (address: string) => {
  const { Contract } = await import('@selendrajs/sdk/contract');
  return new Contract(address, abi, sdk);
};
```

### Caching Strategies

#### React Query Integration

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.code === 'NETWORK_ERROR') return true;
        return failureCount < 3;
      }
    }
  }
});

// Custom hook with caching
export const useBalance = (address?: string) => {
  return useQuery({
    queryKey: ['balance', address],
    queryFn: () => sdk.getBalance(address!),
    enabled: !!address,
    staleTime: 30 * 1000 // 30 seconds for balance
  });
};
```

#### Local Storage Caching

```typescript
class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, { data: any; timestamp: number }>();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Also persist to localStorage
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl
    }));
  }

  get(key: string): any | null {
    // Check memory cache first
    const memoryItem = this.cache.get(key);
    if (memoryItem && Date.now() - memoryItem.timestamp < 300000) {
      return memoryItem.data;
    }

    // Check localStorage
    const persistedItem = localStorage.getItem(`cache_${key}`);
    if (persistedItem) {
      try {
        const parsed = JSON.parse(persistedItem);
        if (Date.now() - parsed.timestamp < parsed.ttl) {
          return parsed.data;
        }
      } catch {
        // Remove corrupted cache
        localStorage.removeItem(`cache_${key}`);
      }
    }

    return null;
  }

  clear(): void {
    this.cache.clear();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Usage
const cachedBalance = CacheManager.getInstance().get(`balance_${address}`);
if (!cachedBalance) {
  const balance = await sdk.getBalance(address);
  CacheManager.getInstance().set(`balance_${address}`, balance, 60000); // 1 minute
}
```

### Bundle Optimization

#### Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        },
        selendra: {
          test: /[\\/]node_modules[\\/]@selendra[\\/]/,
          name: 'selendra',
          chunks: 'all'
        }
      }
    },
    usedExports: true,
    sideEffects: false
  },
  resolve: {
    alias: {
      '@selendrajs/sdk': '@selendrajs/sdk/dist/index.esm'
    }
  }
};
```

#### Tree Shaking

```typescript
// Import only what you need
import { SelendraSDK, useAccount } from '@selendrajs/sdk/react';
// Instead of
// import * as SelendraSDK from '@selendrajs/sdk';

// Use specific utilities
import { formatBalance, validateAddress } from '@selendrajs/sdk/utils';

// Conditional loading
const SDKFeatures = () => {
  const [needAdvanced, setNeedAdvanced] = useState(false);

  useEffect(() => {
    if (needAdvanced) {
      import('@selendrajs/sdk/advanced').then(({ AdvancedSDK }) => {
        // Use advanced features
      });
    }
  }, [needAdvanced]);
};
```

### Memory Management

#### Component Cleanup

```tsx
import { useEffect, useRef } from 'react';

const useSDKCleanup = () => {
  const subscriptionsRef = useRef<Function[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach(unsubscribe => {
        unsubscribe();
      });
      subscriptionsRef.current = [];
    };
  }, []);

  const addCleanup = (cleanup: Function) => {
    subscriptionsRef.current.push(cleanup);
  };

  return { addCleanup };
};

// Usage in components
const TaskManager = () => {
  const { addCleanup } = useSDKCleanup();

  useEffect(() => {
    const unsubscribe = sdk.subscribeToHeads(() => {
      // Handle new blocks
    });

    addCleanup(unsubscribe);
  }, [addCleanup]);

  return <div>...</div>;
};
```

#### Subscription Management

```typescript
class SubscriptionManager {
  private subscriptions = new Map<string, () => void>();

  add(id: string, unsubscribe: () => void): void {
    // Remove existing subscription if any
    if (this.subscriptions.has(id)) {
      this.subscriptions.get(id)!();
    }

    this.subscriptions.set(id, unsubscribe);
  }

  remove(id: string): void {
    const unsubscribe = this.subscriptions.get(id);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(id);
    }
  }

  clear(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}

// Global subscription manager
export const subscriptionManager = new SubscriptionManager();
```

---

## 🔧 Advanced Debugging

### Transaction Analysis

```typescript
import { TransactionAnalyzer } from '@selendrajs/sdk/analyzer';

const analyzer = new TransactionAnalyzer();

// Analyze failed transactions
const analyzeFailure = async (txHash: string) => {
  const analysis = await analyzer.analyzeTransaction(txHash);

  console.log('Transaction Failure Analysis:', {
    failureReason: analysis.failureReason,
    gasEstimate: analysis.gasEstimate,
    actualGasUsed: analysis.actualGasUsed,
    suggestions: analysis.optimizations
  });
};

// Compare transactions
const compareTransactions = async (tx1: string, tx2: string) => {
  const comparison = await analyzer.compare(tx1, tx2);

  return {
    efficiency: comparison.efficiencyGain,
    gasSavings: comparison.gasSavings,
    recommendations: comparison.recommendations
  };
};
```

### Network Diagnostics

```typescript
import { NetworkDiagnostics } from '@selendrajs/sdk/diagnostics';

const diagnostics = new NetworkDiagnostics(sdk);

// Run network health check
const healthCheck = async () => {
  const results = await diagnostics.runHealthCheck();

  return {
    latency: results.latency,
    blockTime: results.blockTime,
    peerCount: results.peerCount,
    syncStatus: results.syncStatus,
    recommendations: results.recommendations
  };
};

// Monitor network performance
const monitor = diagnostics.startMonitoring({
  interval: 30000, // 30 seconds
  onAlert: (alert) => {
    console.warn('Network Alert:', alert);
  }
});
```

### Memory Profiling

```typescript
import { MemoryProfiler } from '@selendrajs/sdk/profiler';

const profiler = new MemoryProfiler();

// Profile memory usage
const profileMemory = () => {
  const snapshot = profiler.takeSnapshot();

  return {
    heapUsed: snapshot.heapUsed,
    heapTotal: snapshot.heapTotal,
    external: snapshot.external,
    arrayBuffers: snapshot.arrayBuffers
  };
};

// Detect memory leaks
const detectLeaks = () => {
  const leaks = profiler.detectLeaks();

  if (leaks.length > 0) {
    console.error('Memory Leaks Detected:', leaks);
    leaks.forEach(leak => {
      console.warn(`Leak in ${leak.component}: ${leak.description}`);
    });
  }
};
```

---

## 📊 Monitoring and Analytics

### Error Tracking

```typescript
import { ErrorTracker } from '@selendrajs/sdk/monitoring';

const errorTracker = new ErrorTracker({
  apiKey: 'your-tracking-api-key',
  environment: process.env.NODE_ENV,
  version: process.env.REACT_APP_VERSION
});

// Track SDK errors
sdk.on('error', (error) => {
  errorTracker.captureException(error, {
    tags: {
      component: 'selendra-sdk',
      operation: error.operation
    },
    extra: {
      account: error.account,
      network: error.network,
      transactionHash: error.transactionHash
    }
  });
});
```

### Performance Metrics

```typescript
import { PerformanceMetrics } from '@selendrajs/sdk/metrics';

const metrics = new PerformanceMetrics();

// Track transaction performance
metrics.trackTransaction('transfer', async () => {
  return sdk.transfer({
    to: recipient,
    amount: BigInt('1000000000000')
  });
});

// Track API calls
metrics.trackApiCall('getBalance', async () => {
  return sdk.getBalance(address);
});

// Get performance report
const report = metrics.getReport();
console.log('Performance Metrics:', {
  averageTransactionTime: report.transactions.average,
  successRate: report.transactions.successRate,
  apiLatency: report.apiCalls.latency
});
```

---

## 🚀 Production Deployment

### Build Optimization

```bash
# Analyze bundle size
npm run build:analyze

# Optimize assets
npm run optimize

# Generate source maps
npm run build:sourcemaps
```

### Environment Configuration

```typescript
// Production SDK configuration
const productionConfig = {
  network: process.env.REACT_APP_NETWORK || 'mainnet',
  wsEndpoint: process.env.REACT_APP_RPC_ENDPOINT,
  autoConnect: true,
  debug: false,
  retryAttempts: 3,
  connectionTimeout: 30000,
  maxReconnectDelay: 5000,
  heartbeatInterval: 30000
};

const sdk = new SelendraSDK(productionConfig);
```

### Security Best Practices

```typescript
// Content Security Policy
const securityConfig = {
  allowedOrigins: ['https://yourdomain.com'],
  maxContentLength: 1024 * 1024, // 1MB
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  }
};

// Request validation
sdk.setSecurityConfig(securityConfig);

// Input sanitization
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 1000)   // Limit length
    .trim();               // Remove whitespace
};
```

---

## 📚 Additional Resources

### CLI Reference

```bash
# Get help
selendra --help
selendra <command> --help

# Version information
selendra version
selendra info

# Configuration
selendra config set network mainnet
selendra config get network
selendra config list
```

### Troubleshooting

#### Common Issues

1. **Connection Problems**
   ```bash
   # Check network connectivity
   selendra network:check

   # Test RPC endpoint
   selendra rpc:test wss://rpc.selendra.org
   ```

2. **Memory Leaks**
   ```bash
   # Profile memory usage
   selendra profile:memory

   # Check for leaks
   selendra profile:leaks
   ```

3. **Performance Issues**
   ```bash
   # Analyze bundle size
   selendra analyze:bundle

   # Profile performance
   selendra profile:performance
   ```

### Support Channels

- **Documentation**: [docs.selendra.org](https://docs.selendra.org)
- **Discord**: [discord.gg/selendra](https://discord.gg/selendra)
- **GitHub**: [github.com/selendra/selendra-sdk](https://github.com/selendra/selendra-sdk)
- **Email**: [support@selendra.org](mailto:support@selendra.org)

---

**Happy building!** 🚀

This guide provides comprehensive tools and techniques for professional Selendra SDK development. For specific issues or questions, don't hesitate to reach out to our community!