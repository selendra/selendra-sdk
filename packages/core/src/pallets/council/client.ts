/**
 * Council Pallet Client (pallet-collective Instance 1)
 *
 * Main client for interacting with the Council collective pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { CouncilQueries } from "./queries.js";
import type {
  CouncilProposeParams,
  CouncilVoteParams,
  CouncilCloseParams,
  CouncilDisapproveParams,
  CouncilExecuteParams,
  SetMembersParams,
  CouncilProposal,
  Votes,
  CouncilConstants,
} from "./types.js";

/**
 * Council Manager - Main interface for Council collective pallet
 *
 * @example
 * ```typescript
 * const council = new CouncilManager(api);
 *
 * // Get council members
 * const members = await council.queries.members();
 *
 * // Vote on a proposal (must be council member)
 * const tx = council.vote({ proposal: '0x...', index: 0, approve: true });
 * await tx.signAndSend(signer);
 * ```
 */
export class CouncilManager {
  public queries: CouncilQueries;

  constructor(private api: ApiPromise) {
    this.queries = new CouncilQueries(api);
  }

  // ============================================================================
  // Extrinsics (Transactions)
  // ============================================================================

  /**
   * Execute a proposal directly (single member threshold)
   * @param params - Execute parameters
   * @returns Submittable extrinsic
   */
  execute(
    params: CouncilExecuteParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.council.execute(params.proposal, params.lengthBound);
  }

  /**
   * Submit a proposal for council vote
   * @param params - Propose parameters
   * @returns Submittable extrinsic
   */
  propose(
    params: CouncilProposeParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.council.propose(
      params.threshold,
      params.proposal,
      params.lengthBound
    );
  }

  /**
   * Vote on a council proposal
   * @param params - Vote parameters
   * @returns Submittable extrinsic
   */
  vote(
    params: CouncilVoteParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.council.vote(
      params.proposal,
      params.index,
      params.approve
    );
  }

  /**
   * Close a proposal (execute if threshold met, otherwise remove)
   * @param params - Close parameters
   * @returns Submittable extrinsic
   */
  close(
    params: CouncilCloseParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.council.close(
      params.proposalHash,
      params.index,
      params.proposalWeightBound,
      params.lengthBound
    );
  }

  /**
   * Disapprove a proposal (root only)
   * @param params - Disapprove parameters
   * @returns Submittable extrinsic
   */
  disapproveProposal(
    params: CouncilDisapproveParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.council.disapproveProposal(params.proposalHash);
  }

  // ============================================================================
  // Root/Governance Only
  // ============================================================================

  /**
   * Set council members (root only)
   * @param params - Set members parameters
   * @returns Submittable extrinsic
   */
  setMembers(
    params: SetMembersParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.council.setMembers(
      params.newMembers,
      params.prime,
      params.oldCount
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get all council members
   * @returns Array of member addresses
   */
  async getMembers(): Promise<string[]> {
    return this.queries.members();
  }

  /**
   * Get prime member
   * @returns Prime member or null
   */
  async getPrime(): Promise<string | null> {
    return this.queries.prime();
  }

  /**
   * Get all proposals with votes
   * @returns Array of proposals
   */
  async getProposals(): Promise<CouncilProposal[]> {
    return this.queries.getProposalsWithVotes();
  }

  /**
   * Get proposal by hash
   * @param hash - Proposal hash
   * @returns Proposal or null
   */
  async getProposal(hash: string): Promise<CouncilProposal | null> {
    const [proposal, votes] = await Promise.all([
      this.queries.proposalOf(hash),
      this.queries.voting(hash),
    ]);

    if (!proposal && !votes) {
      return null;
    }

    return {
      hash,
      index: votes?.index ?? 0,
      votes: votes ?? undefined,
      proposal,
    };
  }

  /**
   * Get voting info for a proposal
   * @param hash - Proposal hash
   * @returns Votes or null
   */
  async getVoting(hash: string): Promise<Votes | null> {
    return this.queries.voting(hash);
  }

  /**
   * Check if account is a council member
   * @param account - Account address
   * @returns True if member
   */
  async isMember(account: string): Promise<boolean> {
    return this.queries.isMember(account);
  }

  /**
   * Get council constants
   * @returns Council constants
   */
  getConstants(): CouncilConstants {
    return this.queries.getConstants();
  }

  /**
   * Get proposal count
   * @returns Number of proposals
   */
  async getProposalCount(): Promise<number> {
    return this.queries.proposalCount();
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
    callback: (
      account: string,
      proposalIndex: number,
      proposalHash: string,
      threshold: number
    ) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.council.Proposed?.is(event)) {
          const [account, proposalIndex, proposalHash, threshold] = event.data;
          callback(
            account.toString(),
            proposalIndex.toNumber(),
            proposalHash.toString(),
            threshold.toNumber()
          );
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Voted events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onVoted(
    callback: (
      account: string,
      proposalHash: string,
      voted: boolean,
      yes: number,
      no: number
    ) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.council.Voted?.is(event)) {
          const [account, proposalHash, voted, yes, no] = event.data;
          callback(
            account.toString(),
            proposalHash.toString(),
            voted.isTrue || voted.toString() === "true",
            yes.toNumber(),
            no.toNumber()
          );
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Approved events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onApproved(
    callback: (proposalHash: string) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.council.Approved?.is(event)) {
          const [proposalHash] = event.data;
          callback(proposalHash.toString());
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Disapproved events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onDisapproved(
    callback: (proposalHash: string) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.council.Disapproved?.is(event)) {
          const [proposalHash] = event.data;
          callback(proposalHash.toString());
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Executed events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onExecuted(
    callback: (proposalHash: string, result: any) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.council.Executed?.is(event)) {
          const [proposalHash, result] = event.data;
          callback(proposalHash.toString(), result.toJSON());
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Closed events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onClosed(
    callback: (proposalHash: string, yes: number, no: number) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.council.Closed?.is(event)) {
          const [proposalHash, yes, no] = event.data;
          callback(proposalHash.toString(), yes.toNumber(), no.toNumber());
        }
      });
    }) as any;
  }
}
