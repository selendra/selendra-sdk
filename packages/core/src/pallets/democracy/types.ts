/**
 * Democracy Pallet Types
 *
 * Type definitions for the Democracy pallet (pallet-democracy)
 */

/**
 * Conviction level for votes
 * Multiplies voting power but also locks tokens for longer
 */
export enum Conviction {
  /** No conviction, 0.1x voting power, no lockup */
  None = 0,
  /** 1x voting power, 1x lockup period */
  Locked1x = 1,
  /** 2x voting power, 2x lockup period */
  Locked2x = 2,
  /** 3x voting power, 4x lockup period */
  Locked3x = 3,
  /** 4x voting power, 8x lockup period */
  Locked4x = 4,
  /** 5x voting power, 16x lockup period */
  Locked5x = 5,
  /** 6x voting power, 32x lockup period */
  Locked6x = 6,
}

/**
 * Referendum status
 */
export type ReferendumStatus = "Ongoing" | "Finished" | "NotFound";

/**
 * Vote threshold for passing
 */
export type VoteThreshold =
  | "SuperMajorityApprove"
  | "SuperMajorityAgainst"
  | "SimpleMajority";

/**
 * Referendum tally information
 */
export interface Tally {
  /** Total ayes (in balance) */
  ayes: bigint;
  /** Total nays (in balance) */
  nays: bigint;
  /** Total turnout */
  turnout: bigint;
}

/**
 * Referendum information
 */
export interface ReferendumInfo {
  /** Referendum index */
  index: number;
  /** Current status */
  status: ReferendumStatus;
  /** Block when voting ends */
  end?: number;
  /** Proposal hash or bounded call */
  proposalHash?: string;
  /** Vote threshold type */
  threshold?: VoteThreshold;
  /** Block when proposal will be enacted (if passed) */
  delay?: number;
  /** Current vote tally */
  tally?: Tally;
}

/**
 * Ongoing referendum details
 */
export interface OngoingReferendum extends ReferendumInfo {
  status: "Ongoing";
  end: number;
  proposalHash: string;
  threshold: VoteThreshold;
  delay: number;
  tally: Tally;
}

/**
 * Finished referendum details
 */
export interface FinishedReferendum extends ReferendumInfo {
  status: "Finished";
  /** Whether the referendum passed */
  approved: boolean;
  /** Block when referendum ended */
  end: number;
}

/**
 * Public proposal information
 */
export interface ProposalInfo {
  /** Proposal index */
  index: number;
  /** Proposal hash */
  proposalHash: string;
  /** Account that proposed */
  proposer: string;
  /** Deposit amount */
  deposit: bigint;
  /** Accounts that have seconded */
  seconds: string[];
}

/**
 * Account vote on a referendum
 */
export interface AccountVote {
  /** Standard vote with conviction */
  Standard?: {
    /** Vote direction */
    vote: {
      /** Aye (for) or Nay (against) */
      aye: boolean;
      /** Conviction level */
      conviction: Conviction;
    };
    /** Balance locked for this vote */
    balance: bigint;
  };
  /** Split vote (partial aye and nay) */
  Split?: {
    /** Aye balance */
    aye: bigint;
    /** Nay balance */
    nay: bigint;
  };
}

/**
 * Voting record for an account
 */
export interface VotingInfo {
  /** Direct voting info */
  direct?: {
    /** Active votes: [referendumIndex, AccountVote] */
    votes: Array<[number, AccountVote]>;
    /** Delegations received */
    delegations: {
      votes: bigint;
      capital: bigint;
    };
    /** Prior locked balance info */
    prior: [number, bigint];
  };
  /** Delegating info */
  delegating?: {
    /** Target account */
    target: string;
    /** Conviction */
    conviction: Conviction;
    /** Delegated balance */
    balance: bigint;
    /** Delegations received from others */
    delegations: {
      votes: bigint;
      capital: bigint;
    };
    /** Prior locked balance info */
    prior: [number, bigint];
  };
}

/**
 * Deposit information for a proposal
 */
export interface DepositInfo {
  /** Accounts that have deposited */
  depositors: string[];
  /** Total deposit amount */
  deposit: bigint;
}

// =============================================================================
// Extrinsic Parameters
// =============================================================================

/**
 * Parameters for proposing
 */
export interface ProposeParams {
  /** Proposal hash or bounded call */
  proposal: string | { Lookup: { hash: string; len: number } };
  /** Deposit amount */
  value: bigint;
}

/**
 * Parameters for seconding a proposal
 */
export interface SecondParams {
  /** Proposal index */
  proposal: number;
}

/**
 * Parameters for voting
 */
export interface VoteParams {
  /** Referendum index */
  refIndex: number;
  /** Vote to cast */
  vote: AccountVote;
}

/**
 * Parameters for standard vote (convenience)
 */
export interface StandardVoteParams {
  /** Referendum index */
  refIndex: number;
  /** Vote aye (true) or nay (false) */
  aye: boolean;
  /** Conviction level */
  conviction: Conviction;
  /** Balance to lock */
  balance: bigint;
}

/**
 * Parameters for delegation
 */
export interface DelegateParams {
  /** Account to delegate to */
  to: string;
  /** Conviction level for delegated votes */
  conviction: Conviction;
  /** Balance to delegate */
  balance: bigint;
}

/**
 * Parameters for removing a vote
 */
export interface RemoveVoteParams {
  /** Referendum index */
  index: number;
}

/**
 * Parameters for emergency cancel (council only)
 */
export interface EmergencyCancelParams {
  /** Referendum index to cancel */
  refIndex: number;
}

/**
 * Parameters for external propose (council only)
 */
export interface ExternalProposeParams {
  /** Proposal hash */
  proposal: string | { Lookup: { hash: string; len: number } };
}

/**
 * Parameters for fast track (technical committee)
 */
export interface FastTrackParams {
  /** Proposal hash */
  proposalHash: string;
  /** Voting period in blocks */
  votingPeriod: number;
  /** Delay before enactment */
  delay: number;
}

// =============================================================================
// Events
// =============================================================================

/**
 * Event: Proposal submitted
 */
export interface ProposedEvent {
  /** Proposal index */
  proposalIndex: number;
  /** Deposit amount */
  deposit: bigint;
}

/**
 * Event: Proposal tabled (became referendum)
 */
export interface TabledEvent {
  /** Proposal index */
  proposalIndex: number;
  /** Deposit amount */
  deposit: bigint;
}

/**
 * Event: Referendum started
 */
export interface StartedEvent {
  /** Referendum index */
  refIndex: number;
  /** Vote threshold */
  threshold: VoteThreshold;
}

/**
 * Event: Referendum passed
 */
export interface PassedEvent {
  /** Referendum index */
  refIndex: number;
}

/**
 * Event: Referendum not passed
 */
export interface NotPassedEvent {
  /** Referendum index */
  refIndex: number;
}

/**
 * Event: Referendum cancelled
 */
export interface CancelledEvent {
  /** Referendum index */
  refIndex: number;
}

/**
 * Event: Vote cast
 */
export interface VotedEvent {
  /** Voter account */
  voter: string;
  /** Referendum index */
  refIndex: number;
  /** Vote cast */
  vote: AccountVote;
}

/**
 * Event: Vote delegated
 */
export interface DelegatedEvent {
  /** Account delegating */
  who: string;
  /** Target account */
  target: string;
}

/**
 * Event: Delegation removed
 */
export interface UndelegatedEvent {
  /** Account that undelegated */
  account: string;
}

/**
 * Democracy pallet constants
 */
export interface DemocracyConstants {
  /** Minimum deposit for a proposal */
  minimumDeposit: bigint;
  /** Period between proposal table and referendum */
  launchPeriod: number;
  /** How long a referendum runs */
  votingPeriod: number;
  /** Delay after passing before enactment */
  enactmentPeriod: number;
  /** How long votes are locked after referendum */
  voteLockingPeriod: number;
  /** Cooloff period after referendum for same proposal */
  cooloffPeriod: number;
  /** Maximum proposals that can be in queue */
  maxProposals: number;
}
