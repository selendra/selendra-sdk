/**
 * Session Pallet Queries
 * 
 * Storage queries for the Session pallet
 */

import type { ApiPromise } from '@polkadot/api';
import type { SessionKeys, QueuedKey, ValidatorKeys } from './types';

/**
 * Session storage queries
 */
export class SessionQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get current validators
   * @returns Array of validator addresses
   */
  async validators(): Promise<string[]> {
    const result: any = await this.api.query.session.validators();
    return result.map((validator: any) => validator.toString());
  }

  /**
   * Get current session index
   * @returns Current session index
   */
  async currentIndex(): Promise<number> {
    const result: any = await this.api.query.session.currentIndex();
    return result.toNumber();
  }

  /**
   * Get queued session keys
   * @returns Array of queued keys
   */
  async queuedKeys(): Promise<QueuedKey[]> {
    const result: any = await this.api.query.session.queuedKeys();
    
    return result.map((item: any) => {
      const [validator, keys] = item;
      return {
        validator: validator.toString(),
        keys: this.parseSessionKeys(keys),
      };
    });
  }

  /**
   * Get next session keys for a validator
   * @param accountId - Validator account
   * @returns Next session keys or null
   */
  async nextKeys(accountId: string): Promise<SessionKeys | null> {
    const result: any = await this.api.query.session.nextKeys(accountId);
    
    if (result.isNone) {
      return null;
    }

    const keys = result.unwrap();
    return this.parseSessionKeys(keys);
  }

  /**
   * Get key owner for a session key
   * @param keyType - Key type identifier
   * @param key - Public key
   * @returns Account that owns the key, or null
   */
  async keyOwner(keyType: string, key: string): Promise<string | null> {
    const result: any = await this.api.query.session.keyOwner([keyType, key]);
    
    if (result.isNone) {
      return null;
    }

    return result.unwrap().toString();
  }

  /**
   * Check if validator has queued keys
   * @param accountId - Validator account
   * @returns True if validator has queued keys
   */
  async hasQueuedKeys(accountId: string): Promise<boolean> {
    const nextKeys = await this.nextKeys(accountId);
    return nextKeys !== null;
  }

  /**
   * Get validator keys information
   * @param accountId - Validator account
   * @returns Validator keys info
   */
  async getValidatorKeys(accountId: string): Promise<ValidatorKeys> {
    const nextKeys = await this.nextKeys(accountId);
    
    return {
      validator: accountId,
      nextKeys,
      hasQueuedKeys: nextKeys !== null,
    };
  }

  /**
   * Parse session keys from storage
   * @param keys - Raw keys from storage
   * @returns Parsed session keys
   */
  private parseSessionKeys(keys: any): SessionKeys {
    // Session keys are typically encoded as a concatenated hex string
    // The exact format depends on the runtime configuration
    // For Selendra/Substrate, it's usually: GRANDPA + BABE + ImOnline + AuthorityDiscovery
    
    const keysHex = keys.toHex ? keys.toHex() : keys.toString();
    
    // Each key is typically 32 bytes (64 hex chars after 0x)
    // Format: 0x + GRANDPA(64) + BABE(64) + ImOnline(64) + AuthorityDiscovery(64)
    const cleanHex = keysHex.replace('0x', '');
    
    return {
      grandpa: '0x' + cleanHex.substring(0, 64),
      babe: '0x' + cleanHex.substring(64, 128),
      imOnline: '0x' + cleanHex.substring(128, 192),
      authorityDiscovery: '0x' + cleanHex.substring(192, 256),
    };
  }
}
