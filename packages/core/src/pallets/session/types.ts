/**
 * Session Pallet Types
 *
 * Type definitions for the Session pallet
 * Manages validator session keys and rotation
 */

// =============================================================================
// Session Key Types
// =============================================================================

/**
 * Session keys structure for Selendra
 * Contains all required key types for validators
 */
export interface SessionKeys {
  /** Aleph consensus key (ed25519) */
  aleph?: string;
  /** AURA block production key (sr25519) */
  aura?: string;
  /** GRANDPA finality key (ed25519) - if used */
  grandpa?: string;
  /** ImOnline heartbeat key (sr25519) - if used */
  imOnline?: string;
  /** Authority discovery key - if used */
  authorityDiscovery?: string;
}

/**
 * Raw session keys as hex strings
 */
export interface RawSessionKeys {
  /** All keys concatenated as hex */
  keys: string;
  /** Proof of ownership */
  proof: string;
}

/**
 * Queued session key info
 */
export interface QueuedKeyInfo {
  /** Validator account */
  validator: string;
  /** Session keys */
  keys: SessionKeys;
}

// =============================================================================
// Session Info Types
// =============================================================================

/**
 * Current session information
 */
export interface SessionInfo {
  /** Current session index */
  currentIndex: number;
  /** Current validators for this session */
  validators: string[];
  /** Total number of validators */
  validatorCount: number;
}

/**
 * Session progress information
 */
export interface SessionProgress {
  /** Current session index */
  sessionIndex: number;
  /** Current era index */
  eraIndex: number;
  /** Sessions per era */
  sessionsPerEra: number;
  /** Current session in era (0-based) */
  sessionInEra: number;
  /** Whether session is about to change */
  isSessionEnding: boolean;
}

/**
 * Validator session info
 */
export interface ValidatorSessionInfo {
  /** Validator account */
  account: string;
  /** Whether currently active in session */
  isActive: boolean;
  /** Session keys if set */
  keys?: SessionKeys;
  /** Next session keys (queued) */
  nextKeys?: SessionKeys;
}

// =============================================================================
// Extrinsic Parameters
// =============================================================================

/**
 * Parameters for setting session keys
 */
export interface SetKeysParams {
  /** Session keys to set */
  keys: SessionKeys | string;
  /** Proof of key ownership (typically empty for most calls) */
  proof: string;
}

/**
 * Parameters for purging session keys
 */
export interface PurgeKeysParams {
  // No parameters needed
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * NewSession event data
 */
export interface NewSessionEvent {
  /** New session index */
  sessionIndex: number;
}

// =============================================================================
// Query Result Types
// =============================================================================

/**
 * Result from validators query
 */
export interface ValidatorsResult {
  /** List of validator accounts */
  validators: string[];
  /** Count of validators */
  count: number;
}

/**
 * Result from current index query
 */
export interface CurrentIndexResult {
  /** Current session index */
  index: number;
}

/**
 * Result from next keys query
 */
export interface NextKeysResult {
  /** Account queried */
  account: string;
  /** Session keys if set */
  keys: SessionKeys | null;
}

/**
 * Result from queued keys query
 */
export interface QueuedKeysResult {
  /** List of validators with their queued keys */
  validators: QueuedKeyInfo[];
}

/**
 * Session constants
 */
export interface SessionConstants {
  /** Number of sessions per era */
  sessionsPerEra: number;
  /** Expected block time in milliseconds */
  expectedBlockTime: number;
  /** Session duration in blocks */
  sessionDuration: number;
}
