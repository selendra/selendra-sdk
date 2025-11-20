/**
 * Network-related types for the Selendra SDK
 */

import type { ChainId, NetworkId } from './common';

/**
 * Network type enumeration
 */
export enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVELOPMENT = 'development',
  LOCAL = 'local'
}

/**
 * Network protocol types
 */
export enum NetworkProtocol {
  SUBSTRATE = 'substrate',
  EVM = 'evm',
  HYBRID = 'hybrid'
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
export enum NetworkFeature {
  EVM = 'evm',
  SUBSTRATE = 'substrate',
  STAKING = 'staking',
  GOVERNANCE = 'governance',
  TREASURY = 'treasury',
  IDENTITY = 'identity',
  PROXY = 'proxy',
  MULTISIG = 'multisig',
  NFTS = 'nfts',
  DEFI = 'defi',
  BRIDGE = 'bridge'
}

/**
 * Known network configurations
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  selendra_mainnet: {
    networkId: 'selendra_mainnet',
    type: NetworkType.MAINNET,
    protocol: NetworkProtocol.HYBRID,
    chainId: 'selendra',
    name: 'Selendra Mainnet',
    description: 'The Selendra main network with both EVM and Substrate support',
    rpcEndpoints: [
      'https://rpc.selendra.org',
      'https://rpc1.selendra.org',
      'https://rpc2.selendra.org'
    ],
    wsEndpoints: [
      'wss://rpc.selendra.org',
      'wss://rpc1.selendra.org',
      'wss://rpc2.selendra.org'
    ],
    blockExplorer: 'https://explorer.selendra.org',
    defaultGasLimit: '2100000000000000',
    defaultGasPrice: '1000000000',
    metadata: {
      nativeCurrency: {
        symbol: 'SEL',
        name: 'Selendra',
        decimals: 12
      },
      features: [
        NetworkFeature.EVM,
        NetworkFeature.SUBSTRATE,
        NetworkFeature.STAKING,
        NetworkFeature.GOVERNANCE,
        NetworkFeature.TREASURY,
        NetworkFeature.IDENTITY,
        NetworkFeature.PROXY,
        NetworkFeature.MULTISIG,
        NetworkFeature.NFTS,
        NetworkFeature.DEFI,
        NetworkFeature.BRIDGE
      ]
    }
  },
  selendra_testnet: {
    networkId: 'selendra_testnet',
    type: NetworkType.TESTNET,
    protocol: NetworkProtocol.HYBRID,
    chainId: 'selendra_testnet',
    name: 'Selendra Testnet',
    description: 'The Selendra test network for development and testing',
    rpcEndpoints: [
      'https://testnet-rpc.selendra.org',
      'https://testnet-rpc1.selendra.org'
    ],
    wsEndpoints: [
      'wss://testnet-rpc.selendra.org',
      'wss://testnet-rpc1.selendra.org'
    ],
    blockExplorer: 'https://testnet-explorer.selendra.org',
    defaultGasLimit: '2100000000000000',
    defaultGasPrice: '1000000000',
    metadata: {
      nativeCurrency: {
        symbol: 'tSEL',
        name: 'Test Selendra',
        decimals: 12
      },
      features: [
        NetworkFeature.EVM,
        NetworkFeature.SUBSTRATE,
        NetworkFeature.STAKING,
        NetworkFeature.GOVERNANCE,
        NetworkFeature.IDENTITY,
        NetworkFeature.PROXY,
        NetworkFeature.MULTISIG,
        NetworkFeature.NFTS,
        NetworkFeature.DEFI
      ]
    }
  },
  localhost: {
    networkId: 'localhost',
    type: NetworkType.DEVELOPMENT,
    protocol: NetworkProtocol.HYBRID,
    chainId: 'localhost',
    name: 'Local Development',
    description: 'Local development network',
    rpcEndpoints: [
      'http://localhost:9933',
      'http://127.0.0.1:9933'
    ],
    wsEndpoints: [
      'ws://localhost:9944',
      'ws://127.0.0.1:9944'
    ],
    defaultGasLimit: '2100000000000000',
    defaultGasPrice: '1000000000',
    metadata: {
      nativeCurrency: {
        symbol: 'DEV',
        name: 'Development Token',
        decimals: 12
      },
      features: [
        NetworkFeature.EVM,
        NetworkFeature.SUBSTRATE,
        NetworkFeature.STAKING,
        NetworkFeature.GOVERNANCE
      ]
    }
  }
};

/**
 * Get network configuration by ID
 */
export function getNetworkConfig(networkId: string): NetworkConfig | undefined {
  return NETWORKS[networkId];
}

/**
 * Get all mainnet networks
 */
export function getMainnetNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network => network.type === NetworkType.MAINNET);
}

/**
 * Get all testnet networks
 */
export function getTestnetNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network => network.type === NetworkType.TESTNET);
}

/**
 * Get all EVM-enabled networks
 */
export function getEvmNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network =>
    network.features.includes(NetworkFeature.EVM)
  );
}

/**
 * Get all Substrate-enabled networks
 */
export function getSubstrateNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network =>
    network.features.includes(NetworkFeature.SUBSTRATE)
  );
}