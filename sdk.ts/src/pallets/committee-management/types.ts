/**
 * Committee Management Pallet Types
 *
 * Type definitions for Selendra's committee management pallet
 * Handles validator bans, performance tracking, and session/era management
 */

// ==========================================================================
// Ban Types
// ==========================================================================

/**
 * Reason for banning a validator
 */
export type BanReason =
  | { type: "InsufficientProduction"; sessionCount: number }
  | { type: "InsufficientFinalization"; sessionCount: number }
  | { type: "OtherReason"; description: string };

/**
 * Ban reason types enum
 */
export enum BanReasonType {
  /** Validator didn't produce enough blocks */
  InsufficientProduction = "InsufficientProduction",
  /** Validator didn't participate enough in finality */
  InsufficientFinalization = "InsufficientFinalization",
  /** Custom/other reason */
  OtherReason = "OtherReason",
}

/**
 * Ban information for a validator
 */
export interface BanInfo {
  /** Reason for the ban */
  reason: BanReason;
  /** Era index when ban starts */
  start: number;
}

// ==========================================================================
// Ban Configuration Types
// ==========================================================================

/**
 * Production (block production) ban configuration
 */
export interface ProductionBanConfig {
  /** Minimum expected performance ratio (0-100) */
  minimalExpectedPerformance: number;
  /** Number of underperforming sessions before ban */
  underperformedSessionCountThreshold: number;
  /** Delay to clean session counter */
  cleanSessionCounterDelay: number;
  /** Ban duration in eras */
  banPeriod: number;
}

/**
 * Finality ban configuration
 */
export interface FinalityBanConfig {
  /** Minimum expected performance (rounds count) */
  minimalExpectedPerformance: number;
  /** Number of underperforming sessions before ban */
  underperformedSessionCountThreshold: number;
  /** Ban duration in eras */
  banPeriod: number;
  /** Delay to clean session counter */
  cleanSessionCounterDelay: number;
}

// ==========================================================================
// Session Validators Types
// ==========================================================================

/**
 * Session validators structure
 */
export interface SessionValidators {
  /** Block producers for the session */
  producers: string[];
  /** Finality committee members */
  finalizers: string[];
  /** Non-committee validators (standby) */
  nonCommittee: string[];
}

/**
 * Current and next session validators
 */
export interface CurrentAndNextSessionValidators {
  /** Current session validators */
  current: SessionValidators;
  /** Next session validators */
  next: SessionValidators;
}

// ==========================================================================
// Performance Tracking Types
// ==========================================================================

/**
 * Validator block count in session
 */
export interface ValidatorBlockCount {
  /** Validator account */
  accountId: string;
  /** Number of blocks produced */
  blockCount: number;
}

/**
 * Validator performance info
 */
export interface ValidatorPerformance {
  /** Validator account */
  accountId: string;
  /** Blocks produced this session */
  blocksProduced: number;
  /** Expected blocks */
  expectedBlocks: number;
  /** Performance ratio (0-1) */
  performanceRatio: number;
  /** Underperformance session count (production) */
  underperformedProductionSessions: number;
  /** Underperformance session count (finality) */
  underperformedFinalitySessions: number;
  /** Whether validator is at risk of ban */
  atRiskOfBan: boolean;
}

/**
 * Validator total rewards in era
 */
export interface ValidatorReward {
  /** Validator account */
  accountId: string;
  /** Total reward amount */
  totalReward: number;
}

// ==========================================================================
// Extrinsic Parameters
// ==========================================================================

/**
 * Parameters for set_ban_config extrinsic
 */
export interface SetProductionBanConfigParams {
  /** Minimum expected performance percentage (0-100) */
  minimalExpectedPerformance?: number | null;
  /** Underperformed session count threshold */
  underperformedSessionCountThreshold?: number | null;
  /** Clean session counter delay */
  cleanSessionCounterDelay?: number | null;
  /** Ban period in eras */
  banPeriod?: number | null;
}

/**
 * Parameters for set_finality_ban_config extrinsic
 */
export interface SetFinalityBanConfigParams {
  /** Minimum expected performance */
  minimalExpectedPerformance?: number | null;
  /** Underperformed session count threshold */
  underperformedSessionCountThreshold?: number | null;
  /** Ban period in eras */
  banPeriod?: number | null;
  /** Clean session counter delay */
  cleanSessionCounterDelay?: number | null;
}

/**
 * Parameters for ban_from_committee extrinsic
 */
export interface BanFromCommitteeParams {
  /** Account to ban */
  banned: string;
  /** Reason for ban (max 256 bytes) */
  banReason: string;
}

/**
 * Parameters for cancel_ban extrinsic
 */
export interface CancelBanParams {
  /** Account to unban */
  banned: string;
}

/**
 * Parameters for set_lenient_threshold extrinsic
 */
export interface SetLenientThresholdParams {
  /** Threshold percentage (0-100) */
  thresholdPercent: number;
}

// ==========================================================================
// Events
// ==========================================================================

/**
 * Event emitted when production ban config is set
 */
export interface SetBanConfigEvent {
  config: ProductionBanConfig;
}

/**
 * Event emitted when finality ban config is set
 */
export interface SetFinalityBanConfigEvent {
  config: FinalityBanConfig;
}

/**
 * Event emitted when validators are banned
 */
export interface BanValidatorsEvent {
  /** List of banned validators with their ban info */
  validators: Array<{
    accountId: string;
    banInfo: BanInfo;
  }>;
}

// ==========================================================================
// Errors
// ==========================================================================

/**
 * Committee management pallet errors
 */
export enum CommitteeManagementError {
  /** Invalid ban configuration */
  InvalidBanConfig = "InvalidBanConfig",
  /** Ban reason is too long */
  BanReasonTooBig = "BanReasonTooBig",
  /** Invalid lenient threshold */
  InvalidLenientThreshold = "InvalidLenientThreshold",
}

// ==========================================================================
// Query Results
// ==========================================================================

/**
 * Committee management configuration
 */
export interface CommitteeManagementConfig {
  /** Session period in blocks */
  sessionPeriod: number;
  /** Max validators */
  maxValidators: number;
  /** Production ban config */
  productionBanConfig: ProductionBanConfig;
  /** Finality ban config */
  finalityBanConfig: FinalityBanConfig;
  /** Lenient threshold */
  lenientThreshold: number;
}

/**
 * Banned validators info
 */
export interface BannedValidatorsInfo {
  /** Total number of banned validators */
  count: number;
  /** List of banned validators */
  validators: Array<{
    accountId: string;
    banInfo: BanInfo;
  }>;
}

// ==========================================================================
// Constants
// ==========================================================================

/**
 * Default ban configuration values
 */
export const DEFAULT_BAN_CONFIG = {
  /** Default minimal expected performance (80%) */
  minimalExpectedPerformance: 80,
  /** Default session count threshold before ban */
  underperformedSessionCountThreshold: 3,
  /** Default clean session counter delay */
  cleanSessionCounterDelay: 2,
  /** Default ban period in eras */
  banPeriod: 10,
  /** Max ban reason length */
  maxBanReasonLength: 256,
};

/**
 * Default lenient threshold (90%)
 */
export const DEFAULT_LENIENT_THRESHOLD = 90;
