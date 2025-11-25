/**
 * Session Pallet Storage Queries
 *
 * Query functions for Session pallet storage
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  SessionKeys,
  SessionInfo,
  SessionProgress,
  ValidatorsResult,
  CurrentIndexResult,
  NextKeysResult,
  QueuedKeysResult,
  QueuedKeyInfo,
  SessionConstants,
} from "./types.js";

/**
 * Session storage queries
 */
export class SessionQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get the current set of validators
   * @returns List of validator accounts
   */
  async validators(): Promise<ValidatorsResult> {
    const result = await this.api.query.session.validators();
    const validators = (result as any).map((v: any) => v.toString());

    return {
      validators,
      count: validators.length,
    };
  }

  /**
   * Get the current session index
   * @returns Current session index
   */
  async currentIndex(): Promise<CurrentIndexResult> {
    const result = await this.api.query.session.currentIndex();

    return {
      index: parseInt(result.toString(), 10),
    };
  }

  /**
   * Get the next session keys for an account
   * @param accountId - Account to query
   * @returns Session keys if set
   */
  async nextKeys(accountId: string): Promise<NextKeysResult> {
    const result = await this.api.query.session.nextKeys(accountId);
    const keys = result as any;

    if (!keys || keys.isNone) {
      return {
        account: accountId,
        keys: null,
      };
    }

    return {
      account: accountId,
      keys: this.parseSessionKeys(keys.unwrap ? keys.unwrap() : keys),
    };
  }

  /**
   * Get the queued keys for the next session
   * @returns All validators and their queued keys
   */
  async queuedKeys(): Promise<QueuedKeysResult> {
    const result = await this.api.query.session.queuedKeys();
    const queuedKeys = result as any;

    const validators: QueuedKeyInfo[] = queuedKeys.map((item: any) => ({
      validator: item[0].toString(),
      keys: this.parseSessionKeys(item[1]),
    }));

    return {
      validators,
    };
  }

  /**
   * Check if keys are set for a validator
   * @param accountId - Account to check
   * @returns True if keys are set
   */
  async hasKeys(accountId: string): Promise<boolean> {
    const result = await this.nextKeys(accountId);
    return result.keys !== null;
  }

  /**
   * Get current session information
   * @returns Session info
   */
  async getSessionInfo(): Promise<SessionInfo> {
    const [validatorsResult, indexResult] = await Promise.all([
      this.validators(),
      this.currentIndex(),
    ]);

    return {
      currentIndex: indexResult.index,
      validators: validatorsResult.validators,
      validatorCount: validatorsResult.count,
    };
  }

  /**
   * Get session progress information
   * @returns Session progress
   */
  async getSessionProgress(): Promise<SessionProgress> {
    const [sessionIndex, eraInfo] = await Promise.all([
      this.currentIndex(),
      this.api.query.staking?.activeEra
        ? this.api.query.staking.activeEra()
        : Promise.resolve(null),
    ]);

    // Get sessions per era from staking constants
    let sessionsPerEra = 6; // Default
    try {
      const sessionsPerEraConst = this.api.consts.staking?.sessionsPerEra;
      if (sessionsPerEraConst) {
        sessionsPerEra = parseInt(sessionsPerEraConst.toString(), 10);
      }
    } catch {
      // Use default
    }

    let eraIndex = 0;
    if (eraInfo && !(eraInfo as any).isNone) {
      const era = (eraInfo as any).unwrap ? (eraInfo as any).unwrap() : eraInfo;
      eraIndex = parseInt(era.index?.toString() || "0", 10);
    }

    const sessionInEra = sessionIndex.index % sessionsPerEra;
    const isSessionEnding = sessionInEra === sessionsPerEra - 1;

    return {
      sessionIndex: sessionIndex.index,
      eraIndex,
      sessionsPerEra,
      sessionInEra,
      isSessionEnding,
    };
  }

  /**
   * Get session constants
   * @returns Session constants
   */
  async getConstants(): Promise<SessionConstants> {
    let sessionsPerEra = 6;
    let expectedBlockTime = 6000; // 6 seconds
    let sessionDuration = 600; // blocks

    try {
      const sessionsPerEraConst = this.api.consts.staking?.sessionsPerEra;
      if (sessionsPerEraConst) {
        sessionsPerEra = parseInt(sessionsPerEraConst.toString(), 10);
      }
    } catch {
      // Use default
    }

    try {
      const blockTime = this.api.consts.aleph?.millisPerBlock;
      if (blockTime) {
        expectedBlockTime = parseInt(blockTime.toString(), 10);
      }
    } catch {
      // Try babe expected block time
      try {
        const babeTime = this.api.consts.babe?.expectedBlockTime;
        if (babeTime) {
          expectedBlockTime = parseInt(babeTime.toString(), 10);
        }
      } catch {
        // Use default
      }
    }

    try {
      const period = this.api.consts.aleph?.sessionPeriod;
      if (period) {
        sessionDuration = parseInt(period.toString(), 10);
      }
    } catch {
      // Use default
    }

    return {
      sessionsPerEra,
      expectedBlockTime,
      sessionDuration,
    };
  }

  /**
   * Get all validators with their session key status
   * @returns Validators with key info
   */
  async getValidatorsWithKeys(): Promise<
    { validator: string; hasKeys: boolean; keys: SessionKeys | null }[]
  > {
    const [validatorsResult, queuedKeysResult] = await Promise.all([
      this.validators(),
      this.queuedKeys(),
    ]);

    const keyMap = new Map(
      queuedKeysResult.validators.map((v) => [v.validator, v.keys])
    );

    return validatorsResult.validators.map((validator) => ({
      validator,
      hasKeys: keyMap.has(validator),
      keys: keyMap.get(validator) || null,
    }));
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Parse session keys from chain format
   */
  private parseSessionKeys(keys: any): SessionKeys {
    const result: SessionKeys = {};

    // Try to extract different key types
    // The structure depends on the runtime configuration
    if (keys.aleph) {
      result.aleph = keys.aleph.toString();
    }
    if (keys.aura) {
      result.aura = keys.aura.toString();
    }
    if (keys.grandpa) {
      result.grandpa = keys.grandpa.toString();
    }
    if (keys.imOnline) {
      result.imOnline = keys.imOnline.toString();
    }
    if (keys.authorityDiscovery) {
      result.authorityDiscovery = keys.authorityDiscovery.toString();
    }

    // If keys is an array or has numeric indices
    if (Array.isArray(keys) || keys[0]) {
      const keysArray = Array.isArray(keys) ? keys : Object.values(keys);
      // Selendra typically uses [aleph, aura] or similar structure
      if (keysArray.length >= 1) {
        result.aleph = keysArray[0]?.toString();
      }
      if (keysArray.length >= 2) {
        result.aura = keysArray[1]?.toString();
      }
    }

    return result;
  }
}
