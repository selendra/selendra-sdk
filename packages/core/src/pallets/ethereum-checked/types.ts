/**
 * Ethereum Checked Pallet Types
 *
 * Type definitions for validated Ethereum transactions
 */

/**
 * Checked Ethereum transaction
 */
export interface CheckedEthereumTx {
  /** Transaction hash */
  hash: string;
  /** Nonce */
  nonce: bigint;
  /** Gas price (legacy) or max fee per gas (EIP-1559) */
  gasPrice?: bigint;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas?: bigint;
  /** Max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: bigint;
  /** Gas limit */
  gasLimit: bigint;
  /** To address (null for contract creation) */
  to: string | null;
  /** Value in wei */
  value: bigint;
  /** Input data */
  input: string;
  /** Access list (EIP-2930) */
  accessList?: AccessListItem[];
  /** Chain ID */
  chainId: number;
}

/**
 * Access list item for EIP-2930
 */
export interface AccessListItem {
  /** Address */
  address: string;
  /** Storage keys */
  storageKeys: string[];
}

/**
 * Ethereum transaction validation result
 */
export interface TxValidationResult {
  /** Whether transaction is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Validated transaction if valid */
  transaction?: CheckedEthereumTx;
  /** Estimated gas */
  estimatedGas?: bigint;
}

/**
 * Transaction receipt for checked transactions
 */
export interface CheckedTxReceipt {
  /** Transaction hash */
  transactionHash: string;
  /** Block hash */
  blockHash: string;
  /** Block number */
  blockNumber: number;
  /** Contract address (if deployment) */
  contractAddress?: string;
  /** Gas used */
  gasUsed: bigint;
  /** Effective gas price */
  effectiveGasPrice: bigint;
  /** Status (1 = success, 0 = failure) */
  status: number;
  /** Logs */
  logs: TxLog[];
}

/**
 * Transaction log
 */
export interface TxLog {
  /** Address that emitted the log */
  address: string;
  /** Log topics */
  topics: string[];
  /** Log data */
  data: string;
  /** Log index */
  logIndex: number;
}

/**
 * Ethereum checked pallet constants
 */
export interface EthereumCheckedConstants {
  /** Maximum gas per transaction */
  maxGasPerTx: bigint;
  /** Base fee */
  baseFee: bigint;
}

/**
 * Transaction result
 */
export interface EthereumCheckedTxResult {
  /** Whether transaction succeeded */
  success: boolean;
  /** Block hash */
  blockHash: string;
  /** Transaction hash */
  txHash: string;
  /** Ethereum transaction hash */
  ethTxHash?: string;
  /** Contract address if deployment */
  contractAddress?: string;
  /** Events */
  events: any[];
}
