/**
 * Common types used throughout the Selendra SDK
 */

/**
 * Network identifier types
 */
export type NetworkId = string;
export type ChainId = number | string;
export type NodeId = string;

/**
 * Address types for different networks
 */
export type Address = string;
export type SubstrateAddress = string;
export type EvmAddress = string;
export type SelendraAddress = Address; // Unified address type for Selendra

/**
 * Balance and token types
 */
export type Balance = string | bigint;
export type TokenAmount = string;
export type GasAmount = string | number;

/**
 * Hash types
 */
export type Hash = string;
export type BlockHash = string;
export type TransactionHash = string;
export type StateRoot = string;

/**
 * Numeric types
 */
export type BlockNumber = number;
export type EpochNumber = number;
export type EraNumber = number;
export type SlotNumber = number;
export type Nonce = number | string;

/**
 * Timestamp types
 */
export type Timestamp = number;
export type Duration = number;
export type BlockTime = number;

/**
 * Fee and cost types
 */
export interface Fee {
  /** Base fee amount */
  baseFee: Balance;
  /** Priority fee (tip) amount */
  priorityFee: Balance;
  /** Total fee amount */
  totalFee: Balance;
  /** Maximum fee willing to pay */
  maxFee?: Balance;
  /** Maximum priority fee willing to pay */
  maxPriorityFee?: Balance;
}

/**
 * Gas limit and price types
 */
export interface GasConfig {
  /** Maximum gas limit for transaction */
  gasLimit: GasAmount;
  /** Gas price in wei */
  gasPrice?: Balance;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: Balance;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: Balance;
}

/**
 * Network status information
 */
export interface NetworkStatus {
  /** Whether the network is currently connected */
  isConnected: boolean;
  /** Current network name */
  networkName: string;
  /** Chain ID */
  chainId: ChainId;
  /** Current block number */
  blockNumber: BlockNumber;
  /** Current block hash */
  blockHash: BlockHash;
  /** Genesis hash */
  genesisHash: Hash;
  /** Whether the node is syncing */
  isSyncing: boolean;
  /** Current timestamp */
  timestamp: Timestamp;
}

/**
 * Transaction status enumeration
 */
export enum TransactionStatus {
  PENDING = 'pending',
  INCLUDED = 'included',
  FINALIZED = 'finalized',
  FAILED = 'failed',
  REJECTED = 'rejected',
  UNKNOWN = 'unknown'
}

/**
 * Transaction result interface
 */
export interface TransactionResult {
  /** Transaction hash */
  hash: TransactionHash;
  /** Block hash where transaction was included */
  blockHash?: BlockHash;
  /** Block number where transaction was included */
  blockNumber?: BlockNumber;
  /** Transaction status */
  status: TransactionStatus;
  /** Transaction fee */
  fee?: Balance;
  /** Transaction nonce */
  nonce?: Nonce;
  /** Error message if transaction failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Currency and token information
 */
export interface TokenInfo {
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Number of decimal places */
  decimals: number;
  /** Token address (for EVM) or module (for Substrate) */
  addressOrModule: string;
  /** Token icon or metadata URI */
  icon?: string;
  /** Whether token is native to the chain */
  isNative: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Number of items to return */
  limit?: number;
  /** Starting index or cursor */
  offset?: number | string;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Field to sort by */
  sortBy?: string;
}

/**
 * Query filters
 */
export type QueryFilter = Record<string, unknown>;

/**
 * SDK configuration options
 */
export interface SelendraConfig {
  /** Default network to connect to */
  defaultNetwork: 'mainnet' | 'testnet' | string;
  /** Default RPC endpoints */
  endpoints: string[];
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom user agent */
  userAgent?: string;
  /** Additional configuration */
  [key: string]: unknown;
}

/**
 * Event data interface
 */
export interface EventData {
  /** Event name */
  name: string;
  /** Event data payload */
  data: Record<string, unknown>;
  /** Block number where event occurred */
  blockNumber: BlockNumber;
  /** Transaction hash that emitted the event */
  transactionHash?: TransactionHash;
  /** Event index in the block */
  eventIndex: number;
  /** Timestamp when event occurred */
  timestamp: Timestamp;
}

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  /** Whether subscription should persist across reconnections */
  persist?: boolean;
  /** Callback for subscription errors */
  onError?: (error: Error) => void;
  /** Callback for subscription completion */
  onComplete?: () => void;
  /** Maximum number of events to receive */
  maxEvents?: number;
}

/**
 * SDK version information
 */
export interface VersionInfo {
  /** SDK version */
  sdk: string;
  /** Substrate API version */
  substrate?: string;
  /** EVM library version */
  evm?: string;
  /** Build timestamp */
  buildTimestamp?: string;
  /** Git commit hash */
  gitCommit?: string;
}