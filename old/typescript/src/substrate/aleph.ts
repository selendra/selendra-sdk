/**
 * Aleph BFT Consensus Client
 *
 * Provides APIs for interacting with Selendra's Aleph BFT consensus mechanism.
 * Includes validator tracking, committee management, and performance monitoring.
 *
 * @module substrate/aleph
 */

import { ApiPromise } from '@polkadot/api';
import type { Option } from '@polkadot/types';

/**
 * Aleph protocol version information
 */
export interface AlephVersion {
  version: number;
}

/**
 * Session committee structure
 */
export interface SessionCommittee {
  validators: string[];
  size: number;
}

/**
 * ABFT consensus score for a validator
 */
export interface AbftScore {
  validator: string;
  score: number;
  session: number;
}

/**
 * Validator ban information
 */
export interface BanInfo {
  validator: string;
  reason: string;
  start: number;
  length: number;
}

/**
 * Validator performance metrics
 */
export interface ValidatorPerformance {
  blocksProduced: number;
  blocksExpected: number;
  uptime: number;
  sessions: number;
}

/**
 * Client for interacting with Selendra's Aleph BFT consensus
 *
 * @example
 * ```typescript
 * const aleph = sdk.substrate.aleph;
 *
 * // Get current session validators
 * const validators = await aleph.getActiveValidators();
 *
 * // Check validator performance
 * const perf = await aleph.getValidatorPerformance(validatorAddress);
 * console.log(`Blocks: ${perf.blocksProduced}, Uptime: ${perf.uptime}%`);
 *
 * // Get session committee
 * const session = await aleph.getCurrentSession();
 * const committee = await aleph.getSessionCommittee(session);
 * ```
 */
export class AlephClient {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Get Aleph finality protocol version
   *
   * @returns Protocol version information
   */
  async getFinalityVersion(): Promise<AlephVersion> {
    const version = await this.api.query.aleph.finalityVersion();
    return {
      version: (version as any).toNumber(),
    };
  }

  /**
   * Get session committee for a specific session
   * Returns validators responsible for consensus in that session
   *
   * @param sessionIndex - Session index to query
   * @returns Committee information
   */
  async getSessionCommittee(sessionIndex: number): Promise<SessionCommittee> {
    const committee = await this.api.query.aleph.authorities(sessionIndex);
    const validators = (committee as any).map((v: any) => v.toString());

    return {
      validators,
      size: validators.length,
    };
  }

  /**
   * Get current session index
   *
   * @returns Current session number
   */
  async getCurrentSession(): Promise<number> {
    const session = await this.api.query.session.currentIndex();
    return (session as any).toNumber();
  }

  /**
   * Get ABFT scores for validators in a session
   * Scores track validator block production performance
   *
   * @param sessionIndex - Session to query scores for
   * @returns Array of validator scores
   */
  async getAbftScores(sessionIndex: number): Promise<AbftScore[]> {
    // Query validator block counts for session
    const entries = await this.api.query.aleph.sessionValidatorBlockCount.entries(sessionIndex);

    return entries.map(([key, value]) => ({
      validator: (key.args[1] as any).toString(),
      score: (value as any).toNumber(),
      session: sessionIndex,
    }));
  }

  /**
   * Get ban information for a validator
   *
   * @param validator - Validator address
   * @returns Ban info if banned, null otherwise
   */
  async getBanInfo(validator: string): Promise<BanInfo | null> {
    const banInfo = (await this.api.query.aleph.bannedValidators(validator)) as Option<any>;

    if (banInfo.isNone) {
      return null;
    }

    const data = banInfo.unwrap();
    return {
      validator,
      reason: data.reason.toString(),
      start: data.start.toNumber(),
      length: data.length.toNumber(),
    };
  }

  /**
   * Get validator block count for current session
   *
   * @param validator - Validator address
   * @returns Number of blocks produced
   */
  async getValidatorBlockCount(validator: string): Promise<number> {
    const currentSession = await this.getCurrentSession();
    const count = await this.api.query.aleph.sessionValidatorBlockCount(currentSession, validator);
    return (count as any).toNumber();
  }

  /**
   * Get number of sessions a validator underperformed
   *
   * @param validator - Validator address
   * @returns Count of underperformed sessions
   */
  async getUnderperformedSessionCount(validator: string): Promise<number> {
    const count = await this.api.query.aleph.underperformedValidatorSessionCount(validator);
    return (count as any).toNumber();
  }

  /**
   * Get comprehensive validator performance metrics
   *
   * @param validator - Validator address
   * @returns Performance statistics
   */
  async getValidatorPerformance(validator: string): Promise<ValidatorPerformance> {
    const [blockCount, underperformed, currentSession] = await Promise.all([
      this.getValidatorBlockCount(validator),
      this.getUnderperformedSessionCount(validator),
      this.getCurrentSession(),
    ]);

    // Estimate expected blocks (simplified - actual calculation depends on session length)
    const expectedBlocks = 100; // This should be calculated based on session parameters
    const uptime = expectedBlocks > 0 ? (blockCount / expectedBlocks) * 100 : 0;

    return {
      blocksProduced: blockCount,
      blocksExpected: expectedBlocks,
      uptime: Math.min(uptime, 100),
      sessions: Math.max(0, currentSession - underperformed),
    };
  }

  /**
   * Check if validator is currently banned
   *
   * @param validator - Validator address
   * @returns True if banned
   */
  async isValidatorBanned(validator: string): Promise<boolean> {
    const banInfo = await this.getBanInfo(validator);
    return banInfo !== null;
  }

  /**
   * Get all active validators in current session
   *
   * @returns Array of active validator addresses
   */
  async getActiveValidators(): Promise<string[]> {
    const currentSession = await this.getCurrentSession();
    const committee = await this.getSessionCommittee(currentSession);
    return committee.validators;
  }

  /**
   * Get next session validators (if available)
   *
   * @returns Array of next session validator addresses
   */
  async getNextSessionValidators(): Promise<string[]> {
    const nextSession = (await this.getCurrentSession()) + 1;
    try {
      const committee = await this.getSessionCommittee(nextSession);
      return committee.validators;
    } catch {
      // Next session not yet determined
      return [];
    }
  }

  /**
   * Monitor validator performance across multiple sessions
   *
   * @param validator - Validator address
   * @param sessions - Number of sessions to analyze (default: 10)
   * @returns Performance history
   */
  async getValidatorHistory(validator: string, sessions: number = 10): Promise<AbftScore[]> {
    const currentSession = await this.getCurrentSession();
    const startSession = Math.max(0, currentSession - sessions);

    const scores: AbftScore[] = [];
    for (let i = startSession; i <= currentSession; i++) {
      try {
        const sessionScores = await this.getAbftScores(i);
        const validatorScore = sessionScores.find((s) => s.validator === validator);
        if (validatorScore) {
          scores.push(validatorScore);
        }
      } catch {
        // Session data might not be available
        continue;
      }
    }

    return scores;
  }

  /**
   * Get session length in blocks
   *
   * @returns Number of blocks per session
   */
  async getSessionLength(): Promise<number> {
    const period = await this.api.consts.session.period;
    return (period as any).toNumber();
  }

  /**
   * Get time remaining in current session (in blocks)
   *
   * @returns Blocks remaining in session
   */
  async getSessionProgress(): Promise<{ current: number; total: number; remaining: number }> {
    const [currentBlock, sessionLength] = await Promise.all([
      this.api.query.system.number(),
      this.getSessionLength(),
    ]);

    const blockNumber = (currentBlock as any).toNumber();
    const current = blockNumber % sessionLength;

    return {
      current,
      total: sessionLength,
      remaining: sessionLength - current,
    };
  }

  /**
   * Get emergency finalizer authority (if set)
   * Emergency finalizer can finalize blocks in case of consensus failure
   *
   * @returns Emergency finalizer authority ID or null
   */
  async getEmergencyFinalizer(): Promise<string | null> {
    if (!this.api.query.aleph?.emergencyFinalizer) {
      return null;
    }

    const finalizer = await this.api.query.aleph.emergencyFinalizer();
    if (!finalizer || ('isNone' in finalizer && (finalizer as any).isNone)) {
      return null;
    }

    if ('unwrap' in finalizer) {
      return (finalizer as any).unwrap().toString();
    }

    return (finalizer as any).toString();
  }

  /**
   * Get queued emergency finalizer (will be active in N+1 session)
   *
   * @returns Queued emergency finalizer authority ID or null
   */
  async getQueuedEmergencyFinalizer(): Promise<string | null> {
    if (!this.api.query.aleph?.queuedEmergencyFinalizer) {
      return null;
    }

    const finalizer = await this.api.query.aleph.queuedEmergencyFinalizer();
    if (!finalizer || ('isNone' in finalizer && (finalizer as any).isNone)) {
      return null;
    }

    if ('unwrap' in finalizer) {
      return (finalizer as any).unwrap().toString();
    }

    return (finalizer as any).toString();
  }

  /**
   * Get scheduled finality version change (if any)
   *
   * @returns Scheduled version change info or null
   */
  async getScheduledFinalityVersionChange(): Promise<{ version: number; session: number } | null> {
    if (!this.api.query.aleph?.finalityScheduledVersionChange) {
      return null;
    }

    const change = await this.api.query.aleph.finalityScheduledVersionChange();
    if (!change || ('isNone' in change && (change as any).isNone)) {
      return null;
    }

    let versionChange;
    if ('unwrap' in change) {
      versionChange = (change as any).unwrap();
    } else {
      versionChange = change;
    }

    return {
      version: (versionChange.versionIncoming || versionChange.version_incoming)?.toNumber?.() || 0,
      session: versionChange.session?.toNumber?.() || 0,
    };
  }

  /**
   * Get inflation parameters
   *
   * @returns SEL cap and exponential inflation horizon
   */
  async getInflationParameters(): Promise<{ selCap: string; horizonMillisecs: string }> {
    const [selCap, horizon] = await Promise.all([
      this.api.query.aleph?.selCap ? this.api.query.aleph.selCap() : null,
      this.api.query.aleph?.exponentialInflationHorizon
        ? this.api.query.aleph.exponentialInflationHorizon()
        : null,
    ]);

    return {
      selCap: selCap?.toString() || '0',
      horizonMillisecs: horizon?.toString() || '0',
    };
  }

  // ========== Extrinsics ==========

  /**
   * Set emergency finalizer (requires root/sudo)
   * Emergency finalizer will be active from session N+2 onwards
   *
   * @param signer - Sudo account signer
   * @param emergencyFinalizerAuthorityId - Authority ID of emergency finalizer
   * @returns Transaction result
   */
  async setEmergencyFinalizer(
    signer: any,
    emergencyFinalizerAuthorityId: string,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.aleph?.setEmergencyFinalizer) {
      throw new Error('Aleph pallet not available');
    }

    const tx = this.api.tx.aleph.setEmergencyFinalizer(emergencyFinalizerAuthorityId);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }

  /**
   * Schedule finality version change (requires root/sudo)
   * Must be scheduled at least 2 sessions in advance
   *
   * @param signer - Sudo account signer
   * @param versionIncoming - New finality protocol version
   * @param session - Session index when version change should occur
   * @returns Transaction result
   */
  async scheduleFinalityVersionChange(
    signer: any,
    versionIncoming: number,
    session: number,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.aleph?.scheduleFinalityVersionChange) {
      throw new Error('Aleph pallet not available');
    }

    const tx = this.api.tx.aleph.scheduleFinalityVersionChange(versionIncoming, session);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }

  /**
   * Set inflation parameters (requires root/sudo)
   * Controls SEL token cap and exponential inflation horizon
   *
   * @param signer - Sudo account signer
   * @param selCap - Maximum SEL supply (optional, null to keep current)
   * @param horizonMillisecs - Inflation time horizon in milliseconds (optional, null to keep current)
   * @returns Transaction result
   */
  async setInflationParameters(
    signer: any,
    selCap: string | null,
    horizonMillisecs: string | null,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.aleph?.setInflationParameters) {
      throw new Error('Aleph pallet not available');
    }

    const tx = this.api.tx.aleph.setInflationParameters(selCap, horizonMillisecs);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }
}
