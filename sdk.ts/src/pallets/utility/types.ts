/**
 * Utility Pallet Types
 *
 * Type definitions for Substrate's utility pallet
 */

/**
 * Batch call item
 */
export interface BatchCallItem {
  /** Pallet section name */
  section: string;
  /** Method name */
  method: string;
  /** Call arguments */
  args: any[];
}

/**
 * Batch result
 */
export interface BatchResult {
  /** Whether the batch succeeded */
  success: boolean;
  /** Number of calls that succeeded */
  successCount: number;
  /** Number of calls that failed */
  failCount: number;
  /** Index of first failure (if any) */
  failedAtIndex?: number;
  /** Error message if failed */
  error?: string;
  /** Individual call results */
  results: BatchCallResult[];
}

/**
 * Individual batch call result
 */
export interface BatchCallResult {
  /** Index in the batch */
  index: number;
  /** Whether this call succeeded */
  success: boolean;
  /** Error if failed */
  error?: string;
  /** Events from this call */
  events?: any[];
}

/**
 * Utility pallet constants
 */
export interface UtilityConstants {
  /** Maximum batch size */
  batchedCallsLimit: number;
}

/**
 * Dispatch options for withWeight
 */
export interface DispatchWeight {
  /** Reference time */
  refTime: bigint;
  /** Proof size */
  proofSize: bigint;
}

/**
 * AsDerivative options
 */
export interface DerivativeOptions {
  /** Derivative index */
  index: number;
  /** Call to execute */
  call: string | any;
}

/**
 * DispatchAs options
 */
export interface DispatchAsOptions {
  /** Origin to dispatch as */
  asOrigin: DispatchOrigin;
  /** Call to execute */
  call: string | any;
}

/**
 * Origin types for dispatchAs
 */
export type DispatchOrigin =
  | { type: "Root" }
  | { type: "Signed"; account: string }
  | { type: "None" };

/**
 * Batch call type
 */
export type BatchType =
  | "batch" // Continue on failure
  | "batchAll" // Stop on failure (atomic)
  | "forceBatch"; // Continue on failure, emit events

/**
 * Batch execution options
 */
export interface BatchExecutionOptions {
  /** Type of batch operation */
  batchType: BatchType;
  /** Whether to stop on first error (for batch, not batchAll) */
  stopOnError?: boolean;
}

/**
 * Call info for display
 */
export interface CallInfo {
  /** Encoded call data */
  callData: string;
  /** Call hash */
  callHash: string;
  /** Decoded section */
  section: string;
  /** Decoded method */
  method: string;
  /** Decoded args (if available) */
  args?: any[];
  /** Estimated weight */
  weight?: DispatchWeight;
}

/**
 * Batch summary for preview
 */
export interface BatchSummary {
  /** Number of calls in batch */
  callCount: number;
  /** Individual call info */
  calls: CallInfo[];
  /** Total estimated weight */
  totalWeight: DispatchWeight;
  /** Whether batch is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
}

/**
 * Utility event types
 */
export type UtilityEventType =
  | "BatchCompleted"
  | "BatchCompletedWithErrors"
  | "BatchInterrupted"
  | "ItemCompleted"
  | "ItemFailed"
  | "DispatchedAs";

/**
 * Utility event
 */
export interface UtilityEvent {
  /** Event type */
  type: UtilityEventType;
  /** Block number */
  block: number;
  /** Index if relevant */
  index?: number;
  /** Error if failed */
  error?: string;
  /** Additional data */
  data?: any;
}
