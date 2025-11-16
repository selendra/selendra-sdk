/**
 * Selendra SDK - Main Class
 *
 * Comprehensive SDK for interacting with the Selendra blockchain.
 * Supports both Substrate and EVM chains with unified interface.
 *
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 0.1.0
 */
import { EventEmitter } from 'eventemitter3';
import { Network, ChainType, type SDKConfig, type ConnectionInfo, type AccountInfo, type BalanceInfo, type TransactionInfo, type ContractInfo, type BlockInfo, type EventSubscription } from './types';
/**
 * Main Selendra SDK class
 */
export declare class SelendraSDK extends EventEmitter {
    private api;
    private evmClient;
    private config;
    private isConnecting;
    private isConnected;
    constructor(config?: SDKConfig);
    /**
     * Connect to the blockchain
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the blockchain
     */
    disconnect(): Promise<void>;
    /**
     * Get connection information
     */
    getConnectionInfo(): ConnectionInfo;
    /**
     * Get account information
     */
    getAccount(): Promise<AccountInfo>;
    /**
     * Get balance for an address
     */
    getBalance(address: string, options?: {
        includeUSD?: boolean;
        includeMetadata?: boolean;
    }): Promise<BalanceInfo>;
    /**
     * Submit a transaction
     */
    submitTransaction(transaction: any, options?: {
        autoSign?: boolean;
        waitForInclusion?: boolean;
        waitForFinality?: boolean;
        timeout?: number;
    }): Promise<TransactionInfo>;
    /**
     * Get transaction history
     */
    getTransactionHistory(limit?: number): Promise<TransactionInfo[]>;
    /**
     * Get contract information
     */
    getContract(address: string, options?: {
        abi?: any;
        metadata?: any;
        cache?: boolean;
    }): Promise<ContractInfo>;
    /**
     * Get contract instance
     */
    getContractInstance(address: string, options?: {
        abi?: any;
        metadata?: any;
    }): Promise<any>;
    /**
     * Subscribe to balance changes
     */
    subscribeToBalanceChanges(address: string, callback: (balance: BalanceInfo) => void): () => void;
    /**
     * Subscribe to events
     */
    subscribeToEvents(options: {
        callback: (event: EventSubscription) => void;
        filters?: Record<string, any>;
    }): () => void;
    /**
     * Subscribe to blocks
     */
    subscribeToBlocks(options: {
        callback: (block: BlockInfo) => void;
        includeDetails?: boolean;
        includeExtrinsics?: boolean;
        includeEvents?: boolean;
    }): () => void;
    /**
     * Get current block
     */
    getCurrentBlock(): Promise<BlockInfo>;
    /**
     * Builder pattern for configuring SDK
     */
    withEndpoint(endpoint: string): SelendraSDK;
    withNetwork(network: Network): SelendraSDK;
    withChainType(chainType: ChainType): SelendraSDK;
    withOptions(options: Partial<SDKConfig>): SelendraSDK;
    /**
     * Connect to EVM chain
     */
    private connectEVM;
    /**
     * Connect to Substrate chain
     */
    private connectSubstrate;
    /**
     * Ensure SDK is connected
     */
    private ensureConnected;
}
/**
 * Network enumeration
 */
export declare enum Network {
    Selendra = "selendra",
    SelendraTestnet = "selendra-testnet",
    Ethereum = "ethereum",
    Polygon = "polygon",
    BSC = "bsc"
}
/**
 * Chain type enumeration
 */
export declare enum ChainType {
    Substrate = "substrate",
    EVM = "evm"
}
/**
 * SDK configuration interface
 */
export interface SDKConfig {
    endpoint?: string;
    network?: Network;
    chainType?: ChainType;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}
/**
 * Create SDK instance with factory function
 */
export declare function createSDK(config?: SDKConfig): SelendraSDK;
/**
 * Default SDK instance
 */
export declare const sdk: SelendraSDK;
/**
 * Legacy export for backward compatibility
 */
export default SelendraSDK;
//# sourceMappingURL=sdk.d.ts.map