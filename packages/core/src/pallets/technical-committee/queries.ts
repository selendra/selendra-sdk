/**
 * Technical Committee queries
 *
 * Query functions for the Technical Committee collective pallet.
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  ProposalHash,
  AccountId,
  TechCommitteeInfo,
  TechCommitteeProposalStatus,
  TechCommitteeVote,
} from "./types.js";

/**
 * Technical Committee query manager
 */
export class TechCommitteeQueries {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Get the current Technical Committee members
   */
  async members(): Promise<AccountId[]> {
    const members = await this.api.query.technicalCommittee.members();
    return (members.toJSON() as string[]) || [];
  }

  /**
   * Get the prime member (tie-breaker)
   */
  async prime(): Promise<AccountId | null> {
    const prime = await this.api.query.technicalCommittee.prime();
    return prime.isEmpty ? null : (prime.toJSON() as string);
  }

  /**
   * Get the current proposal count
   */
  async proposalCount(): Promise<number> {
    const count = await this.api.query.technicalCommittee.proposalCount();
    return count.toNumber();
  }

  /**
   * Get all active proposal hashes
   */
  async proposals(): Promise<ProposalHash[]> {
    const proposals = await this.api.query.technicalCommittee.proposals();
    return (proposals.toJSON() as string[]) || [];
  }

  /**
   * Get a specific proposal by hash
   */
  async proposalOf(proposalHash: ProposalHash): Promise<unknown | null> {
    const proposal = await this.api.query.technicalCommittee.proposalOf(
      proposalHash
    );
    return proposal.isEmpty ? null : proposal.toJSON();
  }

  /**
   * Get voting status for a proposal
   */
  async voting(proposalHash: ProposalHash): Promise<TechCommitteeVote | null> {
    const voting = await this.api.query.technicalCommittee.voting(proposalHash);

    if (voting.isEmpty) {
      return null;
    }

    const vote = voting.toJSON() as {
      index: number;
      threshold: number;
      ayes: string[];
      nays: string[];
      end: number;
    };

    return {
      index: vote.index,
      proposal: proposalHash,
      ayes: vote.ayes,
      nays: vote.nays,
      end: vote.end,
    };
  }

  /**
   * Check if an account is a member
   */
  async isMember(account: AccountId): Promise<boolean> {
    const members = await this.members();
    return members.includes(account);
  }

  /**
   * Get committee overview
   */
  async getInfo(): Promise<TechCommitteeInfo> {
    const [members, prime, proposalCount] = await Promise.all([
      this.members(),
      this.prime(),
      this.proposalCount(),
    ]);

    return {
      members,
      prime,
      proposalCount,
    };
  }

  /**
   * Get all active proposal statuses
   */
  async getAllProposalStatuses(): Promise<TechCommitteeProposalStatus[]> {
    const proposalHashes = await this.proposals();
    const statuses: TechCommitteeProposalStatus[] = [];

    for (const proposalHash of proposalHashes) {
      const voting = await this.voting(proposalHash);
      if (voting) {
        statuses.push({
          proposalHash,
          index: voting.index,
          ayes: voting.ayes.length,
          nays: voting.nays.length,
          threshold: voting.ayes.length + voting.nays.length, // Simplified
          end: voting.end,
          approved: false, // Would need threshold to calculate
        });
      }
    }

    return statuses;
  }

  /**
   * Check if an account has voted on a proposal
   */
  async hasVoted(
    account: AccountId,
    proposalHash: ProposalHash
  ): Promise<boolean> {
    const voting = await this.voting(proposalHash);
    if (!voting) {
      return false;
    }

    return voting.ayes.includes(account) || voting.nays.includes(account);
  }

  /**
   * Get an account's vote on a proposal
   */
  async getVote(
    account: AccountId,
    proposalHash: ProposalHash
  ): Promise<boolean | null> {
    const voting = await this.voting(proposalHash);
    if (!voting) {
      return null;
    }

    if (voting.ayes.includes(account)) {
      return true;
    }
    if (voting.nays.includes(account)) {
      return false;
    }

    return null;
  }
}
