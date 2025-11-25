/**
 * Council Pallet Types (pallet-collective Instance 1)
 *
 * Type definitions for the Council collective pallet
 */

/**
 * Vote record for a proposal
 */
export interface Votes {
  /** Proposal index */
  index: number;
  /** Vote threshold needed */
  threshold: number;
  /** Accounts that voted aye */
  ayes: string[];
  /** Accounts that voted nay */
  nays: string[];
  /** Block number when voting ends */
  end: number;
}

/**
 * Council proposal information
 */
export interface CouncilProposal {
  /** Proposal hash */
  hash: string;
  /** Proposal index */
  index: number;
  /** Proposer account (if available) */
  proposer?: string;
  /** Vote information */
  votes?: Votes;
  /** Proposal call data (if available) */
  proposal?: any;
}

/**
 * Council member information
 */
export interface CouncilMember {
  /** Member account address */
  address: string;
}

/**
 * Prime member (tie-breaker)
 */
export interface PrimeMember {
  /** Prime member account or null */
  account: string | null;
}

// =============================================================================
// Extrinsic Parameters
// =============================================================================

/**
 * Parameters for proposing to council
 */
export interface CouncilProposeParams {
  /** Vote threshold to pass */
  threshold: number;
  /** Proposal call */
  proposal: any;
  /** Length bound for the proposal */
  lengthBound: number;
}

/**
 * Parameters for voting on council proposal
 */
export interface CouncilVoteParams {
  /** Proposal hash */
  proposal: string;
  /** Proposal index */
  index: number;
  /** Approve (true) or reject (false) */
  approve: boolean;
}

/**
 * Parameters for closing a council proposal
 */
export interface CouncilCloseParams {
  /** Proposal hash */
  proposalHash: string;
  /** Proposal index */
  index: number;
  /** Weight bound for execution */
  proposalWeightBound: {
    refTime: bigint;
    proofSize: bigint;
  };
  /** Length bound */
  lengthBound: number;
}

/**
 * Parameters for disapproving a proposal
 */
export interface CouncilDisapproveParams {
  /** Proposal hash */
  proposalHash: string;
}

/**
 * Parameters for executing a proposal directly
 */
export interface CouncilExecuteParams {
  /** Proposal call */
  proposal: any;
  /** Length bound */
  lengthBound: number;
}

/**
 * Parameters for setting new members
 */
export interface SetMembersParams {
  /** New member list */
  newMembers: string[];
  /** Prime member (tie-breaker) */
  prime: string | null;
  /** Old member count */
  oldCount: number;
}

// =============================================================================
// Events
// =============================================================================

/**
 * Event: Proposal submitted
 */
export interface ProposedEvent {
  /** Account that proposed */
  account: string;
  /** Proposal index */
  proposalIndex: number;
  /** Proposal hash */
  proposalHash: string;
  /** Threshold needed */
  threshold: number;
}

/**
 * Event: Member voted
 */
export interface VotedEvent {
  /** Account that voted */
  account: string;
  /** Proposal hash */
  proposalHash: string;
  /** Vote (aye or nay) */
  voted: boolean;
  /** Current aye count */
  yes: number;
  /** Current nay count */
  no: number;
}

/**
 * Event: Proposal approved
 */
export interface ApprovedEvent {
  /** Proposal hash */
  proposalHash: string;
}

/**
 * Event: Proposal disapproved
 */
export interface DisapprovedEvent {
  /** Proposal hash */
  proposalHash: string;
}

/**
 * Event: Proposal executed
 */
export interface ExecutedEvent {
  /** Proposal hash */
  proposalHash: string;
  /** Execution result */
  result: { ok: boolean; error?: string };
}

/**
 * Event: Proposal closed
 */
export interface ClosedEvent {
  /** Proposal hash */
  proposalHash: string;
  /** Aye votes */
  yes: number;
  /** Nay votes */
  no: number;
}

/**
 * Event: Members changed
 */
export interface MemberExecutedEvent {
  /** Proposal hash */
  proposalHash: string;
  /** Execution result */
  result: { ok: boolean; error?: string };
}

/**
 * Council pallet constants
 */
export interface CouncilConstants {
  /** Maximum number of proposals */
  maxProposals: number;
  /** Maximum number of members */
  maxMembers: number;
}
