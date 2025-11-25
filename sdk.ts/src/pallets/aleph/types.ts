/**
 * Aleph Pallet Types
 *
 * Type definitions for the Aleph consensus pallet
 * Manages finality and session information for Selendra
 */

// =============================================================================
// Authority Types
// =============================================================================

/**
 * Authority information
 */
export interface AuthorityInfo {
  /** Authority account */
  account: string;
  /** Authority index */
  index: number;
  /** Authority public key */
  publicKey?: string;
}

/**
 * List of authorities
 */
export interface AuthoritiesInfo {
  /** Current authorities */
  authorities: AuthorityInfo[];
  /** Total count */
  count: number;
}

// =============================================================================
// Session Types
// =============================================================================

/**
 * Session information for Aleph
 */
export interface AlephSessionInfo {
  /** Current session index */
  sessionIndex: number;
  /** Session period in blocks */
  sessionPeriod: number;
  /** Current validators/authorities */
  validators: string[];
  /** Next session validators */
  nextValidators?: string[];
}

/**
 * Session for block result
 */
export interface SessionForBlockResult {
  /** Block number queried */
  blockNumber: number;
  /** Session index for the block */
  sessionIndex: number;
}

// =============================================================================
// Finality Types
// =============================================================================

/**
 * Finality version information
 */
export interface FinalityVersionInfo {
  /** Finality version number */
  version: number;
}

/**
 * Finality state
 */
export interface FinalityState {
  /** Latest finalized block */
  finalizedBlock: number;
  /** Finality lag (blocks behind head) */
  finalityLag: number;
  /** Current head block */
  headBlock: number;
}

// =============================================================================
// Timing Types
// =============================================================================

/**
 * Block timing information
 */
export interface BlockTimingInfo {
  /** Milliseconds per block */
  millisPerBlock: number;
  /** Session period in blocks */
  sessionPeriod: number;
  /** Estimated session duration in milliseconds */
  sessionDurationMs: number;
}

// =============================================================================
// Emergency Types
// =============================================================================

/**
 * Emergency state
 */
export interface EmergencyState {
  /** Whether emergency finalizer is active */
  isEmergency: boolean;
  /** Emergency finalizer account if active */
  emergencyFinalizer?: string;
}

// =============================================================================
// Query Result Types
// =============================================================================

/**
 * Current session result
 */
export interface CurrentSessionResult {
  /** Session index */
  sessionIndex: number;
  /** Current era (if available) */
  eraIndex?: number;
  /** Session progress within era */
  sessionProgress?: number;
}

/**
 * Aleph constants
 */
export interface AlephConstants {
  /** Milliseconds per block */
  millisPerBlock: number;
  /** Session period in blocks */
  sessionPeriod: number;
  /** Finality version */
  finalityVersion: number;
}

// =============================================================================
// Subscription Types
// =============================================================================

/**
 * Session change callback data
 */
export interface SessionChangeData {
  /** New session index */
  newSessionIndex: number;
  /** Previous session index */
  previousSessionIndex: number;
  /** New validators */
  validators: string[];
}

/**
 * Era change callback data
 */
export interface EraChangeData {
  /** New era index */
  newEraIndex: number;
  /** Previous era index */
  previousEraIndex: number;
}

/**
 * Finality callback data
 */
export interface FinalityData {
  /** Finalized block number */
  blockNumber: number;
  /** Block hash */
  blockHash: string;
}
