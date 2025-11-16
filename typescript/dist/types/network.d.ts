/**
 * Network-related types for the Selendra SDK
 */
import type { ChainId, NetworkId } from './common';
/**
 * Network type enumeration
 */
export declare enum NetworkType {
    MAINNET = "mainnet",
    TESTNET = "testnet",
    DEVELOPMENT = "development",
    LOCAL = "local"
}
/**
 * Network protocol types
 */
export declare enum NetworkProtocol {
    SUBSTRATE = "substrate",
    EVM = "evm",
    HYBRID = "hybrid"
}
/**
 * Network configuration interface
 */
export interface NetworkConfig {
    /** Network identifier */
    networkId: NetworkId;
    /** Network type */
    type: NetworkType;
    /** Network protocol */
    protocol: NetworkProtocol;
    /** Chain ID */
    chainId: ChainId;
    /** Network name */
    name: string;
    /** Network description */
    description?: string;
    /** RPC endpoints */
    rpcEndpoints: string[];
    /** WebSocket endpoints */
    wsEndpoints?: string[];
    /** Block explorer URL */
    blockExplorer?: string;
    /** Default gas limit */
    defaultGasLimit?: string;
    /** Default gas price */
    defaultGasPrice?: string;
    /** Network status URL */
    statusUrl?: string;
    /** Network metadata */
    metadata?: NetworkMetadata;
    /** Network features */
    features?: NetworkFeature[];
}
/**
 * Network metadata
 */
export interface NetworkMetadata {
    /** Network version */
    version?: string;
    /** Native currency information */
    nativeCurrency: CurrencyInfo;
    /** Supported features */
    features: NetworkFeature[];
    /** Chain specific parameters */
    chainParams?: Record<string, unknown>;
}
/**
 * Currency information
 */
export interface CurrencyInfo {
    /** Currency symbol */
    symbol: string;
    /** Currency name */
    name: string;
    /** Number of decimal places */
    decimals: number;
    /** Currency icon URL */
    icon?: string;
}
/**
 * Network features
 */
export declare enum NetworkFeature {
    EVM = "evm",
    SUBSTRATE = "substrate",
    STAKING = "staking",
    GOVERNANCE = "governance",
    TREASURY = "treasury",
    IDENTITY = "identity",
    PROXY = "proxy",
    MULTISIG = "multisig",
    NFTS = "nfts",
    DEFI = "defi",
    BRIDGE = "bridge"
}
/**
 * Known network configurations
 */
export declare const NETWORKS: Record<string, NetworkConfig>;
/**
 * Get network configuration by ID
 */
export declare function getNetworkConfig(networkId: string): NetworkConfig | undefined;
/**
 * Get all mainnet networks
 */
export declare function getMainnetNetworks(): NetworkConfig[];
/**
 * Get all testnet networks
 */
export declare function getTestnetNetworks(): NetworkConfig[];
/**
 * Get all EVM-enabled networks
 */
export declare function getEvmNetworks(): NetworkConfig[];
/**
 * Get all Substrate-enabled networks
 */
export declare function getSubstrateNetworks(): NetworkConfig[];
//# sourceMappingURL=network.d.ts.map