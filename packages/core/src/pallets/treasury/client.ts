/**
 * Treasury Pallet Client
 *
 * Main client for interacting with the Treasury pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { TreasuryQueries } from "./queries.js";
import type {
  ProposeSpendParams,
  RejectProposalParams,
  ApproveProposalParams,
  SpendLocalParams,
  RemoveApprovalParams,
  VoidSpendParams,
  PayoutParams,
  CheckStatusParams,
  TreasuryProposal,
  TreasuryConstants,
} from "./types.js";

/**
 * Treasury Manager - Main interface for Treasury pallet
 *
 * @example
 * ```typescript
 * const treasury = new TreasuryManager(api);
 *
 * // Get treasury balance
 * const pot = await treasury.queries.getPot();
 *
 * // Propose a spend (any account)
 * const tx = treasury.proposeSpend({ value: 1000n, beneficiary: '5GrwvaEF...' });
 * await tx.signAndSend(signer);
 *
 * // Approve a proposal (council)
 * const approveTx = treasury.approveProposal({ proposalId: 0 });
 * ```
 */
export class TreasuryManager {
  public queries: TreasuryQueries;

  constructor(private api: ApiPromise) {
    this.queries = new TreasuryQueries(api);
  }

  // ============================================================================
  // Extrinsics (Transactions)
  // ============================================================================

  /**
   * Propose a treasury spend
   * @param params - Propose spend parameters
   * @returns Submittable extrinsic
   */
  proposeSpend(
    params: ProposeSpendParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.treasury.proposeSpend(params.value, params.beneficiary);
  }

  /**
   * Reject a proposal (council origin required)
   * @param params - Reject parameters
   * @returns Submittable extrinsic
   */
  rejectProposal(
    params: RejectProposalParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.treasury.rejectProposal(params.proposalId);
  }

  /**
   * Approve a proposal (council origin required)
   * @param params - Approve parameters
   * @returns Submittable extrinsic
   */
  approveProposal(
    params: ApproveProposalParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.treasury.approveProposal(params.proposalId);
  }

  /**
   * Spend from treasury directly (root origin required)
   * @param params - Spend local parameters
   * @returns Submittable extrinsic
   */
  spendLocal(
    params: SpendLocalParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.treasury.spendLocal(params.amount, params.beneficiary);
  }

  /**
   * Remove an approval (council origin required)
   * @param params - Remove approval parameters
   * @returns Submittable extrinsic
   */
  removeApproval(
    params: RemoveApprovalParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.treasury.removeApproval(params.proposalId);
  }

  /**
   * Void a spend (root origin, multi-asset treasury)
   * @param params - Void spend parameters
   * @returns Submittable extrinsic
   */
  voidSpend(
    params: VoidSpendParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    if (!this.api.tx.treasury.voidSpend) {
      throw new Error("voidSpend not available on this chain");
    }
    return this.api.tx.treasury.voidSpend(params.index);
  }

  /**
   * Claim a payout (multi-asset treasury)
   * @param params - Payout parameters
   * @returns Submittable extrinsic
   */
  payout(
    params: PayoutParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    if (!this.api.tx.treasury.payout) {
      throw new Error("payout not available on this chain");
    }
    return this.api.tx.treasury.payout(params.index);
  }

  /**
   * Check status of a spend (multi-asset treasury)
   * @param params - Check status parameters
   * @returns Submittable extrinsic
   */
  checkStatus(
    params: CheckStatusParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    if (!this.api.tx.treasury.checkStatus) {
      throw new Error("checkStatus not available on this chain");
    }
    return this.api.tx.treasury.checkStatus(params.index);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get treasury pot balance
   * @returns Treasury balance
   */
  async getPot(): Promise<bigint> {
    return this.queries.getPot();
  }

  /**
   * Get all proposals
   * @returns Array of proposals
   */
  async getProposals(): Promise<TreasuryProposal[]> {
    return this.queries.getAllProposals();
  }

  /**
   * Get proposal by index
   * @param index - Proposal index
   * @returns Proposal or null
   */
  async getProposal(index: number): Promise<TreasuryProposal | null> {
    return this.queries.proposals(index);
  }

  /**
   * Get approved proposal indices
   * @returns Array of approved indices
   */
  async getApprovals(): Promise<number[]> {
    return this.queries.approvals();
  }

  /**
   * Get proposal count
   * @returns Number of proposals
   */
  async getProposalCount(): Promise<number> {
    return this.queries.proposalCount();
  }

  /**
   * Get treasury constants
   * @returns Treasury constants
   */
  getConstants(): TreasuryConstants {
    return this.queries.getConstants();
  }

  /**
   * Calculate bond amount for a proposal value
   * @param value - Proposal value
   * @returns Required bond amount
   */
  calculateBond(value: bigint): bigint {
    const constants = this.getConstants();
    const calculatedBond =
      (value * BigInt(Math.floor(constants.proposalBond * 1_000_000))) /
      1_000_000n;

    if (calculatedBond < constants.proposalBondMinimum) {
      return constants.proposalBondMinimum;
    }

    if (
      constants.proposalBondMaximum &&
      calculatedBond > constants.proposalBondMaximum
    ) {
      return constants.proposalBondMaximum;
    }

    return calculatedBond;
  }

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

  /**
   * Subscribe to Proposed events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onProposed(
    callback: (proposalIndex: number) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.treasury.Proposed?.is(event)) {
          const [proposalIndex] = event.data;
          callback(proposalIndex.toNumber());
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Awarded events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onAwarded(
    callback: (proposalIndex: number, award: bigint, account: string) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.treasury.Awarded?.is(event)) {
          const [proposalIndex, award, account] = event.data;
          callback(
            proposalIndex.toNumber(),
            BigInt(award.toString()),
            account.toString()
          );
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Rejected events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onRejected(
    callback: (proposalIndex: number, slashed: bigint) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.treasury.Rejected?.is(event)) {
          const [proposalIndex, slashed] = event.data;
          callback(proposalIndex.toNumber(), BigInt(slashed.toString()));
        }
      });
    }) as any;
  }

  /**
   * Subscribe to SpendApproved events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onSpendApproved(
    callback: (
      proposalIndex: number,
      amount: bigint,
      beneficiary: string
    ) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.treasury.SpendApproved?.is(event)) {
          const [proposalIndex, amount, beneficiary] = event.data;
          callback(
            proposalIndex.toNumber(),
            BigInt(amount.toString()),
            beneficiary.toString()
          );
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Deposit events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onDeposit(callback: (value: bigint) => void): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.treasury.Deposit?.is(event)) {
          const [value] = event.data;
          callback(BigInt(value.toString()));
        }
      });
    }) as any;
  }
}
