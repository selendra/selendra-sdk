/**
 * Council Pallet Storage Queries (pallet-collective Instance 1)
 *
 * Query functions for the Council collective pallet storage
 */

import type { ApiPromise } from "@polkadot/api";
import type { Votes, CouncilProposal, CouncilConstants } from "./types.js";

/**
 * Helper to safely convert codec to number
 */
function codecToNumber(codec: any): number {
  if (codec?.toNumber) return codec.toNumber();
  if (codec?.toString) return Number(codec.toString());
  return 0;
}

/**
 * Council storage queries
 */
export class CouncilQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get all council members
   * @returns Array of member addresses
   */
  async members(): Promise<string[]> {
    const members: any = await this.api.query.council.members();
    return members.map((m: any) => m.toString());
  }

  /**
   * Get prime member (tie-breaker)
   * @returns Prime member address or null
   */
  async prime(): Promise<string | null> {
    const prime: any = await this.api.query.council.prime();
    return prime.isSome ? prime.unwrap().toString() : null;
  }

  /**
   * Get all active proposal hashes
   * @returns Array of proposal hashes
   */
  async proposals(): Promise<string[]> {
    const proposals: any = await this.api.query.council.proposals();
    return proposals.map((p: any) => p.toString());
  }

  /**
   * Get proposal count
   * @returns Number of proposals
   */
  async proposalCount(): Promise<number> {
    const count = await this.api.query.council.proposalCount();
    return codecToNumber(count);
  }

  /**
   * Get proposal by hash
   * @param hash - Proposal hash
   * @returns Proposal call data or null
   */
  async proposalOf(hash: string): Promise<any | null> {
    const proposal: any = await this.api.query.council.proposalOf(hash);
    return proposal.isSome ? proposal.unwrap().toJSON() : null;
  }

  /**
   * Get voting information for a proposal
   * @param hash - Proposal hash
   * @returns Votes or null
   */
  async voting(hash: string): Promise<Votes | null> {
    const voting: any = await this.api.query.council.voting(hash);

    if (voting.isNone) {
      return null;
    }

    const votes = voting.unwrap();
    return {
      index: codecToNumber(votes.index),
      threshold: codecToNumber(votes.threshold),
      ayes: votes.ayes.map((a: any) => a.toString()),
      nays: votes.nays.map((n: any) => n.toString()),
      end: codecToNumber(votes.end),
    };
  }

  /**
   * Get all proposals with their voting info
   * @returns Array of proposals with votes
   */
  async getProposalsWithVotes(): Promise<CouncilProposal[]> {
    const hashes = await this.proposals();
    const proposals: CouncilProposal[] = [];

    for (let i = 0; i < hashes.length; i++) {
      const hash = hashes[i];
      const [proposal, votes] = await Promise.all([
        this.proposalOf(hash),
        this.voting(hash),
      ]);

      proposals.push({
        hash,
        index: votes?.index ?? i,
        votes: votes ?? undefined,
        proposal,
      });
    }

    return proposals;
  }

  /**
   * Check if an account is a council member
   * @param account - Account address
   * @returns True if member
   */
  async isMember(account: string): Promise<boolean> {
    const members = await this.members();
    return members.includes(account);
  }

  /**
   * Get council constants
   * @returns Council constants
   */
  getConstants(): CouncilConstants {
    return {
      maxProposals: codecToNumber(this.api.consts.council?.maxProposals),
      maxMembers: codecToNumber(this.api.consts.council?.maxMembers),
    };
  }
}
