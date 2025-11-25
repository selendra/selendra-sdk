/**
 * Elections Phragmen Pallet Client
 *
 * Main client for interacting with the Council Elections pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { ElectionsPhragmenQueries } from "./queries.js";
import type {
  VoteParams,
  SubmitCandidacyParams,
  RenounceCandidacyParams,
  RemoveMemberParams,
  CleanDefunctVotersParams,
  SeatHolder,
  Voter,
  Candidate,
  ElectionsConstants,
  Renouncing,
} from "./types.js";

/**
 * Elections Phragmen Manager - Main interface for Council Elections pallet
 *
 * @example
 * ```typescript
 * const elections = new ElectionsPhragmenManager(api);
 *
 * // Get current council members
 * const members = await elections.getMembers();
 *
 * // Vote for candidates
 * const tx = elections.vote({ votes: ['5GrwvaEF...', '5FHneW...'], value: 1000n });
 * await tx.signAndSend(signer);
 *
 * // Submit candidacy
 * const candidacyTx = elections.submitCandidacy({ candidateCount: 10 });
 * await candidacyTx.signAndSend(signer);
 * ```
 */
export class ElectionsPhragmenManager {
  public queries: ElectionsPhragmenQueries;
  private palletName: string;

  constructor(private api: ApiPromise) {
    this.queries = new ElectionsPhragmenQueries(api);
    this.palletName = this.detectPalletName();
  }

  /**
   * Detect the pallet name used in the runtime
   */
  private detectPalletName(): string {
    if (this.api.tx.councilElections) return "councilElections";
    if (this.api.tx.phragmenElection) return "phragmenElection";
    if (this.api.tx.electionsPhragmen) return "electionsPhragmen";
    if (this.api.tx.elections) return "elections";
    return "councilElections";
  }

  /**
   * Get the pallet tx interface
   */
  private get tx(): any {
    return (this.api.tx as any)[this.palletName];
  }

  /**
   * Get the pallet events interface
   */
  private get events(): any {
    return (this.api.events as any)[this.palletName];
  }

  // ============================================================================
  // Extrinsics (Transactions)
  // ============================================================================

  /**
   * Vote for candidates
   * @param params - Vote parameters
   * @returns Submittable extrinsic
   */
  vote(
    params: VoteParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.tx.vote(params.votes, params.value);
  }

  /**
   * Remove caller's vote and unlock stake
   * @returns Submittable extrinsic
   */
  removeVoter(): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.tx.removeVoter();
  }

  /**
   * Submit candidacy for council election
   * @param params - Candidacy parameters
   * @returns Submittable extrinsic
   */
  submitCandidacy(
    params: SubmitCandidacyParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.tx.submitCandidacy(params.candidateCount);
  }

  /**
   * Renounce candidacy/membership
   * @param params - Renounce parameters
   * @returns Submittable extrinsic
   */
  renounceCandidacy(
    params: RenounceCandidacyParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.tx.renounceCandidacy(params.renouncing);
  }

  // ============================================================================
  // Governance Only Extrinsics
  // ============================================================================

  /**
   * Remove a member (governance origin required)
   * @param params - Remove member parameters
   * @returns Submittable extrinsic
   */
  removeMember(
    params: RemoveMemberParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.tx.removeMember(
      params.who,
      params.slashBond,
      params.rerunElection
    );
  }

  /**
   * Clean defunct voters (governance origin required)
   * @param params - Clean defunct parameters
   * @returns Submittable extrinsic
   */
  cleanDefunctVoters(
    params: CleanDefunctVotersParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.tx.cleanDefunctVoters(params.numVoters, params.numDefunct);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get current elected members
   * @returns Array of seat holders
   */
  async getMembers(): Promise<SeatHolder[]> {
    return this.queries.members();
  }

  /**
   * Get runners-up
   * @returns Array of seat holders
   */
  async getRunnersUp(): Promise<SeatHolder[]> {
    return this.queries.runnersUp();
  }

  /**
   * Get current candidates
   * @returns Array of candidates
   */
  async getCandidates(): Promise<Candidate[]> {
    return this.queries.candidates();
  }

  /**
   * Get voting info for an account
   * @param account - Account address
   * @returns Voter info or null
   */
  async getVotingOf(account: string): Promise<Voter | null> {
    return this.queries.voting(account);
  }

  /**
   * Get election round count
   * @returns Number of rounds
   */
  async getElectionRounds(): Promise<number> {
    return this.queries.electionRounds();
  }

  /**
   * Check if account is a member
   * @param account - Account address
   * @returns True if member
   */
  async isMember(account: string): Promise<boolean> {
    return this.queries.isMember(account);
  }

  /**
   * Check if account is a candidate
   * @param account - Account address
   * @returns True if candidate
   */
  async isCandidate(account: string): Promise<boolean> {
    return this.queries.isCandidate(account);
  }

  /**
   * Check if account is a runner-up
   * @param account - Account address
   * @returns True if runner-up
   */
  async isRunnerUp(account: string): Promise<boolean> {
    return this.queries.isRunnerUp(account);
  }

  /**
   * Get elections constants
   * @returns Elections constants
   */
  getConstants(): ElectionsConstants {
    return this.queries.getConstants();
  }

  /**
   * Create renouncing enum for member
   */
  renouncingMember(): Renouncing {
    return { Member: null };
  }

  /**
   * Create renouncing enum for runner-up
   */
  renouncingRunnerUp(): Renouncing {
    return { RunnerUp: null };
  }

  /**
   * Create renouncing enum for candidate
   * @param candidateCount - Current candidate count
   */
  renouncingCandidate(candidateCount: number): Renouncing {
    return { Candidate: candidateCount };
  }

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

  /**
   * Subscribe to NewTerm events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onNewTerm(
    callback: (newMembers: Array<{ who: string; stake: bigint }>) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.events?.NewTerm?.is(event)) {
          const [members] = event.data;
          callback(
            members.map((m: any) => ({
              who: m[0].toString(),
              stake: BigInt(m[1].toString()),
            }))
          );
        }
      });
    }) as any;
  }

  /**
   * Subscribe to EmptyTerm events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onEmptyTerm(callback: () => void): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.events?.EmptyTerm?.is(event)) {
          callback();
        }
      });
    }) as any;
  }

  /**
   * Subscribe to MemberKicked events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onMemberKicked(
    callback: (member: string) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.events?.MemberKicked?.is(event)) {
          const [member] = event.data;
          callback(member.toString());
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Renounced events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onRenounced(
    callback: (candidate: string) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.events?.Renounced?.is(event)) {
          const [candidate] = event.data;
          callback(candidate.toString());
        }
      });
    }) as any;
  }

  /**
   * Subscribe to CandidateSlashed events
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  async onCandidateSlashed(
    callback: (candidate: string, amount: bigint) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.events?.CandidateSlashed?.is(event)) {
          const [candidate, amount] = event.data;
          callback(candidate.toString(), BigInt(amount.toString()));
        }
      });
    }) as any;
  }
}
