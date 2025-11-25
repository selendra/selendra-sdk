/**
 * Aleph Pallet Storage Queries
 *
 * Query functions for Aleph consensus pallet storage
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  AuthorityInfo,
  AuthoritiesInfo,
  AlephSessionInfo,
  SessionForBlockResult,
  FinalityVersionInfo,
  FinalityState,
  BlockTimingInfo,
  EmergencyState,
  CurrentSessionResult,
  AlephConstants,
} from "./types.js";

/**
 * Aleph storage queries
 */
export class AlephQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get the current finality version
   * @returns Finality version info
   */
  async finalityVersion(): Promise<FinalityVersionInfo> {
    try {
      const result = await this.api.query.aleph.finalityVersion();
      return {
        version: parseInt(result.toString(), 10),
      };
    } catch {
      // Fallback for older versions
      return { version: 0 };
    }
  }

  /**
   * Get the session index for a given block number
   * @param blockNumber - Block number to query
   * @returns Session for block result
   */
  async sessionForBlock(blockNumber: number): Promise<SessionForBlockResult> {
    // Calculate session based on session period
    const sessionPeriod = await this.getSessionPeriod();
    const sessionIndex = Math.floor(blockNumber / sessionPeriod);

    return {
      blockNumber,
      sessionIndex,
    };
  }

  /**
   * Get current authorities
   * @returns Authorities info
   */
  async authorities(): Promise<AuthoritiesInfo> {
    try {
      const result = await this.api.query.aleph.authorities();
      const authorities = (result as any).map((auth: any, index: number) => ({
        account: auth.toString(),
        index,
      }));

      return {
        authorities,
        count: authorities.length,
      };
    } catch {
      // Fallback to session validators
      const validators = await this.api.query.session.validators();
      const authorities = (validators as any).map((v: any, index: number) => ({
        account: v.toString(),
        index,
      }));

      return {
        authorities,
        count: authorities.length,
      };
    }
  }

  /**
   * Get next session authorities
   * @returns Authorities info for next session
   */
  async nextAuthorities(): Promise<AuthoritiesInfo> {
    try {
      const result = await this.api.query.aleph.nextAuthorities();
      const authorities = (result as any).map((auth: any, index: number) => ({
        account: auth.toString(),
        index,
      }));

      return {
        authorities,
        count: authorities.length,
      };
    } catch {
      // Fallback to queued keys
      const queuedKeys = await this.api.query.session.queuedKeys();
      const authorities = (queuedKeys as any).map(
        (item: any, index: number) => ({
          account: item[0].toString(),
          index,
        })
      );

      return {
        authorities,
        count: authorities.length,
      };
    }
  }

  /**
   * Get milliseconds per block
   * @returns Block time in milliseconds
   */
  async millisPerBlock(): Promise<number> {
    try {
      const result = this.api.consts.aleph?.millisPerBlock;
      if (result) {
        return parseInt(result.toString(), 10);
      }
    } catch {
      // Use default
    }

    // Try timestamp minimum period (half the block time)
    try {
      const minPeriod = this.api.consts.timestamp?.minimumPeriod;
      if (minPeriod) {
        return parseInt(minPeriod.toString(), 10) * 2;
      }
    } catch {
      // Use default
    }

    return 6000; // Default 6 seconds
  }

  /**
   * Get session period in blocks
   * @returns Session period
   */
  async sessionPeriod(): Promise<number> {
    return this.getSessionPeriod();
  }

  /**
   * Get emergency finalizer if active
   * @returns Emergency state
   */
  async emergencyFinalizer(): Promise<EmergencyState> {
    try {
      const result = await this.api.query.aleph.emergencyFinalizer();
      const finalizer = result as any;

      if (!finalizer || finalizer.isNone) {
        return { isEmergency: false };
      }

      return {
        isEmergency: true,
        emergencyFinalizer: finalizer.unwrap
          ? finalizer.unwrap().toString()
          : finalizer.toString(),
      };
    } catch {
      return { isEmergency: false };
    }
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Get current session info
   * @returns Current session result
   */
  async getCurrentSession(): Promise<CurrentSessionResult> {
    const sessionIndex = await this.api.query.session.currentIndex();

    let eraIndex: number | undefined;
    try {
      const activeEra = await this.api.query.staking?.activeEra?.();
      if (activeEra && !(activeEra as any).isNone) {
        const era = (activeEra as any).unwrap
          ? (activeEra as any).unwrap()
          : activeEra;
        eraIndex = parseInt(era.index?.toString() || "0", 10);
      }
    } catch {
      // Era not available
    }

    return {
      sessionIndex: parseInt(sessionIndex.toString(), 10),
      eraIndex,
    };
  }

  /**
   * Get validators for a specific session
   * @param sessionIndex - Session index (0 for current)
   * @returns List of validators
   */
  async getSessionValidators(sessionIndex?: number): Promise<string[]> {
    if (sessionIndex === undefined || sessionIndex === 0) {
      const validators = await this.api.query.session.validators();
      return (validators as any).map((v: any) => v.toString());
    }

    // Historical session validators would need archive node
    // Return current validators as fallback
    const validators = await this.api.query.session.validators();
    return (validators as any).map((v: any) => v.toString());
  }

  /**
   * Get authority index for an account
   * @param accountId - Account to check
   * @returns Authority index or -1 if not an authority
   */
  async getAuthorityIndex(accountId: string): Promise<number> {
    const authoritiesInfo = await this.authorities();

    const authority = authoritiesInfo.authorities.find(
      (a) => a.account === accountId
    );

    return authority?.index ?? -1;
  }

  /**
   * Check if an account is a current authority
   * @param accountId - Account to check
   * @returns True if authority
   */
  async isAuthority(accountId: string): Promise<boolean> {
    const index = await this.getAuthorityIndex(accountId);
    return index >= 0;
  }

  /**
   * Get Aleph session info
   * @returns Aleph session info
   */
  async getAlephSessionInfo(): Promise<AlephSessionInfo> {
    const [currentSession, authorities, nextAuthorities, sessionPeriod] =
      await Promise.all([
        this.getCurrentSession(),
        this.authorities(),
        this.nextAuthorities(),
        this.getSessionPeriod(),
      ]);

    return {
      sessionIndex: currentSession.sessionIndex,
      sessionPeriod,
      validators: authorities.authorities.map((a) => a.account),
      nextValidators: nextAuthorities.authorities.map((a) => a.account),
    };
  }

  /**
   * Get block timing info
   * @returns Block timing info
   */
  async getBlockTimingInfo(): Promise<BlockTimingInfo> {
    const [millisPerBlock, sessionPeriod] = await Promise.all([
      this.millisPerBlock(),
      this.getSessionPeriod(),
    ]);

    return {
      millisPerBlock,
      sessionPeriod,
      sessionDurationMs: millisPerBlock * sessionPeriod,
    };
  }

  /**
   * Get finality state
   * @returns Finality state
   */
  async getFinalityState(): Promise<FinalityState> {
    const [finalizedHead, head] = await Promise.all([
      this.api.rpc.chain.getFinalizedHead(),
      this.api.rpc.chain.getHeader(),
    ]);

    const finalizedHeader = await this.api.rpc.chain.getHeader(finalizedHead);
    const finalizedBlock = finalizedHeader.number.toNumber();
    const headBlock = head.number.toNumber();

    return {
      finalizedBlock,
      headBlock,
      finalityLag: headBlock - finalizedBlock,
    };
  }

  /**
   * Get Aleph constants
   * @returns Aleph constants
   */
  async getConstants(): Promise<AlephConstants> {
    const [millisPerBlock, sessionPeriod, finalityVersion] = await Promise.all([
      this.millisPerBlock(),
      this.getSessionPeriod(),
      this.finalityVersion(),
    ]);

    return {
      millisPerBlock,
      sessionPeriod,
      finalityVersion: finalityVersion.version,
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Get session period from constants
   */
  private async getSessionPeriod(): Promise<number> {
    try {
      const period = this.api.consts.aleph?.sessionPeriod;
      if (period) {
        return parseInt(period.toString(), 10);
      }
    } catch {
      // Try alternative
    }

    // Default session period
    return 900; // 900 blocks ~ 90 minutes at 6s blocks
  }
}
