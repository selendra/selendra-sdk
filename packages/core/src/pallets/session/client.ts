/**
 * Session Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Session pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type {
  SessionKeys,
  SetKeysParams,
  ValidatorSessionInfo,
} from "./types.js";
import { SessionQueries } from "./queries.js";

/** Session transaction result */
export interface SessionTxResult {
  success: boolean;
  blockHash: string;
  txHash: string;
  events: any[];
}

/**
 * Session Manager - handles Session pallet extrinsics
 */
export class SessionManager {
  private queries: SessionQueries;

  constructor(private api: ApiPromise) {
    this.queries = new SessionQueries(api);
  }

  // ==========================================================================
  // Core Session Extrinsics
  // ==========================================================================

  /**
   * Set session keys for the calling account
   * @param keys - Session keys to set
   * @param proof - Proof of key ownership (typically "0x")
   * @returns Submittable extrinsic
   */
  setKeys(
    keys: SessionKeys | string,
    proof: string = "0x"
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    // If keys is a SessionKeys object, encode it
    const encodedKeys =
      typeof keys === "string" ? keys : this.encodeSessionKeys(keys);

    return this.api.tx.session.setKeys(encodedKeys, proof);
  }

  /**
   * Remove session keys for the calling account
   * @returns Submittable extrinsic
   */
  purgeKeys(): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.session.purgeKeys();
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Set session keys and wait for confirmation
   * @param signer - Keyring pair to sign
   * @param keys - Session keys
   * @param proof - Proof of ownership
   * @returns Transaction result
   */
  async setKeysAndWait(
    signer: KeyringPair,
    keys: SessionKeys | string,
    proof: string = "0x"
  ): Promise<SessionTxResult> {
    const extrinsic = this.setKeys(keys, proof);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Purge session keys and wait for confirmation
   * @param signer - Keyring pair to sign
   * @returns Transaction result
   */
  async purgeKeysAndWait(signer: KeyringPair): Promise<SessionTxResult> {
    const extrinsic = this.purgeKeys();
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Rotate session keys (generate new keys via RPC and set them)
   * @param signer - Keyring pair to sign
   * @returns Transaction result with new keys
   */
  async rotateKeys(
    signer: KeyringPair
  ): Promise<SessionTxResult & { newKeys?: string }> {
    // Generate new keys via RPC
    const newKeys = await this.generateSessionKeys();

    // Set the new keys
    const result = await this.setKeysAndWait(signer, newKeys);

    return {
      ...result,
      newKeys,
    };
  }

  /**
   * Generate new session keys via RPC
   * @returns New session keys as hex string
   */
  async generateSessionKeys(): Promise<string> {
    try {
      const keys = await this.api.rpc.author.rotateKeys();
      return keys.toHex();
    } catch (error) {
      throw new Error(
        `Failed to generate session keys: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check if caller has session keys set
   * @param accountId - Account to check
   * @returns Whether keys are set
   */
  async hasSessionKeys(accountId: string): Promise<boolean> {
    return this.queries.hasKeys(accountId);
  }

  /**
   * Get session keys for an account
   * @param accountId - Account to query
   * @returns Session keys or null
   */
  async getSessionKeys(accountId: string): Promise<SessionKeys | null> {
    const result = await this.queries.nextKeys(accountId);
    return result.keys;
  }

  /**
   * Get validator session info
   * @param accountId - Validator account
   * @returns Validator session info
   */
  async getValidatorSessionInfo(
    accountId: string
  ): Promise<ValidatorSessionInfo> {
    const [sessionInfo, keysResult, queuedKeys] = await Promise.all([
      this.queries.getSessionInfo(),
      this.queries.nextKeys(accountId),
      this.queries.queuedKeys(),
    ]);

    const isActive = sessionInfo.validators.includes(accountId);
    const queuedKey = queuedKeys.validators.find(
      (v) => v.validator === accountId
    );

    return {
      account: accountId,
      isActive,
      keys: keysResult.keys || undefined,
      nextKeys: queuedKey?.keys,
    };
  }

  /**
   * Subscribe to new session events
   * @param callback - Callback for new sessions
   * @returns Unsubscribe function
   */
  async subscribeToNewSessions(
    callback: (sessionIndex: number) => void
  ): Promise<() => void> {
    const unsub = await this.api.query.session.currentIndex((index: any) => {
      callback(parseInt(index.toString(), 10));
    });

    return unsub as unknown as () => void;
  }

  /**
   * Get current session info
   */
  async getSessionInfo() {
    return this.queries.getSessionInfo();
  }

  /**
   * Get session progress
   */
  async getSessionProgress() {
    return this.queries.getSessionProgress();
  }

  /**
   * Get session constants
   */
  async getConstants() {
    return this.queries.getConstants();
  }

  /**
   * Get current validators
   */
  async getValidators() {
    return this.queries.validators();
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Encode session keys to chain format
   */
  private encodeSessionKeys(keys: SessionKeys): string {
    // For Selendra, session keys are typically { aleph, aura }
    // This creates the encoded format expected by the runtime

    // If we have the raw keys, concatenate them
    const keyParts: string[] = [];

    if (keys.aleph) {
      keyParts.push(this.normalizeKey(keys.aleph));
    }
    if (keys.aura) {
      keyParts.push(this.normalizeKey(keys.aura));
    }
    if (keys.grandpa) {
      keyParts.push(this.normalizeKey(keys.grandpa));
    }
    if (keys.imOnline) {
      keyParts.push(this.normalizeKey(keys.imOnline));
    }
    if (keys.authorityDiscovery) {
      keyParts.push(this.normalizeKey(keys.authorityDiscovery));
    }

    // Concatenate all keys (each key is 32 bytes = 64 hex chars)
    return "0x" + keyParts.join("");
  }

  /**
   * Normalize a key to 32-byte hex format
   */
  private normalizeKey(key: string): string {
    // Remove 0x prefix if present
    const hex = key.startsWith("0x") ? key.slice(2) : key;
    // Ensure 64 characters (32 bytes)
    return hex.padStart(64, "0");
  }

  /**
   * Sign and send an extrinsic
   */
  private async signAndSend(
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
    signer: KeyringPair
  ): Promise<SessionTxResult> {
    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(signer, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const blockHash = result.status.isInBlock
              ? result.status.asInBlock.toString()
              : result.status.asFinalized.toString();

            const events = result.events.map((e) => e.event);

            // Check for errors
            const hasError = events.some((e) =>
              this.api.events.system.ExtrinsicFailed.is(e)
            );

            resolve({
              success: !hasError,
              blockHash,
              txHash: extrinsic.hash.toString(),
              events,
            });
          }

          if (result.status.isInvalid) {
            reject(new Error("Transaction invalid"));
          }
        })
        .catch(reject);
    });
  }
}
