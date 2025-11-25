/**
 * Safe Mode Pallet Types
 *
 * Types for emergency chain safe mode operations
 */

/**
 * Safe mode status
 */
export interface SafeModeStatus {
  /** Whether safe mode is active */
  isActive: boolean;
  /** Block number until safe mode ends (if active) */
  enteredUntil?: number;
  /** Remaining blocks in safe mode */
  remainingBlocks?: number;
}

/**
 * Safe mode configuration
 */
export interface SafeModeConfig {
  /** Duration of safe mode in blocks */
  enterDuration: number;
  /** Duration extension in blocks */
  extendDuration: number;
  /** Deposit required to enter safe mode */
  enterDepositAmount?: bigint;
  /** Deposit required to extend safe mode */
  extendDepositAmount?: bigint;
}

/**
 * Safe mode transaction result
 */
export interface SafeModeTxResult {
  /** Whether the transaction succeeded */
  success: boolean;
  /** Block hash where tx was finalized */
  blockHash?: string;
  /** Transaction hash */
  txHash?: string;
  /** Block until safe mode is active (for enter/extend) */
  activeUntil?: number;
  /** Transaction events */
  events: Array<{
    section: string;
    method: string;
    data: string;
  }>;
}

/**
 * Safe mode event types
 */
export type SafeModeEventType =
  | "Entered"
  | "Extended"
  | "Exited"
  | "DepositPlaced"
  | "DepositReleased"
  | "DepositSlashed"
  | "CannotDeposit"
  | "CannotRelease";

/**
 * Safe mode event
 */
export interface SafeModeEvent {
  /** Event type */
  type: SafeModeEventType;
  /** Event data */
  data: {
    /** Block until safe mode is active */
    until?: number;
    /** Account that placed deposit */
    account?: string;
    /** Deposit amount */
    amount?: bigint;
  };
}

/**
 * Safe mode constants
 */
export interface SafeModeConstants {
  /** Duration of safe mode in blocks */
  enterDuration: number;
  /** Duration extension in blocks */
  extendDuration: number;
  /** Deposit amount to enter */
  enterDepositAmount: bigint;
  /** Deposit amount to extend */
  extendDepositAmount: bigint;
  /** Release delay for deposits */
  releaseDelay: number;
}
