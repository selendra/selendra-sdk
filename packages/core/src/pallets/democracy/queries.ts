/**
 * Democracy Pallet Storage Queries
 *
 * Query functions for the Democracy pallet storage
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  ReferendumInfo,
  ProposalInfo,
  VotingInfo,
  DepositInfo,
  DemocracyConstants,
  Conviction,
  VoteThreshold,
} from "./types.js";

/**
 * Helper to safely convert codec to number
 */
function codecToNumber(codec: any): number {
  if (codec?.toNumber) return codec.toNumber();
  if (codec?.toString) return Number(codec.toString());
  return 0;
}

/**
 * Helper to safely convert codec to bigint
 */
function codecToBigInt(codec: any): bigint {
  if (codec?.toBigInt) return codec.toBigInt();
  if (codec?.toString) return BigInt(codec.toString());
  return 0n;
}

/**
 * Parse vote threshold from codec
 */
function parseThreshold(threshold: any): VoteThreshold {
  if (threshold?.isSuperMajorityApprove) return "SuperMajorityApprove";
  if (threshold?.isSuperMajorityAgainst) return "SuperMajorityAgainst";
  if (threshold?.isSimpleMajority) return "SimpleMajority";
  return "SimpleMajority";
}

/**
 * Democracy storage queries
 */
export class DemocracyQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get referendum count (total number created)
   * @returns Total referendum count
   */
  async referendumCount(): Promise<number> {
    const count = await this.api.query.democracy.referendumCount();
    return codecToNumber(count);
  }

  /**
   * Get referendum information by index
   * @param refIndex - Referendum index
   * @returns Referendum info or null if not found
   */
  async referendumInfoOf(refIndex: number): Promise<ReferendumInfo | null> {
    const info: any = await this.api.query.democracy.referendumInfoOf(refIndex);

    if (info.isNone) {
      return null;
    }

    const data = info.unwrap();

    if (data.isOngoing) {
      const ongoing = data.asOngoing;
      return {
        index: refIndex,
        status: "Ongoing",
        end: codecToNumber(ongoing.end),
        proposalHash:
          ongoing.proposal?.hash?.toString() ||
          ongoing.proposalHash?.toString() ||
          "",
        threshold: parseThreshold(ongoing.threshold),
        delay: codecToNumber(ongoing.delay),
        tally: {
          ayes: codecToBigInt(ongoing.tally?.ayes),
          nays: codecToBigInt(ongoing.tally?.nays),
          turnout: codecToBigInt(
            ongoing.tally?.turnout || ongoing.tally?.support
          ),
        },
      };
    }

    if (data.isFinished) {
      const finished = data.asFinished;
      return {
        index: refIndex,
        status: "Finished",
        end: codecToNumber(finished.end),
      };
    }

    return {
      index: refIndex,
      status: "NotFound",
    };
  }

  /**
   * Get all active (ongoing) referenda
   * @returns Array of ongoing referenda
   */
  async getActiveReferenda(): Promise<ReferendumInfo[]> {
    const count = await this.referendumCount();
    const active: ReferendumInfo[] = [];

    for (let i = 0; i < count; i++) {
      const info = await this.referendumInfoOf(i);
      if (info && info.status === "Ongoing") {
        active.push(info);
      }
    }

    return active;
  }

  /**
   * Get public proposals
   * @returns Array of public proposals
   */
  async publicProps(): Promise<ProposalInfo[]> {
    const props: any = await this.api.query.democracy.publicProps();

    return props.map((prop: any) => {
      const [index, proposal, proposer] = prop;
      return {
        index: codecToNumber(index),
        proposalHash: proposal?.hash?.toString() || proposal?.toString() || "",
        proposer: proposer.toString(),
        deposit: 0n, // Need to query depositOf separately
        seconds: [],
      };
    });
  }

  /**
   * Get deposit information for a proposal
   * @param propIndex - Proposal index
   * @returns Deposit info or null
   */
  async depositOf(propIndex: number): Promise<DepositInfo | null> {
    const deposit: any = await this.api.query.democracy.depositOf(propIndex);

    if (deposit.isNone) {
      return null;
    }

    const [depositors, amount] = deposit.unwrap();
    return {
      depositors: depositors.map((d: any) => d.toString()),
      deposit: codecToBigInt(amount),
    };
  }

  /**
   * Get voting information for an account
   * @param account - Account address
   * @returns Voting info
   */
  async votingOf(account: string): Promise<VotingInfo> {
    const voting: any = await this.api.query.democracy.votingOf(account);

    if (voting.isDirect) {
      const direct = voting.asDirect;
      return {
        direct: {
          votes: direct.votes.map((v: any) => {
            const [refIndex, vote] = v;
            return [codecToNumber(refIndex), this.parseAccountVote(vote)];
          }),
          delegations: {
            votes: codecToBigInt(direct.delegations?.votes),
            capital: codecToBigInt(direct.delegations?.capital),
          },
          prior: [
            codecToNumber(direct.prior?.[0]),
            codecToBigInt(direct.prior?.[1]),
          ],
        },
      };
    }

    if (voting.isDelegating) {
      const delegating = voting.asDelegating;
      return {
        delegating: {
          target: delegating.target.toString(),
          conviction: codecToNumber(delegating.conviction) as Conviction,
          balance: codecToBigInt(delegating.balance),
          delegations: {
            votes: codecToBigInt(delegating.delegations?.votes),
            capital: codecToBigInt(delegating.delegations?.capital),
          },
          prior: [
            codecToNumber(delegating.prior?.[0]),
            codecToBigInt(delegating.prior?.[1]),
          ],
        },
      };
    }

    return {
      direct: {
        votes: [],
        delegations: { votes: 0n, capital: 0n },
        prior: [0, 0n],
      },
    };
  }

  /**
   * Get lowest unbaked referendum index
   * @returns Lowest unbaked index
   */
  async lowestUnbaked(): Promise<number> {
    const lowest = await this.api.query.democracy.lowestUnbaked();
    return codecToNumber(lowest);
  }

  /**
   * Get next external proposal (from council)
   * @returns External proposal hash or null
   */
  async nextExternal(): Promise<{
    proposalHash: string;
    threshold: VoteThreshold;
  } | null> {
    const next: any = await this.api.query.democracy.nextExternal();

    if (next.isNone) {
      return null;
    }

    const [proposal, threshold] = next.unwrap();
    return {
      proposalHash: proposal?.hash?.toString() || proposal?.toString() || "",
      threshold: parseThreshold(threshold),
    };
  }

  /**
   * Get blacklisted proposals
   * @param proposalHash - Proposal hash
   * @returns Blacklist info or null
   */
  async blacklist(
    proposalHash: string
  ): Promise<{ blockNumber: number; accounts: string[] } | null> {
    const blacklist: any = await this.api.query.democracy.blacklist(
      proposalHash
    );

    if (blacklist.isNone) {
      return null;
    }

    const [blockNumber, accounts] = blacklist.unwrap();
    return {
      blockNumber: codecToNumber(blockNumber),
      accounts: accounts.map((a: any) => a.toString()),
    };
  }

  /**
   * Check if proposal has been cancelled
   * @param refIndex - Referendum index
   * @returns True if cancelled
   */
  async cancellations(proposalHash: string): Promise<boolean> {
    const cancelled = await this.api.query.democracy.cancellations(
      proposalHash
    );
    return cancelled.isTrue || cancelled.toString() === "true";
  }

  /**
   * Get democracy constants
   * @returns Democracy pallet constants
   */
  getConstants(): DemocracyConstants {
    const consts = this.api.consts.democracy;

    return {
      minimumDeposit: codecToBigInt(consts.minimumDeposit),
      launchPeriod: codecToNumber(consts.launchPeriod),
      votingPeriod: codecToNumber(consts.votingPeriod),
      enactmentPeriod: codecToNumber(consts.enactmentPeriod),
      voteLockingPeriod: codecToNumber(consts.voteLockingPeriod),
      cooloffPeriod: codecToNumber(consts.cooloffPeriod),
      maxProposals: codecToNumber(consts.maxProposals),
    };
  }

  /**
   * Parse account vote from codec
   */
  private parseAccountVote(vote: any): any {
    if (vote.isStandard) {
      const standard = vote.asStandard;
      return {
        Standard: {
          vote: {
            aye: standard.vote.isAye,
            conviction: codecToNumber(standard.vote.conviction),
          },
          balance: codecToBigInt(standard.balance),
        },
      };
    }

    if (vote.isSplit) {
      const split = vote.asSplit;
      return {
        Split: {
          aye: codecToBigInt(split.aye),
          nay: codecToBigInt(split.nay),
        },
      };
    }

    return {};
  }
}
