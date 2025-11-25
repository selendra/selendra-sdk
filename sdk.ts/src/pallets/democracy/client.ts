/**
 * Democracy Pallet Client
 * 
 * Main client for interacting with the Democracy pallet
 */

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import { DemocracyQueries } from './queries.js';
import type {
  ProposeParams,
  SecondParams,
  VoteParams,
  DelegateParams,
  RemoveVoteParams,
  ReferendumInfo,
  VotingInfo,
  Proposal,
  ActiveReferenda,
  ProposalDetails,
  AccountVote,
} from './types';

/**
 * Democracy Manager - Main interface for Democracy pallet
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
   * Propose a referendum
   * @param params - Propose parameters
   * @returns Submittable extrinsic
   */
  propose(params: ProposeParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.democracy.propose(params.proposalHash, params.value);
  }

  /**
   * Second (support) a proposal
   * @param params - Second parameters
   * @returns Submittable extrinsic
   */
  second(params: SecondParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.democracy.second(params.proposal);
  }

  /**
   * Vote on a referendum
   * @param params - Vote parameters
   * @returns Submittable extrinsic
   */
  vote(params: VoteParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    const vote = {
      Standard: {
        vote: {
          aye: params.vote.vote === 'Aye',
          conviction: params.vote.conviction,
        },
        balance: params.vote.balance,
      },
    };
    
    return this.api.tx.democracy.vote(params.refIndex, vote);
  }

  /**
   * Delegate voting power
   * @param params - Delegate parameters
   * @returns Submittable extrinsic
   */
  delegate(params: DelegateParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.democracy.delegate(
      params.to,
      params.conviction,
      params.balance
    );
  }

  /**
   * Undelegate voting power
   * @returns Submittable extrinsic
   */
  undelegate(): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.democracy.undelegate();
  }

  /**
   * Remove vote from referendum
   * @param params - Remove vote parameters
   * @returns Submittable extrinsic
   */
  removeVote(params: RemoveVoteParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.democracy.removeVote(params.index);
  }

  /**
   * Emergency cancel a referendum (sudo only)
   * @param refIndex - Referendum index
   * @returns Submittable extrinsic
   */
  emergencyCancel(refIndex: number): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.democracy.emergencyCancel(refIndex);
  }

  /**
   * External propose (council only)
   * @param proposalHash - Proposal hash
   * @returns Submittable extrinsic
   */
  externalPropose(proposalHash: string): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.democracy.externalPropose(proposalHash);
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get all active referenda
   * @returns Active referenda summary
   */
  async getActiveReferenda(): Promise<ActiveReferenda> {
    const referenda = await this.queries.getActiveReferenda();
    return {
      total: referenda.length,
      referenda,
    };
  }

  /**
   * Get proposal details
   * @param proposalIndex - Proposal index
   * @returns Proposal details
   */
  async getProposalDetails(proposalIndex: number): Promise<ProposalDetails | null> {
    const proposals = await this.queries.publicProps();
    const proposal = proposals.find(p => p.index === proposalIndex);
    
    if (!proposal) {
      return null;
    }

    const depositInfo = await this.queries.depositOf(proposalIndex);
    const minimumDeposit = await this.queries.getMinimumDeposit();

    return {
      proposal: {
        ...proposal,
        deposit: depositInfo?.deposit || BigInt(0),
        seconds: depositInfo?.depositors || [],
      },
      canSecond: true,
      minimumDeposit,
    };
  }

  /**
   * Check if account can vote on referendum
   * @param account - Account address
   * @param refIndex - Referendum index
   * @returns True if can vote
   */
  async canVote(account: string, refIndex: number): Promise<boolean> {
    const refInfo = await this.queries.referendumInfoOf(refIndex);
    if (!refInfo || !refInfo.ongoing) {
      return false;
    }

    const votingInfo = await this.queries.votingOf(account);
    if (votingInfo.isDelegating) {
      return false;
    }

    // Check if already voted
    if (votingInfo.votes?.has(refIndex)) {
      return false;
    }

    return true;
  }

  /**
   * Get voting info for account
   * @param account - Account address
   * @returns Voting info
   */
  async getVotingInfo(account: string): Promise<VotingInfo> {
    return await this.queries.votingOf(account);
  }

  /**
   * Get referendum info
   * @param refIndex - Referendum index
   * @returns Referendum info
   */
  async getReferendumInfo(refIndex: number): Promise<ReferendumInfo | null> {
    return await this.queries.referendumInfoOf(refIndex);
  }

  /**
   * Get all public proposals
   * @returns Array of proposals
   */
  async getPublicProposals(): Promise<Proposal[]> {
    return await this.queries.publicProps();
  }

  /**
   * Check if account is delegating
   * @param account - Account address
   * @returns True if delegating
   */
  async isDelegating(account: string): Promise<boolean> {
    const votingInfo = await this.queries.votingOf(account);
    return votingInfo.isDelegating;
  }

  /**
   * Get delegation target
   * @param account - Account address
   * @returns Delegation target or null
   */
  async getDelegationTarget(account: string): Promise<string | null> {
    const votingInfo = await this.queries.votingOf(account);
    return votingInfo.isDelegating ? votingInfo.target || null : null;
  }

  /**
   * Estimate fee for propose
   * @param proposalHash - Proposal hash
   * @param value - Deposit value
   * @param fromAddress - Sender address
   * @returns Estimated fee
   */
  async estimateProposeFee(
    proposalHash: string,
    value: bigint,
    fromAddress: string
  ): Promise<bigint> {
    const tx = this.propose({ proposalHash, value });
    const info = await tx.paymentInfo(fromAddress);
    return BigInt(info.partialFee.toString());
  }

  /**
   * Estimate fee for vote
   * @param refIndex - Referendum index
   * @param vote - Vote
   * @param fromAddress - Sender address
   * @returns Estimated fee
   */
  async estimateVoteFee(
    refIndex: number,
    vote: AccountVote,
    fromAddress: string
  ): Promise<bigint> {
    const tx = this.vote({ refIndex, vote });
    const info = await tx.paymentInfo(fromAddress);
    return BigInt(info.partialFee.toString());
  }

  /**
   * Get democracy constants
   * @returns Democracy constants
   */
  async getConstants(): Promise<{
    minimumDeposit: bigint;
    launchPeriod: number;
    votingPeriod: number;
  }> {
    const [minimumDeposit, launchPeriod, votingPeriod] = await Promise.all([
      this.queries.getMinimumDeposit(),
      this.queries.getLaunchPeriod(),
      this.queries.getVotingPeriod(),
    ]);

    return {
      minimumDeposit,
      launchPeriod,
      votingPeriod,
    };
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  /**
   * Subscribe to Proposed events
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  async onProposed(
    callback: (event: { proposalIndex: number; deposit: bigint }) => void
  ): Promise<() => void> {
    const unsub: any = await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (event.section === 'democracy' && event.method === 'Proposed') {
          const [proposalIndex, deposit] = event.data;
          callback({
            proposalIndex: proposalIndex.toNumber(),
            deposit: BigInt(deposit.toString()),
          });
        }
      });
    });
    return unsub;
  }

  /**
   * Subscribe to Started events (referendum started)
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  async onStarted(
    callback: (event: { refIndex: number; threshold: string }) => void
  ): Promise<() => void> {
    const unsub: any = await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (event.section === 'democracy' && event.method === 'Started') {
          const [refIndex, threshold] = event.data;
          callback({
            refIndex: refIndex.toNumber(),
            threshold: threshold.toString(),
          });
        }
      });
    });
    return unsub;
  }

  /**
   * Subscribe to Voted events
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  async onVoted(
    callback: (event: { voter: string; refIndex: number }) => void
  ): Promise<() => void> {
    const unsub: any = await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (event.section === 'democracy' && event.method === 'Voted') {
          const [voter, refIndex] = event.data;
          callback({
            voter: voter.toString(),
            refIndex: refIndex.toNumber(),
          });
        }
      });
    });
    return unsub;
  }
}
