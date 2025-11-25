/**
 * Tx Pause Pallet Types
 *
 * Types for pausing specific transactions
 */

/**
 * Full transaction name (pallet + call)
 */
export interface FullTransactionName {
  /** Pallet name */
  palletName: string;
  /** Call name within the pallet */
  callName: string;
}

/**
 * Paused transaction info
 */
export interface PausedTransaction {
  /** Full name of the paused transaction */
  fullName: FullTransactionName;
  /** Whether it is paused */
  isPaused: boolean;
}

/**
 * Tx pause configuration
 */
export interface TxPauseConfig {
  /** Maximum name length */
  maxNameLen: number;
}

/**
 * Tx pause transaction result
 */
export interface TxPauseTxResult {
  /** Whether the transaction succeeded */
  success: boolean;
  /** Block hash where tx was finalized */
  blockHash?: string;
  /** Transaction hash */
  txHash?: string;
  /** The transaction that was paused/unpaused */
  transaction?: FullTransactionName;
  /** Transaction events */
  events: Array<{
    section: string;
    method: string;
    data: string;
  }>;
}

/**
 * Tx pause event types
 */
export type TxPauseEventType = "CallPaused" | "CallUnpaused";

/**
 * Tx pause event
 */
export interface TxPauseEvent {
  /** Event type */
  type: TxPauseEventType;
  /** Event data */
  data: {
    /** Full name of the transaction */
    fullName: FullTransactionName;
  };
}

/**
 * Tx pause constants
 */
export interface TxPauseConstants {
  /** Maximum name length */
  maxNameLen: number;
}

/**
 * Batch pause/unpause params
 */
export interface BatchPauseParams {
  /** Transactions to pause */
  pause: FullTransactionName[];
  /** Transactions to unpause */
  unpause: FullTransactionName[];
}

/**
 * Pause status for multiple transactions
 */
export interface PauseStatusBatch {
  /** Paused transactions */
  paused: FullTransactionName[];
  /** Not paused transactions */
  notPaused: FullTransactionName[];
}
