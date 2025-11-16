/**
 * React Hooks for Selendra SDK
 *
 * Premium React hooks that provide seamless integration with Selendra blockchain.
 * Built with performance, type safety, and developer experience in mind.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

import React, { useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { SelendraSDK } from '../sdk';
import {
  AccountInfo,
  BalanceInfo,
  TransactionInfo,
  ContractInfo,
  EventSubscription,
  BlockInfo,
} from '../types';
import { SelendraContextValue, useSelendraContext } from './provider';

/**
 * useSelendraSDK - Main SDK Hook
 *
 * Provides access to the Selendra SDK instance and connection management.
 * This is the primary hook that all other hooks depend on.
 *
 * @returns SDK context with connection management
 *
 * @example
 * ```typescript
 * const { sdk, isConnected, connect, disconnect, error } = useSelendraSDK();
 *
 * const handleConnect = async () => {
 *   await connect();
 * };
 * ```
 */
export function useSelendraSDK(): SelendraContextValue {
  return useSelendraContext();
}

// Hook types for better TypeScript support
export interface UseBalanceOptions {
  refreshInterval?: number;
  includeUSD?: boolean;
  includeMetadata?: boolean;
  realTime?: boolean;
}

export interface UseBalanceReturn {
  balance: BalanceInfo | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  formatted: {
    native: string;
    usd?: string;
    symbol: string;
    decimals: number;
  };
  wei: string;
}

export interface UseAccountOptions {
  refreshInterval?: number;
  includeBalance?: boolean;
  includeHistory?: boolean;
  historyLimit?: number;
}

export interface UseAccountReturn {
  account: AccountInfo | null;
  transactions: TransactionInfo[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  hasBalance: boolean;
}

export interface UseTransactionOptions {
  autoSign?: boolean;
  waitForInclusion?: boolean;
  waitForFinality?: boolean;
  timeout?: number;
  showProgress?: boolean;
}

export interface UseTransactionReturn {
  submit: (tx: any, options?: UseTransactionOptions) => Promise<TransactionInfo>;
  status: 'idle' | 'submitting' | 'pending' | 'included' | 'finalized' | 'failed';
  transaction: TransactionInfo | null;
  isLoading: boolean;
  error: Error | null;
  cancel: () => void;
  reset: () => void;
}

export interface UseContractOptions {
  autoLoad?: boolean;
  abi?: any;
  metadata?: any;
  cache?: boolean;
}

export interface UseContractReturn {
  contract: ContractInfo | null;
  instance: any;
  isLoading: boolean;
  error: Error | null;
  read: (method: string, ...args: any[]) => Promise<any>;
  write: (method: string, ...args: any[]) => Promise<TransactionInfo>;
  estimateGas: (method: string, ...args: any[]) => Promise<string>;
  getEvents: (eventName?: string) => Promise<any[]>;
}

export interface UseEventsOptions {
  filters?: Record<string, any>;
  realTime?: boolean;
  maxEvents?: number;
  autoPurge?: boolean;
}

export interface UseEventsReturn {
  events: EventSubscription[];
  isLoading: boolean;
  error: Error | null;
  subscribe: (callback: (event: EventSubscription) => void) => () => void;
  unsubscribeAll: () => void;
  clear: () => void;
  count: number;
  lastEvent: EventSubscription | null;
}

export interface UseBlockSubscriptionOptions {
  autoSubscribe?: boolean;
  includeDetails?: boolean;
  includeExtrinsics?: boolean;
  includeEvents?: boolean;
}

export interface UseBlockSubscriptionReturn {
  blockNumber: number | null;
  blockHash: string | null;
  block: BlockInfo | null;
  isLoading: boolean;
  error: Error | null;
  subscribe: (callback: (block: BlockInfo) => void) => () => void;
  unsubscribe: () => void;
  isSubscribed: boolean;
  timestamp: number | null;
}

/**
 * useBalance - Balance Tracking Hook
 *
 * Real-time balance tracking for both Substrate and EVM chains with
 * automatic refresh, currency conversion, and formatted display.
 *
 * @param address - Address to track balance for (optional, uses connected account)
 * @param options - Balance tracking options
 * @returns Balance information with formatted display
 *
 * @example
 * ```typescript
 * const { balance, formatted, isLoading, refresh } = useBalance();
 * console.log(`Balance: ${formatted.native} ${formatted.symbol}`);
 * console.log(`USD Value: ${formatted.usd}`);
 * ```
 */
export function useBalance(address?: string, options: UseBalanceOptions = {}): UseBalanceReturn {
  const { sdk, isConnected } = useSelendraSDK();
  const {
    refreshInterval = 10000,
    includeUSD = true,
    includeMetadata = true,
    realTime = true,
  } = options;

  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchBalance = useCallback(async () => {
    if (!sdk || !isConnected || !address) return;

    try {
      setIsLoading(true);
      setError(null);

      const balanceInfo = await sdk.getBalance(address, {
        includeUSD,
        includeMetadata,
      });

      setBalance(balanceInfo);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch balance');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isConnected, address, includeUSD, includeMetadata]);

  // Initial fetch
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Set up interval for real-time updates
  useEffect(() => {
    if (realTime && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchBalance, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [realTime, refreshInterval, fetchBalance]);

  // Subscribe to balance changes if available
  useEffect(() => {
    if (!sdk || !isConnected || !address || !realTime) return;

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = sdk.subscribeToBalanceChanges(address, (newBalance) => {
        setBalance(newBalance);
      });
    } catch (err) {
      // Subscription not supported, fallback to polling
      console.warn('Balance subscription not supported, using polling');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sdk, isConnected, address, realTime]);

  const formatted = useMemo(() => {
    if (!balance) {
      return {
        native: '0',
        symbol: 'SEL',
        decimals: 18,
      };
    }

    const native = (Number(balance.balance) / Math.pow(10, balance.decimals)).toFixed(6);

    return {
      native,
      usd:
        includeUSD && balance.usdValue
          ? `$${(Number(balance.usdValue) / Math.pow(10, balance.decimals)).toFixed(2)}`
          : undefined,
      symbol: balance.symbol || 'SEL',
      decimals: balance.decimals,
    };
  }, [balance, includeUSD]);

  return {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
    formatted,
    wei: balance?.balance || '0',
  };
}

/**
 * useAccount - Account Management Hook
 *
 * Comprehensive account management with wallet integration, balance tracking,
 * and transaction history.
 *
 * @param options - Account management options
 * @returns Account information and management functions
 *
 * @example
 * ```typescript
 * const { account, transactions, hasBalance, refresh } = useAccount({
 *   includeBalance: true,
 *   includeHistory: true,
 *   historyLimit: 50
 * });
 * ```
 */
export function useAccount(options: UseAccountOptions = {}): UseAccountReturn {
  const { sdk, isConnected } = useSelendraSDK();
  const {
    refreshInterval = 15000,
    includeBalance = true,
    includeHistory = false,
    historyLimit = 100,
  } = options;

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchAccount = useCallback(async () => {
    if (!sdk || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      const accountInfo = await sdk.getAccount();
      setAccount(accountInfo);

      if (includeHistory && accountInfo.address) {
        const txHistory = await sdk.getTransactionHistory(accountInfo.address, historyLimit);
        setTransactions(txHistory);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch account');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isConnected, includeBalance, includeHistory, historyLimit]);

  // Initial fetch
  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchAccount, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, fetchAccount]);

  const hasBalance = Boolean(account && includeBalance && account.balance);

  return {
    account,
    isLoading,
    error,
    refresh: fetchAccount,
    transactions,
    hasBalance,
  };
}

/**
 * useTransaction - Transaction Management Hook
 *
 * Simplified transaction submission with status tracking, progress
 * notifications, and error handling.
 *
 * @param options - Transaction options
 * @returns Transaction submission and tracking functions
 *
 * @example
 * ```typescript
 * const { submit, status, transaction, error } = useTransaction({
 *   waitForInclusion: true,
 *   waitForFinality: false,
 *   showProgress: true
 * });
 *
 * const handleTransfer = async () => {
 *   const tx = await submit({
 *     to: '0x...',
 *     value: '1000000000000000000'
 *   });
 * };
 * ```
 */
export function useTransaction(options: UseTransactionOptions = {}): UseTransactionReturn {
  const { sdk } = useSelendraSDK();
  const {
    autoSign = false,
    waitForInclusion = true,
    waitForFinality = false,
    timeout = 30000,
    showProgress = false,
  } = options;

  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'pending' | 'included' | 'finalized' | 'failed'
  >('idle');
  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (tx: any, submitOptions: UseTransactionOptions = {}): Promise<TransactionInfo> => {
      if (!sdk) {
        throw new Error('SDK not initialized');
      }

      // Cancel any existing transaction
      cancel();

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      try {
        setStatus('submitting');
        setIsLoading(true);
        setError(null);

        const mergedOptions = { ...options, ...submitOptions };

        // Submit transaction
        const txResult = await sdk.submitTransaction(tx, {
          autoSign: mergedOptions.autoSign ?? autoSign,
          waitForInclusion: mergedOptions.waitForInclusion ?? waitForInclusion,
          waitForFinality: mergedOptions.waitForFinality ?? waitForFinality,
          timeout: mergedOptions.timeout ?? timeout,
        });

        // Update status based on result
        if (txResult.status === 'finalized') {
          setStatus('finalized');
        } else if (txResult.status === 'included') {
          setStatus('included');
        } else {
          setStatus('pending');
        }

        setTransaction(txResult);

        // Show progress notification
        if (showProgress) {
          // This would integrate with a toast notification system
          console.log(`Transaction ${txResult.hash}: ${txResult.status}`);
        }

        return txResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Transaction failed');
        setStatus('failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, options, autoSign, waitForInclusion, waitForFinality, timeout, showProgress],
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setTransaction(null);
    setError(null);
  }, [cancel]);

  return {
    submit,
    status,
    transaction,
    isLoading,
    error,
    cancel,
    reset,
  };
}

/**
 * useContract - Smart Contract Interaction Hook
 *
 * Seamless smart contract interaction for both EVM and Substrate contracts
 * with method calling, gas estimation, and event listening.
 *
 * @param address - Contract address
 * @param options - Contract interaction options
 * @returns Contract instance and interaction methods
 *
 * @example
 * ```typescript
 * const { contract, read, write, estimateGas } = useContract(
 *   '0x123...',
 *   { abi: contractABI, autoLoad: true }
 * );
 *
 * const balance = await read('balanceOf', '0x456...');
 * await write('transfer', '0x456...', '1000000000000000000');
 * ```
 */
export function useContract(address: string, options: UseContractOptions = {}): UseContractReturn {
  const { sdk, isConnected } = useSelendraSDK();
  const { autoLoad = true, abi, metadata, cache = true } = options;

  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [instance, setInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadContract = useCallback(async () => {
    if (!sdk || !isConnected || !address) return;

    try {
      setIsLoading(true);
      setError(null);

      const contractInfo = await sdk.getContract(address, {
        abi,
        metadata,
        cache,
      });

      const contractInstance = await sdk.getContractInstance(address, {
        abi,
        metadata,
      });

      setContract(contractInfo);
      setInstance(contractInstance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load contract');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isConnected, address, abi, metadata, cache]);

  // Auto-load contract
  useEffect(() => {
    if (autoLoad) {
      loadContract();
    }
  }, [autoLoad, loadContract]);

  const read = useCallback(
    async (method: string, ...args: any[]): Promise<any> => {
      if (!instance) {
        throw new Error('Contract not loaded');
      }

      return await instance.read(method, ...args);
    },
    [instance],
  );

  const write = useCallback(
    async (method: string, ...args: any[]): Promise<TransactionInfo> => {
      if (!instance) {
        throw new Error('Contract not loaded');
      }

      return await instance.write(method, ...args);
    },
    [instance],
  );

  const estimateGas = useCallback(
    async (method: string, ...args: any[]): Promise<string> => {
      if (!instance) {
        throw new Error('Contract not loaded');
      }

      return await instance.estimateGas(method, ...args);
    },
    [instance],
  );

  const getEvents = useCallback(
    async (eventName?: string): Promise<any[]> => {
      if (!instance) {
        throw new Error('Contract not loaded');
      }

      return await instance.getEvents(eventName);
    },
    [instance],
  );

  return {
    contract,
    instance,
    isLoading,
    error,
    read,
    write,
    estimateGas,
    getEvents,
  };
}

/**
 * useEvents - Event Subscription Hook
 *
 * Real-time event subscription with filtering, caching, and
 * automatic event management.
 *
 * @param options - Event subscription options
 * @returns Event subscription management
 *
 * @example
 * ```typescript
 * const { events, subscribe, count, lastEvent } = useEvents({
 *   realTime: true,
 *   maxEvents: 100,
 *   filters: { contract: '0x123...' }
 * });
 *
 * useEffect(() => {
 *   const unsubscribe = subscribe((event) => {
 *     console.log('New event:', event);
 *   });
 *
 *   return unsubscribe;
 * }, [subscribe]);
 * ```
 */
export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
  const { sdk, isConnected } = useSelendraSDK();
  const { filters = {}, realTime = false, maxEvents = 1000, autoPurge = true } = options;

  const [events, setEvents] = useState<EventSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  const subscribe = useCallback(
    (callback: (event: EventSubscription) => void): (() => void) => {
      if (!sdk || !isConnected) {
        return () => {};
      }

      const subscriptionId = Math.random().toString(36).substr(2, 9);

      const unsubscribe = sdk.subscribeToEvents({
        ...filters,
        callback: (event) => {
          callback(event);
          setEvents((prev) => {
            const newEvents = [event, ...prev];
            return autoPurge ? newEvents.slice(0, maxEvents) : newEvents;
          });
        },
      });

      subscriptionsRef.current.set(subscriptionId, unsubscribe);

      return () => {
        const unsub = subscriptionsRef.current.get(subscriptionId);
        if (unsub) {
          unsub();
          subscriptionsRef.current.delete(subscriptionId);
        }
      };
    },
    [sdk, isConnected, filters, autoPurge, maxEvents],
  );

  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach((unsubscribe) => unsubscribe());
    subscriptionsRef.current.clear();
  }, []);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  // Auto-subscribe if real-time is enabled
  useEffect(() => {
    if (realTime) {
      const unsubscribe = subscribe(() => {});

      return unsubscribe;
    }
  }, [realTime, subscribe]);

  const count = events.length;
  const lastEvent = events[0] || null;

  return {
    events,
    isLoading,
    error,
    subscribe,
    unsubscribeAll,
    clear,
    count,
    lastEvent,
  };
}

/**
 * useBlockSubscription - Block Tracking Hook
 *
 * Real-time block subscription with block details, extrinsics,
 * and event information.
 *
 * @param options - Block subscription options
 * @returns Block subscription management
 *
 * @example
 * ```typescript
 * const { blockNumber, blockHash, timestamp, subscribe } = useBlockSubscription({
 *   autoSubscribe: true,
 *   includeDetails: true
 * });
 *
 * useEffect(() => {
 *   const unsubscribe = subscribe((block) => {
 *     console.log('New block:', block.number);
 *   });
 *
 *   return unsubscribe;
 * }, [subscribe]);
 * ```
 */
export function useBlockSubscription(
  options: UseBlockSubscriptionOptions = {},
): UseBlockSubscriptionReturn {
  const { sdk, isConnected } = useSelendraSDK();
  const {
    autoSubscribe = false,
    includeDetails = true,
    includeExtrinsics = false,
    includeEvents = false,
  } = options;

  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [blockHash, setBlockHash] = useState<string | null>(null);
  const [block, setBlock] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback(
    (callback: (block: any) => void): (() => void) => {
      if (!sdk || !isConnected) {
        return () => {};
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      setIsSubscribed(true);

      unsubscribeRef.current = sdk.subscribeToBlocks({
        includeDetails,
        includeExtrinsics,
        includeEvents,
        callback: (blockData) => {
          setBlock(blockData);
          setBlockNumber(blockData.number);
          setBlockHash(blockData.hash);
          setTimestamp(blockData.timestamp);
          callback(blockData);
        },
      });

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
          setIsSubscribed(false);
        }
      };
    },
    [sdk, isConnected, includeDetails, includeExtrinsics, includeEvents],
  );

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsSubscribed(false);
    }
  }, []);

  // Auto-subscribe if enabled
  useEffect(() => {
    if (autoSubscribe) {
      const unsubscribe = subscribe(() => {});

      return unsubscribe;
    }
  }, [autoSubscribe, subscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    blockNumber,
    blockHash,
    block,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSubscribed,
    timestamp,
  };
}

/**
 * Advanced utility hooks for enhanced developer experience
 */

/**
 * useDebounce - Debounce value changes
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useLocalStorage - Persistent state in localStorage
 *
 * @param key - Storage key
 * @param initialValue - Initial value
 * @returns [value, setValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}

/**
 * usePrevious - Get previous value
 *
 * @param value - Current value
 * @returns Previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * useIsMounted - Check if component is mounted
 *
 * @returns Function to check mount status
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

// Re-export context from provider for convenience
export { useSelendraContext as useContext } from './provider';

/**
 * Advanced Hooks for Power Users
 */

/**
 * useMultiBalance - Track balances for multiple addresses
 *
 * @param addresses - Array of addresses to track
 * @param options - Balance tracking options
 * @returns Map of address to balance information
 */
export function useMultiBalance(
  addresses: string[],
  options: UseBalanceOptions = {},
): Map<string, UseBalanceReturn> {
  const balances = new Map<string, UseBalanceReturn>();

  addresses.forEach((address) => {
    const balanceHook = useBalance(address, options);
    balances.set(address, balanceHook);
  });

  return balances;
}

/**
 * useMultiContract - Interact with multiple contracts
 *
 * @param contracts - Array of contract configurations
 * @returns Map of address to contract hooks
 */
export function useMultiContract(
  contracts: Array<{ address: string; options?: UseContractOptions }>,
): Map<string, UseContractReturn> {
  const contractMap = new Map<string, UseContractReturn>();

  contracts.forEach(({ address, options = {} }) => {
    const contractHook = useContract(address, options);
    contractMap.set(address, contractHook);
  });

  return contractMap;
}

/**
 * useBatchTransactions - Batch multiple transactions
 *
 * @param transactions - Array of transactions to batch
 * @param options - Batch transaction options
 * @returns Batch transaction management
 */
export function useBatchTransactions(
  transactions: any[] = [],
  options: UseTransactionOptions = {},
): {
  submit: () => Promise<TransactionInfo[]>;
  results: TransactionInfo[];
  isLoading: boolean;
  error: Error | null;
  progress: number;
} {
  const [results, setResults] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const submit = useCallback(async (): Promise<TransactionInfo[]> => {
    if (transactions.length === 0) {
      return [];
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    try {
      const batchResults: TransactionInfo[] = [];

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];

        try {
          // This would need to be implemented in the SDK
          const result = await tx.send(); // Placeholder
          batchResults.push(result);
        } catch (err) {
          throw new Error(`Transaction ${i + 1} failed: ${err}`);
        }

        setProgress(((i + 1) / transactions.length) * 100);
      }

      setResults(batchResults);
      return batchResults;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch transaction failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [transactions]);

  return {
    submit,
    results,
    isLoading,
    error,
    progress,
  };
}
