/**
 * Session Pallet Client
 * 
 * Main client for interacting with the Session pallet
 */

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import { SessionQueries } from './queries.js';
import type { SetKeysParams, SessionInfo, QueuedKey, SessionKeys } from './types';

/**
 * Session Manager - Main interface for Session pallet
 */
export class SessionManager {
  public queries: SessionQueries;

  constructor(private api: ApiPromise) {
    this.queries = new SessionQueries(api);
  }

  // ============================================================================
  // Extrinsics (Transactions)
  // ============================================================================

  /**
   * Set session keys
   * @param params - Set keys parameters
   * @returns Submittable extrinsic
   */
  setKeys(params: SetKeysParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.session.setKeys(params.keys, params.proof);
  }

  /**
   * Purge (remove) session keys
   * @returns Submittable extrinsic
   */
  purgeKeys(): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.session.purgeKeys();
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get complete session information
   * @returns Session info
   */
  async getSessionInfo(): Promise<SessionInfo> {
    const [currentIndex, validators, queuedKeys] = await Promise.all([
      this.queries.currentIndex(),
      this.queries.validators(),
      this.queries.queuedKeys(),
    ]);

    return {
      currentIndex,
      validators,
      queuedKeys,
    };
  }

  /**
   * Check if account is a current validator
   * @param accountId - Account to check
   * @returns True if account is validator
   */
  async isValidator(accountId: string): Promise<boolean> {
    const validators = await this.queries.validators();
    return validators.includes(accountId);
  }

  /**
   * Check if account is queued as next validator
   * @param accountId - Account to check
   * @returns True if account is queued
   */
  async isQueuedValidator(accountId: string): Promise<boolean> {
    const queuedKeys = await this.queries.queuedKeys();
    return queuedKeys.some((qk: QueuedKey) => qk.validator === accountId);
  }

  /**
   * Get session keys for a validator
   * @param accountId - Validator account
   * @returns Session keys or null
   */
  async getSessionKeys(accountId: string): Promise<SessionKeys | null> {
    return await this.queries.nextKeys(accountId);
  }

  /**
   * Generate session keys rotation call
   * This is typically done by calling the RPC method first to generate keys
   * @param newKeys - New session keys (hex string)
   * @param proof - Proof (usually empty '0x')
   * @returns Submittable extrinsic
   */
  rotateKeys(newKeys: string, proof: string = '0x'): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.setKeys({ keys: newKeys, proof });
  }

  /**
   * Get all validators with their session keys
   * @returns Array of queued keys
   */
  async getAllValidatorKeys(): Promise<QueuedKey[]> {
    return await this.queries.queuedKeys();
  }

  /**
   * Estimate fee for setting keys
   * @param keys - Session keys
   * @param proof - Proof
   * @param fromAddress - Sender address
   * @returns Estimated fee
   */
  async estimateSetKeysFee(keys: string, proof: string, fromAddress: string): Promise<bigint> {
    const tx = this.setKeys({ keys, proof });
    const info = await tx.paymentInfo(fromAddress);
    return BigInt(info.partialFee.toString());
  }

  /**
   * Estimate fee for purging keys
   * @param fromAddress - Sender address
   * @returns Estimated fee
   */
  async estimatePurgeKeysFee(fromAddress: string): Promise<bigint> {
    const tx = this.purgeKeys();
    const info = await tx.paymentInfo(fromAddress);
    return BigInt(info.partialFee.toString());
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  /**
   * Subscribe to NewSession events
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  async onNewSession(callback: (event: { sessionIndex: number }) => void): Promise<() => void> {
    const unsub: any = await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (event.section === 'session' && event.method === 'NewSession') {
          const [sessionIndex] = event.data as any;
          callback({
            sessionIndex: sessionIndex.toNumber(),
          });
        }
      });
    });
    return unsub;
  }
}
