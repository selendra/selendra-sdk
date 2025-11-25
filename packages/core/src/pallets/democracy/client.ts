/**
 * Democracy Pallet Client
 *
 * Main client for interacting with the Democracy pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { DemocracyQueries } from "./queries.js";
import {
  Conviction,
  type ProposeParams,
  type SecondParams,
  type VoteParams,
  type StandardVoteParams,
  type DelegateParams,
  type RemoveVoteParams,
  type EmergencyCancelParams,
  type ExternalProposeParams,
  type FastTrackParams,
  type ReferendumInfo,
  type ProposalInfo,
  type VotingInfo,
  type DemocracyConstants,
  type AccountVote,
} from "./types.js";

/**
 * Democracy Manager - Main interface for Democracy pallet
 *
 * @example
 * ```typescript
 * const democracy = new DemocracyManager(api);
 *
 * // Get active referenda
 * const referenda = await democracy.queries.getActiveReferenda();
 *
 * // Vote on a referendum
 * const tx = democracy.vote({
 *   refIndex: 0,
 *   vote: { Standard: { vote: { aye: true, conviction: Conviction.Locked1x }, balance: 1000n } }
 * });
 * await tx.signAndSend(signer);
 * ```
 */
export class DemocracyManager {
  public queries: DemocracyQueries;

  constructor(private api: ApiPromise) {
    this.queries = new DemocracyQueries(api);
  }

  // ============================================================================
  // Extrinsics (Transactions)
  // ============================================================================

  /**
   * Submit a public proposal
   * @param params - Propose parameters
   * @returns Submittable extrinsic
   */
  propose(
    params: ProposeParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.propose(params.proposal, params.value);
  }

  /**
   * Second a proposal (support it to move to referendum)
   * @param params - Second parameters
   * @returns Submittable extrinsic
   */
  second(
    params: SecondParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.second(params.proposal);
  }

  /**
   * Vote on a referendum
   * @param params - Vote parameters
   * @returns Submittable extrinsic
   */
  vote(
    params: VoteParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.vote(params.refIndex, params.vote);
  }

  /**
   * Vote on a referendum with standard parameters (convenience method)
   * @param params - Standard vote parameters
   * @returns Submittable extrinsic
   */
  voteStandard(
    params: StandardVoteParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    const vote: AccountVote = {
      Standard: {
        vote: {
          aye: params.aye,
          conviction: params.conviction,
        },
        balance: params.balance,
      },
    };
    return this.api.tx.democracy.vote(params.refIndex, vote);
  }

  /**
   * Delegate voting power to another account
   * @param params - Delegate parameters
   * @returns Submittable extrinsic
   */
  delegate(
    params: DelegateParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.delegate(
      params.to,
      params.conviction,
      params.balance
    );
  }

  /**
   * Remove delegation
   * @returns Submittable extrinsic
   */
  undelegate(): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.undelegate();
  }

  /**
   * Remove a vote for a referendum
   * @param params - Remove vote parameters
   * @returns Submittable extrinsic
   */
  removeVote(
    params: RemoveVoteParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.removeVote(params.index);
  }

  /**
   * Remove other account's expired vote
   * @param target - Target account
   * @param index - Referendum index
   * @returns Submittable extrinsic
   */
  removeOtherVote(
    target: string,
    index: number
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.removeOtherVote(target, index);
  }

  /**
   * Unlock tokens after voting period
   * @param target - Account to unlock
   * @returns Submittable extrinsic
   */
  unlock(target: string): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.unlock(target);
  }

  // ============================================================================
  // Council/Root Only Extrinsics
  // ============================================================================

  /**
   * Emergency cancel a referendum (council only)
   * @param params - Cancel parameters
   * @returns Submittable extrinsic
   */
  emergencyCancel(
    params: EmergencyCancelParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.emergencyCancel(params.refIndex);
  }

  /**
   * Submit an external proposal (council only)
   * @param params - External propose parameters
   * @returns Submittable extrinsic
   */
  externalPropose(
    params: ExternalProposeParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.externalPropose(params.proposal);
  }

  /**
   * Submit external proposal with default aye vote (council only)
   * @param params - External propose parameters
   * @returns Submittable extrinsic
   */
  externalProposeDefault(
    params: ExternalProposeParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.externalProposeDefault(params.proposal);
  }

  /**
   * Submit external proposal with majority threshold (council only)
   * @param params - External propose parameters
   * @returns Submittable extrinsic
   */
  externalProposeMajority(
    params: ExternalProposeParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.externalProposeMajority(params.proposal);
  }

  /**
   * Fast track a proposal (technical committee only)
   * @param params - Fast track parameters
   * @returns Submittable extrinsic
   */
  fastTrack(
    params: FastTrackParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.fastTrack(
      params.proposalHash,
      params.votingPeriod,
      params.delay
    );
  }

  /**
   * Veto and blacklist a proposal
   * @param proposalHash - Proposal hash
   * @returns Submittable extrinsic
   */
  vetoExternal(
    proposalHash: string
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.vetoExternal(proposalHash);
  }

  /**
   * Cancel a referendum (root only)
   * @param refIndex - Referendum index
   * @returns Submittable extrinsic
   */
  cancelReferendum(
    refIndex: number
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.cancelReferendum(refIndex);
  }

  /**
   * Blacklist a proposal hash
   * @param proposalHash - Proposal hash
   * @param maybeRefIndex - Optional referendum index
   * @returns Submittable extrinsic
   */
  blacklist(
    proposalHash: string,
    maybeRefIndex?: number
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.blacklist(proposalHash, maybeRefIndex);
  }

  /**
   * Cancel a proposal (root only)
   * @param propIndex - Proposal index
   * @returns Submittable extrinsic
   */
  cancelProposal(
    propIndex: number
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.democracy.cancelProposal(propIndex);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get referendum info by index
   * @param refIndex - Referendum index
   * @returns Referendum info
   */
  async getReferendum(refIndex: number): Promise<ReferendumInfo | null> {
    return this.queries.referendumInfoOf(refIndex);
  }

  /**
   * Get all active referenda
   * @returns Array of active referenda
   */
  async getActiveReferenda(): Promise<ReferendumInfo[]> {
    return this.queries.getActiveReferenda();
  }

  /**
   * Get all public proposals
   * @returns Array of proposals
   */
  async getProposals(): Promise<ProposalInfo[]> {
    const proposals = await this.queries.publicProps();

    // Enrich with deposit info
    for (const proposal of proposals) {
      const deposit = await this.queries.depositOf(proposal.index);
      if (deposit) {
        proposal.deposit = deposit.deposit;
        proposal.seconds = deposit.depositors;
      }
    }

    return proposals;
  }

  /**
   * Get voting info for an account
   * @param account - Account address
   * @returns Voting info
   */
  async getVotingOf(account: string): Promise<VotingInfo> {
    return this.queries.votingOf(account);
  }

  /**
   * Get democracy constants
   * @returns Democracy constants
   */
  getConstants(): DemocracyConstants {
    return this.queries.getConstants();
  }

  /**
   * Check if an account has voted on a referendum
   * @param account - Account address
   * @param refIndex - Referendum index
   * @returns True if voted
   */
  async hasVoted(account: string, refIndex: number): Promise<boolean> {
    const voting = await this.getVotingOf(account);
    if (voting.direct) {
      return voting.direct.votes.some(([idx]) => idx === refIndex);
    }
    return false;
  }

  /**
   * Get account's vote on a specific referendum
   * @param account - Account address
   * @param refIndex - Referendum index
   * @returns Vote or null
   */
  async getVote(
    account: string,
    refIndex: number
  ): Promise<AccountVote | null> {
    const voting = await this.getVotingOf(account);
    if (voting.direct) {
      const vote = voting.direct.votes.find(([idx]) => idx === refIndex);
      return vote ? vote[1] : null;
    }
    return null;
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
    callback: (proposalIndex: number, deposit: bigint) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.democracy.Proposed?.is(event)) {
          const [proposalIndex, deposit] = event.data;
          callback(proposalIndex.toNumber(), BigInt(deposit.toString()));
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Started events (referendum started)
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onStarted(
    callback: (refIndex: number, threshold: string) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.democracy.Started?.is(event)) {
          const [refIndex, threshold] = event.data;
          callback(refIndex.toNumber(), threshold.toString());
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Passed events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onPassed(callback: (refIndex: number) => void): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.democracy.Passed?.is(event)) {
          const [refIndex] = event.data;
          callback(refIndex.toNumber());
        }
      });
    }) as any;
  }

  /**
   * Subscribe to NotPassed events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onNotPassed(callback: (refIndex: number) => void): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.democracy.NotPassed?.is(event)) {
          const [refIndex] = event.data;
          callback(refIndex.toNumber());
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
    callback: (voter: string, refIndex: number, vote: any) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.democracy.Voted?.is(event)) {
          const [voter, refIndex, vote] = event.data;
          callback(voter.toString(), refIndex.toNumber(), vote.toJSON());
        }
      });
    }) as any;
  }
}
