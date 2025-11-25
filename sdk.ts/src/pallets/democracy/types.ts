/**
 * Democracy Pallet Types
 * 
 * TypeScript type definitions for the Democracy pallet
 */

/**
 * Vote types
 */
export enum VoteType {
  Aye = 'Aye',
  Nay = 'Nay',
}

/**
 * Conviction levels for vote locking
 */
export enum Conviction {
  None = 'None',
  Locked1x = 'Locked1x',
  Locked2x = 'Locked2x',
  Locked3x = 'Locked3x',
  Locked4x = 'Locked4x',
  Locked5x = 'Locked5x',
  Locked6x = 'Locked6x',
}

/**
 * Vote with conviction
 */
export interface AccountVote {
  /** Vote type (Aye/Nay) */
  vote: VoteType;
  /** Conviction level */
  conviction: Conviction;
  /** Balance used for voting */
  balance: bigint;
}

/**
 * Proposal information
 */
export interface Proposal {
  /** Proposal index */
  index: number;
  /** Proposal hash */
  hash: string;
  /** Proposer account */
  proposer: string;
  /** Deposit amount */
  deposit: bigint;
  /** Seconds (supporters) */
  seconds: string[];
}

/**
 * Referendum information
 */
export interface ReferendumInfo {
  /** Referendum index */
  index: number;
  /** Is ongoing */
  ongoing: boolean;
  /** Proposal hash */
  proposalHash?: string;
  /** End block */
  end?: number;
  /** Threshold type */
  threshold?: string;
  /** Delay before enactment */
  delay?: number;
  /** Tally */
  tally?: VoteTally;
}

/**
 * Vote tally
 */
export interface VoteTally {
  /** Aye votes */
  ayes: bigint;
  /** Nay votes */
  nays: bigint;
  /** Turnout */
  turnout: bigint;
}

/**
 * Voting information for an account
 */
export interface VotingInfo {
  /** Is delegating */
  isDelegating: boolean;
  /** Delegate target (if delegating) */
  target?: string;
  /** Conviction (if delegating) */
  conviction?: Conviction;
  /** Balance (if delegating) */
  balance?: bigint;
  /** Direct votes */
  votes?: Map<number, AccountVote>;
  /** Prior lock information */
  prior?: [number, bigint]; // [unlockAt, balance]
}

/**
 * Delegation information
 */
export interface Delegation {
  /** Target account */
  target: string;
  /** Conviction level */
  conviction: Conviction;
  /** Delegated balance */
  balance: bigint;
}

/**
 * Propose parameters
 */
export interface ProposeParams {
  /** Proposal hash */
  proposalHash: string;
  /** Deposit amount */
  value: bigint;
}

/**
 * Second parameters
 */
export interface SecondParams {
  /** Proposal index */
  proposal: number;
}

/**
 * Vote parameters
 */
export interface VoteParams {
  /** Referendum index */
  refIndex: number;
  /** Vote */
  vote: AccountVote;
}

/**
 * Delegate parameters
 */
export interface DelegateParams {
  /** Target account */
  to: string;
  /** Conviction level */
  conviction: Conviction;
  /** Balance to delegate */
  balance: bigint;
}

/**
 * Remove vote parameters
 */
export interface RemoveVoteParams {
  /** Referendum index */
  index: number;
}

/**
 * Democracy events
 */
export interface ProposedEvent {
  proposalIndex: number;
  deposit: bigint;
}

export interface TabledEvent {
  proposalIndex: number;
  deposit: bigint;
}

export interface StartedEvent {
  refIndex: number;
  threshold: string;
}

export interface PassedEvent {
  refIndex: number;
}

export interface NotPassedEvent {
  refIndex: number;
}

export interface CancelledEvent {
  refIndex: number;
}

export interface ExecutedEvent {
  refIndex: number;
  result: boolean;
}

export interface DelegatedEvent {
  who: string;
  target: string;
}

export interface UndelegatedEvent {
  account: string;
}

export interface VotedEvent {
  voter: string;
  refIndex: number;
  vote: AccountVote;
}

/**
 * Active referenda summary
 */
export interface ActiveReferenda {
  /** Total active referenda */
  total: number;
  /** Referenda list */
  referenda: ReferendumInfo[];
}

/**
 * Proposal details
 */
export interface ProposalDetails {
  /** Proposal info */
  proposal: Proposal;
  /** Can be seconded */
  canSecond: boolean;
  /** Required deposit */
  minimumDeposit: bigint;
}
