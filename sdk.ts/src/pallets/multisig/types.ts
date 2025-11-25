/**
 * Multisig Pallet Types
 *
 * Type definitions for Substrate's multisig pallet
 */

/**
 * A timepoint for multisig transaction
 */
export interface Timepoint {
  /** Block height */
  height: number;
  /** Index within the block */
  index: number;
}

/**
 * Multisig storage info
 */
export interface MultisigInfo {
  /** When the multisig operation was first approved */
  when: Timepoint;
  /** The current depositor */
  depositor: string;
  /** The deposit paid by depositor */
  deposit: bigint;
  /** The accounts that have approved this operation so far */
  approvals: string[];
}

/**
 * Multisig account configuration
 */
export interface MultisigAccount {
  /** Threshold - minimum number of approvals needed */
  threshold: number;
  /** All signatory accounts */
  signatories: string[];
  /** Derived multisig address */
  address: string;
}

/**
 * Call to be executed by multisig
 */
export interface MultisigCall {
  /** Encoded call data */
  callData: string;
  /** Call hash (blake2_256) */
  callHash: string;
  /** Optional: decoded call information */
  decoded?: {
    section: string;
    method: string;
    args?: any;
  };
}

/**
 * Pending multisig operation
 */
export interface PendingMultisig {
  /** The multisig account address */
  multisigAddress: string;
  /** The call hash */
  callHash: string;
  /** Info about the pending call */
  info: MultisigInfo;
  /** Number of approvals received */
  approvalCount: number;
  /** Number of approvals still needed */
  approvalsNeeded: number;
  /** Whether this is ready to execute */
  canExecute: boolean;
}

/**
 * Result of multisig operation
 */
export interface MultisigResult {
  /** Whether the call was executed */
  executed: boolean;
  /** The call hash */
  callHash: string;
  /** Timepoint of the operation */
  timepoint: Timepoint;
  /** Approvals so far */
  approvals: string[];
  /** Error if execution failed */
  error?: string;
}

/**
 * Multisig pallet constants
 */
export interface MultisigConstants {
  /** Base deposit for creating multisig call */
  depositBase: bigint;
  /** Factor per byte for deposit */
  depositFactor: bigint;
  /** Maximum signatories per multisig */
  maxSignatories: number;
}

/**
 * Multisig call status
 */
export type MultisigStatus =
  | "pending"
  | "ready_to_execute"
  | "executed"
  | "cancelled";

/**
 * Approval status for a signatory
 */
export interface ApprovalStatus {
  /** Signatory address */
  signatory: string;
  /** Whether they have approved */
  hasApproved: boolean;
}

/**
 * Full multisig operation details
 */
export interface MultisigOperationDetails {
  /** Multisig account */
  account: MultisigAccount;
  /** Call hash */
  callHash: string;
  /** Operation info if exists */
  info: MultisigInfo | null;
  /** Current status */
  status: MultisigStatus;
  /** Approval status per signatory */
  approvalStatuses: ApprovalStatus[];
  /** Whether caller can approve/execute */
  canApprove: boolean;
  /** Whether operation can be executed */
  canExecute: boolean;
}
