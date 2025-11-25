/**
 * Operations Pallet Types
 *
 * Types for the Operations pallet that provides account maintenance utilities
 */

/**
 * Account consumer information
 */
export interface AccountConsumers {
  /** Account address */
  account: string;
  /** Current consumers counter */
  currentConsumers: number;
}

/**
 * Account balance details
 */
export interface AccountBalanceDetails {
  /** Account address */
  account: string;
  /** Free balance */
  free: bigint;
  /** Reserved balance */
  reserved: bigint;
  /** Frozen balance */
  frozen: bigint;
  /** Whether reserved is non-zero */
  hasReserved: boolean;
  /** Whether frozen is non-zero */
  hasFrozen: boolean;
}

/**
 * Account validation result
 */
export interface AccountValidation {
  /** Account address */
  account: string;
  /** Current consumers counter */
  currentConsumers: number;
  /** Expected consumers based on state */
  expectedConsumers: number;
  /** Whether there's a counter mismatch */
  hasMismatch: boolean;
  /** Type of mismatch */
  mismatchType: "none" | "underflow" | "overflow";
  /** Difference between current and expected */
  difference: number;
  /** Account state flags */
  state: {
    hasReservedOrFrozen: boolean;
    isContractAccount: boolean;
    isBonded: boolean;
    hasSessionKeys: boolean;
  };
}

/**
 * Fix consumers counter result
 */
export interface FixConsumersResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Block hash where tx was finalized */
  blockHash?: string;
  /** Transaction hash */
  txHash?: string;
  /** Whether counter was incremented */
  incremented?: boolean;
  /** Whether counter was decremented */
  decremented?: boolean;
  /** No change needed */
  noChange?: boolean;
  /** Transaction events */
  events: Array<{
    section: string;
    method: string;
    data: string;
  }>;
  /** Error message if failed */
  error?: string;
}

/**
 * Batch fix result
 */
export interface BatchFixResult {
  /** Number of accounts processed */
  processed: number;
  /** Number of accounts fixed */
  fixed: number;
  /** Number of accounts skipped (no fix needed) */
  skipped: number;
  /** Number of failures */
  failed: number;
  /** Individual results */
  results: Array<{
    account: string;
    success: boolean;
    action?: "incremented" | "decremented" | "none";
    error?: string;
  }>;
}

/**
 * Operations pallet constants
 */
export interface OperationsConstants {
  /** Staking lock identifier */
  stakingId: string;
  /** Vesting lock identifier */
  vestingId: string;
}

/**
 * Consumer counter event types
 */
export type ConsumerEvent =
  | { type: "ConsumersCounterIncremented"; who: string }
  | { type: "ConsumersCounterDecremented"; who: string };
