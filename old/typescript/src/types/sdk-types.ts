/**
 * SDK-specific types for the Selendra SDK main class
 */

import type { ChainType as ChainEnvironment } from './chain-info';
import type {
  Address,
  Balance,
  BlockNumber,
  Hash,
  Timestamp,
  TransactionHash,
  Nonce,
} from './common';
import type { NetworkType } from './network';

/**
 * Chain protocol type (Substrate vs EVM)
 * This is different from ChainType in chain-info.ts which represents environment (mainnet/testnet)
 */
export enum ChainType {
  Substrate = 'substrate',
  EVM = 'evm',
}

/**
 * Network enumeration for backward compatibility
 */
export enum Network {
  Selendra = 'selendra',
  SelendraTestnet = 'selendra-testnet',
  SelendraDevnet = 'selendra-devnet',
  Custom = 'custom',
}

/**
 * SDK Configuration
 */
export interface SDKConfig {
  /** WebSocket or HTTP endpoint URL */
  endpoint?: string;
  /** Network to connect to */
  network?: Network | string;
  /** Chain type (mainnet, testnet, etc.) */
  chainType?: ChainType;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts on connection failure */
  retryAttempts?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Custom keyring for signing */
  keyring?: any;
  /** EVM provider URL (for dual-mode support) */
  evmProviderUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Additional custom configuration */
  [key: string]: any;
}

/**
 * Connection information
 */
export interface ConnectionInfo {
  /** Current endpoint URL */
  endpoint: string;
  /** Current network */
  network: Network | string;
  /** Current chain type */
  chainType: ChainType;
  /** Whether currently connected */
  isConnected: boolean;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Last connection timestamp */
  connectedAt?: Timestamp;
  /** Connection latency in milliseconds */
  latency?: number;
  /** Connection metadata */
  metadata?: Record<string, any>;
}

/**
 * Account information
 */
export interface AccountInfo {
  /** Account address */
  address: Address;
  /** Account balance */
  balance: Balance;
  /** Account nonce */
  nonce: Nonce;
  /** Account type (substrate, evm, unified) */
  type: 'substrate' | 'evm' | 'unified';
  /** Whether account is active */
  isActive: boolean;
  /** Additional account metadata */
  metadata?: {
    /** Account name/label */
    name?: string;
    /** Account creation timestamp */
    createdAt?: Timestamp;
    /** Account public key */
    publicKey?: string;
    /** Account data (for Substrate) */
    data?: Record<string, any>;
  };
}

/**
 * Balance information with enhanced details
 */
export interface BalanceInfo {
  /** Total balance */
  total: Balance;
  /** Free (transferable) balance */
  free: Balance;
  /** Reserved (locked) balance */
  reserved?: Balance;
  /** Frozen balance */
  frozen?: Balance;
  /** Token symbol */
  symbol: string;
  /** Token decimals */
  decimals: number;
  /** Balance in USD (if available) */
  usd?: number;
  /** Balance metadata */
  metadata?: {
    /** Staked amount */
    staked?: Balance;
    /** Unbonding amount */
    unbonding?: Balance;
    /** Vesting amount */
    vesting?: Balance;
    /** Last update timestamp */
    lastUpdated?: Timestamp;
  };
}

/**
 * Transaction information
 */
export interface TransactionInfo {
  /** Transaction hash */
  hash: TransactionHash;
  /** Block number where transaction was included */
  blockNumber?: BlockNumber;
  /** Block hash where transaction was included */
  blockHash?: Hash;
  /** Transaction sender */
  from: Address;
  /** Transaction recipient */
  to?: Address;
  /** Transaction amount */
  value: Balance;
  /** Transaction fee */
  fee: Balance;
  /** Transaction nonce */
  nonce: Nonce;
  /** Transaction status */
  status: 'pending' | 'included' | 'finalized' | 'failed';
  /** Transaction timestamp */
  timestamp?: Timestamp;
  /** Transaction data/input */
  data?: string;
  /** Gas used (for EVM) */
  gasUsed?: string;
  /** Gas price (for EVM) */
  gasPrice?: string;
  /** Transaction type */
  type?: 'transfer' | 'contract-call' | 'contract-creation' | 'extrinsic' | 'other';
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Smart contract information
 */
export interface ContractInfo {
  /** Contract address */
  address: Address;
  /** Contract name */
  name?: string;
  /** Contract ABI */
  abi?: any[];
  /** Contract bytecode */
  bytecode?: string;
  /** Contract creator */
  creator?: Address;
  /** Creation transaction hash */
  creationTxHash?: TransactionHash;
  /** Creation block number */
  creationBlock?: BlockNumber;
  /** Contract balance */
  balance?: Balance;
  /** Contract metadata */
  metadata?: {
    /** Contract version */
    version?: string;
    /** Contract source verification status */
    verified?: boolean;
    /** Contract source code URL */
    sourceUrl?: string;
    /** Contract description */
    description?: string;
    /** Contract creation timestamp */
    createdAt?: Timestamp;
  };
}

/**
 * Block information
 */
export interface BlockInfo {
  /** Block number */
  number: BlockNumber;
  /** Block hash */
  hash: Hash;
  /** Parent block hash */
  parentHash: Hash;
  /** Block timestamp */
  timestamp: Timestamp;
  /** Block author/validator */
  author?: Address;
  /** State root hash */
  stateRoot: Hash;
  /** Extrinsics/transactions root hash */
  extrinsicsRoot?: Hash;
  /** Number of transactions in block */
  transactionCount: number;
  /** Block size in bytes */
  size?: number;
  /** Block gas used (for EVM) */
  gasUsed?: string;
  /** Block gas limit (for EVM) */
  gasLimit?: string;
  /** Block extra data */
  extraData?: string;
  /** Block metadata */
  metadata?: {
    /** Block finalized status */
    isFinalized?: boolean;
    /** Block weight (for Substrate) */
    weight?: string;
    /** Block logs */
    logs?: any[];
  };
}

/**
 * Event subscription configuration
 */
export interface EventSubscription {
  /** Subscription ID */
  id: string;
  /** Event type to subscribe to */
  eventType: string;
  /** Event filter */
  filter?: Record<string, any>;
  /** Callback function */
  callback: (event: EventData) => void;
  /** Whether subscription is active */
  isActive: boolean;
  /** Subscription creation timestamp */
  createdAt: Timestamp;
  /** Number of events received */
  eventCount?: number;
}

/**
 * Event data structure
 */
export interface EventData {
  /** Event ID */
  id: string;
  /** Event name/type */
  name: string;
  /** Event timestamp */
  timestamp: Timestamp;
  /** Block number where event occurred */
  blockNumber?: BlockNumber;
  /** Transaction hash that emitted the event */
  transactionHash?: TransactionHash;
  /** Event index in block */
  eventIndex?: number;
  /** Event data payload */
  data?: Record<string, any>;
  /** Event metadata */
  metadata?: Record<string, any>;
}
