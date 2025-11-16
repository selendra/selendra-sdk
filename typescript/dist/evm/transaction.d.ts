/**
 * EVM Transaction Management for the Selendra SDK
 * Provides transaction building, gas estimation, signing, and tracking
 * Compatible with ethers.js v6 transaction API
 */
import { EventEmitter } from 'events';
import type { Address, Balance, TransactionHash, GasAmount, Nonce } from '../types/common';
import type { EvmTransaction, EvmTransactionRequest, EvmTransactionReceipt, EvmTransactionType, EvmEstimateGasOptions } from '../types/evm';
/**
 * Transaction status enumeration
 */
export declare enum TransactionStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    FAILED = "failed",
    REPLACED = "replaced",
    CANCELLED = "cancelled"
}
/**
 * Transaction options for building and sending
 */
export interface TransactionOptions {
    /** Gas limit override */
    gasLimit?: GasAmount | 'auto';
    /** Gas price override */
    gasPrice?: Balance | 'auto';
    /** Maximum fee per gas (EIP-1559) */
    maxFeePerGas?: Balance | 'auto';
    /** Maximum priority fee per gas (EIP-1559) */
    maxPriorityFeePerGas?: Balance | 'auto';
    /** Transaction type override */
    type?: EvmTransactionType | 'auto';
    /** Number of confirmations to wait for */
    confirmations?: number;
    /** Transaction timeout in milliseconds */
    timeout?: number;
    /** Polling interval in milliseconds */
    pollingInterval?: number;
    /** Replace existing transaction if gas price increases */
    replaceable?: boolean;
    /** Access list for EIP-2930 transactions */
    accessList?: Array<{
        address: Address;
        storageKeys: string[];
    }>;
}
/**
 * Gas estimation result
 */
export interface GasEstimation {
    /** Estimated gas limit */
    gasLimit: string;
    /** Estimated gas price (legacy) */
    gasPrice?: string;
    /** Estimated max fee per gas (EIP-1559) */
    maxFeePerGas?: string;
    /** Estimated max priority fee per gas (EIP-1559) */
    maxPriorityFeePerGas?: string;
    /** Estimated total cost */
    estimatedCost: string;
    /** Recommended transaction type */
    recommendedType: EvmTransactionType;
}
/**
 * Transaction builder class
 */
export declare class TransactionBuilder {
    private transaction;
    constructor(from?: Address);
    /**
     * Set recipient address
     */
    to(address: Address): TransactionBuilder;
    /**
     * Set value to transfer (in ether)
     */
    value(amount: string | number): TransactionBuilder;
    /**
     * Set value to transfer (in wei)
     */
    valueWei(amount: Balance): TransactionBuilder;
    /**
     * Set transaction data
     */
    data(data: string): TransactionBuilder;
    /**
     * Set gas limit
     */
    gasLimit(limit: GasAmount): TransactionBuilder;
    /**
     * Set gas price (for legacy transactions)
     */
    gasPrice(price: string | number): TransactionBuilder;
    /**
     * Set EIP-1559 gas parameters
     */
    eip1559(maxFee: string | number, priorityFee: string | number): TransactionBuilder;
    /**
     * Set transaction nonce
     */
    nonce(nonceValue: Nonce): TransactionBuilder;
    /**
     * Set chain ID
     */
    chainId(chainIdValue: number): TransactionBuilder;
    /**
     * Set access list (EIP-2930)
     */
    accessList(list: Array<{
        address: Address;
        storageKeys: string[];
    }>): TransactionBuilder;
    /**
     * Build the transaction request
     */
    build(): EvmTransactionRequest;
    /**
     * Create a simple transfer transaction
     */
    static transfer(from: Address, to: Address, amount: string | number): TransactionBuilder;
    /**
     * Create a contract deployment transaction
     */
    static deploy(from: Address, bytecode: string): TransactionBuilder;
    /**
     * Create a contract interaction transaction
     */
    static contractInteraction(from: Address, to: Address, data: string): TransactionBuilder;
}
/**
 * Transaction manager for tracking and managing transactions
 */
export declare class TransactionManager extends EventEmitter {
    private provider;
    private pendingTransactions;
    private gasPriceCache?;
    private maxFeePerGasCache?;
    private maxPriorityFeePerGasCache?;
    constructor(provider: any);
    /**
     * Estimate gas for a transaction
     */
    estimateGas(tx: EvmTransactionRequest | EvmEstimateGasOptions): Promise<GasEstimation>;
    /**
     * Build a complete transaction with optimal gas settings
     */
    buildTransaction(request: EvmTransactionRequest, options?: TransactionOptions): Promise<EvmTransactionRequest>;
    /**
     * Send a transaction and start tracking it
     */
    sendTransaction(request: EvmTransactionRequest, options?: TransactionOptions): Promise<TransactionTracker>;
    /**
     * Get transaction tracker by hash
     */
    getTracker(txHash: TransactionHash): TransactionTracker | undefined;
    /**
     * Get all pending transactions
     */
    getPendingTransactions(): TransactionTracker[];
    /**
     * Cancel a transaction
     */
    cancelTransaction(txHash: TransactionHash, fromAddress: Address): Promise<TransactionHash>;
    /**
     * Speed up a transaction (replace with higher gas price)
     */
    speedUpTransaction(txHash: TransactionHash): Promise<TransactionHash>;
    /**
     * Get current gas price (cached for 30 seconds)
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
     * Check if network supports EIP-1559
     */
    supportsEIP1559(): Promise<boolean>;
    /**
     * Setup event listeners for transaction tracker
     */
    private setupTrackerEvents;
    /**
     * Clean up resources
     */
    destroy(): void;
}
/**
 * Transaction tracker for monitoring individual transactions
 */
export declare class TransactionTracker extends EventEmitter {
    private readonly hash;
    private readonly transaction;
    private readonly provider;
    private readonly options;
    private status;
    private receipt?;
    private isTracking;
    private trackingTimer?;
    private timeoutTimer?;
    constructor(hash: TransactionHash, transaction: EvmTransactionRequest, provider: any, options: {
        confirmations: number;
        timeout: number;
        pollingInterval: number;
        replaceable: boolean;
    });
    /**
     * Get transaction hash
     */
    getHash(): TransactionHash;
    /**
     * Get original transaction
     */
    getTransaction(): EvmTransactionRequest;
    /**
     * Get transaction nonce
     */
    getNonce(): number;
    /**
     * Get current status
     */
    getStatus(): TransactionStatus;
    /**
     * Get transaction receipt (if available)
     */
    getReceipt(): EvmTransactionReceipt | undefined;
    /**
     * Check if transaction is finalized
     */
    isFinalized(): boolean;
    /**
     * Check if transaction is replaceable
     */
    isReplaceable(): boolean;
    /**
     * Start tracking the transaction
     */
    startTracking(): void;
    /**
     * Stop tracking the transaction
     */
    stopTracking(): void;
    /**
     * Wait for transaction confirmation
     */
    waitForConfirmation(): Promise<EvmTransactionReceipt>;
    /**
     * Start polling for transaction updates
     */
    private startPolling;
    /**
     * Start timeout timer
     */
    private startTimeout;
    /**
     * Update transaction status
     */
    private updateStatus;
}
/**
 * Transaction utilities
 */
export declare class TransactionUtils {
    /**
     * Calculate transaction fee
     */
    static calculateFee(gasUsed: string | number, gasPrice: Balance): Balance;
    /**
     * Calculate EIP-1559 transaction fee
     */
    static calculateEIP1559Fee(gasUsed: string | number, baseFee: Balance, priorityFee: Balance): Balance;
    /**
     * Format transaction value
     */
    static formatValue(value: Balance, decimals?: number): string;
    /**
     * Validate transaction request
     */
    static validateTransaction(tx: EvmTransactionRequest): string[];
    /**
     * Create transaction hash from transaction data
     */
    static createTransactionHash(tx: EvmTransaction): TransactionHash;
}
export default TransactionManager;
//# sourceMappingURL=transaction.d.ts.map