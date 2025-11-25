/**
 * Technical Committee pallet types
 *
 * The Technical Committee is a collective body that can execute proposals
 * with different voting thresholds than the Council.
 */

/**
 * Proposal hash type (H256)
 */
export type ProposalHash = string;

/**
 * Account identifier type
 */
export type AccountId = string;

/**
 * Block number type
 */
export type BlockNumber = number;

/**
 * Proposal index type
 */
export type ProposalIndex = number;

/**
 * Technical Committee vote structure
 */
export interface TechCommitteeVote {
  /** Proposal index */
  index: ProposalIndex;
  /** Proposal hash */
  proposal: ProposalHash;
  /** Accounts that voted aye */
  ayes: AccountId[];
  /** Accounts that voted nay */
  nays: AccountId[];
  /** Block at which voting ends */
  end: BlockNumber;
}

/**
 * Technical Committee member info
 */
export interface TechCommitteeMember {
  /** Member account */
  account: AccountId;
  /** Whether the member has voted on active proposals */
  hasVoted: boolean;
}

/**
 * Proposal status in Technical Committee
 */
export interface TechCommitteeProposalStatus {
  /** Proposal hash */
  proposalHash: ProposalHash;
  /** Proposal index */
  index: ProposalIndex;
  /** Current vote count */
  ayes: number;
  /** Against vote count */
  nays: number;
  /** Threshold required */
  threshold: number;
  /** Block number when voting ends */
  end: BlockNumber;
  /** Whether threshold is met */
  approved: boolean;
}

/**
 * Technical Committee collective info
 */
export interface TechCommitteeInfo {
  /** Current members */
  members: AccountId[];
  /** Prime member (tie-breaker) */
  prime: AccountId | null;
  /** Active proposals count */
  proposalCount: number;
}

/**
 * Parameters for proposing
 */
export interface TechCommitteeProposalParams {
  /** The call/proposal to execute if approved */
  proposal: unknown;
  /** Vote threshold required for approval */
  threshold: number;
  /** Proposal length bound */
  lengthBound: number;
}

/**
 * Parameters for voting
 */
export interface TechCommitteeVoteParams {
  /** Proposal hash */
  proposal: ProposalHash;
  /** Proposal index */
  index: ProposalIndex;
  /** Vote aye or nay */
  approve: boolean;
}

/**
 * Parameters for closing a proposal
 */
export interface TechCommitteeCloseParams {
  /** Proposal hash */
  proposalHash: ProposalHash;
  /** Proposal index */
  index: ProposalIndex;
  /** Weight bound for proposal execution */
  proposalWeightBound: {
    refTime: bigint;
    proofSize: bigint;
  };
  /** Length bound for proposal */
  lengthBound: number;
}

/**
 * Parameters for setting members
 */
export interface TechCommitteeSetMembersParams {
  /** New member accounts */
  newMembers: AccountId[];
  /** Prime member (optional) */
  prime: AccountId | null;
  /** Old member count for weight calculation */
  oldCount: number;
}
