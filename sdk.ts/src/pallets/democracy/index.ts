/**
 * Democracy Pallet
 * 
 * Public exports for the Democracy pallet module
 */

export { DemocracyManager } from './client.js';
export { DemocracyQueries } from './queries.js';

export { VoteType, Conviction } from './types.js';

export type {
  AccountVote,
  Proposal,
  ReferendumInfo,
  VoteTally,
  VotingInfo,
  Delegation,
  ProposeParams,
  SecondParams,
  VoteParams,
  DelegateParams,
  RemoveVoteParams,
  ProposedEvent,
  TabledEvent,
  StartedEvent,
  PassedEvent,
  NotPassedEvent,
  CancelledEvent,
  ExecutedEvent,
  DelegatedEvent,
  UndelegatedEvent,
  VotedEvent,
  ActiveReferenda,
  ProposalDetails,
} from './types.js';
