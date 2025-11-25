/**
 * Session Pallet Types
 * 
 * TypeScript type definitions for the Session pallet
 */

/**
 * Session keys for validators
 * Combined keys for different consensus mechanisms
 */
export interface SessionKeys {
  /** GRANDPA finality key */
  grandpa: string;
  /** BABE block production key */
  babe: string;
  /** ImOnline heartbeat key */
  imOnline: string;
  /** Authority discovery key */
  authorityDiscovery: string;
}

/**
 * Queued session keys
 */
export interface QueuedKey {
  /** Validator account */
  validator: string;
  /** Session keys */
  keys: SessionKeys;
}

/**
 * Set keys parameters
 */
export interface SetKeysParams {
  /** Session keys (hex string) */
  keys: string;
  /** Proof (usually empty for development) */
  proof: string;
}

/**
 * Session information
 */
export interface SessionInfo {
  /** Current session index */
  currentIndex: number;
  /** Current validators */
  validators: string[];
  /** Queued keys for next session */
  queuedKeys: QueuedKey[];
}

/**
 * Validator session keys
 */
export interface ValidatorKeys {
  /** Validator account */
  validator: string;
  /** Next session keys (if set) */
  nextKeys: SessionKeys | null;
  /** Has queued keys */
  hasQueuedKeys: boolean;
}

/**
 * Session events
 */
export interface NewSessionEvent {
  /** Session index */
  sessionIndex: number;
}
