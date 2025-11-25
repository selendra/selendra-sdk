/**
 * Ethereum Pallet Types
 *
 * Type definitions for Ethereum pallet (Frontier)
 * Handles Ethereum transaction format support
 */

import type { H160, H256, U256 } from "../evm/types.js";

// Re-export common types from EVM
export type { H160, H256, U256 } from "../evm/types.js";

// =============================================================================
// Ethereum Transaction Types
// =============================================================================

/** Legacy Ethereum transaction */
export interface LegacyTransaction {
  nonce: U256;
  gasPrice: U256;
  gasLimit: U256;
  action: TransactionAction;
  value: U256;
  input: string;
  signature: EthereumSignature;
}

/** EIP-2930 Access list transaction */
export interface EIP2930Transaction {
  chainId: U256;
  nonce: U256;
  gasPrice: U256;
  gasLimit: U256;
  action: TransactionAction;
  value: U256;
  input: string;
  accessList: AccessListEntry[];
  oddYParity: boolean;
  r: H256;
  s: H256;
}

/** EIP-1559 Transaction (Dynamic fee) */
export interface EIP1559Transaction {
  chainId: U256;
  nonce: U256;
  maxPriorityFeePerGas: U256;
  maxFeePerGas: U256;
  gasLimit: U256;
  action: TransactionAction;
  value: U256;
  input: string;
  accessList: AccessListEntry[];
  oddYParity: boolean;
  r: H256;
  s: H256;
}

/** EIP-4844 Blob transaction */
export interface EIP4844Transaction {
  chainId: U256;
  nonce: U256;
  maxPriorityFeePerGas: U256;
  maxFeePerGas: U256;
  gasLimit: U256;
  action: TransactionAction;
  value: U256;
  input: string;
  accessList: AccessListEntry[];
  maxFeePerBlobGas: U256;
  blobVersionedHashes: H256[];
  oddYParity: boolean;
  r: H256;
  s: H256;
}

/** Ethereum transaction (any type) */
export type EthereumTransaction =
  | { type: "Legacy"; transaction: LegacyTransaction }
  | { type: "EIP2930"; transaction: EIP2930Transaction }
  | { type: "EIP1559"; transaction: EIP1559Transaction }
  | { type: "EIP4844"; transaction: EIP4844Transaction };

/** Transaction action */
export type TransactionAction =
  | { type: "Call"; address: H160 }
  | { type: "Create" };

/** Access list entry */
export interface AccessListEntry {
  address: H160;
  storageKeys: H256[];
}

/** Ethereum signature */
export interface EthereumSignature {
  v: number;
  r: H256;
  s: H256;
}

// =============================================================================
// Ethereum Block Types
// =============================================================================

/** Ethereum block header */
export interface EthereumBlockHeader {
  parentHash: H256;
  ommersHash: H256;
  beneficiary: H160;
  stateRoot: H256;
  transactionsRoot: H256;
  receiptsRoot: H256;
  logsBloom: string; // 256 bytes bloom filter
  difficulty: U256;
  number: U256;
  gasLimit: U256;
  gasUsed: U256;
  timestamp: U256;
  extraData: string;
  mixHash: H256;
  nonce: string; // 8 bytes
  baseFeePerGas?: U256; // EIP-1559
  withdrawalsRoot?: H256; // EIP-4895
  blobGasUsed?: U256; // EIP-4844
  excessBlobGas?: U256; // EIP-4844
  parentBeaconBlockRoot?: H256; // EIP-4788
}

/** Ethereum block */
export interface EthereumBlock {
  header: EthereumBlockHeader;
  transactions: EthereumTransaction[];
  ommers: EthereumBlockHeader[];
}

// =============================================================================
// Receipt Types
// =============================================================================

/** Receipt status */
export type ReceiptStatus = "Success" | "Failure";

/** Log entry in receipt */
export interface ReceiptLog {
  address: H160;
  topics: H256[];
  data: string;
}

/** Ethereum transaction receipt */
export interface EthereumReceipt {
  transactionHash: H256;
  transactionIndex: number;
  blockHash: H256;
  blockNumber: U256;
  from: H160;
  to?: H160;
  cumulativeGasUsed: U256;
  gasUsed: U256;
  contractAddress?: H160;
  logs: ReceiptLog[];
  logsBloom: string;
  status: ReceiptStatus;
  effectiveGasPrice: U256;
  type: number; // 0=legacy, 1=EIP2930, 2=EIP1559, 3=EIP4844
}

// =============================================================================
// Transact Parameters
// =============================================================================

/** Parameters for pallet_ethereum transact call */
export interface TransactParams {
  /** Signed Ethereum transaction (RLP encoded) */
  transaction: string;
}

/** Transaction submission options */
export interface EthereumTxOptions {
  /** To address (null for contract creation) */
  to?: H160;
  /** Value in wei */
  value?: U256;
  /** Input data (calldata) */
  data?: string;
  /** Gas limit */
  gasLimit?: U256;
  /** Gas price (for legacy/EIP-2930) */
  gasPrice?: U256;
  /** Max fee per gas (for EIP-1559+) */
  maxFeePerGas?: U256;
  /** Max priority fee per gas (for EIP-1559+) */
  maxPriorityFeePerGas?: U256;
  /** Nonce (auto-filled if not provided) */
  nonce?: U256;
  /** Access list (for EIP-2930+) */
  accessList?: AccessListEntry[];
  /** Chain ID (auto-filled if not provided) */
  chainId?: U256;
}

// =============================================================================
// Event Types
// =============================================================================

/** Executed event - emitted when Ethereum transaction is executed */
export interface EthereumExecutedEvent {
  /** Sender address */
  from: H160;
  /** Recipient address (null for contract creation) */
  to?: H160;
  /** Transaction hash */
  transactionHash: H256;
  /** Exit reason */
  exitReason: ExitReason;
  /** Extra data */
  extraData?: string;
}

/** Exit reason from EVM execution */
export type ExitReason =
  | { type: "Succeed"; reason: ExitSucceed }
  | { type: "Error"; error: ExitError }
  | { type: "Revert"; reason: ExitRevert }
  | { type: "Fatal"; error: ExitFatal };

/** Successful exit reasons */
export type ExitSucceed = "Stopped" | "Returned" | "Suicided";

/** Error exit reasons */
export type ExitError =
  | "StackUnderflow"
  | "StackOverflow"
  | "InvalidJump"
  | "InvalidRange"
  | "DesignatedInvalid"
  | "CallTooDeep"
  | "CreateCollision"
  | "CreateContractLimit"
  | "OutOfOffset"
  | "OutOfGas"
  | "OutOfFund"
  | "PCUnderflow"
  | "CreateEmpty"
  | "Other";

/** Revert exit reasons */
export type ExitRevert = "Reverted";

/** Fatal exit reasons */
export type ExitFatal =
  | "NotSupported"
  | "UnhandledInterrupt"
  | "CallErrorAsFatal"
  | "Other";

// =============================================================================
// Query Result Types
// =============================================================================

/** Block info from storage */
export interface BlockInfo {
  block: EthereumBlock;
  hash: H256;
}

/** Pending transactions info */
export interface PendingInfo {
  transactions: EthereumTransaction[];
  count: number;
}

/** Transaction info with receipt */
export interface TransactionInfo {
  transaction: EthereumTransaction;
  receipt?: EthereumReceipt;
  blockHash?: H256;
  blockNumber?: U256;
  transactionIndex?: number;
}
