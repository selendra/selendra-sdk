/**
 * React Hooks for Selendra SDK
 *
 * Premium React hooks that provide seamless integration with Selendra blockchain.
 * Built with performance, type safety, and developer experience in mind.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */
import { AccountInfo, BalanceInfo, TransactionInfo, ContractInfo, EventSubscription, BlockInfo } from '../types';
import { SelendraContextValue } from './provider';
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
export declare function useSelendraSDK(): SelendraContextValue;
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
export declare function useBalance(address?: string, options?: UseBalanceOptions): UseBalanceReturn;
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
export declare function useAccount(options?: UseAccountOptions): UseAccountReturn;
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
export declare function useTransaction(options?: UseTransactionOptions): UseTransactionReturn;
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
export declare function useContract(address: string, options?: UseContractOptions): UseContractReturn;
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
export declare function useEvents(options?: UseEventsOptions): UseEventsReturn;
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
export declare function useBlockSubscription(options?: UseBlockSubscriptionOptions): UseBlockSubscriptionReturn;
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
export declare function useDebounce<T>(value: T, delay: number): T;
/**
 * useLocalStorage - Persistent state in localStorage
 *
 * @param key - Storage key
 * @param initialValue - Initial value
 * @returns [value, setValue] tuple
 */
export declare function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void];
/**
 * usePrevious - Get previous value
 *
 * @param value - Current value
 * @returns Previous value
 */
export declare function usePrevious<T>(value: T): T | undefined;
/**
 * useIsMounted - Check if component is mounted
 *
 * @returns Function to check mount status
 */
export declare function useIsMounted(): () => boolean;
export { useSelendraContext as useContext } from './provider';
/**
 * Advanced Hooks for Power Users
 */
/**
 * useMultiBalance - Track balances for multiple addresses
 *
 * @param addresses - Array of addresses to track
 * @param options - Balance tracking options
 * @returns Balance information with refresh capability
 */
export declare function useMultiBalance(addresses: string[], options?: UseBalanceOptions): {
    balances: Array<{
        address: string;
        balance: BalanceInfo | null;
        isLoading: boolean;
        error: Error | null;
    }>;
    isLoading: boolean;
    refresh: () => void;
};
/**
 * useMultiContract - Interact with multiple contracts
 *
 * @param contracts - Array of contract configurations or addresses
 * @returns Contract information with refresh capability
 */
export declare function useMultiContract(contracts: Array<string> | Array<{
    address: string;
    options?: UseContractOptions;
}>): {
    contracts: Array<{
        address: string;
        contract: any;
        isLoading: boolean;
        error: Error | null;
    }>;
    isLoading: boolean;
    refresh: () => void;
};
/**
 * useBatchTransactions - Batch multiple transactions
 *
 * @param transactions - Array of transactions to batch
 * @param options - Batch transaction options
 * @returns Batch transaction management with status control
 */
export declare function useBatchTransactions(transactions?: any[], options?: UseTransactionOptions): {
    submit: () => Promise<TransactionInfo[]>;
    cancel: () => void;
    reset: () => void;
    transactions: TransactionInfo[];
    status: 'idle' | 'pending' | 'success' | 'error';
    isLoading: boolean;
    error: Error | null;
    progress: number;
};
//# sourceMappingURL=hooks.d.ts.map