/**
 * EVM configuration for the Selendra SDK
 * Provides Selendra-specific EVM network configurations and settings
 */
import type { ChainId, Address } from '../types/common';
import type { EvmTransactionType } from '../types/evm';
/**
 * Selendra EVM network configuration
 */
export interface SelendraEvmConfig {
    /** Chain ID for Selendra EVM */
    chainId: ChainId;
    /** Chain name */
    chainName: string;
    /** Native currency symbol */
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    /** RPC endpoints */
    rpcUrls: {
        default: {
            http: string[];
            webSocket: string[];
        };
        public: {
            http: string[];
            webSocket: string[];
        };
    };
    /** Block explorer URLs */
    blockExplorerUrls?: {
        name: string;
        url: string;
    }[];
    /** Default gas settings */
    gasConfig: {
        /** Default gas multiplier for estimation */
        gasMultiplier: number;
        /** Maximum gas limit */
        maxGasLimit: number;
        /** Minimum gas limit */
        minGasLimit: number;
        /** Default gas price (in wei) */
        defaultGasPrice: string;
        /** Maximum gas price (in wei) */
        maxGasPrice: string;
    };
    /** Transaction type defaults */
    defaultTransactionType: EvmTransactionType;
    /** Network-specific constants */
    constants: {
        /** Maximum priority fee per gas */
        maxPriorityFeePerGas: string;
        /** Base fee multiplier */
        baseFeeMultiplier: number;
    };
    /** EVM compatibility flags */
    features: {
        /** Support for EIP-1559 transactions */
        eip1559: boolean;
        /** Support for EIP-2930 access lists */
        eip2930: boolean;
        /** Support for batch transactions */
        batchTransactions: boolean;
        /** Support for contract events */
        contractEvents: boolean;
    };
}
/**
 * Predefined Selendra network configurations
 */
export declare const SELENDRA_EVM_NETWORKS: Record<string, SelendraEvmConfig>;
/**
 * Get Selendra EVM configuration by network name or chain ID
 */
export declare function getSelendraEvmConfig(networkOrChainId: string | number): SelendraEvmConfig;
/**
 * Default EVM client configuration
 */
export interface EvmClientConfig {
    /** Network name or chain ID */
    network: string | ChainId;
    /** Custom RPC endpoint URLs */
    rpcUrls?: {
        http?: string[];
        webSocket?: string[];
    };
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
    /** Gas configuration overrides */
    gasConfig?: Partial<SelendraEvmConfig['gasConfig']>;
    /** Transaction type preference */
    preferredTransactionType?: EvmTransactionType;
    /** Enable transaction batching */
    enableBatching?: boolean;
    /** Default from address for transactions */
    defaultFromAddress?: Address;
    /** Block confirmations required for transaction finality */
    confirmations?: number;
    /** Polling interval for transaction status (in milliseconds) */
    pollingInterval?: number;
    /** Maximum polling duration (in milliseconds) */
    maxPollingDuration?: number;
    /** Enable WebSocket subscriptions */
    enableSubscriptions?: boolean;
}
/**
 * Create default EVM client configuration
 */
export declare function createDefaultEvmClientConfig(overrides?: Partial<EvmClientConfig>): EvmClientConfig;
/**
 * Validate Ethereum address format
 */
export declare function isValidEthereumAddress(address: string): boolean;
/**
 * Validate private key format
 */
export declare function isValidPrivateKey(privateKey: string): boolean;
/**
 * Validate transaction hash format
 */
export declare function isValidTransactionHash(hash: string): boolean;
/**
 * Convert wei to ether
 */
export declare function weiToEther(wei: string | bigint | number): string;
/**
 * Convert ether to wei
 */
export declare function etherToWei(ether: string | number): string;
/**
 * Convert gwei to wei
 */
export declare function gweiToWei(gwei: string | number): string;
/**
 * Format balance for display
 */
export declare function formatBalance(balance: string | bigint, decimals?: number, symbol?: string): string;
/**
 * Parse balance string to wei
 */
export declare function parseBalance(balance: string, decimals?: number): string;
/**
 * Gas estimation defaults
 */
export declare const GAS_ESTIMATION_DEFAULTS: {
    readonly SIMPLE_TRANSFER: 21000;
    readonly TOKEN_TRANSFER: 65000;
    readonly CONTRACT_DEPLOYMENT: 2000000;
    readonly CONTRACT_INTERACTION: 200000;
    readonly MAX_GAS_LIMIT: 15000000;
};
/**
 * Default transaction overrides
 */
export declare const DEFAULT_TX_OVERRIDES: {
    readonly gasLimit: "auto";
    readonly gasPrice: "auto";
    readonly maxFeePerGas: "auto";
    readonly maxPriorityFeePerGas: "auto";
    readonly type: "auto";
};
//# sourceMappingURL=config.d.ts.map