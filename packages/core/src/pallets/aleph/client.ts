/**
 * Aleph Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Aleph consensus pallet
 * Note: Aleph pallet is mostly read-only for regular users
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  AlephSessionInfo,
  FinalityState,
  BlockTimingInfo,
  AlephConstants,
  SessionChangeData,
  EraChangeData,
  FinalityData,
} from "./types.js";
import { AlephQueries } from "./queries.js";

/**
 * Aleph Manager - handles Aleph pallet interactions
 *
 * Note: The Aleph pallet is primarily for consensus and finality.
 * Most operations are read-only queries. Administrative functions
 * require root/sudo access.
 */
export class AlephManager {
  private queries: AlephQueries;

  constructor(private api: ApiPromise) {
    this.queries = new AlephQueries(api);
  }

  // ==========================================================================
  // Session & Authority Queries
  // ==========================================================================

  /**
   * Get current session information
   * @returns Aleph session info
   */
  async getSessionInfo(): Promise<AlephSessionInfo> {
    return this.queries.getAlephSessionInfo();
  }

  /**
   * Get current authorities
   */
  async getAuthorities() {
    return this.queries.authorities();
  }

  /**
   * Get next session authorities
   */
  async getNextAuthorities() {
    return this.queries.nextAuthorities();
  }

  /**
   * Get validators for a session
   * @param sessionIndex - Session index (optional, defaults to current)
   */
  async getSessionValidators(sessionIndex?: number) {
    return this.queries.getSessionValidators(sessionIndex);
  }

  /**
   * Get authority index for an account
   * @param accountId - Account to check
   * @returns Authority index or -1 if not an authority
   */
  async getAuthorityIndex(accountId: string): Promise<number> {
    return this.queries.getAuthorityIndex(accountId);
  }

  /**
   * Check if an account is a current authority
   * @param accountId - Account to check
   */
  async isAuthority(accountId: string): Promise<boolean> {
    return this.queries.isAuthority(accountId);
  }

  // ==========================================================================
  // Finality Queries
  // ==========================================================================

  /**
   * Get finality version
   */
  async getFinalityVersion() {
    return this.queries.finalityVersion();
  }

  /**
   * Get current finality state
   */
  async getFinalityState(): Promise<FinalityState> {
    return this.queries.getFinalityState();
  }

  /**
   * Get session index for a block number
   * @param blockNumber - Block number
   */
  async getSessionForBlock(blockNumber: number) {
    return this.queries.sessionForBlock(blockNumber);
  }

  /**
   * Get emergency state
   */
  async getEmergencyState() {
    return this.queries.emergencyFinalizer();
  }

  // ==========================================================================
  // Timing Queries
  // ==========================================================================

  /**
   * Get block timing information
   */
  async getBlockTimingInfo(): Promise<BlockTimingInfo> {
    return this.queries.getBlockTimingInfo();
  }

  /**
   * Get milliseconds per block
   */
  async getMillisPerBlock(): Promise<number> {
    return this.queries.millisPerBlock();
  }

  /**
   * Get session period in blocks
   */
  async getSessionPeriod(): Promise<number> {
    return this.queries.sessionPeriod();
  }

  /**
   * Get Aleph constants
   */
  async getConstants(): Promise<AlephConstants> {
    return this.queries.getConstants();
  }

  // ==========================================================================
  // Subscriptions
  // ==========================================================================

  /**
   * Subscribe to session changes
   * @param callback - Callback when session changes
   * @returns Unsubscribe function
   */
  async subscribeToSessionChange(
    callback: (data: SessionChangeData) => void
  ): Promise<() => void> {
    let previousSessionIndex = -1;

    const unsub = await this.api.query.session.currentIndex(
      async (newIndex: any) => {
        const newSessionIndex = parseInt(newIndex.toString(), 10);

        if (
          previousSessionIndex >= 0 &&
          newSessionIndex !== previousSessionIndex
        ) {
          const validators = await this.queries.getSessionValidators();

          callback({
            newSessionIndex,
            previousSessionIndex,
            validators,
          });
        }

        previousSessionIndex = newSessionIndex;
      }
    );

    return unsub as unknown as () => void;
  }

  /**
   * Subscribe to era changes
   * @param callback - Callback when era changes
   * @returns Unsubscribe function
   */
  async subscribeToEraChange(
    callback: (data: EraChangeData) => void
  ): Promise<() => void> {
    let previousEraIndex = -1;

    const unsub = await this.api.query.staking.activeEra(async (era: any) => {
      if (!era || era.isNone) return;

      const unwrapped = era.unwrap ? era.unwrap() : era;
      const newEraIndex = parseInt(unwrapped.index?.toString() || "0", 10);

      if (previousEraIndex >= 0 && newEraIndex !== previousEraIndex) {
        callback({
          newEraIndex,
          previousEraIndex,
        });
      }

      previousEraIndex = newEraIndex;
    });

    return unsub as unknown as () => void;
  }

  /**
   * Subscribe to finalized blocks
   * @param callback - Callback when block is finalized
   * @returns Unsubscribe function
   */
  async subscribeToFinality(
    callback: (data: FinalityData) => void
  ): Promise<() => void> {
    const unsub = await this.api.rpc.chain.subscribeFinalizedHeads(
      async (header: any) => {
        callback({
          blockNumber: header.number.toNumber(),
          blockHash: header.hash.toString(),
        });
      }
    );

    return unsub as unknown as () => void;
  }

  /**
   * Subscribe to new blocks (not finalized)
   * @param callback - Callback when new block arrives
   * @returns Unsubscribe function
   */
  async subscribeToNewBlocks(
    callback: (data: FinalityData) => void
  ): Promise<() => void> {
    const unsub = await this.api.rpc.chain.subscribeNewHeads(
      async (header: any) => {
        callback({
          blockNumber: header.number.toNumber(),
          blockHash: header.hash.toString(),
        });
      }
    );

    return unsub as unknown as () => void;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Wait for block finalization
   * @param blockNumber - Block number to wait for
   * @param timeout - Timeout in milliseconds (default: 60000)
   * @returns True if finalized, false if timeout
   */
  async waitForFinalization(
    blockNumber: number,
    timeout = 60000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const state = await this.getFinalityState();

      if (state.finalizedBlock >= blockNumber) {
        return true;
      }

      // Wait for next finalized block
      await this.sleep(1000);
    }

    return false;
  }

  /**
   * Get estimated time until session end
   * @returns Time in milliseconds until session ends
   */
  async getTimeUntilSessionEnd(): Promise<number> {
    const [header, timing, currentSession] = await Promise.all([
      this.api.rpc.chain.getHeader(),
      this.getBlockTimingInfo(),
      this.queries.getCurrentSession(),
    ]);

    const currentBlock = header.number.toNumber();
    const sessionStartBlock =
      currentSession.sessionIndex * timing.sessionPeriod;
    const sessionEndBlock = sessionStartBlock + timing.sessionPeriod;
    const blocksRemaining = sessionEndBlock - currentBlock;

    return blocksRemaining * timing.millisPerBlock;
  }

  /**
   * Get estimated time until era end
   * @returns Time in milliseconds until era ends
   */
  async getTimeUntilEraEnd(): Promise<number> {
    try {
      const [header, timing] = await Promise.all([
        this.api.rpc.chain.getHeader(),
        this.getBlockTimingInfo(),
      ]);

      // Get sessions per era
      let sessionsPerEra = 6;
      try {
        const constant = this.api.consts.staking?.sessionsPerEra;
        if (constant) {
          sessionsPerEra = parseInt(constant.toString(), 10);
        }
      } catch {
        // Use default
      }

      const currentBlock = header.number.toNumber();
      const blocksPerEra = timing.sessionPeriod * sessionsPerEra;
      const currentEra = Math.floor(currentBlock / blocksPerEra);
      const eraEndBlock = (currentEra + 1) * blocksPerEra;
      const blocksRemaining = eraEndBlock - currentBlock;

      return blocksRemaining * timing.millisPerBlock;
    } catch {
      return 0;
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
