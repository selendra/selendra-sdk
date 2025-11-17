/**
 * EVM Client for the Selendra SDK
 * Provides ethers.js v6 compatible API for interacting with Selendra's EVM
 * Supports full Ethereum JSON-RPC interface, WebSocket connections, and contract interactions
 */
import { EventEmitter } from 'events';
import type { Address, Balance, BlockNumber, BlockHash, NetworkStatus } from '../types/common';
import type { EvmTransaction, EvmTransactionRequest, EvmTransactionReceipt, EvmBlock, EvmLog, EvmFilter, EvmCallOptions, EvmEstimateGasOptions } from '../types/evm';
import type { TransactionInfo } from '../types/sdk-types';
import { EvmClientConfig } from './config';
import { Contract, ERC20Contract, ERC721Contract, ContractFactory } from './contract';
import { TransactionManager } from './transaction';
/**
 * Provider types
 */
export type ProviderType = 'http' | 'websocket' | 'ipc';
/**
 * Network information
 */
export interface Network {
    name: string;
    chainId: number;
    ensAddress?: Address;
}
/**
 * Block with transactions
 */
export interface BlockWithTransactions extends EvmBlock {
    transactions: EvmTransaction[];
}
/**
 * Block with transaction hashes
 */
export interface BlockWithHashes extends EvmBlock {
    transactions: string[];
}
/**
 * EVM provider options
 */
export interface ProviderOptions {
    /** Provider type */
    type?: ProviderType;
    /** Connection timeout in milliseconds */
    timeout?: number;
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Retry delay in milliseconds */
    retryDelay?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Custom headers for HTTP requests */
    headers?: Record<string, string>;
    /** WebSocket connection options */
    ws?: {
        /** WebSocket protocol version */
        protocol?: string;
        /** WebSocket origin */
        origin?: string;
        /** Additional WebSocket options */
        options?: Record<string, unknown>;
    };
}
/**
 * EVM client implementation with ethers.js v6 compatibility
 */
export declare class SelendraEvmClient extends EventEmitter {
    protected readonly config: EvmClientConfig;
    private readonly transactionManager;
    private network?;
    private blockNumber?;
    private isReady;
    private subscriptions;
    constructor(config?: Partial<EvmClientConfig>);
    /**
     * Get network information
     */
    getNetwork(): Promise<Network>;
    /**
     * Get block number
     */
    getBlockNumber(): Promise<BlockNumber>;
    /**
     * Get block by number or hash
     */
    getBlock(blockHashOrNumber: BlockHash | BlockNumber | 'latest' | 'earliest' | 'pending', includeTransactions?: boolean): Promise<BlockWithTransactions | BlockWithHashes | null>;
    /**
     * Get transaction by hash
     */
    getTransaction(hash: string): Promise<EvmTransaction | null>;
    /**
     * Get transaction receipt
     */
    getTransactionReceipt(hash: string): Promise<EvmTransactionReceipt | null>;
    /**
     * Send transaction
     */
    sendTransaction(signedTransaction: string): Promise<{
        hash: string;
        wait: () => Promise<EvmTransactionReceipt>;
    }>;
    /**
     * Call contract method (read-only)
     */
    call(transaction: EvmCallOptions, blockTag?: string | number): Promise<string>;
    /**
     * Estimate gas for transaction
     */
    estimateGas(transaction: EvmEstimateGasOptions): Promise<number>;
    /**
     * Get gas price
     */
    getGasPrice(): Promise<string>;
    /**
     * Get max fee per gas (EIP-1559)
     */
    getMaxFeePerGas(): Promise<string>;
    /**
     * Get max priority fee per gas (EIP-1559)
     */
    getMaxPriorityFeePerGas(): Promise<string>;
    /**
     * Get balance
     */
    getBalance(address: Address, blockTag?: string | number): Promise<Balance>;
    /**
     * Get transaction count (nonce)
     */
    getTransactionCount(address: Address, blockTag?: string | number): Promise<number>;
    /**
     * Get code at address
     */
    getCode(address: Address, blockTag?: string | number): Promise<string>;
    /**
     * Get storage slot value
     */
    getStorageAt(address: Address, position: string, blockTag?: string | number): Promise<string>;
    /**
     * Get logs
     */
    getLogs(filter: EvmFilter): Promise<EvmLog[]>;
    /**
     * Subscribe to events (WebSocket only)
     */
    subscribe(type: 'newHeads' | 'logs' | 'pendingTransactions', params?: any): Promise<string>;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): Promise<boolean>;
    /**
     * Create contract instance
     */
    getContract(address: Address, abi: any[]): Contract;
    /**
     * Create ERC20 contract instance
     */
    getERC20Contract(address: Address): ERC20Contract;
    /**
     * Create ERC721 contract instance
     */
    getERC721Contract(address: Address): ERC721Contract;
    /**
     * Create contract factory
     */
    getContractFactory(abi: any[], bytecode: string): ContractFactory;
    /**
     * Send JSON-RPC request
     */
    send(method: string, params?: any[]): Promise<any>;
    /**
     * Batch send multiple requests
     */
    sendBatch(requests: Array<{
        method: string;
        params?: any[];
    }>): Promise<any[]>;
    /**
     * Send raw transaction and wait for confirmation
     */
    sendAndWaitTransaction(signedTransaction: string, confirmations?: number): Promise<EvmTransactionReceipt>;
    /**
     * Wait for transaction
     */
    waitForTransaction(hash: string, confirmations?: number, timeout?: number): Promise<EvmTransactionReceipt | null>;
    /**
     * Check if address is a contract
     */
    isContract(address: Address): Promise<boolean>;
    /**
     * Get network status
     */
    getNetworkStatus(): Promise<NetworkStatus>;
    /**
     * Get transaction manager
     */
    getTransactionManager(): TransactionManager;
    /**
     * Get configuration
     */
    getConfig(): EvmClientConfig;
    /**
     * Check if client is ready
     */
    getIsReady(): boolean;
    /**
     * Reset connection state
     */
    reset(): void;
    /**
     * Connect to the EVM network
     * @returns Promise that resolves when connected
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the EVM network
     */
    disconnect(): Promise<void>;
    /**
     * Get account information for a given address
     * @param address - The account address
     * @returns Account information including balance and nonce
     */
    getAccount(address: Address): Promise<{
        address: Address;
        balance: Balance;
        nonce: number;
        type: 'evm';
        isActive: boolean;
    }>;
    /**
     * Get Selendra price from oracles
     * Auto-activates when Selendra lists on price oracles
     * @returns Price in USD or null if not listed on oracles
     * @private
     */
    private getSelendraPrice;
    /**
     * Fetch price from CoinGecko API
     * @param tokenId - CoinGecko token ID
     * @returns Price in USD or null
     * @private
     */
    private fetchFromCoinGecko;
    /**
     * Fetch price from CoinMarketCap API
     * @param symbol - Token symbol
     * @returns Price in USD or null
     * @private
     */
    private fetchFromCoinMarketCap;
    /**
     * Fetch price from Chainlink oracle
     * @param pair - Trading pair (e.g., 'SEL/USD')
     * @returns Price in USD or null
     * @private
     */
    private fetchFromChainlink;
    /**
     * Get balance information for an address
     * @param address - The account address
     * @param options - Additional options for balance retrieval
     * @returns Detailed balance information
     */
    getBalanceInfo(address: Address, options?: {
        includeUSD?: boolean;
        includeMetadata?: boolean;
    }): Promise<{
        total: Balance;
        free: Balance;
        reserved: Balance;
        frozen: Balance;
        symbol: string;
        decimals: number;
        usd?: number;
        metadata?: Record<string, any>;
    }>;
    /**
     * Submit a transaction to the network
     * @param transaction - Transaction request or signed transaction string
     * @param options - Transaction options
     * @returns Transaction information
     */
    submitTransaction(transaction: EvmTransactionRequest | string, options?: {
        autoSign?: boolean;
        waitForInclusion?: boolean;
        waitForFinality?: boolean;
        timeout?: number;
    }): Promise<TransactionInfo>;
    /**
     * Get transaction history for an address
     * @param address - The account address
     * @param limit - Maximum number of transactions to return
     * @returns Array of transaction information
     */
    getTransactionHistory(address: Address, limit?: number): Promise<Array<{
        hash: string;
        blockNumber?: number;
        from: string;
        to?: string;
        value: string;
        fee?: string;
        nonce: number;
        status: string;
        timestamp: number;
    }>>;
    /**
     * Get contract instance
     * @param address - Contract address
     * @param options - Contract options including ABI
     * @returns Contract instance
     */
    getContractInstance(address: Address, options?: {
        abi?: any;
        metadata?: any;
    }): Promise<Contract>;
    /**
     * Subscribe to balance changes for an address
     * @param address - The account address
     * @param callback - Callback function when balance changes
     * @returns Unsubscribe function
     */
    subscribeToBalanceChanges(address: Address, callback: (balance: any) => void): () => void;
    /**
     * Subscribe to events
     * @param options - Event subscription options
     * @returns Unsubscribe function
     */
    subscribeToEvents(options: {
        callback: (event: any) => void;
        filter?: EvmFilter;
    }): () => void;
    /**
     * Subscribe to new blocks
     * @param options - Block subscription options
     * @returns Unsubscribe function
     */
    subscribeToBlocks(options: {
        callback: (block: any) => void;
        includeTransactions?: boolean;
    }): () => void;
    /**
     * Get current block information
     * @returns Current block information
     */
    getCurrentBlock(): Promise<{
        number: number;
        hash: string;
        parentHash: string;
        timestamp: number;
        transactionCount: number;
    }>;
    /**
     * Destroy client and cleanup resources
     */
    destroy(): void;
    /**
     * Format block data
     */
    private formatBlock;
    /**
     * Format transaction data
     */
    private formatTransaction;
    /**
     * Format transaction receipt
     */
    private formatTransactionReceipt;
    /**
     * Setup event listeners
     */
    private setupEventListeners;
}
/**
 * WebSocket provider for real-time updates
 */
export declare class WebSocketProvider extends SelendraEvmClient {
    private ws?;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor(config?: Partial<EvmClientConfig> & {
        wsUrl?: string;
    });
    /**
     * Connect to WebSocket endpoint
     */
    private connectWebSocket;
    /**
     * Handle WebSocket message
     */
    private handleWebSocketMessage;
    /**
     * Attempt to reconnect
     */
    private attemptReconnect;
    /**
     * Send WebSocket message
     */
    send(method: string, params?: any[]): Promise<any>;
    /**
     * Disconnect WebSocket
     */
    disconnect(): Promise<void>;
    /**
     * Destroy WebSocket provider
     */
    destroy(): void;
}
/**
 * HTTP provider for basic JSON-RPC calls
 */
export declare class HttpProvider extends SelendraEvmClient {
    constructor(config?: Partial<EvmClientConfig>);
}
/**
 * Factory function to create EVM client
 */
export declare function createEvmClient(config?: Partial<EvmClientConfig>): SelendraEvmClient;
/**
 * Factory function to create WebSocket provider
 */
export declare function createWebSocketProvider(config?: Partial<EvmClientConfig> & {
    wsUrl?: string;
}): WebSocketProvider;
/**
 * Factory function to create HTTP provider
 */
export declare function createHttpProvider(config?: Partial<EvmClientConfig>): HttpProvider;
export default SelendraEvmClient;
//# sourceMappingURL=client.d.ts.map