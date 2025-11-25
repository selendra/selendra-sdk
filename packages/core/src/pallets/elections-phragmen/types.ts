/**
 * Elections Phragmen Pallet Types
 *
 * Type definitions for the Council Elections pallet (pallet-elections-phragmen)
 */

/**
 * Seat holder information (elected member)
 */
export interface SeatHolder {
  /** Member account address */
  who: string;
  /** Stake backing this member */
  stake: bigint;
  /** Deposit placed */
  deposit: bigint;
}

/**
 * Voter information
 */
export interface Voter {
  /** Voter account address */
  who: string;
  /** Votes cast for candidates */
  votes: string[];
  /** Stake locked for voting */
  stake: bigint;
  /** Deposit amount */
  deposit: bigint;
}

/**
 * Candidate information
 */
export interface Candidate {
  /** Candidate account address */
  who: string;
  /** Deposit placed */
  deposit: bigint;
}

/**
 * Renouncing type
 */
export type Renouncing =
  | { Member: null }
  | { RunnerUp: null }
  | { Candidate: number };

// =============================================================================
// Extrinsic Parameters
// =============================================================================

/**
 * Parameters for voting
 */
export interface VoteParams {
  /** Accounts to vote for (up to max votes) */
  votes: string[];
  /** Amount to lock as stake */
  value: bigint;
}

/**
 * Parameters for removing voter
 */
export interface RemoveVoterParams {
  // No parameters needed - removes caller's vote
}

/**
 * Parameters for submitting candidacy
 */
export interface SubmitCandidacyParams {
  /** Current candidate count (for weight calculation) */
  candidateCount: number;
}

/**
 * Parameters for renouncing candidacy
 */
export interface RenounceCandidacyParams {
  /** What role to renounce */
  renouncing: Renouncing;
}

/**
 * Parameters for removing a member (governance)
 */
export interface RemoveMemberParams {
  /** Member to remove */
  who: string;
  /** Whether to slash their bond */
  slashBond: boolean;
  /** Whether to rerun the election */
  rerunElection: boolean;
}

/**
 * Parameters for cleaning defunct voters (governance)
 */
export interface CleanDefunctVotersParams {
  /** Number of defunct voters to clean */
  numVoters: number;
  /** Number of defunct defenders to clean */
  numDefunct: number;
}

// =============================================================================
// Events
// =============================================================================

/**
 * Event: New term started
 */
export interface NewTermEvent {
  /** New members elected */
  newMembers: Array<{ who: string; stake: bigint }>;
}

/**
 * Event: Election finished with no changes
 */
export interface EmptyTermEvent {
  // No data
}

/**
 * Event: Election failed (not enough candidates)
 */
export interface ElectionErrorEvent {
  // No data
}

/**
 * Event: Member kicked
 */
export interface MemberKickedEvent {
  /** Member that was kicked */
  member: string;
}

/**
 * Event: Someone renounced their candidacy
 */
export interface RenouncedEvent {
  /** Candidate that renounced */
  candidate: string;
}

/**
 * Event: Candidate slashed
 */
export interface CandidateSlashedEvent {
  /** Candidate that was slashed */
  candidate: string;
  /** Amount slashed */
  amount: bigint;
}

/**
 * Event: Seat holder slashed
 */
export interface SeatHolderSlashedEvent {
  /** Seat holder that was slashed */
  seatHolder: string;
  /** Amount slashed */
  amount: bigint;
}

/**
 * Elections phragmen pallet constants
 */
export interface ElectionsConstants {
  /** Pallet ID */
  palletId: string;
  /** How much to deposit for candidacy */
  candidacyBond: bigint;
  /** How much to deposit for voting */
  votingBondBase: bigint;
  /** Additional bond per vote */
  votingBondFactor: bigint;
  /** Number of members to elect */
  desiredMembers: number;
  /** Number of runners-up to keep */
  desiredRunnersUp: number;
  /** Term duration in blocks */
  termDuration: number;
  /** Maximum voters */
  maxVoters: number;
  /** Maximum votes per voter */
  maxVotesPerVoter: number;
  /** Maximum candidates */
  maxCandidates: number;
}
