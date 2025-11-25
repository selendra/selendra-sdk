/**
 * Preimage Pallet Types
 *
 * Type definitions for storing large preimages
 */

/**
 * Preimage status
 */
export type PreimageStatus =
  | { Unrequested: { ticket: [string, bigint]; len: number } }
  | {
      Requested: {
        maybeTicket?: [string, bigint];
        count: number;
        maybeLen?: number;
      };
    };

/**
 * Preimage info (simplified)
 */
export interface PreimageInfo {
  /** Hash of the preimage */
  hash: string;
  /** Status of the preimage */
  status: "Unrequested" | "Requested" | "Unknown";
  /** Length of the preimage in bytes */
  length?: number;
  /** Deposit information */
  deposit?: {
    /** Account holding deposit */
    account: string;
    /** Deposit amount */
    amount: bigint;
  };
  /** Number of requests for this preimage */
  requestCount?: number;
}

/**
 * Preimage data
 */
export interface PreimageData {
  /** Preimage hash */
  hash: string;
  /** Preimage bytes */
  data: Uint8Array;
  /** Length in bytes */
  length: number;
}

/**
 * Preimage pallet constants
 */
export interface PreimageConstants {
  /** Base deposit for storing a preimage */
  baseDeposit: bigint;
  /** Deposit per byte */
  byteDeposit: bigint;
}

/**
 * Transaction result
 */
export interface PreimageTxResult {
  /** Whether transaction succeeded */
  success: boolean;
  /** Block hash */
  blockHash: string;
  /** Transaction hash */
  txHash: string;
  /** Events */
  events: any[];
  /** Preimage hash (if noting) */
  preimageHash?: string;
}
