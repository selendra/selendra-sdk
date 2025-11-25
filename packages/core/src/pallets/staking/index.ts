/**
 * Staking Pallet Module
 * 
 * @module pallets/staking
 */

// Export manager and queries
export { StakingManager } from './client.js';
export { StakingQueries } from './queries.js';

// Export all types
export type {
  // Core types
  ValidatorPrefs,
  StakingLedger,
  UnlockChunk,
  ActiveEraInfo,
  EraRewardPoints,
  Exposure,
  IndividualExposure,
  Nominations,
  SlashingSpans,
  StakingInfo,
  
  // Parameter types
  BondParams,
  BondExtraParams,
  UnbondParams,
  WithdrawUnbondedParams,
  NominateParams,
  ValidateParams,
  SetPayeeParams,
  SetControllerParams,
  PayoutStakersParams,
  RebondParams,
  ChillOtherParams,
  ForceUnstakeParams,
  ForceNewEraParams,
  
  // Event types
  BondedEvent,
  UnbondedEvent,
  WithdrawnEvent,
  RewardedEvent,
  SlashedEvent,
  OldSlashingReportDiscardedEvent,
  StakersElectedEvent,
  ChilledEvent,
  PayeeSetEvent,
  
  // Helper types
  PendingRewards,
  EraRewards,
} from './types.js';

// Export enum
export { RewardDestination } from './types.js';
