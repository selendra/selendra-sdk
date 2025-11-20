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
export const SELENDRA_EVM_NETWORKS: Record<string, SelendraEvmConfig> = {
  mainnet: {
    chainId: 1961,
    chainName: 'Selendra Mainnet',
    nativeCurrency: {
      name: 'Selendra',
      symbol: 'SEL',
      decimals: 18
    },
    rpcUrls: {
      default: {
        http: ['https://rpc.selendra.org'],
        webSocket: ['wss://rpc.selendra.org']
      },
      public: {
        http: ['https://rpc.selendra.org'],
        webSocket: ['wss://rpc.selendra.org']
      }
    },
    blockExplorerUrls: [
      {
        name: 'Selendra Explorer',
        url: 'https://explorer.selendra.org'
      }
    ],
    gasConfig: {
      gasMultiplier: 1.2,
      maxGasLimit: 10000000,
      minGasLimit: 21000,
      defaultGasPrice: '10000000000', // 10 gwei
      maxGasPrice: '1000000000000' // 1000 gwei
    },
    defaultTransactionType: '0x2' as EvmTransactionType,
    constants: {
      maxPriorityFeePerGas: '2000000000', // 2 gwei
      baseFeeMultiplier: 1.5
    },
    features: {
      eip1559: true,
      eip2930: true,
      batchTransactions: true,
      contractEvents: true
    }
  },
  testnet: {
    chainId: 1962,
    chainName: 'Selendra Testnet',
    nativeCurrency: {
      name: 'Selendra Test',
      symbol: 'tSEL',
      decimals: 18
    },
    rpcUrls: {
      default: {
        http: ['https://testnet-rpc.selendra.org'],
        webSocket: ['wss://testnet-rpc.selendra.org']
      },
      public: {
        http: ['https://testnet-rpc.selendra.org'],
        webSocket: ['wss://testnet-rpc.selendra.org']
      }
    },
    blockExplorerUrls: [
      {
        name: 'Selendra Testnet Explorer',
        url: 'https://testnet-explorer.selendra.org'
      }
    ],
    gasConfig: {
      gasMultiplier: 1.1,
      maxGasLimit: 8000000,
      minGasLimit: 21000,
      defaultGasPrice: '1000000000', // 1 gwei
      maxGasPrice: '100000000000' // 100 gwei
    },
    defaultTransactionType: '0x2' as EvmTransactionType,
    constants: {
      maxPriorityFeePerGas: '1000000000', // 1 gwei
      baseFeeMultiplier: 1.2
    },
    features: {
      eip1559: true,
      eip2930: true,
      batchTransactions: true,
      contractEvents: true
    }
  }
};

/**
 * Get Selendra EVM configuration by network name or chain ID
 */
export function getSelendraEvmConfig(networkOrChainId: string | number): SelendraEvmConfig {
  // Try to find by network name first
  if (typeof networkOrChainId === 'string') {
    const config = SELENDRA_EVM_NETWORKS[networkOrChainId];
    if (config) {
      return config;
    }
  }

  // Try to find by chain ID
  const chainId = typeof networkOrChainId === 'number' ? networkOrChainId : parseInt(networkOrChainId);
  for (const config of Object.values(SELENDRA_EVM_NETWORKS)) {
    if (config.chainId === chainId) {
      return config;
    }
  }

  throw new Error(`Unknown Selendra network or chain ID: ${networkOrChainId}`);
}

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
export function createDefaultEvmClientConfig(overrides: Partial<EvmClientConfig> = {}): EvmClientConfig {
  const network = overrides.network || 'mainnet';
  const networkConfig = getSelendraEvmConfig(network);

  return {
    network,
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    debug: false,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'selendra-sdk-evm/1.0.0'
    },
    gasConfig: {
      gasMultiplier: 1.2,
      maxGasLimit: networkConfig.gasConfig.maxGasLimit,
      minGasLimit: networkConfig.gasConfig.minGasLimit,
      defaultGasPrice: networkConfig.gasConfig.defaultGasPrice,
      maxGasPrice: networkConfig.gasConfig.maxGasPrice,
      ...overrides.gasConfig
    },
    preferredTransactionType: networkConfig.defaultTransactionType,
    enableBatching: networkConfig.features.batchTransactions,
    confirmations: 1,
    pollingInterval: 2000,
    maxPollingDuration: 300000, // 5 minutes
    enableSubscriptions: true,
    ...overrides
  };
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate private key format
 */
export function isValidPrivateKey(privateKey: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}

/**
 * Validate transaction hash format
 */
export function isValidTransactionHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Convert wei to ether
 */
export function weiToEther(wei: string | bigint | number): string {
  const weiValue = typeof wei === 'string' ? BigInt(wei) : typeof wei === 'number' ? BigInt(Math.floor(wei)) : wei;
  const etherValue = Number(weiValue) / 1e18;
  return etherValue.toString();
}

/**
 * Convert ether to wei
 */
export function etherToWei(ether: string | number): string {
  const etherValue = typeof ether === 'number' ? ether : parseFloat(ether);
  const weiValue = Math.floor(etherValue * 1e18);
  return weiValue.toString();
}

/**
 * Convert gwei to wei
 */
export function gweiToWei(gwei: string | number): string {
  const gweiValue = typeof gwei === 'number' ? gwei : parseFloat(gwei);
  const weiValue = Math.floor(gweiValue * 1e9);
  return weiValue.toString();
}

/**
 * Format balance for display
 */
export function formatBalance(balance: string | bigint, decimals: number = 18, symbol?: string): string {
  const balanceValue = typeof balance === 'string' ? BigInt(balance) : balance;
  const divisor = BigInt(10 ** decimals);
  const whole = balanceValue / divisor;
  const fractional = balanceValue % divisor;

  const result = `${whole}.${fractional.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
  return symbol ? `${result} ${symbol}` : result;
}

/**
 * Parse balance string to wei
 */
export function parseBalance(balance: string, decimals: number = 18): string {
  const [whole, fractional = '0'] = balance.split('.');
  const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
  const wholeWei = BigInt(whole) * BigInt(10 ** decimals);
  const fractionalWei = BigInt(fractionalPadded);
  return (wholeWei + fractionalWei).toString();
}

/**
 * Gas estimation defaults
 */
export const GAS_ESTIMATION_DEFAULTS = {
  // Standard transfer gas limit
  SIMPLE_TRANSFER: 21000,
  // Token transfer gas limit
  TOKEN_TRANSFER: 65000,
  // Contract deployment gas limit
  CONTRACT_DEPLOYMENT: 2000000,
  // Complex contract interaction gas limit
  CONTRACT_INTERACTION: 200000,
  // Maximum reasonable gas limit
  MAX_GAS_LIMIT: 15000000
} as const;

/**
 * Default transaction overrides
 */
export const DEFAULT_TX_OVERRIDES = {
  gasLimit: 'auto',
  gasPrice: 'auto',
  maxFeePerGas: 'auto',
  maxPriorityFeePerGas: 'auto',
  type: 'auto'
} as const;