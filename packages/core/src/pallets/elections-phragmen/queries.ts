/**
 * Elections Phragmen Pallet Storage Queries
 *
 * Query functions for the Council Elections pallet storage
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  SeatHolder,
  Voter,
  Candidate,
  ElectionsConstants,
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
 * Elections phragmen storage queries
 *
 * Note: This pallet is typically aliased as "phragmenElection" or "electionsPhragmen"
 * in the runtime. Selendra uses "councilElections" or similar.
 */
export class ElectionsPhragmenQueries {
  private palletName: string;

  constructor(private api: ApiPromise) {
    // Detect the correct pallet name
    this.palletName = this.detectPalletName();
  }

  /**
   * Detect the pallet name used in the runtime
   */
  private detectPalletName(): string {
    if (this.api.query.councilElections) return "councilElections";
    if (this.api.query.phragmenElection) return "phragmenElection";
    if (this.api.query.electionsPhragmen) return "electionsPhragmen";
    if (this.api.query.elections) return "elections";
    return "councilElections";
  }

  /**
   * Get the pallet query interface
   */
  private get pallet(): any {
    return (this.api.query as any)[this.palletName];
  }

  /**
   * Get the pallet constants interface
   */
  private get consts(): any {
    return (this.api.consts as any)[this.palletName];
  }

  /**
   * Get current elected members
   * @returns Array of seat holders
   */
  async members(): Promise<SeatHolder[]> {
    const members: any = await this.pallet.members();

    return members.map((m: any) => ({
      who: m.who.toString(),
      stake: codecToBigInt(m.stake),
      deposit: codecToBigInt(m.deposit),
    }));
  }

  /**
   * Get runners-up (next in line if member leaves)
   * @returns Array of seat holders
   */
  async runnersUp(): Promise<SeatHolder[]> {
    const runnersUp: any = await this.pallet.runnersUp();

    return runnersUp.map((r: any) => ({
      who: r.who.toString(),
      stake: codecToBigInt(r.stake),
      deposit: codecToBigInt(r.deposit),
    }));
  }

  /**
   * Get current candidates
   * @returns Array of candidates
   */
  async candidates(): Promise<Candidate[]> {
    const candidates: any = await this.pallet.candidates();

    return candidates.map((c: any) => {
      // Handle both tuple and struct formats
      if (Array.isArray(c) || c.length !== undefined) {
        return {
          who: c[0].toString(),
          deposit: codecToBigInt(c[1]),
        };
      }
      return {
        who: c.who?.toString() || c.toString(),
        deposit: codecToBigInt(c.deposit),
      };
    });
  }

  /**
   * Get election round count
   * @returns Number of election rounds
   */
  async electionRounds(): Promise<number> {
    const rounds = await this.pallet.electionRounds();
    return codecToNumber(rounds);
  }

  /**
   * Get voting information for an account
   * @param account - Account address
   * @returns Voter info or null
   */
  async voting(account: string): Promise<Voter | null> {
    const voting: any = await this.pallet.voting(account);

    // Check if the account has voted
    if (!voting || voting.votes?.length === 0) {
      return null;
    }

    return {
      who: account,
      votes: voting.votes?.map((v: any) => v.toString()) || [],
      stake: codecToBigInt(voting.stake),
      deposit: codecToBigInt(voting.deposit),
    };
  }

  /**
   * Check if an account is a current member
   * @param account - Account address
   * @returns True if member
   */
  async isMember(account: string): Promise<boolean> {
    const members = await this.members();
    return members.some((m) => m.who === account);
  }

  /**
   * Check if an account is a runner-up
   * @param account - Account address
   * @returns True if runner-up
   */
  async isRunnerUp(account: string): Promise<boolean> {
    const runnersUp = await this.runnersUp();
    return runnersUp.some((r) => r.who === account);
  }

  /**
   * Check if an account is a candidate
   * @param account - Account address
   * @returns True if candidate
   */
  async isCandidate(account: string): Promise<boolean> {
    const candidates = await this.candidates();
    return candidates.some((c) => c.who === account);
  }

  /**
   * Get all voters (expensive operation)
   * Note: This iterates through all accounts, use with caution
   */
  async getAllVoters(): Promise<Voter[]> {
    const voters: Voter[] = [];
    const entries: any = await this.pallet.voting.entries();

    for (const [key, voting] of entries) {
      if (voting.votes?.length > 0) {
        voters.push({
          who: key.args[0].toString(),
          votes: voting.votes.map((v: any) => v.toString()),
          stake: codecToBigInt(voting.stake),
          deposit: codecToBigInt(voting.deposit),
        });
      }
    }

    return voters;
  }

  /**
   * Get elections constants
   * @returns Elections constants
   */
  getConstants(): ElectionsConstants {
    return {
      palletId: this.consts?.palletId?.toString() || "",
      candidacyBond: codecToBigInt(this.consts?.candidacyBond),
      votingBondBase: codecToBigInt(this.consts?.votingBondBase),
      votingBondFactor: codecToBigInt(this.consts?.votingBondFactor),
      desiredMembers: codecToNumber(this.consts?.desiredMembers),
      desiredRunnersUp: codecToNumber(this.consts?.desiredRunnersUp),
      termDuration: codecToNumber(this.consts?.termDuration),
      maxVoters: codecToNumber(this.consts?.maxVoters),
      maxVotesPerVoter: codecToNumber(this.consts?.maxVotesPerVoter),
      maxCandidates: codecToNumber(this.consts?.maxCandidates),
    };
  }
}
