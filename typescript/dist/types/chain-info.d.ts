/**
 * Chain information types for the Selendra SDK
 */
import type { ChainId, BlockNumber, Timestamp, Balance } from './common';
/**
 * Chain type enumeration
 */
export declare enum ChainType {
    MAINNET = "mainnet",
    TESTNET = "testnet",
    DEVELOPMENT = "development",
    LOCAL = "local"
}
/**
 * Consensus type enumeration
 */
export declare enum ConsensusType {
    PROOF_OF_STAKE = "proof_of_stake",
    PROOF_OF_WORK = "proof_of_work",
    PROOF_OF_AUTHORITY = "proof_of_authority",
    DELEGATED_PROOF_OF_STAKE = "delegated_proof_of_stake",
    HYBRID = "hybrid"
}
/**
 * Chain status enumeration
 */
export declare enum ChainStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance",
    DEPRECATED = "deprecated",
    UNKNOWN = "unknown"
}
/**
 * Chain metadata interface
 */
export interface ChainMetadata {
    /** Chain identifier */
    chainId: ChainId;
    /** Chain name */
    name: string;
    /** Chain type */
    type: ChainType;
    /** Consensus type */
    consensusType: ConsensusType;
    /** Chain status */
    status: ChainStatus;
    /** Chain description */
    description?: string;
    /** Chain website */
    website?: string;
    /** Chain explorer URL */
    explorer?: string;
    /** Chain documentation */
    documentation?: string;
    /** Chain support contact */
    support?: string;
}
/**
 * Chain specifications
 */
export interface ChainSpecs {
    /** Current block number */
    blockNumber: BlockNumber;
    /** Current block hash */
    blockHash: string;
    /** Genesis hash */
    genesisHash: string;
    /** Chain name */
    chainName: string;
    /** Chain ID for EVM compatibility */
    evmChainId?: number;
    /** Runtime version */
    runtimeVersion: RuntimeVersionInfo;
    /** Transaction version */
    transactionVersion: number;
    /** Protocol version */
    protocolVersion?: number;
    /** Properties */
    properties: ChainProperties;
}
/**
 * Runtime version information
 */
export interface RuntimeVersionInfo {
    /** Runtime spec name */
    specName: string;
    /** Runtime spec version */
    specVersion: number;
    /** Transaction version */
    transactionVersion: number;
    /** Runtime implementation version */
    implVersion: number;
    /** Runtime authoring version */
    authoringVersion: number;
}
/**
 * Chain properties
 */
export interface ChainProperties {
    /** SS58 format */
    ss58Format?: number;
    /** Token decimals */
    tokenDecimals?: number[];
    /** Token symbols */
    tokenSymbol?: string[];
    /** Chain ID */
    chainId?: string;
}
/**
 * Chain configuration
 */
export interface ChainConfiguration {
    /** Chain metadata */
    metadata: ChainMetadata;
    /** Chain specifications */
    specs?: ChainSpecs;
    /** Network endpoints */
    endpoints: ChainEndpoints;
    /** Chain features */
    features: ChainFeatures;
    /** Chain parameters */
    parameters: ChainParameters;
}
/**
 * Network endpoints
 */
export interface ChainEndpoints {
    /** RPC endpoints */
    rpc: string[];
    /** WebSocket endpoints */
    ws?: string[];
    /** REST API endpoints */
    rest?: string[];
    /** GraphQL endpoints */
    graphql?: string[];
    /** IPFS gateways */
    ipfs?: string[];
}
/**
 * Chain features
 */
export interface ChainFeatures {
    /** EVM support */
    evm: boolean;
    /** Substrate support */
    substrate: boolean;
    /** Staking support */
    staking: boolean;
    /** Governance support */
    governance: boolean;
    /** Treasury support */
    treasury: boolean;
    /** Identity support */
    identity: boolean;
    /** Proxy support */
    proxy: boolean;
    /** Multi-signature support */
    multiSig: boolean;
    /** NFT support */
    nft: boolean;
    /** DeFi support */
    defi: boolean;
    /** Bridge support */
    bridge: boolean;
    /** Smart contract support */
    smartContracts: boolean;
    /** Custom features */
    custom?: Record<string, boolean>;
}
/**
 * Chain parameters
 */
export interface ChainParameters {
    /** Block time in milliseconds */
    blockTime: number;
    /** Era duration in blocks */
    eraDuration?: number;
    /** Session length in blocks */
    sessionLength?: number;
    /** Minimum stake amount */
    minStake?: Balance;
    /** Maximum validators */
    maxValidators?: number;
    /** Bonding duration in eras */
    bondingDuration?: number;
    /** Unlock period in eras */
    unlockPeriod?: number;
    /** Gas limit */
    gasLimit?: number;
    /** Minimum gas price */
    minGasPrice?: Balance;
    /** Maximum gas price */
    maxGasPrice?: Balance;
    /** Custom parameters */
    custom?: Record<string, unknown>;
}
/**
 * Chain statistics
 */
export interface ChainStatistics {
    /** Current block number */
    blockNumber: BlockNumber;
    /** Total transactions */
    totalTransactions: number;
    /** Total accounts */
    totalAccounts: number;
    /** Total validators */
    totalValidators: number;
    /** Total nominators */
    totalNominators?: number;
    /** Staked amount */
    totalStake?: Balance;
    /** Circulating supply */
    circulatingSupply?: Balance;
    /** Market capitalization */
    marketCap?: number;
    /** 24h volume */
    volume24h?: number;
    /** Current APR */
    apr?: number;
    /** Network utilization */
    utilization?: number;
    /** Last updated timestamp */
    lastUpdated: Timestamp;
}
/**
 * Chain health information
 */
export interface ChainHealth {
    /** Overall health status */
    status: 'healthy' | 'degraded' | 'unhealthy';
    /** Node count */
    nodeCount: number;
    /** Active nodes */
    activeNodes: number;
    /** Sync status */
    isSyncing: boolean;
    /** Sync progress (0-100) */
    syncProgress?: number;
    /** Average block time */
    averageBlockTime: number;
    /** Target block time */
    targetBlockTime: number;
    /** Network latency in milliseconds */
    networkLatency: number;
    /** Last health check */
    lastChecked: Timestamp;
    /** Health issues */
    issues?: string[];
}
/**
 * Chain event types
 */
export interface ChainEvent {
    /** Event type */
    type: string;
    /** Event data */
    data: unknown;
    /** Block number */
    blockNumber: BlockNumber;
    /** Block hash */
    blockHash: string;
    /** Transaction hash */
    transactionHash?: string;
    /** Event index */
    eventIndex: number;
    /** Timestamp */
    timestamp: Timestamp;
}
/**
 * Chain upgrade information
 */
export interface ChainUpgrade {
    /** Runtime version */
    runtimeVersion: RuntimeVersionInfo;
    /** Block number where upgrade occurred */
    blockNumber: BlockNumber;
    /** Block hash of upgrade */
    blockHash: string;
    /** Upgrade description */
    description?: string;
    /** Upgrade status */
    status: 'scheduled' | 'enacted' | 'failed';
    /** Scheduled timestamp */
    scheduledAt?: Timestamp;
    /** Enacted timestamp */
    enactedAt?: Timestamp;
}
/**
 * Chain utility functions
 */
/**
 * Chain information interface
 */
export interface ChainInfo {
    /** Chain name */
    name: string;
    /** Chain version */
    version?: string;
    /** Chain ID */
    chainId?: string;
    /** Current block number */
    blockNumber?: number;
    /** Genesis hash */
    genesisHash?: string;
    /** Runtime spec version */
    specVersion?: string;
    /** Runtime implementation version */
    implVersion?: string;
    /** SS58 format */
    ss58Format?: number;
    /** Token decimals */
    tokenDecimals?: number;
    /** Token symbol */
    tokenSymbol?: string;
    /** Gas limit */
    gasLimit?: string;
}
export declare class ChainUtils {
    /**
     * Check if chain supports EVM
     */
    static supportsEVM(chain: ChainConfiguration): boolean;
    /**
     * Check if chain supports Substrate
     */
    static supportsSubstrate(chain: ChainConfiguration): boolean;
    /**
     * Check if chain supports staking
     */
    static supportsStaking(chain: ChainConfiguration): boolean;
    /**
     * Check if chain is healthy
     */
    static isHealthy(health: ChainHealth): boolean;
    /**
     * Calculate chain age in days
     */
    static calculateAge(currentBlock: BlockNumber, blockTime: number): number;
    /**
     * Format block time for display
     */
    static formatBlockTime(blockTimeMs: number): string;
    /**
     * Get chain explorer URL for transaction
     */
    static getTransactionExplorerUrl(chain: ChainConfiguration, transactionHash: string): string | undefined;
    /**
     * Get chain explorer URL for block
     */
    static getBlockExplorerUrl(chain: ChainConfiguration, blockHashOrNumber: string | BlockNumber): string | undefined;
    /**
     * Get chain explorer URL for address
     */
    static getAddressExplorerUrl(chain: ChainConfiguration, address: string): string | undefined;
}
//# sourceMappingURL=chain-info.d.ts.map