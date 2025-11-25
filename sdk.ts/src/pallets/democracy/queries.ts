/**
 * Democracy Pallet Queries
 * 
 * Storage queries for the Democracy pallet
 */

import type { ApiPromise } from '@polkadot/api';
import type { 
  Proposal, 
  ReferendumInfo, 
  VotingInfo,
  VoteTally,
  AccountVote 
} from './types';
import { Conviction, VoteType } from './types';

/**
 * Democracy storage queries
 */
export class DemocracyQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get public proposals
   * @returns Array of proposals
   */
  async publicProps(): Promise<Proposal[]> {
    const result: any = await this.api.query.democracy.publicProps();
    
    return result.map((item: any) => {
      const [index, hash, proposer] = item;
      return {
        index: index.toNumber(),
        hash: hash.toHex(),
        proposer: proposer.toString(),
        deposit: BigInt(0), // Need to query separately
        seconds: [],
      };
    });
  }

  /**
   * Get referendum count
   * @returns Total referendum count
   */
  async referendumCount(): Promise<number> {
    const result: any = await this.api.query.democracy.referendumCount();
    return result.toNumber();
  }

  /**
   * Get referendum info
   * @param index - Referendum index
   * @returns Referendum info or null
   */
  async referendumInfoOf(index: number): Promise<ReferendumInfo | null> {
    const result: any = await this.api.query.democracy.referendumInfoOf(index);
    
    if (result.isNone) {
      return null;
    }

    const info = result.unwrap();
    
    if (info.isOngoing) {
      const ongoing = info.asOngoing;
      return {
        index,
        ongoing: true,
        proposalHash: ongoing.proposalHash.toHex(),
        end: ongoing.end.toNumber(),
        threshold: ongoing.threshold.toString(),
        delay: ongoing.delay.toNumber(),
        tally: {
          ayes: BigInt(ongoing.tally.ayes.toString()),
          nays: BigInt(ongoing.tally.nays.toString()),
          turnout: BigInt(ongoing.tally.turnout.toString()),
        },
      };
    } else {
      return {
        index,
        ongoing: false,
      };
    }
  }

  /**
   * Get voting info for an account
   * @param account - Account address
   * @returns Voting info
   */
  async votingOf(account: string): Promise<VotingInfo> {
    const result: any = await this.api.query.democracy.votingOf(account);
    
    if (result.isDelegating) {
      const delegating = result.asDelegating;
      return {
        isDelegating: true,
        target: delegating.target.toString(),
        conviction: this.parseConviction(delegating.conviction),
        balance: BigInt(delegating.balance.toString()),
        prior: delegating.prior 
          ? [delegating.prior[0].toNumber(), BigInt(delegating.prior[1].toString())]
          : undefined,
      };
    } else {
      const direct = result.asDirect;
      const votes = new Map<number, AccountVote>();
      
      direct.votes.forEach((vote: any) => {
        const [refIndex, accountVote] = vote;
        votes.set(refIndex.toNumber(), this.parseAccountVote(accountVote));
      });

      return {
        isDelegating: false,
        votes,
        prior: direct.prior 
          ? [direct.prior[0].toNumber(), BigInt(direct.prior[1].toString())]
          : undefined,
      };
    }
  }

  /**
   * Get proposal deposit
   * @param proposalIndex - Proposal index
   * @returns Deposit info or null
   */
  async depositOf(proposalIndex: number): Promise<{ depositors: string[]; deposit: bigint } | null> {
    const result: any = await this.api.query.democracy.depositOf(proposalIndex);
    
    if (result.isNone) {
      return null;
    }

    const [depositors, deposit] = result.unwrap();
    return {
      depositors: depositors.map((d: any) => d.toString()),
      deposit: BigInt(deposit.toString()),
    };
  }

  /**
   * Get all active referenda
   * @returns Array of active referenda
   */
  async getActiveReferenda(): Promise<ReferendumInfo[]> {
    const count = await this.referendumCount();
    const referenda: ReferendumInfo[] = [];

    for (let i = 0; i < count; i++) {
      const info = await this.referendumInfoOf(i);
      if (info && info.ongoing) {
        referenda.push(info);
      }
    }

    return referenda;
  }

  /**
   * Get voting power with conviction
   * @param balance - Balance
   * @param conviction - Conviction level
   * @returns Voting power
   */
  getVotingPower(balance: bigint, conviction: Conviction): bigint {
    const multipliers: Record<Conviction, number> = {
      [Conviction.None]: 1,
      [Conviction.Locked1x]: 1,
      [Conviction.Locked2x]: 2,
      [Conviction.Locked3x]: 3,
      [Conviction.Locked4x]: 4,
      [Conviction.Locked5x]: 5,
      [Conviction.Locked6x]: 6,
    };

    return balance * BigInt(multipliers[conviction] || 1);
  }

  /**
   * Parse conviction from chain data
   */
  private parseConviction(conviction: any): Conviction {
    const convictionStr = conviction.toString();
    return (Conviction as any)[convictionStr] || Conviction.None;
  }

  /**
   * Parse account vote from chain data
   */
  private parseAccountVote(vote: any): AccountVote {
    const isAye = vote.isStandard ? vote.asStandard.vote.isAye : false;
    const balance = vote.isStandard 
      ? BigInt(vote.asStandard.balance.toString())
      : BigInt(0);
    const conviction = vote.isStandard
      ? this.parseConviction(vote.asStandard.vote.conviction)
      : Conviction.None;

    return {
      vote: isAye ? VoteType.Aye : VoteType.Nay,
      conviction,
      balance,
    };
  }

  /**
   * Get minimum deposit for proposals
   * @returns Minimum deposit
   */
  async getMinimumDeposit(): Promise<bigint> {
    const consts = this.api.consts.democracy;
    if (consts.minimumDeposit) {
      return BigInt(consts.minimumDeposit.toString());
    }
    return BigInt(0);
  }

  /**
   * Get launch period
   * @returns Launch period in blocks
   */
  async getLaunchPeriod(): Promise<number> {
    const consts = this.api.consts.democracy;
    if (consts.launchPeriod) {
      return (consts.launchPeriod as any).toNumber();
    }
    return 0;
  }

  /**
   * Get voting period
   * @returns Voting period in blocks
   */
  async getVotingPeriod(): Promise<number> {
    const consts = this.api.consts.democracy;
    if (consts.votingPeriod) {
      return (consts.votingPeriod as any).toNumber();
    }
    return 0;
  }
}
