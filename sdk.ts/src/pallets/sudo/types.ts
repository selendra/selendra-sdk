/**
 * Sudo Pallet Types
 *
 * Types for superuser operations
 */

/**
 * Sudo key information
 */
export interface SudoKey {
  /** The current sudo account */
  account: string;
  /** Whether the key is set */
  isSet: boolean;
}

/**
 * Sudo call parameters
 */
export interface SudoCallParams {
  /** The call to execute */
  call: unknown;
  /** Optional weight override */
  weight?: {
    refTime: bigint;
    proofSize: bigint;
  };
}

/**
 * Sudo as parameters
 */
export interface SudoAsParams {
  /** Account to dispatch as */
  who: string;
  /** The call to execute */
  call: unknown;
}

/**
 * Set key parameters
 */
export interface SetKeyParams {
  /** The new sudo key */
  newKey: string;
}

/**
 * Sudo transaction result
 */
export interface SudoTxResult {
  /** Whether the transaction succeeded */
  success: boolean;
  /** Block hash where tx was finalized */
  blockHash?: string;
  /** Transaction hash */
  txHash?: string;
  /** Whether the sudo call itself succeeded */
  sudoResult?: {
    ok: boolean;
    error?: string;
  };
  /** Transaction events */
  events: Array<{
    section: string;
    method: string;
    data: string;
  }>;
}

/**
 * Sudo event types
 */
export type SudoEventType =
  | "Sudid"
  | "KeyChanged"
  | "KeyRemoved"
  | "SudoAsDone";

/**
 * Sudo event
 */
export interface SudoEvent {
  /** Event type */
  type: SudoEventType;
  /** Event data */
  data: {
    /** Result of sudo call (for Sudid) */
    sudoResult?: { ok: boolean; error?: string };
    /** Old key (for KeyChanged) */
    oldKey?: string;
    /** New key (for KeyChanged) */
    newKey?: string;
    /** Who was impersonated (for SudoAsDone) */
    who?: string;
    /** Result of sudo as call (for SudoAsDone) */
    result?: { ok: boolean; error?: string };
  };
}

/**
 * Sudo pallet constants
 */
export interface SudoConstants {
  /** Pallet name in runtime */
  palletName: string;
}
