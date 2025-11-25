/**
 * Treasury Pallet Types
 *
 * Type definitions for the Treasury pallet (pallet-treasury)
 */

/**
 * Treasury proposal status
 */
export type ProposalStatus = "Proposed" | "Approved" | "Rejected";

/**
 * Treasury proposal information
 */
export interface TreasuryProposal {
  /** Proposal index */
  index: number;
  /** Account proposing the spend */
  proposer: string;
  /** Amount requested */
  value: bigint;
  /** Beneficiary account */
  beneficiary: string;
  /** Bond amount (slashed on rejection) */
  bond: bigint;
}

/**
 * Spend status for approved spends
 */
export interface SpendStatus {
  /** Asset kind (for multi-asset treasuries) */
  assetKind: any;
  /** Amount approved */
  amount: bigint;
  /** Beneficiary */
  beneficiary: string;
  /** Block when it was approved */
  validFrom: number;
  /** Block when it expires */
  expireAt: number;
  /** Status */
  status: "Pending" | "Attempted" | "Failed";
}

// =============================================================================
// Extrinsic Parameters
// =============================================================================

/**
 * Parameters for proposing a spend
 */
export interface ProposeSpendParams {
  /** Amount to spend */
  value: bigint;
  /** Beneficiary account */
  beneficiary: string;
}

/**
 * Parameters for rejecting a proposal
 */
export interface RejectProposalParams {
  /** Proposal ID to reject */
  proposalId: number;
}

/**
 * Parameters for approving a proposal
 */
export interface ApproveProposalParams {
  /** Proposal ID to approve */
  proposalId: number;
}

/**
 * Parameters for spending (root only)
 */
export interface SpendParams {
  /** Amount to spend */
  amount: bigint;
  /** Beneficiary */
  beneficiary: string;
  /** Valid from block (optional) */
  validFrom?: number;
}

/**
 * Parameters for spend_local (root only)
 */
export interface SpendLocalParams {
  /** Amount to spend */
  amount: bigint;
  /** Beneficiary */
  beneficiary: string;
}

/**
 * Parameters for removing approval
 */
export interface RemoveApprovalParams {
  /** Proposal ID */
  proposalId: number;
}

/**
 * Parameters for voiding a spend
 */
export interface VoidSpendParams {
  /** Spend index */
  index: number;
}

/**
 * Parameters for paying out a spend
 */
export interface PayoutParams {
  /** Spend index */
  index: number;
}

/**
 * Parameters for checking spend status
 */
export interface CheckStatusParams {
  /** Spend index */
  index: number;
}

// =============================================================================
// Events
// =============================================================================

/**
 * Event: Proposal submitted
 */
export interface ProposedEvent {
  /** Proposal index */
  proposalIndex: number;
}

/**
 * Event: Spending approved
 */
export interface SpendingEvent {
  /** Budget remaining */
  budgetRemaining: bigint;
}

/**
 * Event: Proposal awarded (paid out)
 */
export interface AwardedEvent {
  /** Proposal index */
  proposalIndex: number;
  /** Amount awarded */
  award: bigint;
  /** Beneficiary account */
  account: string;
}

/**
 * Event: Proposal rejected
 */
export interface RejectedEvent {
  /** Proposal index */
  proposalIndex: number;
  /** Slashed bond amount */
  slashed: bigint;
}

/**
 * Event: Treasury burnt
 */
export interface BurntEvent {
  /** Amount burnt */
  burntFunds: bigint;
}

/**
 * Event: Rollover to next period
 */
export interface RolloverEvent {
  /** Rollover balance */
  rolloverBalance: bigint;
}

/**
 * Event: Deposit made to treasury
 */
export interface DepositEvent {
  /** Deposited amount */
  value: bigint;
}

/**
 * Event: Spend approved
 */
export interface SpendApprovedEvent {
  /** Proposal index */
  proposalIndex: number;
  /** Amount */
  amount: bigint;
  /** Beneficiary */
  beneficiary: string;
}

/**
 * Event: Asset spend approved (multi-asset)
 */
export interface AssetSpendApprovedEvent {
  /** Spend index */
  index: number;
  /** Asset kind */
  assetKind: any;
  /** Amount */
  amount: bigint;
  /** Beneficiary */
  beneficiary: string;
  /** Valid from block */
  validFrom: number;
  /** Expire at block */
  expireAt: number;
}

/**
 * Event: Asset spend voided
 */
export interface AssetSpendVoidedEvent {
  /** Spend index */
  index: number;
}

/**
 * Event: Paid out
 */
export interface PaidEvent {
  /** Spend index */
  index: number;
  /** Payment ID */
  paymentId: any;
}

/**
 * Event: Payment failed
 */
export interface PaymentFailedEvent {
  /** Spend index */
  index: number;
  /** Payment ID */
  paymentId: any;
}

/**
 * Event: Spend processed
 */
export interface SpendProcessedEvent {
  /** Spend index */
  index: number;
}

/**
 * Treasury pallet constants
 */
export interface TreasuryConstants {
  /** Fraction of proposal value required as bond */
  proposalBond: number;
  /** Minimum bond amount */
  proposalBondMinimum: bigint;
  /** Maximum bond amount (if set) */
  proposalBondMaximum: bigint | null;
  /** Period between spend rounds */
  spendPeriod: number;
  /** Percentage of treasury to burn each round */
  burn: number;
  /** Treasury pallet ID */
  palletId: string;
  /** Maximum number of approvals */
  maxApprovals: number;
  /** Payment period (for multi-asset) */
  payoutPeriod: number;
}
