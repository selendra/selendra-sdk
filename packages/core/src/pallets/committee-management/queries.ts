/**
 * Committee Management Pallet Queries
 *
 * Query functions for Selendra's committee management pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  BanInfo,
  BanReason,
  ProductionBanConfig,
  FinalityBanConfig,
  SessionValidators,
  CurrentAndNextSessionValidators,
  ValidatorPerformance,
  CommitteeManagementConfig,
  BannedValidatorsInfo,
  ValidatorBlockCount,
} from "./types.js";

/**
 * Committee Management Queries - read-only queries for committee management pallet
 */
export class CommitteeManagementQueries {
  constructor(private api: ApiPromise) {}

  // ==========================================================================
  // Storage Queries
  // ==========================================================================

  /**
   * Get lenient threshold (performance threshold for lenient mode)
   * @returns Lenient threshold as percentage (0-100)
   */
  async lenientThreshold(): Promise<number> {
    const result = await (
      this.api.query as any
    ).committeeManagement?.lenientThreshold?.();
    if (!result) return 90; // default
    // Result is Perquintill (quintillionths), convert to percentage
    const value = BigInt(result.toString());
    return Number((value * 100n) / 1_000_000_000_000_000_000n);
  }

  /**
   * Get production ban config
   * @returns Production ban configuration
   */
  async productionBanConfig(): Promise<ProductionBanConfig> {
    const result = await (
      this.api.query as any
    ).committeeManagement?.productionBanConfig?.();
    return this.parseProductionBanConfig(result);
  }

  /**
   * Get finality ban config
   * @returns Finality ban configuration
   */
  async finalityBanConfig(): Promise<FinalityBanConfig> {
    const result = await (
      this.api.query as any
    ).committeeManagement?.finalityBanConfig?.();
    return this.parseFinalityBanConfig(result);
  }

  /**
   * Get block count for a validator in current session
   * @param accountId - Validator account
   * @returns Number of blocks produced
   */
  async sessionValidatorBlockCount(accountId: string): Promise<number> {
    const result = await (
      this.api.query as any
    ).committeeManagement?.sessionValidatorBlockCount?.(accountId);
    return parseInt(result?.toString() || "0", 10);
  }

  /**
   * Get underperformed producer session count for a validator
   * @param accountId - Validator account
   * @returns Number of underperformed sessions
   */
  async underperformedValidatorSessionCount(
    accountId: string
  ): Promise<number> {
    const result = await (
      this.api.query as any
    ).committeeManagement?.underperformedValidatorSessionCount?.(accountId);
    return parseInt(result?.toString() || "0", 10);
  }

  /**
   * Get underperformed finalizer session count for a validator
   * @param accountId - Validator account
   * @returns Number of underperformed finality sessions
   */
  async underperformedFinalizerSessionCount(
    accountId: string
  ): Promise<number> {
    const result = await (
      this.api.query as any
    ).committeeManagement?.underperformedFinalizerSessionCount?.(accountId);
    return parseInt(result?.toString() || "0", 10);
  }

  /**
   * Get ban info for a validator
   * @param accountId - Validator account
   * @returns Ban info or null if not banned
   */
  async banned(accountId: string): Promise<BanInfo | null> {
    const result = await (this.api.query as any).committeeManagement?.banned?.(
      accountId
    );
    if (!result || result.isEmpty || result.isNone) return null;
    return this.parseBanInfo(result.unwrap ? result.unwrap() : result);
  }

  /**
   * Get current and next session validators
   * @returns Current and next session validators structure
   */
  async currentAndNextSessionValidators(): Promise<CurrentAndNextSessionValidators> {
    const result = await (
      this.api.query as any
    ).committeeManagement?.currentAndNextSessionValidatorsStorage?.();
    return this.parseCurrentAndNextSessionValidators(result);
  }

  /**
   * Get validator era total rewards
   * @returns Map of validator account to total reward
   */
  async validatorEraTotalReward(): Promise<Map<string, number>> {
    const result = await (
      this.api.query as any
    ).committeeManagement?.validatorEraTotalReward?.();

    if (!result || result.isEmpty || result.isNone) {
      return new Map();
    }

    const rewards = new Map<string, number>();
    const data = result.unwrap ? result.unwrap() : result;
    const entries = data?.toJSON?.() || data;

    if (Array.isArray(entries)) {
      for (const [account, reward] of entries) {
        rewards.set(account, parseInt(reward.toString(), 10));
      }
    } else if (typeof entries === "object") {
      for (const [account, reward] of Object.entries(entries)) {
        rewards.set(account, parseInt(String(reward), 10));
      }
    }

    return rewards;
  }

  // ==========================================================================
  // Derived Queries
  // ==========================================================================

  /**
   * Check if a validator is banned
   * @param accountId - Validator account
   * @returns True if banned
   */
  async isBanned(accountId: string): Promise<boolean> {
    const banInfo = await this.banned(accountId);
    return banInfo !== null;
  }

  /**
   * Get all banned validators
   * @returns List of banned validators with their ban info
   */
  async getAllBannedValidators(): Promise<BannedValidatorsInfo> {
    const validators: Array<{ accountId: string; banInfo: BanInfo }> = [];

    try {
      const entries = await (
        this.api.query as any
      ).committeeManagement?.banned?.entries?.();

      if (entries) {
        for (const [key, value] of entries) {
          if (value && !value.isEmpty && !value.isNone) {
            const accountId = key.args[0].toString();
            const banInfo = this.parseBanInfo(
              value.unwrap ? value.unwrap() : value
            );
            validators.push({ accountId, banInfo });
          }
        }
      }
    } catch {
      // Entries query not available
    }

    return {
      count: validators.length,
      validators,
    };
  }

  /**
   * Get current session validators
   * @returns Current session validators
   */
  async getCurrentSessionValidators(): Promise<SessionValidators> {
    const data = await this.currentAndNextSessionValidators();
    return data.current;
  }

  /**
   * Get next session validators
   * @returns Next session validators
   */
  async getNextSessionValidators(): Promise<SessionValidators> {
    const data = await this.currentAndNextSessionValidators();
    return data.next;
  }

  /**
   * Get committee management configuration
   * @returns Full configuration
   */
  async getConfig(): Promise<CommitteeManagementConfig> {
    // Get constants
    let sessionPeriod = 900; // default
    let maxValidators = 100; // default

    try {
      const sessionPeriodConst = (this.api.consts as any).committeeManagement
        ?.sessionPeriod;
      if (sessionPeriodConst) {
        sessionPeriod = parseInt(sessionPeriodConst.toString(), 10);
      }
    } catch {
      // Use default
    }

    try {
      const maxValidatorsConst = (this.api.consts as any).committeeManagement
        ?.maxValidators;
      if (maxValidatorsConst) {
        maxValidators = parseInt(maxValidatorsConst.toString(), 10);
      }
    } catch {
      // Use default
    }

    const [productionBanConfig, finalityBanConfig, lenientThreshold] =
      await Promise.all([
        this.productionBanConfig(),
        this.finalityBanConfig(),
        this.lenientThreshold(),
      ]);

    return {
      sessionPeriod,
      maxValidators,
      productionBanConfig,
      finalityBanConfig,
      lenientThreshold,
    };
  }

  /**
   * Get validator performance info
   * @param accountId - Validator account
   * @returns Validator performance metrics
   */
  async getValidatorPerformance(
    accountId: string
  ): Promise<ValidatorPerformance> {
    const [
      blocksProduced,
      underperformedProductionSessions,
      underperformedFinalitySessions,
      productionConfig,
    ] = await Promise.all([
      this.sessionValidatorBlockCount(accountId),
      this.underperformedValidatorSessionCount(accountId),
      this.underperformedFinalizerSessionCount(accountId),
      this.productionBanConfig(),
    ]);

    // Estimate expected blocks (this is approximate)
    const config = await this.getConfig();
    const currentValidators = await this.getCurrentSessionValidators();
    const totalProducers = currentValidators.producers.length || 1;
    const expectedBlocks = Math.floor(config.sessionPeriod / totalProducers);

    const performanceRatio =
      expectedBlocks > 0 ? blocksProduced / expectedBlocks : 1;

    const atRiskOfBan =
      underperformedProductionSessions >=
        productionConfig.underperformedSessionCountThreshold - 1 ||
      underperformedFinalitySessions >=
        productionConfig.underperformedSessionCountThreshold - 1;

    return {
      accountId,
      blocksProduced,
      expectedBlocks,
      performanceRatio,
      underperformedProductionSessions,
      underperformedFinalitySessions,
      atRiskOfBan,
    };
  }

  /**
   * Get all validators' block counts for current session
   * @returns Array of validator block counts
   */
  async getAllValidatorBlockCounts(): Promise<ValidatorBlockCount[]> {
    const counts: ValidatorBlockCount[] = [];

    try {
      const entries = await (
        this.api.query as any
      ).committeeManagement?.sessionValidatorBlockCount?.entries?.();

      if (entries) {
        for (const [key, value] of entries) {
          counts.push({
            accountId: key.args[0].toString(),
            blockCount: parseInt(value.toString(), 10),
          });
        }
      }
    } catch {
      // Entries query not available
    }

    return counts;
  }

  /**
   * Get time until ban expires for a validator
   * @param accountId - Validator account
   * @returns Number of eras until ban expires, or null if not banned
   */
  async getBanExpiryEras(accountId: string): Promise<number | null> {
    const banInfo = await this.banned(accountId);
    if (!banInfo) return null;

    // Get current era
    let currentEra = 0;
    try {
      const activeEra = await this.api.query.staking.activeEra();
      if (activeEra && !activeEra.isEmpty) {
        const unwrapped = (activeEra as any).unwrap
          ? (activeEra as any).unwrap()
          : activeEra;
        currentEra = parseInt(unwrapped.index?.toString() || "0", 10);
      }
    } catch {
      // Could not get current era
    }

    // Get ban period from config
    const config = await this.productionBanConfig();
    const banEndEra = banInfo.start + config.banPeriod;

    if (currentEra >= banEndEra) return 0;
    return banEndEra - currentEra;
  }

  // ==========================================================================
  // Subscription Methods
  // ==========================================================================

  /**
   * Subscribe to production ban config changes
   * @param callback - Callback when config changes
   * @returns Unsubscribe function
   */
  async subscribeToProductionBanConfig(
    callback: (config: ProductionBanConfig) => void
  ): Promise<() => void> {
    const unsub = await (
      this.api.query as any
    ).committeeManagement?.productionBanConfig?.((result: any) => {
      callback(this.parseProductionBanConfig(result));
    });
    return unsub as unknown as () => void;
  }

  /**
   * Subscribe to ban changes for a specific validator
   * @param accountId - Validator account
   * @param callback - Callback when ban status changes
   * @returns Unsubscribe function
   */
  async subscribeToBan(
    accountId: string,
    callback: (banInfo: BanInfo | null) => void
  ): Promise<() => void> {
    const unsub = await (this.api.query as any).committeeManagement?.banned?.(
      accountId,
      (result: any) => {
        if (!result || result.isEmpty || result.isNone) {
          callback(null);
        } else {
          callback(this.parseBanInfo(result.unwrap ? result.unwrap() : result));
        }
      }
    );
    return unsub as unknown as () => void;
  }

  /**
   * Subscribe to session validators changes
   * @param callback - Callback when validators change
   * @returns Unsubscribe function
   */
  async subscribeToSessionValidators(
    callback: (validators: CurrentAndNextSessionValidators) => void
  ): Promise<() => void> {
    const unsub = await (
      this.api.query as any
    ).committeeManagement?.currentAndNextSessionValidatorsStorage?.(
      (result: any) => {
        callback(this.parseCurrentAndNextSessionValidators(result));
      }
    );
    return unsub as unknown as () => void;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Parse production ban config from raw result
   */
  private parseProductionBanConfig(result: any): ProductionBanConfig {
    if (!result) {
      return {
        minimalExpectedPerformance: 80,
        underperformedSessionCountThreshold: 3,
        cleanSessionCounterDelay: 2,
        banPeriod: 10,
      };
    }

    const json = result.toJSON?.() || result;
    return {
      minimalExpectedPerformance: this.perbillToPercent(
        json.minimalExpectedPerformance ??
          json.minimal_expected_performance ??
          800_000_000
      ),
      underperformedSessionCountThreshold:
        json.underperformedSessionCountThreshold ??
        json.underperformed_session_count_threshold ??
        3,
      cleanSessionCounterDelay:
        json.cleanSessionCounterDelay ?? json.clean_session_counter_delay ?? 2,
      banPeriod: json.banPeriod ?? json.ban_period ?? 10,
    };
  }

  /**
   * Parse finality ban config from raw result
   */
  private parseFinalityBanConfig(result: any): FinalityBanConfig {
    if (!result) {
      return {
        minimalExpectedPerformance: 100,
        underperformedSessionCountThreshold: 3,
        banPeriod: 10,
        cleanSessionCounterDelay: 2,
      };
    }

    const json = result.toJSON?.() || result;
    return {
      minimalExpectedPerformance:
        json.minimalExpectedPerformance ??
        json.minimal_expected_performance ??
        100,
      underperformedSessionCountThreshold:
        json.underperformedSessionCountThreshold ??
        json.underperformed_session_count_threshold ??
        3,
      banPeriod: json.banPeriod ?? json.ban_period ?? 10,
      cleanSessionCounterDelay:
        json.cleanSessionCounterDelay ?? json.clean_session_counter_delay ?? 2,
    };
  }

  /**
   * Parse ban info from raw result
   */
  private parseBanInfo(result: any): BanInfo {
    const json = result.toJSON?.() || result;
    return {
      reason: this.parseBanReason(json.reason),
      start: json.start ?? 0,
    };
  }

  /**
   * Parse ban reason from raw result
   */
  private parseBanReason(reason: any): BanReason {
    if (!reason) {
      return { type: "OtherReason", description: "Unknown" };
    }

    if (reason.InsufficientProduction !== undefined) {
      return {
        type: "InsufficientProduction",
        sessionCount: reason.InsufficientProduction,
      };
    }

    if (reason.insufficientProduction !== undefined) {
      return {
        type: "InsufficientProduction",
        sessionCount: reason.insufficientProduction,
      };
    }

    if (reason.InsufficientFinalization !== undefined) {
      return {
        type: "InsufficientFinalization",
        sessionCount: reason.InsufficientFinalization,
      };
    }

    if (reason.insufficientFinalization !== undefined) {
      return {
        type: "InsufficientFinalization",
        sessionCount: reason.insufficientFinalization,
      };
    }

    if (reason.OtherReason !== undefined) {
      const desc = reason.OtherReason;
      return {
        type: "OtherReason",
        description: typeof desc === "string" ? desc : this.hexToString(desc),
      };
    }

    if (reason.otherReason !== undefined) {
      const desc = reason.otherReason;
      return {
        type: "OtherReason",
        description: typeof desc === "string" ? desc : this.hexToString(desc),
      };
    }

    return { type: "OtherReason", description: "Unknown" };
  }

  /**
   * Parse current and next session validators from raw result
   */
  private parseCurrentAndNextSessionValidators(
    result: any
  ): CurrentAndNextSessionValidators {
    if (!result) {
      return {
        current: { producers: [], finalizers: [], nonCommittee: [] },
        next: { producers: [], finalizers: [], nonCommittee: [] },
      };
    }

    const json = result.toJSON?.() || result;
    return {
      current: this.parseSessionValidators(json.current),
      next: this.parseSessionValidators(json.next),
    };
  }

  /**
   * Parse session validators from raw result
   */
  private parseSessionValidators(data: any): SessionValidators {
    if (!data) {
      return { producers: [], finalizers: [], nonCommittee: [] };
    }

    return {
      producers: data.producers || [],
      finalizers: data.finalizers || [],
      nonCommittee: data.nonCommittee ?? data.non_committee ?? [],
    };
  }

  /**
   * Convert Perbill to percentage
   */
  private perbillToPercent(perbill: number): number {
    // Perbill is parts per billion (1_000_000_000)
    return Math.round(perbill / 10_000_000);
  }

  /**
   * Convert hex string to regular string
   */
  private hexToString(hex: string | number[]): string {
    if (Array.isArray(hex)) {
      return String.fromCharCode(...hex);
    }
    if (typeof hex !== "string") {
      return String(hex);
    }
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    let str = "";
    for (let i = 0; i < cleanHex.length; i += 2) {
      str += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
    }
    return str;
  }
}
