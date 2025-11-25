/**
 * Staking Pallet Types
 * 
 * Type definitions for the Staking pallet
 */

import type { AccountId } from '@polkadot/types/interfaces';

/**
 * Reward destination options
 */
export enum RewardDestination {
  /** Rewards go to stash account */
  Staked = 'Staked',
  /** Rewards go to stash account (deprecated, same as Staked) */
  Stash = 'Stash',
  /** Rewards go to controller account (deprecated) */
  Controller = 'Controller',
  /** Rewards go to specified account */
  Account = 'Account',
  /** Rewards are not paid out */
  None = 'None',
}

/**
 * Validator commission and preferences
 */
export interface ValidatorPrefs {
  /** Commission percentage (0-100) */
  commission: bigint;
  /** Whether validator is accepting nominations */
  blocked: boolean;
}

/**
 * Staking ledger information
 */
export interface StakingLedger {
  /** Stash account */
  stash: string;
  /** Total bonded amount */
  total: bigint;
  /** Active bonded amount */
  active: bigint;
  /** Unlocking chunks */
  unlocking: UnlockChunk[];
  /** Claimed rewards eras */
  claimedRewards: number[];
}

/**
 * Unlocking chunk
 */
export interface UnlockChunk {
  /** Amount being unlocked */
  value: bigint;
  /** Era when unlock completes */
  era: number;
}

/**
 * Active era information
 */
export interface ActiveEraInfo {
  /** Era index */
  index: number;
  /** Era start time (session start) */
  start: bigint | null;
}

/**
 * Era reward points
 */
export interface EraRewardPoints {
  /** Total points for the era */
  total: bigint;
  /** Individual validator points */
  individual: Map<string, bigint>;
}

/**
 * Exposure of a validator
 */
export interface Exposure {
  /** Total stake (own + nominations) */
  total: bigint;
  /** Validator's own stake */
  own: bigint;
  /** List of nominators */
  others: IndividualExposure[];
}

/**
 * Individual nominator exposure
 */
export interface IndividualExposure {
  /** Nominator account */
  who: string;
  /** Nominator's stake on this validator */
  value: bigint;
}

/**
 * Nominator information
 */
export interface Nominations {
  /** List of nominated validators */
  targets: string[];
  /** Era when nomination was submitted */
  submittedIn: number;
  /** Whether nominations are suppressed */
  suppressed: boolean;
}

/**
 * Slashing spans
 */
export interface SlashingSpans {
  /** Span index */
  spanIndex: number;
  /** Last slashed era */
  lastStart: number;
  /** Last non-zero slash era */
  lastNonzeroSlash: number;
  /** Prior slashing eras */
  prior: number[];
}

/**
 * Complete staking information
 */
export interface StakingInfo {
  /** Controller account (deprecated in newer versions) */
  controller?: string;
  /** Staking ledger */
  ledger: StakingLedger | null;
  /** Validator preferences (if validating) */
  validatorPrefs: ValidatorPrefs | null;
  /** Nominations (if nominating) */
  nominations: Nominations | null;
  /** Reward destination */
  payee: RewardDestination | string;
  /** Whether account is bonded */
  isBonded: boolean;
  /** Whether account is validating */
  isValidating: boolean;
  /** Whether account is nominating */
  isNominating: boolean;
}

/**
 * Bond parameters
 */
export interface BondParams {
  /** Controller account (deprecated, use same as stash in newer versions) */
  controller: string;
  /** Amount to bond */
  value: bigint;
  /** Reward destination */
  payee: RewardDestination | { Account: string };
}

/**
 * Bond extra parameters
 */
export interface BondExtraParams {
  /** Maximum additional amount to bond */
  maxAdditional: bigint;
}

/**
 * Unbond parameters
 */
export interface UnbondParams {
  /** Amount to unbond */
  value: bigint;
}

/**
 * Withdraw unbonded parameters
 */
export interface WithdrawUnbondedParams {
  /** Number of slashing spans */
  numSlashingSpans: number;
}

/**
 * Nominate parameters
 */
export interface NominateParams {
  /** List of validator addresses to nominate */
  targets: string[];
}

/**
 * Validate parameters
 */
export interface ValidateParams {
  /** Validator preferences */
  prefs: ValidatorPrefs;
}

/**
 * Set payee parameters
 */
export interface SetPayeeParams {
  /** New reward destination */
  payee: RewardDestination | { Account: string };
}

/**
 * Set controller parameters (deprecated)
 */
export interface SetControllerParams {
  /** New controller account */
  controller: string;
}

/**
 * Payout stakers parameters
 */
export interface PayoutStakersParams {
  /** Validator stash account */
  validatorStash: string;
  /** Era to payout */
  era: number;
}

/**
 * Rebond parameters
 */
export interface RebondParams {
  /** Amount to rebond from unbonding */
  value: bigint;
}

/**
 * Chill other parameters
 */
export interface ChillOtherParams {
  /** Controller account to chill */
  controller: string;
}

/**
 * Force unstake parameters (sudo)
 */
export interface ForceUnstakeParams {
  /** Stash account to unstake */
  stash: string;
  /** Number of slashing spans */
  numSlashingSpans: number;
}

/**
 * Force new era parameters (sudo)
 */
export interface ForceNewEraParams {
  // No parameters
}

/**
 * Staking event: Bonded
 */
export interface BondedEvent {
  /** Account that bonded */
  stash: string;
  /** Amount bonded */
  amount: bigint;
}

/**
 * Staking event: Unbonded
 */
export interface UnbondedEvent {
  /** Account that unbonded */
  stash: string;
  /** Amount unbonded */
  amount: bigint;
}

/**
 * Staking event: Withdrawn
 */
export interface WithdrawnEvent {
  /** Account that withdrew */
  stash: string;
  /** Amount withdrawn */
  amount: bigint;
}

/**
 * Staking event: Rewarded
 */
export interface RewardedEvent {
  /** Account that received reward */
  stash: string;
  /** Reward amount */
  amount: bigint;
}

/**
 * Staking event: Slashed
 */
export interface SlashedEvent {
  /** Account that was slashed */
  validator: string;
  /** Slash amount */
  amount: bigint;
}

/**
 * Staking event: Old slashing report discarded
 */
export interface OldSlashingReportDiscardedEvent {
  /** Session index */
  sessionIndex: number;
}

/**
 * Staking event: Stakers elected
 */
export interface StakersElectedEvent {
  // No data
}

/**
 * Staking event: Chilled
 */
export interface ChilledEvent {
  /** Account that was chilled */
  stash: string;
}

/**
 * Staking event: Payee set
 */
export interface PayeeSetEvent {
  /** Stash account */
  stash: string;
  /** New payee */
  payee: RewardDestination | string;
}

/**
 * Pending rewards calculation
 */
export interface PendingRewards {
  /** Total pending rewards */
  total: bigint;
  /** Eras with pending rewards */
  eras: EraRewards[];
}

/**
 * Era rewards breakdown
 */
export interface EraRewards {
  /** Era index */
  era: number;
  /** Reward amount for this era */
  amount: bigint;
}
