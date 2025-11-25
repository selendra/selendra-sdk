/**
 * Committee Management Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Selendra's committee management pallet
 * Note: Most operations require AdminOrigin (root or governance)
 */

import type { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";
import type {
  BanInfo,
  ProductionBanConfig,
  FinalityBanConfig,
  SessionValidators,
  CurrentAndNextSessionValidators,
  SetProductionBanConfigParams,
  SetFinalityBanConfigParams,
  BanFromCommitteeParams,
  CancelBanParams,
  SetLenientThresholdParams,
  ValidatorPerformance,
  CommitteeManagementConfig,
  BannedValidatorsInfo,
} from "./types.js";
import { CommitteeManagementQueries } from "./queries.js";

/**
 * Transaction result type
 */
export interface CommitteeManagementTxResult {
  /** Whether the transaction was successful */
  success: boolean;
  /** Transaction hash */
  txHash?: string;
  /** Block hash where tx was included */
  blockHash?: string;
  /** Error message if failed */
  error?: string;
  /** Events emitted */
  events?: any[];
}

/**
 * Committee Management Manager - handles committee management pallet transactions
 *
 * Note: Most extrinsics in this pallet require AdminOrigin (root or governance).
 * Regular users can only query committee state.
 */
export class CommitteeManagementManager {
  private queries: CommitteeManagementQueries;

  constructor(private api: ApiPromise) {
    this.queries = new CommitteeManagementQueries(api);
  }

  // ==========================================================================
  // Admin Extrinsics (Require Root/Governance Origin)
  // ==========================================================================

  /**
   * Set production (block production) ban configuration
   * Requires admin/root origin
   *
   * @param params - Ban config parameters
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setProductionBanConfig(
    params: SetProductionBanConfigParams,
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    try {
      const tx = (this.api.tx as any).committeeManagement.setBanConfig(
        params.minimalExpectedPerformance ?? null,
        params.underperformedSessionCountThreshold ?? null,
        params.cleanSessionCounterDelay ?? null,
        params.banPeriod ?? null
      );

      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Set finality ban configuration
   * Requires admin/root origin
   *
   * @param params - Finality ban config parameters
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setFinalityBanConfig(
    params: SetFinalityBanConfigParams,
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    try {
      const tx = (this.api.tx as any).committeeManagement.setFinalityBanConfig(
        params.minimalExpectedPerformance ?? null,
        params.underperformedSessionCountThreshold ?? null,
        params.banPeriod ?? null,
        params.cleanSessionCounterDelay ?? null
      );

      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Ban a validator from the committee
   * Requires admin/root origin
   *
   * @param params - Ban parameters
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async banFromCommittee(
    params: BanFromCommitteeParams,
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    try {
      // Convert reason to bytes
      const reasonBytes = this.stringToBytes(params.banReason);

      const tx = (this.api.tx as any).committeeManagement.banFromCommittee(
        params.banned,
        reasonBytes
      );

      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cancel a validator's ban
   * Requires admin/root origin
   *
   * @param params - Cancel ban parameters
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async cancelBan(
    params: CancelBanParams,
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    try {
      const tx = (this.api.tx as any).committeeManagement.cancelBan(
        params.banned
      );

      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Set lenient threshold for performance evaluation
   * Requires admin/root origin
   *
   * @param params - Threshold parameters
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setLenientThreshold(
    params: SetLenientThresholdParams,
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    try {
      if (params.thresholdPercent > 100 || params.thresholdPercent < 0) {
        return {
          success: false,
          error: "Threshold must be between 0 and 100",
        };
      }

      const tx = (this.api.tx as any).committeeManagement.setLenientThreshold(
        params.thresholdPercent
      );

      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Batch Operations
  // ==========================================================================

  /**
   * Ban multiple validators at once
   * Requires admin/root origin
   *
   * @param validators - Array of validators to ban with their reasons
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async banMultipleValidators(
    validators: Array<{ accountId: string; reason: string }>,
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    try {
      const calls = validators.map(({ accountId, reason }) => {
        const reasonBytes = this.stringToBytes(reason);
        return (this.api.tx as any).committeeManagement.banFromCommittee(
          accountId,
          reasonBytes
        );
      });

      const batchTx = this.api.tx.utility.batchAll(calls);

      return await this.signAndSend(batchTx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cancel bans for multiple validators
   * Requires admin/root origin
   *
   * @param validators - Array of validator accounts to unban
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async cancelMultipleBans(
    validators: string[],
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    try {
      const calls = validators.map((accountId) =>
        (this.api.tx as any).committeeManagement.cancelBan(accountId)
      );

      const batchTx = this.api.tx.utility.batchAll(calls);

      return await this.signAndSend(batchTx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update all ban configurations at once
   * Requires admin/root origin
   *
   * @param config - Full ban configuration
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async updateAllBanConfigs(
    config: {
      productionBanConfig?: SetProductionBanConfigParams;
      finalityBanConfig?: SetFinalityBanConfigParams;
      lenientThreshold?: number;
    },
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    try {
      const calls: any[] = [];

      if (config.productionBanConfig) {
        calls.push(
          (this.api.tx as any).committeeManagement.setBanConfig(
            config.productionBanConfig.minimalExpectedPerformance ?? null,
            config.productionBanConfig.underperformedSessionCountThreshold ??
              null,
            config.productionBanConfig.cleanSessionCounterDelay ?? null,
            config.productionBanConfig.banPeriod ?? null
          )
        );
      }

      if (config.finalityBanConfig) {
        calls.push(
          (this.api.tx as any).committeeManagement.setFinalityBanConfig(
            config.finalityBanConfig.minimalExpectedPerformance ?? null,
            config.finalityBanConfig.underperformedSessionCountThreshold ??
              null,
            config.finalityBanConfig.banPeriod ?? null,
            config.finalityBanConfig.cleanSessionCounterDelay ?? null
          )
        );
      }

      if (config.lenientThreshold !== undefined) {
        calls.push(
          (this.api.tx as any).committeeManagement.setLenientThreshold(
            config.lenientThreshold
          )
        );
      }

      if (calls.length === 0) {
        return {
          success: false,
          error: "No configuration changes specified",
        };
      }

      const batchTx = this.api.tx.utility.batchAll(calls);

      return await this.signAndSend(batchTx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Query Passthrough (for convenience)
  // ==========================================================================

  /**
   * Check if a validator is banned
   */
  async isBanned(accountId: string): Promise<boolean> {
    return this.queries.isBanned(accountId);
  }

  /**
   * Get ban info for a validator
   */
  async getBanInfo(accountId: string): Promise<BanInfo | null> {
    return this.queries.banned(accountId);
  }

  /**
   * Get all banned validators
   */
  async getAllBannedValidators(): Promise<BannedValidatorsInfo> {
    return this.queries.getAllBannedValidators();
  }

  /**
   * Get production ban config
   */
  async getProductionBanConfig(): Promise<ProductionBanConfig> {
    return this.queries.productionBanConfig();
  }

  /**
   * Get finality ban config
   */
  async getFinalityBanConfig(): Promise<FinalityBanConfig> {
    return this.queries.finalityBanConfig();
  }

  /**
   * Get lenient threshold
   */
  async getLenientThreshold(): Promise<number> {
    return this.queries.lenientThreshold();
  }

  /**
   * Get current session validators
   */
  async getCurrentSessionValidators(): Promise<SessionValidators> {
    return this.queries.getCurrentSessionValidators();
  }

  /**
   * Get next session validators
   */
  async getNextSessionValidators(): Promise<SessionValidators> {
    return this.queries.getNextSessionValidators();
  }

  /**
   * Get full session validators info
   */
  async getSessionValidatorsInfo(): Promise<CurrentAndNextSessionValidators> {
    return this.queries.currentAndNextSessionValidators();
  }

  /**
   * Get validator performance
   */
  async getValidatorPerformance(
    accountId: string
  ): Promise<ValidatorPerformance> {
    return this.queries.getValidatorPerformance(accountId);
  }

  /**
   * Get committee management config
   */
  async getConfig(): Promise<CommitteeManagementConfig> {
    return this.queries.getConfig();
  }

  /**
   * Get time until ban expires
   */
  async getBanExpiryEras(accountId: string): Promise<number | null> {
    return this.queries.getBanExpiryEras(accountId);
  }

  // ==========================================================================
  // Validation Helpers
  // ==========================================================================

  /**
   * Validate production ban config values
   * @param config - Config to validate
   * @returns Validation result
   */
  validateProductionBanConfig(config: SetProductionBanConfigParams): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (
      config.minimalExpectedPerformance !== undefined &&
      config.minimalExpectedPerformance !== null
    ) {
      if (
        config.minimalExpectedPerformance < 0 ||
        config.minimalExpectedPerformance > 100
      ) {
        errors.push("minimalExpectedPerformance must be between 0 and 100");
      }
    }

    if (
      config.underperformedSessionCountThreshold !== undefined &&
      config.underperformedSessionCountThreshold !== null
    ) {
      if (config.underperformedSessionCountThreshold <= 0) {
        errors.push("underperformedSessionCountThreshold must be positive");
      }
    }

    if (
      config.cleanSessionCounterDelay !== undefined &&
      config.cleanSessionCounterDelay !== null
    ) {
      if (config.cleanSessionCounterDelay <= 0) {
        errors.push("cleanSessionCounterDelay must be positive");
      }
    }

    if (config.banPeriod !== undefined && config.banPeriod !== null) {
      if (config.banPeriod <= 0) {
        errors.push("banPeriod must be positive");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate ban reason length
   * @param reason - Reason string
   * @returns Whether reason is valid
   */
  validateBanReason(reason: string): { valid: boolean; error?: string } {
    const bytes = this.stringToBytes(reason);
    if (bytes.length > 256) {
      return {
        valid: false,
        error: `Ban reason too long: ${bytes.length} bytes (max 256)`,
      };
    }
    return { valid: true };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Convert string to bytes array
   */
  private stringToBytes(str: string): number[] {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(str));
  }

  /**
   * Sign and send a transaction
   */
  private async signAndSend(
    tx: any,
    signer: Signer,
    signerAddress: string
  ): Promise<CommitteeManagementTxResult> {
    return new Promise((resolve) => {
      tx.signAndSend(
        signerAddress,
        { signer },
        ({ status, events, dispatchError }: any) => {
          if (status.isInBlock || status.isFinalized) {
            if (dispatchError) {
              let errorMessage = "Transaction failed";

              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(
                  dispatchError.asModule
                );
                errorMessage = `${decoded.section}.${
                  decoded.name
                }: ${decoded.docs.join(" ")}`;
              } else {
                errorMessage = dispatchError.toString();
              }

              resolve({
                success: false,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                error: errorMessage,
                events: events?.map((e: any) => e.toHuman()),
              });
            } else {
              resolve({
                success: true,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                events: events?.map((e: any) => e.toHuman()),
              });
            }
          }
        }
      ).catch((error: Error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }
}
