/**
 * Elections Pallet Types
 *
 * Type definitions for Selendra's custom validator elections pallet
 */

// ==========================================================================
// Committee Seats Configuration
// ==========================================================================

/**
 * Committee seats configuration
 * Controls the composition of the validator committee
 */
export interface CommitteeSeats {
  /** Number of reserved validator seats */
  reservedSeats: number;
  /** Number of non-reserved validator seats */
  nonReservedSeats: number;
  /** Number of non-reserved validators with finality voting rights */
  nonReservedFinalitySeats: number;
}

// ==========================================================================
// Election Openness
// ==========================================================================

/**
 * Election openness modes
 */
export enum ElectionOpenness {
  /** Only pre-approved validators can participate */
  Permissioned = "Permissioned",
  /** Any validator meeting requirements can participate */
  Permissionless = "Permissionless",
}

// ==========================================================================
// Validator Types
// ==========================================================================

/**
 * Era validators structure
 */
export interface EraValidators {
  /** Reserved validators (guaranteed seats) */
  reserved: string[];
  /** Non-reserved validators (elected from staking) */
  nonReserved: string[];
}

/**
 * Validator information with rewards
 */
export interface ValidatorRewardInfo {
  /** Validator account ID */
  accountId: string;
  /** Total rewards earned */
  totalReward: number;
}

/**
 * Full validator set information
 */
export interface ValidatorSetInfo {
  /** Current era validators */
  currentValidators: EraValidators;
  /** Next era reserved validators */
  nextReserved: string[];
  /** Next era non-reserved validators */
  nextNonReserved: string[];
  /** Committee size configuration */
  committeeSize: CommitteeSeats;
  /** Next era committee size */
  nextCommitteeSize: CommitteeSeats;
  /** Election openness mode */
  openness: ElectionOpenness;
}

// ==========================================================================
// Extrinsic Parameters
// ==========================================================================

/**
 * Parameters for change_validators extrinsic
 */
export interface ChangeValidatorsParams {
  /** New reserved validators (optional, keeps current if null) */
  reservedValidators?: string[] | null;
  /** New non-reserved validators (optional, keeps current if null) */
  nonReservedValidators?: string[] | null;
  /** New committee size (optional, keeps current if null) */
  committeeSize?: CommitteeSeats | null;
}

/**
 * Parameters for set_elections_openness extrinsic
 */
export interface SetElectionsOpennessParams {
  /** New election openness mode */
  openness: ElectionOpenness;
}

// ==========================================================================
// Election Results
// ==========================================================================

/**
 * Election support data for a validator
 */
export interface ValidatorSupport {
  /** Total backing stake */
  total: bigint;
  /** List of voters with their stake */
  voters: Array<{
    voter: string;
    stake: bigint;
  }>;
}

/**
 * Election results
 */
export interface ElectionResults {
  /** Validators with their support */
  supports: Map<string, ValidatorSupport>;
  /** Total elected validators */
  totalElected: number;
}

// ==========================================================================
// Events
// ==========================================================================

/**
 * Event emitted when validators are changed
 */
export interface ChangeValidatorsEvent {
  /** New reserved validators */
  reservedValidators: string[];
  /** New non-reserved validators */
  nonReservedValidators: string[];
  /** New committee seats configuration */
  committeeSize: CommitteeSeats;
}

// ==========================================================================
// Errors
// ==========================================================================

/**
 * Elections pallet errors
 */
export enum ElectionsError {
  /** Not enough total validators */
  NotEnoughValidators = "NotEnoughValidators",
  /** Not enough reserved validators */
  NotEnoughReservedValidators = "NotEnoughReservedValidators",
  /** Not enough non-reserved validators */
  NotEnoughNonReservedValidators = "NotEnoughNonReservedValidators",
  /** Validator list contains duplicates */
  NonUniqueListOfValidators = "NonUniqueListOfValidators",
  /** Non-reserved finality seats exceeds non-reserved seats */
  NonReservedFinalitySeatsLargerThanNonReservedSeats = "NonReservedFinalitySeatsLargerThanNonReservedSeats",
}

// ==========================================================================
// Query Results
// ==========================================================================

/**
 * Elections configuration
 */
export interface ElectionsConfig {
  /** Maximum number of winners */
  maxWinners: number;
  /** Maximum number of validators */
  maxValidators: number;
  /** Current committee size */
  committeeSize: CommitteeSeats;
  /** Election openness mode */
  openness: ElectionOpenness;
}

/**
 * Validator eligibility check result
 */
export interface ValidatorEligibility {
  /** Whether the validator is eligible */
  isEligible: boolean;
  /** Whether the validator is staking */
  isStaking: boolean;
  /** Whether the validator is banned */
  isBanned: boolean;
  /** Whether the validator is reserved */
  isReserved: boolean;
  /** Reason if not eligible */
  reason?: string;
}
