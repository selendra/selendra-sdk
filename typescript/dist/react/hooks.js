"use strict";
/**
 * React Hooks for Selendra SDK
 *
 * Premium React hooks that provide seamless integration with Selendra blockchain.
 * Built with performance, type safety, and developer experience in mind.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useContext = void 0;
exports.useSelendraSDK = useSelendraSDK;
exports.useBalance = useBalance;
exports.useAccount = useAccount;
exports.useTransaction = useTransaction;
exports.useContract = useContract;
exports.useEvents = useEvents;
exports.useBlockSubscription = useBlockSubscription;
exports.useDebounce = useDebounce;
exports.useLocalStorage = useLocalStorage;
exports.usePrevious = usePrevious;
exports.useIsMounted = useIsMounted;
exports.useMultiBalance = useMultiBalance;
exports.useMultiContract = useMultiContract;
exports.useBatchTransactions = useBatchTransactions;
const react_1 = require("react");
const provider_1 = require("./provider");
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
function useSelendraSDK() {
    return (0, provider_1.useSelendraContext)();
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
function useBalance(address, options = {}) {
    const { sdk, isConnected } = useSelendraSDK();
    const { refreshInterval = 10000, includeUSD = true, includeMetadata = true, realTime = true } = options;
    const [balance, setBalance] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const intervalRef = (0, react_1.useRef)();
    const fetchBalance = (0, react_1.useCallback)(async () => {
        if (!sdk || !isConnected || !address)
            return;
        try {
            setIsLoading(true);
            setError(null);
            const balanceInfo = await sdk.getBalance(address, {
                includeUSD,
                includeMetadata
            });
            setBalance(balanceInfo);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch balance');
            setError(error);
        }
        finally {
            setIsLoading(false);
        }
    }, [sdk, isConnected, address, includeUSD, includeMetadata]);
    // Initial fetch
    (0, react_1.useEffect)(() => {
        fetchBalance();
    }, [fetchBalance]);
    // Set up interval for real-time updates
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
        if (!sdk || !isConnected || !address || !realTime)
            return;
        let unsubscribe = null;
        try {
            unsubscribe = sdk.subscribeToBalanceChanges(address, (newBalance) => {
                setBalance(newBalance);
            });
        }
        catch (err) {
            // Subscription not supported, fallback to polling
            console.warn('Balance subscription not supported, using polling');
        }
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [sdk, isConnected, address, realTime]);
    const formatted = (0, react_1.useMemo)(() => {
        if (!balance) {
            return {
                native: '0',
                symbol: 'SEL',
                decimals: 18
            };
        }
        const native = (Number(balance.balance) / Math.pow(10, balance.decimals)).toFixed(6);
        return {
            native,
            usd: includeUSD && balance.usdValue
                ? `$${(Number(balance.usdValue) / Math.pow(10, balance.decimals)).toFixed(2)}`
                : undefined,
            symbol: balance.symbol || 'SEL',
            decimals: balance.decimals
        };
    }, [balance, includeUSD]);
    return {
        balance,
        isLoading,
        error,
        refresh: fetchBalance,
        formatted,
        wei: balance?.balance || '0'
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
function useAccount(options = {}) {
    const { sdk, isConnected } = useSelendraSDK();
    const { refreshInterval = 15000, includeBalance = true, includeHistory = false, historyLimit = 100 } = options;
    const [account, setAccount] = (0, react_1.useState)(null);
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const intervalRef = (0, react_1.useRef)();
    const fetchAccount = (0, react_1.useCallback)(async () => {
        if (!sdk || !isConnected)
            return;
        try {
            setIsLoading(true);
            setError(null);
            const accountInfo = await sdk.getAccount();
            setAccount(accountInfo);
            if (includeHistory) {
                const txHistory = await sdk.getTransactionHistory(historyLimit);
                setTransactions(txHistory);
            }
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch account');
            setError(error);
        }
        finally {
            setIsLoading(false);
        }
    }, [sdk, isConnected, includeBalance, includeHistory, historyLimit]);
    // Initial fetch
    (0, react_1.useEffect)(() => {
        fetchAccount();
    }, [fetchAccount]);
    // Set up refresh interval
    (0, react_1.useEffect)(() => {
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
        hasBalance
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
function useTransaction(options = {}) {
    const { sdk } = useSelendraSDK();
    const { autoSign = false, waitForInclusion = true, waitForFinality = false, timeout = 30000, showProgress = false } = options;
    const [status, setStatus] = (0, react_1.useState)('idle');
    const [transaction, setTransaction] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const abortControllerRef = (0, react_1.useRef)(null);
    const submit = (0, react_1.useCallback)(async (tx, submitOptions = {}) => {
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
                timeout: mergedOptions.timeout ?? timeout
            });
            // Update status based on result
            if (txResult.status === 'finalized') {
                setStatus('finalized');
            }
            else if (txResult.status === 'included') {
                setStatus('included');
            }
            else {
                setStatus('pending');
            }
            setTransaction(txResult);
            // Show progress notification
            if (showProgress) {
                // This would integrate with a toast notification system
                console.log(`Transaction ${txResult.hash}: ${txResult.status}`);
            }
            return txResult;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Transaction failed');
            setStatus('failed');
            setError(error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, [sdk, options, autoSign, waitForInclusion, waitForFinality, timeout, showProgress]);
    const cancel = (0, react_1.useCallback)(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setStatus('idle');
        setIsLoading(false);
    }, []);
    const reset = (0, react_1.useCallback)(() => {
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
        reset
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
function useContract(address, options = {}) {
    const { sdk, isConnected } = useSelendraSDK();
    const { autoLoad = true, abi, metadata, cache = true } = options;
    const [contract, setContract] = (0, react_1.useState)(null);
    const [instance, setInstance] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const loadContract = (0, react_1.useCallback)(async () => {
        if (!sdk || !isConnected || !address)
            return;
        try {
            setIsLoading(true);
            setError(null);
            const contractInfo = await sdk.getContract(address, {
                abi,
                metadata,
                cache
            });
            const contractInstance = await sdk.getContractInstance(address, {
                abi,
                metadata
            });
            setContract(contractInfo);
            setInstance(contractInstance);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to load contract');
            setError(error);
        }
        finally {
            setIsLoading(false);
        }
    }, [sdk, isConnected, address, abi, metadata, cache]);
    // Auto-load contract
    (0, react_1.useEffect)(() => {
        if (autoLoad) {
            loadContract();
        }
    }, [autoLoad, loadContract]);
    const read = (0, react_1.useCallback)(async (method, ...args) => {
        if (!instance) {
            throw new Error('Contract not loaded');
        }
        return await instance.read(method, ...args);
    }, [instance]);
    const write = (0, react_1.useCallback)(async (method, ...args) => {
        if (!instance) {
            throw new Error('Contract not loaded');
        }
        return await instance.write(method, ...args);
    }, [instance]);
    const estimateGas = (0, react_1.useCallback)(async (method, ...args) => {
        if (!instance) {
            throw new Error('Contract not loaded');
        }
        return await instance.estimateGas(method, ...args);
    }, [instance]);
    const getEvents = (0, react_1.useCallback)(async (eventName) => {
        if (!instance) {
            throw new Error('Contract not loaded');
        }
        return await instance.getEvents(eventName);
    }, [instance]);
    return {
        contract,
        instance,
        isLoading,
        error,
        read,
        write,
        estimateGas,
        getEvents
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
function useEvents(options = {}) {
    const { sdk, isConnected } = useSelendraSDK();
    const { filters = {}, realTime = false, maxEvents = 1000, autoPurge = true } = options;
    const [events, setEvents] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const subscriptionsRef = (0, react_1.useRef)(new Map());
    const subscribe = (0, react_1.useCallback)((callback) => {
        if (!sdk || !isConnected) {
            return () => { };
        }
        const subscriptionId = Math.random().toString(36).substr(2, 9);
        const unsubscribe = sdk.subscribeToEvents({
            ...filters,
            callback: (event) => {
                callback(event);
                setEvents(prev => {
                    const newEvents = [event, ...prev];
                    return autoPurge ? newEvents.slice(0, maxEvents) : newEvents;
                });
            }
        });
        subscriptionsRef.current.set(subscriptionId, unsubscribe);
        return () => {
            const unsub = subscriptionsRef.current.get(subscriptionId);
            if (unsub) {
                unsub();
                subscriptionsRef.current.delete(subscriptionId);
            }
        };
    }, [sdk, isConnected, filters, autoPurge, maxEvents]);
    const unsubscribeAll = (0, react_1.useCallback)(() => {
        subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
        subscriptionsRef.current.clear();
    }, []);
    const clear = (0, react_1.useCallback)(() => {
        setEvents([]);
    }, []);
    // Auto-subscribe if real-time is enabled
    (0, react_1.useEffect)(() => {
        if (realTime) {
            const unsubscribe = subscribe(() => { });
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
        lastEvent
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
function useBlockSubscription(options = {}) {
    const { sdk, isConnected } = useSelendraSDK();
    const { autoSubscribe = false, includeDetails = true, includeExtrinsics = false, includeEvents = false } = options;
    const [blockNumber, setBlockNumber] = (0, react_1.useState)(null);
    const [blockHash, setBlockHash] = (0, react_1.useState)(null);
    const [block, setBlock] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [isSubscribed, setIsSubscribed] = (0, react_1.useState)(false);
    const [timestamp, setTimestamp] = (0, react_1.useState)(null);
    const unsubscribeRef = (0, react_1.useRef)(null);
    const subscribe = (0, react_1.useCallback)((callback) => {
        if (!sdk || !isConnected) {
            return () => { };
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
            }
        });
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
                setIsSubscribed(false);
            }
        };
    }, [sdk, isConnected, includeDetails, includeExtrinsics, includeEvents]);
    const unsubscribe = (0, react_1.useCallback)(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
            setIsSubscribed(false);
        }
    }, []);
    // Auto-subscribe if enabled
    (0, react_1.useEffect)(() => {
        if (autoSubscribe) {
            const unsubscribe = subscribe(() => { });
            return unsubscribe;
        }
    }, [autoSubscribe, subscribe]);
    // Cleanup on unmount
    (0, react_1.useEffect)(() => {
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
        timestamp
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
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = (0, react_1.useState)(value);
    (0, react_1.useEffect)(() => {
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
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = (0, react_1.useState)(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });
    const setValue = (0, react_1.useCallback)((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);
    return [storedValue, setValue];
}
/**
 * usePrevious - Get previous value
 *
 * @param value - Current value
 * @returns Previous value
 */
function usePrevious(value) {
    const ref = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
        ref.current = value;
    });
    return ref.current;
}
/**
 * useIsMounted - Check if component is mounted
 *
 * @returns Function to check mount status
 */
function useIsMounted() {
    const isMounted = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);
    return (0, react_1.useCallback)(() => isMounted.current, []);
}
// Re-export context from provider for convenience
var provider_2 = require("./provider");
Object.defineProperty(exports, "useContext", { enumerable: true, get: function () { return provider_2.useSelendraContext; } });
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
function useMultiBalance(addresses, options = {}) {
    const balances = new Map();
    addresses.forEach(address => {
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
function useMultiContract(contracts) {
    const contractMap = new Map();
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
function useBatchTransactions(transactions = [], options = {}) {
    const [results, setResults] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [progress, setProgress] = (0, react_1.useState)(0);
    const submit = (0, react_1.useCallback)(async () => {
        if (transactions.length === 0) {
            return [];
        }
        setIsLoading(true);
        setError(null);
        setResults([]);
        setProgress(0);
        try {
            const batchResults = [];
            for (let i = 0; i < transactions.length; i++) {
                const tx = transactions[i];
                try {
                    // This would need to be implemented in the SDK
                    const result = await tx.send(); // Placeholder
                    batchResults.push(result);
                }
                catch (err) {
                    throw new Error(`Transaction ${i + 1} failed: ${err}`);
                }
                setProgress(((i + 1) / transactions.length) * 100);
            }
            setResults(batchResults);
            return batchResults;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Batch transaction failed');
            setError(error);
            throw error;
        }
        finally {
            setIsLoading(false);
            setProgress(0);
        }
    }, [transactions]);
    return {
        submit,
        results,
        isLoading,
        error,
        progress
    };
}
//# sourceMappingURL=hooks.js.map