/**
 * Main SelendraSDK class that provides unified access to both Substrate and EVM functionality
 */
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';
import type { NetworkConfig, Network, ChainInfo, Address, Balance } from '../types';
import { SubstrateClient } from './substrate';
import { EvmClient } from './evm';
import { UnifiedClient } from './unified';
export { Network };
/**
 * Configuration options for SDK initialization
 */
export interface SDKConfig {
    /** Network endpoint URL */
    endpoint?: string;
    /** Network name or configuration */
    network?: Network | NetworkConfig;
    /** Default address format for Substrate addresses */
    ss58Format?: number;
    /** Connection timeout in milliseconds */
    timeout?: number;
    /** Auto-connect on initialization */
    autoConnect?: boolean;
    /** Custom provider for Substrate */
    substrateProvider?: WsProvider;
    /** Custom provider for EVM */
    evmProvider?: ethers.JsonRpcProvider;
}
/**
 * Main SelendraSDK class
 *
 * Provides unified access to both Substrate and EVM chains in the Selendra ecosystem.
 * Built on top of @polkadot/api and ethers.js for maximum compatibility.
 *
 * @example
 * ```typescript
 * const sdk = new SelendraSDK()
 *   .withEndpoint('wss://rpc.selendra.org')
 *   .withNetwork(Network.Selendra);
 *
 * const chainInfo = await sdk.chainInfo();
 * const balance = await sdk.getBalance('0x...');
 * ```
 */
export declare class SelendraSDK {
    private config;
    private connectionManager;
    private substrateClient?;
    private evmClient?;
    private unifiedClient?;
    private _isConnected;
    constructor(config?: SDKConfig);
    /**
     * Configure the RPC endpoint
     */
    withEndpoint(endpoint: string): this;
    /**
     * Configure the network
     */
    withNetwork(network: Network | NetworkConfig): this;
    /**
     * Configure additional options
     */
    withOptions(options: Partial<SDKConfig>): this;
    /**
     * Connect to the network
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the network
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected to the network
     */
    isConnected(): boolean;
    /**
     * Get the current network configuration
     */
    getNetwork(): NetworkConfig | undefined;
    /**
     * Get chain information
     */
    chainInfo(): Promise<ChainInfo>;
    /**
     * Get the Substrate client
     */
    get substrate(): SubstrateClient;
    /**
     * Get the EVM client
     */
    get evm(): EvmClient;
    /**
     * Get the unified client for cross-chain operations
     */
    get unified(): UnifiedClient;
    /**
     * Create a new account/keyring pair
     */
    createAccount(mnemonic?: string): {
        address: string;
        privateKey: string;
        mnemonic: string;
    };
    /**
     * Create an EVM account
     */
    createEvmAccount(): {
        address: string;
        privateKey: string;
    };
    /**
     * Get balance for any address type
     */
    getBalance(address: Address): Promise<Balance>;
    /**
     * Transfer tokens between addresses
     */
    transfer(from: Address, to: Address, amount: string | number, options?: {
        gasLimit?: string;
        gasPrice?: string;
        memo?: string;
    }): Promise<{
        hash: string;
        blockNumber?: number;
    }>;
    /**
     * Get transaction status
     */
    getTransactionStatus(txHash: string): Promise<{
        status: 'pending' | 'success' | 'failed';
        blockNumber?: number;
        blockHash?: string;
        gasUsed?: string;
        effectiveGasPrice?: string;
    }>;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number): Promise<{
        status: 'success' | 'failed';
        blockNumber: number;
        blockHash: string;
        gasUsed: string;
        effectiveGasPrice: string;
    }>;
    /**
     * Convert between different address formats
     */
    convertAddress(address: Address, targetFormat: 'substrate' | 'evm'): Address;
    /**
     * Get the underlying @polkadot/api instance
     */
    getApi(): Promise<ApiPromise>;
    /**
     * Get the underlying ethers provider
     */
    getEvmProvider(): Promise<ethers.JsonRpcProvider>;
    /**
     * Estimate gas for a transaction
     */
    estimateGas(from: Address, to: Address, amount: string | number, data?: string): Promise<string>;
    /**
     * Get current block number
     */
    getBlockNumber(): Promise<number>;
    /**
     * Get block information
     */
    getBlock(blockNumber: number | 'latest'): Promise<{
        number: number;
        hash: string;
        parentHash: string;
        timestamp: number;
        transactions: string[];
    }>;
    private ensureConnected;
}
/**
 * Network enum for convenience
 */
export declare enum Network {
    Selendra = "selendra_mainnet",
    SelendraTestnet = "selendra_testnet",
    Localhost = "localhost"
}
/**
 * Create a new SDK instance with default configuration
 */
export declare function createSDK(config?: SDKConfig): SelendraSDK;
/**
 * Default SDK instance for convenience
 */
export declare const sdk: SelendraSDK;
//# sourceMappingURL=index.d.ts.map